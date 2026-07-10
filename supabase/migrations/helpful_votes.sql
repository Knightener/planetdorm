-- Helpful upvotes for reviews.
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.

-- The reviews table was created without an id column; votes need a stable,
-- unique review identifier to reference. Existing rows are numbered
-- automatically when the column is added.
alter table reviews add column if not exists id bigint generated always as identity;

do $$ begin
  alter table reviews add constraint reviews_id_unique unique (id);
exception when duplicate_object or duplicate_table then null;
end $$;

-- Denormalized count so the site's existing `select *` from reviews picks it up.
alter table reviews add column if not exists helpful_count int not null default 0;

-- One row per (review, voter); the primary key is what prevents double-voting.
create table if not exists review_votes (
  review_id  bigint not null references reviews(id) on delete cascade,
  voter_hash text   not null,
  ip_hash    text   not null default '',
  created_at timestamptz not null default now(),
  primary key (review_id, voter_hash)
);

-- No anon/authenticated access at all: only the edge function's service-role
-- key can touch this table (service role bypasses RLS).
alter table review_votes enable row level security;

-- Keep reviews.helpful_count in sync automatically.
create or replace function bump_helpful() returns trigger
language plpgsql security definer as $$
begin
  update reviews set helpful_count = helpful_count + 1 where id = new.review_id;
  return new;
end $$;

drop trigger if exists on_helpful_vote on review_votes;
create trigger on_helpful_vote after insert on review_votes
for each row execute function bump_helpful();

-- Removing a vote decrements the count (clamped at 0 so it can't go negative).
create or replace function drop_helpful() returns trigger
language plpgsql security definer as $$
begin
  update reviews set helpful_count = greatest(helpful_count - 1, 0) where id = old.review_id;
  return old;
end $$;

drop trigger if exists on_helpful_unvote on review_votes;
create trigger on_helpful_unvote after delete on review_votes
for each row execute function drop_helpful();

-- Used by the vote-helpful edge function for per-IP rate limiting.
create index if not exists review_votes_ip_time_idx on review_votes (ip_hash, created_at);

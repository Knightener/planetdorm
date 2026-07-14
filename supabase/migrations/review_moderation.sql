-- Review moderation: new reviews are hidden until approved.
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
--
-- To approve a review afterwards: Table Editor -> reviews -> tick the
-- "approved" checkbox on the row. To reject one, just leave it unchecked
-- (or delete the row); it will never become public.

-- New rows default to unapproved; the submit-review function doesn't set it.
alter table reviews add column if not exists approved boolean not null default false;

-- Drop existing read policies first: the earlier status-based policy depends
-- on the status column and would block dropping it below.
do $$ declare p record; begin
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'reviews' and cmd = 'SELECT'
  loop
    execute format('drop policy %I on public.reviews', p.policyname);
  end loop;
end $$;

do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'reviews' and column_name = 'status'
  ) then
    -- An earlier version of this migration used a text status column;
    -- carry its state over and drop it.
    update reviews set approved = (status = 'approved');
    alter table reviews drop column status;
  else
    -- First run: everything posted before moderation existed stays public.
    update reviews set approved = true;
  end if;
end $$;

-- Only approved reviews are visible to the site (the edge functions use the
-- service role and are unaffected).
create policy "Anyone can read approved reviews"
  on public.reviews for select
  using (approved);

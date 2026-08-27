// The review list: filter chips, the cards themselves, the poster's own
// pending submissions, and helpful voting.
import { dorm, INITIAL_VISIBLE, PENDING_KEY, VOTE_URL, ANON_JWT } from './config.js';
import { escHtml, periodLabel, showToast } from './util.js';
import { state, helpfulVotes, helpfulOverrides, helpfulCount, saveVotes } from './state.js';
import { renderHeroQuote } from './header.js';

/* ------------------------------------------------------------------ *
 * Filters / sorting                                                  *
 * ------------------------------------------------------------------ */
function distinct(list, key) {
  return [...new Set(list.map(r => r[key]).filter(Boolean))];
}

function filteredReviews() {
  let out = state.reviews.filter(r =>
    (!state.filters.yearLived || r.year === state.filters.yearLived) &&
    (!state.filters.stars || r.rating === state.filters.stars)
  );
  if (state.filters.sort === 'helpful') {
    out = [...out].sort((a, b) =>
      helpfulCount(b) - helpfulCount(a) || new Date(b.created_at) - new Date(a.created_at));
  } else {
    out = [...out].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
  return out;
}

function menuHTML(id, items, selected, allLabel) {
  const rows = [`<button data-val="" class="${selected ? '' : 'selected'}">${allLabel}</button>`]
    .concat(items.map(v =>
      `<button data-val="${escHtml(v)}" class="${selected === v ? 'selected' : ''}">${escHtml(periodLabel(v) || v)}</button>`));
  return `<div class="td-menu" id="${id}">${rows.join('')}</div>`;
}

function starsMenuHTML() {
  const rows = [`<button data-val="" class="${state.filters.stars ? '' : 'selected'}">All ratings</button>`]
    .concat([5, 4, 3, 2, 1].map(n =>
      `<button data-val="${n}" class="${state.filters.stars === n ? 'selected' : ''}">${n} ★</button>`));
  return `<div class="td-menu" id="starsMenu">${rows.join('')}</div>`;
}

// Dropdown chips are <div>s, not <button>s: the menu itself contains buttons,
// and nested buttons are invalid HTML — the parser splits them apart.
export function renderFilters() {
  const years = distinct(state.reviews, 'year').sort().reverse();
  const row = document.getElementById('filterRow');
  row.innerHTML = `
    <button class="td-chip ${state.filters.sort === 'helpful' ? 'active' : ''}" data-act="sort-helpful">Most helpful</button>
    <button class="td-chip ${state.filters.sort === 'newest' ? 'active' : ''}" data-act="sort-newest">Newest</button>
    <div class="td-chip ${state.filters.yearLived ? 'active' : ''}" data-act="menu-year">${state.filters.yearLived ? escHtml(periodLabel(state.filters.yearLived)) : 'Year lived'} ▾${menuHTML('yearMenu', years, state.filters.yearLived, 'All years')}</div>
    <div class="td-chip ${state.filters.stars ? 'active' : ''}" data-act="menu-stars">${state.filters.stars ? `${state.filters.stars} ★` : 'Rating'} ▾${starsMenuHTML()}</div>`;

  row.querySelectorAll('.td-chip').forEach(chip => {
    chip.addEventListener('click', e => {
      const menuBtn = e.target.closest('.td-menu button');
      const act = chip.dataset.act;
      if (menuBtn) {
        const val = menuBtn.dataset.val || null;
        if (act === 'menu-year') state.filters.yearLived = val;
        if (act === 'menu-stars') state.filters.stars = val ? +val : 0;
        applyFilters();
        return;
      }
      if (act === 'sort-helpful' || act === 'sort-newest') {
        state.filters.sort = act === 'sort-helpful' ? 'helpful' : 'newest';
        applyFilters();
      } else {
        const menu = chip.querySelector('.td-menu');
        document.querySelectorAll('.td-menu.open').forEach(m => { if (m !== menu) m.classList.remove('open'); });
        menu.classList.toggle('open');
      }
    });
  });
}

function applyFilters() {
  state.visibleCount = INITIAL_VISIBLE;
  renderFilters();
  renderReviews();
}

/* ------------------------------------------------------------------ *
 * Review list                                                        *
 * ------------------------------------------------------------------ */
/* Own submissions awaiting approval. The server hides pending reviews from
 * everyone, so the poster's copy lives in localStorage and renders only in
 * this browser until the approved row shows up in a fetch. */
export function loadPendingStore() {
  const cutoff = Date.now() - 30 * 24 * 3600 * 1000; // assume rejected after 30 days
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]')
      .filter(p => p && p.id != null && new Date(p.created_at).getTime() > cutoff);
  } catch { return []; }
}

function myPendingReviews() {
  return loadPendingStore().filter(p =>
    p.dormId === dorm.id && !state.reviews.some(r => String(r.id) === String(p.id)));
}

// Once a pending review comes back from the server (approved), drop the local copy.
export function prunePendingStore() {
  localStorage.setItem(PENDING_KEY, JSON.stringify(
    loadPendingStore().filter(p =>
      p.dormId !== dorm.id || !state.reviews.some(r => String(r.id) === String(p.id)))));
}

function reviewCardHTML(r, i, isPending = false) {
  const name = r.name || 'Anonymous Terp';
  const initial = (name.trim()[0] || 'A').toUpperCase();
  const sub = [r.classYear, r.major].filter(Boolean).join(', ');
  const posted = r.created_at
    ? new Date(r.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : '';
  const metaBits = [
    r.year ? `Lived here ${periodLabel(r.year)}` : null,
    r.roomType || null,
    r.floor ? `${r.floor} floor` : null
  ].filter(Boolean).join(' · ');
  const tags = (r.tags || []).map(t =>
    `<span class="rev-tag ${t.s === 'neg' ? 'neg' : 'pos'}">${escHtml(t.t || t)}</span>`).join('');
  const voted = helpfulVotes.has(String(r.id));
  return `
    <div class="td-card${isPending ? ' pending' : ''}">
      <div class="rev-head">
        <div class="rev-avatar v${i % 3}">${escHtml(initial)}</div>
        <div class="rev-id">
          <div class="rev-name">${escHtml(name)}${sub ? ` <span class="sub">· ${escHtml(sub)}</span>` : ''}</div>
          <div class="rev-meta">${escHtml(metaBits)}</div>
        </div>
        <div class="rev-stars">${'★'.repeat(r.rating)}<span class="star-empty">${'★'.repeat(5 - r.rating)}</span></div>
      </div>
      <p class="rev-body">${escHtml(r.text)}</p>
      <div class="rev-foot">
        ${posted ? `<span class="rev-posted">Posted ${posted}</span>` : ''}
        ${tags}
        ${isPending
          ? '<span class="rev-tag pend" title="Visible only to you until it gets approved">Pending approval</span>'
          : `<button class="rev-helpful ${voted ? 'voted' : ''}" data-id="${escHtml(String(r.id))}" title="${voted ? 'Click to remove your helpful vote' : 'Mark this review helpful'}">👍 Helpful (${helpfulCount(r)})</button>`}
      </div>
    </div>`;
}

export function renderReviews() {
  const list = document.getElementById('reviewsList');
  const all = filteredReviews();
  const shown = all.slice(0, state.visibleCount);
  // The poster's own pending reviews always sit on top, unaffected by filters.
  const mine = myPendingReviews();

  list.innerHTML =
    mine.map(r => reviewCardHTML(r, 0, true)).join('') +
    (shown.length
      ? shown.map((r, i) => reviewCardHTML(r, i)).join('')
      : state.reviewsLoaded && !mine.length
        ? `<p class="td-empty">${state.reviews.length ? 'No reviews match these filters.' : 'No reviews yet!'}</p>`
        : '');

  const btn = document.getElementById('showAllBtn');
  btn.hidden = all.length <= state.visibleCount;
  btn.textContent = `Show all ${all.length} reviews`;

  list.querySelectorAll('.rev-helpful').forEach(b => {
    b.addEventListener('click', () => toggleHelpful(b.dataset.id));
  });

  renderHeroQuote();
}

// "Helpful" votes go through the vote-helpful edge function, which dedupes
// per voter server-side; localStorage mirrors voted state for instant UI.
function clientId() {
  let id = localStorage.getItem('td-client-id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('td-client-id', id);
  }
  return id;
}

// Click toggles the vote: add if not yet voted, remove if already voted.
async function toggleHelpful(id) {
  const key = String(id);
  const review = state.reviews.find(r => String(r.id) === key);
  if (!review) return;

  const wasVoted = helpfulVotes.has(key);
  const prevOverride = helpfulOverrides.get(key);
  const current = helpfulCount(review);
  const action = wasVoted ? 'remove' : 'add';

  // Optimistic: flip voted state and adjust the count immediately.
  if (wasVoted) helpfulVotes.delete(key); else helpfulVotes.add(key);
  helpfulOverrides.set(key, action === 'add' ? current + 1 : Math.max(current - 1, 0));
  saveVotes();
  renderReviews();

  const revert = () => {
    if (wasVoted) helpfulVotes.add(key); else helpfulVotes.delete(key);
    if (prevOverride === undefined) helpfulOverrides.delete(key);
    else helpfulOverrides.set(key, prevOverride);
    saveVotes();
    renderReviews();
  };

  let res, body;
  try {
    res = await fetch(VOTE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_JWT}` },
      body: JSON.stringify({ reviewId: review.id, clientId: clientId(), action })
    });
    body = await res.json().catch(() => ({}));
  } catch (err) {
    console.error('[vote-helpful] Network error:', err);
    res = null;
  }

  if (!res || !res.ok) {
    revert();
    showToast(res && res.status === 429
      ? 'Too many votes right now — try again later.'
      : 'Couldn’t update your vote. Please try again.', 'error');
    return;
  }

  // Reconcile with the authoritative count from the server.
  if (typeof body.helpful_count === 'number') {
    helpfulOverrides.set(key, body.helpful_count);
    renderReviews();
  }
}

// Close any open filter menu when the click lands outside a chip.
document.addEventListener('click', e => {
  if (!e.target.closest('.td-chip')) {
    document.querySelectorAll('.td-menu.open').forEach(m => m.classList.remove('open'));
  }
});

document.getElementById('showAllBtn').addEventListener('click', () => {
  state.visibleCount = Infinity;
  renderReviews();
});

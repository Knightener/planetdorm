// Shared mutable page state.
//
// The old inline module kept these as top-level `let`s that several sections
// reassigned. Across modules a reassigned `let` export can't be written by
// the importer, so the mutable fields live on one `state` object instead and
// every module mutates its properties.
import { dorm, INITIAL_VISIBLE } from './config.js';

export const state = {
  reviews: [],              // this dorm's reviews (Supabase)
  reviewsLoaded: false,     // suppresses the empty state until the first fetch settles
  filters: { sort: 'helpful', yearLived: null, stars: 0 },
  visibleCount: INITIAL_VISIBLE
};

export const helpfulVotes = new Set(JSON.parse(localStorage.getItem('td-helpful') || '[]'));

// Server-side counts (reviews.helpful_count) already include this user's past
// votes; overrides hold optimistic/confirmed counts for votes cast this visit.
export const helpfulOverrides = new Map();

export function helpfulCount(r) {
  return helpfulOverrides.get(String(r.id)) ?? r.helpful_count ?? 0;
}

export function saveVotes() {
  localStorage.setItem('td-helpful', JSON.stringify([...helpfulVotes]));
}

// Saved halls — shared with the index page's list via the same key.
const savedDorms = new Set(JSON.parse(localStorage.getItem('pd-saved') || '[]'));

export function toggleSaved() {
  if (savedDorms.has(dorm.id)) savedDorms.delete(dorm.id);
  else savedDorms.add(dorm.id);
  localStorage.setItem('pd-saved', JSON.stringify([...savedDorms]));
  updateSaveBtn();
}

export function updateSaveBtn() {
  const btn = document.getElementById('saveDormBtn');
  if (!btn) return;
  const on = savedDorms.has(dorm.id);
  btn.classList.toggle('saved', on);
  btn.setAttribute('aria-pressed', String(on));
  btn.querySelector('span').textContent = on ? 'Saved' : 'Save';
}

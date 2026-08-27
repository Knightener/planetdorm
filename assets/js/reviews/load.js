// Data loading. Real model: reviews live in Supabase; rating + count are
// always derived, never stored.
//
// Kept separate from the entry point so form.js can re-fetch after a
// submission without importing the boot sequence (which would cycle).
import { supabase } from '../supabase.js';
import { reportOutage } from '../outage.js';
import { dorm } from './config.js';
import { state } from './state.js';
import { renderHeader, renderBreakdown } from './header.js';
import { renderFilters, renderReviews, prunePendingStore } from './list.js';

export async function loadReviews() {
  let data, error;
  try {
    const query = supabase
      .from('reviews')
      .select('*')
      .eq('dormId', dorm.id)
      .order('created_at', { ascending: false });
    // Race against a timer — Supabase free-tier pauses hang indefinitely otherwise.
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000));
    ({ data, error } = await Promise.race([query, timeout]));
  } catch (e) {
    error = e;
  }

  state.reviewsLoaded = true;
  document.getElementById('reviewsLoading').classList.remove('visible');

  if (error || !data) {
    console.error('Error loading reviews:', error);
    document.getElementById('reviewsList').innerHTML =
      '<p class="td-empty">Couldn’t load reviews right now. Please try again later.</p>';
    reportOutage(loadReviews);
    return;
  }

  state.reviews = data;
  prunePendingStore();

  renderHeader();
  renderFilters();
  renderReviews();
  renderBreakdown();
}

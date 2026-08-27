// Entry point for dorm-reviews.html.
//
// Extracted from the page's inline <script type="module">. The sections it
// was divided into by comment banner now live under reviews/:
//
//   config.js    constants, DORM_META, the dorm resolved from ?dorm=
//   util.js      formatting helpers + toast (no page state)
//   state.js     shared mutable state (reviews, filters, votes, saved)
//   header.js    gallery, hero quote, title header, sidebar cards
//   list.js      filter chips, review cards, pending store, helpful votes
//   map.js       sidebar mini-map + walk times
//   form.js      write-a-review form
//   lightbox.js  photo viewer
//   load.js      Supabase fetch + re-render
//
// Modules with side effects (form, lightbox, nav-search, and the listeners
// at the bottom of list.js) register their handlers on import.
import { toggleSaved } from './reviews/state.js';
import { renderGallery, renderHeader, renderBreakdown, renderGlance } from './reviews/header.js';
import { renderFilters, renderReviews } from './reviews/list.js';
import { renderMapPreview, renderWalkTimes } from './reviews/map.js';
import { loadReviews } from './reviews/load.js';
import './reviews/form.js';
import './reviews/lightbox.js';
import './nav-search.js';

// The save button is rendered with an inline onclick; module functions
// aren't global, so expose it explicitly.
window.toggleSaved = toggleSaved;

renderGallery();
renderHeader();
renderFilters();
renderReviews();
renderBreakdown();
renderMapPreview();
renderWalkTimes();
renderGlance();
loadReviews();

import { supabase } from './supabase.js';
import { dorms } from './data.js';

function showMaintenanceOverlay() {
  hideReviewsLoading();
  const overlay = document.getElementById('maintenanceOverlay');
  if (overlay) overlay.style.display = 'flex';
}

function showReviewsLoading() {
  const el = document.getElementById('reviewsLoading');
  if (el) el.classList.add('visible');
}

function hideReviewsLoading() {
  const el = document.getElementById('reviewsLoading');
  if (el) el.classList.remove('visible');
}

async function loadAllReviews() {
  let data, error;
  try {
    const query = supabase
      .from('reviews')
      .select('dormId, name, rating, text, year, created_at')
      .order('created_at', { ascending: false });
    // Race the query against an 8 s timer - Supabase free-tier pauses hang indefinitely otherwise.
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 8000)
    );
    ({ data, error } = await Promise.race([query, timeout]));
  } catch (e) {
    console.error('Error loading reviews:', e);
    showMaintenanceOverlay();
    return;
  }

  if (error || !data) {
    console.error('Error loading reviews:', error);
    showMaintenanceOverlay();
    return;
  }

  // Reset all dorms so deleted reviews don't linger from the previous load.
  dorms.forEach(d => {
    d.reviewList = [];
    d.reviews = 0;
    d.rating = 0;
  });

  data.forEach(r => {
    const dorm = dorms.find(d => d.id === r.dormId);
    if (dorm) {
      dorm.reviewList.push({
        name: r.name || 'Anonymous Terp',
        date: r.year || 'Unknown',
        rating: r.rating,
        text: r.text,
        created_at: r.created_at
      });
    }
  });

  dorms.forEach(d => {
    if (d.reviewList.length > 0) {
      d.reviews = d.reviewList.length;
      d.rating = d.reviewList.reduce((sum, rev) => sum + rev.rating, 0) / d.reviews;
    }
  });

  hideReviewsLoading();
  if (currentSection === 'home') renderDorms('on');
  if (currentSection === 'offcampus') renderDorms('off');
  if (currentDorm) showDetail(currentDorm.id);
}

function setupReviewsListener() {
  supabase
    .channel('reviews')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'reviews' },
      loadAllReviews
    )
    .subscribe(status => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn('Realtime channel error:', status);
      }
    });
}

// Escape user-submitted text so it can't be interpreted as HTML (XSS).
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')   // & first, so the others aren't double-escaped
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

let campusFilters = new Set();
let roomTypeFilters = new Set();
let featureFilters = new Set();
let offCampusFilter = 'all';
let currentSection = 'home';
let currentDorm = null;
let selectedRating = 0;
let selectedYear = '';
let lightboxImages = [];
let lightboxIndex = 0;
// Two separate sort states so changing the sort on one grid doesn't affect the other.
let onCampusSort = 'default';
let offCampusSort = 'default';

// Color tier for a rating: 1-2 red, 3 orange, 4 gold, 5 diamond (averages round to nearest).
function ratingTier(rating) {
  const n = Math.round(rating);
  if (n <= 2) return 'rating-red';
  if (n === 3) return 'rating-orange';
  if (n === 4) return 'rating-gold';
  return 'rating-diamond';
}

function dormCardHTML(d) {
  return `
    <div class="dorm-card" onclick="showDetail('${d.id}')">
      <div class="dorm-card-img" style="${d.imgs[0] ? `background-image:url('${d.imgs[0]}')` : ''}"></div>
      <div class="dorm-card-body">
        <h3>${d.name}</h3>
        <div class="meta"><span>${d.type}</span><span class="badge-inline ${d.reviews === 0 ? 'no-reviews' : ratingTier(d.rating)}">${d.reviews === 0 ? '0 reviews' : `${d.rating.toFixed(1)} ★ · ${d.reviews} ${d.reviews === 1 ? 'review' : 'reviews'}`}</span></div>
        <div class="tag-row">${d.tags.map(t => `<span class="tag ${t.c}">${t.t}</span>`).join('')}</div>
      </div>
    </div>
  `;
}

function matchesSearch(d, q) {
  if (!q) return true;
  return d.name.toLowerCase().includes(q) ||
    d.area.toLowerCase().includes(q) ||
    (d.type && d.type.toLowerCase().includes(q)) ||
    (d.tags && d.tags.some(t => t.t.toLowerCase().includes(q)));
}

// Unreviewed dorms always sort to the bottom regardless of direction.
function applySorting(arr, sort) {
  if (sort === 'rating-desc') return [...arr].sort((a, b) => {
    if (a.reviews === 0 && b.reviews === 0) return 0;
    if (a.reviews === 0) return 1;
    if (b.reviews === 0) return -1;
    return b.rating - a.rating;
  });
  if (sort === 'rating-asc') return [...arr].sort((a, b) => {
    if (a.reviews === 0 && b.reviews === 0) return 0;
    if (a.reviews === 0) return 1;
    if (b.reviews === 0) return -1;
    return a.rating - b.rating;
  });
  return arr;
}

function passesRoomTypeFilter(d) {
  if (roomTypeFilters.size === 0) return true;
  if (roomTypeFilters.has('traditional') && d.type === 'Traditional') return true;
  if (roomTypeFilters.has('semi-suite') && d.type.includes('Semi-Suite')) return true;
  if (roomTypeFilters.has('suite') && d.type.includes('Suite') && !d.type.startsWith('Semi-Suite')) return true;
  if (roomTypeFilters.has('apartment') && d.type.includes('Apartment')) return true;
  return false;
}

function passesFeatureFilter(d) {
  if (featureFilters.has('ac') && !d.ac) return false;
  if (featureFilters.has('laundry') && !d.tags.some(t => t.t === 'In-hall Laundry')) return false;
  if (featureFilters.has('llp') && !d.tags.some(t => t.c === 'honors')) return false;
  return true;
}

function renderDorms(campus = 'on') {
  const sort = campus === 'on' ? onCampusSort : offCampusSort;
  const gridId = campus === 'on' ? 'dormGrid' : 'offCampusDormGrid';
  const q = document.getElementById('searchInput').value.toLowerCase();
  const filtered = dorms.filter(d => {
    if (d.campus !== campus) return false;
    if (!matchesSearch(d, q)) return false;
    if (campus === 'on') {
      return (campusFilters.size === 0 || campusFilters.has(d.area))
        && passesRoomTypeFilter(d)
        && passesFeatureFilter(d);
    }
    return offCampusFilter === 'all' || d.area === offCampusFilter;
  });
  document.getElementById(gridId).innerHTML = applySorting(filtered, sort).map(dormCardHTML).join('');
}

// campus is passed from the HTML onchange so each sort dropdown only affects its own grid.
function setSort(val, campus) {
  if (campus === 'off') offCampusSort = val;
  else onCampusSort = val;
  filterDorms();
}

function filterDorms() {
  renderDorms(currentSection === 'offcampus' ? 'off' : 'on');
}

function syncFilterBtnState() {
  const anyActive = campusFilters.size > 0 || roomTypeFilters.size > 0 || featureFilters.size > 0;
  document.getElementById('campusDropdownBtn').classList.toggle('active', anyActive);
  document.getElementById('dropdownAllBtn').classList.toggle('active', !anyActive);
}

function setAllFilter() {
  campusFilters.clear();
  roomTypeFilters.clear();
  featureFilters.clear();
  document.querySelectorAll('#campusDropdownPanel input[type="checkbox"]').forEach(cb => cb.checked = false);
  syncFilterBtnState();
  renderDorms('on');
}

function toggleCampusFilter(checkbox) {
  if (checkbox.checked) campusFilters.add(checkbox.value);
  else campusFilters.delete(checkbox.value);
  syncFilterBtnState();
  renderDorms('on');
}

function toggleRoomTypeFilter(checkbox) {
  if (checkbox.checked) roomTypeFilters.add(checkbox.value);
  else roomTypeFilters.delete(checkbox.value);
  syncFilterBtnState();
  renderDorms('on');
}

function toggleFeatureFilter(checkbox) {
  if (checkbox.checked) featureFilters.add(checkbox.value);
  else featureFilters.delete(checkbox.value);
  syncFilterBtnState();
  renderDorms('on');
}

function closeOtherDropdownPanels(exceptPanel) {
  document.querySelectorAll('.filter-dropdown-panel').forEach(p => {
    if (p !== exceptPanel) p.classList.remove('open');
  });
}

function toggleCampusDropdown() {
  const panel = document.getElementById('campusDropdownPanel');
  closeOtherDropdownPanels(panel);
  panel.classList.toggle('open');
}

const SORT_LABELS = {
  'default': 'Sort: Default',
  'rating-desc': 'Rating: High to Low',
  'rating-asc': 'Rating: Low to High'
};

function toggleSortDropdown(panelId) {
  const panel = document.getElementById(panelId);
  closeOtherDropdownPanels(panel);
  panel.classList.toggle('open');
}

function selectSort(btn, val, campus) {
  const panel = btn.closest('.filter-dropdown-panel');
  panel.querySelectorAll('.dropdown-all-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  panel.classList.remove('open');
  panel.previousElementSibling.textContent = SORT_LABELS[val];
  setSort(val, campus);
}

function setOffCampusFilter(f, btn) {
  offCampusFilter = f;
  document.querySelectorAll('#offCampusFilterBar button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderDorms('off');
}

function showDetail(id) {
  const d = dorms.find(x => x.id === id);
  if (!d) return;
  currentDorm = d;
  document.getElementById('heroSection').style.display = 'none';
  document.getElementById('section-' + currentSection).classList.remove('active');
  const sec = document.getElementById('section-detail');
  sec.classList.add('active');
  sec.style.display = 'block';

  const allReviews = d.reviewList;
  const imgsJson = JSON.stringify(d.imgs).replace(/"/g, '&quot;');

  document.getElementById('detailContent').innerHTML = `
    <div class="detail-header">
      <div class="detail-gallery">
        ${d.imgs.map((img, i) => `<img src="${img}" onclick="openLightbox(${imgsJson}, ${i})">`).join('')}
      </div>
      <div class="detail-info">
        <h2>${d.name}</h2>
        <div class="meta">${d.type} · Built ${d.built} · ${d.area.charAt(0).toUpperCase() + d.area.slice(1)} Campus</div>
        <div class="stat-grid">
          <div class="stat-box"><div class="label">Rating</div><div class="val${d.reviews > 0 ? ` ${ratingTier(d.rating)}` : ''}">${d.rating.toFixed(1)} <span style="font-size:.9rem">/ 5</span></div></div>
          <div class="stat-box"><div class="label">${d.reviews === 1 ? 'Review' : 'Reviews'}</div><div class="val">${d.reviews}</div></div>
          <div class="stat-box"><div class="label">Room Types</div><div class="val" style="font-size:1rem">${d.roomTypes}</div></div>
          ${d.tags && d.tags.length ? `<div class="stat-box"><div class="label">Features</div><div class="tag-row">${d.tags.map(t => `<span class="tag ${t.c}">${t.t}</span>`).join('')}</div></div>` : ''}
        </div>
        <button class="write-review-btn" onclick="openInlineForm()">Write a Review</button>
        ${d.imgs && d.imgs[0] ? (() => { const m = d.imgs[0].match(/\/([^/]+)-card\.[a-z]+/); return m ? `<a class="umd-link-btn" href="https://drf.umd.edu/facilities/residence-halls-communities/${m[1]}" target="_blank" rel="noopener">Official UMD page <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-left:2px"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>` : ''; })() : ''}
      </div>
    </div>
    ${d.lat && d.lng ? `<div class="detail-map-wrap"><div id="detailMapFrame"></div></div>` : ''}
    <h3 class="section-title">Reviews</h3>
    <div class="reviews-list" id="reviewsList">
      ${allReviews.length === 0 ? `<p class="no-reviews">No reviews yet :(</p>` : allReviews.map(r => `
        <div class="review-card">
          <div class="review-top">
            <span class="name">${escHtml(r.name)}</span>
            <span><span class="stars ${ratingTier(r.rating)}">${'★'.repeat(r.rating)}</span><span class="stars stars-empty">${'☆'.repeat(5 - r.rating)}</span> <span class="date">${escHtml(r.date)}</span></span>
          </div>
          <div class="review-body">${escHtml(r.text)}</div>
          ${r.created_at ? `<div class="review-posted">Posted: ${new Date(r.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>` : ''}
        </div>
      `).join('')}
    </div>
  `;

  if (d.lat && d.lng) {
    detailMap = L.map('detailMapFrame', CAMPUS_MAP_OPTIONS).setView([d.lat, d.lng], 16);
    addBaseTiles(detailMap);
    L.marker([d.lat, d.lng]).addTo(detailMap).bindPopup(d.name).openPopup();
    // Leaflet needs the container to be visible before it can measure its size.
    setTimeout(() => detailMap.invalidateSize(), 100);
  }
}

function backToList() {
  if (detailMap) {
    detailMap.remove();
    detailMap = null;
  }
  closeInlineForm();
  document.getElementById('section-detail').classList.remove('active');
  document.getElementById('section-detail').style.display = 'none';
  currentDorm = null;
  if (currentSection === 'map') {
    showSection('home');
  } else {
    document.getElementById('heroSection').style.display = '';
    document.getElementById('section-' + currentSection).classList.add('active');
  }
}

function showSection(name) {
  document.querySelectorAll('.nav-links button').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-section="${name}"]`).classList.add('active');
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById('section-detail').style.display = 'none';

  currentSection = name;
  if (name === 'home' || name === 'offcampus') {
    document.getElementById('heroSection').style.display = '';
    document.getElementById('section-' + name).classList.add('active');
    if (name === 'offcampus') renderDorms('off');
  } else {
    document.getElementById('heroSection').style.display = 'none';
    document.getElementById('section-' + name).classList.add('active');
  }
  document.getElementById('siteDisclaimer').style.display = name === 'map' ? 'none' : '';
  if (name === 'map') initMap();
}

let leafletMap = null;
let detailMap = null;

// Keep the viewport on and around UMD's campus.
const CAMPUS_BOUNDS = [[38.970, -76.975], [39.005, -76.915]];
const CAMPUS_MAP_OPTIONS = {
  maxBounds: CAMPUS_BOUNDS,
  maxBoundsViscosity: 1.0,
  minZoom: 14,
  maxZoom: 19
};

// One basemap for both themes; dark mode restyles the tiles with a CSS
// filter (see .leaflet-tile-pane in styles.css) so no labels are lost.
function addBaseTiles(map) {
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);
}

function initMap() {
  const onCampusDorms = dorms.filter(d => d.campus === 'on' && d.lat && d.lng);

  if (!leafletMap) {
    leafletMap = L.map('mapFrame', CAMPUS_MAP_OPTIONS).setView([38.9875, -76.9440], 14);
    addBaseTiles(leafletMap);
  } else {
    // Re-entering the map tab: clear old markers but keep the tile layer.
    leafletMap.eachLayer(layer => {
      if (layer instanceof L.Marker) leafletMap.removeLayer(layer);
    });
  }

  onCampusDorms.forEach(d => {
    const marker = L.marker([d.lat, d.lng]).addTo(leafletMap);
    marker.bindPopup(`
      <strong>${d.name}</strong><br>
      ${d.rating > 0 ? `<span class="${ratingTier(d.rating)}">${d.rating.toFixed(1)}★</span> · ` + d.reviews + ' review' + (d.reviews !== 1 ? 's' : '') : 'No reviews yet :('}<br>
      <a href="#" onclick="showDetail('${d.id}');return false;">View reviews</a>
    `);
  });

  // Same visibility-timing fix as the detail map.
  setTimeout(() => leafletMap.invalidateSize(), 100);
}

function openLightbox(imgs, idx) {
  lightboxImages = imgs;
  lightboxIndex = idx;
  document.getElementById('lightboxImg').src = imgs[idx];
  document.getElementById('lightbox').classList.add('active');
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('active');
}

function navLightbox(dir) {
  lightboxIndex = (lightboxIndex + dir + lightboxImages.length) % lightboxImages.length;
  document.getElementById('lightboxImg').src = lightboxImages[lightboxIndex];
}

function initYearPicker() {
  const now = new Date();
  // Academic year starts in August (month 7); before August the current year hasn't begun yet.
  const startYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  const picker = document.getElementById('yearPicker');
  picker.innerHTML = '';
  for (let y = startYear; y >= startYear - 10; y--) {
    const label = `${y}-${y + 1}`;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'year-btn';
    btn.textContent = label;
    btn.onclick = () => {
      selectedYear = label;
      picker.querySelectorAll('.year-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    };
    picker.appendChild(btn);
  }
}

function openInlineForm() {
  const form = document.getElementById('inlineReviewForm');
  form.style.display = 'block';
  selectedRating = 0;
  selectedYear = '';
  updateStars();
  initYearPicker();
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeInlineForm() {
  const form = document.getElementById('inlineReviewForm');
  form.style.display = 'none';
  document.getElementById('reviewName').value = '';
  document.getElementById('reviewText').value = '';
  document.getElementById('charCount').textContent = '0 / 2000';
  selectedRating = 0;
  selectedYear = '';
  // hcaptcha may not be loaded yet if the script is still fetching.
  if (typeof hcaptcha !== 'undefined') hcaptcha.reset();
}

function setRating(n) {
  selectedRating = n;
  updateStars();
}

function updateStars() {
  const input = document.getElementById('starInput');
  input.classList.remove('rating-red', 'rating-orange', 'rating-gold', 'rating-diamond');
  if (selectedRating > 0) input.classList.add(ratingTier(selectedRating));
  input.querySelectorAll('span').forEach((s, i) => s.classList.toggle('filled', i < selectedRating));
}

let _toastTimer = null;
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast toast-${type} show`;
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

async function submitReview() {
  const name = document.getElementById('reviewName').value.trim() || 'Anonymous Terp';
  const text = document.getElementById('reviewText').value.trim();
  const year = selectedYear;

  if (!year) {
    showToast('Please select the year you lived there.', 'error');
    return;
  }

  if (selectedRating === 0) {
    showToast('Please select a star rating before submitting.', 'error');
    return;
  }

  if (!text) {
    showToast('Please write something before submitting.', 'error');
    return;
  }

  // maxlength covers the inputs; the server enforces these limits too.
  if (name.length > 100) {
    showToast('Name is too long (max 100 characters).', 'error');
    return;
  }
  if (text.length > 2000) {
    showToast('Review is too long (max 2000 characters).', 'error');
    return;
  }

  const captchaToken = typeof hcaptcha !== 'undefined' ? hcaptcha.getResponse() : '';
  if (!captchaToken) {
    showToast('Please complete the captcha before submitting.', 'error');
    return;
  }

  let res;
  try {
    res = await fetch('https://qqbfiwixlqsnjsmwirtf.supabase.co/functions/v1/submit-review', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Supabase requires a JWT on Edge Function calls; the anon key is public anyway.
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxYmZpd2l4bHFzbmpzbXdpcnRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5Mjc2OTEsImV4cCI6MjA5MTUwMzY5MX0.Qy2_QBt4l2uRPiLQIKAaao4gNwZf0bkniUob9EtBXMY',
      },
      body: JSON.stringify({
        dormId: currentDorm.id,
        name,
        rating: selectedRating,
        text,
        year,
        captchaToken,
      }),
    });
  } catch (err) {
    console.error('[submit-review] Network error:', err);
    showToast('Network error. Please try again.', 'error');
    return;
  }

  if (res.ok) {
    closeInlineForm();
    showToast('Review submitted successfully! Thanks for contributing.', 'success');
  } else {
    const body = await res.json().catch(() => ({}));
    console.error('[submit-review] Failed:', res.status, body);
    showToast(body.error || 'Failed to submit review. Please try again later.', 'error');
  }
}


function closeNav() {
  document.getElementById('navLinks').classList.remove('open');
  document.getElementById('navToggle').classList.remove('open');
}

// Expose handlers for the inline onclick attributes (ES module scope isn't global).
window.closeNav = closeNav;
window.showDetail = showDetail;
window.filterDorms = filterDorms;
window.setAllFilter = setAllFilter;
window.toggleCampusFilter = toggleCampusFilter;
window.toggleRoomTypeFilter = toggleRoomTypeFilter;
window.toggleFeatureFilter = toggleFeatureFilter;
window.toggleCampusDropdown = toggleCampusDropdown;
window.toggleSortDropdown = toggleSortDropdown;
window.selectSort = selectSort;
window.setOffCampusFilter = setOffCampusFilter;
window.openInlineForm = openInlineForm;
window.closeInlineForm = closeInlineForm;
window.setRating = setRating;
window.submitReview = submitReview;
window.backToList = backToList;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.navLightbox = navLightbox;
window.showSection = showSection;
window.setSort = setSort;

document.addEventListener('click', e => {
  document.querySelectorAll('.filter-dropdown').forEach(dropdown => {
    if (!dropdown.contains(e.target)) {
      dropdown.querySelector('.filter-dropdown-panel')?.classList.remove('open');
    }
  });
});

function startPlaceholderTypewriter() {
  const el = document.getElementById('searchInput');
  const phrases = ['Search dorms...', 'Find the perfect dorm...', 'Search by area...', 'Find your next home...'];
  let i = 0, j = 0, del = false, pause = 0;

  setInterval(() => {
    // Don't animate while the user is typing or has typed something.
    if (document.activeElement === el || el.value) return;
    if (pause-- > 0) return;
    del ? j-- : j++;
    el.placeholder = phrases[i].slice(0, j);
    if (!del && j === phrases[i].length) { del = true; pause = 18; }
    if (del && j === 0) { del = false; i = (i + 1) % phrases.length; pause = 4; }
  }, 100);
}

document.addEventListener('DOMContentLoaded', () => {
  // Pre-initialize reviewList so showDetail never throws if reviews haven't loaded yet.
  dorms.forEach(d => { d.reviewList = []; });
  renderDorms('on');
  showReviewsLoading();
  loadAllReviews();
  setupReviewsListener();
  startPlaceholderTypewriter();
  document.getElementById('reviewText').addEventListener('input', function () {
    document.getElementById('charCount').textContent = `${this.value.length} / 2000`;
  });
});



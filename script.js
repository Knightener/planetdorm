import { supabase } from './supabase.js';
import { dorms } from './data.js';

const SITEKEY = '48ce88c8-9f00-47ee-a3f6-900c5abe7686';
// Supabase requires a JWT on Edge Function calls; the anon key is public anyway.
const ANON_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxYmZpd2l4bHFzbmpzbXdpcnRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5Mjc2OTEsImV4cCI6MjA5MTUwMzY5MX0.Qy2_QBt4l2uRPiLQIKAaao4gNwZf0bkniUob9EtBXMY';
const SUBMIT_URL = 'https://qqbfiwixlqsnjsmwirtf.supabase.co/functions/v1/submit-review';

/* ------------------------------------------------------------------ *
 * Reviews loading (real data model — Supabase + realtime)            *
 * ------------------------------------------------------------------ */
function showMaintenanceOverlay() {
  hideReviewsLoading();
  const overlay = document.getElementById('maintenanceOverlay');
  if (overlay) overlay.style.display = 'flex';
}

function showReviewsLoading() {
  document.getElementById('reviewsLoading')?.classList.add('visible');
}

function hideReviewsLoading() {
  document.getElementById('reviewsLoading')?.classList.remove('visible');
}

async function loadAllReviews() {
  let data, error;
  try {
    const query = supabase
      .from('reviews')
      .select('dormId, name, rating, text, year, created_at')
      .order('created_at', { ascending: false });
    // Race the query against an 8 s timer — Supabase free-tier pauses hang indefinitely otherwise.
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000));
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
  dorms.forEach(d => { d.reviewList = []; d.reviews = 0; d.rating = 0; });

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
  if (currentSection === 'home') renderDorms();
  if (currentDorm) renderDetailDynamic();
}

function setupReviewsListener() {
  supabase
    .channel('reviews')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, loadAllReviews)
    .subscribe(status => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn('Realtime channel error:', status);
      }
    });
}

// Escape user-submitted text so it can't be interpreted as HTML (XSS).
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ------------------------------------------------------------------ *
 * State                                                              *
 * ------------------------------------------------------------------ */
let campusFilters = new Set();
let roomTypeFilters = new Set();
let featureFilters = new Set();
let onCampusSort = 'default';
let reviewSort = 'newest';
let currentSection = 'home';
let currentDorm = null;

// Quick-post strip state (persists across dynamic re-renders).
let quickRating = 0;
let quickYear = '';
// Full-form state.
let formRating = 0;
let formYear = '';
let formCaptchaId = null;

/* ------------------------------------------------------------------ *
 * Rating helpers                                                     *
 * ------------------------------------------------------------------ */
// Tier by rounded rating: ≤2 red, 3 orange, 4 gold, 5 platinum.
function tierClass(rating) {
  const n = Math.round(rating);
  if (n <= 2) return 'rating-red';
  if (n === 3) return 'rating-orange';
  if (n === 4) return 'rating-gold';
  return 'rating-plat';
}

function areaLabel(area) {
  if (area === 'north') return 'North Campus';
  if (area === 'south') return 'South Campus';
  if (area === 'commons') return 'The Commons';
  return area;
}

function reviewWord(n) { return `${n} ${n === 1 ? 'review' : 'reviews'}`; }

/* ------------------------------------------------------------------ *
 * Home — directory list                                              *
 * ------------------------------------------------------------------ */
function matchesSearch(d, q) {
  if (!q) return true;
  return d.name.toLowerCase().includes(q) ||
    d.area.toLowerCase().includes(q) ||
    (d.type && d.type.toLowerCase().includes(q)) ||
    (d.tags && d.tags.some(t => t.t.toLowerCase().includes(q)));
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

function passesFilters(d) {
  const q = document.getElementById('searchInput').value.toLowerCase();
  if (!matchesSearch(d, q)) return false;
  if (campusFilters.size && !campusFilters.has(d.area)) return false;
  if (!passesRoomTypeFilter(d)) return false;
  if (!passesFeatureFilter(d)) return false;
  return true;
}

// Zero-review halls always sink to the bottom of rating sorts.
function applySorting(arr) {
  if (onCampusSort === 'default') return arr;
  return [...arr].sort((a, b) => {
    if (a.reviews === 0 && b.reviews === 0) return 0;
    if (a.reviews === 0) return 1;
    if (b.reviews === 0) return -1;
    return onCampusSort === 'rating-desc' ? b.rating - a.rating : a.rating - b.rating;
  });
}

function dormRowHTML(d) {
  const none = d.reviews === 0;
  const tagStr = d.tags.map(t => t.t).join(' · ');
  const meta = `${d.type} · ${areaLabel(d.area)}${tagStr ? ' · ' + tagStr : ''}`;
  const ratingHtml = none
    ? '<span class="rating-dim">—</span>'
    : `<span class="${tierClass(d.rating)}">${d.rating.toFixed(1)} ★</span>`;
  const cnt = none ? 'No reviews' : reviewWord(d.reviews);
  return `
    <div class="dorm-row" onclick="showDetail('${d.id}')">
      <div class="thumb" style="${d.imgs[0] ? `background-image:url('${d.imgs[0]}')` : ''}"></div>
      <div class="row-body">
        <h3>${escHtml(d.name)}</h3>
        <div class="row-meta">${escHtml(meta)}</div>
      </div>
      <div class="row-rating">
        <div class="num">${ratingHtml}</div>
        <div class="cnt">${cnt}</div>
      </div>
    </div>`;
}

function renderDorms() {
  const onCampus = dorms.filter(d => d.campus === 'on');
  const filtered = applySorting(onCampus.filter(passesFilters));
  const grid = document.getElementById('dormGrid');
  grid.innerHTML = filtered.length
    ? filtered.map(dormRowHTML).join('')
    : '<p class="no-results">No halls match your filters.</p>';
  document.getElementById('countLabel').textContent =
    `${filtered.length} ${filtered.length === 1 ? 'hall' : 'halls'}`;
}

function filterDorms() { renderDorms(); }

function toggleChip(btn) {
  const set = { campus: campusFilters, room: roomTypeFilters, feature: featureFilters }[btn.dataset.group];
  const v = btn.dataset.value;
  if (set.has(v)) { set.delete(v); btn.classList.remove('active'); }
  else { set.add(v); btn.classList.add('active'); }
  updateClearAll();
  renderDorms();
}

function updateClearAll() {
  const any = campusFilters.size || roomTypeFilters.size || featureFilters.size;
  document.getElementById('clearAllBtn').hidden = !any;
}

function setAllFilter() {
  campusFilters.clear();
  roomTypeFilters.clear();
  featureFilters.clear();
  document.querySelectorAll('.filter-band .chip.active').forEach(c => c.classList.remove('active'));
  updateClearAll();
  renderDorms();
}

function selectSort(val) {
  onCampusSort = val;
  document.querySelectorAll('.sort-opt').forEach(b => b.classList.toggle('active', b.dataset.sort === val));
  renderDorms();
}

/* ------------------------------------------------------------------ *
 * Detail view                                                        *
 * ------------------------------------------------------------------ */
function academicYears(count) {
  const now = new Date();
  // Academic year starts in August (month 7).
  const startYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  const arr = [];
  for (let y = startYear; y > startYear - count; y--) arr.push(`${y}-${y + 1}`);
  return arr;
}

function ratingBoxHTML(d) {
  const none = d.reviews === 0;
  const tc = none ? 'rating-dim' : tierClass(d.rating);
  const num = none ? '–' : d.rating.toFixed(1);
  const full = Math.round(d.rating);
  return `
    <span class="big ${tc}">${num}</span>
    <div>
      <div><span class="stars ${tc}">${'★'.repeat(full)}</span><span class="stars stars-empty">${'☆'.repeat(5 - full)}</span></div>
      <div class="count">${reviewWord(d.reviews)}</div>
    </div>`;
}

function histHTML(d) {
  const total = d.reviewList.length;
  return [5, 4, 3, 2, 1].map(n => {
    const c = d.reviewList.filter(r => r.rating === n).length;
    const pct = total ? (c / total * 100).toFixed(0) + '%' : '0%';
    return `
      <div class="hist-row">
        <span class="h-label">${n}</span>
        <div class="h-track"><div class="h-fill" style="width:${pct}"></div></div>
        <span class="h-count">${c}</span>
      </div>`;
  }).join('');
}

function checklistHTML(d) {
  const row = (label, value, color) =>
    `<div class="checklist-row"><span class="c-label">${escHtml(label)}</span><span class="c-value" style="color:${color}">${escHtml(value)}</span></div>`;
  const hasTag = n => d.tags.some(t => t.t === n);
  const laundry = hasTag('In-hall Laundry');
  const rows = [
    row('A/C', d.ac ? '✓' : '✕', d.ac ? 'var(--green)' : 'var(--red)'),
    row('In-hall laundry', laundry ? '✓' : '✕', laundry ? 'var(--green)' : 'var(--red)')
  ];
  d.tags.filter(t => t.t !== 'A/C' && t.t !== 'In-hall Laundry')
    .forEach(t => rows.push(row(t.t, '✓', 'var(--green)')));
  rows.push(row('Rooms', d.roomTypes, 'var(--dim)'));
  rows.push(row('Dining', (d.dining || '—').replace(' Dining Hall', ''), 'var(--dim)'));
  rows.push(row('Built', String(d.built), 'var(--dim)'));
  return rows.join('');
}

function reviewsListHTML(d) {
  const sorted = [...d.reviewList].sort((a, b) => {
    if (reviewSort === 'highest') return b.rating - a.rating;
    if (reviewSort === 'lowest') return a.rating - b.rating;
    return new Date(b.created_at) - new Date(a.created_at);
  });
  if (!sorted.length) return '<p class="no-reviews">No reviews yet :( — be the first to write one.</p>';
  return sorted.map(r => {
    const tc = tierClass(r.rating);
    const initial = (r.name.trim()[0] || 'A').toUpperCase();
    const avBg = r.name.toLowerCase().startsWith('anonymous') ? 'var(--dim)' : 'var(--red)';
    const posted = r.created_at
      ? new Date(r.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      : '';
    return `
      <div class="review-row">
        <div class="avatar" style="background:${avBg}">${escHtml(initial)}</div>
        <div class="rev-content">
          <div class="rev-top">
            <span class="rev-name">${escHtml(r.name)}</span>
            <span class="rev-stars"><span class="${tc}">${'★'.repeat(r.rating)}</span><span class="stars-empty">${'☆'.repeat(5 - r.rating)}</span></span>
            <span class="rev-date">${escHtml(r.date)}${posted ? ' · ' + posted : ''}</span>
          </div>
          <p class="rev-body">${escHtml(r.text)}</p>
        </div>
      </div>`;
  }).join('');
}

function quickStarsHTML() {
  const tc = tierClass(quickRating);
  return [1, 2, 3, 4, 5].map(n =>
    `<span class="${n <= quickRating ? tc : ''}" onclick="quickSetRating(${n})">★</span>`
  ).join('');
}

function quickYearsHTML() {
  return academicYears(4).map(y =>
    `<button type="button" class="year-chip ${quickYear === y ? 'active' : ''}" onclick="quickSetYear('${y}')">${y}</button>`
  ).join('');
}

// Hall pages now use the TerpDorms-style reviews page (dorm-reviews.html);
// the in-SPA detail view below is retired but kept for reference.
function showDetail(id) {
  location.href = `dorm-reviews.html?dorm=${encodeURIComponent(id)}`;
}

function showDetailLegacy(id) {
  const d = dorms.find(x => x.id === id);
  if (!d) return;
  currentDorm = d;
  // Reset quick-post + form state for a fresh dorm.
  quickRating = 0; quickYear = '';
  formRating = 0; formYear = ''; formCaptchaId = null;

  document.getElementById('heroSection').style.display = 'none';
  document.getElementById('section-' + currentSection).classList.remove('active');
  const sec = document.getElementById('section-detail');
  sec.classList.add('active');

  const m = (d.imgs[0] || '').match(/\/([^/]+)-card\.[a-z]+/);
  const umd = m ? `https://drf.umd.edu/facilities/residence-halls-communities/${m[1]}` : '';

  document.getElementById('detailContent').innerHTML = `
    <button class="detail-back" onclick="backToList()">All halls</button>
    <div class="detail-grid">
      <div class="detail-rail">
        <div class="rail-photo" style="${d.imgs[0] ? `background-image:url('${d.imgs[0]}')` : ''}" onclick="openLightbox('${(d.imgs[0] || '').replace(/'/g, "\\'")}')"></div>
        <h2 class="rail-name">${escHtml(d.name)}</h2>
        <div class="rail-meta">${escHtml(d.type)} · Built ${escHtml(String(d.built))} · ${escHtml(areaLabel(d.area))}</div>
        ${d.lat && d.lng ? '<div class="rail-map"><div id="detailMapFrame"></div></div>' : ''}
        <div id="ratingBox" class="rating-box"></div>
        <div id="histBox" class="hist"></div>
        <div class="checklist">${checklistHTML(d)}</div>
        <button class="write-review-btn" onclick="openForm()">Write a review</button>
        ${umd ? `<div class="umd-link-wrap"><a class="umd-link" href="${umd}" target="_blank" rel="noopener">Official UMD page ↗</a></div>` : ''}
      </div>
      <div class="detail-main">
        <div class="quick-strip">
          <div class="quick-strip-row">
            <div class="star-picker" id="quickStars">${quickStarsHTML()}</div>
            <div class="year-chips" id="quickYears">${quickYearsHTML()}</div>
            <input type="text" id="quickText" class="quick-input" maxlength="2000" placeholder="Quick review — what's the one thing to know?">
            <button class="quick-post-btn" onclick="quickSubmit()">Post</button>
          </div>
          <div class="quick-caption">Posting as <strong>Anonymous Terp</strong> · for a named review use "Write a review"</div>
        </div>
        <div class="reviews-head">
          <h3 id="reviewCountHead">${reviewWord(d.reviews)}</h3>
          <div class="rev-sort">
            <button class="${reviewSort === 'newest' ? 'active' : ''}" onclick="setReviewSort('newest')">Newest</button>
            <button class="${reviewSort === 'highest' ? 'active' : ''}" onclick="setReviewSort('highest')">Highest</button>
            <button class="${reviewSort === 'lowest' ? 'active' : ''}" onclick="setReviewSort('lowest')">Lowest</button>
          </div>
        </div>
        <div id="reviewsList" class="reviews-list"></div>
        <div id="fullFormWrap"></div>
      </div>
    </div>`;

  renderDetailDynamic();
  window.scrollTo(0, 0);

  if (d.lat && d.lng) {
    detailMap = createCampusMap('detailMapFrame', [d.lng, d.lat], 15.5);
    detailMap.on('load', () => {
      new maplibregl.Marker({ color: '#E21833' })
        .setLngLat([d.lng, d.lat])
        .addTo(detailMap);
    });
    setTimeout(() => detailMap.resize(), 120);
  }
}

// Re-render only the parts that depend on the (live) review data.
function renderDetailDynamic() {
  if (!currentDorm) return;
  const d = currentDorm;
  const rb = document.getElementById('ratingBox');
  const hb = document.getElementById('histBox');
  const rc = document.getElementById('reviewCountHead');
  const rl = document.getElementById('reviewsList');
  if (rb) rb.innerHTML = ratingBoxHTML(d);
  if (hb) hb.innerHTML = histHTML(d);
  if (rc) rc.textContent = reviewWord(d.reviews);
  if (rl) rl.innerHTML = reviewsListHTML(d);
}

function setReviewSort(val) {
  reviewSort = val;
  document.querySelectorAll('.rev-sort button').forEach(b =>
    b.classList.toggle('active', b.textContent.toLowerCase() === val));
  const rl = document.getElementById('reviewsList');
  if (rl && currentDorm) rl.innerHTML = reviewsListHTML(currentDorm);
}

function backToList() {
  if (detailMap) { detailMap.remove(); detailMap = null; }
  document.getElementById('section-detail').classList.remove('active');
  currentDorm = null;
  if (currentSection === 'map') {
    showSection('home');
  } else {
    document.getElementById('heroSection').style.display = '';
    document.getElementById('section-' + currentSection).classList.add('active');
  }
}

/* ------------------------------------------------------------------ *
 * Quick-post strip                                                   *
 * ------------------------------------------------------------------ */
function quickSetRating(n) {
  quickRating = n;
  document.getElementById('quickStars').innerHTML = quickStarsHTML();
}

function quickSetYear(y) {
  quickYear = y;
  document.getElementById('quickYears').innerHTML = quickYearsHTML();
}

async function quickSubmit() {
  const text = document.getElementById('quickText').value.trim();
  if (quickRating === 0) return showToast('Please select a star rating.', 'error');
  if (!quickYear) return showToast('Please select the year you lived there.', 'error');
  if (!text) return showToast('Please write something before posting.', 'error');

  let token;
  try {
    token = await getInvisibleCaptchaToken();
  } catch (e) {
    console.error('[quick-post] captcha error:', e);
    return showToast('Could not verify you’re human. Please try again.', 'error');
  }

  const ok = await postReview({
    dormId: currentDorm.id,
    name: 'Anonymous Terp',
    rating: quickRating,
    text,
    year: quickYear,
    captchaToken: token
  });

  if (ok) {
    quickRating = 0; quickYear = '';
    document.getElementById('quickStars').innerHTML = quickStarsHTML();
    document.getElementById('quickYears').innerHTML = quickYearsHTML();
    document.getElementById('quickText').value = '';
    showToast('Review posted! Thanks for contributing.', 'success');
  }
}

/* ------------------------------------------------------------------ *
 * Full review form                                                   *
 * ------------------------------------------------------------------ */
function formStarsHTML() {
  const tc = tierClass(formRating);
  return [1, 2, 3, 4, 5].map(n =>
    `<span class="${n <= formRating ? tc : ''}" onclick="formSetRating(${n})">★</span>`
  ).join('');
}

function formYearsHTML() {
  return academicYears(11).map(y =>
    `<button type="button" class="${formYear === y ? 'active' : ''}" onclick="formSetYear('${y}')">${y}</button>`
  ).join('');
}

function openForm() {
  formRating = 0; formYear = '';
  const wrap = document.getElementById('fullFormWrap');
  wrap.innerHTML = `
    <div class="full-form">
      <h3>Write a review</h3>
      <label class="form-label" for="formName">Your name</label>
      <input type="text" id="formName" placeholder="Anonymous Terp" maxlength="100">
      <p class="form-label">Rating</p>
      <div class="form-star-picker" id="formStars">${formStarsHTML()}</div>
      <p class="form-label">Year lived there</p>
      <div class="year-grid" id="formYears">${formYearsHTML()}</div>
      <label class="form-label" for="formText">Your review</label>
      <textarea id="formText" placeholder="What was your experience like?" maxlength="2000"></textarea>
      <span class="char-count" id="charCount">0 / 2000</span>
      <div class="captcha-wrap"><div id="formCaptcha"></div></div>
      <div class="form-btn-row">
        <button class="cancel-btn" onclick="closeForm()">Cancel</button>
        <button class="submit-btn" onclick="submitReview()">Submit review</button>
      </div>
    </div>`;

  document.getElementById('formText').addEventListener('input', function () {
    document.getElementById('charCount').textContent = `${this.value.length} / 2000`;
  });

  if (typeof hcaptcha !== 'undefined') {
    formCaptchaId = hcaptcha.render('formCaptcha', {
      sitekey: SITEKEY,
      theme: document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
    });
  }

  wrap.querySelector('.full-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeForm() {
  formRating = 0; formYear = ''; formCaptchaId = null;
  document.getElementById('fullFormWrap').innerHTML = '';
}

function formSetRating(n) {
  formRating = n;
  document.getElementById('formStars').innerHTML = formStarsHTML();
}

function formSetYear(y) {
  formYear = y;
  document.getElementById('formYears').innerHTML = formYearsHTML();
}

async function submitReview() {
  const name = document.getElementById('formName').value.trim() || 'Anonymous Terp';
  const text = document.getElementById('formText').value.trim();

  if (!formYear) return showToast('Please select the year you lived there.', 'error');
  if (formRating === 0) return showToast('Please select a star rating before submitting.', 'error');
  if (!text) return showToast('Please write something before submitting.', 'error');
  if (name.length > 100) return showToast('Name is too long (max 100 characters).', 'error');
  if (text.length > 2000) return showToast('Review is too long (max 2000 characters).', 'error');

  const captchaToken = (typeof hcaptcha !== 'undefined' && formCaptchaId !== null)
    ? hcaptcha.getResponse(formCaptchaId) : '';
  if (!captchaToken) return showToast('Please complete the captcha before submitting.', 'error');

  const ok = await postReview({
    dormId: currentDorm.id, name, rating: formRating, text, year: formYear, captchaToken
  });

  if (ok) {
    closeForm();
    showToast('Review submitted successfully! Thanks for contributing.', 'success');
  }
}

// Shared POST to the Supabase edge function. Returns true on success.
async function postReview(payload) {
  let res;
  try {
    res = await fetch(SUBMIT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_JWT}` },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error('[submit-review] Network error:', err);
    showToast('Network error. Please try again.', 'error');
    return false;
  }
  if (res.ok) return true;
  const body = await res.json().catch(() => ({}));
  console.error('[submit-review] Failed:', res.status, body);
  showToast(body.error || 'Failed to submit review. Please try again later.', 'error');
  return false;
}

/* ------------------------------------------------------------------ *
 * Invisible hCaptcha for the quick-post strip                        *
 * ------------------------------------------------------------------ */
let _invisibleId = null;
let _invisibleResolve = null;
let _invisibleReject = null;

function getInvisibleCaptchaToken() {
  return new Promise((resolve, reject) => {
    if (typeof hcaptcha === 'undefined') return reject(new Error('hcaptcha-unavailable'));
    if (_invisibleId === null) {
      _invisibleId = hcaptcha.render('quickCaptcha', {
        sitekey: SITEKEY,
        size: 'invisible',
        callback: tok => { const r = _invisibleResolve; _invisibleResolve = _invisibleReject = null; r && r(tok); },
        'error-callback': () => { const r = _invisibleReject; _invisibleResolve = _invisibleReject = null; r && r(new Error('captcha-error')); },
        'expired-callback': () => { const r = _invisibleReject; _invisibleResolve = _invisibleReject = null; r && r(new Error('captcha-expired')); }
      });
    } else {
      hcaptcha.reset(_invisibleId);
    }
    _invisibleResolve = resolve;
    _invisibleReject = reject;
    try { hcaptcha.execute(_invisibleId); } catch (e) { _invisibleResolve = _invisibleReject = null; reject(e); }
  });
}

/* ------------------------------------------------------------------ *
 * Section routing                                                    *
 * ------------------------------------------------------------------ */
function showSection(name) {
  document.querySelectorAll('.nav-links button[data-section]').forEach(b =>
    b.classList.toggle('active', b.dataset.section === name));
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  if (detailMap) { detailMap.remove(); detailMap = null; }
  currentDorm = null;

  currentSection = name;
  if (name === 'home') {
    document.getElementById('heroSection').style.display = '';
    document.getElementById('section-home').classList.add('active');
  } else {
    document.getElementById('heroSection').style.display = 'none';
    document.getElementById('section-' + name).classList.add('active');
  }
  document.getElementById('siteDisclaimer').style.display = name === 'map' ? 'none' : '';
  if (name === 'map') initMap();
}

/* ------------------------------------------------------------------ *
 * Map (real MapLibre map)                                            *
 * ------------------------------------------------------------------ */
let campusMap = null;
let detailMap = null;
let campusMarkerById = {};
let mapDorms = [];
let mapCampusFilter = 'all';

const CAMPUS_BOUNDS = [[-76.975, 38.970], [-76.915, 39.005]];

function mapStyleUrl() { return 'https://tiles.openfreemap.org/styles/liberty'; }

function isDarkTheme() { return document.documentElement.dataset.theme === 'dark'; }

function applyDarkTheme(map) {
  const set = (id, prop, val) => { try { map.setPaintProperty(id, prop, val); } catch (e) {} };
  for (const layer of map.getStyle().layers) {
    const id = layer.id;
    switch (layer.type) {
      case 'background': set(id, 'background-color', '#0f1116'); break;
      case 'raster': set(id, 'raster-opacity', 0); break;
      case 'fill':
        if (/wood|grass|park|forest/.test(id)) { set(id, 'fill-color', '#16311f'); set(id, 'fill-opacity', 0.55); }
        else if (id === 'water') set(id, 'fill-color', '#16203c');
        else if (id === 'building') set(id, 'fill-color', '#191c24');
        else set(id, 'fill-color', '#14161c');
        break;
      case 'fill-extrusion':
        set(id, 'fill-extrusion-color', '#232733');
        set(id, 'fill-extrusion-opacity', 0.92);
        break;
      case 'line':
        if (/waterway/.test(id)) set(id, 'line-color', '#22304f');
        else if (/rail/.test(id)) set(id, 'line-color', '#2b2f39');
        else if (/casing/.test(id)) set(id, 'line-color', '#0d0f14');
        else if (/motorway/.test(id)) set(id, 'line-color', '#5c5138');
        else if (/boundary/.test(id)) set(id, 'line-color', '#3a3e48');
        else if (/park_outline/.test(id)) set(id, 'line-color', '#1f3a28');
        else set(id, 'line-color', '#3a3f4b');
        break;
      case 'symbol':
        set(id, 'text-color', /water_name|waterway/.test(id) ? '#8098d0' : '#c7ccd6');
        set(id, 'text-halo-color', '#0b0d11');
        set(id, 'text-halo-width', 1.2);
        break;
    }
  }
}

function applyMapTheme(map) { if (isDarkTheme()) applyDarkTheme(map); }

// Robustly (re)apply the current theme after a style loads. 'style.load' is the
// primary signal (fires on the initial style and after every setStyle), but it
// is occasionally missed — which left the map on its light base while the rest
// of the site was dark. 'styledata' + isStyleLoaded() is the fallback, and
// 'styledataloading' rearms the guard whenever a new style starts loading.
function hookMapTheme(map) {
  let applied = false;
  const apply = () => { applied = true; applyMapTheme(map); };
  map.on('styledataloading', () => { applied = false; });
  map.on('style.load', apply);
  map.on('styledata', () => { if (!applied && map.isStyleLoaded()) apply(); });
}

function createCampusMap(container, center, zoom) {
  const map = new maplibregl.Map({
    container, style: mapStyleUrl(), center, zoom,
    pitch: 50, bearing: -17, minZoom: 14, maxZoom: 19,
    maxBounds: CAMPUS_BOUNDS, attributionControl: false
  });
  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
  map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
  const attribEl = map.getContainer().querySelector('.maplibregl-ctrl-attrib');
  if (attribEl) attribEl.classList.remove('maplibregl-compact-show');
  map.on('styleimagemissing', e => {
    if (map.hasImage(e.id)) return;
    map.addImage(e.id, { width: 1, height: 1, data: new Uint8Array(4) });
  });
  hookMapTheme(map);
  return map;
}

window.refreshMapTheme = function () {
  // diff:false forces a full style reload. With the default diff update MapLibre
  // reuses the same style (same URL) and skips 'style.load'/'styledataloading',
  // so the dark recolor never re-applies on toggle. HTML markers are DOM overlays
  // and survive setStyle regardless.
  [campusMap, detailMap].forEach(m => { if (m) m.setStyle(mapStyleUrl(), { diff: false }); });
};

function setMapActive(id, on) {
  campusMarkerById[id]?.el.classList.toggle('marker-active', on);
  document.querySelector(`#mapSidebarList .map-card[data-id="${id}"]`)?.classList.toggle('marker-active', on);
}

let selectedMapId = null;
function selectMapDorm(id) {
  if (selectedMapId && selectedMapId !== id) {
    campusMarkerById[selectedMapId]?.el.classList.remove('marker-selected');
    document.querySelector(`#mapSidebarList .map-card[data-id="${selectedMapId}"]`)?.classList.remove('marker-selected');
  }
  selectedMapId = id;
  campusMarkerById[id]?.el.classList.add('marker-selected');
  document.querySelector(`#mapSidebarList .map-card[data-id="${id}"]`)?.classList.add('marker-selected');
}

function addCampusMarkers(dormList) {
  dormList.forEach(d => {
    const el = document.createElement('div');
    el.className = 'map-marker';
    el.innerHTML = `
      <div class="map-marker-pill">
        <span class="map-marker-name">${escHtml(d.name)}</span>
        ${d.reviews > 0 ? `<span class="map-marker-sub">${d.rating.toFixed(1)} ★</span>` : ''}
      </div>`;
    el.addEventListener('mouseenter', () => setMapActive(d.id, true));
    el.addEventListener('mouseleave', () => setMapActive(d.id, false));
    el.addEventListener('click', () => {
      campusMap.flyTo({ center: [d.lng, d.lat], zoom: 17.5, pitch: 50, bearing: -17, duration: 900 });
      selectMapDorm(d.id);
      document.querySelector(`#mapSidebarList .map-card[data-id="${d.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([d.lng, d.lat]).addTo(campusMap);
    campusMarkerById[d.id] = { marker, el };
  });
}

function clearCampusMarkers() {
  Object.values(campusMarkerById).forEach(({ marker }) => marker.remove());
  campusMarkerById = {};
}

function mapCardHTML(d) {
  const none = d.reviews === 0;
  const rating = none
    ? '<span class="rating-dim">No reviews</span>'
    : `<span class="${tierClass(d.rating)}">${d.rating.toFixed(1)} ★</span> · ${reviewWord(d.reviews)}`;
  return `
    <div class="map-card" data-id="${d.id}">
      <div class="map-card-img" style="${d.imgs[0] ? `background-image:url('${d.imgs[0]}')` : ''}"></div>
      <div>
        <h3>${escHtml(d.name)}</h3>
        <div class="map-card-meta">${escHtml(d.type)} · ${escHtml(areaLabel(d.area))}</div>
        <div class="map-card-rating">${rating}</div>
      </div>
    </div>`;
}

function renderMapSidebar(query = '') {
  const q = query.trim().toLowerCase();
  const shown = mapDorms.filter(d => (mapCampusFilter === 'all' || d.area === mapCampusFilter) && matchesSearch(d, q));
  const shownIds = new Set(shown.map(d => d.id));

  const list = document.getElementById('mapSidebarList');
  list.innerHTML = shown.length
    ? shown.map(mapCardHTML).join('')
    : '<p class="no-results" style="padding:20px 4px">No housing matches your search.</p>';

  document.getElementById('mapResultCount').innerHTML =
    `Showing <strong>${shown.length}</strong> result${shown.length === 1 ? '' : 's'}`;

  list.querySelectorAll('.map-card').forEach(card => {
    const id = card.dataset.id;
    card.addEventListener('mouseenter', () => setMapActive(id, true));
    card.addEventListener('mouseleave', () => setMapActive(id, false));
    // Click a sidebar card -> open its detail page.
    card.addEventListener('click', () => showDetail(id));
    if (id === selectedMapId) card.classList.add('marker-selected');
  });

  Object.entries(campusMarkerById).forEach(([id, { el }]) => {
    el.style.display = shownIds.has(id) ? '' : 'none';
  });
}

function filterMapSidebar() { renderMapSidebar(document.getElementById('mapSearchInput').value); }

function setMapCampusFilter(area, btn) {
  mapCampusFilter = area;
  document.querySelectorAll('#mapCampusFilter button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  filterMapSidebar();
  zoomMapToCampus(area);
}

function zoomMapToCampus(area) {
  if (!campusMap) return;
  if (area === 'all') {
    campusMap.flyTo({ center: [-76.9440, 38.9875], zoom: 14.5, pitch: 50, bearing: -17 });
    return;
  }
  const inArea = mapDorms.filter(d => d.area === area);
  if (!inArea.length) return;
  const bounds = new maplibregl.LngLatBounds();
  inArea.forEach(d => bounds.extend([d.lng, d.lat]));
  campusMap.fitBounds(bounds, { padding: 80, maxZoom: 16.5, pitch: 50, bearing: -17, duration: 900 });
}

function toggleMapSidebar() {
  document.getElementById('mapSplit').classList.toggle('sidebar-collapsed');
  setTimeout(() => campusMap && campusMap.resize(), 300);
}

function fitMapHeight() {
  const split = document.getElementById('mapSplit');
  const nav = document.querySelector('nav');
  if (!split || !nav) return;
  split.style.height = (window.innerHeight - nav.offsetHeight) + 'px';
  if (campusMap) campusMap.resize();
  if (mapSheetReady && sheetMedia.matches) {
    setSheetOpen(document.getElementById('mapSidebar').classList.contains('sheet-open'));
  }
}

const sheetMedia = window.matchMedia('(max-width: 760px)');
function sheetPeekOffset(sheet) { return Math.max(0, sheet.offsetHeight - 168); }
function setSheetOpen(open) {
  const sheet = document.getElementById('mapSidebar');
  if (!sheet) return;
  sheet.classList.toggle('sheet-open', open);
  sheet.style.transform = sheetMedia.matches ? `translateY(${open ? 0 : sheetPeekOffset(sheet)}px)` : '';
}

let mapSheetReady = false;
function initMapSheet() {
  const sheet = document.getElementById('mapSidebar');
  const handle = document.getElementById('mapSheetHandle');
  if (!sheet || !handle) return;
  setSheetOpen(false);
  if (!mapSheetReady) sheetMedia.addEventListener('change', () => setSheetOpen(sheet.classList.contains('sheet-open')));
  if (mapSheetReady) return;
  mapSheetReady = true;

  let startY = null, startT = 0;
  const currentT = () => {
    const m = /translateY\(([-\d.]+)px\)/.exec(sheet.style.transform);
    return m ? parseFloat(m[1]) : sheetPeekOffset(sheet);
  };
  handle.addEventListener('pointerdown', e => {
    if (!sheetMedia.matches) return;
    startY = e.clientY; startT = currentT();
    sheet.classList.add('sheet-dragging');
    handle.setPointerCapture(e.pointerId);
  });
  handle.addEventListener('pointermove', e => {
    if (startY === null) return;
    const t = Math.max(0, Math.min(sheetPeekOffset(sheet), startT + (e.clientY - startY)));
    sheet.style.transform = `translateY(${t}px)`;
  });
  handle.addEventListener('pointerup', e => {
    if (startY === null) return;
    sheet.classList.remove('sheet-dragging');
    const moved = Math.abs(e.clientY - startY);
    if (moved < 6) setSheetOpen(!sheet.classList.contains('sheet-open'));
    else setSheetOpen(currentT() < sheetPeekOffset(sheet) / 2);
    startY = null;
  });
}

function initMap() {
  mapDorms = dorms.filter(d => d.campus === 'on' && d.lat && d.lng);
  if (!campusMap) {
    campusMap = createCampusMap('mapFrame', [-76.9440, 38.9875], 14.5);
    campusMap.on('load', () => {
      addCampusMarkers(mapDorms);
      renderMapSidebar(document.getElementById('mapSearchInput').value);
    });
  } else {
    clearCampusMarkers();
    addCampusMarkers(mapDorms);
    renderMapSidebar(document.getElementById('mapSearchInput').value);
  }
  setTimeout(() => { fitMapHeight(); initMapSheet(); }, 100);
}

window.addEventListener('resize', () => { if (currentSection === 'map') fitMapHeight(); });

/* ------------------------------------------------------------------ *
 * Lightbox (single image)                                            *
 * ------------------------------------------------------------------ */
function openLightbox(src) {
  if (!src) return;
  document.getElementById('lightboxImg').src = src;
  document.getElementById('lightbox').classList.add('active');
}
function closeLightbox() { document.getElementById('lightbox').classList.remove('active'); }

/* ------------------------------------------------------------------ *
 * Toast                                                              *
 * ------------------------------------------------------------------ */
let _toastTimer = null;
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast toast-${type} show`;
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}

/* ------------------------------------------------------------------ *
 * Misc                                                               *
 * ------------------------------------------------------------------ */
function closeNav() {
  document.getElementById('navLinks').classList.remove('open');
  document.getElementById('navToggle').classList.remove('open');
}

function startPlaceholderTypewriter() {
  const el = document.getElementById('searchInput');
  const phrases = ['Search halls...', 'Find the perfect dorm...', 'Search by area...', 'Find your next home...'];
  let i = 0, j = 0, del = false, pause = 0;
  setInterval(() => {
    if (document.activeElement === el || el.value) return;
    if (pause-- > 0) return;
    del ? j-- : j++;
    el.placeholder = phrases[i].slice(0, j);
    if (!del && j === phrases[i].length) { del = true; pause = 18; }
    if (del && j === 0) { del = false; i = (i + 1) % phrases.length; pause = 4; }
  }, 100);
}

// Expose handlers for inline onclick attributes (ES module scope isn't global).
Object.assign(window, {
  showSection, showDetail, backToList,
  filterDorms, toggleChip, setAllFilter, selectSort,
  setReviewSort, openForm, closeForm, formSetRating, formSetYear, submitReview,
  quickSetRating, quickSetYear, quickSubmit,
  openLightbox, closeLightbox, closeNav,
  filterMapSidebar, toggleMapSidebar, setMapCampusFilter
});

// Close the mobile menu with Escape / clicking a link handled inline.
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

document.addEventListener('DOMContentLoaded', () => {
  dorms.forEach(d => { d.reviewList = []; });
  renderDorms();
  showReviewsLoading();
  loadAllReviews();
  setupReviewsListener();
  startPlaceholderTypewriter();
});

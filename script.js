import { supabase } from './supabase.js';
import { dorms } from './data.js';

// ─── LOAD REVIEWS FROM SUPABASE ─────────────────────────────
// Shows the full-screen server-down overlay.
function showMaintenanceOverlay() {
  const overlay = document.getElementById('maintenanceOverlay');
  if (overlay) overlay.style.display = 'flex';
}

async function loadAllReviews() {
  let data, error;
  try {
    const query = supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });
    // Race the query against a 1.5 s timer — Supabase free-tier pauses hang indefinitely otherwise.
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 1500)
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

  if (currentSection === 'home') renderDorms('on');
  if (currentSection === 'offcampus') renderDorms('off');
  if (currentDorm) showDetail(currentDorm.id);
}

// ─── REAL-TIME UPDATES ──────────────────────────────────────
function setupReviewsListener() {
  supabase
    .channel('reviews')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'reviews' },
      loadAllReviews
    )
    // CHANNEL_ERROR / TIMED_OUT fire before the HTTP query fails, giving faster overlay detection.
    .subscribe(status => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        showMaintenanceOverlay();
      }
    });
}

// ─── UTILS ──────────────────────────────────────────────────
// Converts characters like < > & " ' into safe HTML entities so that
// user-submitted text is always displayed as plain text and never
// interpreted as HTML or JavaScript by the browser (prevents XSS attacks).
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')   // must be first â€” avoids double-escaping
    .replace(/</g, '&lt;')    // blocks opening HTML tags
    .replace(/>/g, '&gt;')    // blocks closing HTML tags
    .replace(/"/g, '&quot;')  // blocks breaking out of HTML attributes
    .replace(/'/g, '&#39;');  // blocks single-quote injection
}

// ─── STATE ──────────────────────────────────────────────────
let currentFilter = 'all';
let offCampusFilter = 'all';
let currentSection = 'home';
let currentDorm = null;
let selectedRating = 0;
let selectedYear = '';
let lightboxImages = [];
let lightboxIndex = 0;
let currentSort = 'default';

// ─── RENDER DORM GRID ──────────────────────────────────────
function dormCardHTML(d) {
  return `
    <div class="dorm-card" onclick="showDetail('${d.id}')">
      <div class="dorm-card-img" style="${d.imgs[0] ? `background-image:url('${d.imgs[0]}')` : ''}"></div>
      <div class="dorm-card-body">
        <h3>${d.name}</h3>
        <div class="meta"><span>${d.type}</span><span class="badge-inline${d.reviews === 0 ? ' no-reviews' : ''}">${d.reviews === 0 ? '0 reviews' : `${d.rating.toFixed(1)} ★ · ${d.reviews} ${d.reviews === 1 ? 'review' : 'reviews'}`}</span></div>
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
function applySorting(arr) {
  if (currentSort === 'rating-desc') return [...arr].sort((a, b) => {
    if (a.reviews === 0 && b.reviews === 0) return 0;
    if (a.reviews === 0) return 1;
    if (b.reviews === 0) return -1;
    return b.rating - a.rating;
  });
  if (currentSort === 'rating-asc') return [...arr].sort((a, b) => {
    if (a.reviews === 0 && b.reviews === 0) return 0;
    if (a.reviews === 0) return 1;
    if (b.reviews === 0) return -1;
    return a.rating - b.rating;
  });
  return arr;
}

function renderDorms(campus = 'on') {
  const filter = campus === 'on' ? currentFilter : offCampusFilter;
  const gridId = campus === 'on' ? 'dormGrid' : 'offCampusDormGrid';
  const q = document.getElementById('searchInput').value.toLowerCase();
  const filtered = dorms.filter(d =>
    d.campus === campus && (filter === 'all' || d.area === filter) && matchesSearch(d, q)
  );
  document.getElementById(gridId).innerHTML = applySorting(filtered).map(dormCardHTML).join('');
}

function setSort(val) {
  currentSort = val;
  filterDorms();
}

function filterDorms() {
  renderDorms(currentSection === 'offcampus' ? 'off' : 'on');
}

function setFilter(f, btn) {
  currentFilter = f;
  document.querySelectorAll('#filterBar button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderDorms('on');
}

function setOffCampusFilter(f, btn) {
  offCampusFilter = f;
  document.querySelectorAll('#offCampusFilterBar button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderDorms('off');
}

// ─── DETAIL VIEW ────────────────────────────────────────────
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
          <div class="stat-box"><div class="label">Rating</div><div class="val" style="color:var(--gold)">${d.rating.toFixed(1)} <span style="font-size:.9rem">/ 5</span></div></div>
          <div class="stat-box"><div class="label">${d.reviews === 1 ? 'Review' : 'Reviews'}</div><div class="val">${d.reviews}</div></div>
          <div class="stat-box"><div class="label">Room Types</div><div class="val" style="font-size:1rem">${d.roomTypes}</div></div>
          ${d.tags && d.tags.length ? `<div class="stat-box"><div class="label">Features</div><div class="tag-row">${d.tags.map(t => `<span class="tag ${t.c}">${t.t}</span>`).join('')}</div></div>` : ''}
        </div>
        <button class="write-review-btn" onclick="openInlineForm()">Write a Review</button>
      </div>
    </div>
    ${d.lat && d.lng ? `<div class="detail-map-wrap"><div id="detailMapFrame"></div></div>` : ''}
    <h3 class="section-title">Reviews</h3>
    <div class="reviews-list" id="reviewsList">
      ${allReviews.length === 0 ? `<p class="no-reviews">No reviews yet :(</p>` : allReviews.map(r => `
        <div class="review-card">
          <div class="review-top">
            <span class="name">${escHtml(r.name)}</span>
            <span><span class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span> <span class="date">${escHtml(r.date)}</span></span>
          </div>
          <div class="review-body">${escHtml(r.text)}</div>
          ${r.created_at ? `<div class="review-posted">Posted: ${new Date(r.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>` : ''}
        </div>
      `).join('')}
    </div>
  `;

  if (d.lat && d.lng) {
    detailMap = L.map('detailMapFrame').setView([d.lat, d.lng], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(detailMap);
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

// ─── SECTIONS NAV ───────────────────────────────────────────
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
  if (name === 'map') initMap();
}

// ─── MAP ────────────────────────────────────────────────────
let leafletMap = null;
let detailMap = null;

function initMap() {
  const onCampusDorms = dorms.filter(d => d.campus === 'on' && d.lat && d.lng);

  if (!leafletMap) {
    leafletMap = L.map('mapFrame').setView([38.9875, -76.9440], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(leafletMap);
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
      ${d.rating > 0 ? d.rating.toFixed(1) + '★ · ' + d.reviews + ' review' + (d.reviews !== 1 ? 's' : '') : 'No reviews yet :('}<br>
      <a href="#" onclick="showDetail('${d.id}');return false;">View reviews</a>
    `);
  });

  // Same visibility-timing fix as the detail map.
  // Same visibility-timing fix as the detail map.
  setTimeout(() => leafletMap.invalidateSize(), 100);
}

// ─── LIGHTBOX ───────────────────────────────────────────────
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

// ─── REVIEW MODAL ───────────────────────────────────────────
function initYearPicker() {
  const now = new Date();
  // Academic year starts in August (month 7); before August the current year hasn't begun yet.
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
  document.querySelectorAll('#starInput span').forEach((s, i) => s.classList.toggle('filled', i < selectedRating));
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

  // Require a star rating before submitting
  if (selectedRating === 0) {
    showToast('Please select a star rating before submitting.', 'error');
    return;
  }

  // Require review text â€” an empty review is not useful
  if (!text) {
    showToast('Please write something before submitting.', 'error');
    return;
  }

  // Enforce length limits in JS as a second line of defense.
  // maxlength on the HTML inputs handles normal users, but someone could
  // bypass the form and send a raw HTTP request with a huge payload.
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


// ─── NAV ────────────────────────────────────────────────────
function closeNav() {
  document.getElementById('navLinks').classList.remove('open');
  document.getElementById('navToggle').classList.remove('open');
}

// ES modules don't expose to the global scope, so onclick="..." attributes in HTML can't reach them without this.
window.closeNav = closeNav;
window.showDetail = showDetail;
window.filterDorms = filterDorms;
window.setFilter = setFilter;
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

// ─── SEARCH PLACEHOLDER TYPEWRITER ─────────────────────────
function startPlaceholderTypewriter() {
  const el = document.getElementById('searchInput');
  const phrases = ['Search dorms...', 'Find the perfect dorm...', 'Search by area...', 'Find your next home...'];
  let i = 0, j = 0, del = false, pause = 0;

  setInterval(() => {
    // Don't animate while the user is typing or has typed something.
    // Don't animate while the user is typing or has typed something.
    if (document.activeElement === el || el.value) return;
    if (pause-- > 0) return;
    del ? j-- : j++;
    el.placeholder = phrases[i].slice(0, j);
    if (!del && j === phrases[i].length) { del = true; pause = 18; }
    if (del && j === 0) { del = false; i = (i + 1) % phrases.length; pause = 4; }
  }, 100);
}

// Safe initialization
document.addEventListener('DOMContentLoaded', () => {
  // Pre-initialize reviewList so showDetail never throws if reviews haven't loaded yet.
  // Pre-initialize reviewList so showDetail never throws if reviews haven't loaded yet.
  dorms.forEach(d => { d.reviewList = []; });
  renderDorms('on');
  loadAllReviews();
  setupReviewsListener();
  startPlaceholderTypewriter();
  document.getElementById('reviewText').addEventListener('input', function () {
    document.getElementById('charCount').textContent = `${this.value.length} / 2000`;
  });
});



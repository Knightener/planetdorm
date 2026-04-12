import { supabase } from './supabase.js';
import { dorms } from './data.js';

// ─── LOAD REVIEWS FROM SUPABASE ─────────────────────────────
async function loadAllReviews() {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading reviews:', error);
    return;
  }

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
        tags: [],
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

  if (currentSection === 'home') renderDorms();
  if (currentSection === 'offcampus') renderOffCampusDorms();
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
    .subscribe();
}

// ─── STATE ──────────────────────────────────────────────────
let currentFilter = 'all';
let offCampusFilter = 'all';
let currentSection = 'home';
let currentDorm = null;
let selectedRating = 0;
let lightboxImages = [];
let lightboxIndex = 0;

// ─── RENDER DORM GRID ──────────────────────────────────────
function dormCardHTML(d) {
  return `
    <div class="dorm-card" onclick="showDetail('${d.id}')">
      <div class="dorm-card-img" style="${d.imgs[0] ? `background-image:url('${d.imgs[0]}')` : ''}">
        <div class="badge">${d.rating.toFixed(1)} ★</div>
      </div>
      <div class="dorm-card-body">
        <h3>${d.name}</h3>
        <div class="meta"><span>${d.type}</span><span>${d.reviews} ${d.reviews === 1 ? 'review' : 'reviews'}</span></div>
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

function renderDorms() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const grid = document.getElementById('dormGrid');
  const filtered = dorms.filter(d => {
    const matchCampus = d.campus === 'on';
    const matchArea = currentFilter === 'all' || d.area === currentFilter;
    return matchCampus && matchArea && matchesSearch(d, q);
  });
  grid.innerHTML = filtered.map(dormCardHTML).join('');
}

function renderOffCampusDorms() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const grid = document.getElementById('offCampusDormGrid');
  const filtered = dorms.filter(d => {
    const matchCampus = d.campus === 'off';
    const matchArea = offCampusFilter === 'all' || d.area === offCampusFilter;
    return matchCampus && matchArea && matchesSearch(d, q);
  });
  grid.innerHTML = filtered.map(dormCardHTML).join('');
}

function filterDorms() {
  if (currentSection === 'offcampus') renderOffCampusDorms();
  else renderDorms();
}

function setFilter(f, btn) {
  currentFilter = f;
  document.querySelectorAll('#filterBar button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderDorms();
}

function setOffCampusFilter(f, btn) {
  offCampusFilter = f;
  document.querySelectorAll('#offCampusFilterBar button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderOffCampusDorms();
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

        </div>
        ${d.tags && d.tags.length ? `<div class="tag-row">${d.tags.map(t => `<span class="tag ${t.c}">${t.t}</span>`).join('')}</div>` : ''}
        <button class="write-review-btn" onclick="openModal()">Write a Review</button>
      </div>
    </div>
    ${d.lat && d.lng ? `<div class="detail-map-wrap"><div id="detailMapFrame"></div></div>` : ''}
    <h3 class="section-title">Reviews</h3>
    <div class="reviews-list" id="reviewsList">
      ${allReviews.length === 0 ? `<p class="no-reviews">No reviews yet :(</p>` : allReviews.map(r => `
        <div class="review-card">
          <div class="review-top">
            <span class="name">${r.name}</span>
            <span><span class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span> <span class="date">${r.date}</span></span>
          </div>
          <div class="review-body">${r.text}</div>
          <div class="review-tags">${(r.tags || []).map(t => `<span class="tag">${t}</span>`).join('')}</div>
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
    setTimeout(() => detailMap.invalidateSize(), 100);
  }
}

function backToList() {
  if (detailMap) {
    detailMap.remove();
    detailMap = null;
  }
  document.getElementById('section-detail').classList.remove('active');
  document.getElementById('section-detail').style.display = 'none';
  document.getElementById('heroSection').style.display = '';
  document.getElementById('section-' + currentSection).classList.add('active');
  currentDorm = null;
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
    if (name === 'offcampus') renderOffCampusDorms();
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
function openModal() {
  document.getElementById('reviewModal').classList.add('active');
  selectedRating = 0;
  updateStars();
}

function closeModal() {
  document.getElementById('reviewModal').classList.remove('active');
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
  const year = document.getElementById('reviewYear').value;

  const { error } = await supabase
    .from('reviews')
    .insert({
      dormId: currentDorm.id,
      name: name,
      rating: selectedRating,
      text: text,
      year: year
    });

  if (error) {
    console.error(error);
    showToast('Failed to submit review. Please try again later.', 'error');
  } else {
    closeModal();
    document.getElementById('reviewName').value = '';
    document.getElementById('reviewText').value = '';
    selectedRating = 0;
    showToast('Review submitted successfully! Thanks for contributing.', 'success');
  }
}


// Make key functions globally available for onclick handlers
window.showDetail = showDetail;
window.filterDorms = filterDorms;
window.setFilter = setFilter;
window.setOffCampusFilter = setOffCampusFilter;
window.openModal = openModal;
window.closeModal = closeModal;
window.setRating = setRating;
window.submitReview = submitReview;
window.backToList = backToList;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.navLightbox = navLightbox;
window.showSection = showSection;

// Safe initialization
document.addEventListener('DOMContentLoaded', () => {
  renderDorms();
  loadAllReviews();
  setupReviewsListener();
});

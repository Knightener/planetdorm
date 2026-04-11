// ─── DORM DATA ──────────────────────────────────────────────
const dorms = [
  {
    id: 'test', name: 'TEMPLATE', area: 'north', built: '1966',
    rating: 3.2, reviews: 48, type: 'Traditional', roomTypes: 'Doubles, Triples',
    ac: false, dining: 'TEMPLATE',
    lat: 38.9932, lng: -76.9490,
    imgs: [
   
    ],
    tags: [{ t: 'Large community', c: 'good' }, { t: 'No A/C', c: 'bad' }, { t: 'Close to dining', c: 'good' }],
    reviewList: [
      { name: 'test', date: 'Mar 2025', rating: 3, text: 'test', tags: ['Community', 'No A/C'] },
    ]
  },
];

// ─── STATE ──────────────────────────────────────────────────
let currentFilter = 'all';
let currentDorm = null;
let selectedRating = 0;
let lightboxImages = [];
let lightboxIndex = 0;
let galleryDorm = 'all';

// ─── RENDER DORM GRID ──────────────────────────────────────
function renderDorms() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const grid = document.getElementById('dormGrid');
  const filtered = dorms.filter(d => {
    const matchArea = currentFilter === 'all' || d.area === currentFilter;
    const matchSearch = d.name.toLowerCase().includes(q);
    return matchArea && matchSearch;
  });
  grid.innerHTML = filtered.map(d => `
    <div class="dorm-card" onclick="showDetail('${d.id}')">
      <div class="dorm-card-img" style="background-image:url('${d.imgs[0]}')">
        <div class="badge">${d.rating.toFixed(1)} ★</div>
      </div>
      <div class="dorm-card-body">
        <h3>${d.name}</h3>
        <div class="meta"><span>${d.type}</span><span>${d.reviews} reviews</span></div>
        <div class="tag-row">${d.tags.map(t => `<span class="tag ${t.c}">${t.t}</span>`).join('')}</div>
      </div>
    </div>
  `).join('');
}

function filterDorms() { renderDorms(); }

function setFilter(f, btn) {
  currentFilter = f;
  document.querySelectorAll('#filterBar button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderDorms();
}

// ─── DETAIL VIEW ────────────────────────────────────────────
function showDetail(id) {
  const d = dorms.find(x => x.id === id);
  if (!d) return;
  currentDorm = d;
  document.getElementById('heroSection').style.display = 'none';
  document.getElementById('section-home').classList.remove('active');
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
          <div class="stat-box"><div class="label">Reviews</div><div class="val">${d.reviews}</div></div>
          <div class="stat-box"><div class="label">Room Types</div><div class="val" style="font-size:1rem">${d.roomTypes}</div></div>
          <div class="stat-box"><div class="label">A/C</div><div class="val" style="color:${d.ac ? 'var(--green)' : 'var(--red)'}">${d.ac ? 'Yes' : 'No'}</div></div>
        </div>
        <button class="write-review-btn" onclick="openModal()">✍ Write a Review</button>
      </div>
    </div>
    <h3 class="section-title">Reviews</h3>
    <div class="reviews-list" id="reviewsList">
      ${allReviews.map(r => `
        <div class="review-card">
          <div class="review-top">
            <span class="name">${r.name}</span>
            <span><span class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span> <span class="date">${r.date}</span></span>
          </div>
          <div class="review-body">${r.text}</div>
          <div class="review-tags">${(r.tags || []).map(t => `<span class="tag">${t}</span>`).join('')}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function backToList() {
  document.getElementById('section-detail').classList.remove('active');
  document.getElementById('section-detail').style.display = 'none';
  document.getElementById('heroSection').style.display = '';
  document.getElementById('section-home').classList.add('active');
  currentDorm = null;
}

// ─── SECTIONS NAV ───────────────────────────────────────────
function showSection(name) {
  document.querySelectorAll('.nav-links button').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-section="${name}"]`).classList.add('active');
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById('section-detail').style.display = 'none';

  if (name === 'home') {
    document.getElementById('heroSection').style.display = '';
    document.getElementById('section-home').classList.add('active');
  } else {
    document.getElementById('heroSection').style.display = 'none';
    document.getElementById('section-' + name).classList.add('active');
  }
  if (name === 'map') initMap();
  if (name === 'gallery') renderGallery();
}

// ─── MAP ────────────────────────────────────────────────────
function initMap() {
  const center = '38.9897,-76.9378';
  document.getElementById('mapFrame').src = `https://www.openstreetmap.org/export/embed.html?bbox=-76.958,38.982,-76.928,38.998&layer=mapnik&marker=${center}`;
  const legend = document.getElementById('mapLegend');
  legend.innerHTML = `<h4>Residence Halls</h4>` + dorms.map(d => `
    <div class="map-legend-item" onclick="showDetail('${d.id}');showSection('home');">
      <span class="dot"></span>
      <span>${d.name} — ${d.rating.toFixed(1)}★</span>
    </div>
  `).join('');
}

// ─── GALLERY ────────────────────────────────────────────────
function renderGallery() {
  const filterDiv = document.getElementById('galleryFilter');
  filterDiv.innerHTML = `<button class="${galleryDorm === 'all' ? 'active' : ''}" onclick="galleryDorm='all';renderGallery()">All</button>` +
    dorms.map(d => `<button class="${galleryDorm === d.id ? 'active' : ''}" onclick="galleryDorm='${d.id}';renderGallery()">${d.name}</button>`).join('');

  const grid = document.getElementById('galleryGrid');
  let photos = [];
  dorms.forEach(d => {
    if (galleryDorm === 'all' || galleryDorm === d.id) {
      d.imgs.forEach((img) => photos.push({ src: img, label: d.name, dormId: d.id }));
    }
  });
  const photosJson = JSON.stringify(photos.map(x => x.src)).replace(/"/g, '&quot;');
  grid.innerHTML = photos.map((p, i) => `
    <div class="gallery-thumb" onclick="openLightbox(${photosJson}, ${i})">
      <img src="${p.src}" alt="${p.label}" loading="lazy">
      <div class="gallery-label">${p.label}</div>
    </div>
  `).join('');
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

function submitReview() {
  const name = document.getElementById('reviewName').value || 'Anonymous Terp';
  const text = document.getElementById('reviewText').value;
  const year = document.getElementById('reviewYear').value;
  if (!text || !selectedRating) { alert('Please add a rating and review text.'); return; }
  if (currentDorm) {
    currentDorm.reviewList.unshift({ name, date: year, rating: selectedRating, text, tags: [] });
    currentDorm.reviews++;
    showDetail(currentDorm.id);
  }
  closeModal();
  document.getElementById('reviewName').value = '';
  document.getElementById('reviewText').value = '';
  selectedRating = 0;
}

// ─── INIT ───────────────────────────────────────────────────
renderDorms();
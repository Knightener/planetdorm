// ─── DORM DATA ──────────────────────────────────────────────
const dorms = [
  {
    id: 'ellicott', name: 'Ellicott Hall', area: 'north', built: '1966',
    rating: 3.2, reviews: 48, type: 'Traditional', roomTypes: 'Doubles, Triples',
    ac: false, dining: 'Ellicott Dining Hall',
    lat: 38.9932, lng: -76.9490,
    imgs: [
      'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600',
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600',
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=600'
    ],
    tags: [{ t: 'Large community', c: 'good' }, { t: 'No A/C', c: 'bad' }, { t: 'Close to dining', c: 'good' }],
    reviewList: [
      { name: 'TerpFan22', date: 'Mar 2025', rating: 3, text: 'Rooms are small but the community vibe is unmatched. Floor events every week. No AC is rough in September though.', tags: ['Community', 'No A/C'] },
      { name: 'CS_Major', date: 'Jan 2025', rating: 4, text: 'Loved being on North Campus. Ellicott dining is right there. Bathrooms could be cleaner but overall solid experience.', tags: ['Location', 'Dining'] },
    ]
  },
  {
    id: 'cambridge', name: 'Cambridge Community', area: 'commons', built: '2002',
    rating: 4.1, reviews: 67, type: 'Suite-style', roomTypes: 'Singles, Doubles',
    ac: true, dining: 'South Campus Dining',
    lat: 38.9855, lng: -76.9400,
    imgs: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600',
      'https://images.unsplash.com/photo-1630699144867-37acec97df5a?w=600',
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=600'
    ],
    tags: [{ t: 'Suite-style', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Pricey', c: 'mid' }],
    reviewList: [
      { name: 'SeniorTerp', date: 'Feb 2025', rating: 5, text: 'Best dorm on campus hands down. Suite style gives you privacy. A/C is a lifesaver. Worth every penny.', tags: ['Suite', 'A/C', 'Worth it'] },
      { name: 'FreshmanVibes', date: 'Dec 2024', rating: 3, text: 'Nice rooms but felt isolated. Hard to meet people compared to traditional halls.', tags: ['Quiet', 'Isolated'] },
    ]
  },
  {
    id: 'denton', name: 'Denton Community', area: 'commons', built: '2004',
    rating: 3.8, reviews: 52, type: 'Suite-style', roomTypes: 'Singles, Doubles',
    ac: true, dining: 'South Campus Dining',
    lat: 38.9851, lng: -76.9410,
    imgs: [
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600',
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600'
    ],
    tags: [{ t: 'Suite-style', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Far from classes', c: 'mid' }],
    reviewList: [
      { name: 'Bio_Major', date: 'Jan 2025', rating: 4, text: 'Suites are great for studying. Kitchen area is a nice bonus. A bit far from STEM buildings.', tags: ['Suites', 'Kitchen'] },
    ]
  },
  {
    id: 'hagerstown', name: 'Hagerstown Hall', area: 'north', built: '1963',
    rating: 2.8, reviews: 34, type: 'Traditional', roomTypes: 'Doubles',
    ac: false, dining: 'Ellicott Dining Hall',
    lat: 38.9940, lng: -76.9478,
    imgs: [
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=600',
      'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600',
      'https://images.unsplash.com/photo-1630699144867-37acec97df5a?w=600'
    ],
    tags: [{ t: 'Cheap', c: 'good' }, { t: 'No A/C', c: 'bad' }, { t: 'Older building', c: 'bad' }],
    reviewList: [
      { name: 'Anon', date: 'Nov 2024', rating: 2, text: "You get what you pay for. Walls are thin, no AC, and the elevators break constantly. But it's cheap.", tags: ['Budget', 'Old'] },
      { name: 'MathTerp', date: 'Oct 2024', rating: 3, text: 'Not glamorous but I made lifelong friends here. That counts for something.', tags: ['Community'] },
    ]
  },
  {
    id: 'elkton', name: 'Elkton Hall', area: 'south', built: '1964',
    rating: 3.5, reviews: 41, type: 'Traditional', roomTypes: 'Doubles, Triples',
    ac: false, dining: 'South Campus Dining',
    lat: 38.9870, lng: -76.9445,
    imgs: [
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600'
    ],
    tags: [{ t: 'South campus', c: 'mid' }, { t: 'Social', c: 'good' }, { t: 'No A/C', c: 'bad' }],
    reviewList: [
      { name: 'PoliSciTerp', date: 'Jan 2025', rating: 4, text: 'Great location near McKeldin and the mall. Easy walk to most classes. Floor was super social.', tags: ['Location', 'Social'] },
    ]
  },
  {
    id: 'centreville', name: 'Centreville Hall', area: 'south', built: '1965',
    rating: 3.3, reviews: 29, type: 'Traditional', roomTypes: 'Doubles',
    ac: false, dining: 'South Campus Dining',
    lat: 38.9865, lng: -76.9455,
    imgs: [
      'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600',
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=600',
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600'
    ],
    tags: [{ t: 'Central location', c: 'good' }, { t: 'Small rooms', c: 'bad' }, { t: 'Affordable', c: 'good' }],
    reviewList: [
      { name: 'EngTerp', date: 'Dec 2024', rating: 3, text: 'Nothing fancy but location is prime. Right next to everything. Rooms are tiny though.', tags: ['Location', 'Small'] },
    ]
  },
  {
    id: 'oakland', name: 'Oakland Hall', area: 'north', built: '2015',
    rating: 4.4, reviews: 78, type: 'Suite-style', roomTypes: 'Singles, Doubles',
    ac: true, dining: '251 North',
    lat: 38.9945, lng: -76.9500,
    imgs: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600',
      'https://images.unsplash.com/photo-1630699144867-37acec97df5a?w=600',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600'
    ],
    tags: [{ t: 'Modern', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Honors', c: 'mid' }],
    reviewList: [
      { name: 'HonorsTerp', date: 'Mar 2025', rating: 5, text: 'Newest dorm on North Campus. Everything is modern, clean, and well-maintained. A/C works perfectly. Laundry in building.', tags: ['Modern', 'Clean', 'A/C'] },
      { name: 'Freshman23', date: 'Feb 2025', rating: 4, text: "Beautiful building. Only downside is it fills up fast since it's an Honors hall. Get your housing app in early!", tags: ['Popular', 'Honors'] },
    ]
  },
  {
    id: 'prince_frederick', name: 'Prince Frederick Hall', area: 'south', built: '2021',
    rating: 4.6, reviews: 55, type: 'Apartment-style', roomTypes: 'Singles, Doubles',
    ac: true, dining: 'Near 251 North',
    lat: 38.9862, lng: -76.9438,
    imgs: [
      'https://images.unsplash.com/photo-1630699144867-37acec97df5a?w=600',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600'
    ],
    tags: [{ t: 'Brand new', c: 'good' }, { t: 'Apartment-style', c: 'good' }, { t: 'Expensive', c: 'mid' }],
    reviewList: [
      { name: 'GradTerp', date: 'Mar 2025', rating: 5, text: 'Feels like a real apartment. Full kitchen, private bathroom, modern furnishings. Best housing option at UMD by far.', tags: ['Apartment', 'Kitchen', 'Modern'] },
      { name: 'JuniorTerp', date: 'Jan 2025', rating: 4, text: 'Amazing rooms but the price tag is steep. Worth it if you can afford it.', tags: ['Nice', 'Pricey'] },
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
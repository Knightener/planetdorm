// ─── DORM DATA ──────────────────────────────────────────────
const dorms = [

  // ── NORTH CAMPUS: Cambridge Community ──────────────────────
  {
    id: 'belair', name: 'Bel Air Hall', campus: 'on', area: 'north', built: '1965',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles, Triples',
    ac: true, dining: 'Yahentamitsi Dining Hall',
    lat: 38.9952, lng: -76.9492,
    imgs: [],
    tags: [{ t: 'A/C', c: 'good' }, { t: 'In-hall Laundry', c: 'good' }, { t: 'Closes on Breaks', c: 'bad' }],
    reviewList: []
  },
  {
    id: 'cambridge', name: 'Cambridge Hall', campus: 'on', area: 'north', built: '1963',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles, Triples',
    ac: true, dining: 'Yahentamitsi Dining Hall',
    lat: 38.9948, lng: -76.9495,
    imgs: [],
    tags: [{ t: 'College Park Scholars', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'In-hall Laundry', c: 'good' }],
    reviewList: []
  },
  {
    id: 'centreville', name: 'Centreville Hall', campus: 'on', area: 'north', built: '1964',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles, Triples',
    ac: true, dining: 'Yahentamitsi Dining Hall',
    lat: 38.9944, lng: -76.9493,
    imgs: [],
    tags: [{ t: 'College Park Scholars', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'In-hall Laundry', c: 'good' }],
    reviewList: []
  },
  {
    id: 'chestertown', name: 'Chestertown Hall', campus: 'on', area: 'north', built: '1964',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles, Triples',
    ac: true, dining: 'Yahentamitsi Dining Hall',
    lat: 38.9946, lng: -76.9498,
    imgs: [],
    tags: [{ t: 'College Park Scholars', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'In-hall Laundry', c: 'good' }],
    reviewList: []
  },
  {
    id: 'cumberland', name: 'Cumberland Hall', campus: 'on', area: 'north', built: '1965',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles, Triples',
    ac: true, dining: 'Yahentamitsi Dining Hall',
    lat: 38.9940, lng: -76.9500,
    imgs: [],
    tags: [{ t: 'College Park Scholars', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'In-hall Laundry', c: 'good' }],
    reviewList: []
  },

  // ── NORTH CAMPUS: Denton Community ─────────────────────────
  {
    id: 'denton', name: 'Denton Hall', campus: 'on', area: 'north', built: '1966',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles, Triples',
    ac: true, dining: 'Yahentamitsi Dining Hall',
    lat: 38.9965, lng: -76.9460,
    imgs: [],
    tags: [{ t: 'A/C', c: 'good' }, { t: 'In-hall Laundry', c: 'good' }, { t: 'Closes on Breaks', c: 'bad' }],
    reviewList: []
  },
  {
    id: 'easton', name: 'Easton Hall', campus: 'on', area: 'north', built: '1966',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles, Triples',
    ac: true, dining: 'Yahentamitsi Dining Hall',
    lat: 38.9968, lng: -76.9455,
    imgs: [],
    tags: [{ t: 'Multiple LLPs', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'In-hall Laundry', c: 'good' }],
    reviewList: []
  },
  {
    id: 'elkton', name: 'Elkton Hall', campus: 'on', area: 'north', built: '1966',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles, Triples',
    ac: true, dining: 'Yahentamitsi Dining Hall',
    lat: 38.9963, lng: -76.9452,
    imgs: [],
    tags: [{ t: 'A/C', c: 'good' }, { t: 'In-hall Laundry', c: 'good' }, { t: 'Closes on Breaks', c: 'bad' }],
    reviewList: []
  },

  // ── NORTH CAMPUS: Ellicott Community ───────────────────────
  {
    id: 'ellicott', name: 'Ellicott Hall', campus: 'on', area: 'north', built: '1962',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles, Triples',
    ac: false, dining: 'Yahentamitsi Dining Hall',
    lat: 38.9935, lng: -76.9458,
    imgs: [],
    tags: [{ t: 'Gemstone LLP', c: 'good' }, { t: 'No A/C', c: 'bad' }, { t: 'In-hall Laundry', c: 'good' }],
    reviewList: []
  },
  {
    id: 'hagerstown', name: 'Hagerstown Hall', campus: 'on', area: 'north', built: '1962',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles, Triples',
    ac: false, dining: 'Yahentamitsi Dining Hall',
    lat: 38.9930, lng: -76.9455,
    imgs: [],
    tags: [{ t: 'No A/C', c: 'bad' }, { t: 'In-hall Laundry', c: 'good' }, { t: 'Closes on Breaks', c: 'bad' }],
    reviewList: []
  },
  {
    id: 'laplata', name: 'La Plata Hall', campus: 'on', area: 'north', built: '1962',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles, Triples',
    ac: true, dining: 'Yahentamitsi Dining Hall',
    lat: 38.9927, lng: -76.9452,
    imgs: [],
    tags: [{ t: 'Integrated Life Sciences LLP', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],
    reviewList: []
  },

  // ── NORTH CAMPUS: Heritage Community ───────────────────────
  {
    id: 'johnsonwhittle', name: 'Johnson-Whittle Hall', campus: 'on', area: 'north', built: '2013',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles',
    ac: true, dining: 'Yahentamitsi Dining Hall',
    lat: 38.9945, lng: -76.9514,
    imgs: [],
    tags: [{ t: 'University Honors', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Newer Building', c: 'good' }],
    reviewList: []
  },
  {
    id: 'pyonchen', name: 'Pyon-Chen Hall', campus: 'on', area: 'north', built: '2013',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles',
    ac: true, dining: 'Yahentamitsi Dining Hall',
    lat: 38.9947, lng: -76.9518,
    imgs: [],
    tags: [{ t: 'University Honors', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Newer Building', c: 'good' }],
    reviewList: []
  },

  // ── NORTH CAMPUS: Oakland Hall ─────────────────────────────
  {
    id: 'oakland', name: 'Oakland Hall', campus: 'on', area: 'north', built: '2009',
    rating: 0, reviews: 0, type: 'Semi-Suite', roomTypes: 'Doubles (Semi-Suite)',
    ac: true, dining: 'Yahentamitsi Dining Hall',
    lat: 38.9933, lng: -76.9530,
    imgs: [],
    tags: [{ t: 'Semi-Suite', c: 'good' }, { t: 'A/C', c: 'good' }, { t: '24-Hr Service Desk', c: 'good' }],
    reviewList: []
  },

  // ── SOUTH CAMPUS: North Hill Community ─────────────────────
  {
    id: 'annearundel', name: 'Anne Arundel Hall', campus: 'on', area: 'south', built: '1965',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles',
    ac: true, dining: '251 North Dining Hall',
    lat: 38.9845, lng: -76.9382,
    imgs: [],
    tags: [{ t: 'Honors Humanities LLP', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],
    reviewList: []
  },
  {
    id: 'caroline', name: 'Caroline Hall', campus: 'on', area: 'south', built: '1967',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles, Triples',
    ac: false, dining: '251 North Dining Hall',
    lat: 38.9843, lng: -76.9378,
    imgs: [],
    tags: [{ t: 'No A/C', c: 'bad' }, { t: 'In-hall Laundry', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],
    reviewList: []
  },
  {
    id: 'carroll', name: 'Carroll Hall', campus: 'on', area: 'south', built: '1967',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles, Triples',
    ac: false, dining: '251 North Dining Hall',
    lat: 38.9841, lng: -76.9384,
    imgs: [],
    tags: [{ t: 'No A/C', c: 'bad' }, { t: 'In-hall Laundry', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],
    reviewList: []
  },
  {
    id: 'dorchester', name: 'Dorchester Hall', campus: 'on', area: 'south', built: '1968',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles',
    ac: true, dining: '251 North Dining Hall',
    lat: 38.9847, lng: -76.9388,
    imgs: [],
    tags: [{ t: 'Honors Global Challenges LLP', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],
    reviewList: []
  },
  {
    id: 'princefrederick', name: 'Prince Frederick Hall', campus: 'on', area: 'south', built: '1967',
    rating: 0, reviews: 0, type: 'Semi-Suite/Suite', roomTypes: 'Doubles, Singles',
    ac: true, dining: '251 North Dining Hall',
    lat: 38.9850, lng: -76.9392,
    imgs: [],
    tags: [{ t: 'Multiple LLPs', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Semi-Suite/Suite', c: 'good' }],
    reviewList: []
  },
  {
    id: 'queenAnnes', name: "Queen Anne's Hall", campus: 'on', area: 'south', built: '1966',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles',
    ac: true, dining: '251 North Dining Hall',
    lat: 38.9840, lng: -76.9376,
    imgs: [],
    tags: [{ t: "Writers' House LLP", c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],
    reviewList: []
  },
  {
    id: 'somerset', name: 'Somerset Hall', campus: 'on', area: 'south', built: '1966',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles',
    ac: true, dining: '251 North Dining Hall',
    lat: 38.9836, lng: -76.9380,
    imgs: [],
    tags: [{ t: 'BioFIRE LLP', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],
    reviewList: []
  },
  {
    id: 'stmarys', name: "St. Mary's Hall", campus: 'on', area: 'south', built: '1968',
    rating: 0, reviews: 0, type: 'Suite', roomTypes: 'Doubles, Singles (Suite)',
    ac: true, dining: '251 North Dining Hall',
    lat: 38.9852, lng: -76.9395,
    imgs: [],
    tags: [{ t: 'Language House LLP', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Suite-style', c: 'good' }],
    reviewList: []
  },
  {
    id: 'wicomico', name: 'Wicomico Hall', campus: 'on', area: 'south', built: '1965',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles, Triples',
    ac: false, dining: '251 North Dining Hall',
    lat: 38.9838, lng: -76.9373,
    imgs: [],
    tags: [{ t: 'No A/C', c: 'bad' }, { t: 'In-hall Laundry', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],
    reviewList: []
  },
  {
    id: 'worcester', name: 'Worcester Hall', campus: 'on', area: 'south', built: '1965',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles, Triples',
    ac: false, dining: '251 North Dining Hall',
    lat: 38.9835, lng: -76.9370,
    imgs: [],
    tags: [{ t: 'No A/C', c: 'bad' }, { t: 'In-hall Laundry', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],
    reviewList: []
  },

  // ── SOUTH CAMPUS: Leonardtown Community ────────────────────
  {
    id: 'leonardtown', name: 'Leonardtown', campus: 'on', area: 'south', built: '2011',
    rating: 0, reviews: 0, type: 'Suite/Apartment', roomTypes: 'Singles, Doubles (Suite/Apt)',
    ac: true, dining: '251 North Dining Hall',
    lat: 38.9810, lng: -76.9415,
    imgs: [],
    tags: [{ t: 'Suite/Apartment', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Newer Building', c: 'good' }],
    reviewList: []
  },

  // ── THE COMMONS: South Hill Community ──────────────────────
  {
    id: 'allegany', name: 'Allegany Hall', campus: 'on', area: 'commons', built: '2000',
    rating: 0, reviews: 0, type: 'Suite/Apartment', roomTypes: 'Singles, Doubles (Suite/Apt)',
    ac: true, dining: '251 North Dining Hall',
    lat: 38.9858, lng: -76.9418,
    imgs: [],
    tags: [{ t: 'Suite/Apartment', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],
    reviewList: []
  },
  {
    id: 'baltimore', name: 'Baltimore Hall', campus: 'on', area: 'commons', built: '2000',
    rating: 0, reviews: 0, type: 'Suite/Apartment', roomTypes: 'Singles, Doubles (Suite/Apt)',
    ac: true, dining: '251 North Dining Hall',
    lat: 38.9861, lng: -76.9422,
    imgs: [],
    tags: [{ t: 'Suite/Apartment', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],
    reviewList: []
  },
  {
    id: 'calvert', name: 'Calvert Hall', campus: 'on', area: 'commons', built: '2000',
    rating: 0, reviews: 0, type: 'Suite/Apartment', roomTypes: 'Singles, Doubles (Suite/Apt)',
    ac: true, dining: '251 North Dining Hall',
    lat: 38.9864, lng: -76.9426,
    imgs: [],
    tags: [{ t: 'Suite/Apartment', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],
    reviewList: []
  },
  {
    id: 'cecil', name: 'Cecil Hall', campus: 'on', area: 'commons', built: '2000',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles, Triples',
    ac: false, dining: '251 North Dining Hall',
    lat: 38.9855, lng: -76.9410,
    imgs: [],
    tags: [{ t: 'No A/C', c: 'bad' }, { t: 'In-hall Laundry', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],
    reviewList: []
  },
  {
    id: 'charles', name: 'Charles Hall', campus: 'on', area: 'commons', built: '2000',
    rating: 0, reviews: 0, type: 'Suite/Apartment', roomTypes: 'Singles, Doubles (Suite/Apt)',
    ac: true, dining: '251 North Dining Hall',
    lat: 38.9860, lng: -76.9430,
    imgs: [],
    tags: [{ t: 'Suite/Apartment', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],
    reviewList: []
  },
  {
    id: 'frederick', name: 'Frederick Hall', campus: 'on', area: 'commons', built: '2001',
    rating: 0, reviews: 0, type: 'Suite/Apartment', roomTypes: 'Singles, Doubles (Suite/Apt)',
    ac: true, dining: '251 North Dining Hall',
    lat: 38.9868, lng: -76.9412,
    imgs: [],
    tags: [{ t: 'Suite/Apartment', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],
    reviewList: []
  },
  {
    id: 'garrett', name: 'Garrett Hall', campus: 'on', area: 'commons', built: '2001',
    rating: 0, reviews: 0, type: 'Suite/Apartment', roomTypes: 'Singles, Doubles (Suite/Apt)',
    ac: true, dining: '251 North Dining Hall',
    lat: 38.9865, lng: -76.9416,
    imgs: [],
    tags: [{ t: 'Suite/Apartment', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],
    reviewList: []
  },
  {
    id: 'harford', name: 'Harford Hall', campus: 'on', area: 'commons', built: '2001',
    rating: 0, reviews: 0, type: 'Suite/Apartment', roomTypes: 'Singles, Doubles (Suite/Apt)',
    ac: true, dining: '251 North Dining Hall',
    lat: 38.9870, lng: -76.9405,
    imgs: [],
    tags: [{ t: 'Suite/Apartment', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'In-hall Laundry', c: 'good' }],
    reviewList: []
  },
  {
    id: 'howard', name: 'Howard Hall', campus: 'on', area: 'commons', built: '2001',
    rating: 0, reviews: 0, type: 'Suite/Apartment', roomTypes: 'Singles, Doubles (Suite/Apt)',
    ac: true, dining: '251 North Dining Hall',
    lat: 38.9863, lng: -76.9409,
    imgs: [],
    tags: [{ t: 'Suite/Apartment', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],
    reviewList: []
  },
  {
    id: 'kent', name: 'Kent Hall', campus: 'on', area: 'commons', built: '2001',
    rating: 0, reviews: 0, type: 'Suite/Apartment', roomTypes: 'Singles, Doubles (Suite/Apt)',
    ac: true, dining: '251 North Dining Hall',
    lat: 38.9856, lng: -76.9414,
    imgs: [],
    tags: [{ t: 'Suite/Apartment', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],
    reviewList: []
  },
  {
    id: 'montgomery', name: 'Montgomery Hall', campus: 'on', area: 'commons', built: '2001',
    rating: 0, reviews: 0, type: 'Suite/Apartment', roomTypes: 'Singles, Doubles (Suite/Apt)',
    ac: true, dining: '251 North Dining Hall',
    lat: 38.9872, lng: -76.9420,
    imgs: [],
    tags: [{ t: 'Suite/Apartment', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],
    reviewList: []
  },
  {
    id: 'princegeorges', name: "Prince George's Hall", campus: 'on', area: 'commons', built: '2001',
    rating: 0, reviews: 0, type: 'Suite/Apartment', roomTypes: 'Singles, Doubles (Suite/Apt)',
    ac: true, dining: '251 North Dining Hall',
    lat: 38.9875, lng: -76.9416,
    imgs: [],
    tags: [{ t: 'Suite/Apartment', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],
    reviewList: []
  },
  {
    id: 'talbot', name: 'Talbot Hall', campus: 'on', area: 'commons', built: '2001',
    rating: 0, reviews: 0, type: 'Suite/Apartment', roomTypes: 'Singles, Doubles (Suite/Apt)',
    ac: true, dining: '251 North Dining Hall',
    lat: 38.9878, lng: -76.9412,
    imgs: [],
    tags: [{ t: 'Suite/Apartment', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],
    reviewList: []
  },
  {
    id: 'washington', name: 'Washington Hall', campus: 'on', area: 'commons', built: '2001',
    rating: 0, reviews: 0, type: 'Suite/Apartment', roomTypes: 'Singles, Doubles (Suite/Apt)',
    ac: true, dining: '251 North Dining Hall',
    lat: 38.9867, lng: -76.9408,
    imgs: [],
    tags: [{ t: 'Suite/Apartment', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],
    reviewList: []
  },
];

// ─── STATE ──────────────────────────────────────────────────
let currentFilter = 'all';
let offCampusFilter = 'all';
let currentSection = 'home';
let currentDorm = null;
let selectedRating = 0;
let lightboxImages = [];
let lightboxIndex = 0;
let galleryDorm = 'all';

// ─── RENDER DORM GRID ──────────────────────────────────────
function dormCardHTML(d) {
  return `
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
  `;
}

function renderDorms() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const grid = document.getElementById('dormGrid');
  const filtered = dorms.filter(d => {
    const matchCampus = d.campus === 'on';
    const matchArea = currentFilter === 'all' || d.area === currentFilter;
    const matchSearch = d.name.toLowerCase().includes(q);
    return matchCampus && matchArea && matchSearch;
  });
  grid.innerHTML = filtered.map(dormCardHTML).join('');
}

function renderOffCampusDorms() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const grid = document.getElementById('offCampusDormGrid');
  const filtered = dorms.filter(d => {
    const matchCampus = d.campus === 'off';
    const matchArea = offCampusFilter === 'all' || d.area === offCampusFilter;
    const matchSearch = d.name.toLowerCase().includes(q);
    return matchCampus && matchArea && matchSearch;
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
  document.getElementById('section-' + currentSection).classList.add('active');
  currentDorm = null;
}

// ─── SECTIONS NAV ───────────────────────────────────────────
function showSection(name) {
  document.querySelectorAll('.nav-links button').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-section="${name}"]`).classList.add('active');
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById('section-detail').style.display = 'none';

  if (name === 'home' || name === 'offcampus') {
    document.getElementById('heroSection').style.display = '';
    document.getElementById('section-' + name).classList.add('active');
    currentSection = name;
    if (name === 'offcampus') renderOffCampusDorms();
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
    currentDorm.rating = currentDorm.reviewList.reduce((sum, r) => sum + r.rating, 0) / currentDorm.reviewList.length;
    showDetail(currentDorm.id);
    renderDorms();
    renderOffCampusDorms();
  }
  closeModal();
  document.getElementById('reviewName').value = '';
  document.getElementById('reviewText').value = '';
  selectedRating = 0;
}

// ─── INIT ───────────────────────────────────────────────────
renderDorms();
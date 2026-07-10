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

// forMap: sidebar cards select the dorm on the map (click handled in JS) and
// expose a "View Dorm" button that opens the detail page.
function dormCardHTML(d, forMap = false) {
  return `
    <div class="dorm-card" data-id="${d.id}"${forMap ? '' : ` onclick="showDetail('${d.id}')"`}>
      <div class="dorm-card-img" style="${d.imgs[0] ? `background-image:url('${d.imgs[0]}')` : ''}"></div>
      <div class="dorm-card-body">
        <h3>${d.name}</h3>
        <div class="meta"><span>${d.type}</span><span class="badge-inline ${d.reviews === 0 ? 'no-reviews' : ratingTier(d.rating)}">${d.reviews === 0 ? '0 reviews' : `${d.rating.toFixed(1)} ★ · ${d.reviews} ${d.reviews === 1 ? 'review' : 'reviews'}`}</span></div>
        <div class="tag-row">${d.tags.map(t => `<span class="tag ${t.c}">${t.t}</span>`).join('')}</div>
        ${forMap ? `<button class="view-dorm-btn" onclick="event.stopPropagation();showDetail('${d.id}')">View Dorm</button>` : ''}
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
  document.getElementById(gridId).innerHTML = applySorting(filtered, sort).map(d => dormCardHTML(d)).join('');
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
    detailMap = createCampusMap('detailMapFrame', [d.lng, d.lat], 16.5);
    detailMap.on('load', () => {
      new maplibregl.Marker({ color: '#EAA000' })
        .setLngLat([d.lng, d.lat])
        .setPopup(new maplibregl.Popup({ offset: 28 }).setText(d.name))
        .addTo(detailMap)
        .togglePopup();
    });
    // Resize once the detail view (and its container) becomes visible.
    setTimeout(() => detailMap.resize(), 100);
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

let campusMap = null;
let detailMap = null;
// Markers keyed by dorm id so the sidebar and map can highlight each other.
let campusMarkerById = {};
let mapDorms = [];
let mapCampusFilter = 'all';

// Campus bounds in MapLibre's [[west, south], [east, north]] ([lng, lat]) order.
const CAMPUS_BOUNDS = [[-76.975, 38.970], [-76.915, 39.005]];

// Colourful base with full POI/landmark labels and 3D buildings, for both themes.
// Dark mode keeps this style but recolours it dark via applyDarkTheme().
function mapStyleUrl() {
  return 'https://tiles.openfreemap.org/styles/liberty';
}

function isDarkTheme() {
  return document.documentElement.dataset.theme !== 'light';
}

// Recolour the (light) Liberty style into a dark theme: dark base + water + roads
// + buildings, while keeping parks green, POI icons colourful, and labels legible.
function applyDarkTheme(map) {
  const set = (id, prop, val) => { try { map.setPaintProperty(id, prop, val); } catch (e) {} };
  for (const layer of map.getStyle().layers) {
    const id = layer.id;
    switch (layer.type) {
      case 'background':
        set(id, 'background-color', '#0f1116');
        break;
      case 'raster':
        // Low-zoom shaded relief would glow light on a dark map — hide it.
        set(id, 'raster-opacity', 0);
        break;
      case 'fill':
        if (/wood|grass|park|forest/.test(id)) {
          set(id, 'fill-color', '#16311f');
          set(id, 'fill-opacity', 0.55);
        } else if (id === 'water') {
          set(id, 'fill-color', '#16203c');
        } else if (id === 'building') {
          set(id, 'fill-color', '#191c24');
        } else {
          set(id, 'fill-color', '#14161c');
        }
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
        // Keep water names bluish; everything else light-grey on a dark halo.
        set(id, 'text-color', /water_name|waterway/.test(id) ? '#8098d0' : '#c7ccd6');
        set(id, 'text-halo-color', '#0b0d11');
        set(id, 'text-halo-width', 1.2);
        break;
    }
  }
}

function applyMapTheme(map) {
  if (isDarkTheme()) applyDarkTheme(map);
  // Light theme uses Liberty's own (light) colours — nothing to override.
}

function createCampusMap(container, center, zoom) {
  const map = new maplibregl.Map({
    container,
    style: mapStyleUrl(),
    center,
    zoom,
    pitch: 50,
    bearing: -17,
    minZoom: 14,
    maxZoom: 19,
    maxBounds: CAMPUS_BOUNDS,
    // Replace the default expanded credits with a collapsed (i) button.
    attributionControl: false
  });
  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-left');
  map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
  // MapLibre's compact attribution actually starts EXPANDED and only minimizes
  // after the first map interaction — collapse it to the (i) button immediately.
  const attribEl = map.getContainer().querySelector('.maplibregl-ctrl-attrib');
  if (attribEl) attribEl.classList.remove('maplibregl-compact-show');
  // The Liberty style references POI sprite icons that aren't in our sprite sheet.
  // Register a blank placeholder for any missing image to silence console warnings.
  map.on('styleimagemissing', (e) => {
    if (map.hasImage(e.id)) return;
    map.addImage(e.id, { width: 1, height: 1, data: new Uint8Array(4) });
  });
  // Fires on first load and again after every setStyle() (theme toggle).
  map.on('style.load', () => applyMapTheme(map));
  return map;
}

// On theme toggle, reload the style; the style.load handler re-applies the theme.
// Custom HTML markers are DOM elements, so they survive setStyle().
window.refreshMapTheme = function () {
  [campusMap, detailMap].forEach(m => { if (m) m.setStyle(mapStyleUrl()); });
};

// Highlight a marker + its sidebar card together (on hover from either side).
function setMapActive(id, on) {
  const entry = campusMarkerById[id];
  if (entry) entry.el.classList.toggle('marker-active', on);
  const card = document.querySelector(`#mapSidebarList .dorm-card[data-id="${id}"]`);
  if (card) card.classList.toggle('marker-active', on);
}

// Persistently highlight the selected dorm (marker + sidebar card) until another is picked.
let selectedMapId = null;
function selectMapDorm(id) {
  if (selectedMapId && selectedMapId !== id) {
    const prev = campusMarkerById[selectedMapId];
    if (prev) prev.el.classList.remove('marker-selected');
    const prevCard = document.querySelector(`#mapSidebarList .dorm-card[data-id="${selectedMapId}"]`);
    if (prevCard) prevCard.classList.remove('marker-selected');
  }
  selectedMapId = id;
  const entry = campusMarkerById[id];
  if (entry) entry.el.classList.add('marker-selected');
  const card = document.querySelector(`#mapSidebarList .dorm-card[data-id="${id}"]`);
  if (card) card.classList.add('marker-selected');
}

function addCampusMarkers(dormList) {
  dormList.forEach(d => {
    const el = document.createElement('div');
    el.className = 'map-marker';
    el.innerHTML = `
      <div class="map-marker-pill">
        <span class="map-marker-name">${d.name}</span>
        ${d.reviews > 0 ? `<span class="map-marker-sub">${d.rating.toFixed(1)} ★</span>` : ''}
      </div>`;
    el.addEventListener('mouseenter', () => setMapActive(d.id, true));
    el.addEventListener('mouseleave', () => setMapActive(d.id, false));
    // Clicking a pill zooms the map to the dorm, scrolls its card into view, and selects it.
    el.addEventListener('click', () => {
      campusMap.flyTo({ center: [d.lng, d.lat], zoom: 17.5, pitch: 50, bearing: -17, duration: 900 });
      selectMapDorm(d.id);
      const card = document.querySelector(`#mapSidebarList .dorm-card[data-id="${d.id}"]`);
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat([d.lng, d.lat])
      .addTo(campusMap);
    campusMarkerById[d.id] = { marker, el };
  });
}

function clearCampusMarkers() {
  Object.values(campusMarkerById).forEach(({ marker }) => marker.remove());
  campusMarkerById = {};
}

// Populate the map sidebar; a query narrows both the list and the visible markers.
function renderMapSidebar(query = '') {
  const q = query.trim().toLowerCase();
  const shown = mapDorms.filter(d =>
    (mapCampusFilter === 'all' || d.area === mapCampusFilter) && matchesSearch(d, q));
  const shownIds = new Set(shown.map(d => d.id));

  const list = document.getElementById('mapSidebarList');
  list.innerHTML = shown.length
    ? shown.map(d => dormCardHTML(d, true)).join('')
    : '<p class="no-reviews" style="padding:20px 4px">No housing matches your search.</p>';

  document.getElementById('mapResultCount').innerHTML =
    `Showing <strong>${shown.length}</strong> result${shown.length === 1 ? '' : 's'}`;

  const dormById = Object.fromEntries(shown.map(d => [d.id, d]));

  list.querySelectorAll('.dorm-card').forEach(card => {
    const id = card.dataset.id;
    // Hover a card -> highlight its marker (and vice versa).
    card.addEventListener('mouseenter', () => setMapActive(id, true));
    card.addEventListener('mouseleave', () => setMapActive(id, false));
    // Click a card -> fly the map to that dorm and select it (View Dorm opens the page).
    card.addEventListener('click', () => {
      const d = dormById[id];
      if (d) campusMap.flyTo({ center: [d.lng, d.lat], zoom: 17.5, pitch: 50, bearing: -17, duration: 900 });
      selectMapDorm(id);
    });
    if (id === selectedMapId) card.classList.add('marker-selected');
  });

  // Hide markers filtered out of the list.
  Object.entries(campusMarkerById).forEach(([id, { el }]) => {
    el.style.display = shownIds.has(id) ? '' : 'none';
  });
}

function filterMapSidebar() {
  renderMapSidebar(document.getElementById('mapSearchInput').value);
}

function setMapCampusFilter(area, btn) {
  mapCampusFilter = area;
  document.querySelectorAll('#mapCampusFilter button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  filterMapSidebar();
  zoomMapToCampus(area);
}

// Fly/fit the map to the selected campus. "all" returns to the full-campus view.
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
  // Give the map its new width after the sidebar finishes animating.
  setTimeout(() => campusMap && campusMap.resize(), 300);
}

// Size the map view to exactly fill the space below the nav, so the page itself
// never scrolls (only the sidebar list does).
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

// --- Mobile bottom sheet: drag the handle to pull the housing list up/down. ---
const sheetMedia = window.matchMedia('(max-width: 760px)');

function sheetPeekOffset(sheet) {
  return Math.max(0, sheet.offsetHeight - 168); // leaves the handle + header peeking
}

function setSheetOpen(open) {
  const sheet = document.getElementById('mapSidebar');
  if (!sheet) return;
  sheet.classList.toggle('sheet-open', open);
  sheet.style.transform = sheetMedia.matches
    ? `translateY(${open ? 0 : sheetPeekOffset(sheet)}px)`
    : '';
}

let mapSheetReady = false;
function initMapSheet() {
  const sheet = document.getElementById('mapSidebar');
  const handle = document.getElementById('mapSheetHandle');
  if (!sheet || !handle) return;

  // Reset to peek whenever the map opens (and on first setup).
  setSheetOpen(false);
  // Keep the transform correct if the viewport crosses the mobile breakpoint.
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
    startY = e.clientY;
    startT = currentT();
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
    // A tap toggles; a drag snaps to whichever end is closer.
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

  // Resize once the map tab (and its container) becomes visible.
  setTimeout(() => { fitMapHeight(); initMapSheet(); }, 100);
}

// Keep the map view fitted to the viewport as it changes size.
window.addEventListener('resize', () => { if (currentSection === 'map') fitMapHeight(); });

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
window.filterMapSidebar = filterMapSidebar;
window.toggleMapSidebar = toggleMapSidebar;
window.setMapCampusFilter = setMapCampusFilter;

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



import { supabase } from './supabase.js';
import { dorms, landmarks, landmarkKinds } from './data.js';
import { reportOutage } from './outage.js';

/* ------------------------------------------------------------------ *
 * Reviews loading (real data model — Supabase + realtime)            *
 * ------------------------------------------------------------------ */
function handleReviewsOutage() {
  hideReviewsLoading();
  reportOutage(loadAllReviews);
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
    handleReviewsOutage();
    return;
  }

  if (error || !data) {
    console.error('Error loading reviews:', error);
    handleReviewsOutage();
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
let bathroomFilters = new Set();
let featureFilters = new Set();
let onCampusSort = 'alpha';

/* Saved halls — device-local, like theme/filters/helpful votes. */
const SAVED_KEY = 'pd-saved';
let savedDorms = new Set();
try { savedDorms = new Set(JSON.parse(localStorage.getItem(SAVED_KEY)) || []); } catch { /* corrupt entry — start clean */ }

const HEART_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';

function saveBtnHTML(id) {
  const on = savedDorms.has(id);
  return `<button class="save-btn${on ? ' saved' : ''}" data-id="${id}"
    aria-label="${on ? 'Remove from saved' : 'Save this hall'}" aria-pressed="${on}"
    onclick="toggleSaved('${id}', event)">${HEART_SVG}</button>`;
}

function toggleSaved(id, ev) {
  ev?.stopPropagation();
  if (savedDorms.has(id)) savedDorms.delete(id);
  else savedDorms.add(id);
  localStorage.setItem(SAVED_KEY, JSON.stringify([...savedDorms]));
  const on = savedDorms.has(id);
  document.querySelectorAll(`.save-btn[data-id="${id}"]`).forEach(b => {
    b.classList.toggle('saved', on);
    b.setAttribute('aria-pressed', String(on));
    b.setAttribute('aria-label', on ? 'Remove from saved' : 'Save this hall');
  });
}
let currentSection = 'home';

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
// Lowercase, strip accents/apostrophes, turn all other punctuation into
// spaces, and alias "saint" to "st" so "St Mary Hall" finds "St. Mary's Hall".
function normalizeSearchText(s) {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\bsaint\b/g, 'st')
    .trim();
}

// True if a and b differ by at most one typo (insert, delete, or substitute).
function within1Edit(a, b) {
  if (a === b) return true;
  const [s, l] = a.length <= b.length ? [a, b] : [b, a];
  if (l.length - s.length > 1) return false;
  let i = 0, j = 0, edits = 0;
  while (i < s.length && j < l.length) {
    if (s[i] === l[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (s.length === l.length) i++;
    j++;
  }
  return edits + (l.length - j) + (s.length - i) <= 1;
}

function tokenMatches(target, qt) {
  if (target.startsWith(qt)) return true;
  if (qt.length >= 3 && target.includes(qt)) return true;
  if (qt.length >= 4) {
    if (within1Edit(qt, target)) return true;
    // Also allow one typo against a prefix of the target ("marry" ~ "mary|s").
    for (const n of [qt.length - 1, qt.length, qt.length + 1]) {
      if (n > 0 && n < target.length && within1Edit(qt, target.slice(0, n))) return true;
    }
  }
  return false;
}

function matchesSearch(d, q) {
  const query = normalizeSearchText(q || '');
  if (!query) return true;
  const haystack = normalizeSearchText([
    d.name, d.area, areaLabel(d.area), d.type || '',
    ...(d.tags || []).map(t => t.t)
  ].join(' '));
  const tokens = haystack.split(' ');
  const qTokens = query.split(' ');
  // Every query word must (loosely) match some word of the hall's info, in
  // any order; failing that, try the query as one run-on string ("belair").
  return qTokens.every(qt => tokens.some(ht => tokenMatches(ht, qt))) ||
    tokens.join('').includes(qTokens.join(''));
}

function passesRoomTypeFilter(d) {
  if (roomTypeFilters.size === 0) return true;
  if (roomTypeFilters.has('traditional') && d.type === 'Traditional') return true;
  if (roomTypeFilters.has('semi-suite') && d.type.includes('Semi-Suite')) return true;
  if (roomTypeFilters.has('suite') && d.type.includes('Suite') && !d.type.startsWith('Semi-Suite')) return true;
  if (roomTypeFilters.has('apartment') && d.type.includes('Apartment')) return true;
  return false;
}

// OR within the group: a hall passes if its bathrooms include any selected type.
function passesBathroomFilter(d) {
  if (bathroomFilters.size === 0) return true;
  const b = d.bathrooms || '';
  if (bathroomFilters.has('community') && /community/i.test(b)) return true;
  if (bathroomFilters.has('single') && /single all-gender/i.test(b)) return true;
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
  if (!passesBathroomFilter(d)) return false;
  if (!passesFeatureFilter(d)) return false;
  return true;
}

// Zero-review halls always sink to the bottom of rating sorts.
function applySorting(arr) {
  if (onCampusSort === 'alpha') return [...arr].sort((a, b) => a.name.localeCompare(b.name));
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
      ${saveBtnHTML(d.id)}
    </div>`;
}

function renderDorms() {
  const onCampus = dorms.filter(d => d.campus === 'on');
  const filtered = applySorting(onCampus.filter(passesFilters));
  const grid = document.getElementById('dormGrid');
  grid.innerHTML = filtered.length
    ? filtered.map(dormRowHTML).join('')
    : '<p class="no-results">No halls match your filters.</p>';
  document.getElementById('countEcho').textContent =
    `${filtered.length}/${onCampus.length} halls`;
}

function filterDorms() { renderDorms(); }

function toggleChip(btn) {
  const set = { campus: campusFilters, room: roomTypeFilters, bath: bathroomFilters, feature: featureFilters }[btn.dataset.group];
  const v = btn.dataset.value;
  if (set.has(v)) { set.delete(v); btn.classList.remove('active'); }
  else { set.add(v); btn.classList.add('active'); }
  saveFilters();
  updateClearAll();
  renderDorms();
}

function updateClearAll() {
  const any = campusFilters.size || roomTypeFilters.size || bathroomFilters.size || featureFilters.size;
  document.getElementById('clearAllBtn').hidden = !any;
}

function setAllFilter() {
  campusFilters.clear();
  roomTypeFilters.clear();
  bathroomFilters.clear();
  featureFilters.clear();
  document.querySelectorAll('.filter-band .chip.active').forEach(c => c.classList.remove('active'));
  saveFilters();
  updateClearAll();
  renderDorms();
}

const FILTERS_KEY = 'pd-filters';

function saveFilters() {
  localStorage.setItem(FILTERS_KEY, JSON.stringify({
    campus: [...campusFilters], room: [...roomTypeFilters], bath: [...bathroomFilters], feature: [...featureFilters]
  }));
}

function restoreFilters() {
  let saved;
  try { saved = JSON.parse(localStorage.getItem(FILTERS_KEY)); } catch { /* corrupt entry — start clean */ }
  if (!saved) return;
  const sets = { campus: campusFilters, room: roomTypeFilters, bath: bathroomFilters, feature: featureFilters };
  document.querySelectorAll('.filter-band .chip').forEach(chip => {
    if ((saved[chip.dataset.group] || []).includes(chip.dataset.value)) {
      sets[chip.dataset.group].add(chip.dataset.value);
      chip.classList.add('active');
    }
  });
  updateClearAll();
  // Filters carried over from the last visit shouldn't be invisible.
  if (campusFilters.size + roomTypeFilters.size + bathroomFilters.size + featureFilters.size) {
    document.getElementById('filterBand').classList.add('open');
    document.getElementById('filterToggle').classList.add('open');
  }
}

function selectSort(val) {
  onCampusSort = val;
  document.querySelectorAll('.sort-opt').forEach(b => b.classList.toggle('active', b.dataset.sort === val));
  document.getElementById('sortSelect').value = val;
  renderDorms();
}

/* ------------------------------------------------------------------ *
 * Detail view — hall pages live in dorm-reviews.html                 *
 * ------------------------------------------------------------------ */
function showDetail(id) {
  location.href = `dorm-reviews.html?dorm=${encodeURIComponent(id)}`;
}


/* ------------------------------------------------------------------ *
 * Section routing                                                    *
 * ------------------------------------------------------------------ */
function showSection(name) {
  document.querySelectorAll('.nav-links button[data-section]').forEach(b =>
    b.classList.toggle('active', b.dataset.section === name));
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  currentSection = name;
  if (name === 'home') {
    document.getElementById('heroSection').style.display = '';
    document.getElementById('section-home').classList.add('active');
  } else {
    document.getElementById('heroSection').style.display = 'none';
    document.getElementById('section-' + name).classList.add('active');
  }
  document.getElementById('siteDisclaimer').style.display = name === 'map' ? 'none' : '';
  // Map view fills the viewport; lock page scroll so swipes go to the
  // map and the bottom sheet instead of rubber-banding the page.
  document.body.classList.toggle('map-view-active', name === 'map');
  if (name === 'map') initMap();
}

/* ------------------------------------------------------------------ *
 * Map (real MapLibre map)                                            *
 * ------------------------------------------------------------------ */
let campusMap = null;
let campusMarkerById = {};
let dormRoofHeight = {}; // dormId -> roof height in meters, from the base map's buildings
let mapDorms = [];

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
        if (id === DORM_LAYER) break; // dorm buildings keep their own colors
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

/* ------------------------------------------------------------------ *
 * Dorm building footprints (3D extrusions, one per dorm)             *
 * ------------------------------------------------------------------ */
const DORM_SRC = 'dorm-buildings';
const DORM_LAYER = 'dorm-buildings-3d';

const DORM_AREA_COLORS = {
  light: { north: '#e21833', south: '#e8a000', commons: '#2f6fd0',
           northHi: '#ff4d61', southHi: '#ffc233', commonsHi: '#5b96f0' },
  dark:  { north: '#ff5468', south: '#ffc233', commons: '#5b96f0',
           northHi: '#ff8b99', southHi: '#ffd876', commonsHi: '#8fb8f7' }
};

let dormGeojsonPromise = null;
function loadDormGeojson() {
  // Fetched once, enriched with each dorm's campus area for data-driven colors.
  if (!dormGeojsonPromise) {
    dormGeojsonPromise = fetch('assets/data/dorm-buildings.geojson')
      .then(r => r.json())
      .then(gj => {
        const areaById = Object.fromEntries(dorms.map(d => [d.id, d.area]));
        gj.features.forEach(f => { f.properties.area = areaById[f.properties.dormId] || 'north'; });
        return gj;
      })
      .catch(() => null);
  }
  return dormGeojsonPromise;
}

// Grow a polygon ring outward (default ~8 m) so tile-quantized building
// geometry still tests as inside the footprint mask.
function bufferRing(ring, e = 0.00008) {
  const cx = ring.reduce((s, p) => s + p[0], 0) / ring.length;
  const cy = ring.reduce((s, p) => s + p[1], 0) / ring.length;
  return ring.map(([x, y]) => {
    const dx = x - cx, dy = y - cy, len = Math.hypot(dx, dy) || 1;
    return [x + dx / len * e, y + dy / len * e];
  });
}

// One buffered MultiPolygon mask per dorm, built once from the GeoJSON.
let dormShapes = null;
async function loadDormShapes() {
  const gj = await loadDormGeojson();
  if (gj && !dormShapes) {
    const byId = {};
    for (const f of gj.features) {
      const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
      const rec = byId[f.properties.dormId] || (byId[f.properties.dormId] = { area: f.properties.area, polys: [] });
      rec.polys.push(...polys.map(poly => poly.map(r => bufferRing(r))));
    }
    dormShapes = Object.entries(byId).map(([id, v]) => {
      let minX = 180, minY = 90, maxX = -180, maxY = -90;
      for (const poly of v.polys) for (const [x, y] of poly[0]) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
      return { id, area: v.area, bbox: [minX, minY, maxX, maxY],
               geom: { type: 'MultiPolygon', coordinates: v.polys } };
    });
  }
  return dormShapes;
}

function dormBuildingPaint() {
  const c = DORM_AREA_COLORS[isDarkTheme() ? 'dark' : 'light'];
  const byArea = (n, s, co) => ['match', ['get', 'area'], 'south', s, 'commons', co, n];
  return {
    'fill-extrusion-color': [
      'case',
      ['boolean', ['feature-state', 'selected'], false], byArea(c.northHi, c.southHi, c.commonsHi),
      ['boolean', ['feature-state', 'hover'], false], byArea(c.northHi, c.southHi, c.commonsHi),
      byArea(c.north, c.south, c.commons)
    ],
    'fill-extrusion-height': ['get', 'render_height'],
    'fill-extrusion-base': ['get', 'render_min_height'],
    'fill-extrusion-opacity': 1
  };
}

// True outward offset: each vertex moves along the average of its two edges'
// outward normals. Correct at concave corners, where a radial-from-centroid
// nudge points the wrong way. Assumes GeoJSON winding (outer CCW, holes CW),
// which also makes holes shrink — i.e. the solid always grows.
function offsetRing(ring, meters) {
  const kx = Math.cos(38.99 * Math.PI / 180); // lon compression at campus latitude
  const e = meters / 111320;
  const pts = ring.map(([x, y]) => [x * kx, y]);
  const n = pts.length - 1; // last vertex duplicates the first
  const out = [];
  for (let i = 0; i < n; i++) {
    const p = pts[i], prev = pts[(i - 1 + n) % n], next = pts[(i + 1) % n];
    const norm = ([ax, ay], [bx, by]) => {
      const dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy) || 1;
      return [dy / l, -dx / l];
    };
    const [n1x, n1y] = norm(prev, p), [n2x, n2y] = norm(p, next);
    let mx = n1x + n2x, my = n1y + n2y;
    const ml = Math.hypot(mx, my) || 1;
    out.push([(p[0] + mx / ml * e) / kx, p[1] + my / ml * e]);
  }
  out.push(out[0]);
  return out;
}

function ringCentroid(ring) {
  let x = 0, y = 0;
  for (const p of ring) { x += p[0]; y += p[1]; }
  return [x / ring.length, y / ring.length];
}

function pointInRing(pt, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x1, y1] = ring[i], [x2, y2] = ring[j];
    if ((y1 > pt[1]) !== (y2 > pt[1]) && pt[0] < (x2 - x1) * (pt[1] - y1) / (y2 - y1) + x1) inside = !inside;
  }
  return inside;
}

function pointInShape(pt, s) {
  const [minX, minY, maxX, maxY] = s.bbox;
  if (pt[0] < minX || pt[0] > maxX || pt[1] < minY || pt[1] > maxY) return false;
  return s.geom.coordinates.some(poly => pointInRing(pt, poly[0]));
}

// A tile building belongs to a dorm when most of its vertices fall inside the
// dorm's (buffered) footprint mask. Vertex-majority handles concave L/U-shaped
// halls (whose centroid lies outside the building) and rejects mere neighbors,
// which share at best a few boundary vertices.
function dormForPoly(ring) {
  for (const s of dormShapes) {
    let inside = 0;
    for (const p of ring) if (pointInShape(p, s)) inside++;
    if (inside > ring.length / 2) return s;
  }
  return null;
}

// Pull the base map's own building geometry (with its render_height) out of the
// loaded vector tiles and keep the features that fall inside a dorm footprint.
// This guarantees our colored extrusions match the gray base buildings exactly.
function refreshDormGeometry(map) {
  const src = map.getSource?.(DORM_SRC);
  const base = map.getStyle()?.layers.find(l => l.type === 'fill-extrusion' && l.id !== DORM_LAYER);
  if (!src || !base || !dormShapes) return;
  const feats = map.querySourceFeatures(base.source, { sourceLayer: base['source-layer'] });
  const out = [], seen = new Set();
  for (const f of feats) {
    const g = f.geometry;
    const polys = g?.type === 'Polygon' ? [g.coordinates] : g?.type === 'MultiPolygon' ? g.coordinates : [];
    for (const poly of polys) {
      const s = dormForPoly(poly[0]);
      if (!s) continue;
      const c = ringCentroid(poly[0]);
      const key = s.id + ':' + c[0].toFixed(6) + ',' + c[1].toFixed(6);
      if (seen.has(key)) continue;
      seen.add(key);
      const h = Number(f.properties?.render_height) || 14;
      dormRoofHeight[s.id] = Math.max(dormRoofHeight[s.id] || 0, h);
      out.push({
        type: 'Feature',
        properties: {
          dormId: s.id, area: s.area,
          // Deliberate roof-cap style: a 1.2 m colored slab sitting on top of
          // the gray base building (slightly oversized so its rim is visible),
          // rather than recoloring the walls — consistent on every GPU.
          render_height: h + 1.2,
          render_min_height: h
        },
        geometry: { type: 'Polygon', coordinates: poly.map(r => offsetRing(r, 0.6)) }
      });
    }
  }
  // Tiles reload as you pan/zoom; only push data when the picked set changed.
  const sig = [...seen].sort().join('|');
  if (map.__dormSig !== sig && out.length) {
    map.__dormSig = sig;
    src.setData({ type: 'FeatureCollection', features: out });
    if (map === campusMap && selectedMapId) setDormBuildingState(map, selectedMapId, { selected: true });
  }
}

async function addDormBuildings(map) {
  const shapes = await loadDormShapes();
  if (!shapes || !map.getStyle()) return;
  try {
    if (!map.getSource(DORM_SRC)) {
      map.addSource(DORM_SRC, {
        type: 'geojson', promoteId: 'dormId',
        data: { type: 'FeatureCollection', features: [] }
      });
    }
    if (!map.getLayer(DORM_LAYER)) {
      map.__dormSig = null;
      map.addLayer({ id: DORM_LAYER, type: 'fill-extrusion', source: DORM_SRC, paint: dormBuildingPaint() });
      if (map === campusMap && dormLayerFilter) map.setFilter(DORM_LAYER, dormLayerFilter);
    } else {
      const paint = dormBuildingPaint();
      for (const [k, v] of Object.entries(paint)) map.setPaintProperty(DORM_LAYER, k, v);
    }
    if (!map.__dormIdleHooked) {
      map.__dormIdleHooked = true;
      // 'idle' fires whenever tiles finish (re)loading — keep geometry current.
      map.on('idle', () => refreshDormGeometry(map));
    }
    refreshDormGeometry(map);
  } catch (e) {
    // Usually a style reload racing the fetch — the next style.load re-adds.
    console.warn('dorm buildings layer:', e);
  }
}

function setDormBuildingState(map, id, state) {
  if (map && map.getSource(DORM_SRC)) map.setFeatureState({ source: DORM_SRC, id }, state);
}

let dormLayerFilter = null;

// Click/hover on the extruded buildings themselves (campus map only).
function wireDormBuildingEvents(map) {
  let hoverId = null;
  map.on('mousemove', DORM_LAYER, e => {
    const id = e.features[0]?.properties.dormId;
    if (id === hoverId) return;
    if (hoverId) setMapActive(hoverId, false);
    hoverId = id || null;
    if (hoverId) setMapActive(hoverId, true);
    map.getCanvas().style.cursor = hoverId ? 'pointer' : '';
  });
  map.on('mouseleave', DORM_LAYER, () => {
    if (hoverId) setMapActive(hoverId, false);
    hoverId = null;
    map.getCanvas().style.cursor = '';
  });
  map.on('click', DORM_LAYER, e => {
    const id = e.features[0]?.properties.dormId;
    const d = id && mapDorms.find(x => x.id === id);
    if (!d) return;
    map.flyTo({ center: [d.lng, d.lat], zoom: 17.5, pitch: 50, bearing: -17, duration: 900 });
    selectMapDorm(d.id);
    revealMapCard(d.id);
  });
}

// Robustly (re)apply the current theme after a style loads. 'style.load' is the
// primary signal (fires on the initial style and after every setStyle), but it
// is occasionally missed — which left the map on its light base while the rest
// of the site was dark. 'styledata' + isStyleLoaded() is the fallback, and
// 'styledataloading' rearms the guard whenever a new style starts loading.
function hookMapTheme(map) {
  let applied = false;
  const apply = () => { applied = true; applyMapTheme(map); addDormBuildings(map); restoreWalkRoute(map); };
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
  // Second compass click (view already straightened) restores the rotation it
  // had before the first click. MapLibre's own handler runs first per click;
  // its straightening ease is animated, so getBearing/getPitch here still read
  // the pre-reset values. Center/zoom are left alone.
  const compassBtn = map.getContainer().querySelector('.maplibregl-ctrl-compass');
  let savedRotation = null;
  compassBtn?.addEventListener('click', () => {
    const bearing = map.getBearing(), pitch = map.getPitch();
    if (Math.abs(bearing) > 0.1 || pitch > 0.1) {
      savedRotation = { bearing, pitch };
      return;
    }
    map.easeTo({ bearing: savedRotation?.bearing ?? -17, pitch: savedRotation?.pitch ?? 50, duration: 900 });
  });
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
  if (campusMap) campusMap.setStyle(mapStyleUrl(), { diff: false });
};

function setMapActive(id, on) {
  campusMarkerById[id]?.el.classList.toggle('marker-active', on);
  document.querySelector(`#mapSidebarList .map-card[data-id="${id}"]`)?.classList.toggle('marker-active', on);
  setDormBuildingState(campusMap, id, { hover: on });
}

let selectedMapId = null;
// Scroll the sidebar list (and nothing else) so the dorm's card is centered.
// scrollIntoView would also scroll ancestors, which on mobile yanks the
// bottom sheet up over the map.
function revealMapCard(id) {
  const list = document.getElementById('mapSidebarList');
  const card = list?.querySelector(`.map-card[data-id="${id}"]`);
  if (!list || !card) return;
  const delta = card.getBoundingClientRect().top - list.getBoundingClientRect().top;
  list.scrollTo({
    top: list.scrollTop + delta - (list.clientHeight - card.offsetHeight) / 2,
    behavior: 'smooth'
  });
}

function selectMapDorm(id) {
  if (selectedMapId && selectedMapId !== id) {
    campusMarkerById[selectedMapId]?.el.classList.remove('marker-selected');
    document.querySelector(`#mapSidebarList .map-card[data-id="${selectedMapId}"]`)?.classList.remove('marker-selected');
    setDormBuildingState(campusMap, selectedMapId, { selected: false });
  }
  selectedMapId = id;
  setDormBuildingState(campusMap, id, { selected: true });
  campusMarkerById[id]?.el.classList.add('marker-selected');
  document.querySelector(`#mapSidebarList .map-card[data-id="${id}"]`)?.classList.add('marker-selected');
  const d = mapDorms.find(x => x.id === id);
  if (d) openDirections(d);
}

/* ------------------------------------------------------------------ *
 * Walk times + routes (precomputed against OSM walkways; regenerate  *
 * with tools/build-routes.mjs)                                       *
 * ------------------------------------------------------------------ */
const ROUTE_SRC = 'walk-route';
const ROUTE_CASING = 'walk-route-casing';
const ROUTE_LINE = 'walk-route-line';
const EMPTY_FC = { type: 'FeatureCollection', features: [] };

let walkRoutes;            // undefined = not loaded, null = failed, {} = loaded
let walkRoutesPromise = null;
let directionsDorm = null; // dorm the panel is showing
let activeWalkDest = null; // landmark id of the currently drawn route
let routeDestMarker = null;

function loadWalkRoutes() {
  if (!walkRoutesPromise) {
    walkRoutesPromise = fetch('assets/data/walk-routes.json')
      .then(r => (r.ok ? r.json() : null))
      .then(j => (walkRoutes = j?.routes || null))
      .catch(() => (walkRoutes = null));
  }
  return walkRoutesPromise;
}

// Decode an encoded polyline (precision 6, Valhalla's default) to
// [lng, lat] pairs.
function decodePolyline6(str) {
  const out = [];
  let i = 0, lat = 0, lng = 0;
  while (i < str.length) {
    for (const axis of ['lat', 'lng']) {
      let b, shift = 0, result = 0;
      do { b = str.charCodeAt(i++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
      const delta = (result & 1) ? ~(result >> 1) : (result >> 1);
      if (axis === 'lat') lat += delta; else lng += delta;
    }
    out.push([lng / 1e6, lat / 1e6]);
  }
  return out;
}

function walkMinutes(r) { return Math.max(1, Math.round(r.t / 60)); }

function routeLinePaint() {
  const dark = isDarkTheme();
  return {
    casing: { 'line-color': dark ? '#0f1116' : '#ffffff', 'line-width': 7, 'line-opacity': 0.85 },
    line: { 'line-color': dark ? '#ff5468' : '#e21833', 'line-width': 4 }
  };
}

// The route renders beneath the 3D building extrusions so it hugs the
// ground instead of floating over roofs.
function ensureRouteLayers(map) {
  if (!map?.getStyle()) return;
  try {
    if (!map.getSource(ROUTE_SRC)) {
      map.addSource(ROUTE_SRC, { type: 'geojson', data: EMPTY_FC });
    }
    const beforeId = map.getStyle().layers.find(l => l.type === 'fill-extrusion')?.id;
    const paint = routeLinePaint();
    const layout = { 'line-cap': 'round', 'line-join': 'round' };
    if (!map.getLayer(ROUTE_CASING)) {
      map.addLayer({ id: ROUTE_CASING, type: 'line', source: ROUTE_SRC, layout, paint: paint.casing }, beforeId);
    }
    if (!map.getLayer(ROUTE_LINE)) {
      map.addLayer({ id: ROUTE_LINE, type: 'line', source: ROUTE_SRC, layout, paint: paint.line }, beforeId);
    }
    for (const [k, v] of Object.entries(paint.casing)) map.setPaintProperty(ROUTE_CASING, k, v);
    for (const [k, v] of Object.entries(paint.line)) map.setPaintProperty(ROUTE_LINE, k, v);
  } catch (e) {
    console.warn('walk route layers:', e);
  }
}

// Re-adds the route after a style reload (theme toggle wipes all layers).
function restoreWalkRoute(map) {
  if (map !== campusMap || !directionsDorm || !activeWalkDest) return;
  const r = walkRoutes?.[`${directionsDorm.id}|${activeWalkDest}`];
  if (!r) return;
  ensureRouteLayers(map);
  map.getSource(ROUTE_SRC)?.setData({
    type: 'Feature', properties: {},
    geometry: { type: 'LineString', coordinates: decodePolyline6(r.p) }
  });
}

function setDirectionsCollapsed(collapsed) {
  const panel = document.getElementById('mapDirections');
  panel.classList.toggle('collapsed', collapsed);
  const btn = document.getElementById('mapDirectionsCollapse');
  btn.setAttribute('aria-expanded', String(!collapsed));
  btn.setAttribute('aria-label', collapsed ? 'Expand walk times' : 'Collapse walk times');
}

let directionsToggleWired = false;
function wireDirectionsToggle() {
  if (directionsToggleWired) return;
  directionsToggleWired = true;
  // The whole head is a toggle target (easier to hit than the chevron),
  // except the close button.
  document.querySelector('#mapDirections .map-directions-head').addEventListener('click', e => {
    if (e.target.closest('.map-directions-close')) return;
    setDirectionsCollapsed(!document.getElementById('mapDirections').classList.contains('collapsed'));
  });
}

async function openDirections(d) {
  const changed = directionsDorm?.id !== d.id;
  directionsDorm = d;
  if (changed && activeWalkDest) clearWalkRoute();
  wireDirectionsToggle();
  document.getElementById('mapDirectionsTitle').textContent = d.name;
  document.getElementById('mapDirections').hidden = false;
  // Phones: the full landmark list would cover most of the map, so the
  // panel opens as just its header until tapped.
  if (changed) setDirectionsCollapsed(sheetMedia.matches);
  renderDirectionsList();
  if (walkRoutes === undefined) {
    await loadWalkRoutes();
    if (directionsDorm === d) renderDirectionsList();
  }
}

// Rows to show for a dorm: per category, the closest landmark by walking
// time — or all of them (nearest first) for showAll kinds like rec.
function walkRowsFor(dormId) {
  const rows = [];
  for (const [kind, label, showAll] of landmarkKinds) {
    const matches = landmarks
      .filter(lm => lm.kind === kind)
      .map(lm => ({ lm, r: walkRoutes?.[`${dormId}|${lm.id}`], label }))
      .filter(x => x.r)
      .sort((a, b) => a.r.t - b.r.t);
    rows.push(...(showAll ? matches : matches.slice(0, 1)));
  }
  return rows;
}

function renderDirectionsList() {
  const list = document.getElementById('mapDirectionsList');
  if (!directionsDorm) return;
  if (walkRoutes === null) {
    list.innerHTML = '<p class="map-directions-empty">Walk times are unavailable right now.</p>';
    return;
  }
  if (walkRoutes === undefined) {
    list.innerHTML = landmarkKinds.map(([, label]) => `
      <div class="map-directions-row" aria-hidden="true">
        <span class="map-directions-name"><span class="map-directions-kind">${label}</span>…</span>
      </div>`).join('');
    return;
  }
  list.innerHTML = walkRowsFor(directionsDorm.id).map(({ lm, r, label }) => `
      <button type="button" class="map-directions-row ${activeWalkDest === lm.id ? 'active' : ''}"
              data-dest="${lm.id}">
        <span class="map-directions-name">
          <span class="map-directions-kind">${label}</span>
          ${escHtml(lm.short)}
        </span>
        <span class="map-directions-eta">${walkMinutes(r)} min</span>
      </button>`).join('');

  list.querySelectorAll('button.map-directions-row').forEach(btn => {
    btn.addEventListener('click', () => {
      const lm = landmarks.find(l => l.id === btn.dataset.dest);
      const r = lm && walkRoutes?.[`${directionsDorm.id}|${lm.id}`];
      if (!r) return;
      if (activeWalkDest === lm.id) clearWalkRoute();
      else drawWalkRoute(directionsDorm, lm, r);
      renderDirectionsList();
    });
  });
}

function drawWalkRoute(d, lm, r) {
  activeWalkDest = lm.id;
  ensureRouteLayers(campusMap);
  const coords = decodePolyline6(r.p);
  campusMap.getSource(ROUTE_SRC)?.setData({
    type: 'Feature', properties: {},
    geometry: { type: 'LineString', coordinates: coords }
  });

  routeDestMarker?.remove();
  const el = document.createElement('div');
  el.className = 'map-marker route-dest-marker';
  el.innerHTML = `
    <div class="map-marker-pill">
      <span class="map-marker-name">${escHtml(lm.short)}</span>
      <span class="map-marker-sub">${walkMinutes(r)} min walk</span>
    </div>`;
  routeDestMarker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
    .setLngLat([lm.lng, lm.lat]).addTo(campusMap);

  const bounds = new maplibregl.LngLatBounds([d.lng, d.lat], [d.lng, d.lat]);
  coords.forEach(c => bounds.extend(c));
  bounds.extend([lm.lng, lm.lat]);
  const padding = sheetMedia.matches
    ? { top: 200, bottom: 220, left: 40, right: 40 }
    : { top: 100, bottom: 80, left: 330, right: 80 };
  campusMap.fitBounds(bounds, { padding, maxZoom: 17, pitch: 50, bearing: -17, duration: 900 });
}

function clearWalkRoute() {
  activeWalkDest = null;
  routeDestMarker?.remove();
  routeDestMarker = null;
  campusMap?.getSource(ROUTE_SRC)?.setData(EMPTY_FC);
}

function closeDirections() {
  clearWalkRoute();
  directionsDorm = null;
  document.getElementById('mapDirections').hidden = true;
}

// Custom control (bottom-left): map key explaining the building colors and
// route line, with the marker-pill toggle at the bottom. The toggle works
// via a class on the map container so it applies to markers added later.
function addMapKey(map) {
  const container = document.createElement('div');
  container.className = 'maplibregl-ctrl map-key';
  container.innerHTML = `
    <div class="map-key-title">Key</div>
    <div class="map-key-row"><span class="map-key-swatch north"></span>North Campus</div>
    <div class="map-key-row"><span class="map-key-swatch south"></span>South Campus</div>
    <div class="map-key-row"><span class="map-key-swatch commons"></span>The Commons</div>
    <div class="map-key-row"><span class="map-key-line"></span>Walking route</div>
    <button type="button" class="map-labels-toggle" aria-pressed="false">Hide labels</button>`;
  const btn = container.querySelector('.map-labels-toggle');
  btn.addEventListener('click', () => {
    const hidden = map.getContainer().classList.toggle('map-labels-hidden');
    btn.textContent = hidden ? 'Show labels' : 'Hide labels';
    btn.setAttribute('aria-pressed', String(hidden));
  });
  map.addControl({ onAdd: () => container, onRemove: () => container.remove() }, 'bottom-left');
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
      revealMapCard(d.id);
    });
    const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([d.lng, d.lat]).addTo(campusMap);
    campusMarkerById[d.id] = { marker, el };
  });
}

function clearCampusMarkers() {
  Object.values(campusMarkerById).forEach(({ marker }) => marker.remove());
  campusMarkerById = {};
}

// MapLibre markers have no altitude support, so lift each pill to its dorm's
// roof by hand: project the roof point (ground point + building height) with
// the map's own 3D matrix and apply the pixel delta as the marker offset.
// transform.coordinatePoint(coord, elevationMeters) is what MapLibre itself
// uses to place markers on terrain; version is pinned to 4.7.1.
function liftMarkersToRoofs() {
  const t = campusMap?.transform;
  if (!t?.coordinatePoint) return;
  for (const [id, { marker }] of Object.entries(campusMarkerById)) {
    const h = dormRoofHeight[id];
    if (!h) continue;
    const ll = marker.getLngLat();
    const ground = campusMap.project(ll);
    const roof = t.coordinatePoint(maplibregl.MercatorCoordinate.fromLngLat(ll), h + 1.2);
    marker.setOffset([roof.x - ground.x, roof.y - ground.y]);
  }
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
      <button class="map-card-open" type="button">Open</button>
    </div>`;
}

function renderMapSidebar(query = '') {
  const q = query.trim().toLowerCase();
  const shown = mapDorms.filter(d => matchesSearch(d, q));
  const shownIds = new Set(shown.map(d => d.id));

  const list = document.getElementById('mapSidebarList');
  list.innerHTML = shown.length
    ? shown.map(mapCardHTML).join('')
    : '<p class="no-results" style="padding:20px 4px">No housing matches your search.</p>';

  list.querySelectorAll('.map-card').forEach(card => {
    const id = card.dataset.id;
    card.addEventListener('mouseenter', () => setMapActive(id, true));
    card.addEventListener('mouseleave', () => setMapActive(id, false));
    // Click a sidebar card -> fly to the dorm on the map and select it;
    // the Open button on the selected card goes to the detail page.
    card.addEventListener('click', () => {
      const d = mapDorms.find(x => x.id === id);
      if (!d) return;
      campusMap.flyTo({ center: [d.lng, d.lat], zoom: 17.5, pitch: 50, bearing: -17, duration: 900 });
      selectMapDorm(id);
    });
    card.querySelector('.map-card-open').addEventListener('click', e => {
      e.stopPropagation();
      showDetail(id);
    });
    if (id === selectedMapId) card.classList.add('marker-selected');
  });

  Object.entries(campusMarkerById).forEach(([id, { el }]) => {
    el.style.display = shownIds.has(id) ? '' : 'none';
  });

  // Keep the 3D dorm buildings in sync with the sidebar filter/search.
  dormLayerFilter = ['in', ['get', 'dormId'], ['literal', [...shownIds]]];
  if (campusMap?.getLayer(DORM_LAYER)) campusMap.setFilter(DORM_LAYER, dormLayerFilter);
}

function filterMapSidebar() { renderMapSidebar(document.getElementById('mapSearchInput').value); }

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
  // Drags are wired to the whole sheet, not just the handle, so any swipe
  // on the peeking card pulls it up. When the sheet is open, drags starting
  // in the list are ignored so the list itself can scroll.
  sheet.addEventListener('pointerdown', e => {
    if (!sheetMedia.matches) return;
    if (sheet.classList.contains('sheet-open') && e.target.closest('.map-sidebar-list')) return;
    startY = e.clientY; startT = currentT();
    sheet.classList.add('sheet-dragging');
    sheet.setPointerCapture(e.pointerId);
  });
  sheet.addEventListener('pointermove', e => {
    if (startY === null) return;
    const t = Math.max(0, Math.min(sheetPeekOffset(sheet), startT + (e.clientY - startY)));
    sheet.style.transform = `translateY(${t}px)`;
  });
  sheet.addEventListener('pointerup', e => {
    if (startY === null) return;
    sheet.classList.remove('sheet-dragging');
    const moved = Math.abs(e.clientY - startY);
    if (moved < 6) {
      // A tap toggles only on the grab handle; taps elsewhere must reach
      // the search box and filter buttons untouched.
      if (e.target.closest('.map-sheet-handle')) setSheetOpen(!sheet.classList.contains('sheet-open'));
      else setSheetOpen(sheet.classList.contains('sheet-open'));
    } else {
      setSheetOpen(currentT() < sheetPeekOffset(sheet) / 2);
    }
    startY = null;
  });
  sheet.addEventListener('pointercancel', () => {
    if (startY === null) return;
    sheet.classList.remove('sheet-dragging');
    setSheetOpen(currentT() < sheetPeekOffset(sheet) / 2);
    startY = null;
  });
}

function initMap() {
  mapDorms = dorms.filter(d => d.campus === 'on' && d.lat && d.lng);
  if (!campusMap) {
    campusMap = createCampusMap('mapFrame', [-76.9440, 38.9875], 14.5);
    addMapKey(campusMap);
    // 'render' fires every drawn frame, so the pills track the roofs through
    // pans, zooms, and pitch changes (and pick up heights as tiles load).
    campusMap.on('render', liftMarkersToRoofs);
    window.__campusMap = campusMap; // console/debug access
    wireDormBuildingEvents(campusMap);
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
 * Misc                                                               *
 * ------------------------------------------------------------------ */
function closeNav() {
  document.getElementById('navLinks').classList.remove('open');
  document.getElementById('navToggle').classList.remove('open');
  document.body.classList.remove('nav-open');
}

// Slot-machine reel on the hero subhead. The track steps through every word
// at a constant pixel pitch while the easing does the deceleration, so the
// spin whirls fast and coasts onto the final word ("home").
function startWordReel() {
  const reel = document.getElementById('wordReel');
  const track = document.getElementById('wordReelTrack');
  if (!reel || !track) return;

  const words = Array.from(track.children);
  const last = words.length - 1;
  if (last < 1) return;

  // Measure after the webfont resolves: Manrope loads async, and widths taken
  // against the fallback face would leave the reel the wrong size.
  const spin = () => {
    const step = words[0].getBoundingClientRect().height;
    const widths = words.map(w => w.getBoundingClientRect().width);
    const widest = Math.max.apply(null, widths);

    // Hold the box at the widest word for the whole spin and let
    // .reel--sized centre each cell inside it, so the sentence cannot
    // re-centre on every step the way a self-sizing reel would.
    reel.style.height = step + 'px';
    reel.style.width = widest + 'px';
    reel.classList.add('reel--sized');

    // Once it lands, close the box down to the final word so "home." sits
    // tight in the sentence instead of floating in a slot cut for "single.".
    const settle = (glide) => {
      track.style.transform = 'translateY(' + (-last * step) + 'px)';
      if (glide) reel.style.transition = 'width 420ms cubic-bezier(0.22, 0.61, 0.36, 1)';
      reel.style.width = widths[last] + 'px';
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      settle(false);
      return;
    }

    const spinning = track.animate(
      [{ transform: 'translateY(0)' },
       { transform: 'translateY(' + (-last * step) + 'px)' }],
      {
        duration: 2800,
        delay: 350,
        // Fast off the line, long coast into the stop.
        easing: 'cubic-bezier(0.11, 0.78, 0.18, 1)',
        fill: 'forwards'
      }
    );

    // Hand the final state back to inline styles so it survives the
    // animation being garbage-collected.
    spinning.finished.then(() => settle(true)).catch(() => {});
  };

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(spin);
  } else {
    spin();
  }
}

// Expose handlers for inline onclick attributes (ES module scope isn't global).
// Inline onclick attributes resolve against window, but this is a module.
Object.assign(window, {
  showSection, showDetail, toggleSaved,
  filterDorms, toggleChip, setAllFilter, selectSort,
  closeNav, filterMapSidebar, toggleMapSidebar, closeDirections
});

document.addEventListener('DOMContentLoaded', () => {
  dorms.forEach(d => { d.reviewList = []; });
  restoreFilters();
  renderDorms();
  // Other pages link to index.html#map — honor the hash on arrival.
  if (location.hash === '#map') showSection('map');
  showReviewsLoading();
  loadAllReviews();
  setupReviewsListener();
  startWordReel();
});

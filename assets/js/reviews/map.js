// Sidebar mini-map and the walk-time rows that draw routes on it.
import { dorm, PREVIEW_VIEW } from './config.js';
import { landmarks, landmarkKinds } from '../data.js';
import { escHtml, decodePolyline6 } from './util.js';

// Built once — unlike the other sidebar cards it doesn't depend on review
// data, so no re-render needed.
let previewMap = null;

export function renderMapPreview() {
  const card = document.getElementById('mapCard');
  if (!dorm.lat || !dorm.lng || typeof maplibregl === 'undefined') { card.hidden = true; return; }
  card.hidden = false;
  previewMap = new maplibregl.Map({
    container: 'mapPreview',
    style: 'https://tiles.openfreemap.org/styles/liberty',
    center: [dorm.lng, dorm.lat],
    ...PREVIEW_VIEW,
    interactive: false,
    attributionControl: false
  });
  new maplibregl.Marker({ color: '#E21833' }).setLngLat([dorm.lng, dorm.lat]).addTo(previewMap);
  previewMap.on('load', () => {
    previewMap.addSource('walk-route', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    const layout = { 'line-cap': 'round', 'line-join': 'round' };
    previewMap.addLayer({ id: 'walk-route-casing', type: 'line', source: 'walk-route', layout, paint: { 'line-color': '#ffffff', 'line-width': 6, 'line-opacity': 0.9 } });
    previewMap.addLayer({ id: 'walk-route-line', type: 'line', source: 'walk-route', layout, paint: { 'line-color': '#e21833', 'line-width': 3.5 } });
  });
}

/* ------------------------------------------------------------------ *
 * Walk times (precomputed routes to dining halls + campus landmarks; *
 * regenerate with tools/build-routes.mjs)                            *
 * ------------------------------------------------------------------ */
let walkRoutes = null;
let activeWalkDest = null;
let walkDestMarker = null;

export async function renderWalkTimes() {
  const wrap = document.getElementById('walkTimes');
  if (!previewMap) return;
  try {
    const res = await fetch('assets/data/walk-routes.json');
    walkRoutes = res.ok ? (await res.json()).routes : null;
  } catch { walkRoutes = null; }
  if (!walkRoutes) return; // card just keeps the plain mini-map

  // One row per category (nearest landmark by walk time), except showAll
  // kinds like rec, which list every option nearest-first.
  const rows = landmarkKinds.flatMap(([kind, label, showAll]) => {
    const matches = landmarks
      .filter(lm => lm.kind === kind)
      .map(lm => ({ lm, r: walkRoutes[`${dorm.id}|${lm.id}`] }))
      .filter(x => x.r)
      .sort((a, b) => a.r.t - b.r.t);
    return (showAll ? matches : matches.slice(0, 1)).map(({ lm, r }) => `
      <button type="button" class="td-walk-row" data-dest="${lm.id}" title="Preview the walking route">
        <span class="td-walk-name">
          <span class="td-walk-kind">${label}</span>
          ${escHtml(lm.short)}
        </span>
        <span class="td-walk-eta">${Math.max(1, Math.round(r.t / 60))} min</span>
      </button>`);
  }).join('');
  if (!rows) return;

  wrap.innerHTML = `<div class="td-walk-title">Walk times</div>${rows}`;
  wrap.hidden = false;
  wrap.querySelectorAll('.td-walk-row').forEach(btn =>
    btn.addEventListener('click', () => toggleWalkRoute(btn.dataset.dest)));
}

// Click a row: draw that route on the mini-map and zoom to fit it.
// Click it again: clear the route and return to the resting view.
function toggleWalkRoute(destId) {
  const lm = landmarks.find(l => l.id === destId);
  const r = walkRoutes?.[`${dorm.id}|${destId}`];
  const src = previewMap?.getSource('walk-route');
  if (!lm || !r || !src) return;

  if (activeWalkDest === destId) {
    activeWalkDest = null;
    src.setData({ type: 'FeatureCollection', features: [] });
    walkDestMarker?.remove();
    walkDestMarker = null;
    previewMap.easeTo({ center: [dorm.lng, dorm.lat], ...PREVIEW_VIEW, duration: 700 });
  } else {
    activeWalkDest = destId;
    const coords = decodePolyline6(r.p);
    src.setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } });
    walkDestMarker?.remove();
    walkDestMarker = new maplibregl.Marker({ color: '#d9a300', scale: 0.8 })
      .setLngLat([lm.lng, lm.lat]).addTo(previewMap);
    const bounds = new maplibregl.LngLatBounds([dorm.lng, dorm.lat], [dorm.lng, dorm.lat]);
    coords.forEach(c => bounds.extend(c));
    bounds.extend([lm.lng, lm.lat]);
    previewMap.fitBounds(bounds, { padding: 30, maxZoom: 16.5, pitch: PREVIEW_VIEW.pitch, bearing: PREVIEW_VIEW.bearing, duration: 700 });
  }

  document.querySelectorAll('.td-walk-row').forEach(b =>
    b.classList.toggle('active', b.dataset.dest === activeWalkDest));
}

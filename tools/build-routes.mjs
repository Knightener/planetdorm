// Precomputes walking routes + ETAs from every on-campus dorm to each campus
// landmark (dining halls, Stamp, McKeldin, Eppley) and writes them to
// assets/data/walk-routes.json. Run whenever dorms/landmarks change:
//
//   node tools/build-routes.mjs
//
// Routing: Valhalla public server (FOSSGIS, OpenStreetMap data), pedestrian
// costing. Shapes are kept as encoded polylines (precision 6) and decoded
// client-side, which keeps the JSON ~5x smaller than raw coordinates.
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dorms, landmarks } from '../assets/js/data.js';

const VALHALLA_URL = 'https://valhalla1.openstreetmap.de/route';
const DELAY_MS = 500; // stay well under the public server's 1 req/s guidance
const OUT_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'data', 'walk-routes.json');

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchRoute(from, to, attempt = 1) {
  const body = {
    locations: [
      { lat: from.lat, lon: from.lng },
      { lat: to.lat, lon: to.lng }
    ],
    costing: 'pedestrian',
    units: 'kilometers'
  };
  const res = await fetch(VALHALLA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    if (attempt <= 3 && (res.status === 429 || res.status >= 500)) {
      await sleep(2000 * attempt);
      return fetchRoute(from, to, attempt + 1);
    }
    throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const trip = (await res.json()).trip;
  return {
    t: Math.round(trip.summary.time),          // seconds
    m: Math.round(trip.summary.length * 1000), // meters
    p: trip.legs[0].shape                      // encoded polyline, precision 6
  };
}

// Incremental: keep routes already in the output file (delete stale keys for
// removed dorms/landmarks) and only fetch pairs that are missing. Delete the
// JSON, or specific keys in it, to force a refetch.
const origins = dorms.filter(d => d.campus === 'on' && d.lat && d.lng);
const validKeys = new Set(origins.flatMap(d => landmarks.map(lm => `${d.id}|${lm.id}`)));
let routes = {};
try {
  const existing = JSON.parse(await readFile(OUT_PATH, 'utf8')).routes || {};
  routes = Object.fromEntries(Object.entries(existing).filter(([k]) => validKeys.has(k)));
} catch { /* no existing file — full build */ }

const missing = [...validKeys].filter(k => !routes[k]);
const failures = [];
let done = 0;

console.log(`${validKeys.size} route pairs; ${Object.keys(routes).length} cached, fetching ${missing.length}...`);

for (const key of missing) {
  const [dormId, lmId] = key.split('|');
  const dorm = origins.find(d => d.id === dormId);
  const lm = landmarks.find(l => l.id === lmId);
  try {
    routes[key] = await fetchRoute(dorm, lm);
  } catch (err) {
    failures.push(key);
    console.error(`  FAILED ${key}: ${err.message}`);
  }
  done++;
  if (done % 24 === 0) console.log(`  ${done}/${missing.length}`);
  await sleep(DELAY_MS);
}

const out = {
  generated: new Date().toISOString().slice(0, 10),
  source: 'Valhalla (valhalla1.openstreetmap.de), pedestrian costing, OpenStreetMap data',
  shape: 'polyline6',
  routes
};

await mkdir(dirname(OUT_PATH), { recursive: true });
await writeFile(OUT_PATH, JSON.stringify(out));
console.log(`Wrote ${Object.keys(routes).length}/${validKeys.size} routes to ${OUT_PATH}`);
if (failures.length) {
  console.error(`${failures.length} routes failed: ${failures.join(', ')}`);
  process.exitCode = 1;
}

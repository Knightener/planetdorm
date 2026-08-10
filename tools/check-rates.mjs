// Flags when UMD's published rates drift from the grid hardcoded in
// assets/js/data.js. Browsers can't fetch reslife.umd.edu directly (no CORS
// headers), so the numbers ship with the site and this runs manually:
//   node tools/check-rates.mjs
// It scrapes every dollar figure off the rates page and reports any value in
// our table that no longer appears there. Re-read the page and update
// rateTable + RATE_YEAR by hand when it complains.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataSrc = readFileSync(join(root, 'assets/js/data.js'), 'utf8');

const sourceUrl = dataSrc.match(/RATE_SOURCE\s*=\s*'([^']+)'/)?.[1];
const rateYear = dataSrc.match(/RATE_YEAR\s*=\s*'([^']+)'/)?.[1];
const tableSrc = dataSrc.match(/const rateTable = \{[\s\S]*?\n\};/)?.[0];
if (!sourceUrl || !tableSrc) {
  console.error('Could not find RATE_SOURCE / rateTable in assets/js/data.js.');
  process.exit(1);
}

const ours = [...tableSrc.matchAll(/: (\d{4,6})[,\s}]/g)].map(m => Number(m[1]));
const unique = [...new Set(ours)].sort((a, b) => a - b);

const res = await fetch(sourceUrl, { headers: { 'user-agent': 'planet-dorm-rate-check' } });
if (!res.ok) {
  console.error(`Fetch failed: ${res.status} ${res.statusText}`);
  process.exit(1);
}
const html = await res.text();
const theirs = new Set(
  [...html.matchAll(/\$\s?([\d,]{5,9})/g)].map(m => Number(m[1].replace(/,/g, '')))
);

const missing = unique.filter(n => !theirs.has(n));
console.log(`Checked ${unique.length} rates for ${rateYear} against ${sourceUrl}`);
if (!missing.length) {
  console.log('All current. No changes needed.');
} else {
  console.log(`\n${missing.length} rate(s) no longer on the page:`);
  for (const n of missing) console.log('  $' + n.toLocaleString('en-US'));
  console.log('\nOpen the page and refresh rateTable / RATE_YEAR in assets/js/data.js.');
  process.exitCode = 1;
}

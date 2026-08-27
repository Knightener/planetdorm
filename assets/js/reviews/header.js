// Everything above and beside the review list: the gallery, the title
// header, and the two data-driven sidebar cards.
import { dorm, meta } from './config.js';
import { formatRates, RATE_YEAR, RATE_SOURCE } from '../data.js';
import { escHtml, starsHTML, periodLabel, areaBadge } from './util.js';
import { state, helpfulCount, updateSaveBtn } from './state.js';

/* ------------------------------------------------------------------ *
 * Static sections (gallery + header shell)                           *
 * ------------------------------------------------------------------ */
// Placeholder cells ([ room ], [ lounge ], …) are gone until we have real
// photos: show just the exterior shot, or hide the gallery entirely.
export function renderGallery() {
  const img = dorm.imgs?.[0] || '';
  const gallery = document.getElementById('gallery');
  if (!img) { gallery.hidden = true; return; }
  gallery.innerHTML =
    `<div class="cell hero photo" style="background-image:url('${img}')" onclick="openLightbox('${img.replace(/'/g, "\\'")}')" role="img" aria-label="${escHtml(dorm.name)}"></div>`;
}

// Pull-quote from the review with the most helpful votes, shown in the
// otherwise-empty gallery cells beside the hero photo.
export function renderHeroQuote() {
  const gallery = document.getElementById('gallery');
  let cell = document.getElementById('heroQuote');
  const best = [...state.reviews]
    .filter(r => (r.text || '').trim())
    .sort((a, b) =>
      helpfulCount(b) - helpfulCount(a) || new Date(b.created_at) - new Date(a.created_at))[0];
  if (gallery.hidden || !best) { cell?.remove(); return; }
  if (!cell) {
    cell = document.createElement('div');
    cell.id = 'heroQuote';
    cell.className = 'cell quote';
    gallery.appendChild(cell);
  }
  let text = best.text.trim().replace(/\s+/g, ' ');
  if (text.length > 300) text = text.slice(0, 300).replace(/\s+\S*$/, '') + '…';
  const votes = helpfulCount(best);
  const who = [
    best.name || 'Anonymous Terp',
    best.year ? `lived here ${periodLabel(best.year)}` : null
  ].filter(Boolean).join(', ');
  cell.innerHTML = `
    <p class="hq-text">“${escHtml(text)}”</p>
    <div class="hq-meta">${escHtml(who)}${votes ? ` · 👍 ${votes}` : ''}</div>`;
}

// "Community & single all-gender bathrooms" becomes one chip per type.
function bathroomAmenities() {
  const str = dorm.bathrooms || '';
  const out = [];
  if (/community/i.test(str)) out.push({ t: 'Community bathrooms' });
  if (/single/i.test(str)) out.push({ t: 'Single all-gender bathrooms' });
  return out.length ? out : (str ? [{ t: str }] : []);
}

// Shared bathrooms get two toilets/showers, private singles get one.
function withBathroomEmoji(label) {
  if (/^community bath/i.test(label)) return `🚽🚽🚿🚿 ${label}`;
  if (/^single all-gender/i.test(label)) return `🚽🚿 ${label}`;
  return label;
}

function fallbackAmenities() {
  const out = [dorm.ac ? { t: '❄ AC', c: 'good' } : null, ...bathroomAmenities()];
  dorm.tags?.forEach(t => { if (t.t !== 'A/C') out.push(t); });
  return out.filter(Boolean);
}

// Category for a feature chip: data.js tags carry it as `c`; editorial
// amenity strings (DORM_META) are classified by wording.
function amenityClass(label, c) {
  if (c) return ['good', 'bad', 'honors'].includes(c) ? c : '';
  if (/^no /i.test(label)) return 'bad';
  if (/llp|honors|scholars|gemstone/i.test(label)) return 'honors';
  if (/a\/c|❄|laundry|elevator/i.test(label)) return 'good';
  return '';
}

export function renderHeader() {
  const count = state.reviews.length;
  const avg = count ? state.reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  const amenities = meta.amenities || fallbackAmenities();
  const priceHtml = meta.price
    ? ` · <strong>${meta.price}</strong>/semester (${meta.priceRoom || 'double'})` : '';
  document.getElementById('dormHeader').innerHTML = `
    <div class="td-header-left">
      <div class="td-title-row">
        <h1>${escHtml(dorm.name)}</h1>
        <span class="td-badge">${escHtml(areaBadge(dorm))}</span>
        <button id="saveDormBtn" class="td-save" type="button" aria-pressed="false" onclick="toggleSaved()">
          <svg width="15" height="15" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          <span>Save</span>
        </button>
      </div>
      <div class="td-amenities">${amenities.map(a => {
        const label = a.t || a;
        return `<span class="td-amenity ${amenityClass(label, a.c)}">${escHtml(withBathroomEmoji(label))}</span>`;
      }).join('')}</div>
    </div>
    <div class="td-score">
      ${count ? `<div class="td-score-row">
        <span class="td-score-num">${avg.toFixed(1)}</span>
        <span class="td-score-stars">${starsHTML(avg, 20)}</span>
      </div>` : ''}
      <div class="td-score-meta">${count} review${count === 1 ? '' : 's'}${priceHtml}</div>
    </div>`;
  updateSaveBtn();
  document.title = `${dorm.name} Dorm Reviews`;
}

/* ------------------------------------------------------------------ *
 * Sidebar                                                            *
 * ------------------------------------------------------------------ */
export function renderBreakdown() {
  const card = document.getElementById('breakdownCard');
  if (!meta.categoryScores) { card.hidden = true; return; }
  const rows = meta.categoryScores.map(([label, score]) => `
    <div class="bd-row">
      <span class="bd-label">${escHtml(label)}</span>
      <div class="bd-track"><div class="bd-fill" style="width:${(score / 5 * 100).toFixed(0)}%"></div></div>
      <span class="bd-score">${score.toFixed(1)}</span>
    </div>`).join('');
  const recs = state.reviews.filter(r => r.rating >= 4).length;
  const pct = state.reviews.length ? Math.round(recs / state.reviews.length * 100) : null;
  const shortName = dorm.name.replace(/ Hall$/, '');
  card.hidden = false;
  card.innerHTML = `
    <div class="td-card-title">Rating breakdown</div>
    <div class="bd-rows">${rows}</div>
    ${pct !== null ? `<div class="bd-foot">${pct}% of residents would recommend ${escHtml(shortName)} to an incoming freshman.</div>` : ''}`;
}

// "At a glance" facts card. Carries the info that used to live in the
// subline under the dorm name (type, dining, built) as label/value rows;
// an editorial subline (DORM_META) becomes the card's footnote.
export function renderGlance() {
  const card = document.getElementById('glanceCard');
  const dining = (dorm.dining || '').replace(' Dining Hall', '');
  const rates = formatRates(dorm);
  const rows = [
    ['Building Type', dorm.type],
    ['Dining', dining],
    ['Built', dorm.built],
    [`Rate (${RATE_YEAR})`, rates]
  ].filter(([, v]) => v);
  if (!rows.length && !meta.subline) { card.hidden = true; return; }
  card.hidden = false;
  card.innerHTML = `
    <div class="glance-title">Dorm Details</div>
    <div class="glance-rows">
      ${rows.map(([k, v]) => `
        <div class="glance-row">
          <span class="glance-label">${k}</span>
          <span class="glance-value">${escHtml(String(v))}</span>
        </div>`).join('')}
    </div>
    ${rates ? `<div class="glance-foot">Academic year, room only; dining billed separately. Exact price depends on room type and assignment. <a href="${RATE_SOURCE}" target="_blank" rel="noopener">UMD rates</a></div>` : ''}
    ${meta.subline ? `<div class="glance-foot">${escHtml(meta.subline)}</div>` : ''}`;
}

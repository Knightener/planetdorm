// Pure formatting helpers and the page's toast. No page state, no imports —
// safe for any other reviews module to pull in without creating a cycle.

export function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function starsHTML(rating, size) {
  const full = Math.round(rating);
  return `<span style="font-size:${size}px;letter-spacing:${size >= 20 ? 2 : 1}px;color:var(--td-star)">${'★'.repeat(full)}<span class="star-empty">${'★'.repeat(5 - full)}</span></span>`;
}

// "2024-2025" -> "2024-25"
export function periodLabel(year) {
  const m = /^(\d{4})-(\d{4})$/.exec(year || '');
  return m ? `${m[1]}-${m[2].slice(2)}` : (year || '');
}

export function areaBadge(d) {
  if (d.area === 'north') return 'North Campus';
  if (d.area === 'south') return 'South Campus';
  return 'The Commons';
}

// The last `count` academic years, newest first. The academic year rolls
// over in August.
export function academicYears(count) {
  const now = new Date();
  const startYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  const arr = [];
  for (let y = startYear; y > startYear - count; y--) arr.push(`${y}-${y + 1}`);
  return arr;
}

// Decode an encoded polyline (precision 6, Valhalla's default) to
// [lng, lat] pairs.
export function decodePolyline6(str) {
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

let _toastTimer = null;

export function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `td-toast show${type === 'error' ? ' error' : ''}`;
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}

/* ------------------------------------------------------------------ *
 * Graceful degradation for Supabase outages. Data pages call         *
 * reportOutage(retryFn) when a query fails: a slim banner tells the  *
 * user reviews are unavailable while the rest of the page keeps      *
 * working. The module polls the server (with jitter, so waking       *
 * clients don't stampede it) and, once it responds, removes the      *
 * banner and re-runs each page's loader to fill data in place.       *
 * ------------------------------------------------------------------ */

const SUPABASE_URL = 'https://qqbfiwixlqsnjsmwirtf.supabase.co';
// The anon key is public by design; writes are blocked by RLS.
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxYmZpd2l4bHFzbmpzbXdpcnRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5Mjc2OTEsImV4cCI6MjA5MTUwMzY5MX0.Qy2_QBt4l2uRPiLQIKAaao4gNwZf0bkniUob9EtBXMY';
const PROBE_URL = `${SUPABASE_URL}/rest/v1/reviews?select=dormId&limit=1`;

const PROBE_TIMEOUT = 5_000;  // paused free-tier projects hang, so abort hard

const retryCallbacks = [];
let polling = false;

function bannerEl() {
  let el = document.getElementById('outageBanner');
  if (!el) {
    el = document.createElement('div');
    el.id = 'outageBanner';
    el.setAttribute('role', 'status');
    el.style.cssText = 'display:none;position:fixed;left:0;right:0;bottom:0;z-index:9000;background:var(--logo-gold);color:#1a1a1a;font-size:0.9rem;font-weight:600;text-align:center;padding:10px 44px;';
    el.innerHTML = `
      <span>Ratings and reviews are temporarily unavailable. The rest of the site still works; we will reconnect automatically.</span>
      <button aria-label="Dismiss" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;font-size:1.2rem;line-height:1;cursor:pointer;color:inherit;">&times;</button>`;
    el.querySelector('button').addEventListener('click', () => { el.style.display = 'none'; });
    document.body.appendChild(el);
  }
  return el;
}

async function probe() {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT);
  try {
    const res = await fetch(PROBE_URL, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
      signal: ctrl.signal
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function scheduleProbe() {
  // 15-30 s with jitter so recovering clients don't all hit the DB at once.
  setTimeout(async () => {
    if (await probe()) {
      polling = false;
      bannerEl().remove();
      const retries = retryCallbacks.splice(0);
      retries.forEach(fn => fn());
    } else {
      scheduleProbe();
    }
  }, 15_000 + Math.random() * 15_000);
}

/* Call when a Supabase query fails. retryFn (optional) is re-run once the
 * server responds again, so the page can load its data without a refresh. */
export function reportOutage(retryFn) {
  if (typeof retryFn === 'function' && !retryCallbacks.includes(retryFn)) {
    retryCallbacks.push(retryFn);
  }
  bannerEl().style.display = 'block';
  if (!polling) {
    polling = true;
    scheduleProbe();
  }
}

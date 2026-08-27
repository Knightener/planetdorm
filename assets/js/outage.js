/* ------------------------------------------------------------------ *
 * Graceful degradation for Supabase outages. Data pages call         *
 * reportOutage(retryFn) when a query fails: a modal explains that    *
 * reviews are unavailable while the rest of the page keeps working.  *
 * The module polls the server (with jitter, so waking clients don't  *
 * stampede it) and, once it responds, dismisses the modal and        *
 * re-runs each page's loader to fill data in place.                  *
 * ------------------------------------------------------------------ */

const SUPABASE_URL = 'https://qqbfiwixlqsnjsmwirtf.supabase.co';
// The anon key is public by design; writes are blocked by RLS.
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxYmZpd2l4bHFzbmpzbXdpcnRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5Mjc2OTEsImV4cCI6MjA5MTUwMzY5MX0.Qy2_QBt4l2uRPiLQIKAaao4gNwZf0bkniUob9EtBXMY';
const PROBE_URL = `${SUPABASE_URL}/rest/v1/reviews?select=dormId&limit=1`;

const PROBE_TIMEOUT = 5_000;  // paused free-tier projects hang, so abort hard

const retryCallbacks = [];
let polling = false;

/* The dialog is injected rather than authored into each page, so its styles
   ride along with it. Themed off the shared chrome.css tokens so it reads the
   same on light and dark. */
const BANNER_CSS = `
#outageBanner {
  position: fixed;
  inset: 0;
  z-index: 9000;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
}

#outageBanner.visible { display: flex; animation: outageFade 200ms ease-out; }

#outageBanner .outage-card {
  width: 100%;
  max-width: 440px;
  padding: 32px 28px 26px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--bg);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
  animation: outageRise 240ms cubic-bezier(0.22, 0.61, 0.36, 1);
}

#outageBanner .outage-mark {
  display: block;
  margin: 0 auto 18px;
  color: var(--logo-gold);
}

#outageBanner h2 {
  margin: 0 0 10px;
  font-size: 1.3rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--ink);
}

#outageBanner p {
  margin: 0 0 24px;
  font-size: 0.95rem;
  line-height: 1.55;
  color: var(--dim);
}

#outageBanner button {
  width: 100%;
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  background: var(--ink);
  color: var(--bg);
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
}

#outageBanner button:hover { opacity: 0.88; }

@keyframes outageFade { from { opacity: 0; } to { opacity: 1; } }

@keyframes outageRise {
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to   { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  #outageBanner.visible, #outageBanner .outage-card { animation: none; }
}
`;

function bannerEl() {
  let el = document.getElementById('outageBanner');
  if (!el) {
    const style = document.createElement('style');
    style.textContent = BANNER_CSS;
    document.head.appendChild(style);

    el = document.createElement('div');
    el.id = 'outageBanner';
    el.setAttribute('role', 'alertdialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', 'outageTitle');
    el.innerHTML = `
      <div class="outage-card">
        <svg class="outage-mark" width="40" height="40" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9"/>
          <path d="M12 7.5v5"/>
          <path d="M12 16.2h.01"/>
        </svg>
        <h2 id="outageTitle">Reviews aren't loading right now</h2>
        <p>We are currently experiencing some issues. Please check back later.</p>
        <button type="button">Continue browsing</button>
      </div>`;

    const close = () => el.classList.remove('visible');
    el.querySelector('button').addEventListener('click', close);
    // Click-off and Escape, the two exits people reach for on a modal.
    el.addEventListener('click', e => { if (e.target === el) close(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && el.classList.contains('visible')) close();
    });
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
      bannerEl().classList.remove('visible');
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
  bannerEl().classList.add('visible');
  if (!polling) {
    polling = true;
    scheduleProbe();
  }
}

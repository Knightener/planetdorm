import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// These are set via Supabase dashboard → Edge Functions → Secrets.
// They are never sent to the browser — that's the whole point of this function.
const HCAPTCHA_SECRET = Deno.env.get('HCAPTCHA_SECRET')!       // hCaptcha secret key (not the site key)
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!              // auto-provided by Supabase
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // bypasses RLS — keep private

// Only allow requests from our GitHub Pages site. Any other origin will be blocked by the browser.
// Authorization is listed so the anon JWT we send from script.js isn't blocked by CORS preflight.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://knightener.github.io',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Allowlist of valid dorm IDs — must match the ids in data.js exactly.
// Rejects any review that tries to target a dorm that doesn't exist on the site.
const VALID_DORM_IDS = new Set([
  'belair', 'cambridge', 'centreville', 'chestertown', 'cumberland',
  'denton', 'easton', 'elkton', 'ellicott', 'hagerstown', 'laplata',
  'johnsonwhittle', 'pyonchen', 'oakland', 'annearundel', 'caroline',
  'carroll', 'dorchester', 'princefrederick', 'queenAnnes', 'somerset',
  'stmarys', 'wicomico', 'worcester', 'leonardtown', 'allegany',
  'baltimore', 'calvert', 'cecil', 'charles', 'frederick', 'garrett',
  'harford', 'howard', 'kent', 'montgomery', 'princegeorges', 'talbot',
  'washington',
])

// Expected year format: "2024-2025"
const VALID_YEAR_RE = /^\d{4}-\d{4}$/

// Helper to return a consistent JSON error response with CORS headers attached.
function err(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  // Browsers send an OPTIONS preflight before the real POST to check CORS headers.
  // We must respond to it or the actual request will never be sent.
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }
  if (req.method !== 'POST') return err('Method not allowed', 405)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return err('Invalid JSON')
  }

  const { dormId, name, rating, text, year, captchaToken } = body

  // Verify captcha with hCaptcha's API — this is the key step that can't be
  // done client-side because it requires the secret key.
  const captchaRes = await fetch('https://hcaptcha.com/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      secret: HCAPTCHA_SECRET,
      response: String(captchaToken ?? ''),
    }),
  })
  const captchaData = await captchaRes.json()
  if (!captchaData.success) {
    console.error('[submit-review] Captcha failed:', captchaData['error-codes'])
    return err('Captcha verification failed')
  }

  // Validate all fields server-side — client validation is bypassed when
  // someone calls the API directly.
  if (typeof dormId !== 'string' || !VALID_DORM_IDS.has(dormId)) {
    return err('Invalid dorm')
  }
  if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return err('Rating must be an integer 1–5')
  }
  if (typeof text !== 'string' || text.trim().length === 0) {
    return err('Review text is required')
  }
  if (text.length > 2000) return err('Review too long (max 2000 characters)')
  if (typeof year !== 'string' || !VALID_YEAR_RE.test(year)) {
    return err('Invalid year format')
  }

  // Fall back to "Anonymous Terp" if no name was provided, and hard-cap at 100 chars.
  const cleanName =
    typeof name === 'string' && name.trim()
      ? name.trim().slice(0, 100)
      : 'Anonymous Terp'

  // Use the service role key so the insert bypasses RLS (anon inserts are blocked by policy).
  // New rows get status='pending' from the column default; they stay hidden from the
  // public read policy until approved in the dashboard. The inserted row is returned
  // so the poster's browser can show their own review locally while it waits.
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data: review, error } = await supabase
    .from('reviews')
    .insert({
      dormId,
      name: cleanName,
      rating,
      text: text.trim(),
      year,
    })
    .select('id, dormId, name, rating, text, year, created_at')
    .single()

  if (error) {
    console.error('[submit-review] DB insert error:', error.code, error.message)
    return err('Failed to save review', 500)
  }

  return new Response(JSON.stringify({ success: true, review }), {
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
})

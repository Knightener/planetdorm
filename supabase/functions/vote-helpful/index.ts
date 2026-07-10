import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Set via Supabase dashboard → Edge Functions → Secrets.
// VOTE_SALT: any long random string; makes voter hashes impossible to forge.
const VOTE_SALT = Deno.env.get('VOTE_SALT')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // bypasses RLS — keep private

// Same origin policy as submit-review, plus localhost for Live Server testing.
const ALLOWED_ORIGINS = new Set([
  'https://knightener.github.io',
  'http://127.0.0.1:5500',
  'http://localhost:5500',
])

// Cap scripted spam: one IP can cast at most this many votes per hour.
const MAX_VOTES_PER_IP_PER_HOUR = 30

function corsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://knightener.github.io',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  const CORS = corsHeaders(req.headers.get('origin'))
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })

  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const { reviewId, clientId } = body

  // reviewId must be a positive integer; clientId a UUID-ish string the page
  // generated once and keeps in localStorage.
  if (typeof reviewId !== 'number' || !Number.isInteger(reviewId) || reviewId < 1) {
    return json({ error: 'Invalid review id' }, 400)
  }
  if (typeof clientId !== 'string' || clientId.length < 16 || clientId.length > 64) {
    return json({ error: 'Invalid client id' }, 400)
  }

  // Voter identity = salted hash of (clientId + IP). The salt keeps hashes
  // unforgeable; including clientId means dorm-mates behind the same campus
  // NAT don't block each other, and the IP makes localStorage-clearing alone
  // insufficient to re-vote.
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? ''
  const voter_hash = await sha256(`${VOTE_SALT}:${clientId}:${ip}`)
  const ip_hash = await sha256(`${VOTE_SALT}:ip:${ip}`)

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Per-IP rate limit.
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count: recent } = await supabase
    .from('review_votes')
    .select('*', { count: 'exact', head: true })
    .eq('ip_hash', ip_hash)
    .gte('created_at', hourAgo)
  if ((recent ?? 0) >= MAX_VOTES_PER_IP_PER_HOUR) {
    return json({ error: 'Too many votes, try again later' }, 429)
  }

  // The (review_id, voter_hash) primary key makes this idempotent:
  // a second vote from the same person hits a unique violation (23505).
  const { error } = await supabase
    .from('review_votes')
    .insert({ review_id: reviewId, voter_hash, ip_hash })

  if (error && error.code === '23505') {
    return json({ success: true, already: true })
  }
  if (error) {
    // Foreign-key violation = review doesn't exist.
    if (error.code === '23503') return json({ error: 'Review not found' }, 404)
    console.error('[vote-helpful] insert error:', error.code, error.message)
    return json({ error: 'Failed to save vote' }, 500)
  }

  const { data: row } = await supabase
    .from('reviews')
    .select('helpful_count')
    .eq('id', reviewId)
    .single()

  return json({ success: true, helpful_count: row?.helpful_count ?? null })
})

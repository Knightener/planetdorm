// Constants and the resolved dorm for the reviews page.
//
// These were scattered through the old inline module (the anon JWT in
// particular sat in the form section but was already used by the voting
// code above it, relying on module hoisting). Collecting them here makes
// the shared ones explicit.
import { dorms } from '../data.js';

/* ------------------------------------------------------------------ *
 * Editorial dorm metadata the data model doesn't carry (walk times,  *
 * pricing, category scores). Values for La Plata are final copy from *
 * the design handoff; other dorms fall back to derived fields and    *
 * hide the sections they have no data for.                           *
 * ------------------------------------------------------------------ */
export const DORM_META = {
  laplata: {
    subline: 'Denton Community · 5 min to Eppley · 8 min to Stamp · Traditional-style',
    amenities: ['❄ AC', 'Elevator', 'Community bathrooms', 'Laundry each floor', 'Freshman-heavy'],
    price: '$4,706', priceRoom: 'double',
    categoryScores: [
      ['Location', 4.7], ['Community', 4.4], ['Cleanliness', 4.0],
      ['Facilities', 3.8], ['Quietness', 3.1]
    ]
  }
};

const params = new URLSearchParams(location.search);
const dormId = params.get('dorm') || 'laplata';

export const dorm = dorms.find(d => d.id === dormId) || dorms.find(d => d.id === 'laplata');
export const meta = DORM_META[dorm.id] || {};

// How many reviews render before "Show all".
export const INITIAL_VISIBLE = 5;

// Own submissions awaiting approval (localStorage key).
export const PENDING_KEY = 'td-my-pending';

// Supabase edge functions. RLS blocks direct writes, so both the vote and
// the submit path go through these.
export const ANON_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxYmZpd2l4bHFzbmpzbXdpcnRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5Mjc2OTEsImV4cCI6MjA5MTUwMzY5MX0.Qy2_QBt4l2uRPiLQIKAaao4gNwZf0bkniUob9EtBXMY';
export const VOTE_URL = 'https://qqbfiwixlqsnjsmwirtf.supabase.co/functions/v1/vote-helpful';
export const SUBMIT_URL = 'https://qqbfiwixlqsnjsmwirtf.supabase.co/functions/v1/submit-review';
export const SITEKEY = '48ce88c8-9f00-47ee-a3f6-900c5abe7686';

// Resting camera for the sidebar mini-map.
export const PREVIEW_VIEW = { zoom: 15.6, pitch: 50, bearing: -17 };

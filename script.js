// ─── SUPABASE SETUP ─────────────────────────────────────────
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://qqbfiwixlqsnjsmwirtf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxYmZpd2l4bHFzbmpzbXdpcnRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5Mjc2OTEsImV4cCI6MjA5MTUwMzY5MX0.Qy2_QBt4l2uRPiLQIKAaao4gNwZf0bkniUob9EtBXMY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── LOAD REVIEWS FROM SUPABASE ─────────────────────────────
async function loadAllReviews() {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading reviews:', error);
    return;
  }

  dorms.forEach(d => {
    d.reviewList = [];
    d.reviews = 0;
    d.rating = 0;
  });

  data.forEach(r => {
    const dorm = dorms.find(d => d.id === r.dormId);
    if (dorm) {
      dorm.reviewList.push({
        name: r.name || 'Anonymous Terp',
        date: r.year || 'Unknown',
        rating: r.rating,
        text: r.text,
        tags: []
      });
    }
  });

  dorms.forEach(d => {
    if (d.reviewList.length > 0) {
      d.reviews = d.reviewList.length;
      d.rating = d.reviewList.reduce((sum, rev) => sum + rev.rating, 0) / d.reviews;
    }
  });

  if (currentSection === 'home') renderDorms();
  if (currentSection === 'offcampus') renderOffCampusDorms();
  if (currentDorm) showDetail(currentDorm.id);
}

// ─── REAL-TIME UPDATES ──────────────────────────────────────
function setupReviewsListener() {
  supabase
    .channel('reviews')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'reviews' },
      loadAllReviews
    )
    .subscribe();
}

// ─── DORM DATA ──────────────────────────────────────────────
const dorms = [

  // ── NORTH CAMPUS: Cambridge Community ──────────────────────
  {
    id: 'belair', name: 'Bel Air Hall', campus: 'on', area: 'north', built: '1965',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles, Triples',
    ac: true, dining: 'Yahentamitsi Dining Hall',
    lat: 38.9928, lng: -76.9426,
    imgs: ["https://reslife.umd.edu/sites/default/files/styles/optimized/public/2026-02/bel-air-hall-card.jpeg?itok=hx8ZfWf3"],
    tags: [{ t: 'A/C', c: 'good' }, { t: 'In-hall Laundry', c: 'good' }, { t: 'Closes on Breaks', c: 'bad' }],

  },
  {
    id: 'cambridge', name: 'Cambridge Hall', campus: 'on', area: 'north', built: '1963',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles, Triples',
    ac: true, dining: 'Yahentamitsi Dining Hall',
    lat: 38.9917, lng: -76.9430,
    imgs: ["https://reslife.umd.edu/sites/default/files/styles/optimized/public/2026-02/cambridge-hall-card.png?itok=_bvaXVai"],
    tags: [{ t: 'College Park Scholars', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'In-hall Laundry', c: 'good' }],

  },
  {
    id: 'centreville', name: 'Centreville Hall', campus: 'on', area: 'north', built: '1964',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles, Triples',
    ac: true, dining: 'Yahentamitsi Dining Hall',
    lat: 38.9926, lng: -76.9422,
    imgs: ["https://reslife.umd.edu/sites/default/files/styles/optimized/public/2026-02/centreville-hall-card.jpg?itok=gGF2b-Ll"],
    tags: [{ t: 'College Park Scholars', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'In-hall Laundry', c: 'good' }],

  },
  {
    id: 'chestertown', name: 'Chestertown Hall', campus: 'on', area: 'north', built: '1964',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles, Triples',
    ac: true, dining: 'Yahentamitsi Dining Hall',
    lat: 38.9928, lng: -76.9434,
    imgs: ["https://reslife.umd.edu/sites/default/files/styles/optimized/public/2026-02/chestertown-hall-card.jpeg?itok=BxD6eYgF"],
    tags: [{ t: 'College Park Scholars', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'In-hall Laundry', c: 'good' }],

  },
  {
    id: 'cumberland', name: 'Cumberland Hall', campus: 'on', area: 'north', built: '1965',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles, Triples',
    ac: true, dining: 'Yahentamitsi Dining Hall',
    lat: 38.9923, lng: -76.9440,
    imgs: ["https://reslife.umd.edu/sites/default/files/styles/optimized/public/2026-02/cumberland-hall-card.jpeg?itok=c6Cv1E96"],
    tags: [{ t: 'College Park Scholars', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'In-hall Laundry', c: 'good' }],

  },

  // ── NORTH CAMPUS: Denton Community ─────────────────────────
  {
    id: 'denton', name: 'Denton Hall', campus: 'on', area: 'north', built: '1966',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles, Triples',
    ac: true, dining: 'Yahentamitsi Dining Hall',
    lat: 38.9922, lng: -76.9500,
    imgs: ["https://reslife.umd.edu/sites/default/files/styles/optimized/public/2026-02/denton-hall-card.jpg?itok=H0_AIP2Z"],
    tags: [{ t: 'A/C', c: 'good' }, { t: 'In-hall Laundry', c: 'good' }, { t: 'Closes on Breaks', c: 'bad' }],

  },
  {
    id: 'easton', name: 'Easton Hall', campus: 'on', area: 'north', built: '1966',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles, Triples',
    ac: true, dining: 'Yahentamitsi Dining Hall',
    lat: 38.9930, lng: -76.9502,
    imgs: ["https://reslife.umd.edu/sites/default/files/styles/optimized/public/2026-02/easton-hall-card.jpg?itok=248BxYbk"],
    tags: [{ t: 'Multiple LLPs', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'In-hall Laundry', c: 'good' }],

  },
  {
    id: 'elkton', name: 'Elkton Hall', campus: 'on', area: 'north', built: '1966',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles, Triples',
    ac: true, dining: 'Yahentamitsi Dining Hall',
    lat: 38.9925, lng: -76.9490,
    imgs: ["https://reslife.umd.edu/sites/default/files/styles/optimized/public/2026-02/elkton-hall-card.jpg?itok=5Ff0OlkT"],
    tags: [{ t: 'A/C', c: 'good' }, { t: 'In-hall Laundry', c: 'good' }, { t: 'Closes on Breaks', c: 'bad' }],

  },

  // ── NORTH CAMPUS: Ellicott Community ───────────────────────
  {
    id: 'ellicott', name: 'Ellicott Hall', campus: 'on', area: 'north', built: '1962',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles, Triples',
    ac: false, dining: 'Yahentamitsi Dining Hall',
    lat: 38.9918, lng: -76.9467,
    imgs: ["https://reslife.umd.edu/sites/default/files/styles/optimized/public/2026-03/ellicott-hall-exterior-front.jpg?itok=9acqLDOU"],
    tags: [{ t: 'Gemstone LLP', c: 'good' }, { t: 'No A/C', c: 'bad' }, { t: 'In-hall Laundry', c: 'good' }],

  },
  {
    id: 'hagerstown', name: 'Hagerstown Hall', campus: 'on', area: 'north', built: '1962',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles, Triples',
    ac: false, dining: 'Yahentamitsi Dining Hall',
    lat: 38.9924, lng: -76.9474,
    imgs: ["https://reslife.umd.edu/sites/default/files/styles/optimized/public/2026-02/hagerstown-hall-card.jpg?itok=8xPwXiCJ"],
    tags: [{ t: 'No A/C', c: 'bad' }, { t: 'In-hall Laundry', c: 'good' }, { t: 'Closes on Breaks', c: 'bad' }],

  },
  {
    id: 'laplata', name: 'La Plata Hall', campus: 'on', area: 'north', built: '1962',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles, Triples',
    ac: true, dining: 'Yahentamitsi Dining Hall',
    lat: 38.9924, lng: -76.9459,
    imgs: ["https://reslife.umd.edu/sites/default/files/styles/optimized/public/2026-02/la-plata-hall-card.jpg?itok=Vakttxhe"],
    tags: [{ t: 'Integrated Life Sciences LLP', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],

  },

  // ── NORTH CAMPUS: Heritage Community ───────────────────────
  {
    id: 'johnsonwhittle', name: 'Johnson-Whittle Hall', campus: 'on', area: 'north', built: '2013',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles',
    ac: true, dining: 'Yahentamitsi Dining Hall',
    lat: 38.9909, lng: -76.9452,
    imgs: ["https://reslife.umd.edu/sites/default/files/styles/optimized/public/2026-02/johnson-whittle-hall-card.jpg?itok=SwfKvXcR"],
    tags: [{ t: 'University Honors', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Newer Building', c: 'good' }],

  },
  {
    id: 'pyonchen', name: 'Pyon-Chen Hall', campus: 'on', area: 'north', built: '2013',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles',
    ac: true, dining: 'Yahentamitsi Dining Hall',
    lat: 38.9919, lng: -76.9450,
    imgs: ["https://reslife.umd.edu/sites/default/files/styles/optimized/public/2026-02/pyon-chen-hall-card.png?itok=9uJ3p-6_"],
    tags: [{ t: 'University Honors', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Newer Building', c: 'good' }],

  },

  // ── NORTH CAMPUS: Oakland Hall ─────────────────────────────
  {
    id: 'oakland', name: 'Oakland Hall', campus: 'on', area: 'north', built: '2009',
    rating: 0, reviews: 0, type: 'Semi-Suite', roomTypes: 'Doubles (Semi-Suite)',
    ac: true, dining: 'Yahentamitsi Dining Hall',
    lat: 38.9939, lng: -76.9498,
    imgs: ["https://reslife.umd.edu/sites/default/files/styles/optimized/public/2026-02/oakland-hall-card.jpeg?itok=cDAAL9M_"],
    tags: [{ t: 'Semi-Suite', c: 'good' }, { t: 'A/C', c: 'good' }, { t: '24-Hr Service Desk', c: 'good' }],

  },

  // ── SOUTH CAMPUS: North Hill Community ─────────────────────
  {
    id: 'annearundel', name: 'Anne Arundel Hall', campus: 'on', area: 'south', built: '1965',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles',
    ac: true, dining: '251 North Dining Hall',
    lat: 38.9860, lng: -76.9468,
    imgs: ["https://reslife.umd.edu/sites/default/files/styles/optimized/public/2026-02/anne-arundel-hall-card.png?itok=T78Xc6sx"],
    tags: [{ t: 'Honors Humanities LLP', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],

  },
  {
    id: 'caroline', name: 'Caroline Hall', campus: 'on', area: 'south', built: '1967',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles, Triples',
    ac: false, dining: '251 North Dining Hall',
    lat: 38.9835, lng: -76.9456,
    imgs: ["https://reslife.umd.edu/sites/default/files/styles/optimized/public/2026-02/caroline-hall-card.jpg?itok=mWFlrDhm"],
    tags: [{ t: 'No A/C', c: 'bad' }, { t: 'In-hall Laundry', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],

  },
  {
    id: 'carroll', name: 'Carroll Hall', campus: 'on', area: 'south', built: '1967',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles, Triples',
    ac: false, dining: '251 North Dining Hall',
    lat: 38.9840, lng: -76.9456,
    imgs: ["https://reslife.umd.edu/sites/default/files/styles/optimized/public/2026-02/carroll-hall-card.jpeg?itok=NjuXo0ro"],
    tags: [{ t: 'No A/C', c: 'bad' }, { t: 'In-hall Laundry', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],

  },
  {
    id: 'dorchester', name: 'Dorchester Hall', campus: 'on', area: 'south', built: '1968',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles',
    ac: true, dining: '251 North Dining Hall',
    lat: 38.9867, lng: -76.9460,
    imgs: ["https://reslife.umd.edu/sites/default/files/styles/optimized/public/2026-02/dorchester-hall-card.jpeg?itok=paBcSgGl"],
    tags: [{ t: 'Honors Global Challenges LLP', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],

  },
  {
    id: 'princefrederick', name: 'Prince Frederick Hall', campus: 'on', area: 'south', built: '1967',
    rating: 0, reviews: 0, type: 'Semi-Suite/Suite', roomTypes: 'Doubles, Singles',
    ac: true, dining: '251 North Dining Hall',
    lat: 38.9831, lng: -76.9457,
    imgs: ["https://reslife.umd.edu/sites/default/files/styles/optimized/public/2026-02/prince-frederick-card.jpg?itok=LG0ao1ZG"],
    tags: [{ t: 'Multiple LLPs', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Semi-Suite/Suite', c: 'good' }],

  },
  {
    id: 'queenAnnes', name: "Queen Anne's Hall", campus: 'on', area: 'south', built: '1966',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles',
    ac: true, dining: '251 North Dining Hall',
    lat: 38.9853, lng: -76.9461,
    imgs: ["https://reslife.umd.edu/sites/default/files/styles/optimized/public/2026-02/queen-annes-hall-card.jpg?itok=HeUF1d8C"],
    tags: [{ t: "Writers' House LLP", c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],

  },
  {
    id: 'somerset', name: 'Somerset Hall', campus: 'on', area: 'south', built: '1966',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles',
    ac: true, dining: '251 North Dining Hall',
    lat: 38.9851, lng: -76.9456,
    imgs: ["https://reslife.umd.edu/sites/default/files/styles/optimized/public/2026-02/somerset-hall-card.jpeg?itok=vsNNUw0J"],
    tags: [{ t: 'BioFIRE LLP', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],

  },
  {
    id: 'stmarys', name: "St. Mary's Hall", campus: 'on', area: 'south', built: '1968',
    rating: 0, reviews: 0, type: 'Suite', roomTypes: 'Doubles, Singles (Suite)',
    ac: true, dining: '251 North Dining Hall',
    lat: 38.9869, lng: -76.9456,
    imgs: ["https://reslife.umd.edu/sites/default/files/styles/optimized/public/2026-02/st-marys-hall-card.jpeg?itok=_USWcu1l"],
    tags: [{ t: 'Language House LLP', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Suite-style', c: 'good' }],

  },
  {
    id: 'wicomico', name: 'Wicomico Hall', campus: 'on', area: 'south', built: '1965',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles, Triples',
    ac: false, dining: '251 North Dining Hall',
    lat: 38.9837, lng: -76.9456,
    imgs: ["https://reslife.umd.edu/sites/default/files/styles/optimized/public/2026-02/wicomico-hall-card.jpeg?itok=Tm4B-zm8"],
    tags: [{ t: 'No A/C', c: 'bad' }, { t: 'In-hall Laundry', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],

  },
  {
    id: 'worcester', name: 'Worcester Hall', campus: 'on', area: 'south', built: '1965',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles, Triples',
    ac: false, dining: '251 North Dining Hall',
    lat: 38.9846, lng: -76.9450,
    imgs: ["https://reslife.umd.edu/sites/default/files/styles/optimized/public/2026-02/worcester-hall-card.jpeg?itok=HTJZu44N"],
    tags: [{ t: 'No A/C', c: 'bad' }, { t: 'In-hall Laundry', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],

  },

  // ── SOUTH CAMPUS: Leonardtown Community ────────────────────
  {
    id: 'leonardtown', name: 'Leonardtown', campus: 'on', area: 'south', built: '2011',
    rating: 0, reviews: 0, type: 'Suite/Apartment', roomTypes: 'Singles, Doubles (Suite/Apt)',
    ac: true, dining: '251 North Dining Hall',
    lat: 38.9845, lng: -76.9334,
    imgs: ["https://reslife.umd.edu/sites/default/files/styles/optimized/public/2026-02/leonardtown-community-card.jpg?itok=U-Z1R5bm"],
    tags: [{ t: 'Suite/Apartment', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Newer Building', c: 'good' }],

  },

  // ── THE COMMONS: South Hill Community ──────────────────────
  {
    id: 'allegany', name: 'Allegany Hall', campus: 'on', area: 'commons', built: '2000',
    rating: 0, reviews: 0, type: 'Suite/Apartment', roomTypes: 'Singles, Doubles (Suite/Apt)',
    ac: true, dining: '251 North Dining Hall',
    lat: 38.9816, lng: -76.9414,
    imgs: ["https://reslife.umd.edu/sites/default/files/styles/optimized/public/2026-02/allegany-hall-card.jpeg?itok=xg44k9l3"],
    tags: [{ t: 'Suite/Apartment', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],

  },
  {
    id: 'baltimore', name: 'Baltimore Hall', campus: 'on', area: 'commons', built: '2000',
    rating: 0, reviews: 0, type: 'Suite/Apartment', roomTypes: 'Singles, Doubles (Suite/Apt)',
    ac: true, dining: '251 North Dining Hall',
    lat: 38.9822, lng: -76.9422,
    imgs: ["https://reslife.umd.edu/sites/default/files/styles/optimized/public/2026-02/baltimore-hall-card.jpg?itok=JGqCIswL"],
    tags: [{ t: 'Suite/Apartment', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],

  },
  {
    id: 'calvert', name: 'Calvert Hall', campus: 'on', area: 'commons', built: '2000',
    rating: 0, reviews: 0, type: 'Suite/Apartment', roomTypes: 'Singles, Doubles (Suite/Apt)',
    ac: true, dining: '251 North Dining Hall',
    lat: 38.9829, lng: -76.9423,
    imgs: ["https://reslife.umd.edu/sites/default/files/styles/optimized/public/2026-02/calvert-hall-card.jpg?itok=S1vhEiIO"],
    tags: [{ t: 'Suite/Apartment', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],

  },
  {
    id: 'cecil', name: 'Cecil Hall', campus: 'on', area: 'commons', built: '2000',
    rating: 0, reviews: 0, type: 'Traditional', roomTypes: 'Doubles, Triples',
    ac: false, dining: '251 North Dining Hall',
    lat: 38.9829, lng: -76.9417,
    imgs: ["https://reslife.umd.edu/sites/default/files/styles/optimized/public/2026-02/cecil-hall-card.jpg?itok=ftRx5CmQ"],
    tags: [{ t: 'No A/C', c: 'bad' }, { t: 'In-hall Laundry', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],

  },
  {
    id: 'charles', name: 'Charles Hall', campus: 'on', area: 'commons', built: '2000',
    rating: 0, reviews: 0, type: 'Suite/Apartment', roomTypes: 'Singles, Doubles (Suite/Apt)',
    ac: true, dining: '251 North Dining Hall',
    lat: 38.9816, lng: -76.9405,
    imgs: ["https://reslife.umd.edu/sites/default/files/styles/optimized/public/2026-02/charles-hall-card.jpeg?itok=PNCCpJHb"],
    tags: [{ t: 'Suite/Apartment', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],

  },
  {
    id: 'frederick', name: 'Frederick Hall', campus: 'on', area: 'commons', built: '2001',
    rating: 0, reviews: 0, type: 'Suite/Apartment', roomTypes: 'Singles, Doubles (Suite/Apt)',
    ac: true, dining: '251 North Dining Hall',
    lat: 38.9820, lng: -76.9407,
    imgs: ["https://reslife.umd.edu/sites/default/files/styles/optimized/public/2026-02/frederick-hall-card.jpg?itok=2Cb9kJw4"],
    tags: [{ t: 'Suite/Apartment', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],

  },
  {
    id: 'garrett', name: 'Garrett Hall', campus: 'on', area: 'commons', built: '2001',
    rating: 0, reviews: 0, type: 'Suite/Apartment', roomTypes: 'Singles, Doubles (Suite/Apt)',
    ac: true, dining: '251 North Dining Hall',
    lat: 38.9833, lng: -76.9427,
    imgs: ["https://reslife.umd.edu/sites/default/files/styles/optimized/public/2026-02/garrett-hall-card.jpeg?itok=inFNbyCh"],
    tags: [{ t: 'Suite/Apartment', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],

  },
  {
    id: 'harford', name: 'Harford Hall', campus: 'on', area: 'commons', built: '2001',
    rating: 0, reviews: 0, type: 'Suite/Apartment', roomTypes: 'Singles, Doubles (Suite/Apt)',
    ac: true, dining: '251 North Dining Hall',
    lat: 38.9825, lng: -76.9409,
    imgs: ["https://reslife.umd.edu/sites/default/files/styles/optimized/public/2026-02/harford-hall-card.png?itok=KvigkEND"],
    tags: [{ t: 'Suite/Apartment', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'In-hall Laundry', c: 'good' }],

  },
  {
    id: 'howard', name: 'Howard Hall', campus: 'on', area: 'commons', built: '2001',
    rating: 0, reviews: 0, type: 'Suite/Apartment', roomTypes: 'Singles, Doubles (Suite/Apt)',
    ac: true, dining: '251 North Dining Hall',
    lat: 38.9819, lng: -76.9420,
    imgs: ["https://reslife.umd.edu/sites/default/files/styles/optimized/public/2026-02/howard-hall-card.jpeg?itok=qSoYzx1Y"],
    tags: [{ t: 'Suite/Apartment', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],

  },
  {
    id: 'kent', name: 'Kent Hall', campus: 'on', area: 'commons', built: '2001',
    rating: 0, reviews: 0, type: 'Suite/Apartment', roomTypes: 'Singles, Doubles (Suite/Apt)',
    ac: true, dining: '251 North Dining Hall',
    lat: 38.9833, lng: -76.9418,
    imgs: ["https://reslife.umd.edu/sites/default/files/styles/optimized/public/2026-02/kent-hall-card.jpg?itok=7oQLUoCR"],
    tags: [{ t: 'Suite/Apartment', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],

  },
  {
    id: 'montgomery', name: 'Montgomery Hall', campus: 'on', area: 'commons', built: '2001',
    rating: 0, reviews: 0, type: 'Suite/Apartment', roomTypes: 'Singles, Doubles (Suite/Apt)',
    ac: true, dining: '251 North Dining Hall',
    lat: 38.9819, lng: -76.9393,
    imgs: ["https://reslife.umd.edu/sites/default/files/styles/optimized/public/2026-02/montgomery-hall-card.png?itok=U1yscOCI"],
    tags: [{ t: 'Suite/Apartment', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],

  },
  {
    id: 'princegeorges', name: "Prince George's Hall", campus: 'on', area: 'commons', built: '2001',
    rating: 0, reviews: 0, type: 'Suite/Apartment', roomTypes: 'Singles, Doubles (Suite/Apt)',
    ac: true, dining: '251 North Dining Hall',
    lat: 38.9826, lng: -76.9418,
    imgs: ["https://reslife.umd.edu/sites/default/files/styles/optimized/public/2026-02/prince-georges-hall-card.jpeg?itok=g34wbb0Q"],
    tags: [{ t: 'Suite/Apartment', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],

  },
  {
    id: 'talbot', name: 'Talbot Hall', campus: 'on', area: 'commons', built: '2001',
    rating: 0, reviews: 0, type: 'Suite/Apartment', roomTypes: 'Singles, Doubles (Suite/Apt)',
    ac: true, dining: '251 North Dining Hall',
    lat: 38.9834, lng: -76.9423,
    imgs: ["https://reslife.umd.edu/sites/default/files/styles/optimized/public/2026-02/talbot-hall-card.jpg?itok=3JYb2JS7"],
    tags: [{ t: 'Suite/Apartment', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],

  },
  {
    id: 'washington', name: 'Washington Hall', campus: 'on', area: 'commons', built: '2001',
    rating: 0, reviews: 0, type: 'Suite/Apartment', roomTypes: 'Singles, Doubles (Suite/Apt)',
    ac: true, dining: '251 North Dining Hall',
    lat: 38.9818, lng: -76.9414,
    imgs: ["https://reslife.umd.edu/sites/default/files/styles/optimized/public/2026-02/washington-hall-card.jpeg?itok=8dqumw97"],
    tags: [{ t: 'Suite/Apartment', c: 'good' }, { t: 'A/C', c: 'good' }, { t: 'Open on Breaks', c: 'good' }],

  },
];


// ─── STATE ──────────────────────────────────────────────────
let currentFilter = 'all';
let offCampusFilter = 'all';
let currentSection = 'home';
let currentDorm = null;
let selectedRating = 0;
let lightboxImages = [];
let lightboxIndex = 0;
let galleryDorm = 'all';

// ─── RENDER DORM GRID ──────────────────────────────────────
function dormCardHTML(d) {
  return `
    <div class="dorm-card" onclick="showDetail('${d.id}')">
      <div class="dorm-card-img" style="${d.imgs[0] ? `background-image:url('${d.imgs[0]}')` : ''}">
        <div class="badge">${d.rating.toFixed(1)} ★</div>
      </div>
      <div class="dorm-card-body">
        <h3>${d.name}</h3>
        <div class="meta"><span>${d.type}</span><span>${d.reviews} reviews</span></div>
        <div class="tag-row">${d.tags.map(t => `<span class="tag ${t.c}">${t.t}</span>`).join('')}</div>
      </div>
    </div>
  `;
}

function matchesSearch(d, q) {
  if (!q) return true;
  return d.name.toLowerCase().includes(q) ||
    d.area.toLowerCase().includes(q) ||
    (d.type && d.type.toLowerCase().includes(q)) ||
    (d.tags && d.tags.some(t => t.t.toLowerCase().includes(q)));
}

function renderDorms() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const grid = document.getElementById('dormGrid');
  const filtered = dorms.filter(d => {
    const matchCampus = d.campus === 'on';
    const matchArea = currentFilter === 'all' || d.area === currentFilter;
    return matchCampus && matchArea && matchesSearch(d, q);
  });
  grid.innerHTML = filtered.map(dormCardHTML).join('');
}

function renderOffCampusDorms() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const grid = document.getElementById('offCampusDormGrid');
  const filtered = dorms.filter(d => {
    const matchCampus = d.campus === 'off';
    const matchArea = offCampusFilter === 'all' || d.area === offCampusFilter;
    return matchCampus && matchArea && matchesSearch(d, q);
  });
  grid.innerHTML = filtered.map(dormCardHTML).join('');
}

function filterDorms() {
  if (currentSection === 'offcampus') renderOffCampusDorms();
  else renderDorms();
}

function setFilter(f, btn) {
  currentFilter = f;
  document.querySelectorAll('#filterBar button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderDorms();
}

function setOffCampusFilter(f, btn) {
  offCampusFilter = f;
  document.querySelectorAll('#offCampusFilterBar button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderOffCampusDorms();
}

// ─── DETAIL VIEW ────────────────────────────────────────────
function showDetail(id) {
  const d = dorms.find(x => x.id === id);
  if (!d) return;
  currentDorm = d;
  document.getElementById('heroSection').style.display = 'none';
  document.getElementById('section-' + currentSection).classList.remove('active');
  const sec = document.getElementById('section-detail');
  sec.classList.add('active');
  sec.style.display = 'block';

  const allReviews = d.reviewList;
  const imgsJson = JSON.stringify(d.imgs).replace(/"/g, '&quot;');

  document.getElementById('detailContent').innerHTML = `
    <div class="detail-header">
      <div class="detail-gallery">
        ${d.imgs.map((img, i) => `<img src="${img}" onclick="openLightbox(${imgsJson}, ${i})">`).join('')}
      </div>
      <div class="detail-info">
        <h2>${d.name}</h2>
        <div class="meta">${d.type} · Built ${d.built} · ${d.area.charAt(0).toUpperCase() + d.area.slice(1)} Campus</div>
        <div class="stat-grid">
          <div class="stat-box"><div class="label">Rating</div><div class="val" style="color:var(--gold)">${d.rating.toFixed(1)} <span style="font-size:.9rem">/ 5</span></div></div>
          <div class="stat-box"><div class="label">Reviews</div><div class="val">${d.reviews}</div></div>
          <div class="stat-box"><div class="label">Room Types</div><div class="val" style="font-size:1rem">${d.roomTypes}</div></div>
          <div class="stat-box"><div class="label">A/C</div><div class="val" style="color:${d.ac ? 'var(--green)' : 'var(--red)'}">${d.ac ? 'Yes' : 'No'}</div></div>
        </div>
        <button class="write-review-btn" onclick="openModal()">✍ Write a Review</button>
      </div>
    </div>
    <h3 class="section-title">Reviews</h3>
    <div class="reviews-list" id="reviewsList">
      ${allReviews.map(r => `
        <div class="review-card">
          <div class="review-top">
            <span class="name">${r.name}</span>
            <span><span class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span> <span class="date">${r.date}</span></span>
          </div>
          <div class="review-body">${r.text}</div>
          <div class="review-tags">${(r.tags || []).map(t => `<span class="tag">${t}</span>`).join('')}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function backToList() {
  document.getElementById('section-detail').classList.remove('active');
  document.getElementById('section-detail').style.display = 'none';
  document.getElementById('heroSection').style.display = '';
  document.getElementById('section-' + currentSection).classList.add('active');
  currentDorm = null;
}

// ─── SECTIONS NAV ───────────────────────────────────────────
function showSection(name) {
  document.querySelectorAll('.nav-links button').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-section="${name}"]`).classList.add('active');
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById('section-detail').style.display = 'none';

  if (name === 'home' || name === 'offcampus') {
    document.getElementById('heroSection').style.display = '';
    document.getElementById('section-' + name).classList.add('active');
    currentSection = name;
    if (name === 'offcampus') renderOffCampusDorms();
  } else {
    document.getElementById('heroSection').style.display = 'none';
    document.getElementById('section-' + name).classList.add('active');
  }
  if (name === 'map') initMap();
  if (name === 'gallery') renderGallery();
}

// ─── MAP ────────────────────────────────────────────────────
let leafletMap = null;

function initMap() {
  const onCampusDorms = dorms.filter(d => d.campus === 'on' && d.lat && d.lng);

  if (!leafletMap) {
    leafletMap = L.map('mapFrame').setView([38.9875, -76.9440], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(leafletMap);
  } else {
    leafletMap.eachLayer(layer => {
      if (layer instanceof L.Marker) leafletMap.removeLayer(layer);
    });
  }

  onCampusDorms.forEach(d => {
    const marker = L.marker([d.lat, d.lng]).addTo(leafletMap);
    marker.bindPopup(`
      <strong>${d.name}</strong><br>
      ${d.rating > 0 ? d.rating.toFixed(1) + '★ · ' + d.reviews + ' review' + (d.reviews !== 1 ? 's' : '') : 'No reviews yet'}<br>
      <a href="#" onclick="showDetail('${d.id}');showSection('home');return false;">View details →</a>
    `);
  });

  // Invalidate size in case the map div was hidden when initialized
  setTimeout(() => leafletMap.invalidateSize(), 100);

  const legend = document.getElementById('mapLegend');
  legend.innerHTML = `<h4>Residence Halls</h4>` + onCampusDorms.map(d => `
    <div class="map-legend-item" onclick="showDetail('${d.id}');showSection('home');">
      <span class="dot"></span>
      <span>${d.name}</span>
    </div>
  `).join('');
}


// ─── LIGHTBOX ───────────────────────────────────────────────
function openLightbox(imgs, idx) {
  lightboxImages = imgs;
  lightboxIndex = idx;
  document.getElementById('lightboxImg').src = imgs[idx];
  document.getElementById('lightbox').classList.add('active');
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('active');
}

function navLightbox(dir) {
  lightboxIndex = (lightboxIndex + dir + lightboxImages.length) % lightboxImages.length;
  document.getElementById('lightboxImg').src = lightboxImages[lightboxIndex];
}

// ─── REVIEW MODAL ───────────────────────────────────────────
function openModal() {
  document.getElementById('reviewModal').classList.add('active');
  selectedRating = 0;
  updateStars();
}

function closeModal() {
  document.getElementById('reviewModal').classList.remove('active');
}

function setRating(n) {
  selectedRating = n;
  updateStars();
}

function updateStars() {
  document.querySelectorAll('#starInput span').forEach((s, i) => s.classList.toggle('filled', i < selectedRating));
}

async function submitReview() {
  const name = document.getElementById('reviewName').value.trim() || 'Anonymous Terp';
  const text = document.getElementById('reviewText').value.trim();
  const year = document.getElementById('reviewYear').value;

  if (!text || selectedRating === 0) {
    alert('Please add a rating and review text.');
    return;
  }
  if (!currentDorm) return;

  const { error } = await supabase
    .from('reviews')
    .insert({
      dormId: currentDorm.id,
      name: name,
      rating: selectedRating,
      text: text,
      year: year
    });

  if (error) {
    console.error(error);
    alert('Failed to submit review. Please try again later.');
  } else {
    closeModal();
    document.getElementById('reviewName').value = '';
    document.getElementById('reviewText').value = '';
    selectedRating = 0;
    alert('Review submitted successfully! Thanks for contributing.');
  }
}

// Make key functions globally available for onclick handlers
window.showDetail = showDetail;
window.filterDorms = filterDorms;
window.setFilter = setFilter;
window.setOffCampusFilter = setOffCampusFilter;
window.openModal = openModal;
window.closeModal = closeModal;
window.setRating = setRating;
window.submitReview = submitReview;
window.backToList = backToList;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.navLightbox = navLightbox;
window.showSection = showSection;

// Safe initialization
document.addEventListener('DOMContentLoaded', () => {
  renderDorms();
  loadAllReviews();
  setupReviewsListener();
});
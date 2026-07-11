# PlanetDorm

Reviews for University of Maryland residence halls. Browse every on-campus dorm, filter and sort by area, type, and rating, view halls on an interactive 3D map, read resident reviews, and post your own.

**Live site:** https://knightener.github.io/planetdorm/

## Stack

- Static HTML/CSS/JS frontend (no build step), hosted on GitHub Pages
- [MapLibre GL](https://maplibre.org/) for the 3D campus map
- [Supabase](https://supabase.com/) for review storage, with Edge Functions (`supabase/functions/`) handling review submission (hCaptcha-verified) and helpful votes
- Dorm dataset lives in `assets/js/data.js`

## Structure

```
├── index.html            # main hall browser (list, filters, 3D map)
├── dorm-reviews.html     # per-hall reviews page
├── about.html, privacy.html, terms.html
├── assets/
│   ├── css/styles.css    # site-wide styles and design tokens
│   ├── js/script.js      # hall browser logic
│   ├── js/data.js        # dorm dataset (~40 halls)
│   ├── js/supabase.js    # Supabase client (public anon key)
│   └── img/
└── supabase/             # Edge Functions + SQL migrations
                          # (secrets live in the Supabase dashboard, not here)
```

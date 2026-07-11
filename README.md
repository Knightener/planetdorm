# PlanetDorm

Reviews for University of Maryland residence halls. Browse every on-campus dorm, filter and sort by area, type, and rating, view halls on an interactive 3D map, read resident reviews, and post your own.

**Live site:** https://knightener.github.io/planetdorm/

## Architecture

- **Frontend** — vanilla HTML/CSS/JS with no build step, served from GitHub Pages; [MapLibre GL](https://maplibre.org/) powers the 3D campus map
- **Backend** — [Supabase](https://supabase.com/) (Postgres + Edge Functions): reviews and helpful votes are stored in Postgres, and Edge Functions (`supabase/functions/`) handle review submission (hCaptcha-verified, server-side validation) and rate-limited helpful voting
- **Data** — the dorm dataset (names, areas, coordinates, photos) ships with the frontend in `assets/js/data.js`; user-generated reviews live in the database

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

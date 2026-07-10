# Handoff: Dorm Reviews Page — "Terp Classic" (La Plata Hall, UMD)

## Overview
A reviews page for a university dorm (La Plata Hall, University of Maryland College Park). Prospective students browse resident reviews, see rating breakdowns, and compare nearby dorms. Yelp/RateMyProfessor-style friendly student-app tone.

## About the Design Files
The file in this bundle (`dorm-reviews-1a.html`) is a **design reference created in HTML** — a static hi-fi mockup showing intended look, not production code to copy directly. The task is to **recreate this design in the target codebase's existing environment** (React, Vue, etc.) using its established patterns, component libraries, and routing — or, if no environment exists yet, choose the most appropriate framework and implement it there.

## Fidelity
**High-fidelity.** Colors, typography, spacing, and copy are final. Recreate pixel-perfectly using the codebase's existing conventions. It is desktop-only as designed (1180px canvas); responsive behavior below needs to be implemented.

## Screens / Views

### Dorm Reviews Page (single view)
Page background: `#faf9f7`. Content max-width ~1180px. Font family throughout: **DM Sans** (fallback: system-ui, sans-serif).

**1. Top nav** — white bar (`#fff`), bottom border `1px solid #ece9e4`, padding `14px 32px`, flex row, gap 24px:
- Logo: 28×28px rounded square (radius 8px), bg `#e21833`, gold "T" (`#ffd200`, 800 weight, 15px) + wordmark "TerpDorms" (17px, 800, letter-spacing -0.02em, `#1a1a1a`)
- Search pill: flex 1, max-width 420px, bg `#f2f0ec`, radius 999px, padding 9px 16px, placeholder text `#8a857c` 13.5px "⌕ Search dorms, neighborhoods…"
- Links (13.5px, 600, `#5c574e`, gap 20px): Dorms · Compare · Write a review (this one `#e21833`)

**2. Photo gallery strip** — CSS grid, `grid-template-columns: 2fr 1fr 1fr`, two 150px rows, gap 8px, padding `20px 32px 0`. First cell spans both rows (hero). All cells radius 14px. Cells are placeholders — replace with real photos: exterior (hero), double room, lounge, bathroom, "+12 photos" overlay cell (last cell links to full gallery).

**3. Dorm header** — flex row, padding `24px 32px 8px`:
- Left: H1 "La Plata Hall" (30px, 800, -0.03em, `#1a1a1a`) + pill badge "NORTH CAMPUS" (11.5px, 700, `#e21833` on `#fdeaec`, padding 4px 10px, radius 999px). Subline (14px, `#8a857c`): "Denton Community · 5 min to Eppley · 8 min to Stamp · Traditional-style, air-conditioned". Amenity chips (12.5px, 600, `#5c574e`, white bg, border `1px solid #e5e1da`, padding 6px 12px, radius 999px, gap 8px, wrap): ❄ AC / Elevator / Community bathrooms / Laundry each floor / Freshman-heavy
- Right (text-align right): score "4.1" (44px, 800, -0.04em) + 4 filled stars (`#ffb400`, 20px) with 5th empty (`#e5e1da`); below: "312 reviews · **$4,706**/semester (double)" (13px, `#8a857c`, price bold `#1a1a1a`)

**4. Body grid** — `grid-template-columns: 1fr 340px`, gap 28px, padding `20px 32px 32px`.

**Left column — reviews:**
- Filter/sort chip row (gap 8px, wrap). Active chip: white text on `#1a1a1a`, 12.5px 700, padding 7px 14px, radius 999px ("Most helpful"). Inactive chips: `#5c574e` on white, border `1px solid #e5e1da` ("Newest", "Room type ▾", "Year lived ▾", "★ 4+"). Dropdown chips open room-type / year filters.
- Review cards (white, border `1px solid #ece9e4`, radius 16px, padding 20px 22px, vertical gap 14px). Each card:
  - Header row: 40px circular avatar (bg alternates `#ffd200`/`#e21833`/`#1a1a1a`, initial letter 15px 800), name (14.5px 700) + "· Class year, Major" (12.5px 500 `#8a857c`), meta line "Lived here 2024–25 · Double · 4th floor" (12px `#8a857c`), stars right-aligned (`#ffb400` 15px, empty `#e5e1da`)
  - Body paragraph: 14px / 1.6 line-height, `#3d3a34`
  - Footer row: sentiment tag pills (11.5px 600, radius 999px, padding 4px 10px — positive: `#0b7a4b` on `#e7f4ee`; negative: `#b3540e` on `#fdf0e5`) + right-aligned "👍 Helpful (n)" (12.5px 600 `#8a857c`, clickable — increments count)
- "Show all 312 reviews" ghost button: centered, 13px 700 `#e21833`, border `1.5px solid #e21833`, radius 999px, padding 10px 22px (paginates/expands review list)

**Right column — sidebar (340px), two cards** (same card style as reviews):
- **Rating breakdown**: title 15px 800; 5 rows (gap 11px): label (86px, 12.5px `#5c574e`) + track (8px tall, `#f2f0ec`, radius 999px) with fill bar (`#e21833`, width = score/5) + score (12.5px 700, right). Values: Location 4.7 (94%), Community 4.4 (88%), Cleanliness 4.0 (80%), Facilities 3.8 (76%), Quietness 3.1 (62%). Divider then footnote 12.5px `#8a857c`: "92% of residents would recommend La Plata to an incoming freshman."
- **Compare nearby**: title 15px 800; rows (padding 9px 10px, radius 10px): dorm name (13.5px) + rating "n ★" (12.5px 700) + price (12px `#8a857c`). Current dorm row highlighted bg `#fdf6e0` and bold. Rows: La Plata 4.1★ $4.7k (highlighted) / Oakland 4.5★ $5.6k / Ellicott 3.6★ $4.5k / Cumberland 3.9★ $4.5k. Footer link "Compare side by side →" (12.5px 700 `#e21833`, centered) → comparison page.

## Interactions & Behavior
- Static mockup — no interactions were prototyped. Intended behavior:
  - Filter/sort chips toggle active state (invert to dark chip); dropdown chips open menus; filtering re-queries the review list
  - "Helpful" click increments count once per user
  - "Show all 312 reviews" expands or paginates
  - Gallery cells open a lightbox; "+12 photos" opens full gallery
  - "Write a review" → review submission flow (not designed yet)
  - Hover states: chips/buttons darken slightly; cards can lift with a subtle shadow (`0 2px 8px rgba(0,0,0,.06)`) — keep subtle
- **Responsive**: below ~1024px stack the sidebar under the reviews; below ~640px collapse gallery to a swipeable carousel, nav links into a menu, and header score inline under the title. (A separate mobile concept exists — option 1c in the exploration file — if you want a mobile-specific treatment.)

## State Management
- `reviews[]` (author, classYear, major, period, roomType, floor, rating, body, tags[], helpfulCount)
- `filters` (sort, roomType, yearLived, minRating), `visibleCount` for pagination
- `dorm` (name, campus/community, walkTimes, attributes, pricePerSemester, avgRating, reviewCount, categoryScores{}, recommendPct)
- `nearbyDorms[]` for compare card
- Fetching: dorm profile + paged review query with filter params

## Design Tokens
- **Colors**: primary red `#e21833`; gold `#ffd200`; red tint bg `#fdeaec`; gold tint bg `#fdf6e0`; ink `#1a1a1a`; body text `#3d3a34`; secondary `#5c574e`; muted `#8a857c`; page bg `#faf9f7`; card bg `#fff`; borders `#ece9e4` / `#e5e1da`; chip/track bg `#f2f0ec`; star gold `#ffb400`; positive `#0b7a4b` on `#e7f4ee`; negative `#b3540e` on `#fdf0e5`
- **Type** (DM Sans): H1 30/800/-0.03em; score 44/800; card titles 15/800; names 14.5/700; body 14/1.6; meta 12–13/400–600; chips 12.5/600–700; tags 11.5/600
- **Spacing**: page gutter 32px; column gap 28px; card gap 14px; card padding 20–22px; chip padding 7px 14px
- **Radius**: cards 16px (sidebar rows 10px, gallery 14px); pills/chips/avatars 999px; logo 8px
- **Borders**: `1px solid #ece9e4` (cards), `#e5e1da` (chips)

## Assets
- No image assets included — all photos are striped placeholders to be replaced with real photography (dorm exterior, double room, lounge, bathroom)
- "TerpDorms" logo is a placeholder mark (red square + gold T)
- Star/thumbs-up/search glyphs are unicode characters in the mockup — swap for the codebase's icon set
- Fonts: DM Sans via Google Fonts

## Files
- `dorm-reviews-1a.html` — standalone hi-fi design reference; open in any browser

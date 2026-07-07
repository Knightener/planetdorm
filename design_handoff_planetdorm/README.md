# Handoff: PlanetDorm — UMD Dorm Reviews (v2 redesign)

## Overview
PlanetDorm is a review site for University of Maryland residence halls. Students browse all on-campus halls, filter/sort them, open a hall's detail page (rating, breakdown, features, map), read reviews, and post their own (quick anonymous post or full named review). This bundle documents the full v2 flat/editorial redesign.

## About the Design Files
The files in this bundle are **design references created in HTML** — interactive prototypes showing the intended look and behavior. They are NOT production code to copy directly. Your task is to **recreate these designs in your codebase's existing environment** (React, Next.js, Vue, etc.) using its established patterns and libraries — or, if the project has no environment yet, pick an appropriate stack and implement the designs there.

- `PlanetDorm v2.dc.html` — the full prototype (all screens + logic). The markup lives between `<x-dc>` tags; the app logic is in the `class Component` script at the bottom. All styles are inline; read them as the source of truth for exact values.
- `data.js` — the real dorm dataset (ES module, ~40 halls with name, area, type, built year, lat/lng, image URLs, tags). Reusable as-is.

## Fidelity
**High-fidelity.** Colors, typography, spacing, and interactions are final. Recreate pixel-perfectly, mapping values to your design-token system.

## Design Tokens

Light theme (default):
- `--bg: #faf9f7` (warm off-white page background)
- `--field: #ffffff` (input/card surfaces)
- `--ink: #17161a` (primary text)
- `--dim: #6e6c75` (secondary text)
- `--line: #e2e0da` (hairline borders)
- `--hover: rgba(0,0,0,0.04)`
- `--red: #E21833`, `--red-dark: #B01228` (UMD red, primary action)
- `--gold: #cc9b00`, `--logo-gold: #d9a300`
- `--green: #0e7a52`, `--orange: #c05f00`

Dark theme (`data-theme="dark"` on `<html>`, persisted in localStorage):
- `--bg: #131215`, `--field: #1b1a1e`, `--ink: #f2f0eb`, `--dim: #97949e`, `--line: #2c2a30`, `--hover: rgba(255,255,255,0.06)`, `--green: #4cc492`, `--orange: #e59a4b`, `--gold: #f0c53c`, `--logo-gold: #ffd200`

Platinum (5-star) shine gradient, animated with `@keyframes platShine { to { background-position: -200% center } }`, 2.5s linear infinite, applied via background-clip:text:
- Light: `linear-gradient(110deg,#5d7488 0%,#c9d6e0 25%,#8fa5b5 45%,#52687b 60%,#c9d6e0 80%,#5d7488 100%)`
- Dark: `linear-gradient(110deg,#9fb6c9 0%,#ffffff 25%,#cfe2ef 45%,#a7c4d8 60%,#ffffff 80%,#9fb6c9 100%)`

Typography: **Manrope** (Google Fonts; weights 400–800) for everything. Headings weight 800 with letter-spacing −0.01/−0.02em. Body 0.85–0.95rem. Uppercase micro-labels: 0.7–0.78rem, weight 800, letter-spacing 0.12em.

Rating color scale (rounded rating): ≤2 red, 3 orange, 4 gold, 5 platinum gradient. Zero reviews: `--dim` with an em-dash.

Radii: pills 999px (chips, back button); cards/inputs 8–12px; sort chips 6px. Aesthetic is flat — hairline borders, no shadows, no gradients (platinum shine is the only exception).

## Screens / Views

### 1. Nav (all screens)
Sticky top bar, `--bg` background, 1px bottom border. Left: wordmark "PlanetDorm" 1.45rem/800 — "Planet" in `--red`, "Dorm" in `--logo-gold`. Right (28px gap): text buttons On-campus / Map / About (0.92rem/600, `--dim`; active = `--ink` with 2px `--red` underline), and a theme-toggle icon button (sun/moon, 16px stroke icons).

### 2. Home — hero + directory
Full-width, 48px horizontal padding.
- **Hero** (88px top / 56px bottom padding, hairline bottom border): H1 "Find a residence hall before you move in." — clamp(2.4rem–3.8rem)/800, red period; subline in `--dim` ~1.02rem; search input styled as a bare 2px bottom border (`--ink`, focus `--red`), max-width 440px, animated typewriter placeholder cycling 4 phrases.
- **Filter band** (three rows, 14px gap, hairline bottom border): row label (uppercase micro-label, 76px fixed) + pill chips (6px 14px padding, 0.82rem/600). Unselected: 1px `--line` border, `--dim` text. Selected: `--ink` bg, `--bg` text. Groups: Campus (North/South/The Commons), Rooms (Traditional/Semi-Suite/Suite/Apartment), Features (A/C, In-hall Laundry, Honors/LLP). A red underlined "Clear all" appears when any filter is active.
- **Count + sort row**: "N halls" left (`--dim` 0.88rem/600); right "SORT" micro-label + three text buttons (Default / Highest rated / Lowest rated), active = `--ink` with 2px red underline.
- **Directory list** (not cards): one row per hall — grid `104px 1fr auto`, 24px gap, 20px 8px padding, hairline bottom border, hover `--hover`. Thumbnail 104×72 (cover). Name 1.1rem/700; meta line (`--dim` 0.85rem): "Type · Campus · tag · tag". Right-aligned rating "4.5 ★" 1.15rem/800 in rating color (platinum shine at 5), review count under it.

### 3. Detail page ("data rail" layout)
48px padding; back button = pill "All halls" (1px `--line` border, radius 999, hover ink border + `--hover` bg). Grid `320px 1fr`, 40px gap.

**Left rail** (sticky top 88px; a 12px-radius bordered `--field` panel, 20px padding) top-to-bottom:
1. Photo 160px tall, radius 8, click opens fullscreen lightbox.
2. Hall name 1.35rem/800; meta "Type · Built YYYY · Campus" 0.8rem `--dim`.
3. Compact map placeholder 150px (production: Leaflet + OpenStreetMap, marker at hall lat/lng from data.js).
4. Rating box: bordered `--bg` box radius 10, big number 2.2rem/800 in tier color, stars + "N reviews" beside it.
5. Histogram: rows 5→1, grid `10px 1fr 18px`, 6px bars radius 3, track `--hover`, fill `--logo-gold`, count right.
6. Checklist (hairline top border): rows label left / value right — A/C and In-hall laundry get ✓ (`--green`) or ✕ (`--red`); other tags (LLPs etc.) ✓; then Rooms / Dining / Built as text values in `--dim` 700.
7. Full-width red "Write a review" button (radius 8, hover `--red-dark`); centered underlined "Official UMD page ↗" link (deep-links to drf.umd.edu hall page).

**Right column**:
1. **Quick-post strip** (bordered `--field` box radius 10, 16px 18px padding, flex-wrap 14px gap): 5 tappable stars (1.4rem), year chips (last 4 academic years, pill; selected = ink bg), flex-1 text input ("Quick review — what's the one thing to know?"), gold "Post" button (dark text, hover turns red/white). Caption below: "Posting as **Anonymous Terp** · for a named review use 'Write a review'".
2. **Header row**: "N reviews" 1rem/800 left; right sort chips Newest / Highest / Lowest (0.72rem/700, radius 6; selected = `--ink` bg `--bg` text).
3. **Review rows** (10px gap column): each a bordered `--field` box radius 10, flex with 36px circular avatar (initial, `--red` bg for named users, `--dim` for Anonymous) + content: name 0.88rem/700, stars in rating tier color (0.78rem), right-aligned "year · posted date" in `--dim`; body 0.9rem/1.6.
4. **Full review form** (opens below on "Write a review"): max-width 600px; uppercase micro-labels; name input; 5-star picker (2.1rem); year grid (4 columns, 11 academic years, selected = ink bg); textarea (130px, 2000 char max with live counter); hCaptcha-style "I am human" checkbox mock; Cancel (outlined) + Submit (red) buttons 50/50.

### 4. Map view
Full-viewport-height placeholder (production: Leaflet campus map, OSM tiles, marker per hall, popups linking to detail pages).

### 5. Global
- Footer disclaimer: "This website is not affiliated with the University of Maryland." (hidden on Map view).
- Toast: fixed bottom-center, `--ink` bg, success text `--bg` / error text #ff9aa6, fades+slides in, auto-dismisses in 3.5s.
- Lightbox: fixed rgba(0,0,0,.92) overlay, image contained at 90%/85vh, × button top-right, click anywhere closes.

## Interactions & Behavior
- SPA-style view switching: home / detail / map (no page reloads; use your router).
- Search filters by name, area, type, and tags (case-insensitive substring).
- Filters AND across groups, OR within a group. Sort: default (data order), rating desc/asc; zero-review halls always sink to the bottom of rating sorts.
- Theme toggle persists (localStorage key `pd2-theme`), applies `data-theme="dark"` to root.
- Quick post validation order: rating → year → text; errors surface as toasts. Posts as "Anonymous Terp", prepends to list, recomputes avg + histogram immediately.
- Full form additionally requires the captcha; name defaults to "Anonymous Terp".
- Review sort chips re-sort in place (newest by created_at desc).
- Hover states throughout: rows get `--hover` bg; chips/buttons swap to ink border or darker red — all 150–200ms transitions.

## State Management
- `view` ('home' | 'detail' | 'map'), `dormId`
- `q` (search), `campusF[]`, `roomF[]`, `featF[]`, `sort`, `reviewSort`
- `theme`, `formOpen`, form fields (`revName`, `revText`, `revRating`, `revYear`, `capOk`), toast state, `lightboxSrc`
- Dorm data is static (data.js); reviews need a backend (per-dorm list of {name, year, rating, text, created_at}). Rating + count are derived, never stored.

## Assets
- Hall photos: hotlinked from `reslife.umd.edu` (see `imgs` in data.js) — download/self-host for production.
- Google Fonts: Manrope 400–800.
- Map: Leaflet + OpenStreetMap (placeholders in the prototype).

## Files
- `PlanetDorm v2.dc.html` — full prototype (markup + inline styles + logic class)
- `data.js` — dorm dataset

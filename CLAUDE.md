# Shikhte Chai website: guide for coding agents

Static Astro 7 site for shikhtechai.com, a non-profit YouTube channel (@ShikhteChaiBD) that explains mental health and
science in plain Bangla for teens and young adults. ~100 videos; mental health is the main shelf, science the second.
Hosted on GitHub Pages (no server, no custom headers). Bangla is the default at `/`, English at `/en/`.
Read README.md for content workflows, the professionals directory and Supabase setup.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on :4321 (no CSP in dev; it is added at build time) |
| `npm run verify` | Build + `scripts/check-site.mjs`: SEO, a11y, CSP, broken links, JSON-LD, sitemap. **Must pass.** |
| `npm run audit` | Real Chrome over `dist/`: script errors, CSP violations, sideways scroll at 360–1440px, auto-scroll, video player, Lighthouse (a11y/BP/SEO = 100, perf ≥ 90). Run `npm run build` first. `-- --no-lighthouse` for a 30 s run. |
| `npm run thumbs` | Makes missing self-hosted thumbnails in `public/thumbs/` (needs network) |
| `npm run sync-videos` | Pulls new uploads and stats from YouTube, then makes thumbnails |

## Definition of done

1. `npm run verify` reports 0 errors and 0 warnings.
2. For any change to layout, CSS, scripts or images: `npm run build && npm run audit` passes. Paste the Lighthouse table in your summary.
3. Both languages still work: check the `/en/` version of anything you touched.
4. Nothing in "Never" below was done.

## Map

- `src/pages/[...lang]/`: every page is generated twice (bn at `/`, en at `/en/`) from one file. `watch/[id].astro` is one page per video.
- `src/layouts/Base.astro`: `<head>` (meta, canonical, hreflang, OG), header, footer, bottom tab bar. Pages put extra head tags in `slot="head"`.
- `src/i18n/ui.ts` (+ `pros.ts`): **all** interface text, in both languages. Never hard-code text in a page.
- `src/data/`: `videos.json` (id, topic, bn/en titles), `meta.json` (generated stats; do not hand-edit), `categories.ts`, `curated.ts` (home page picks).
- `src/components/`: `VideoCard`, `Thumb` (AVIF + WebP `<picture>`), `Player` (click-to-load YouTube), `JsonLd`, `Helpline`.
- `src/scripts/`: browser code. Bundled by Astro; small `is:inline` scripts live in the pages.
- `integrations/csp.mjs`: adds a Content-Security-Policy `<meta>` to every built page, hashing each inline script.
- `scripts/`: `check-site.mjs`, `audit.mjs`, `thumbs.mjs`, `sync-videos.mjs`, `supabase-setup.mjs`.
- `supabase/migrations/`: directory tables and row-level security. Merging to main **applies them to the live database**.

## Rules that are easy to break

- **CSP.** No inline event handlers (`onclick=`), no `javascript:` URLs, no `eval`. Inline `<script>` is fine: its hash is added automatically.
  A new external origin (API, image host, iframe) must be added to the `csp()` options in `astro.config.mjs`, or the browser will block it.
- **Escaping.** Browser code that builds HTML strings must pass every value through `esc()` (see `src/scripts/professionals.ts`). Supabase rows are user-submitted.
- **No layout shift.** Anything visible on first paint must be in the HTML at its final size. Do not let a script reveal, hide or resize content above the fold after load. Use the `.js` class on `<html>` (set before paint) for script-only UI.
- **Never scroll the page from a script on load** (e.g. `scrollIntoView` while setting initial state). That caused the home page to jump on phones.
- **Images.** Video thumbnails go through `Thumb.astro` or `thumb()`/`thumbSrcset()`; give every `<img>` `width`, `height`, `alt` (empty for decorative) and `loading="lazy"` below the fold.
- **360px phones.** Test at 360px wide; that is the most common Android width in Bangladesh.
- **SEO.** One `<h1>` per page. Titles and meta descriptions are unique per page and language (English pages must not reuse Bangla text). Structured data goes through `JsonLd.astro`.
- **Both languages.** Every new string needs a Bangla and an English version. Bangla numerals via `num()`.

## Mental-health content

The audience includes young people in distress. Keep the crisis notice (999) and the Kaan Pete Roi helpline (`src/config.ts`) reachable from every page.
Do not write medical advice, diagnoses or treatment claims into the site. Do not change helpline numbers or hours without a cited source.
Professionals are listed only after a human admin approves them. Never auto-approve or bypass that step.

## Never (ask the user first)

- Read or print `.env` or `supabase/setup.env`, or put a secret in a `PUBLIC_` variable (those end up in the website's code).
- Run `npm run setup:supabase`, `supabase db push` or anything else that changes the live database.
- Push to `main`, force-push, or merge pull requests. Pushing to main deploys the site and applies migrations.
- Delete videos from `videos.json` or thumbnails from `public/thumbs/` (sync-videos removes ones that are gone from YouTube).

## Agents and skills in `.claude/`

- Skills: `/audit` (full quality report), `/review-videos` (finish new uploads from sync-videos), `/ship` (verify, commit, open a PR).
- Subagents: `seo-auditor`, `ux-reviewer`, `security-reviewer`, `content-curator`. Use them for focused reviews; they report, they do not deploy.
- A stop hook runs `npm run verify` when source files changed and sends you back to fix errors.

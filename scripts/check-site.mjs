// Checks the built site in dist/ for SEO, accessibility and security mistakes. Run `npm run verify` (build + check).
// Exits with 1 when there is an error, so CI blocks the deploy; warnings are printed but do not fail.
//   node scripts/check-site.mjs            check everything
//   node scripts/check-site.mjs --quiet    print errors and the summary only
import { readFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';

const DIST = path.resolve('dist');
const SITE = 'https://shikhtechai.com';
const quiet = process.argv.includes('--quiet');
const errors = [];
const warnings = [];
const err = (page, msg) => errors.push(`${page}: ${msg}`);
const warn = (page, msg) => warnings.push(`${page}: ${msg}`);

try { await access(DIST); } catch { console.error('dist/ not found: run `npm run build` first.'); process.exit(1); }

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else yield full;
  }
}

const files = new Set();
const pages = [];
for await (const f of walk(DIST)) {
  const rel = '/' + path.relative(DIST, f).split(path.sep).join('/');
  files.add(rel);
  if (rel.endsWith('.html')) pages.push(rel);
}

const attr = (tag, name) => new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, 'i').exec(tag)?.[1];
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const chars = (s) => [...s].length;
const urlOf = (rel) => rel.replace(/index\.html$/, '').replace(/\.html$/, '/');

/** Does a same-site href point at a file that exists? */
function resolves(href) {
  const p = decodeURI(href.split(/[?#]/)[0]);
  if (!p || p === '/') return files.has('/index.html');
  return files.has(p) || files.has(p.replace(/\/?$/, '/index.html')) || files.has(p + '.html');
}

const titles = new Map();
const descs = new Map();
let indexable = 0;

for (const rel of pages) {
  const html = await readFile(path.join(DIST, rel), 'utf8');
  const page = urlOf(rel);
  if (/<meta http-equiv="refresh"/i.test(html)) continue; // redirect stub
  const head = html.slice(0, html.search(/<\/head>/i) + 1 || html.length);
  const noindex = /<meta name="robots" content="noindex/i.test(head);
  const is404 = rel === '/404.html';

  // --- head basics
  if (!/^<!doctype html>/i.test(html)) err(page, 'missing <!doctype html>');
  if (!/<html[^>]*\blang="(bn|en)"/i.test(html)) err(page, '<html> has no lang="bn" or lang="en"');
  if (!/<meta name="viewport"/i.test(head)) err(page, 'missing viewport meta');
  const title = decode(/<title>([^<]*)<\/title>/i.exec(head)?.[1] ?? '').trim();
  if (!title) err(page, 'missing <title>');
  else if (chars(title) > 70) warn(page, `title is ${chars(title)} characters (search results show about 60): "${title}"`);
  const desc = decode(/<meta name="description" content="([^"]*)"/i.exec(head)?.[1] ?? '').trim();
  if (!desc) err(page, 'missing meta description');
  else if (chars(desc) < 50) warn(page, `meta description is short (${chars(desc)} characters)`);
  else if (chars(desc) > 200) warn(page, `meta description is long (${chars(desc)} characters)`);
  if (!noindex && !is404) {
    indexable++;
    titles.set(title, [...(titles.get(title) ?? []), page]);
    descs.set(desc, [...(descs.get(desc) ?? []), page]);
  }

  // --- canonical and language alternates
  const canonical = /<link rel="canonical" href="([^"]*)"/i.exec(head)?.[1];
  if (!canonical) { if (!is404) err(page, 'missing canonical link'); }
  else if (!canonical.startsWith(SITE + '/')) err(page, `canonical is not on ${SITE}: ${canonical}`);
  else if (!noindex && !is404 && new URL(canonical).pathname !== page) err(page, `canonical points elsewhere: ${canonical}`);
  if (!noindex && !is404) {
    const alts = [...head.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/gi)];
    if (alts.length) {
      for (const want of ['bn', 'en', 'x-default']) if (!alts.some((a) => a[1] === want)) err(page, `hreflang ${want} missing`);
      for (const [, , href] of alts) if (!resolves(new URL(href).pathname)) err(page, `hreflang target does not exist: ${href}`);
    }
    for (const p of ['og:title', 'og:description', 'og:image', 'og:url']) if (!head.includes(`property="${p}"`)) err(page, `missing ${p}`);
  }

  // --- security
  const cspAt = head.search(/<meta http-equiv="Content-Security-Policy"/i);
  const firstScript = html.search(/<script\b/i);
  if (cspAt < 0) err(page, 'no Content-Security-Policy meta tag');
  else if (firstScript >= 0 && firstScript < cspAt) err(page, 'a <script> comes before the Content-Security-Policy');
  if (/\son[a-z]+\s*=\s*["']/i.test(html.replace(/<script\b[\s\S]*?<\/script>/gi, ''))) err(page, 'inline event handler (onclick= etc.) is blocked by the CSP');
  if (/href="javascript:/i.test(html)) err(page, 'javascript: link');
  for (const [tag] of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/gi)) {
    if (!/rel="[^"]*noopener/i.test(tag)) err(page, `target=_blank without rel=noopener: ${tag.slice(0, 100)}`);
  }
  for (const [tag] of html.matchAll(/<(script|iframe|img)\b[^>]*\bsrc="http:\/\/[^"]*"/gi)) err(page, `insecure http:// resource: ${tag.slice(0, 100)}`);

  // --- content
  const body = html.slice(html.search(/<body/i));
  const h1s = (body.match(/<h1\b/gi) ?? []).length;
  if (h1s !== 1) err(page, `${h1s} <h1> elements (want exactly 1)`);
  for (const [tag] of body.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\balt=/i.test(tag)) err(page, `<img> without alt: ${tag.slice(0, 100)}`);
    if (!/\bwidth=/i.test(tag) || !/\bheight=/i.test(tag)) warn(page, `<img> without width/height (layout shift): ${tag.slice(0, 80)}`);
  }
  if (/<main\b/i.test(body) === false) err(page, 'no <main> landmark');

  // --- structured data
  for (const [, json] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try {
      const d = JSON.parse(json);
      const items = Array.isArray(d) ? d : [d];
      for (const it of items) if (!it['@context']) err(page, 'JSON-LD without @context');
      const graph = items.flatMap((it) => it['@graph'] ?? [it]);
      for (const v of graph.filter((g) => g['@type'] === 'VideoObject')) {
        for (const k of ['name', 'description', 'thumbnailUrl', 'uploadDate']) if (!v[k]) err(page, `VideoObject has no ${k} (needed for video rich results)`);
      }
    } catch (e) { err(page, `JSON-LD does not parse: ${e.message}`); }
  }

  // --- links
  for (const [, href] of body.matchAll(/<a\b[^>]*\bhref="([^"]*)"/gi)) {
    const h = decode(href);
    if (h.startsWith('/') && !h.startsWith('//') && !resolves(h)) err(page, `broken link: ${h}`);
  }
}

// --- site-wide
for (const [t, list] of titles) if (list.length > 1) err(list[0], `same <title> on ${list.length} pages: "${t}" (${list.slice(0, 3).join(', ')}…)`);
for (const [d, list] of descs) if (list.length > 1) warn(list[0], `same meta description on ${list.length} pages (${list.slice(0, 3).join(', ')}…): "${d.slice(0, 50)}…"`);

const robots = await readFile(path.join(DIST, 'robots.txt'), 'utf8').catch(() => '');
if (!/Sitemap:\s*https:\/\/shikhtechai\.com\/sitemap-index\.xml/i.test(robots)) err('/robots.txt', 'does not point at sitemap-index.xml');
const sitemapFiles = [...files].filter((f) => /^\/sitemap-\d+\.xml$/.test(f));
let inSitemap = 0;
for (const f of sitemapFiles) {
  const xml = await readFile(path.join(DIST, f), 'utf8');
  for (const [, loc] of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    inSitemap++;
    const p = new URL(loc).pathname;
    if (!resolves(p)) err(f, `lists a page that does not exist: ${loc}`);
    else {
      const html = await readFile(path.join(DIST, p.replace(/\/?$/, '/index.html')), 'utf8').catch(() => '');
      if (/<meta name="robots" content="noindex/i.test(html)) err(f, `lists a noindex page: ${loc}`);
    }
  }
}
if (!sitemapFiles.length) err('/sitemap', 'no sitemap generated');
if (inSitemap < indexable) warn('/sitemap', `${indexable} indexable pages but only ${inSitemap} in the sitemap`);

// --- report
if (!quiet) for (const w of warnings) console.log(`warn  ${w}`);
for (const e of errors) console.log(`ERROR ${e}`);
console.log(`\nchecked ${pages.length} pages (${indexable} indexable, ${inSitemap} in sitemap): ${errors.length} errors, ${warnings.length} warnings`);
process.exit(errors.length ? 1 : 0);

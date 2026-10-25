// Opens the built site in a real browser and checks what scripts/check-site.mjs cannot see from the files alone:
// script errors, Content-Security-Policy violations, sideways scrolling on phones, pages that scroll by themselves,
// the video player, and Lighthouse scores.
//   npm run audit                          browser checks + Lighthouse on the key pages (run `npm run build` first)
//   npm run audit -- --no-lighthouse       browser checks only (about 30 seconds)
//   npm run audit -- --pages=/,/videos/    only these pages
// Chrome is found automatically, or set CHROME_PATH. Lighthouse runs through npx, so the first run downloads it.
// Thresholds: Lighthouse accessibility, best practices and SEO must be 100; performance at least AUDIT_MIN_PERF (90).
// The full results go to .audit/report.json. Exits with 1 when anything fails.
import { spawn, execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { promisify } from 'node:util';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const flag = (name) => args.find((a) => a.startsWith(`--${name}`))?.split('=')[1] ?? (args.includes(`--${name}`) ? true : undefined);
const PORT = 4391;
const BASE = `http://localhost:${PORT}`;
const MIN_PERF = Number(process.env.AUDIT_MIN_PERF ?? 90);
const CHROME = process.env.CHROME_PATH ?? [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].find(existsSync);
if (!CHROME) { console.error('Chrome not found: set CHROME_PATH.'); process.exit(1); }
if (!existsSync('dist/index.html')) { console.error('dist/ not found: run `npm run build` first.'); process.exit(1); }

const watchId = JSON.parse(await readFile('src/data/videos.json', 'utf8')).videos[0].id;
const PAGES = flag('pages')?.split(',') ?? [
  '/', '/en/', '/videos/', '/videos/?q=%E0%A6%B0%E0%A6%BE%E0%A6%97', `/watch/${watchId}/`, `/en/watch/${watchId}/`,
  '/professionals/', '/professionals/?view=places', '/professionals/join/', '/contact/', '/support/', '/about/', '/admin/',
];
const LH_PAGES = PAGES.filter((p) => !p.includes('?') && p !== '/admin/');
const WIDTHS = [360, 390, 768, 1440];
const failures = [];
const fail = (msg) => { failures.push(msg); console.log(`  FAIL ${msg}`); };

// --- serve dist/
const server = spawn('npx', ['astro', 'preview', '--port', String(PORT)], { stdio: 'ignore', detached: true });
const stop = () => { try { process.kill(-server.pid); } catch { /* already gone */ } };
process.on('exit', stop);
for (let i = 0; ; i++) {
  try { if ((await fetch(BASE)).ok) break; } catch { /* not up yet */ }
  if (i > 60) { console.error('preview server did not start'); process.exit(1); }
  await new Promise((r) => setTimeout(r, 250));
}

// --- browser checks
console.log(`Browser checks: ${PAGES.length} pages × ${WIDTHS.length} widths`);
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const report = { browser: [], lighthouse: [] };
for (const width of WIDTHS) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 800, isMobile: width < 900, hasTouch: width < 900 });
  await page.evaluateOnNewDocument(() => {
    document.addEventListener('securitypolicyviolation', (e) => console.error(`CSP violation: ${e.violatedDirective} blocked ${e.blockedURI || 'inline code'}`));
  });
  let errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  page.on('pageerror', (e) => errors.push(`script error: ${e.message.slice(0, 200)}`));
  for (const path of PAGES) {
    errors = [];
    await page.goto(BASE + path, { waitUntil: 'networkidle0' });
    const isWatch = path.includes('/watch/');
    if (isWatch && width === 390) {
      await page.click('.player-btn');
      await page.waitForSelector('.player iframe.ready', { timeout: 10000 }).catch(() => fail(`${path}: the video player did not load after pressing play`));
    }
    const r = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
      scrollY: Math.round(window.scrollY),
      culprit: [...document.querySelectorAll('body *')]
        .filter((e) => e.getBoundingClientRect().right > document.documentElement.clientWidth + 1 && getComputedStyle(e).position !== 'fixed')
        .filter((e) => ![...e.children].some((c) => c.getBoundingClientRect().right > document.documentElement.clientWidth + 1))
        .filter((e) => !e.closest('.chips, .cat-list, .shelves'))
        .slice(0, 2).map((e) => `<${e.tagName.toLowerCase()} class="${e.className}">`),
    }));
    const tag = `${path} @${width}px`;
    if (r.scrollWidth > r.viewport) fail(`${tag}: page scrolls sideways (${r.scrollWidth}px wide); widest: ${r.culprit.join(', ')}`);
    if (r.scrollY > 0) fail(`${tag}: page scrolled by itself to ${r.scrollY}px while loading`);
    for (const e of errors) if (!(isWatch && /youtube|doubleclick|googlevideo/i.test(e))) fail(`${tag}: ${e}`);
    report.browser.push({ path, width, ...r, errors });
  }
  await page.close();
}
await browser.close();

// --- Lighthouse (mobile, simulated slow 4G: the same settings as PageSpeed Insights)
if (!flag('no-lighthouse')) {
  console.log(`\nLighthouse (mobile): ${LH_PAGES.length} pages`);
  await mkdir('.audit', { recursive: true });
  const run = promisify(execFile);
  for (const path of LH_PAGES) {
    const out = `.audit/lh${path.replace(/\W+/g, '_')}.json`;
    await rm(out, { force: true });
    try {
      await run('npx', ['-y', 'lighthouse@12', BASE + path, '--quiet', '--output=json', `--output-path=${out}`, '--form-factor=mobile', '--chrome-flags=--headless=new --no-sandbox'], { env: { ...process.env, CHROME_PATH: CHROME }, maxBuffer: 1 << 26 });
    } catch (e) { fail(`${path}: Lighthouse did not run (${e.message.split('\n')[0]})`); continue; }
    const lh = JSON.parse(await readFile(out, 'utf8'));
    const score = (k) => Math.round((lh.categories[k]?.score ?? 0) * 100);
    const row = {
      path, performance: score('performance'), accessibility: score('accessibility'), bestPractices: score('best-practices'), seo: score('seo'),
      lcp: lh.audits['largest-contentful-paint'].displayValue, cls: lh.audits['cumulative-layout-shift'].displayValue, tbt: lh.audits['total-blocking-time'].displayValue,
      failing: Object.values(lh.audits).filter((a) => a.score !== null && a.score < 0.9 && !['informative', 'manual', 'notApplicable'].includes(a.scoreDisplayMode)).map((a) => a.id),
    };
    report.lighthouse.push(row);
    console.log(`  ${path.padEnd(28)} perf ${row.performance}  a11y ${row.accessibility}  bp ${row.bestPractices}  seo ${row.seo}  | LCP ${row.lcp}  CLS ${row.cls}  TBT ${row.tbt}`);
    if (row.performance < MIN_PERF) fail(`${path}: performance ${row.performance} < ${MIN_PERF} (failing audits: ${row.failing.join(', ')})`);
    for (const k of ['accessibility', 'bestPractices', 'seo']) if (row[k] < 100) fail(`${path}: ${k} ${row[k]} < 100 (failing audits: ${row.failing.join(', ')})`);
  }
}

await mkdir('.audit', { recursive: true });
await writeFile('.audit/report.json', JSON.stringify({ when: new Date().toISOString(), failures, ...report }, null, 1));
console.log(failures.length ? `\n${failures.length} problem(s). Details in .audit/report.json` : '\nAll checks passed. Details in .audit/report.json');
stop();
process.exit(failures.length ? 1 : 0);

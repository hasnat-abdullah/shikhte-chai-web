// Makes the site's own video thumbnails in public/thumbs/: <id>-320 and <id>-640, as AVIF and WebP, cropped to 16:9.
//   node scripts/thumbs.mjs           make the missing ones (run after adding videos; sync-videos runs it too)
//   node scripts/thumbs.mjs --force   remake all of them
// Serving them from the site is faster than YouTube's 4:3 letterboxed images (one less connection; the AVIF files are
// about a third of the bytes) and means visitors' browsers do not contact YouTube until they press play.
// AVIF is what nearly every browser loads; WebP is the fallback for older ones (iOS 15, old Samsung Internet).
// A video without files here simply keeps using YouTube's image (see thumb() in src/data/videos.ts).
import { readFile, mkdir, access } from 'node:fs/promises';
import sharp from 'sharp';

const OUT = new URL('../public/thumbs/', import.meta.url);
const WIDTHS = [320, 640];
const FORMATS = { avif: { quality: 45, effort: 6 }, webp: { quality: 55, effort: 6 } };
const force = process.argv.includes('--force');
const data = JSON.parse(await readFile(new URL('../src/data/videos.json', import.meta.url), 'utf8'));
const ids = [...new Set([...data.videos.map((v) => v.id), data.introId].filter(Boolean))];
await mkdir(OUT, { recursive: true });

const exists = (p) => access(p).then(() => true, () => false);

/** The best image YouTube has: maxres is true 16:9; the others are 4:3 with black bars, cropped away below. */
async function source(id) {
  for (const name of ['maxresdefault', 'sddefault', 'hqdefault']) {
    const res = await fetch(`https://i.ytimg.com/vi/${id}/${name}.jpg`);
    if (res.ok) return Buffer.from(await res.arrayBuffer());
  }
  throw new Error('no thumbnail on YouTube');
}

let made = 0, failed = 0;
async function one(id) {
  const files = WIDTHS.flatMap((w) => Object.keys(FORMATS).map((f) => new URL(`${id}-${w}.${f}`, OUT)));
  if (!force && (await Promise.all(files.map(exists))).every(Boolean)) return;
  try {
    const img = sharp(await source(id));
    const { width, height } = await img.metadata();
    const h = Math.round((width * 9) / 16);
    const cropped = img.extract({ left: 0, top: Math.max(0, Math.round((height - h) / 2)), width, height: Math.min(h, height) });
    for (const w of WIDTHS) {
      const sized = cropped.clone().resize(w, Math.round((w * 9) / 16), { fit: 'cover' });
      for (const [f, opts] of Object.entries(FORMATS)) await sized.clone()[f](opts).toFile(new URL(`${id}-${w}.${f}`, OUT).pathname);
    }
    made++;
  } catch (e) {
    failed++;
    console.warn(`${id}: ${e.message}`);
  }
}

// A few at a time, to be gentle with YouTube.
for (let i = 0; i < ids.length; i += 8) await Promise.all(ids.slice(i, i + 8).map(one));
console.log(`thumbnails: ${made} made, ${ids.length - made - failed} already there, ${failed} failed`);

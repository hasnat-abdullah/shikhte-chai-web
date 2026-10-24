// Syncs video data from YouTube (no API key needed).
//   node scripts/sync-videos.mjs            add new uploads (latest 15 from the channel feed) and refresh stats
//   node scripts/sync-videos.mjs --stats    refresh stats only
// Videos that became private or were deleted are removed from the site.
// New uploads get a guessed topic and `"review": true`; check them before publishing.
import { readFile, writeFile } from 'node:fs/promises';

const VIDEOS = new URL('../src/data/videos.json', import.meta.url);
const META = new URL('../src/data/meta.json', import.meta.url);
const statsOnly = process.argv.includes('--stats');
const UA = { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'en' };

const data = JSON.parse(await readFile(VIDEOS, 'utf8'));
const meta = JSON.parse(await readFile(META, 'utf8').catch(() => '{}'));
const known = new Set([...data.videos.map((v) => v.id), data.introId]);

// Topic guess for new uploads. Order matters: first match wins.
const RULES = [
  ['addiction', /নেশা|মাদক|আসক্তি|addict|drug|craving/i],
  ['mood', /বিষণ্ণ|আত্মহত্যা|depress|suicid/i],
  ['anxiety', /দুশ্চিন্তা|ভীতি|প্যানিক|anxiety|panic|phobia|OCD/i],
  ['relationships', /সম্পর্ক|দাম্পত্য|ভালোবাসা|ভালবাসা|প্রেম|marital|relationship|love/i],
  ['parenting', /শিশু|সন্তান|বাচ্চা|অটিজম|বাবা|parent|child|autism/i],
  ['calm', /শিথিল|মাইন্ডফুল|relax|mindful/i],
  ['self', /রাগ|আত্মশক্তি|আবেগ|anger|self/i],
  ['help', /মানসিক|কাউন্সেলিং|সাইকো|mental|counsel|psycholog/i],
  ['health', /স্বাস্থ্য|রোগ|ভ্যাক্সিন|ভ্যাকসিন|health|disease|vaccine/i],
  ['study', /গণিত|পড়াশোনা|math|study|exam/i],
];
const guess = (t) => (RULES.find(([, re]) => re.test(t)) ?? ['tech'])[0];

async function feed() {
  const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${data.channelId}`, { headers: UA });
  if (!res.ok) throw new Error(`feed ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<entry>[\s\S]*?<yt:videoId>(.*?)<\/yt:videoId>[\s\S]*?<title>(.*?)<\/title>/g)].map((m) => ({
    id: m[1],
    title: m[2].replace(/&amp;/g, '&').replace(/&#39;/g, '’').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
  }));
}

async function details(id) {
  const res = await fetch(`https://www.youtube.com/watch?v=${id}&hl=en`, { headers: UA });
  const html = await res.text();
  const m = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});\s*(?:var|<\/script>)/s);
  if (!m) throw new Error('no player response');
  const j = JSON.parse(m[1]);
  const vd = j.videoDetails;
  if (!vd) {
    const ps = j.playabilityStatus ?? {};
    const gone = ps.status === 'ERROR' || /private|unavailable|removed|terminated/i.test(ps.reason ?? '');
    throw Object.assign(new Error(ps.reason || 'no video details'), { gone });
  }
  const mf = j.microformat?.playerMicroformatRenderer;
  // Widescreen thumbnail (no black bars) for link previews; some older videos only have the 4:3 one.
  const maxres = (await fetch(`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`, { method: 'HEAD' })).ok;
  return {
    maxres,
    views: Number(vd.viewCount),
    date: (mf?.publishDate ?? '').slice(0, 10),
    secs: Number(vd.lengthSeconds),
    desc: (vd.shortDescription ?? '').trim(),
  };
}

let added = 0;
if (!statsOnly) {
  try {
    for (const e of (await feed()).reverse()) {
      if (known.has(e.id)) continue;
      const [bn, en = ''] = e.title.split(/\s*\|\|\s*/);
      const latin = /^[\x00-\x7F‘’]+$/.test(bn);
      data.videos.unshift({ id: e.id, cat: guess(e.title), bn: latin && !en ? bn : bn, en: en || (latin ? bn : ''), review: true });
      known.add(e.id);
      added++;
      console.log(`+ new: ${e.id} ${e.title}`);
    }
  } catch (err) {
    console.warn('feed failed:', err.message);
  }
}

const ids = [...data.videos.map((v) => v.id), data.introId];
let ok = 0, failed = 0;
const gone = new Set();
const queue = [...ids];
await Promise.all(Array.from({ length: 6 }, async () => {
  while (queue.length) {
    const id = queue.shift();
    try { meta[id] = await details(id); ok++; }
    catch (err) {
      if (err.gone && id !== data.introId) { gone.add(id); console.log(`- removed from YouTube (${err.message}): ${id}`); }
      else { failed++; console.warn(`stats failed for ${id}: ${err.message}`); }
    }
  }
}));

for (const id of gone) delete meta[id];
data.videos = data.videos.filter((v) => !gone.has(v.id));
const sorted = Object.fromEntries(Object.entries(meta).sort(([a], [b]) => a.localeCompare(b)));
await writeFile(META, JSON.stringify(sorted, null, 1) + '\n');
if (added || gone.size) await writeFile(VIDEOS, JSON.stringify(data, null, 1) + '\n');
console.log(`done: ${added} new, ${gone.size} removed, stats ok ${ok}, failed ${failed}`);
if (ok === 0) process.exit(1);

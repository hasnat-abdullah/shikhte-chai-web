import { existsSync } from 'node:fs';
import path from 'node:path';
import raw from './videos.json';
import metaRaw from './meta.json';
import { CAT, CATEGORIES, type Lang, type Shelf } from './categories';

export interface Video {
  id: string;
  cat: string;
  bn: string;
  en: string;
}

export interface Meta { maxres?: boolean; views: number; date: string; secs: number; desc: string }
const META = metaRaw as Record<string, Meta>;
export const meta = (id: string): Meta | undefined => META[id];

// Newest first by upload date; ties keep channel order.
export const VIDEOS: Video[] = raw.videos
  .map((v, i) => ({ v: v as Video, i }))
  .sort((a, b) => (META[b.v.id]?.date ?? '').localeCompare(META[a.v.id]?.date ?? '') || a.i - b.i)
  .map((x) => x.v);
export const INTRO_ID: string = raw.introId;

// Thumbnails made by scripts/thumbs.mjs live in public/thumbs (16:9, 320 and 640 wide, AVIF and WebP). A video that has
// none yet falls back to YouTube's own WebP images: `mq` is 320×180, `hq` is 480×360 letterboxed (shown cropped).
const THUMBS = path.join(process.cwd(), 'public', 'thumbs');
export const hasLocalThumb = (id: string) => existsSync(path.join(THUMBS, `${id}-640.avif`));
type Fmt = 'avif' | 'webp';
/** Thumbnail URL. `mq` is the small one (320 wide), `hq` the large one. AVIF exists only for the site's own files. */
export const thumb = (id: string, size: 'mq' | 'hq' = 'hq', fmt: Fmt = 'webp') =>
  hasLocalThumb(id) ? `/thumbs/${id}-${size === 'mq' ? 320 : 640}.${fmt}` : `https://i.ytimg.com/vi_webp/${id}/${size}default.webp`;
/** srcset for a 16:9 slot, so phones and small slots get the small file. */
export const thumbSrcset = (id: string, fmt: Fmt = 'webp') =>
  hasLocalThumb(id) ? `${thumb(id, 'mq', fmt)} 320w, ${thumb(id, 'hq', fmt)} 640w` : `${thumb(id, 'mq')} 320w, ${thumb(id, 'hq')} 480w`;
const jpg = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
/** Widescreen image for link previews (WhatsApp, Facebook): no black bars where YouTube has one. */
export const shareImage = (id: string): { url: string; size: [number, number] } =>
  META[id]?.maxres === false
    ? { url: jpg(id), size: [480, 360] }
    : { url: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`, size: [1280, 720] };
/** ISO 8601 duration for structured data, e.g. PT4M17S. */
export const isoDuration = (secs: number) => `PT${Math.floor(secs / 3600) ? `${Math.floor(secs / 3600)}H` : ''}${Math.floor((secs % 3600) / 60)}M${secs % 60}S`;
export const title = (v: Video, lang: Lang) => (lang === 'en' ? v.en || v.bn : v.bn);
export const catName = (id: string, lang: Lang) => CAT[id][lang];
export const shelfOf = (v: Video): Shelf => CAT[v.cat].shelf;
export const byCat = (id: string) => VIDEOS.filter((v) => v.cat === id);
export const countFor = (shelf?: Shelf) =>
  VIDEOS.filter((v) => !shelf || shelfOf(v) === shelf).length;
export const catCount = (id: string) => byCat(id).length;
export { CATEGORIES };

export { formatViews, formatDate, formatDuration, cleanDesc } from './format';

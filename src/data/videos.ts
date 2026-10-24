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

export const thumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
/** Widescreen image for link previews (WhatsApp, Facebook): no black bars where YouTube has one. */
export const shareImage = (id: string): { url: string; size: [number, number] } =>
  META[id]?.maxres === false
    ? { url: thumb(id), size: [480, 360] }
    : { url: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`, size: [1280, 720] };
export const title = (v: Video, lang: Lang) => (lang === 'en' ? v.en || v.bn : v.bn);
export const catName = (id: string, lang: Lang) => CAT[id][lang];
export const shelfOf = (v: Video): Shelf => CAT[v.cat].shelf;
export const byCat = (id: string) => VIDEOS.filter((v) => v.cat === id);
export const countFor = (shelf?: Shelf) =>
  VIDEOS.filter((v) => !shelf || shelfOf(v) === shelf).length;
export const catCount = (id: string) => byCat(id).length;
export { CATEGORIES };

export { formatViews, formatDate, formatDuration, cleanDesc } from './format';

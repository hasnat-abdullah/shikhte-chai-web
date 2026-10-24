// Forgiving, bilingual video search: Bangla / English / Banglish, spelling variants, typos,
// word endings, partial words and synonyms. Pure functions, no DOM.
import { GROUPS } from '../data/synonyms';

export interface Doc { t: string; c: string; d: string }

const STOP = new Set(
  ('কি কী কেন কিভাবে কীভাবে করবেন করুন করা করে হয় হবে এর ও এবং থেকে জন্য আমি আমার আমরা কোন কোনো একটি এই সেই যে ' +
   'the a an how to what is are of for and in on why do does i my me can with about from by it this that be best way ways tips').split(' '));

/** Folds spelling variants so কিভাবে = কীভাবে, ভালবাসা = ভালোবাসা, রাগ = রাগ and "Dépression" = "depression". */
export function normalize(input: string): string {
  // Strip Latin accents via NFD, then recompose (NFC) so Bangla signs like ো stay single characters.
  const s = input.normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC').toLowerCase()
    .replace(/[‌‍]/g, '')                                              // zero-width joiners
    .replace(/[০-৯]/g, (d) => String(d.charCodeAt(0) - 0x09e6))        // Bangla digits -> 0-9
    .replace(/ী/g, 'ি')                                                // ী -> ি
    .replace(/ূ/g, 'ু')                                                // ূ -> ু
    .replace(/ণ/g, 'ন')                                                // ণ -> ন
    .replace(/[শষ]/g, 'স')                                        // শ ষ -> স
    .replace(/য/g, 'জ')                                                // য -> জ
    .replace(/ৎ/g, 'ত')                                                // ৎ -> ত
    .replace(/়/g, '')                                                      // nukta: য় ড় ঢ় -> য ড ঢ
    .replace(/[ঁঃ]/g, '')                                              // chandrabindu, visarga
    .replace(/ং/g, 'ঙ')                                                // ং -> ঙ
    .replace(/ো/g, '')                                                      // ো, so ভালবাসা = ভালোবাসা
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, ' ')
    .trim();
  return s.replace(/\s+/g, ' ');
}

const stem = (w: string) => {
  if (!/^[a-z]+$/.test(w) || w.length < 5) return w;
  return w.replace(/(ing|ed|es|ly|s)$/, '');
};

const tokens = (s: string) => normalize(s).split(' ').filter(Boolean).map(stem);

/** Bounded Damerau-Levenshtein distance; returns max+1 when over the bound. */
function dist(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const m = a.length, n = b.length;
  let prev2: number[] = [], prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
      cur[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev2 = prev; prev = cur;
  }
  return prev[n];
}

const ASCII = /^[\x00-\x7f]+$/;
const maxTypos = (len: number) => (len <= 3 ? 0 : len <= 6 ? 1 : 2);

/** How well query token q matches one field token f, 0..1. */
function tokenScore(q: string, f: string): number {
  if (q === f) return 1;
  if (q.length >= 2 && f.startsWith(q)) return 0.82;                          // still typing
  if (f.length >= 3 && q.startsWith(f) && q.length - f.length <= (f.length <= 3 ? 2 : 4)) return 0.75; // word endings: রাগের ~ রাগ
  if (q.length >= 3 && /[^\x00-\x7f]/.test(q) && f.includes(q)) return 0.58; // inside Bangla compounds: মাদক in মাদকাসক্তি
  const k = maxTypos(q.length);
  if (k && (q.length > 5 || q[0] === f[0])) { // typos rarely hit the first letter of a short word: anger != danger
    const d = Math.min(dist(q, f, k), q.length < f.length ? dist(q, f.slice(0, q.length + 1), k) + 0.5 : 9);
    if (d <= k) return 0.62 - 0.12 * Math.floor(d);
  }
  return 0;
}

interface Concept { terms: string[]; words: Set<string> }
const CONCEPTS: Concept[] = GROUPS.map((g) => {
  const terms = [...new Set(g.map(normalize).filter(Boolean))];
  return { terms, words: new Set(terms.flatMap((t) => t.split(' '))) };
});

interface Indexed { title: string[]; cat: string[]; desc: string[]; titleText: string; catText: string; descText: string }

export function buildIndex(docs: Doc[]): Indexed[] {
  return docs.map((d) => ({
    title: tokens(d.t), cat: tokens(d.c), desc: tokens(d.d),
    titleText: ' ' + normalize(d.t) + ' ', catText: ' ' + normalize(d.c) + ' ', descText: ' ' + normalize(d.d) + ' ',
  }));
}

const best = (q: string, words: string[]) => {
  let b = 0;
  for (const w of words) { const s = tokenScore(q, w); if (s > b) b = s; if (b === 1) break; }
  return b;
};

/** Score of one query unit (a word) against a document, directly and through synonyms. */
function unitScore(q: string, doc: Indexed, active: Concept[]): number {
  let s = Math.max(best(q, doc.title), best(q, doc.cat) * 0.65, best(q, doc.desc) * 0.35);
  for (const c of active) {
    let top = 0, hits = 0;
    for (const term of c.terms) {
      const needle = ' ' + term + ' ';
      let hit = 0;
      if (doc.titleText.includes(needle)) hit = 0.88;
      else if (doc.catText.includes(needle)) hit = 0.62;                       // topic name only: lower than a title match
      else if (term.length >= 3 && !ASCII.test(term) && doc.titleText.includes(term)) hit = 0.7; // Bangla endings/compounds: রাগ in রাগের
      else if (term.length >= 3 && !ASCII.test(term) && doc.catText.includes(term)) hit = 0.5;
      else if (doc.descText.includes(needle)) hit = 0.3;
      if (hit) hits++;
      if (hit > top) top = hit;
    }
    // Several different synonyms present in one title means it is more on-topic.
    if (top) s = Math.max(s, Math.min(0.97, top + Math.min(0.09, 0.03 * (hits - 1))));
  }
  return s;
}

/** Concepts a query word points at, tolerating typos in the word. */
function activeConcepts(q: string): Concept[] {
  const out: Concept[] = [];
  for (const c of CONCEPTS) {
    let hit = false;
    for (const w of c.words) {
      if (w === q || (q.length >= 3 && w.length >= 3 && (w.startsWith(q) && q.length >= 3))) { hit = true; break; }
      const k = Math.min(maxTypos(q.length), 1);
      if (k && w.length >= 4 && (q.length > 5 || q[0] === w[0]) && dist(q, w, k) <= k) { hit = true; break; }
    }
    if (hit) out.push(c);
  }
  return out;
}

export interface Result { index: number; score: number }

/** Returns matching document indexes ordered best-first. */
export function search(query: string, index: Indexed[]): Result[] {
  const norm = normalize(query);
  if (!norm) return [];
  let words = norm.split(' ').map(stem);
  const kept = words.filter((w) => !STOP.has(w));
  if (kept.length) words = kept;

  // Multi-word synonyms ("social phobia", "মানসিক স্বাস্থ্য") count as one unit.
  const phrases: Concept[] = [];
  const padded = ' ' + norm + ' ';
  for (const c of CONCEPTS) for (const t of c.terms) if (t.includes(' ') && padded.includes(' ' + t + ' ')) { phrases.push(c); break; }
  const covered = new Set(phrases.flatMap((c) => c.terms.filter((t) => padded.includes(' ' + t + ' ')).flatMap((t) => t.split(' '))));

  const units: { q: string; concepts: Concept[] }[] = words.filter((w) => !covered.has(w)).map((q) => ({ q, concepts: activeConcepts(q) }));
  const phraseUnits = phrases.map((c) => ({ q: '', concepts: [c] }));
  const all = [...units, ...phraseUnits];
  if (!all.length) return [];
  const strict = all.length <= 2 ? all.length : Math.ceil(all.length * 0.6);
  const run = (need: number) => {
    const out: Result[] = [];
    index.forEach((doc, i) => {
      let matched = 0, total = 0;
      for (const u of all) {
        const s = unitScore(u.q || '\u0000', doc, u.concepts);
        if (s >= 0.4) { matched++; total += s; }
      }
      if (matched >= need) out.push({ index: i, score: total / all.length + matched * 0.05 });
    });
    return out.sort((a, b) => b.score - a.score || a.index - b.index);
  };
  // Every word should match; if nothing does, fall back to "all but one" so a stray word can't empty the page.
  const exact = run(strict);
  return exact.length || all.length < 2 ? exact : run(Math.max(1, all.length - 1));
}

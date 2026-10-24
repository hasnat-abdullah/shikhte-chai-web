import { buildIndex, search } from './search';

// Client-side filtering for the video library. All cards are rendered in the HTML,
// so the page still works without JavaScript (everything simply shows).
interface Cfg { lang: 'bn' | 'en'; step: number; resultsTpl: string; shownTpl: string }
const cfg: Cfg = JSON.parse(document.getElementById('lib-cfg')!.textContent!);
const BN = '০১২৩৪৫৬৭৮৯';
const n = (x: number) => (cfg.lang === 'bn' ? String(x).replace(/\d/g, (d) => BN[+d]) : String(x));

const $ = <T extends HTMLElement>(s: string) => document.querySelector<T>(s)!;
const items = [...document.querySelectorAll<HTMLElement>('#grid .item')];
const shelfBtns = [...document.querySelectorAll<HTMLButtonElement>('.shelves button')];
const catBtns = [...document.querySelectorAll<HTMLButtonElement>('.cat')];
const input = $<HTMLInputElement>('#lib-q');
const sortSel = $<HTMLSelectElement>('#sort');
const grid = $('#grid');
const index = buildIndex(JSON.parse(document.getElementById('search-docs')!.textContent!));

const catShelf: Record<string, string> = {};
catBtns.forEach((b) => { if (b.dataset.cat !== 'all') catShelf[b.dataset.cat!] = b.dataset.shelf!; });

const params = new URLSearchParams(location.search);
const state = { shelf: 'mental', cat: 'all', q: '', limit: cfg.step, sort: 'new' };
let userSort: string | null = null; // set once the visitor picks a sort order themselves

const qp = params.get('q') ?? '';
const cp = params.get('cat');
const sp = params.get('shelf');
if (cp && catShelf[cp]) { state.cat = cp; state.shelf = catShelf[cp]; }
else if (sp === 'science' || sp === 'mental' || sp === 'all') state.shelf = sp;
if (qp) { state.q = qp.trim().toLowerCase(); input.value = qp; if (!cp && !sp) state.shelf = 'all'; if (!userSort) state.sort = 'rel'; }
const sp2 = params.get('sort');
if (sp2 === 'views' || sp2 === 'old') { state.sort = sp2; userSort = sp2; sortSel.value = sp2; }
if (params.get('focus') === 'search') input.focus();

function sync() {
  const u = new URL(location.href);
  u.search = '';
  if (state.q) u.searchParams.set('q', input.value.trim());
  if (state.cat !== 'all') u.searchParams.set('cat', state.cat);
  else if (state.shelf !== 'mental' && !state.q) u.searchParams.set('shelf', state.shelf);
  if (state.sort !== 'new') u.searchParams.set('sort', state.sort);
  history.replaceState(null, '', u);
}

function render(resetLimit = false) {
  if (resetLimit) state.limit = cfg.step;
  const num = (el: HTMLElement, k: string) => Number(el.dataset[k] ?? 0);
  const cmp: Record<string, (a: HTMLElement, b: HTMLElement) => number> = {
    new: (a, b) => num(a, 'i') - num(b, 'i'),
    old: (a, b) => num(b, 'i') - num(a, 'i'),
    views: (a, b) => num(b, 'views') - num(a, 'views') || num(a, 'i') - num(b, 'i'),
  };
  // With a query, similar words, typos, synonyms and other-language words all count (see search.ts).
  const scores = new Map<number, number>();
  if (state.q) search(input.value, index).forEach((r) => scores.set(r.index, r.score));
  cmp.rel = (a, b) => (scores.get(num(b, 'i')) ?? 0) - (scores.get(num(a, 'i')) ?? 0) || num(a, 'i') - num(b, 'i');
  const order = state.q && state.sort === 'rel' ? 'rel' : state.sort === 'rel' ? 'new' : state.sort;
  [...items].sort(cmp[order]).forEach((el) => grid.appendChild(el));
  const match = [...items].sort(cmp[order]).filter((el) =>
    (state.shelf === 'all' || el.dataset.shelf === state.shelf) &&
    (state.cat === 'all' || el.dataset.cat === state.cat) &&
    (!state.q || scores.has(num(el, 'i'))));
  const shown = new Set(match.slice(0, state.limit));
  items.forEach((el) => { el.hidden = !shown.has(el); });

  const relOpt = sortSel.querySelector<HTMLOptionElement>('option[value="rel"]')!;
  relOpt.hidden = relOpt.disabled = !state.q;
  sortSel.value = state.q && state.sort === 'rel' ? 'rel' : state.sort === 'rel' ? 'new' : state.sort;
  shelfBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.shelf === state.shelf)));
  catBtns.forEach((b) => {
    const isAll = b.dataset.cat === 'all';
    b.hidden = !isAll && state.shelf !== 'all' && b.dataset.shelf !== state.shelf;
    b.setAttribute('aria-pressed', String(b.dataset.cat === state.cat));
  });
  const inShelf = items.filter((el) => state.shelf === 'all' || el.dataset.shelf === state.shelf).length;
  $('#all-n').textContent = n(inShelf);

  $('#rc').textContent = cfg.resultsTpl.replace('{n}', n(match.length));
  $('#rl').textContent = state.q ? `· “${input.value.trim()}”` : '';
  $('#empty').hidden = match.length > 0;
  const more = match.length > state.limit;
  $('#more-wrap').hidden = !more;
  $('#progress').textContent = cfg.shownTpl.replace('{a}', n(Math.min(state.limit, match.length))).replace('{b}', n(match.length));
  $('#clear').hidden = !(state.q || state.cat !== 'all');
}

shelfBtns.forEach((b) => b.addEventListener('click', () => {
  state.shelf = b.dataset.shelf!;
  if (state.cat !== 'all' && state.shelf !== 'all' && catShelf[state.cat] !== state.shelf) state.cat = 'all';
  render(true); sync();
}));
catBtns.forEach((b) => b.addEventListener('click', () => {
  state.cat = b.dataset.cat!;
  if (state.cat !== 'all') state.shelf = catShelf[state.cat];
  render(true); sync();
}));
sortSel.addEventListener('change', () => { state.sort = userSort = sortSel.value; render(true); sync(); });
input.addEventListener('input', () => {
  state.q = input.value.trim().toLowerCase();
  if (state.q && state.shelf !== 'all') { state.shelf = 'all'; }
  if (state.q && !userSort) state.sort = 'rel';
  if (!state.q && state.sort === 'rel') state.sort = userSort ?? 'new';
  render(true); sync();
});
document.querySelectorAll<HTMLButtonElement>('[data-suggest]').forEach((b) => b.addEventListener('click', () => {
  input.value = b.dataset.suggest!; input.dispatchEvent(new Event('input')); input.focus();
}));
$('#more').addEventListener('click', () => { state.limit += cfg.step; render(); });
$('#clear').addEventListener('click', () => {
  state.q = ''; state.cat = 'all'; input.value = '';
  if (state.sort === 'rel') state.sort = userSort ?? 'new';
  render(true); sync();
});

render();

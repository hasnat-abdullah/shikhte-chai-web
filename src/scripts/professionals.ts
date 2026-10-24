// The professionals directory: loads approved listings and filters them in the browser.
import { enabled, rest } from './supabase';
import { buildIndex, search } from './search';
import { PUBLIC_COLUMNS, TYPES, MODES, LANGUAGES, AGES, SPECIALIZATIONS, DISTRICTS, DIVISIONS, DIVISION_NAMES, label, districtName, type Professional } from '../data/professionals';

interface Cfg { lang: 'bn' | 'en'; step: number; contact: string; t: Record<string, any> }
const cfg: Cfg = JSON.parse(document.getElementById('dir-cfg')!.textContent!);
const T = cfg.t as Record<string, any> & { verifiedLabels: Record<string, string>; verifiedHints: Record<string, string> };
const L = cfg.lang;
const $ = <E extends HTMLElement>(s: string) => document.querySelector<E>(s)!;
const BN = '০১২৩৪৫৬৭৮৯';
const n = (x: number | string) => (L === 'bn' ? String(x).replace(/\d/g, (d) => BN[+d]) : String(x));
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const safeUrl = (u: string | null) => (u && /^https?:\/\/\S+$/i.test(u) ? u : '');

type Facet = 'type' | 'mode' | 'speak' | 'age' | 'spec';
const state = { verified: false, q: '', type: new Set<string>(), mode: new Set<string>(), speak: new Set<string>(), age: new Set<string>(), spec: new Set<string>(), district: '', anywhere: false, sort: 'auto', limit: cfg.step };
const FACETS: Facet[] = ['type', 'mode', 'spec', 'speak', 'age'];
const field: Record<Facet, (p: Professional) => string[]> = {
  type: (p) => [p.type], mode: (p) => p.modes, speak: (p) => p.languages, age: (p) => p.ages, spec: (p) => p.specializations,
};
const optionLabels: Record<Facet, any[]> = { type: TYPES, mode: MODES, speak: LANGUAGES, age: AGES, spec: SPECIALIZATIONS };

let rows: Professional[] = [];
let index: ReturnType<typeof buildIndex> = [];
let scores = new Map<number, number>();

const typeLabel = (v: string) => label(TYPES, v, L);
const displayName = (p: Professional) => (L === 'en' ? p.name_en || p.name : p.name);

function docOf(p: Professional) {
  const both = (list: any[], v: string) => { const o = list.find((x) => x.value === v); return o ? `${o.bn} ${o.en}` : v; };
  return {
    t: [p.name, p.name_en, both(TYPES, p.type), ...p.specializations.map((s) => both(SPECIALIZATIONS, s)), ...p.ages.map((a) => both(AGES, a)), p.designation].filter(Boolean).join(' '),
    c: [DISTRICTS.find((d) => d.value === p.district)?.bn, DISTRICTS.find((d) => d.value === p.district)?.en, p.area, p.clinic_name, ...p.modes.map((m) => both(MODES, m))].filter(Boolean).join(' '),
    d: [p.qualifications, p.bio].join(' '),
  };
}

function passes(p: Professional, i: number, skip?: Facet | 'district') {
  for (const f of FACETS) {
    if (f === skip || !state[f].size) continue;
    if (!field[f](p).some((v) => state[f].has(v))) return false;
  }
  if (state.verified && p.verified === 'none') return false;
  if (skip !== 'district' && state.district && !(p.district === state.district || (state.anywhere && p.modes.includes('online')))) return false;
  if (state.q && !scores.has(i)) return false;
  return true;
}

function passesExceptVerified(p: Professional, i: number) {
  const was = state.verified; state.verified = false;
  const r = passes(p, i); state.verified = was; return r;
}

function cardHtml(p: Professional) {
  const loc = p.modes.includes('offline') ? [districtName(p.district, L), p.area].filter(Boolean).join(', ') : '';
  const online = p.modes.includes('online');
  const specs = p.specializations.map((s) => label(SPECIALIZATIONS, s, L));
  const tel = p.phone.replace(/[^0-9+]/g, '');
  const site = safeUrl(p.website);
  const row = (k: string, v: string) => (v ? `<dt>${esc(k)}</dt><dd>${v}</dd>` : '');
  const siteHost = site ? new URL(site).hostname.replace(/^www\./, '') : '';
  const more = [
    row(T.qualifications, esc(p.qualifications) + (p.designation ? `<br>${esc(p.designation)}` : '')),
    row(T.languages, esc(p.languages.map((v) => label(LANGUAGES, v, L)).join(', '))),
    row(T.ages, esc(p.ages.map((v) => label(AGES, v, L)).join(', '))),
    row(T.address, esc([p.clinic_name, p.address, p.area && !p.address ? p.area : ''].filter(Boolean).join(', '))),
    row(T.availability, esc(p.availability)),
    row(T.fee, esc(p.fee_note)),
    row(T.website, site ? `<a href="${esc(site)}" target="_blank" rel="noopener noreferrer">${esc(siteHost)} ↗</a>` : ''),
    row(T.email, p.email_public ? `<a href="mailto:${esc(p.email_public)}">${esc(p.email_public)}</a>` : ''),
  ].join('');
  return `<article class="pcard" data-id="${esc(p.id)}">
    <div class="pc-head"><h2 class="pc-name">${esc(displayName(p))}</h2><span class="pc-type">${esc(typeLabel(p.type))}</span></div>
    <p class="pc-qual">${esc(p.qualifications)}</p>
    <p class="pc-verified v-${esc(p.verified)}" title="${esc(T.verifiedHints[p.verified] ?? '')}">${p.verified !== 'none' ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/></svg>' : ''}${esc(T.verifiedLabels[p.verified] ?? '')}</p>
    <div class="pc-meta">${p.modes.map((m) => `<span class="mode mode-${esc(m)}">${esc(label(MODES, m, L))}</span>`).join('')}${loc ? `<span>${esc(loc)}</span>` : online ? `<span>${esc(T.onlineAnywhere)}</span>` : ''}${p.fee_note ? `<span class="muted">· ${esc(p.fee_note)}</span>` : ''}</div>
    <div class="pc-specs">${specs.slice(0, 4).map((s) => `<span>${esc(s)}</span>`).join('')}${specs.length > 4 ? `<span>+${n(specs.length - 4)}</span>` : ''}</div>
    <p class="pc-bio">${esc(p.bio)}</p>
    <div class="pc-actions"><a class="btn" href="tel:${esc(tel)}">${esc(T.call)} ${esc(p.phone)}</a><button type="button" class="pc-detailsbtn" aria-expanded="false" data-toggle>${esc(T.details)}</button></div>
    <div class="pc-detail" hidden><dl class="pc-more">${more}</dl><p class="pc-report"><a href="${esc(cfg.contact)}?topic=feedback&amp;pro=${esc(p.id)}">${esc(T.report)}</a></p></div>
  </article>`;
}

function setSelectOptions(sel: HTMLSelectElement, counts: Map<string, number>) {
  const cur = state.district;
  let html = `<option value="">${esc(T.allDistricts)}</option>`;
  for (const dv of DIVISIONS) {
    const ds = DISTRICTS.filter((d) => d.division === dv && ((counts.get(d.value) ?? 0) > 0 || d.value === cur));
    if (ds.length) html += `<optgroup label="${esc(DIVISION_NAMES[dv][L])}">${ds.map((d) => `<option value="${d.value}">${esc(d[L])} (${n(counts.get(d.value) ?? 0)})</option>`).join('')}</optgroup>`;
  }
  sel.innerHTML = html;
  sel.value = cur;
}

function render(resetLimit = false) {
  if (resetLimit) state.limit = cfg.step;
  const hasQ = Boolean(state.q);
  const sort = state.sort === 'auto' ? (hasQ ? 'rel' : 'new') : state.sort === 'rel' && !hasQ ? 'new' : state.sort;
  const relOpt = $<HTMLSelectElement>('#d-sort').querySelector<HTMLOptionElement>('option[value="rel"]')!;
  relOpt.hidden = relOpt.disabled = !hasQ;
  $<HTMLSelectElement>('#d-sort').value = sort;

  const matches = rows.map((p, i) => ({ p, i })).filter(({ p, i }) => passes(p, i));
  matches.sort((a, b) => sort === 'rel' ? (scores.get(b.i) ?? 0) - (scores.get(a.i) ?? 0) || a.i - b.i : sort === 'name' ? displayName(a.p).localeCompare(displayName(b.p), L === 'bn' ? 'bn' : 'en') : a.i - b.i);

  // facet counts: what each option would give with everything else unchanged
  for (const f of FACETS) {
    const c = new Map<string, number>();
    rows.forEach((p, i) => { if (passes(p, i, f)) for (const v of new Set(field[f](p))) c.set(v, (c.get(v) ?? 0) + 1); });
    document.querySelectorAll<HTMLInputElement>(`input[data-facet="${f}"]`).forEach((inp) => {
      const k = c.get(inp.value) ?? 0;
      inp.checked = state[f].has(inp.value);
      const lab = inp.closest('label')!;
      lab.querySelector('.n')!.textContent = n(k);
      lab.classList.toggle('zero', k === 0 && !inp.checked);
    });
  }
  const dc = new Map<string, number>();
  rows.forEach((p, i) => { if (passes(p, i, 'district')) dc.set(p.district, (dc.get(p.district) ?? 0) + 1); });
  setSelectOptions($<HTMLSelectElement>('#d-district'), dc);
  $('#anywhere-wrap').hidden = !state.district;
  $<HTMLInputElement>('#d-anywhere').checked = state.anywhere;
  $<HTMLInputElement>('#d-verified').checked = state.verified;
  $('#d-verified-n').textContent = n(rows.filter((p, i) => p.verified !== 'none' && passesExceptVerified(p, i)).length);

  $('#d-count').textContent = T.results.replace('{n}', n(matches.length));
  const list = $('#d-list');
  const shown = matches.slice(0, state.limit);
  const filtered = FACETS.some((f) => state[f].size) || state.district || state.q;
  if (!rows.length) list.innerHTML = `<div class="dir-empty"><strong>${esc(T.emptyAll)}</strong></div>`;
  else if (!matches.length) list.innerHTML = `<div class="dir-empty"><strong>${esc(T.empty)}</strong><p class="muted">${esc(T.emptyHint)}</p><button type="button" class="btn btn-outline" data-clear>${esc(T.clear)}</button></div>`;
  else list.innerHTML = shown.map(({ p }) => cardHtml(p)).join('');
  $('#d-more').hidden = matches.length <= state.limit;
  $('#d-progress').textContent = T.shown.replace('{a}', n(Math.min(state.limit, matches.length))).replace('{b}', n(matches.length));

  // active filter tags
  const tags: string[] = [];
  for (const f of FACETS) for (const v of state[f]) tags.push(`<button type="button" class="tag" data-remove="${f}:${esc(v)}">${esc(label(optionLabels[f], v, L))}</button>`);
  if (state.verified) tags.push(`<button type="button" class="tag" data-remove="verified:">${esc(T.fVerifiedOnly)}</button>`);
  if (state.district) tags.push(`<button type="button" class="tag" data-remove="district:">${esc(districtName(state.district, L))}</button>`);
  const act = $('#d-active');
  act.hidden = !tags.length;
  act.innerHTML = tags.join('') + (tags.length ? `<button type="button" class="linkbtn" data-clear>${esc(T.clear)}</button>` : '');
  const nActive = tags.length;
  $('#filters-btn').textContent = (nActive ? `${T.filters} (${n(nActive)})` : $('#d-filters').classList.contains('open') ? T.hideFilters : T.showFilters);
  if ($('#d-filters').classList.contains('open')) $('#filters-btn').textContent = `${T.hideFilters}${nActive ? ` (${n(nActive)})` : ''}`;
  void filtered;
  sync();
}

function sync() {
  const u = new URL(location.href);
  u.search = '';
  const sp = u.searchParams;
  if (state.q) sp.set('q', $<HTMLInputElement>('#d-q').value.trim());
  for (const f of FACETS) if (state[f].size) sp.set(f, [...state[f]].join(','));
  if (state.district) sp.set('district', state.district);
  if (state.district && state.anywhere) sp.set('anywhere', '1');
  if (state.verified) sp.set('verified', '1');
  if (state.sort !== 'auto') sp.set('sort', state.sort);
  history.replaceState(null, '', u);
}

function runSearch() {
  const q = $<HTMLInputElement>('#d-q').value;
  state.q = q.trim();
  scores = new Map();
  if (state.q) search(q, index).forEach((r) => scores.set(r.index, r.score));
}

function clearAll() {
  for (const f of FACETS) state[f].clear();
  state.district = ''; state.anywhere = false; state.verified = false; state.q = ''; scores = new Map();
  $<HTMLInputElement>('#d-q').value = '';
  render(true);
}

function bind() {
  document.querySelectorAll<HTMLInputElement>('input[data-facet]').forEach((inp) => inp.addEventListener('change', () => {
    const f = inp.dataset.facet as Facet;
    inp.checked ? state[f].add(inp.value) : state[f].delete(inp.value);
    render(true);
  }));
  $<HTMLSelectElement>('#d-district').addEventListener('change', (e) => { state.district = (e.target as HTMLSelectElement).value; if (!state.district) state.anywhere = false; render(true); });
  $<HTMLInputElement>('#d-verified').addEventListener('change', (e) => { state.verified = (e.target as HTMLInputElement).checked; render(true); });
  $<HTMLInputElement>('#d-anywhere').addEventListener('change', (e) => { state.anywhere = (e.target as HTMLInputElement).checked; render(true); });
  $<HTMLInputElement>('#d-q').addEventListener('input', () => { runSearch(); render(true); });
  $<HTMLSelectElement>('#d-sort').addEventListener('change', (e) => { state.sort = (e.target as HTMLSelectElement).value; render(true); });
  $('#d-more-btn').addEventListener('click', () => { state.limit += cfg.step; render(); });
  $('#filters-btn').addEventListener('click', () => {
    const f = $('#d-filters'); const open = f.classList.toggle('open');
    $('#filters-btn').setAttribute('aria-expanded', String(open)); render();
  });
  const specMore = $('#spec-more');
  const applySpec = (open: boolean) => {
    document.querySelectorAll<HTMLElement>('[data-extra]').forEach((el) => { el.hidden = !open; });
    specMore.textContent = open ? T.lessSpecs : T.moreSpecs; specMore.setAttribute('aria-expanded', String(open));
  };
  applySpec(false);
  specMore.addEventListener('click', () => applySpec(specMore.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const rem = t.closest<HTMLElement>('[data-remove]');
    if (rem) { const [f, v] = rem.dataset.remove!.split(':'); if (f === 'district') { state.district = ''; state.anywhere = false; } else if (f === 'verified') state.verified = false; else state[f as Facet].delete(v); render(true); return; }
    if (t.closest('[data-clear]')) { clearAll(); return; }
    const tog = t.closest<HTMLElement>('[data-toggle]');
    if (tog) {
      const card = tog.closest('.pcard')!; const open = !card.classList.contains('open');
      card.classList.toggle('open', open); tog.setAttribute('aria-expanded', String(open));
      tog.textContent = open ? T.hide : T.details;
      (card.querySelector('.pc-detail') as HTMLElement).hidden = !open;
    }
  });
}

function readUrl() {
  const sp = new URLSearchParams(location.search);
  for (const f of FACETS) (sp.get(f) ?? '').split(',').filter(Boolean).forEach((v) => { if (optionLabels[f].some((o) => o.value === v)) state[f].add(v); });
  state.verified = sp.get('verified') === '1';
  const d = sp.get('district'); if (d && DISTRICTS.some((x) => x.value === d)) state.district = d;
  state.anywhere = sp.get('anywhere') === '1' && Boolean(state.district);
  const s = sp.get('sort'); if (s === 'new' || s === 'name' || s === 'rel') state.sort = s;
  const q = sp.get('q'); if (q) $<HTMLInputElement>('#d-q').value = q;
}

async function start() {
  bind();
  readUrl();
  const list = $('#d-list');
  if (!enabled) { list.innerHTML = `<div class="dir-empty"><strong>${esc(T.notConnected)}</strong></div>`; $('#dir-body').querySelector('.dir-filters')!.classList.add('hide-all'); return; }
  list.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>';
  $('#d-count').textContent = '';
  try {
    // The database only returns approved rows to visitors (row-level security), so no status filter is needed.
    rows = await rest.select<Professional>('professionals', `select=${PUBLIC_COLUMNS.join(',')}&order=created_at.desc&limit=1000`);
  } catch {
    list.innerHTML = `<div class="dir-empty"><strong>${esc(T.error)}</strong></div>`;
    return;
  }
  index = buildIndex(rows.map(docOf));
  runSearch();
  render();
}

start();

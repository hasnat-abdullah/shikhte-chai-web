// Tabs between professionals and institutes, plus the "kind of help" filter for institutes.
const cfg = JSON.parse(document.getElementById('places-cfg')!.textContent!) as { explain: Record<string, string>; count: string; numerals: boolean };
const tabs = [...document.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
const chips = [...document.querySelectorAll<HTMLButtonElement>('#need-chips .chip')];
const cards = [...document.querySelectorAll<HTMLElement>('.place')];
const explain = document.getElementById('explain')!;
const count = document.getElementById('pl-count')!;
const num = (x: number) => (cfg.numerals ? String(x).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[+d]) : String(x));
const url = () => new URL(location.href);

function showTab(view: 'pros' | 'places', focus = false) {
  tabs.forEach((t) => {
    const on = t.id === `tab-${view}`;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')!)!.hidden = !on;
    if (on && focus) t.focus();
  });
  const u = url();
  if (view === 'places') u.searchParams.set('view', 'places'); else u.searchParams.delete('view');
  history.replaceState(null, '', u);
}

function selectNeed(need: string) {
  chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.need === need)));
  let n = 0;
  cards.forEach((c) => {
    const hit = need === 'all' || (c.dataset.needs ?? '').split(' ').includes(need);
    c.hidden = !hit;
    if (hit) n++;
  });
  count.textContent = cfg.count.replace('{n}', num(n));
  const text = need === 'all' ? '' : cfg.explain[need] ?? '';
  explain.textContent = text;
  explain.hidden = !text;
  const u = url();
  if (need === 'all') u.searchParams.delete('need'); else u.searchParams.set('need', need);
  history.replaceState(null, '', u);
}

tabs.forEach((t, i) => {
  t.addEventListener('click', () => showTab(t.id === 'tab-places' ? 'places' : 'pros'));
  t.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
    showTab(next.id === 'tab-places' ? 'places' : 'pros', true);
  });
});
chips.forEach((c) => c.addEventListener('click', () => selectNeed(c.dataset.need!)));

const sp = new URLSearchParams(location.search);
const need = sp.get('need');
selectNeed(need && chips.some((c) => c.dataset.need === need) ? need : 'all');
if (sp.get('view') === 'places' || need) showTab('places');

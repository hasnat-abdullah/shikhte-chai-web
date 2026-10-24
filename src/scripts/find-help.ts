// Filters the referral list by the kind of help the visitor is looking for.
const cfg = JSON.parse(document.getElementById('fh-cfg')!.textContent!) as { all: string; explain: Record<string, string> };
const chips = [...document.querySelectorAll<HTMLButtonElement>('#need-chips .chip')];
const cards = [...document.querySelectorAll<HTMLElement>('.card')];
const explain = document.getElementById('explain')!;
const directory = document.getElementById('directory')!;

function select(need: string) {
  chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.need === need)));
  cards.forEach((c) => { c.hidden = need !== 'all' && !(c.dataset.needs ?? '').split(' ').includes(need); });
  const text = need === 'all' ? '' : cfg.explain[need] ?? '';
  explain.textContent = text;
  explain.hidden = !text;
  explain.classList.toggle('urgent', need === 'emergency');
  directory.hidden = need === 'emergency';
  const u = new URL(location.href);
  if (need === 'all') u.searchParams.delete('need'); else u.searchParams.set('need', need);
  history.replaceState(null, '', u);
}

chips.forEach((c) => c.addEventListener('click', () => select(c.dataset.need!)));
const initial = new URLSearchParams(location.search).get('need');
if (initial && chips.some((c) => c.dataset.need === initial)) select(initial);

// Live YouTube view and comment counts, fetched in the visitor's browser on every page load.
// Uses the YouTube Data API v3 with a domain-restricted key.
import { formatViews, digits } from '../data/format';

interface Cfg { id: string; lang: 'bn' | 'en'; key: string; countTpl: string; likesTpl: string; repliesTpl: string; loading: string; empty: string; off: string; error: string }
const cfg: Cfg = JSON.parse(document.getElementById('cm-cfg')!.textContent!);
const API = 'https://www.googleapis.com/youtube/v3';
const $ = (id: string) => document.getElementById(id)!;
const status = $('cm-status'), list = $('cm-list'), moreWrap = $('cm-more-wrap'), moreBtn = $('cm-more') as HTMLButtonElement;
const n = (x: number | string) => digits(x, cfg.lang);
const fill = (tpl: string, v: number) => tpl.replace('{n}', n(v.toLocaleString('en')));

// Short-lived cache so quick page changes don't burn API quota.
async function get(path: string, params: Record<string, string>) {
  const url = `${API}/${path}?${new URLSearchParams({ ...params, key: cfg.key })}`;
  const ck = 'yt:' + url.replace(cfg.key, '');
  try {
    const hit = JSON.parse(sessionStorage.getItem(ck) ?? 'null');
    if (hit && Date.now() - hit.t < 5 * 60e3) return hit.v;
  } catch { /* storage unavailable */ }
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw Object.assign(new Error(json?.error?.message ?? 'api'), { reason: json?.error?.errors?.[0]?.reason });
  try { sessionStorage.setItem(ck, JSON.stringify({ t: Date.now(), v: json })); } catch { /* ignore */ }
  return json;
}

function ago(iso: string) {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(cfg.lang === 'bn' ? 'bn-BD' : 'en', { numeric: 'auto' });
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
  for (const [u, s] of steps) if (Math.abs(diff) >= s) return rtf.format(Math.round(diff / s), u);
  return rtf.format(0, 'second');
}

function add(item: any) {
  const c = item.snippet.topLevelComment.snippet;
  const li = document.createElement('li');
  li.className = 'cm-item';
  const img = document.createElement('img');
  img.className = 'cm-avatar'; img.alt = ''; img.width = 40; img.height = 40; img.loading = 'lazy'; img.referrerPolicy = 'no-referrer';
  img.src = c.authorProfileImageUrl ?? '';
  const body = document.createElement('div'); body.className = 'cm-body';
  const meta = document.createElement('div'); meta.className = 'cm-meta';
  const name = document.createElement('strong'); name.textContent = c.authorDisplayName;
  const when = document.createElement('span'); when.textContent = ago(c.publishedAt);
  meta.append(name, when);
  const text = document.createElement('p'); text.className = 'cm-text'; text.textContent = String(c.textDisplay ?? '').slice(0, 1500);
  const foot = document.createElement('div'); foot.className = 'cm-foot';
  if (c.likeCount) { const l = document.createElement('span'); l.textContent = fill(cfg.likesTpl, c.likeCount); foot.append(l); }
  if (item.snippet.totalReplyCount) {
    const a = document.createElement('a');
    a.href = `https://www.youtube.com/watch?v=${cfg.id}&lc=${item.id}`; a.target = '_blank'; a.rel = 'noopener';
    a.textContent = fill(cfg.repliesTpl, item.snippet.totalReplyCount) + ' ↗';
    foot.append(a);
  }
  body.append(meta, text);
  if (foot.childNodes.length) body.append(foot);
  li.append(img, body);
  list.append(li);
}

let token = '';
async function load() {
  moreBtn.disabled = true;
  try {
    const p: Record<string, string> = { part: 'snippet', videoId: cfg.id, maxResults: '10', order: 'relevance', textFormat: 'plainText' };
    if (token) p.pageToken = token;
    const j = await get('commentThreads', p);
    j.items.forEach(add);
    token = j.nextPageToken ?? '';
    moreWrap.hidden = !token;
    status.hidden = list.children.length > 0;
    if (!list.children.length) status.textContent = cfg.empty;
  } catch (e: any) {
    status.hidden = false;
    status.textContent = e.reason === 'commentsDisabled' ? cfg.off : cfg.error;
    if (e.reason === 'commentsDisabled') $('cm-count').textContent = '';
  } finally { moreBtn.disabled = false; }
}

async function stats() {
  try {
    const j = await get('videos', { part: 'statistics', id: cfg.id });
    const s = j.items?.[0]?.statistics;
    if (!s) return;
    const views = document.getElementById('live-views');
    if (views && s.viewCount) views.textContent = formatViews(Number(s.viewCount), cfg.lang);
    if (s.commentCount !== undefined) {
      const txt = fill(cfg.countTpl, Number(s.commentCount));
      $('cm-count').textContent = `· ${txt}`;
      const lc = document.getElementById('live-comments');
      if (lc) { lc.textContent = txt; lc.hidden = false; }
    }
  } catch { /* keep build-time numbers */ }
}

moreBtn.addEventListener('click', load);
status.textContent = cfg.loading;
stats();
load();

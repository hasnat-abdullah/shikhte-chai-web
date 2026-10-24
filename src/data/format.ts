import type { Lang } from './categories';

const BN = '০১২৩৪৫৬৭৮৯';
export const digits = (x: string | number, lang: Lang) => (lang === 'bn' ? String(x).replace(/\d/g, (d) => BN[+d]) : String(x));

export function formatViews(n: number, lang: Lang): string {
  if (lang === 'bn') {
    if (n >= 100000) return `${digits((n / 100000).toFixed(1).replace(/\.0$/, ''), lang)} লক্ষ বার দেখা`;
    if (n >= 1000) return `${digits((n / 1000).toFixed(1).replace(/\.0$/, ''), lang)} হাজার বার দেখা`;
    return `${digits(n, lang)} বার দেখা`;
  }
  const c = n >= 1000 ? new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n) : String(n);
  return `${c} views`;
}

export function formatDate(iso: string, lang: Lang): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso + 'T12:00:00Z'));
}

export function formatDuration(secs: number): string {
  if (!secs) return '';
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
  const pad = (x: number) => String(x).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** Channel description, cleaned for display: no links, hashtags or empty lines. Returns '' if too thin to be useful. */
export function cleanDesc(raw: string): string {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !/https?:\/\/|youtu\.be|^#|^(like|subscribe|facebook|follow)\b/i.test(l));
  const text = lines.join('\n\n');
  if (text.length < 60) return '';
  return text.length > 700 ? text.slice(0, 700).replace(/\s+\S*$/, '') + '…' : text;
}

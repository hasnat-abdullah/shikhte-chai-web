// Minimal Supabase client (REST + password sign-in) using fetch only.
import { SITE } from '../config';

export const enabled = Boolean(SITE.supabase.url && SITE.supabase.key);
const base = SITE.supabase.url.replace(/\/$/, '');

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) { super(message); }
}

async function call(path: string, init: RequestInit & { token?: string; prefer?: string } = {}) {
  const headers: Record<string, string> = { apikey: SITE.supabase.key, 'Content-Type': 'application/json' };
  if (init.token) headers.Authorization = `Bearer ${init.token}`;
  if (init.prefer) headers.Prefer = init.prefer;
  const res = await fetch(base + path, { ...init, headers: { ...headers, ...(init.headers as Record<string, string>) } });
  const text = await res.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) throw new ApiError(res.status, body?.message || body?.msg || body?.error_description || res.statusText, body?.code);
  return body;
}

export const rest = {
  select: <T = any>(table: string, query: string, token?: string): Promise<T[]> => call(`/rest/v1/${table}?${query}`, { token }),
  insert: (table: string, row: Record<string, unknown>) => call(`/rest/v1/${table}`, { method: 'POST', body: JSON.stringify(row), prefer: 'return=minimal' }),
  update: (table: string, id: string, patch: Record<string, unknown>, token: string) =>
    call(`/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch), token, prefer: 'return=representation' }),
  remove: (table: string, id: string, token: string) =>
    call(`/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', token, prefer: 'return=representation' }),
};

export interface Session { access_token: string; refresh_token: string; expires_at: number; email: string }

export const auth = {
  async signIn(email: string, password: string): Promise<Session> {
    const j = await call('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email, password }) });
    return { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Date.now() + (j.expires_in ?? 3600) * 1000, email: j.user?.email ?? email };
  },
  async refresh(s: Session): Promise<Session> {
    const j = await call('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: JSON.stringify({ refresh_token: s.refresh_token }) });
    return { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Date.now() + (j.expires_in ?? 3600) * 1000, email: s.email };
  },
};

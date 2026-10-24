#!/usr/bin/env node
// One-command setup for the professionals directory's Supabase project. Safe to run again.
//
//   npm run setup:supabase                 everything below
//   npm run setup:supabase -- --migrate    only apply database migrations (used by the GitHub Action)
//   npm run setup:supabase -- --skip-migrate   everything except migrations
//   npm run setup:supabase -- --github     also store the secrets in your GitHub repository (needs the `gh` CLI)
//
// What it does: applies supabase/migrations, creates your admin login and adds it to the admins table, turns off
// public sign-ups, stores the optional Resend email settings, and writes PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY
// to .env. Configuration comes from environment variables (see README):
//   SUPABASE_ACCESS_TOKEN   personal access token   https://supabase.com/dashboard/account/tokens
//   SUPABASE_PROJECT_REF    the "abcdefgh" in https://abcdefgh.supabase.co
//   SUPABASE_DB_PASSWORD    the database password you chose when creating the project (for migrations)
//   ADMIN_EMAIL             your admin login (ADMIN_PASSWORD optional: one is generated and shown once)
//   RESEND_API_KEY, EMAIL_FROM, ADMIN_NOTIFY_EMAIL, SITE_URL   optional, for automatic emails
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const args = new Set(process.argv.slice(2));
const argVal = (name) => { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1] : undefined; };
const env = process.env;
const ENV_FILE = argVal('--dotenv') ?? '.env';
const API = (env.SUPABASE_API_BASE ?? 'https://api.supabase.com').replace(/\/$/, '');

const log = (m) => console.log(m);
const ok = (m) => console.log('  ✓ ' + m);
const warn = (m) => console.log('  ! ' + m);
function fail(m) { console.error('\nSetup stopped: ' + m + '\n'); process.exit(1); }
const need = (k, how) => env[k] || fail(`${k} is not set. ${how}`);

const token = need('SUPABASE_ACCESS_TOKEN', 'Create one at https://supabase.com/dashboard/account/tokens');
const ref = need('SUPABASE_PROJECT_REF', 'It is the first part of your project URL: https://<ref>.supabase.co');
const projectUrl = (env.SUPABASE_PROJECT_URL ?? `https://${ref}.supabase.co`).replace(/\/$/, '');

async function http(url, { method = 'GET', headers = {}, body, expect = [200, 201, 204] } = {}) {
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text();
  let data = null; try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, ok: expect.includes(res.status), data };
}
const mgmt = (path, opts = {}) => http(API + path, { ...opts, headers: { Authorization: `Bearer ${token}`, ...(opts.headers ?? {}) } });

// ---------------------------------------------------------------- 1. migrations
function migrate() {
  log('\n1. Database tables, access rules and email triggers');
  const dbPassword = need('SUPABASE_DB_PASSWORD', 'It is the database password you chose when you created the project (Project settings > Database can reset it).');
  const run = (cmd, a) => spawnSync('npx', ['--yes', 'supabase@latest', ...a], { stdio: 'inherit', env: { ...env, SUPABASE_ACCESS_TOKEN: token, SUPABASE_DB_PASSWORD: dbPassword } });
  let r = run('supabase', ['link', '--project-ref', ref, '--password', dbPassword]);
  if (r.status === 0) r = run('supabase', ['db', 'push', '--password', dbPassword, '--yes']);
  if (r.status !== 0) fail('applying migrations failed. As a fallback, paste the files in supabase/migrations, in order, into the Supabase SQL Editor and run them, then run this script again with --skip-migrate.');
  ok('migrations applied');
}

// ---------------------------------------------------------------- 2. keys
async function keys() {
  const r = await mgmt(`/v1/projects/${ref}/api-keys?reveal=true`);
  if (!r.ok || !Array.isArray(r.data)) fail(`could not read the project's API keys (HTTP ${r.status}). Check SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF.`);
  const find = (re) => r.data.find((k) => re.test(`${k.name ?? ''} ${k.type ?? ''}`) && k.api_key);
  const anon = find(/^anon\b/i) ?? find(/anon|publishable/i);
  const service = find(/^service_role\b/i) ?? find(/service_role|secret/i);
  if (!anon || !service) fail('could not find the anon and service keys. Found: ' + r.data.map((k) => k.name ?? k.type).join(', '));
  return { anon: anon.api_key, service: service.api_key };
}
const svcHeaders = (key) => ({ apikey: key, ...(key.startsWith('eyJ') ? { Authorization: `Bearer ${key}` } : {}) });

// ---------------------------------------------------------------- 3. admin account
async function admin(service) {
  log('\n2. Admin login');
  const email = need('ADMIN_EMAIL', 'This is the email you will sign in with at /admin/.').trim().toLowerCase();
  const generated = !env.ADMIN_PASSWORD;
  const password = env.ADMIN_PASSWORD ?? randomBytes(12).toString('base64url');
  const created = await http(`${projectUrl}/auth/v1/admin/users`, { method: 'POST', headers: svcHeaders(service), body: { email, password, email_confirm: true }, expect: [200, 201, 422] });
  if (created.status === 422) {
    ok(`${email} already has a login (password left unchanged)`);
  } else if (created.ok) {
    ok(`login created for ${email}`);
    if (generated) { log('\n    Your admin password (shown once, store it safely):\n\n      ' + password + '\n'); }
  } else {
    fail(`could not create the admin login (HTTP ${created.status}): ${JSON.stringify(created.data)}`);
  }
  const row = await http(`${projectUrl}/rest/v1/admins?on_conflict=email`, { method: 'POST', headers: { ...svcHeaders(service), Prefer: 'resolution=merge-duplicates,return=minimal' }, body: { email } });
  if (!row.ok) fail(`could not add ${email} to the admins table (HTTP ${row.status}). Did the migrations run?`);
  ok('added to the admins table');
  return email;
}

// ---------------------------------------------------------------- 4. sign-ups off
async function signups() {
  const r = await mgmt(`/v1/projects/${ref}/config/auth`, { method: 'PATCH', body: { disable_signup: true } });
  if (r.ok) ok('public sign-ups turned off'); else warn(`could not turn off public sign-ups (HTTP ${r.status}). Do it by hand: Authentication > Providers > Email > turn off "Allow new users to sign up".`);
}

// ---------------------------------------------------------------- 5. emails
async function emails(service, adminEmail) {
  log('\n3. Automatic emails');
  if (!env.RESEND_API_KEY) { ok('skipped (set RESEND_API_KEY and EMAIL_FROM to switch on automatic emails)'); return; }
  const from = need('EMAIL_FROM', "The sender, e.g. 'Shikhte Chai <hello@shikhtechai.com>'. The domain must be verified in Resend.");
  const rows = [
    { key: 'resend_api_key', value: env.RESEND_API_KEY },
    { key: 'email_from', value: from },
    { key: 'admin_notify_email', value: env.ADMIN_NOTIFY_EMAIL ?? adminEmail },
    { key: 'site_url', value: env.SITE_URL ?? 'https://shikhtechai.com' },
  ];
  const r = await http(`${projectUrl}/rest/v1/app_settings?on_conflict=key`, { method: 'POST', headers: { ...svcHeaders(service), Prefer: 'resolution=merge-duplicates,return=minimal' }, body: rows });
  if (!r.ok) fail(`could not store the email settings (HTTP ${r.status}). Did the migrations run?`);
  ok(`emails on: new requests go to ${rows[2].value}; approvals and rejections go to the professional`);
}

// ---------------------------------------------------------------- 6. .env + GitHub
function writeEnv(values) {
  const lines = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, 'utf8').split('\n') : [];
  for (const [k, v] of Object.entries(values)) {
    const i = lines.findIndex((l) => l.startsWith(k + '='));
    if (i > -1) lines[i] = `${k}=${v}`; else lines.push(`${k}=${v}`);
  }
  writeFileSync(ENV_FILE, lines.filter((l, i, a) => l !== '' || i < a.length - 1).join('\n').replace(/\n*$/, '\n'));
}

function github(secrets) {
  const has = spawnSync('gh', ['--version'], { stdio: 'ignore' }).status === 0;
  if (!has) { warn('the GitHub CLI (gh) is not installed. Add these as repository secrets by hand: ' + Object.keys(secrets).join(', ')); return; }
  for (const [k, v] of Object.entries(secrets)) {
    const r = spawnSync('gh', ['secret', 'set', k, '--body', v], { stdio: 'pipe' });
    r.status === 0 ? ok(`GitHub secret ${k} set`) : warn(`could not set GitHub secret ${k}: ${String(r.stderr).trim()}`);
  }
}

// ---------------------------------------------------------------- run
log(`Shikhte Chai directory setup for project ${ref}`);
if (args.has('--migrate')) { migrate(); process.exit(0); }
if (!args.has('--skip-migrate')) migrate();
const { anon, service } = await keys();
const adminEmail = await admin(service);
await signups();
await emails(service, adminEmail);
log('\n4. Website settings');
writeEnv({ PUBLIC_SUPABASE_URL: projectUrl, PUBLIC_SUPABASE_ANON_KEY: anon });
ok(`${ENV_FILE} updated (PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY)`);
if (args.has('--github')) {
  github({ PUBLIC_SUPABASE_URL: projectUrl, PUBLIC_SUPABASE_ANON_KEY: anon, SUPABASE_ACCESS_TOKEN: token, SUPABASE_PROJECT_REF: ref, ...(env.SUPABASE_DB_PASSWORD ? { SUPABASE_DB_PASSWORD: env.SUPABASE_DB_PASSWORD } : {}) });
} else {
  log('\n  Add these as GitHub repository secrets so the deployed site connects (or re-run with --github):\n    PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY' + '\n  and, for automatic database updates, SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF, SUPABASE_DB_PASSWORD');
}
log('\nDone. Start the site with `npm run dev`, then sign in at /admin/.');

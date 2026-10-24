// Admin page: review, edit, approve, reject and delete directory listings.
import { enabled, rest, auth, ApiError, type Session } from './supabase';
import { fillForm, readForm, showErrors, validate, bindCount, bindType } from './pro-form';
import { TYPES, SUBMIT_COLUMNS, districtName, label } from '../data/professionals';

const cfg = JSON.parse(document.getElementById('adm-cfg')!.textContent!) as { errs: Record<string, string>; site: string };
const $ = <E extends HTMLElement>(s: string) => document.querySelector<E>(s)!;
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const KEY = 'adm:session';

type Row = Record<string, any>;
let session: Session | null = null;
let rows: Row[] = [];
let tab: 'pending' | 'approved' | 'rejected' | 'all' = 'pending';
let editing: Row | null = null;

const form = $<HTMLFormElement>('#adm-form');
const dialog = $<HTMLDialogElement>('#adm-dialog');
bindCount(form, 'en');
bindType(form, true);

function save(s: Session | null) {
  session = s;
  try { s ? sessionStorage.setItem(KEY, JSON.stringify(s)) : sessionStorage.removeItem(KEY); } catch { /* storage blocked */ }
}

/** A valid access token, refreshed shortly before it expires. */
async function token(): Promise<string> {
  if (!session) throw new ApiError(401, 'Not signed in');
  if (session.expires_at - Date.now() < 60_000) {
    try { save(await auth.refresh(session)); } catch { save(null); show(); throw new ApiError(401, 'Session expired'); }
  }
  return session.access_token;
}

function flash(text: string, bad = false) {
  const n = $('#adm-note');
  n.textContent = text; n.hidden = !text; n.className = `adm-msg ${bad ? 'bad' : 'ok'}`;
  if (text) setTimeout(() => { if (n.textContent === text) n.hidden = true; }, 5000);
}

function show() {
  $('#adm-off').hidden = enabled;
  $('#adm-login').hidden = !enabled || Boolean(session);
  $('#adm-app').hidden = !session;
  if (session) $('#adm-who').textContent = session.email;
}

async function load() {
  try {
    rows = await rest.select('professionals', 'select=*&order=created_at.desc&limit=2000', await token());
    draw();
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) { save(null); show(); return; }
    flash('Could not load listings. ' + (e as Error).message, true);
  }
}

const matches = (r: Row, q: string) => !q || [r.name, r.name_en, r.submitter_email, r.phone, r.district, r.qualifications, r.registration_no].join(' ').toLowerCase().includes(q);

function draw() {
  const count = (s: string) => (s === 'all' ? rows.length : rows.filter((r) => r.status === s).length);
  $('#adm-tabs').innerHTML = (['pending', 'approved', 'rejected', 'all'] as const)
    .map((s) => `<button type="button" data-tab="${s}" aria-pressed="${s === tab}">${s[0].toUpperCase() + s.slice(1)}<span class="n">${count(s)}</span></button>`).join('');
  const q = $<HTMLInputElement>('#adm-q').value.trim().toLowerCase();
  const list = rows.filter((r) => (tab === 'all' || r.status === tab) && matches(r, q));
  if (!list.length) {
    $('#adm-list').innerHTML = `<p class="muted">${rows.length ? 'Nothing here.' : 'No listings yet. If you expected some, check that this account is in the admins table.'}</p>`;
    return;
  }
  $('#adm-list').innerHTML = list.map((r) => `
    <div class="adm-row" data-id="${esc(r.id)}">
      <div class="who"><strong>${esc(r.name)} <span class="badge badge-${esc(r.status)}">${esc(r.status)}</span></strong>
        <span>${esc(label(TYPES, r.type, 'en'))} · ${esc(districtName(r.district, 'en'))} · ${esc((r.modes ?? []).join(' + '))}</span>
        <span>${esc(r.submitter_email)} · submitted ${esc(String(r.created_at).slice(0, 10))}</span></div>
      <div class="acts">
        ${r.status !== 'approved' ? '<button type="button" class="ok" data-act="approve">Approve</button>' : ''}
        <button type="button" data-act="edit">${r.status === 'pending' ? 'Review' : 'Edit'}</button>
        ${r.status !== 'rejected' ? '<button type="button" class="no" data-act="reject">Reject</button>' : ''}
      </div>
    </div>`).join('');
}

function openEditor(r: Row, focusReason = false) {
  editing = r;
  fillForm(form, r);
  $('#adm-dtitle').textContent = `${r.name} · ${r.status}`;
  $('#adm-meta').innerHTML = `Submitted ${esc(String(r.created_at).slice(0, 16).replace('T', ' '))} · last changed ${esc(String(r.updated_at).slice(0, 16).replace('T', ' '))}${r.approved_at ? ` · approved ${esc(String(r.approved_at).slice(0, 10))}` : ''}<br>Contact: <a href="mailto:${esc(r.submitter_email)}">${esc(r.submitter_email)}</a>${r.registration_no ? ` · BM&amp;DC no.: ${esc(r.registration_no)}` : ''}${r.credentials_note ? `<br>Training: ${esc(r.credentials_note)}` : ''}`;
  $('#adm-ferr').hidden = true;
  updateMail();
  if (!dialog.open) dialog.showModal();
  if (focusReason) form.querySelector<HTMLInputElement>('[name="rejection_reason"]')!.focus();
}

function updateMail() {
  if (!editing) return;
  const v = readForm(form);
  const approved = v.status === 'approved';
  const body = approved
    ? `Hello ${v.name},\n\nYour profile has been approved and is now listed in the Shikhte Chai directory: ${cfg.site}/professionals/\n\nIf any detail needs changing, just reply to this email.\n\nShikhte Chai`
    : v.status === 'rejected'
      ? `Hello ${v.name},\n\nThank you for asking to be listed in the Shikhte Chai directory. We are not able to list your profile at this time.${v.rejection_reason ? `\n\nReason: ${v.rejection_reason}` : ''}\n\nYou are welcome to reply with more information.\n\nShikhte Chai`
      : `Hello ${v.name},\n\nThank you for asking to be listed in the Shikhte Chai directory. We have a question about your details:\n\n\n\nShikhte Chai`;
  $<HTMLAnchorElement>('#adm-mail').href = `mailto:${encodeURIComponent(editing.submitter_email)}?subject=${encodeURIComponent('Your listing on Shikhte Chai')}&body=${encodeURIComponent(body)}`;
}

const EDITABLE = SUBMIT_COLUMNS.filter((c) => c !== 'consent');

/** Validates the editor and writes the changes (and optionally a new status). */
async function commit(status?: 'approved' | 'rejected' | 'pending') {
  if (!editing) return;
  const v = readForm(form);
  if (status) v.status = status;
  const errors = validate(v);
  showErrors(form, errors, cfg.errs);
  if (Object.keys(errors).length) {
    const e = $('#adm-ferr'); e.textContent = 'Some fields need fixing before this can be saved.'; e.hidden = false;
    form.querySelector<HTMLElement>('.invalid input, .invalid select, .invalid textarea')?.focus();
    return;
  }
  const patch: Row = {};
  for (const c of EDITABLE) patch[c] = v[c] ?? null;
  patch.status = v.status;
  patch.verified = v.verified || 'none';
  patch.admin_note = v.admin_note || null;
  patch.rejection_reason = v.status === 'rejected' ? v.rejection_reason || null : null;
  setBusy(true);
  try {
    const res = await rest.update('professionals', editing.id, patch, await token());
    if (!res?.length) throw new Error('No row was updated. Is this account an admin?');
    rows = rows.map((r) => (r.id === editing!.id ? res[0] : r));
    dialog.close();
    flash(`Saved: ${res[0].name} is now ${res[0].status}.`);
    draw();
  } catch (e) {
    const el = $('#adm-ferr'); el.textContent = 'Save failed: ' + (e as Error).message; el.hidden = false;
  } finally { setBusy(false); }
}

function setBusy(b: boolean) { dialog.querySelectorAll('button').forEach((x) => ((x as HTMLButtonElement).disabled = b)); }

async function quickApprove(r: Row) {
  try {
    const res = await rest.update('professionals', r.id, { status: 'approved', rejection_reason: null }, await token());
    if (!res?.length) throw new Error('No row was updated. Is this account an admin?');
    rows = rows.map((x) => (x.id === r.id ? res[0] : x));
    flash(`${r.name} approved and published.`); draw();
  } catch (e) { flash('Approve failed: ' + (e as Error).message, true); }
}

// ---- events
$('#adm-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const err = $('#adm-login-err'); err.hidden = true;
  const btn = $<HTMLButtonElement>('#adm-login-btn'); btn.disabled = true;
  try {
    save(await auth.signIn($<HTMLInputElement>('#adm-email').value.trim(), $<HTMLInputElement>('#adm-pass').value));
    $<HTMLInputElement>('#adm-pass').value = '';
    show(); await load();
  } catch (e2) { err.textContent = 'Sign-in failed. Check the email and password.'; err.hidden = false; void e2; }
  finally { btn.disabled = false; }
});
$('#adm-out').addEventListener('click', () => { save(null); rows = []; show(); });
$('#adm-refresh').addEventListener('click', () => load());
$('#adm-q').addEventListener('input', draw);
$('#adm-tabs').addEventListener('click', (e) => { const b = (e.target as HTMLElement).closest<HTMLElement>('[data-tab]'); if (b) { tab = b.dataset.tab as typeof tab; draw(); } });
$('#adm-list').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
  if (!b) return;
  const r = rows.find((x) => x.id === b.closest<HTMLElement>('[data-id]')!.dataset.id);
  if (!r) return;
  if (b.dataset.act === 'approve') quickApprove(r);
  else if (b.dataset.act === 'edit') openEditor(r);
  else if (b.dataset.act === 'reject') { openEditor(r); form.querySelector<HTMLSelectElement>('[name="status"]')!.value = 'rejected'; updateMail(); form.querySelector<HTMLInputElement>('[name="rejection_reason"]')!.focus(); }
});
$('#adm-close').addEventListener('click', () => dialog.close());
$('#adm-save').addEventListener('click', () => commit());
$('#adm-approve').addEventListener('click', () => commit('approved'));
$('#adm-reject').addEventListener('click', () => commit('rejected'));
$('#adm-delete').addEventListener('click', async () => {
  if (!editing || !confirm(`Delete "${editing.name}" permanently? This cannot be undone.`)) return;
  setBusy(true);
  try {
    await rest.remove('professionals', editing.id, await token());
    rows = rows.filter((r) => r.id !== editing!.id);
    dialog.close(); flash('Listing deleted.'); draw();
  } catch (e) { const el = $('#adm-ferr'); el.textContent = 'Delete failed: ' + (e as Error).message; el.hidden = false; }
  finally { setBusy(false); }
});
form.addEventListener('input', updateMail);
form.addEventListener('change', updateMail);
form.addEventListener('submit', (e) => e.preventDefault());

// ---- start
(async () => {
  if (enabled) {
    try { session = JSON.parse(sessionStorage.getItem(KEY) ?? 'null'); } catch { session = null; }
  }
  show();
  if (session) await load();
})();

// Helpers shared by the public join form and the admin editor.
import { SUBMIT_COLUMNS, validate, BIO_MAX } from '../data/professionals';

const ARRAYS = ['specializations', 'modes', 'languages', 'ages'];
const OPTIONAL_TEXT = ['credentials_note', 'name_en', 'designation', 'area', 'clinic_name', 'address', 'fee_note', 'availability', 'email_public', 'website', 'registration_no'];

export function readForm(form: HTMLFormElement): Record<string, any> {
  const data = new FormData(form);
  const out: Record<string, any> = {};
  for (const el of form.elements as unknown as HTMLInputElement[]) {
    if (!el.name || out[el.name] !== undefined) continue;
    if (ARRAYS.includes(el.name)) out[el.name] = data.getAll(el.name).map(String);
    else if (el.type === 'radio') out[el.name] = String(data.get(el.name) ?? '');
    else if (el.type === 'checkbox') out[el.name] = el.checked;
    else out[el.name] = String(data.get(el.name) ?? '').trim();
  }
  for (const k of OPTIONAL_TEXT) if (out[k] === '') out[k] = null;
  return out;
}

/** Psychiatrists give a BM&DC number; everyone else describes their training. Admins see both. */
export function bindType(form: HTMLFormElement, showBoth = false) {
  const update = () => {
    const type = (form.querySelector<HTMLInputElement>('input[name="type"]:checked')?.value) ?? '';
    const psy = form.querySelector<HTMLElement>('.reg-psy'), other = form.querySelector<HTMLElement>('.reg-other'), wait = form.querySelector<HTMLElement>('.reg-wait');
    if (!psy || !other || !wait) return;
    psy.hidden = !showBoth && type !== 'psychiatrist';
    other.hidden = !showBoth && (type === 'psychiatrist' || !type);
    wait.hidden = showBoth || Boolean(type);
  };
  form.addEventListener('change', update);
  (form as any)._updateType = update;
  update();
}

export function fillForm(form: HTMLFormElement, row: Record<string, any>) {
  form.reset();
  for (const el of form.elements as unknown as HTMLInputElement[]) {
    if (!el.name) continue;
    const v = row[el.name];
    if (ARRAYS.includes(el.name) && el.type === 'checkbox') el.checked = Array.isArray(v) && v.includes(el.value);
    else if (el.type === 'radio') el.checked = v === el.value;
    else if (el.type === 'checkbox') el.checked = Boolean(v);
    else el.value = v ?? '';
  }
  updateCount(form);
  (form as any)._updateType?.();
  showErrors(form, {}, {});
}

export function showErrors(form: HTMLFormElement, errors: Record<string, string>, messages: Record<string, string>) {
  form.querySelectorAll<HTMLElement>('[data-err]').forEach((p) => {
    const key = p.dataset.err!;
    const code = errors[key];
    p.hidden = !code;
    p.textContent = code ? messages[code] ?? code : '';
    p.closest('.field')?.classList.toggle('invalid', Boolean(code));
  });
}

/** Keeps the "n / 450" counter next to the bio in step with the text. */
export function bindCount(form: HTMLFormElement, lang: 'bn' | 'en') {
  const area = form.querySelector<HTMLTextAreaElement>('textarea[name="bio"]');
  area?.addEventListener('input', () => updateCount(form, lang));
  (form as any)._lang = lang;
}

function updateCount(form: HTMLFormElement, lang?: 'bn' | 'en') {
  const l = lang ?? (form as any)._lang ?? 'en';
  const area = form.querySelector<HTMLTextAreaElement>('textarea[name="bio"]');
  const out = form.querySelector<HTMLElement>('[data-count="bio"]');
  if (!area || !out) return;
  const d = (n: number) => (l === 'bn' ? String(n).replace(/\d/g, (x) => '০১২৩৪৫৬৭৮৯'[+x]) : String(n));
  out.textContent = `${d(area.value.length)}/${d(BIO_MAX)}`;
}

/** Row to send for a new submission: only the columns visitors are allowed to set. */
export function submission(values: Record<string, any>) {
  const row: Record<string, any> = {};
  for (const k of SUBMIT_COLUMNS) row[k] = values[k] ?? null;
  row.consent = true;
  return row;
}

export { validate };

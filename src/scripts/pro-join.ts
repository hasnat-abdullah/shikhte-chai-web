import { enabled, rest } from './supabase';
import { bindCount, bindType, readForm, showErrors, submission, validate } from './pro-form';

const cfg = JSON.parse(document.getElementById('join-cfg')!.textContent!) as {
  lang: 'bn' | 'en'; errs: Record<string, string>; fixErrors: string; sendError: string; submitting: string; submit: string; notConnected: string; consentError: string;
};
const form = document.getElementById('join-form') as HTMLFormElement;
const sent = document.getElementById('join-sent')!;
const formErr = document.getElementById('join-err')!;
const btn = document.getElementById('join-submit') as HTMLButtonElement;
const consent = document.getElementById('join-consent') as HTMLInputElement;
const consentErr = document.getElementById('consent-err')!;

bindCount(form, cfg.lang);
bindType(form);

if (!enabled) {
  formErr.textContent = cfg.notConnected; formErr.hidden = false; btn.disabled = true;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  formErr.hidden = true; consentErr.hidden = true;
  const values = readForm(form);
  const errors = validate(values);
  showErrors(form, errors, cfg.errs);
  const noConsent = !consent.checked;
  consentErr.hidden = !noConsent;
  if (Object.keys(errors).length || noConsent) {
    formErr.textContent = cfg.fixErrors; formErr.hidden = false;
    (form.querySelector('.invalid input, .invalid select, .invalid textarea') as HTMLElement | null)?.focus();
    return;
  }
  if ((form.elements.namedItem('botcheck') as HTMLInputElement)?.checked) return; // honeypot
  btn.disabled = true; btn.textContent = cfg.submitting;
  try {
    await rest.insert('professionals', submission(values));
    // The admin is emailed by a database trigger (see supabase/migrations), not by the browser.
    form.hidden = true; sent.hidden = false; sent.focus();
    window.scrollTo({ top: 0 });
  } catch {
    formErr.textContent = cfg.sendError; formErr.hidden = false;
  } finally {
    btn.disabled = false; btn.textContent = cfg.submit;
  }
});

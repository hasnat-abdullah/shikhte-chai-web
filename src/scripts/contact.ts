// Message form: posts to Web3Forms, which emails the site inbox. No data is kept on this site.
const cfg = JSON.parse(document.getElementById('contact-cfg')!.textContent!) as {
  key: string; err: string; off: string; req: string; sending: string; send: string;
};
const $ = <T extends HTMLElement>(s: string) => document.querySelector<T>(s)!;
const form = $<HTMLFormElement>('#form');
const sent = $('#sent');
const msg = $<HTMLTextAreaElement>('#c-msg');
const anon = $<HTMLInputElement>('#anon');
const identity = $('#identity');
const formErr = $('#form-err');
const msgErr = $('#msg-err');
const submit = $<HTMLButtonElement>('#submit');
const radios = [...document.querySelectorAll<HTMLInputElement>('input[name="topic"]')];

const selected = () => radios.find((r) => r.checked)!;
const applyTopic = () => { msg.placeholder = selected().dataset.ph ?? ''; };
radios.forEach((r) => r.addEventListener('change', applyTopic));
applyTopic();

const params = new URLSearchParams(location.search);
const about = params.get('v');
if (params.get('topic')) {
  const m = radios.find((r) => r.value === params.get('topic'));
  if (m) { m.checked = true; applyTopic(); }
}

anon.addEventListener('change', () => { identity.hidden = anon.checked; });

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  formErr.hidden = true; msgErr.hidden = true;
  if (!msg.value.trim()) {
    msgErr.textContent = cfg.req; msgErr.hidden = false; msg.focus(); return;
  }
  if (!cfg.key) { formErr.textContent = cfg.off; formErr.hidden = false; return; }

  const data = new FormData(form);
  const payload: Record<string, string> = {
    access_key: cfg.key,
    subject: `[Shikhte Chai] ${selected().dataset.label} (${selected().value})`,
    from_name: 'Shikhte Chai website',
    topic: selected().value,
    message: msg.value.trim() + (about ? `\n\nAbout video: https://www.youtube.com/watch?v=${about}` : ''),
    page: location.href,
    botcheck: data.get('botcheck') ? 'on' : '',
  };
  if (!anon.checked) {
    const name = String(data.get('name') ?? '').trim();
    const email = String(data.get('email') ?? '').trim();
    if (name) payload.name = name;
    if (email) payload.email = email;
  }

  submit.disabled = true; submit.textContent = cfg.sending;
  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'failed');
    form.hidden = true; sent.hidden = false; sent.focus();
    form.reset(); identity.hidden = false; applyTopic();
  } catch {
    formErr.textContent = cfg.err; formErr.hidden = false;
  } finally {
    submit.disabled = false; submit.textContent = cfg.send;
  }
});

$('#again').addEventListener('click', () => { sent.hidden = true; form.hidden = false; msg.focus(); });

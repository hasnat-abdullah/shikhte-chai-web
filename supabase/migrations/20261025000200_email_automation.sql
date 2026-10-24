-- Automatic emails for the professionals directory (optional: nothing is sent until an email key is stored).
--   * you get an email when someone asks to be listed (at most 5 per 10 minutes, so spam cannot flood your inbox)
--   * the professional gets an email when you approve or reject their request
-- Emails go through Resend (https://resend.com) using pg_net, which sends after the transaction commits, so an
-- email problem can never block a submission or an approval.

create extension if not exists pg_net with schema extensions;

-- Settings and the email key. No policies and no grants: only the service role and the functions below can read it.
create table if not exists public.app_settings (key text primary key, value text not null);
alter table public.app_settings enable row level security;
revoke all on public.app_settings from anon, authenticated;
--   resend_api_key      the Resend API key (re_...)
--   email_from          sender, e.g. 'Shikhte Chai <hello@shikhtechai.com>' (an address on a domain verified in Resend)
--   admin_notify_email  where new-request emails go
--   site_url            used for links in the emails (default https://shikhtechai.com)

create or replace function public.html_escape(t text) returns text language sql immutable as $$
  select replace(replace(replace(replace(coalesce(t, ''), '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), '"', '&quot;')
$$;

create or replace function public.send_email(to_addr text, subject text, html text, reply_to text default null) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare k text; f text; payload jsonb;
begin
  select value into k from public.app_settings where key = 'resend_api_key';
  select value into f from public.app_settings where key = 'email_from';
  if coalesce(k, '') = '' or coalesce(f, '') = '' or coalesce(to_addr, '') = '' then return; end if;
  payload := jsonb_build_object('from', f, 'to', jsonb_build_array(to_addr), 'subject', subject, 'html', html);
  if coalesce(reply_to, '') <> '' then payload := payload || jsonb_build_object('reply_to', reply_to); end if;
  perform net.http_post(
    url := 'https://api.resend.com/emails',
    body := payload,
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || k),
    timeout_milliseconds := 5000
  );
exception when others then
  raise warning 'send_email failed: %', sqlerrm;
end;
$$;
revoke all on function public.send_email(text, text, text, text) from public, anon, authenticated;

create or replace function public.professionals_notify() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare site text; admin_to text; recent int; plain_name text; who text; reason text;
begin
  select value into site from public.app_settings where key = 'site_url';
  site := rtrim(coalesce(nullif(site, ''), 'https://shikhtechai.com'), '/');
  select value into admin_to from public.app_settings where key = 'admin_notify_email';
  plain_name := regexp_replace(new.name, '[\r\n]+', ' ', 'g');
  who := public.html_escape(new.name);

  if tg_op = 'INSERT' then
    select count(*) into recent from public.professionals where created_at > now() - interval '10 minutes';
    if recent <= 5 then
      perform public.send_email(
        admin_to,
        'New directory request: ' || plain_name,
        '<p><strong>' || who || '</strong> (' || public.html_escape(new.type) || ', ' || public.html_escape(new.district) || ') asked to be listed.</p>'
          || '<p><a href="' || site || '/admin/">Review it in the admin page</a></p>'
      );
    end if;
  elsif new.status is distinct from old.status then
    if new.status = 'approved' then
      perform public.send_email(
        new.submitter_email,
        'আপনার প্রোফাইল তালিকায় যুক্ত হয়েছে | Your profile is now listed',
        '<p>প্রিয় ' || who || ', আপনার প্রোফাইল শিখতে চাই-এর বিশেষজ্ঞ তালিকায় যুক্ত হয়েছে: <a href="' || site || '/professionals/">' || site || '/professionals/</a>। কোনো তথ্য বদলাতে চাইলে এই ইমেইলের উত্তর দিন।</p>'
          || '<p>Dear ' || who || ', your profile is now listed in the Shikhte Chai directory: <a href="' || site || '/professionals/">' || site || '/professionals/</a>. If any detail needs changing, reply to this email.</p>',
        admin_to
      );
    elsif new.status = 'rejected' then
      reason := public.html_escape(new.rejection_reason);
      perform public.send_email(
        new.submitter_email,
        'আপনার অনুরোধ সম্পর্কে | About your request to be listed',
        '<p>প্রিয় ' || who || ', শিখতে চাই-এর বিশেষজ্ঞ তালিকায় যুক্ত হওয়ার অনুরোধের জন্য ধন্যবাদ। দুঃখিত, এই মুহূর্তে আপনার প্রোফাইল তালিকাভুক্ত করা সম্ভব হচ্ছে না।'
          || case when reason <> '' then ' কারণ: ' || reason else '' end
          || ' আরও তথ্য থাকলে এই ইমেইলের উত্তর দিয়ে জানান।</p>'
          || '<p>Dear ' || who || ', thank you for asking to be listed in the Shikhte Chai directory. We are not able to list your profile at this time.'
          || case when reason <> '' then ' Reason: ' || reason else '' end
          || ' You are welcome to reply with more information.</p>',
        admin_to
      );
    end if;
  end if;
  return null;
exception when others then
  raise warning 'professionals_notify failed: %', sqlerrm;
  return null;
end;
$$;
revoke all on function public.professionals_notify() from public, anon, authenticated;

drop trigger if exists professionals_notify_insert on public.professionals;
create trigger professionals_notify_insert after insert on public.professionals
  for each row execute function public.professionals_notify();

drop trigger if exists professionals_notify_status on public.professionals;
create trigger professionals_notify_status after update of status on public.professionals
  for each row when (old.status is distinct from new.status) execute function public.professionals_notify();

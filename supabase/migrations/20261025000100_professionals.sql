-- Shikhte Chai: professionals directory (tables and access rules).
-- Applied automatically by `npm run setup:supabase` (or `supabase db push`). You can also paste the files in
-- supabase/migrations, in order, into the Supabase SQL Editor.
-- (If you ran an earlier hand-pasted version, run `drop table public.professionals;` first. There is no live data to keep.)

-- ---------------------------------------------------------------- admins
create table if not exists public.admins (email text primary key);
alter table public.admins enable row level security;  -- no policies: only is_admin() reads it

create or replace function public.is_admin() returns boolean
language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.admins a where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------- table
create table if not exists public.professionals (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  approved_at     timestamptz,
  status          text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),

  name            text not null check (char_length(name) between 2 and 120),
  name_en         text check (char_length(name_en) <= 120),
  type            text not null check (type in ('psychiatrist', 'clinical_psychologist', 'counselling_psychologist', 'educational_psychologist', 'psychotherapist', 'counsellor', 'allied')),
  designation     text check (char_length(designation) <= 160),
  qualifications  text not null check (char_length(qualifications) between 2 and 200),
  specializations text[] not null check (
    cardinality(specializations) between 1 and 6 and
    specializations <@ array['depression','anxiety','suicide_selfharm','bipolar','psychosis','addiction','ocd','trauma','autism_dev','adhd','dementia_older','sexual_health','relationships','family','parenting','stress','anger','grief','self_esteem','sleep','eating','study_learning','assessment']::text[]),
  modes           text[] not null check (cardinality(modes) between 1 and 2 and modes <@ array['offline', 'online']::text[]),
  languages       text[] not null check (cardinality(languages) between 1 and 3 and languages <@ array['bn', 'en', 'other']::text[]),
  ages            text[] not null default '{}' check (ages <@ array['child', 'adolescent', 'adult', 'older']::text[]),

  district        text not null check (char_length(district) between 2 and 40),
  -- what the site owner has checked (set by admins only): none, BM&DC registration seen, or training/credentials seen
  verified        text not null default 'none' check (verified in ('none', 'registration', 'credentials')),
  area            text check (char_length(area) <= 120),
  clinic_name     text check (char_length(clinic_name) <= 160),
  address         text check (char_length(address) <= 300),
  fee_note        text check (char_length(fee_note) <= 120),
  availability    text check (char_length(availability) <= 160),
  bio             text not null check (char_length(bio) between 20 and 450),

  phone           text not null check (phone ~ '^[0-9+() -]{6,30}$'),
  email_public    text check (email_public ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email_public) <= 160),
  website         text check (website ~* '^https?://' and char_length(website) <= 300),

  -- private: never readable by visitors
  registration_no text check (char_length(registration_no) <= 80),   -- BM&DC number, for psychiatrists
  credentials_note text check (char_length(credentials_note) <= 600), -- training, university, practice hours, association, for everyone else
  submitter_email text not null check (submitter_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(submitter_email) <= 160),
  consent         boolean not null check (consent),
  admin_note      text check (char_length(admin_note) <= 2000),
  rejection_reason text check (char_length(rejection_reason) <= 1000),

  -- Psychiatrists must give a BM&DC registration number (the only statutory register for these professions);
  -- everyone else describes their training so it can be checked.
  constraint verification_info check (
    (type = 'psychiatrist' and char_length(coalesce(registration_no, '')) >= 3) or
    (type <> 'psychiatrist' and char_length(coalesce(credentials_note, '')) >= 10)
  )
);

create index if not exists professionals_status_idx on public.professionals (status, created_at desc);

create or replace function public.professionals_touch() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  if new.status = 'approved' and old.status is distinct from 'approved' then
    new.approved_at := now();
  end if;
  return new;
end;
$$;
drop trigger if exists professionals_touch on public.professionals;
create trigger professionals_touch before update on public.professionals
  for each row execute function public.professionals_touch();

-- ---------------------------------------------------------------- access
alter table public.professionals enable row level security;
revoke all on public.professionals from anon, authenticated;

-- Visitors: read approved rows, public columns only (note: they cannot filter on `status`; the policy already limits them to approved rows); submit new rows as "pending", submission columns only.
grant select (id, created_at, updated_at, name, name_en, type, designation, qualifications, specializations, modes, languages, ages,
              district, verified, area, clinic_name, address, fee_note, availability, bio, phone, email_public, website)
  on public.professionals to anon;
grant insert (name, name_en, type, designation, qualifications, specializations, modes, languages, ages, district, area, clinic_name,
              address, fee_note, availability, bio, phone, email_public, website, registration_no, credentials_note, submitter_email, consent)
  on public.professionals to anon;
-- Signed-in users: full access, but row policies below limit it to admins.
grant select, insert, update, delete on public.professionals to authenticated;

drop policy if exists "visitors read approved" on public.professionals;
create policy "visitors read approved" on public.professionals for select to anon using (status = 'approved');

drop policy if exists "visitors submit pending" on public.professionals;
create policy "visitors submit pending" on public.professionals for insert to anon
  with check (status = 'pending' and verified = 'none' and approved_at is null and admin_note is null and rejection_reason is null);

drop policy if exists "admins read all" on public.professionals;
create policy "admins read all" on public.professionals for select to authenticated using (public.is_admin());
drop policy if exists "admins insert" on public.professionals;
create policy "admins insert" on public.professionals for insert to authenticated with check (public.is_admin());
drop policy if exists "admins update" on public.professionals;
create policy "admins update" on public.professionals for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins delete" on public.professionals;
create policy "admins delete" on public.professionals for delete to authenticated using (public.is_admin());

-- Your admin account is created by `npm run setup:supabase` (a login in Authentication, plus a row in public.admins).
-- To add another admin later: create the user under Authentication > Users, then run
--   insert into public.admins (email) values ('their-email');

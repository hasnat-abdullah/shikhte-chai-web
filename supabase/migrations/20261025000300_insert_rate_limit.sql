-- Shikhte Chai: limits on the public "join the directory" form.
-- Anyone can submit a listing (that is the point of the form), so without a limit a script could fill the table
-- with junk and bury real requests in the admin queue. Admins are not limited.
--   * one person (same email or phone) can have at most 3 requests waiting for review;
--   * at most 30 new requests in any hour from everyone together.
-- The join form shows its normal "could not send" message when a limit is hit.

create index if not exists professionals_created_idx on public.professionals (created_at desc);

create or replace function public.professionals_rate_limit() returns trigger
language plpgsql security definer set search_path = public as $$
declare same_person int; last_hour int;
begin
  if public.is_admin() then
    return new;
  end if;

  select count(*) into same_person from public.professionals
   where status = 'pending'
     and (lower(submitter_email) = lower(new.submitter_email)
          or regexp_replace(phone, '[^0-9]', '', 'g') = regexp_replace(new.phone, '[^0-9]', '', 'g'));
  if same_person >= 3 then
    raise exception 'too many pending requests from this person' using errcode = 'P0001', hint = 'rate_limited';
  end if;

  select count(*) into last_hour from public.professionals where created_at > now() - interval '1 hour';
  if last_hour >= 30 then
    raise exception 'too many requests right now, try again later' using errcode = 'P0001', hint = 'rate_limited';
  end if;

  return new;
end;
$$;
revoke all on function public.professionals_rate_limit() from public, anon, authenticated;

drop trigger if exists professionals_rate_limit on public.professionals;
create trigger professionals_rate_limit before insert on public.professionals
  for each row execute function public.professionals_rate_limit();

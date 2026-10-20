-- Offre de lancement : nombre de places facultatif (null = illimité), date de fin facultative.
-- Sans nombre de places, l'admin exige une date de fin.
alter table public.launch_offer add column if not exists ends_at timestamptz;
alter table public.launch_offer alter column quota drop not null;

create or replace function public.launch_offer_state() returns jsonb
language sql security definer set search_path = public as $$
  with used as (select count(*) as slots from public.launch_offer_slots where state <> 'released'),
  paid as (
    select count(*) as orders from public.orders
    where demo = false and 'LANCEMENT-2026' = any(string_to_array(promo_code, ', '))
      and (amount_paid > 0 or stripe_session_id like 'devis_%')
  )
  select jsonb_build_object('enabled', enabled, 'startsAt', starts_at, 'endsAt', ends_at, 'quota', quota, 'rates', rates,
    'used', used.slots,
    'remaining', case when quota is null then null else greatest(0, quota - used.slots) end,
    'ordersRemaining', case when quota is null then null else greatest(0, quota - paid.orders) end)
  from public.launch_offer, used, paid where id = true;
$$;

create or replace function public.reserve_launch_slot(slot_id uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare campaign public.launch_offer; previous text;
begin
  select * into campaign from public.launch_offer where id = true for update;
  select state into previous from public.launch_offer_slots where id = slot_id;
  if previous is not null then return previous = 'held'; end if;
  if not campaign.enabled or campaign.starts_at > now() or campaign.ends_at <= now() then return false; end if;
  if campaign.quota is not null and (select count(*) from public.launch_offer_slots where state <> 'released') >= campaign.quota then
    return false;
  end if;
  insert into public.launch_offer_slots (id) values (slot_id);
  return true;
end;
$$;
revoke all on function public.launch_offer_state() from public, anon, authenticated;
revoke all on function public.reserve_launch_slot(uuid) from public, anon, authenticated;
grant execute on function public.launch_offer_state() to service_role;
grant execute on function public.reserve_launch_slot(uuid) to service_role;
notify pgrst, 'reload schema';

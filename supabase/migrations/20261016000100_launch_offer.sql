-- Quota commun : une réservation = une commande, quel que soit son nombre de créations.
create table public.launch_offer (
  id boolean primary key default true check (id),
  enabled boolean not null default false,
  starts_at timestamptz,
  quota integer not null default 10 check (quota = 10)
);
insert into public.launch_offer (id) values (true);
create table public.launch_offer_slots (
  id uuid primary key,
  state text not null default 'held' check (state in ('held', 'paid', 'released')),
  created_at timestamptz not null default now()
);
alter table public.launch_offer enable row level security;
alter table public.launch_offer_slots enable row level security;

create function public.launch_offer_state() returns jsonb
language sql security definer set search_path = public as $$
  select jsonb_build_object('enabled', enabled, 'startsAt', starts_at, 'remaining', greatest(0, quota -
    (select count(*) from public.launch_offer_slots where state <> 'released')))
  from public.launch_offer where id = true;
$$;
create function public.reserve_launch_slot(slot_id uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare campaign public.launch_offer; previous text;
begin
  select * into campaign from public.launch_offer where id = true for update;
  select state into previous from public.launch_offer_slots where id = slot_id;
  if previous is not null then return previous = 'held'; end if;
  if not campaign.enabled or campaign.starts_at > now() or (select count(*) from public.launch_offer_slots where state <> 'released') >= campaign.quota then
    return false;
  end if;
  insert into public.launch_offer_slots (id) values (slot_id);
  return true;
end;
$$;
create function public.settle_launch_slot(slot_id uuid, paid boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform 1 from public.launch_offer where id = true for update;
  update public.launch_offer_slots set state = case when paid then 'paid' else 'released' end
    where id = slot_id and state = 'held';
end;
$$;
-- Seul le serveur peut lire ou consommer le quota.
revoke all on function public.launch_offer_state() from public, anon, authenticated;
revoke all on function public.reserve_launch_slot(uuid) from public, anon, authenticated;
revoke all on function public.settle_launch_slot(uuid, boolean) from public, anon, authenticated;
grant execute on function public.launch_offer_state() to service_role;
grant execute on function public.reserve_launch_slot(uuid) to service_role;
grant execute on function public.settle_launch_slot(uuid, boolean) to service_role;

-- Les devis au tarif normal sont remisés puis figés à l'acceptation, dans
-- la même transaction que leur quota commun avec les commandes du catalogue.
alter function public.respond_project_quote(text, boolean, text, jsonb, text)
  rename to respond_project_quote_without_launch;
create function public.respond_project_quote(quote_token text, accepting boolean, decline_reason text default '',
  client_brief jsonb default '{}'::jsonb, chosen_payment text default null, expected_price integer default null)
returns uuid language plpgsql security invoker set search_path = public as $$
declare q jsonb; quote_id uuid; order_id uuid; base integer; total integer; percent integer; reserved boolean := false;
begin
  select id, content into quote_id, q from public.project_quotes where token = quote_token for update;
  if accepting and q->>'status' = 'propose' and q->>'launchPercent' in ('25', '50') then
    base := (q->>'totalPrice')::integer;
    total := base;
    percent := (q->>'launchPercent')::integer;
    reserved := public.reserve_launch_slot(quote_id);
    if reserved then total := greatest(50, base - round(base * percent / 100.0)::integer); end if;
    if expected_price is null or total <> expected_price then raise exception 'Le prix a changé. Actualise la page.'; end if;
    if reserved then
      update public.project_quotes set content = q || jsonb_build_object('totalPrice', total, 'launchBasePrice', base) where id = quote_id;
    end if;
  end if;
  order_id := public.respond_project_quote_without_launch(quote_token, accepting, decline_reason, client_brief, chosen_payment);
  if reserved and order_id is not null then
    update public.orders set list_price = base, promo_code = 'LANCEMENT-2026', promo_discount = base - total where id = order_id;
    -- Un devis accepté constitue une commande ferme.
    perform public.settle_launch_slot(quote_id, true);
  end if;
  return order_id;
end;
$$;
revoke all on function public.respond_project_quote(text, boolean, text, jsonb, text, integer) from public, anon, authenticated;
grant execute on function public.respond_project_quote(text, boolean, text, jsonb, text, integer) to service_role;
notify pgrst, 'reload schema';

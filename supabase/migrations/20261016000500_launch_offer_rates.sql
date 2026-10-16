-- Offre de lancement éditable : quota de commandes et taux de remise (par produit, et pour les devis).
alter table public.launch_offer drop constraint if exists launch_offer_quota_check;
alter table public.launch_offer add constraint launch_offer_quota_check check (quota between 1 and 1000);
alter table public.launch_offer add column if not exists rates jsonb not null default '{"packs":50,"options":25,"products":{}}'::jsonb;

create or replace function public.launch_offer_state() returns jsonb
language sql security definer set search_path = public as $$
  select jsonb_build_object('enabled', enabled, 'startsAt', starts_at, 'quota', quota, 'rates', rates,
    'remaining', greatest(0, quota - (select count(*) from public.launch_offer_slots where state <> 'released')),
    'ordersRemaining', greatest(0, quota - (
      select count(*) from public.orders
      where demo = false and 'LANCEMENT-2026' = any(string_to_array(promo_code, ', '))
        and (amount_paid > 0 or stripe_session_id like 'devis_%')
    )))
  from public.launch_offer where id = true;
$$;

-- Les devis gardent le pourcentage fixé à leur demande (packs ou à la carte / sur mesure), entre 1 et 80 %.
create or replace function public.respond_project_quote(quote_token text, accepting boolean, decline_reason text default '',
  client_brief jsonb default '{}'::jsonb, chosen_payment text default null, expected_price integer default null)
returns uuid language plpgsql security invoker set search_path = public as $$
declare q jsonb; quote_id uuid; order_id uuid; base integer; total integer; percent numeric; reserved boolean := false;
begin
  select id, content into quote_id, q from public.project_quotes where token = quote_token for update;
  if accepting and q->>'status' = 'propose' and jsonb_typeof(q->'launchPercent') = 'number'
    and (q->>'launchPercent')::numeric > 0 and (q->>'launchPercent')::numeric <= 80 then
    base := (q->>'totalPrice')::integer;
    total := base;
    percent := (q->>'launchPercent')::numeric;
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

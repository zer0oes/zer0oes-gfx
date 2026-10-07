-- Clôture prospective uniquement, déclenchée par les prochains accès finaux.
create or replace function public.record_final_access(deliverable_id uuid, asset_keys text[])
returns boolean language plpgsql security invoker set search_path = public as $$
declare target_order uuid;
begin
  update public.deliverables
  set final_accessed_at = coalesce(final_accessed_at, now()),
      accessed_final_assets = array(select distinct unnest(accessed_final_assets || asset_keys))
  where id = deliverable_id and approved_at is not null
  returning order_id into target_order;
  if target_order is null then return false; end if;
  perform 1 from public.orders where id = target_order for update;
  update public.orders o
  set status = 'terminee', completed_at = coalesce(completed_at, now()), updated_at = now()
  where o.id = target_order and amount_paid >= total_price
    and not exists (
      select 1 from public.deliverables d where d.order_id = o.id and (
        d.approved_at is null or
        cardinality(array(select distinct key from (
          select d.storage_path as key union all select d.url
          union all select coalesce(a->>'path', a->>'url') from jsonb_array_elements(d.final_assets) a
        ) assets where key is not null and key <> '')) = 0 or
        exists (select 1 from (
          select d.storage_path as key union all select d.url
          union all select coalesce(a->>'path', a->>'url') from jsonb_array_elements(d.final_assets) a
        ) assets where key is not null and key <> '' and not (key = any(d.accessed_final_assets)))
      )
    ) and (o.status <> 'terminee' or o.completed_at is null);
  return true;
end;
$$;

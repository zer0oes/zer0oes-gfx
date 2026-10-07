alter table public.deliverables add column accessed_final_assets text[] not null default '{}';
-- Les accès antérieurs ne permettent pas de savoir quels fichiers ont été récupérés.
create function public.record_final_access(deliverable_id uuid, asset_keys text[])
returns boolean language plpgsql security invoker set search_path = public as $$
begin
  update public.deliverables
  set final_accessed_at = coalesce(final_accessed_at, now()),
      accessed_final_assets = array(select distinct unnest(accessed_final_assets || asset_keys))
  where id = deliverable_id and approved_at is not null;
  return found;
end;
$$;
revoke all on function public.record_final_access(uuid, text[]) from public, anon, authenticated;
grant execute on function public.record_final_access(uuid, text[]) to service_role;

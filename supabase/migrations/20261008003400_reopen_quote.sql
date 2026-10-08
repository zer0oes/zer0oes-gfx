create function public.reopen_project_quote(quote_token text)
returns boolean language plpgsql security invoker set search_path = public as $$
declare q jsonb; target_id uuid;
begin
  select id, content into target_id, q from public.project_quotes where token = quote_token for update;
  if q is null or q->>'status' <> 'refuse' or q->>'orderId' is not null
    or (q->>'validUntil')::date < (now() at time zone 'UTC')::date then return false; end if;
  update public.project_quotes set content = (q - 'declineReason') || jsonb_build_object(
    'status', 'propose', 'updatedAt', to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
    where id = target_id;
  return true;
end;
$$;
revoke all on function public.reopen_project_quote(text) from public, anon, authenticated;
grant execute on function public.reopen_project_quote(text) to service_role;
notify pgrst, 'reload schema';

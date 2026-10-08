drop function public.respond_project_quote(text, boolean);
-- Only the server can read requests or record a decision. The row lock prevents
-- two simultaneous acceptances from creating two orders.
create or replace function public.respond_project_quote(quote_token text, accepting boolean, decline_reason text default '')
returns uuid language plpgsql security invoker set search_path = public as $$
declare q jsonb; quote_id uuid; order_id uuid; stamp text;
begin
  select id, content into quote_id, q from public.project_quotes where token = quote_token for update;
  if q->>'status' = 'accepte' then return (q->>'orderId')::uuid; end if;
  if q is null or q->>'status' <> 'propose' or (q->>'validUntil')::date < (now() at time zone 'UTC')::date then
    raise exception 'Devis indisponible ou expiré.';
  end if;
  stamp := to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  if not accepting then
    update public.project_quotes set content = q || jsonb_build_object('status', 'refuse', 'updatedAt', stamp, 'declineReason', left(trim(coalesce(decline_reason, '')), 2000)) where id = quote_id;
    return null;
  end if;
  insert into public.orders (stripe_session_id, pack_id, formula_id, offer_name, payment_type,
    list_price, total_price, amount_paid, deposit_percent, customer_name, customer_email,
    status, brief, brief_received_at, delivery_template, delivery_token)
  values ('devis_' || quote_id, 'sur-mesure', 'base', q->>'title', coalesce(q->>'paymentType', 'acompte'),
    (q->>'totalPrice')::integer, (q->>'totalPrice')::integer, 0, coalesce((q->>'depositPercent')::integer, 0), q->>'name', q->>'email',
    'brief_recu', (q->'request') || jsonb_build_object('Proposition acceptée', q->>'description'), now(),
    q->'deliverables', quote_token) returning id into order_id;
  update public.project_quotes set content = q || jsonb_build_object('status', 'accepte', 'updatedAt', stamp,
    'acceptedAt', stamp, 'orderId', order_id) where id = quote_id;
  return order_id;
end;
$$;
revoke all on function public.respond_project_quote(text, boolean, text) from public, anon, authenticated;
grant execute on function public.respond_project_quote(text, boolean, text) to service_role;


notify pgrst, 'reload schema';

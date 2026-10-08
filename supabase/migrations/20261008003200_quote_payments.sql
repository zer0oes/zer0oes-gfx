-- Only the server can read requests or record a decision. The row lock prevents
-- two simultaneous acceptances from creating two orders.
create or replace function public.respond_project_quote(quote_token text, accepting boolean)
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
    update public.project_quotes set content = q || jsonb_build_object('status', 'refuse', 'updatedAt', stamp) where id = quote_id;
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
revoke all on function public.respond_project_quote(text, boolean) from public, anon, authenticated;
grant execute on function public.respond_project_quote(text, boolean) to service_role;

create function public.record_quote_payment(target_id uuid, payment_key text, paid_amount integer, paid_fee integer)
returns boolean language plpgsql security invoker set search_path = public as $$
declare o public.orders;
begin
  select * into o from public.orders where id = target_id for update;
  if o.id is null or o.pack_id <> 'sur-mesure' then return false; end if;
  if o.payment_intent_id = payment_key then return true; end if;
  if o.amount_paid <> 0 or (paid_amount <> o.total_price and
    (o.payment_type <> 'acompte' or paid_amount <> round(o.total_price * o.deposit_percent / 100.0))) then return false; end if;
  update public.orders set amount_paid = paid_amount, payment_intent_id = payment_key, fees_paid = paid_fee,
    payment_type = case when paid_amount = total_price then 'total' else payment_type end,
    updated_at = now() where id = target_id;
  return true;
end;
$$;
revoke all on function public.record_quote_payment(uuid, text, integer, integer) from public, anon, authenticated;
grant execute on function public.record_quote_payment(uuid, text, integer, integer) to service_role;
notify pgrst, 'reload schema';

alter table public.orders drop constraint orders_status_check;
alter table public.orders add constraint orders_status_check check (status in ('payee','brief_attente','brief_recu','en_cours','livree','solde_paye','terminee','annulation_en_cours','annulee'));

create function public.guard_order_cancellation() returns trigger language plpgsql set search_path = public as $$
begin
  if new.status = 'annulee' and old.status not in ('annulation_en_cours','annulee') then
    raise exception 'Un remboursement doit être engagé avant l’annulation';
  end if;
  if old.status in ('annulation_en_cours','annulee') and new.status <> old.status
    and not (old.status = 'annulation_en_cours' and new.status = 'annulee') then
    raise exception 'Commande annulée ou en cours d’annulation';
  end if;
  if new.status = 'annulation_en_cours' and old.status <> new.status then
    if old.status not in ('payee','brief_attente','brief_recu') or old.delivered_at is not null
      or exists (select 1 from public.deliverables where order_id = old.id and published_at is not null) then
      raise exception 'La création a déjà commencé';
    end if;
  end if;
  return new;
end;
$$;
create trigger guard_order_cancellation before update on public.orders for each row execute function public.guard_order_cancellation();

create function public.guard_cancelled_deliverables() returns trigger language plpgsql set search_path = public as $$
declare order_status text;
begin
  select status into order_status from public.orders where id = new.order_id for update;
  if order_status in ('annulation_en_cours','annulee') then
    raise exception 'La création est suspendue pour cette commande';
  end if;
  return new;
end;
$$;
create trigger guard_cancelled_deliverables before insert or update on public.deliverables for each row execute function public.guard_cancelled_deliverables();

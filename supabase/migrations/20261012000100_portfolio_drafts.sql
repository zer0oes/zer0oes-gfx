-- Projets du portfolio en brouillon (masqués sur le site) et commande d'origine
alter table public.streamers add column if not exists draft boolean not null default false;
alter table public.streamers add column if not exists order_id uuid references public.orders (id) on delete set null;

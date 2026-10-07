-- Contenu et codes privés : lecture via serveur uniquement après contrôle admin.
create table if not exists public.marketing_banners (
  id uuid primary key, content jsonb not null
);
create table if not exists public.marketing_promotions (
  id uuid primary key, code text not null unique, content jsonb not null
);
alter table public.marketing_banners enable row level security;
alter table public.marketing_promotions enable row level security;
alter table public.orders add column if not exists promo_code text;
alter table public.orders add column if not exists promo_discount integer not null default 0;

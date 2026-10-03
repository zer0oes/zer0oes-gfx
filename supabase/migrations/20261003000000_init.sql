-- Schéma initial zer0oes gfx : catalogue, portfolio, commandes.
-- RLS activé partout. Lecture publique (anon) uniquement sur le catalogue et le portfolio ;
-- les commandes ne sont accessibles qu'avec la clé secrète, côté serveur (après contrôle admin).

-- Réglages (une seule ligne)
create table public.settings (
  id smallint primary key default 1 check (id = 1),
  deposit_percent integer not null default 30 check (deposit_percent between 0 and 100),
  logo_discount integer not null default 15000 check (logo_discount >= 0),
  delivery_days text not null default '7 à 14',
  updated_at timestamptz not null default now()
);

create table public.packs (
  id text primary key,
  position integer not null default 0,
  name text not null,
  tagline text not null default '',
  price integer not null check (price >= 0),
  price_from boolean not null default false,
  checkout boolean not null default true,
  deliverables text[] not null default '{}',
  extras text[] not null default '{}',
  note text,
  highlight boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.formulas (
  pack_id text not null references public.packs (id) on delete cascade,
  id text not null,
  position integer not null default 0,
  label text not null,
  price integer not null check (price >= 0),
  stripe_price_id text,
  primary key (pack_id, id)
);

create table public.options (
  id text primary key,
  position integer not null default 0,
  name text not null,
  price integer not null check (price >= 0),
  price_from boolean not null default false,
  unit text
);

create table public.streamers (
  id text primary key,
  position integer not null default 0,
  name text not null,
  description text not null default '',
  url text
);

create table public.works (
  id text primary key,
  streamer_id text not null references public.streamers (id) on delete cascade,
  category text not null check (category in ('overlays', 'widgets', 'alertes', 'emotes')),
  position integer not null default 0,
  title text not null,
  description text not null default '',
  image text,
  video text,
  colors text[] not null default '{"#7c3aed","#06b6d4"}',
  featured boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.emotes (
  work_id text not null references public.works (id) on delete cascade,
  position integer not null default 0,
  name text not null,
  grp text not null check (grp in ('follower', 'abonne', 'animee')),
  src text not null,
  animated boolean not null default false,
  primary key (work_id, name)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  stripe_session_id text not null unique,
  demo boolean not null default false,
  pack_id text not null,
  formula_id text not null,
  offer_name text not null,
  payment_type text not null check (payment_type in ('total', 'acompte')),
  has_logo boolean not null default false,
  list_price integer not null,
  total_price integer not null,
  amount_paid integer not null,
  deposit_percent integer not null,
  logo_discount integer not null default 0,
  customer_name text not null default '',
  customer_email text not null default '',
  status text not null default 'payee'
    check (status in ('payee', 'brief_recu', 'en_cours', 'livree', 'solde_paye', 'terminee')),
  balance_session_id text,
  balance_url text,
  balance_paid_at timestamptz,
  brief jsonb,
  brief_received_at timestamptz
);

create index orders_status_idx on public.orders (status, created_at desc);

create table public.order_notes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  created_at timestamptz not null default now(),
  body text not null
);

-- RLS
alter table public.settings enable row level security;
alter table public.packs enable row level security;
alter table public.formulas enable row level security;
alter table public.options enable row level security;
alter table public.streamers enable row level security;
alter table public.works enable row level security;
alter table public.emotes enable row level security;
alter table public.orders enable row level security;
alter table public.order_notes enable row level security;

-- Lecture publique du catalogue et du portfolio (aucune écriture sans la clé secrète)
create policy "lecture publique" on public.settings for select to anon, authenticated using (true);
create policy "lecture publique" on public.packs for select to anon, authenticated using (true);
create policy "lecture publique" on public.formulas for select to anon, authenticated using (true);
create policy "lecture publique" on public.options for select to anon, authenticated using (true);
create policy "lecture publique" on public.streamers for select to anon, authenticated using (true);
create policy "lecture publique" on public.works for select to anon, authenticated using (true);
create policy "lecture publique" on public.emotes for select to anon, authenticated using (true);
-- orders / order_notes : aucune politique => inaccessibles hors clé secrète.

-- Stockage des médias du portfolio (lecture publique, écriture côté serveur uniquement)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio',
  'portfolio',
  true,
  20971520,
  array['image/webp', 'image/png', 'image/jpeg', 'image/gif', 'video/mp4', 'video/webm']
)
on conflict (id) do nothing;

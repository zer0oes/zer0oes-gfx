-- Préparation de l'espace client (non encore exposé sur le site) :
-- livrables versionnés, séries de corrections, messages par commande,
-- et RLS permettant à un client connecté (lien magique, e-mail de commande)
-- de ne voir que ses propres commandes.

-- E-mail du client connecté (claim du JWT Supabase), en minuscules
create or replace function public.current_email() returns text
language sql stable
as $$ select lower(coalesce(auth.jwt() ->> 'email', '')) $$;

alter table public.orders
  add column customer_id uuid,
  add column revisions_included integer not null default 2 check (revisions_included >= 0),
  add column revisions_used integer not null default 0 check (revisions_used >= 0);

create index orders_customer_email_idx on public.orders (lower(customer_email));

-- Livrables : fichiers dans le bucket privé « livrables », par version
create table public.deliverables (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  version integer not null default 1 check (version >= 1),
  label text not null,
  storage_path text not null,
  created_at timestamptz not null default now()
);
create index deliverables_order_idx on public.deliverables (order_id, version desc);

-- Demandes de corrections (2 séries incluses par défaut, cf. orders.revisions_included)
create table public.revisions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  number integer not null check (number >= 1),
  request text not null,
  status text not null default 'demandee' check (status in ('demandee', 'en_cours', 'livree')),
  created_at timestamptz not null default now(),
  unique (order_id, number)
);

-- Messages échangés sur une commande (les notes internes restent dans order_notes)
create table public.order_messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  author text not null check (author in ('client', 'admin')),
  body text not null check (length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index order_messages_order_idx on public.order_messages (order_id, created_at);

alter table public.deliverables enable row level security;
alter table public.revisions enable row level security;
alter table public.order_messages enable row level security;

-- Un client connecté ne voit que ses commandes et ce qui s'y rattache.
create policy "client : ses commandes" on public.orders
  for select to authenticated using (lower(customer_email) = public.current_email());

create policy "client : ses livrables" on public.deliverables
  for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and lower(o.customer_email) = public.current_email()));

create policy "client : ses corrections" on public.revisions
  for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and lower(o.customer_email) = public.current_email()));

create policy "client : ses messages" on public.order_messages
  for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and lower(o.customer_email) = public.current_email()));

create policy "client : écrire sur ses commandes" on public.order_messages
  for insert to authenticated
  with check (
    author = 'client'
    and exists (select 1 from public.orders o where o.id = order_id and lower(o.customer_email) = public.current_email())
  );

-- Les demandes de corrections et le paiement du solde passeront par le serveur
-- (contrôle du compteur et des montants), pas par une écriture directe du client.

-- Bucket privé des livrables : téléchargement par URL signée générée côté serveur
insert into storage.buckets (id, name, public, file_size_limit)
values ('livrables', 'livrables', false, 524288000)
on conflict (id) do nothing;

-- Facturation automatique Abby : coordonnées de facturation sur la commande et
-- suivi des factures (une par paiement Stripe, clé d'idempotence = payment_intent).

alter table public.orders
  add column payment_intent_id text,
  add column balance_payment_intent_id text,
  add column billing_name text,
  add column billing_address jsonb,
  add column company_name text,
  add column company_siret text,
  add column company_vat text;

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  -- payment_intent Stripe (ou identifiant de démo) : une seule facture par paiement
  payment_key text not null unique,
  kind text not null check (kind in ('acompte', 'solde', 'complete')),
  amount integer not null check (amount >= 0),
  paid_at timestamptz not null,
  status text not null default 'en_attente' check (status in ('en_attente', 'emise', 'echec')),
  abby_customer_id text,
  abby_invoice_id text,
  number text,
  finalized boolean not null default false,
  paid_marked boolean not null default false,
  sent_to_customer boolean not null default false,
  demo boolean not null default false,
  error text,
  attempts integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index invoices_order_idx on public.invoices (order_id, created_at);
alter table public.invoices enable row level security;
-- Aucune politique publique : factures lues côté serveur (admin) uniquement.

-- Option : faire envoyer la facture au client (PDF Abby envoyé par e-mail)
alter table public.finance_settings add column abby_send_invoice boolean not null default false;

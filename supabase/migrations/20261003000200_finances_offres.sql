-- Revenu net (taux de cotisations et frais de paiement) et archivage des offres.

-- Réglages financiers : privés (aucune lecture publique), édités dans l'admin.
create table public.finance_settings (
  id smallint primary key default 1 check (id = 1),
  urssaf_rate numeric(5, 2) not null default 25.6 check (urssaf_rate between 0 and 100),
  cfp_rate numeric(5, 2) not null default 0.2 check (cfp_rate between 0 and 100),
  vl_enabled boolean not null default false,
  vl_rate numeric(5, 2) not null default 2.2 check (vl_rate between 0 and 100),
  stripe_percent numeric(5, 2) not null default 1.5 check (stripe_percent between 0 and 100),
  stripe_fixed integer not null default 25 check (stripe_fixed >= 0),
  updated_at timestamptz not null default now()
);
alter table public.finance_settings enable row level security;
-- Aucune politique : accessible uniquement avec la clé secrète (serveur, après contrôle admin).

-- Offre archivée : masquée du site et non commandable, conservée pour l'historique des commandes.
alter table public.packs add column archived boolean not null default false;

-- Frais Stripe réels encaissés sur la commande (acompte + solde), si connus.
alter table public.orders add column fees_paid integer check (fees_paid >= 0);

-- Tableau de bord : périodicité des déclarations URSSAF et remboursements Stripe.

-- Déclaration du chiffre d'affaires à l'URSSAF : mensuelle ou trimestrielle (choix fait à la création).
alter table public.finance_settings
  add column urssaf_periodicity text not null default 'trimestrielle'
  check (urssaf_periodicity in ('mensuelle', 'trimestrielle'));

-- Remboursements Stripe d'une commande (webhook charge.refunded) :
-- [{ "id": "re_…", "amount": 12000, "at": "2026-10-03T12:00:00Z" }], montants en centimes.
-- Déduits du chiffre d'affaires du mois du remboursement.
alter table public.orders
  add column refunds jsonb not null default '[]'::jsonb
  check (jsonb_typeof(refunds) = 'array');

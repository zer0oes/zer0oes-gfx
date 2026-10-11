-- Bibliothèque de création privée du backoffice, sans jetons de plateformes.
create table public.custom_lab_documents (
  id uuid primary key default gen_random_uuid(),
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.custom_lab_documents enable row level security;
revoke all on public.custom_lab_documents from anon, authenticated;
grant all on public.custom_lab_documents to service_role;

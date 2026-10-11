-- Projets du Laboratoire (un par client ou par chaîne) : regroupent les créations dans la bibliothèque.
-- Les créations désignent leur projet par son nom (champ « project » de leur contenu).
create table public.custom_lab_projects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 120),
  description text not null default '' check (char_length(description) <= 500),
  sort_order integer not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.custom_lab_projects enable row level security;
revoke all on public.custom_lab_projects from anon, authenticated;
grant all on public.custom_lab_projects to service_role;

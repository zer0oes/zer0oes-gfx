-- Médias du Laboratoire (images, sons, vidéos utilisés par les widgets et alertes).
-- Les fichiers sont dans le bucket S3 (dossier public portfolio/laboratoire/) ; cette table en garde la liste.
create table public.custom_lab_media (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 200),
  path text not null unique check (path like 'laboratoire/%'),
  url text not null check (url like 'https://%'),
  content_type text not null,
  size_bytes integer not null check (size_bytes > 0),
  created_at timestamptz not null default now()
);
alter table public.custom_lab_media enable row level security;
revoke all on public.custom_lab_media from anon, authenticated;
grant all on public.custom_lab_media to service_role;

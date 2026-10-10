-- Ordre des créations du Laboratoire dans leur projet (glisser-déposer de la bibliothèque)
alter table public.custom_lab_documents add column if not exists position integer not null default 0;
create index if not exists custom_lab_documents_position_idx on public.custom_lab_documents (position);

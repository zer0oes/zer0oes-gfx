alter table public.orders add column brief_revisions jsonb not null default '[]'::jsonb
  check (jsonb_typeof(brief_revisions) = 'array' and jsonb_array_length(brief_revisions) <= 2);

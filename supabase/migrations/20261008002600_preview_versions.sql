alter table public.deliverables add column preview_versions jsonb not null default '[]'::jsonb;
update public.deliverables set preview_versions = jsonb_build_array(jsonb_build_object('path', preview_path, 'publishedAt', published_at))
where preview_path is not null and published_at is not null;

alter table public.deliverables add column notified_preview text;
update public.deliverables set notified_preview = coalesce(preview_path, storage_path)
where published_at is not null;

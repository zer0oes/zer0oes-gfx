-- Publish existing uploaded previews without sending any notification.
update public.deliverables
set published_at = now(),
    preview_versions = coalesce(preview_versions, '[]'::jsonb) || jsonb_build_array(jsonb_build_object('path', preview_path, 'publishedAt', now()))
where preview_path is not null and published_at is null;
update public.orders o set delivered_at = coalesce(o.delivered_at, now()),
  status = case when o.status in ('payee', 'brief_recu', 'en_cours') then 'livree' else o.status end
where exists (select 1 from public.deliverables d where d.order_id = o.id and d.preview_path is not null and d.published_at is not null);

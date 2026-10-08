-- Older contact forms stored a short offer label (e.g. Logo) rather than the
-- full catalogue name. Bring these quote/order correction limits into line.
update public.project_quotes q
set content = content || jsonb_build_object('revisionsIncluded', 1)
where q.content->'request'->>'Type de demande' = 'Demande de devis'
and (
  lower(trim(q.content->'request'->>'Offre envisagée')) = 'logo'
  or exists (
    select 1 from public.options o
    where lower(trim(o.name)) = lower(trim(q.content->'request'->>'Offre envisagée'))
      or (length(trim(q.content->'request'->>'Offre envisagée')) >= 3
        and lower(trim(o.name)) like lower(trim(q.content->'request'->>'Offre envisagée')) || ' %')
  )
);
update public.orders o set revisions_included = 1, updated_at = now()
where exists (select 1 from public.project_quotes q
  where q.content->>'orderId' = o.id::text and q.content->>'revisionsIncluded' = '1');

-- Le contenu JSONB reçoit un champ éditable supplémentaire, sans écraser
-- les titres, les lignes secondaires ni les autres textes personnalisés.
update public.marketing_carousel_slides
set content = jsonb_set(content, '{fr,badge}', '"Audit gratuit"'::jsonb)
where id = 'audit' and not (content->'fr' ? 'badge');

update public.marketing_carousel_slides
set content = jsonb_set(content, '{en,badge}', '"Free audit"'::jsonb)
where id = 'audit' and not (content->'en' ? 'badge');

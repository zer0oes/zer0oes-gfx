-- Page de livraison : type d'élément (badge) et aperçu protégé affiché avant validation.
-- Les fichiers finaux et liens d'import ne sont servis qu'une fois l'élément validé
-- et le solde réglé (contrôle côté serveur, route /livraison/<jeton>/<id>).
alter table public.deliverables
  add column if not exists item_type text
    check (item_type in ('overlay', 'widget', 'alerte', 'visuel', 'video', 'fichier', 'guide')),
  add column if not exists preview_path text,
  add column if not exists preview_type text check (preview_type in ('image', 'video'));

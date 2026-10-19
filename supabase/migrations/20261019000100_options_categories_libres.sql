-- Catégories des créations à la carte gérées dans l'admin (Offres et réglages > Catégories) :
-- la colonne accepte désormais tout identifiant de catégorie, plus seulement les 4 d'origine.
alter table public.options drop constraint if exists options_category_check;

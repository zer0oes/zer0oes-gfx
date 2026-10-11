# StreamerLab dans zer0oes GFX

Première version native Next.js/React sur `feature/implementation-custom-lab`.
Le projet local d'origine n'est pas modifié. Les fonctions de simulation,
d'export et de conversion sont portées depuis
`custom-labs/streamer-lab/frontend/src/lib/` ; l'import Vite `?raw` est remplacé
par une source TypeScript embarquée. jQuery 3.7.1 conserve sa licence dans le
fichier distribué et n'est chargé que dans l'aperçu.

## Utilisation

- Ouvrir `/admin/streamerlab`, également accessible depuis le menu admin.
- Créer un widget ou un pack d'alertes, saisir son nom et son projet.
- Choisir StreamElements ou Streamlabs et modifier HTML/CSS/JS/Fields/Data.
- Pour une AlertBox, choisir chaque alerte et modifier les réglages JSON natifs.
- Tester les événements prédéfinis ou envoyer un événement JSON personnalisé.
- Enregistrer explicitement ; la page indique les modifications non enregistrées.
- Exporter le ZIP pour la plateforme active, ou un projet JSON contenant les deux
  variantes, réimportable dans la bibliothèque.

Pour préparer la bibliothèque existante sans modifier le laboratoire source :

```powershell
npx tsx scripts/export-streamerlab.mts "C:\Users\ausal\Documents\DEV\custom-labs\streamer-lab"
```

Les fichiers JSON sont écrits dans un nouveau dossier `.data/streamerlab-import/`.
Les champs identifiés comme secrets sont vidés ; `.env` et SQLite ne sont jamais
lus. Les médias ne sont pas copiés et aucun projet n'est automatiquement publié.

## Stockage et sécurité

La migration `20261009004100_custom_lab.sql` doit être appliquée avant utilisation
avec Supabase. Elle n'est pas appliquée automatiquement et aucune base distante
n'est modifiée par ce portage. La table est privée (RLS sans politique publique,
droits réservés à service_role). Pages et actions exigent `requireAdmin()`.

Sans Supabase, le mode local utilise `.data/custom-lab/library.json`, hors de
`public/`, avec écritures sérialisées et remplacement atomique. Ce mode est
interdit en production. La révision empêche deux onglets d'écraser leurs sauvegardes.

L'aperçu s'exécute en iframe `sandbox="allow-scripts"`, sans same-origin,
formulaires ou navigation du parent. Une CSP interdit les connexions réseau du
code. Les réponses SE_API sont simulées en mémoire ; elles n'ont pas accès aux
comptes réels. Les messages ne sont acceptés que depuis l'iframe attendue.

## Périmètre restant

L'éditeur visuel de calques d'overlays, l'upload des médias, les événements réels,
l'auto-sauvegarde et la publication sur un livrable ne sont pas encore portés.
Les valeurs des champs se configurent actuellement via Fields et Data en JSON.
Les exports contiennent les codes et instructions, pas les médias binaires.
Les références `/media/` du laboratoire local doivent être remplacées par des
URL de médias accessibles sur la plateforme cible. L'installation automatique
sur le compte client reste un chantier distinct, soumis aux contrats API.

# Offre de lancement LinkedIn

Configuration dans **Admin → Offres → Promotions et fidélité → Offre de lancement LinkedIn**.
Choisir une date et une heure de début (Europe/Paris), cocher l’activation et enregistrer.
La campagne est désactivée à l’installation. Aucun redéploiement n’est nécessaire pour modifier sa date.
Changer sa date ou la désactiver ne réinitialise jamais le quota.

## Carrousel et édition des diapos

Le panneau **Carrousel sous le menu**, sur la même page, enregistre en base les deux diapos, leurs textes FR et EN, les libellés et liens de boutons, les conditions et leur ordre. La poignée permet le glisser-déposer à la souris ou au toucher ; Monter / Descendre et les touches haut / bas offrent une alternative clavier. Chaque diapo peut être activée séparément.

La diapo promotion reste soumise à la date et au quota de la campagne. Une seule diapo visible supprime la rotation et les points. Les textes publics proviennent exclusivement de la table `marketing_carousel_slides` ; la migration fournit les valeurs initiales, sans texte de repli dans le composant.

Le titre est éditable en texte simple, chiffres compris : les pourcentages sont automatiquement mis en dégradé. Ces chiffres décrivent la campagne ; modifier les textes ne modifie pas les règles de calcul des tarifs.

Le compteur utilise `{count}` dans son texte éditable. Il compte les commandes non démo bénéficiant de l’offre, payées ou issues d’un devis accepté. Les réservations de paiement en attente ne sont pas présentées comme des commandes. La capacité disponible reste protégée par ces réservations, séparément. Le statut et le compteur sont relus toutes les 30 secondes quand l’onglet est visible.

Les diapos partagent une grille qui conserve la hauteur de la plus grande. Rotation toutes les 7 secondes, fondu doux, pause au survol, au focus ou lorsque l’onglet est masqué, commandes manuelles et balayage tactile. La rotation est désactivée avec `prefers-reduced-motion`. Les diapos masquées sont inertes ; les annonces `aria-live` sont désactivées pendant la rotation automatique.

La migration supplémentaire `20261016000200_announcement_carousel.sql` est requise sur la base de développement et la production, après `20261016000100_launch_offer.sql`. Elle crée les textes, leur enregistrement atomique et le compteur des commandes réelles. Les deux migrations ont été appliquées et vérifiées sur les bases configurées dans `.env.local` et `.env.production.local` le 16 octobre 2026. La campagne reste désactivée sur ces deux bases ; aucun code n’a été poussé.

Pour travailler hors Supabase avec le magasin JSON de développement : `npm run db:carousel:local` initialise les textes depuis le même seed SQL, sans remplacer un carrousel déjà édité. Cette initialisation a aussi été effectuée dans l’aperçu local.

## Comportement

- 50 % sur les packs et leurs formules, 25 % sur les créations à la carte.
- Prix barrés et remise automatique, sans code ni cumul avec une autre promotion.
- Le logo fourni est déduit avant les 50 % : le tarif avec logo fourni est lui aussi réduit de moitié.
- Un panier, quel que soit son nombre d’éléments, réserve une seule des 10 places communes.
- Les sessions Stripe expirent après 30 minutes. Une place reste réservée jusqu’à confirmation Stripe du paiement, de l’expiration ou de l’échec d’un paiement différé.
- Les devis issus d’un pack ou d’une demande de création reprennent le taux correspondant. Le montant saisi dans l’administration est le tarif avant remise. Le client voit le montant réduit tant que la campagne est disponible. L’acceptation du devis fige ce montant et consomme une place (commande ferme).
- Si le quota ou le montant change, le visiteur doit revoir le prix avant de commander.
- Les commandes de démonstration du catalogue ne consomment pas de place réelle.
- Le supplément d’installation ne constitue pas une création remisée.
- L’audit gratuit de l’identité visuelle reste accessible à tous, sans dépendre du quota ni de la date de la promotion : `/contact?sujet=audit`.

## Mise en service

1. Appliquer la migration `20261016000100_launch_offer.sql` avant de déployer le code.
2. Ajouter **checkout.session.expired** aux événements envoyés à `/api/stripe/webhook`, en conservant les événements existants (notamment `checkout.session.completed`, `checkout.session.async_payment_succeeded` et `checkout.session.async_payment_failed`).
3. Vérifier les remises et les événements avec Stripe en mode test, puis programmer la date dans l’administration.

Les réservations sont atomiques en PostgreSQL. Les fonctions de quota sont réservées au rôle serveur et les tables sont protégées par RLS.
Une réservation payée n’est pas réouverte lors d’une annulation : la limite porte sur les premières commandes, pas sur dix commandes en cours.

Si la création d’une session renvoie une erreur réseau incertaine, sa place est conservée par précaution. Le serveur journalise l’UUID de réservation (aucune donnée client). Retrouver la session Stripe via sa métadonnée `launchSlot` et vérifier son état avant de libérer cette place. Ne jamais libérer une session ouverte ou en attente de paiement.

## Vérification locale

`npm test`, `npm run db:check`, `npx tsc --noEmit`, `npm run build`.
Les tests PostgreSQL couvrent le plafond de dix, les doublons de notifications, la programmation, le quota partagé avec les devis et l’interdiction d’accès aux rôles publics.

La migration 20261016000300_carousel_audit_badge.sql initialise la pastille FR/EN de l’audit sans remplacer les textes existants. Appliquée sur les bases de développement et de production le 16 octobre 2026. Le champ Pastille et la ligne secondaire facultative sont modifiables dans l’éditeur du carrousel.

# Offre de lancement LinkedIn

Configuration dans **Admin → Offres et réglages → Promotions → Remises et codes → Offre de lancement**.
Choisir une date et une heure de début (Europe/Paris), cocher l’activation et enregistrer.
La campagne est désactivée à l’installation. Aucun redéploiement n’est nécessaire pour modifier sa date.
Changer sa date ou la désactiver ne réinitialise jamais le quota.

## Bandeaux sous le menu

Depuis le 16 octobre 2026, le carrousel n’a plus d’éditeur à part : l’offre de lancement et l’audit sont des bandeaux ordinaires, dans **Admin → Offres et réglages → Promotions → Bandeaux**. Chaque bandeau a une pastille, une phrase, une petite note, un lien (tout le bandeau est cliquable), ses pages, en français et en anglais (un champ anglais vide reprend le français).

- **Quand l’afficher** : à ses propres dates, pendant l’offre de lancement (dès sa date de début, tant qu’il reste des places), ou pendant une remise de l’onglet « Remises et codes ».
- **Dans le carrousel** : les bandeaux qui l’ont tournent ensemble, dans l’ordre du tableau (glisser-déposer) ; les autres s’affichent fixes, l’un sous l’autre.
- Le compteur « Places restantes » n’existe que pour un bandeau lié à l’offre de lancement : `{count}` est remplacé par les commandes réelles, en violet.

La migration `20261016000400_carousel_banners.sql` copie les deux diapos de l’ancien carrousel en bandeaux (sans rien écraser). À appliquer sur les deux bases avant de déployer le code. En local avec le magasin JSON : `npm run db:bandeaux:local`.

Rotation toutes les 7 secondes, fondu doux, pause au survol, au focus ou lorsque l’onglet est masqué, commandes manuelles et balayage tactile. La rotation est désactivée avec `prefers-reduced-motion`. Les diapos masquées sont inertes. Le statut de l’offre et le compteur sont relus toutes les 30 secondes quand l’onglet est visible.

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

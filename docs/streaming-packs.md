# Packs de widgets et alertes : StreamElements et Streamlabs

## Première tranche

Le modèle interne des packs et les contrôles serveur sont dans
`src/lib/streaming-packs/`. Ils ne sont pas encore raccordés au backoffice ou à la
page commande. Aucun appel externe, secret OAuth, table ou migration n'est
introduit. Les téléchargements, la clôture et Stripe restent inchangés.

Une version de pack référence une commande, un livrable, une configuration privée
et ses médias, ainsi que sa plateforme et sa catégorie (alertes ou widget).
Un même livrable peut recevoir deux versions distinctes, une par plateforme, avec
des médias communs si nécessaire. La plateforme demandée est vérifiée côté serveur
pour empêcher l'utilisation d'une configuration chez l'autre fournisseur.
Le format de cette configuration sera fixé lorsque le contrat API
sera confirmé. Les types ne constituent pas un validateur d'entrée JSON : le futur
formulaire devra parser les données inconnues avant de construire ces objets.

Le contrôle d'éligibilité réutilise publication, validation, paiement et expiration
existants. Par prudence, tout remboursement enregistré bloque une nouvelle
installation ; cette politique reste à valider avant activation. Les contrôles
portent sur des données relues côté serveur, jamais sur une commande fournie par
le navigateur. Les sources sont limitées au stockage privé de la commande.

Même un pack prêt et payé renvoie `integration_indisponible`. Aucun bouton de
production ni variable d'environnement ne permet actuellement de l'activer.

## Étapes suivantes

1. Confirmer l'enregistrement OAuth, la création d'overlay et la copie des médias
   auprès de StreamElements (ticket support 687546).
   Vérifier aussi l'installation de thèmes/widgets et le transfert des médias avec
   Streamlabs. OAuth ou lien d'import sont des capacités d'adaptateur à confirmer,
   pas des comportements déjà implémentés. Le périmètre couvre alertes et widgets.
2. Ajouter les versions immuables et tentatives à Supabase et au magasin local ;
   prévoir les contraintes d'unicité et les transitions atomiques.
3. Ajouter l'association et la préparation des packs au backoffice existant.
4. Préparer un simulateur réservé au développement, puis le parcours client.
5. Implémenter OAuth et un worker durable après validation des endpoints.
6. Revérifier les droits avant chaque effet externe, réconcilier les créations
   ambiguës et compter uniquement l'installation réussie comme récupération du
   pack. Ne pas marquer les autres fichiers comme téléchargés.

Les médias installés doivent appartenir au compte destinataire et fonctionner
après expiration de la livraison et révocation OAuth. Une URL signée de livraison
ou un média appartenant au créateur ne satisfait pas ce critère.

## Références officielles

- https://github.com/StreamElements/api-docs/blob/main/api.yaml
- https://github.com/StreamElements/api-docs/blob/main/docs/OAuth2.md
- https://docs.streamelements.com/developers
- https://dev.streamlabs.com/docs/scopes
- https://support.streamlabs.com/hc/en-us/articles/360005852694-Merging-Multiple-Widgets-Into-a-Single-Widget-Theme

La spécification consultée documente la lecture des overlays mais ne fournit pas
le contrat complet nécessaire à l'installation et au transfert des médias.
Streamlabs documente les thèmes de widgets partagés ; ses permissions d'alertes
ne prouvent pas l'existence d'une API d'installation de thème. La conservation
indépendante des médias reste à vérifier pour les deux plateformes.

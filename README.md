# zer0oes gfx

Site vitrine et boutique de zer0oes gfx : identités visuelles sur mesure pour streameurs
(overlays, alertes, widgets, emotes). Les offres se paient en ligne (en entier ou avec un acompte de 30 %),
le client remplit ensuite son brief, et tout se gère depuis un espace d'administration.

## Sommaire

1. [Technique](#technique)
2. [Démarrer en local](#démarrer-en-local)
3. [Variables d'environnement](#variables-denvironnement)
4. [Supabase (base de données, fichiers, connexion admin)](#supabase)
5. [Stripe (paiements)](#stripe)
6. [Resend (e-mails)](#resend)
7. [Abby (factures)](#abby)
8. [Mise en ligne sur Heroku](#mise-en-ligne-sur-heroku)
9. [Nom de domaine chez OVH](#nom-de-domaine-chez-ovh)
10. [Utiliser l'admin](#utiliser-ladmin)
11. [Commandes utiles](#commandes-utiles)
12. [Sécurité : à ne jamais faire](#sécurité--à-ne-jamais-faire)

## Technique

Les demandes des formulaires projet et message sont enregistrées dans **Admin → Devis**.
Ouvre une demande, saisis la prestation, les livrables, le montant HT et la validité,
puis publie la proposition et envoie son lien privé par e-mail depuis cette page.
Le client choisit un acompte ou le règlement intégral dans `/devis/<jeton>`, puis
accepte le devis et paie sur Stripe. Il complète ensuite le même brief que pour
les packs dans son espace commande. Les champs obligatoires se configurent dans
la commande côté admin. Les fichiers définitifs sont accessibles après validation
des livrables et paiement intégral ; les aperçus se publient sans envoi automatique d’e-mail.
Les migrations jusqu’à `20261008004000_legacy_a_la_carte_revisions.sql` doivent être appliquées à Supabase.
Les demandes reçues avant cette migration ne sont pas importées depuis les e-mails.

| Brique | Rôle |
| --- | --- |
| [Next.js 16](https://nextjs.org) (App Router, TypeScript) | Site et admin. Attention : version récente, la doc de référence est dans `node_modules/next/dist/docs/`. |
| Tailwind CSS 4 | Styles |
| [Stripe Checkout](https://stripe.com) | Paiement par carte et PayPal, acompte puis solde |
| [Supabase](https://supabase.com) | Base Postgres (offres, portfolio, commandes, factures), stockage des médias, connexion admin par lien magique |
| [Resend](https://resend.com) | E-mails : notifications, lien de paiement du solde, factures |
| [Abby](https://www.abby.fr) | Factures créées automatiquement à chaque paiement |
| Heroku | Hébergement (Vercel fonctionne aussi) |

Arborescence utile :

```
src/
  app/(site)/        pages publiques : accueil, offres, portfolio, contact, merci, CGV, mentions légales
  app/admin/         administration (commandes, offres, portfolio, factures)
  app/api/stripe/    webhook Stripe
  components/        composants (dont protection des médias)
  data/              contenu de départ : offres (packs.ts), portfolio, infos du site (site.ts)
  lib/               logique : tarifs, commandes, finances, factures Abby, filigrane…
  lib/store/         accès aux données (Supabase, magasin local de dev, ou données statiques)
  proxy.ts           HTTPS, adresse canonique, session admin
supabase/
  migrations/        schéma de la base (appliqué par npm run db:setup)
  seed.sql           contenu de départ, généré depuis src/data
scripts/             installation de la base, seed, filigranes
assets-src/          originaux du portfolio, sans filigrane (ne pas publier)
public/              fichiers servis tels quels (logo, médias filigranés)
```

## Démarrer en local

Prérequis : Node.js 22.

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:3000.

**Sans aucune clé, le site tourne en mode démo** : les paiements sont simulés et les contenus viennent de `src/data/`.
En développement, les modifications faites dans l'admin sont enregistrées dans `.data/dev-store.json`
(fichier local, ignoré par git, jamais utilisé en production).

Pour entrer dans l'admin en local sans Supabase, mettre `ADMIN_DEV_LOGIN=1` dans `.env.development.local` :
la page `/admin/connexion` affiche alors un bouton « Connexion de développement ».
Cette connexion est refusée d'office en production.

Dès que les clés Supabase sont dans `.env.local`, le site local lit la vraie base : elle doit avoir été
installée avant (voir [Supabase](#supabase)).

## Variables d'environnement

En local : dans `.env.local` (copier `.env.example`). Sur Heroku : dans **Settings > Config Vars**.
Le modèle complet et commenté est dans [`.env.example`](.env.example).

| Variable | Obligatoire | Rôle |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | oui en ligne | Adresse publique du site, sans `/` final (ex. `https://www.zer0oes-gfx.com`). Sert aux liens des e-mails et de Stripe, et à la redirection vers l'adresse canonique. |
| `STRIPE_SECRET_KEY` | pour payer | Clé secrète Stripe (`sk_test_…` puis `sk_live_…`). Sans elle : mode démo. |
| `STRIPE_WEBHOOK_SECRET` | pour payer | Secret du webhook (`whsec_…`). Sans lui, les commandes ne sont pas enregistrées. |
| `NEXT_PUBLIC_SUPABASE_URL` | oui en ligne | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | oui en ligne | Clé publique Supabase (`sb_publishable_…`) |
| `SUPABASE_SECRET_KEY` | oui en ligne | Clé secrète Supabase (`sb_secret_…`), utilisée seulement côté serveur |
| `SUPABASE_DB_URL` | non | Chaîne « Session pooler », seulement sur ton PC pour `npm run db:setup`. Inutile sur Heroku. |
| `ADMIN_EMAILS` | non | E-mails autorisés dans l'admin, séparés par des virgules (défaut : zer0oes.pro@gmail.com) |
| `RESEND_API_KEY` | pour les e-mails | Clé Resend. Sans elle, les e-mails sont seulement écrits dans les logs. |
| `NOTIFY_EMAIL` | non | Adresse qui reçoit les notifications (défaut dans `.env.example`) |
| `NOTIFY_FROM` | avec Resend | Expéditeur sur un domaine vérifié, ex. `zer0oes gfx <contact@zer0oes-gfx.com>` |
| `ABBY_API_KEY` | pour les factures | Clé API Abby. Sans elle : factures simulées. |
| `ABBY_VAT_CODE` | non | Code TVA des lignes (défaut `FR_00HT`, franchise en base de TVA) |
| `ABBY_IN_TEST_MODE` | non | `1` pour créer de vraies factures même avec une clé Stripe de test (à éviter) |
| `STATS_IN_DEV` | non | `1` pour enregistrer les statistiques de visite depuis localhost (à éviter) |

Les variables `NEXT_PUBLIC_…` sont **figées au moment du build** : après les avoir modifiées, il faut redéployer.

Réservé au développement, **à ne jamais définir en ligne** (refusé de toute façon en production) :
`ADMIN_DEV_LOGIN`, `ADMIN_SESSION_SECRET`, `LOCAL_STORE`.

## Supabase

### 1. Créer le projet

Sur [supabase.com](https://supabase.com) : nouveau projet, région Europe (ex. Paris `eu-west-3`).
Noter le mot de passe de la base.

Dans **Project Settings > API Keys**, copier dans `.env.local` :
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` et `SUPABASE_SECRET_KEY`.

### 2. Installer la base depuis ton PC (sans Docker)

1. Dans Supabase, bouton **Connect** > onglet **Session pooler** : copier la chaîne de connexion.
2. La coller dans `.env.local` sous la forme `SUPABASE_DB_URL=…` en remplaçant `[YOUR-PASSWORD]`
   par le mot de passe de la base.
3. Lancer une simulation (ne modifie rien) :

   ```bash
   npm run db:setup
   ```

4. Si la liste affichée est correcte, appliquer :

   ```bash
   npm run db:setup -- --yes
   ```

Le script applique les migrations de `supabase/migrations/` dans l'ordre, chacune en « tout ou rien »,
crée les espaces de stockage `portfolio` (public) et `livrables` (privé), puis charge le contenu de départ
(offres, options, portfolio). Il vérifie ensuite que toutes les tables sont protégées (RLS).

On peut le relancer sans risque : il n'applique que les nouvelles migrations, et le contenu de départ
n'est chargé qu'à la première installation, pour ne jamais écraser ce qui a été modifié dans l'admin
(`--seed` force le rechargement : à éviter une fois le site en service).

Si `src/data/` a été modifié avant la première installation, régénérer le contenu de départ d'abord :
`npm run db:seed:generate`.

Sans `SUPABASE_DB_URL`, on peut aussi coller les fichiers de `supabase/migrations/` dans l'ordre, puis
`supabase/seed.sql`, dans le **SQL Editor** de Supabase. Mais `db:setup` ne saura alors pas qu'ils ont été
appliqués, et refusera de toucher à la base.

### 3. Connexion à l'admin (lien magique)

Dans **Authentication > URL Configuration** :

- **Site URL** : `https://www.zer0oes-gfx.com` (ou l'adresse Heroku en attendant)
- **Redirect URLs** : ajouter `https://www.zer0oes-gfx.com/admin/auth/callback`,
  l'adresse Heroku `https://<app>.herokuapp.com/admin/auth/callback` et
  `http://localhost:3000/admin/auth/callback`

Seuls les e-mails listés dans `ADMIN_EMAILS` peuvent entrer dans l'admin.

Le lien ne fonctionne que dans le navigateur qui l'a demandé, et une seule fois.

**Limite d'envoi** : l'envoi d'e-mails intégré à Supabase est limité à quelques e-mails par heure
(message « Trop de liens demandés »). Pour la lever, une fois le domaine vérifié dans Resend :
Supabase > **Authentication > Emails > SMTP Settings** > activer le SMTP personnalisé avec
hôte `smtp.resend.com`, port `465`, utilisateur `resend`, mot de passe = ta clé API Resend,
expéditeur = une adresse de ton domaine. La limite se règle ensuite dans **Authentication > Rate Limits**.

## Médias sur Amazon S3

Les images et vidéos du portfolio (et la photo de la page À propos) sont servies depuis le bucket
S3 `zer0oes-gfx` (Paris, `eu-west-3`) dès que `NEXT_PUBLIC_MEDIA_URL` est défini. Les chemins
`/portfolio/…` enregistrés en base restent les mêmes : seule l'adresse de base change. Les envois
depuis l'admin vont directement dans le bucket (lien signé), avec le filigrane ajouté côté serveur.

1. **Utilisateur IAM** dédié (sans accès console), politique limitée au bucket :
   `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` sur `arn:aws:s3:::zer0oes-gfx/*` et
   `s3:ListBucket` sur `arn:aws:s3:::zer0oes-gfx`. Créer une clé d'accès.
2. **Lecture publique** limitée aux dossiers `portfolio/` et `a-propos/` (stratégie du bucket,
   `s3:GetObject`) ; le reste du bucket reste privé.
3. **CORS** : `PUT`, `GET`, `HEAD` depuis `https://www.zer0oes-gfx.com` et `http://localhost:3000`.
4. Variables (dans `.env.local` et les Config Vars Heroku) : `AWS_ACCESS_KEY_ID`,
   `AWS_SECRET_ACCESS_KEY`, `AWS_REGION=eu-west-3`, `S3_BUCKET=zer0oes-gfx`,
   `NEXT_PUBLIC_MEDIA_URL=https://zer0oes-gfx.s3.eu-west-3.amazonaws.com`.
5. Copier les médias existants : `npm run media:s3` (simulation), puis `npm run media:s3 -- --yes`.

`NEXT_PUBLIC_MEDIA_URL` est lue à la compilation : après l'avoir ajoutée sur Heroku, redéployer.

Les **fichiers livrés aux clients** (fichiers définitifs et aperçus de l'espace commande) vont aussi
dans le bucket, dans le dossier privé `livrables/` : jamais lisibles publiquement, servis par des liens
signés de 10 minutes après les contrôles de l'espace commande (validation + solde), pendant 6 mois
après la clôture du projet (statut « Terminée »). Retirer un élément le supprime du bucket.

**Expiration des accès** : six mois après la première clôture, les routes clients bloquent les téléchargements et les aperçus. Aucun fichier ni historique admin n’est supprimé automatiquement. `npm run purge:livrables` affiche uniquement un rapport, même avec l’ancien argument `--yes`. Les téléchargements suivants ne repoussent pas la date limite.

## Stripe

1. Commencer avec les clés de **test** (`sk_test_…`) ; passer en `sk_live_…` une fois le site validé.
2. **PayPal** : Stripe > Paramètres > Moyens de paiement > activer PayPal. Rien à changer dans le code :
   Checkout propose automatiquement les moyens activés.
3. **Webhook** (une fois le site en ligne) : Stripe > Développeurs > Webhooks > ajouter un endpoint
   - URL : `https://www.zer0oes-gfx.com/api/stripe/webhook`
   - Événements : `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
     `checkout.session.async_payment_failed`, `charge.refunded` (remboursements)
   - Copier le secret de signature (`whsec_…`) dans `STRIPE_WEBHOOK_SECRET`.

   Le mode test et le mode live ont chacun leur webhook et leur secret.

Une commande (ou un solde) n'est marquée payée que lorsque Stripe confirme le paiement : un paiement
PayPal ou différé peut arriver quelques minutes après.

## Resend

1. Créer un compte sur [resend.com](https://resend.com), puis **Domains > Add domain** avec ton domaine.
2. Ajouter dans la zone DNS OVH les enregistrements indiqués par Resend (SPF, DKIM…) et attendre la vérification.
3. Créer une clé API et renseigner `RESEND_API_KEY`, `NOTIFY_EMAIL` et `NOTIFY_FROM`.

## Abby

Abby > Paramètres > Intégrations > créer une clé API, puis la mettre dans `ABBY_API_KEY`.

À chaque paiement (acompte, solde ou paiement complet), une facture est créée, finalisée et marquée payée
dans Abby, puis envoyée au client par e-mail via Resend (l'API Abby n'envoie pas d'e-mail).
Les échecs apparaissent dans l'admin avec un bouton pour relancer.

**Garde-fou** : de vraies factures ne sont créées qu'avec une clé Stripe **live**. Avec une clé de test
ou en mode démo, elles sont simulées (numérotées `DEMO-…`). Une facture émise dans Abby ne peut pas être
supprimée : ne mettre `ABBY_IN_TEST_MODE=1` qu'en connaissance de cause.

## Mise en ligne sur Heroku

L'application est prête pour Heroku : Node 22 (`engines` dans `package.json`), `Procfile`
(`web: npm start`), port fourni par Heroku, redirection HTTPS et en-tête HSTS.

### 1. Créer l'application

Sur [dashboard.heroku.com](https://dashboard.heroku.com) : **New > Create new app** (région Europe).

Type de dyno conseillé : **Basic**. Le dyno **Eco** s'endort après 30 minutes sans visite : la première
visite et les webhooks Stripe subissent alors un démarrage lent.

### 2. Créer les Config Vars avant le premier déploiement

**Settings > Reveal Config Vars** : ajouter les variables du tableau ci-dessus, sauf `SUPABASE_DB_URL`
et celles réservées au développement. Les variables `NEXT_PUBLIC_…` étant figées au build, elles doivent
exister avant le premier déploiement (sinon : les ajouter puis redéployer).

### 3. Déploiement automatique depuis GitHub

1. **Deploy > Deployment method > GitHub** : connecter le compte et choisir le dépôt `zer0oes/zer0oes-gfx`.
2. **Automatic deploys** : choisir la branche `master` puis **Enable Automatic Deploys**.
3. Pour le premier déploiement : **Manual deploy > Deploy Branch**.

Chaque `git push` sur `master` redéploie ensuite le site (installation, `npm run build`, puis `npm start`).

### 4. Suivre

- **More > View logs** dans le tableau de bord, ou en ligne de commande : `heroku logs --tail -a <app>`
- Après le déploiement, tester `https://<app>.herokuapp.com`, déclarer le webhook Stripe,
  puis faire une commande de test.

*Alternative* : Vercel fonctionne aussi sans modification (importer le dépôt, mêmes variables).

## Nom de domaine chez OVH

L'adresse principale est `www.zer0oes-gfx.com` : Heroku ne peut pas recevoir directement le domaine nu.

1. Dans Heroku, **Settings > Domains > Add domain** : `www.zer0oes-gfx.com`
   (ou `heroku domains:add www.zer0oes-gfx.com -a <app>`). Heroku affiche une **cible DNS**
   (`…herokudns.com`).
2. Dans OVH, **Zone DNS** du domaine : créer un enregistrement `CNAME` pour le sous-domaine `www`
   pointant vers cette cible (avec un `.` final). Supprimer l'ancien enregistrement `www` s'il existe.
3. **Domaine nu** (`zer0oes-gfx.com`) : dans OVH, **Redirection** > rediriger `zer0oes-gfx.com` vers
   `https://www.zer0oes-gfx.com` (redirection visible permanente). Attention : selon l'offre OVH, cette
   redirection peut ne fonctionner qu'en `http://`.
4. **Certificat HTTPS** : Heroku le crée automatiquement (ACM) une fois le DNS propagé
   (Settings > SSL Certificates ; sinon `heroku certs:auto:enable -a <app>`).
5. Mettre à jour `NEXT_PUBLIC_SITE_URL=https://www.zer0oes-gfx.com` dans les Config Vars (puis redéployer),
   les **Redirect URLs** de Supabase, et l'URL du webhook Stripe.

Le site redirige alors automatiquement vers `https://www.zer0oes-gfx.com`.

## Utiliser l'admin

Adresse : `/admin`. Saisir ton e-mail, puis cliquer sur le lien reçu.

- **Tableau de bord** (page d'accueil de l'admin) : par mois, trimestre, année ou période choisie,
  chiffre d'affaires encaissé (remboursements déduits), cotisations URSSAF estimées, frais Stripe, net,
  nouvelles commandes et soldes restant à encaisser ; prochaine échéance URSSAF (rythme mensuel ou
  trimestriel réglable dans Offres et réglages) ; graphiques avec tableaux de données ; export CSV.
  En local uniquement, tant qu'il n'y a aucune vente réelle, des chiffres d'exemple sont affichés avec
  un bandeau ; en production, jamais de chiffres fictifs.
- **Statistiques** : visiteurs, pages vues, provenance (Twitch, Instagram, Google…), appareils,
  clics sur les liens et boutons, formulaires envoyés et commandes payées, par période. Mesure maison
  sans cookie ni adresse IP (empreinte anonyme qui change chaque jour), table `stats_events`,
  conservée 13 mois. Les visites de l'admin connecté, les robots et localhost ne sont pas comptés
  (sauf `STATS_IN_DEV=1` en local, à éviter : la base locale est celle du site en ligne).
- **Commandes** : paiements reçus, brief du client, revenu net estimé (frais Stripe, URSSAF),
  envoi du lien de paiement du solde, notes, factures Abby (téléchargement, relance en cas d'échec).
  Section **Livraison** : liens d'import (overlays StreamElements partagés, en https) et fichiers
  (zip Streamlabs, visuels, guide ; 500 Mo max, stockés dans le bucket privé `livrables`), puis
  « Envoyer la livraison au client » : le client reçoit par e-mail le lien d'une page privée
  `/livraison/<jeton>` (non indexée) où il importe ses overlays et télécharge ses fichiers
  (liens de téléchargement valables 10 minutes, régénérés à chaque clic).
  Après validation de tous les livrables dans son espace commande, le client peut laisser
  un témoignage facultatif et choisir, via une case décochée par défaut, d’autoriser sa
  diffusion sur le site (accueil et portfolio). L’avis, le choix de diffusion et sa date
  sont conservés dans la commande et visibles dans l’admin ; une notification est envoyée.
  La publication reste manuelle : après relecture, reporter uniquement les avis autorisés
  dans le témoignage du projet concerné dans Portfolio. Le client peut modifier son avis
  et son choix ; répercuter toute modification ou tout retrait d’accord sur les avis publiés.
  Appliquer la migration `20261008001900_client_testimonials.sql` avant déploiement.
  Le client peut ensuite modifier son brief depuis son espace commande, au maximum deux
  fois après le premier envoi. Chaque modification conserve les valeurs avant/après,
  affiche une alerte dans l’admin et envoie une notification par e-mail.
  Le compteur nécessite la migration `20261008002000_brief_revisions.sql`.
  La livraison prépare les emplacements à partir du pack et des scènes du brief ; le
  contenu inclus est figé dans la commande au paiement. Chaque emplacement accepte un
  aperçu image protégé, plusieurs formats finaux et des liens d’import. La migration
  `20261008002100_planned_delivery.sql` rend ces emplacements possibles et retire l’accès
  direct aux livrables via l’API client. Les vidéos d’aperçu sont bloquées tant qu’un
  transcodage basse définition n’est pas garanti ; utiliser une image de présentation.
  Le logo du brief est affiché si son lien pointe directement vers une image ; les liens
  de partage Drive/WeTransfer restent accessibles via « Voir le logo ».
- **Offres** : prix, formules, options, acompte, remise logo, ordre d'affichage, archivage.
  On y trouve aussi les réglages financiers (taux URSSAF, versement libératoire…) et la protection
  du portfolio (flou, niveau de filigrane).
- **Portfolio** : projets par streameur, ajout de médias (le filigrane est incrusté automatiquement
  sur les images).

Les montants nets affichés sont des estimations, à vérifier avec ta déclaration URSSAF.

## Commandes utiles

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement avec Webpack (http://localhost:3000) |
| `npm run dev:turbo` | Serveur de développement avec Turbopack (pour retester son rechargement à chaud) |
| `npm run build` puis `npm start` | Version de production en local |
| `npm run lint` | Vérification du code |
| `npm test` | Tests |
| `npm run db:check` | Vérifie migrations, seed et RLS sur une base en mémoire (sans connexion) |
| `npm run db:setup` | Installe ou met à jour la base Supabase (simulation ; `-- --yes` pour appliquer) |
| `npm run db:seed:generate` | Régénère `supabase/seed.sql` depuis `src/data/` |
| `npm run db:portfolio` | Ajoute dans Supabase les réalisations de `src/data/portfolio.ts` qui n'y sont pas encore, sans rien modifier (simulation ; `-- --yes` pour appliquer). À lancer après le déploiement des médias. |
| `npm run watermark:images -- discret` | Incruste le filigrane dans les images et emotes fournies avec le site (`discret`, `visible`, `mosaique` ou `off`) |
| `npm run watermark:videos -- discret` | Même chose pour les vidéos (nécessite ffmpeg sur le PC) |

Les originaux sans filigrane sont dans `assets-src/portfolio/` ; les scripts écrivent dans `public/portfolio/`.

## Sécurité : à ne jamais faire

- Committer `.env.local` ou mettre une vraie clé dans `.env.example` (ce fichier est publié avec le code).
- Définir `ADMIN_DEV_LOGIN` en ligne (c'est de toute façon refusé en production).
- Partager `SUPABASE_SECRET_KEY`, `SUPABASE_DB_URL`, `STRIPE_SECRET_KEY` ou `ABBY_API_KEY` :
  si une clé a fuité, la régénérer dans le service concerné puis la remplacer (Heroku et `.env.local`).

# zer0oes gfx

Site vitrine et boutique : overlays, alertes et widgets sur mesure pour streameurs.

Next.js 16 (App Router, TypeScript) · Tailwind CSS 4 · Stripe Checkout · déploiement Vercel.

## Démarrer en local

```bash
npm install
cp .env.example .env.local   # facultatif : sans clés, le site tourne en mode démo
npm run dev
```

Puis ouvrir http://localhost:3000.

## Modifier les contenus

Tout le contenu provisoire est regroupé dans `src/data/` :

| Fichier | Contenu |
| --- | --- |
| `src/data/packs.ts` | Les 3 packs : nom, prix (en centimes), description, contenu |
| `src/data/portfolio.ts` | Les réalisations du portfolio (catégorie, texte, image) |
| `src/data/site.ts` | E-mail, réseaux, délai de livraison, infos légales (SIRET, adresse…) |

Pour les visuels du portfolio : déposer les fichiers dans `public/portfolio/` puis renseigner
`image: "/portfolio/nom-du-fichier.webp"` sur la réalisation. Sans image, une vignette colorée s'affiche.

Les pages `src/app/cgv/page.tsx` et `src/app/mentions-legales/page.tsx` sont des modèles à relire avant la mise en ligne.

## Pages

- `/` Accueil · `/portfolio` · `/offres` · `/contact`
- `/merci` page après paiement, avec le formulaire de brief
- `/mentions-legales` · `/cgv`

## Paiement (Stripe)

1. Renseigner `STRIPE_SECRET_KEY` (clé de test `sk_test_…` pour commencer).
2. Le bouton « Commander » crée une session Stripe Checkout avec le prix défini dans `packs.ts`
   (ou un `stripePriceId` si vous préférez gérer les prix dans le Dashboard Stripe).
3. Après paiement, Stripe renvoie vers `/merci?session_id=…` où le client remplit son brief.
4. Optionnel : déclarer le webhook `https://<domaine>/api/stripe/webhook` (événement
   `checkout.session.completed`) et renseigner `STRIPE_WEBHOOK_SECRET` pour être notifiée de chaque commande.

Sans `STRIPE_SECRET_KEY`, « Commander » mène directement à `/merci` en mode démo.

## Réception des formulaires

Contact, brief et notifications de commande sont envoyés par e-mail via [Resend](https://resend.com) si
`RESEND_API_KEY` et `NOTIFY_EMAIL` sont définies. Sinon ils s'affichent dans les logs du serveur.

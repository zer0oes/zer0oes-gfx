// Contenu par défaut des offres et options (texte et tarifs fournis par Aurore).
// Utilisé tel quel sans base de données, et pour remplir la base Supabase (npm run db:seed).
// Une fois Supabase branché, ces données se modifient depuis l'admin (/admin/offres).
// Les prix sont en centimes d'euro HT (49000 = 490 € HT).
//
// `checkout: true`  → sélecteur de formule + bouton « Commander » vers Stripe Checkout.
//                     Le prix payé est toujours relu côté serveur, jamais envoyé par le navigateur.
// `checkout: false` → bouton « Demander un devis » vers la page contact (prix « à partir de »).

import type { Option, Pack, PricingSettings } from "@/lib/pricing";
import { site } from "./site";

export const packs: Pack[] = [
  {
    id: "premier-look",
    name: "Premier look",
    tagline: "L'essentiel pour lancer ta chaîne avec une identité cohérente.",
    price: 49000,
    checkout: true,
    deliverables: ["Logo", "2 overlays fixes au choix", "Bannière et avatar", "2 séries de corrections regroupées"],
    extras: ["Option : 5 emotes personnalisées pour 150 € HT"],
    formulas: [
      { id: "base", label: "Premier look", price: 49000 },
      { id: "emotes", label: "Pack avec emotes", price: 64000 },
    ],
  },
  {
    id: "identite-signature",
    name: "Identité signature",
    tagline: "Une identité complète pour affirmer ton style sur tes streams.",
    price: 99000,
    checkout: true,
    highlight: true,
    deliverables: [
      "Logo et ses déclinaisons",
      "5 overlays fixes au choix",
      "Bannière et avatar",
      "2 séries de corrections regroupées",
    ],
    extras: ["10 emotes personnalisées : 280 € HT", "Animation légère des 5 overlays : 450 € HT"],
    formulas: [
      { id: "base", label: "Identité signature", price: 99000 },
      { id: "emotes", label: "Pack avec emotes", price: 127000 },
      { id: "emotes-animations", label: "Pack avec emotes et animations", price: 172000 },
    ],
  },
  {
    id: "univers-complet",
    name: "Univers complet",
    tagline: "Un univers visuel complet et animé pour ta chaîne.",
    price: 199000,
    priceFrom: true,
    checkout: false,
    deliverables: [
      "Logo et ses déclinaisons",
      "5 overlays animés",
      "Bannière et avatar",
      "15 emotes personnalisées",
      "2 séries de corrections regroupées",
    ],
    note: "Le tarif de base comprend des animations légères : apparition des éléments, transitions simples et boucles d'ambiance. Les animations complexes sont chiffrées sur devis.",
  },
];

// Options à la carte : non vendues via Stripe, elles se cochent dans le brief ou la demande de devis.

export const options: Option[] = [
  { id: "overlay-fixe", name: "Overlay fixe supplémentaire", price: 9000 },
  { id: "animation-overlay", name: "Animation légère d'un overlay existant", price: 10000, priceFrom: true },
  { id: "emote-statique", name: "Emote statique supplémentaire", price: 3500 },
  { id: "emotes-5", name: "Pack de 5 emotes statiques", price: 15000 },
  { id: "emotes-10", name: "Pack de 10 emotes statiques", price: 28000 },
  { id: "emotes-15", name: "Pack de 15 emotes statiques", price: 39000 },
  { id: "emote-animee", name: "Emote animée", price: 7000, priceFrom: true, unit: "unité" },
  { id: "banniere", name: "Bannière pour une plateforme supplémentaire", price: 6000 },
  { id: "panneaux-twitch", name: "Pack de 6 panneaux Twitch", price: 9000 },
  { id: "animation-logo", name: "Animation du logo", price: 18000, priceFrom: true },
];

export const defaultSettings: PricingSettings = {
  depositPercent: site.depositPercent,
  logoDiscount: site.logoDiscount,
  deliveryDays: site.deliveryDays,
};

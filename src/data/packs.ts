// Contenu par défaut des offres et options (texte et tarifs fournis par Aurore).
// Utilisé tel quel sans base de données, et pour remplir la base Supabase (npm run db:seed).
// Une fois Supabase branché, ces données se modifient depuis l'admin (/admin/offres).
// Les prix sont en centimes d'euro HT (39000 = 390 € HT).
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
    price: 39000,
    checkout: true,
    deliverables: ["Logo", "2 overlays au choix", "Bannière et avatar", "2 corrections incluses par élément du pack"],
    extras: ["Option : 5 emotes personnalisées pour 60 €"],
    formulas: [
      { id: "base", label: "Premier look", price: 39000 },
      { id: "emotes", label: "Pack avec emotes", price: 45000 },
    ],
  },
  {
    id: "identite-signature",
    name: "Identité signature",
    tagline: "Une identité complète pour affirmer ton style sur tes streams.",
    price: 76500,
    checkout: true,
    highlight: true,
    deliverables: [
      "Logo et ses déclinaisons",
      "5 overlays au choix",
      "5 alertes statiques (follow, sub, raid, cheer, tips)",
      "Bannière et avatar",
      "2 corrections incluses par élément du pack",
    ],
    extras: ["10 emotes personnalisées : +100 €", "Animation légère des 5 overlays, en plus des emotes : +200 €"],
    formulas: [
      { id: "base", label: "Identité signature", price: 76500 },
      { id: "emotes", label: "Pack avec emotes", price: 86500 },
      { id: "emotes-animations", label: "Pack avec emotes et animations", price: 106500 },
    ],
  },
  {
    id: "univers-complet",
    name: "Univers complet",
    tagline: "Un univers visuel complet et animé pour ta chaîne.",
    price: 106000,
    priceFrom: true,
    checkout: false,
    deliverables: [
      "Logo et ses déclinaisons",
      "5 overlays animés",
      "Bannière et avatar",
      "15 emotes statiques personnalisées",
      "3 corrections incluses par élément du pack",
    ],
    note: "Le tarif de base comprend des animations légères : apparition des éléments, transitions simples et boucles d'ambiance. Les animations complexes sont chiffrées sur devis.",
  },
];

// Options à la carte : paiement en une fois à prix fixe ; devis pour les prix « à partir de ».

export const options: Option[] = [
  { id: "overlay-fixe-unite", name: "Overlay fixe (unité)", price: 7500 },
  { id: "overlay-anime-unite", name: "Overlay animé (unité)", price: 12000 },
  { id: "alertes-fixes", name: "Pack d’alertes fixes", price: 8000 },
  { id: "alertes-animees", name: "Pack d’alertes animées", price: 14000 },
  { id: "widget-personnalise", name: "Widget personnalisé (barre d’objectifs, tchat, sponsor, partenariats)", price: 10000, priceFrom: true },
  { id: "widget-avance", name: "Widget interactif avancé (sur devis)", price: 20000, priceFrom: true },
  { id: "animation-overlay", name: "Animation légère d'un overlay existant", price: 4000, priceFrom: true },
  { id: "emote-statique", name: "Emote statique (unité)", price: 1500 },
  { id: "emotes-3", name: "Pack de 3 emotes statiques", price: 4000 },
  { id: "emotes-5", name: "Pack de 5 emotes statiques", price: 6500 },
  { id: "emotes-10", name: "Pack de 10 emotes statiques", price: 12000 },
  { id: "emote-animee", name: "Emote animée (unité)", price: 3000 },
  { id: "emotes-animees-3", name: "Pack de 3 emotes animées", price: 8000 },
  { id: "emotes-animees-5", name: "Pack de 5 emotes animées", price: 13000 },
  { id: "emotes-animees-10", name: "Pack de 10 emotes animées", price: 24000, category: "emotes" },
  { id: "logo", name: "Logo", price: 17000, priceFrom: true },
  { id: "logo-declinaisons", name: "Logo avec déclinaisons", price: 28000, priceFrom: true, category: "branding" },
  { id: "banniere", name: "Bannière pour YouTube / Twitch", price: 8500 },
  { id: "avatar", name: "Avatar", price: 3000 },
  { id: "panneaux-twitch", name: "Pack de 6 panneaux Twitch", price: 9000 },
  { id: "animation-logo", name: "Animation du logo", price: 18000, priceFrom: true },
];

export const defaultSettings: PricingSettings = {
  depositPercent: site.depositPercent,
  logoDiscount: site.logoDiscount,
  deliveryDays: site.deliveryDays,
};

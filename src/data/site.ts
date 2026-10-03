// Informations générales du site.

export const site = {
  name: "zer0oes gfx",
  tagline: "Identité visuelle et overlays de stream sur mesure",
  description:
    "Logo, overlays, bannière, avatar et emotes sur mesure pour Twitch, YouTube et Kick. Une identité visuelle de stream qui te ressemble.",
  email: "zer0oes.pro@gmail.com",
  socials: [
    { label: "Twitch", href: "https://www.twitch.tv/zer0oes" },
    { label: "YouTube", href: "https://www.youtube.com/@zer0oes" },
    { label: "TikTok", href: "https://www.tiktok.com/@zer0oes" },
    { label: "Instagram", href: "https://www.instagram.com/zer0oes" },
  ],
  // Délai de livraison moyen affiché sur le site (en jours ouvrés)
  deliveryDays: "7 à 14",
  // Acompte proposé à la commande (en %). Le solde est dû à la livraison,
  // avant remise des fichiers définitifs (facture ou lien de paiement Stripe envoyé à la main).
  depositPercent: 30,
  // Remise « logo déjà existant » sur Premier look et Identité signature, en centimes HT (15000 = 150 €).
  logoDiscount: 15000,
};

// Informations légales — obligatoires pour les mentions légales et les CGV.
export const legal = {
  // Source : attestation RNE (vérifiée en octobre 2026).
  ownerName: "Aurore Salavert",
  status: "Entrepreneur individuel (EI), micro-entreprise",
  commercialName: "A'S Graphic Design", // nom commercial enregistré au RNE
  siren: "523 881 225",
  siret: "523 881 225 00040",
  registration: "Activité libérale non réglementée, immatriculée au Registre national des entreprises (RNE) depuis le 03/04/2025",
  ape: "7410Z — Activités spécialisées de design",
  vatNumber: "FR23523881225",
  address: "71 impasse de Choisy, 94140 Alfortville, France",
  // Mention TVA affichée sous les prix (page Offres) et dans les CGV.
  // À CONFIRMER selon votre régime. Si vous facturez la TVA, remplacez par
  // exemple par "TVA 20 % en sus" et pensez à l'activer dans Stripe (Stripe Tax).
  vatNote: "TVA non applicable, art. 293 B du CGI",
  publicationDirector: "Aurore Salavert",
  host: {
    name: "Heroku, service de Salesforce, Inc.",
    address: "Salesforce Tower, 415 Mission Street, 3rd Floor, San Francisco, CA 94105, États-Unis",
    phone: "+1 415 901 7000",
    website: "https://www.heroku.com",
  },
  lastUpdate: "3 octobre 2026",
};

// Informations générales du site — à compléter par Aurore.
// Tout ce qui est marqué « À COMPLÉTER » est provisoire.

export const site = {
  name: "zer0oes gfx",
  tagline: "Overlays, alertes et widgets sur mesure pour streameurs",
  description:
    "Création d'overlays, d'alertes et de widgets personnalisés pour Twitch, YouTube et Kick. Une identité visuelle de stream qui vous ressemble.",
  email: "contact@exemple.fr", // À COMPLÉTER
  socials: [
    // À COMPLÉTER : remplacer les liens par les vrais profils
    { label: "Twitch", href: "https://www.twitch.tv/" },
    { label: "X / Twitter", href: "https://x.com/" },
    { label: "Instagram", href: "https://www.instagram.com/" },
  ],
  // Délai de livraison moyen affiché sur le site (en jours ouvrés)
  deliveryDays: "7 à 14",
};

// Informations légales — obligatoires pour les mentions légales et les CGV.
export const legal = {
  ownerName: "Aurore [NOM À COMPLÉTER]",
  status: "Entrepreneur individuel (micro-entreprise)", // À COMPLÉTER
  siret: "000 000 000 00000", // À COMPLÉTER
  address: "Adresse à compléter, 00000 Ville, France", // À COMPLÉTER
  // Mention TVA affichée sous les prix (page Offres) et dans les CGV.
  // À CONFIRMER selon votre régime. Si vous facturez la TVA, remplacez par
  // exemple par "TVA 20 % en sus" et pensez à l'activer dans Stripe (Stripe Tax).
  vatNote: "TVA non applicable, art. 293 B du CGI",
  publicationDirector: "Aurore [NOM À COMPLÉTER]",
  host: {
    name: "Vercel Inc.",
    address: "440 N Barranca Ave #4133, Covina, CA 91723, États-Unis",
    website: "https://vercel.com",
  },
  mediator: "[Nom et coordonnées du médiateur de la consommation — À COMPLÉTER]",
  lastUpdate: "3 octobre 2026",
};

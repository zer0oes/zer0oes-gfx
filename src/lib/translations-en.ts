// Version anglaise des contenus venant de la base ou de src/data (offres, options, portfolio,
// études de cas) : table « texte français exact → texte anglais ». Un texte modifié dans l'admin
// et absent de cette table reste affiché en français sur /en, jamais avec un ancien libellé.
import type { Locale } from "@/lib/i18n";

const en: Record<string, string> = {
  "Identité électrique sur fond minéral : écran de lancement, tchat et alertes.":
    "An electric identity over a mineral backdrop: starting screen, chat and alerts.",
  "Ma propre chaîne : univers néon violet, du cadre de stream aux emotes.":
    "My own channel: a purple neon universe, from the stream frame to the emotes.",
  // --- Offres --------------------------------------------------------------------------
  // Noms des formules (traduits à la demande d'Aurore)
  "Premier look": "First Look",
  "Identité signature": "Signature Identity",
  "Univers complet": "Full Universe",
  "L'essentiel pour lancer ta chaîne avec une identité cohérente.": "The essentials to launch your channel with a consistent identity.",
  "Une identité complète pour affirmer ton style sur tes streams.": "A complete identity to assert your style on stream.",
  "Un univers visuel complet et animé pour ta chaîne.": "A complete, animated visual universe for your channel.",
  "Pour les chaînes qui veulent un univers vivant, reconnaissable dès la première seconde de live.":
    "For channels that want a living universe, recognisable from the very first second of the stream.",
  Logo: "Logo",
  "2 overlays fixes au choix": "2 static overlays of your choice",
  "5 overlays fixes au choix": "5 static overlays of your choice",
  "5 overlays animés": "5 animated overlays",
  "Bannière et avatar": "Banner and avatar",
  "2 séries de corrections regroupées": "2 grouped rounds of revisions",
  "Logo et ses déclinaisons": "Logo and its variations",
  "15 emotes personnalisées": "15 custom emotes",
  "Option : 5 emotes personnalisées pour 60 €": "Add-on: 5 custom emotes for €60",
  "10 emotes personnalisées : +100 €": "10 custom emotes: +€100",
  "Animation légère des 5 overlays, en plus des emotes : +200 €": "Light animation of the 5 overlays, on top of the emotes: +€200",
  "Scènes animées : démarrage, pause, discussion, fin de live": "Animated scenes: starting, break, just chatting, ending",
  "Alertes animées (follow, abonnement, raid, dons)": "Animated alerts (follow, sub, raid, donations)",
  "Widgets assortis : objectif, tchat, lecteur de musique": "Matching widgets: goal, chat, music player",
  "Transition (stinger) aux couleurs de ta chaîne": "Transition (stinger) in your channel's colours",
  "Le tarif de base comprend des animations légères : apparition des éléments, transitions simples et boucles d'ambiance. Les animations complexes sont chiffrées sur devis.":
    "The base price includes light animations: elements appearing, simple transitions and ambient loops. Complex animations are quoted separately.",
  "Pack avec emotes": "Package with emotes",
  "Pack avec emotes et animations": "Package with emotes and animations",

  // --- Options ----------------------------------------------------------------------------
  "Overlay fixe (unité)": "Static overlay (each)",
  "Overlay animé (unité)": "Animated overlay (each)",
  "Pack d’alertes fixes": "Static alerts pack",
  "Pack d’alertes animées": "Animated alerts pack",
  "Widget personnalisé (barre d’objectifs, tchat, sponsor, partenariats)": "Custom widget (goal bar, chat, sponsor, partnerships)",
  "Widget interactif avancé (sur devis)": "Advanced interactive widget (quote)",
  "Animation légère d'un overlay existant": "Light animation of an existing overlay",
  "Emote statique (unité)": "Static emote (each)",
  "Pack de 3 emotes statiques": "Pack of 3 static emotes",
  "Pack de 5 emotes statiques": "Pack of 5 static emotes",
  "Pack de 10 emotes statiques": "Pack of 10 static emotes",
  "Emote animée (unité)": "Animated emote (each)",
  "Pack de 3 emotes animées": "Pack of 3 animated emotes",
  "Pack de 5 emotes animées": "Pack of 5 animated emotes",
  "Bannière pour YouTube / Twitch": "Banner for YouTube / Twitch",
  Avatar: "Avatar",
  "Pack de 6 panneaux Twitch": "Pack of 6 Twitch panels",
  "Animation du logo": "Logo animation",

  // --- Portfolio : projets et réalisations ---------------------------------------------
  "Un univers électro vibrant, entre matière minérale et énergie lumineuse.": "A vibrant electro universe, between mineral texture and luminous energy.",
  "Un univers synthwave néon pensé du stream jusqu’aux emotes.": "A neon synthwave universe, designed from the stream down to the emotes.",
  "Écran « Stream Starting »": "“Stream Starting” screen",
  "Écran d'attente avant le live : portrait animé, cadre et logo néon, chat, alertes, musique et objectif.":
    "Waiting screen before the live: animated portrait, neon frame and logo, chat, alerts, music and goal.",
  "Logo zer0oes": "zer0oes logo",
  "Logo manuscrit tracé d'un seul trait, décliné en blanc et en violet pour le stream et les réseaux.":
    "Handwritten logo drawn in a single line, in white and purple for the stream and social media.",
  "Chat néon": "Neon chat",
  "Chat personnalisé aux couleurs de la chaîne, avec badges et réactions.": "Custom chat in the channel's colours, with badges and reactions.",
  "Écran « Stream Paused »": "“Stream Paused” screen",
  "Écran de pause dans le même univers : le cadre animé, le chat et l'objectif restent visibles.":
    "Break screen in the same universe: the animated frame, chat and goal stay visible.",
  "Barre d'objectif": "Goal bar",
  "Barre d'objectif multi-événements qui se remplit en direct.": "Multi-event goal bar that fills up live.",
  "Lecteur musique": "Music player",
  "Morceau en cours sur Spotify, avec pochette, artiste et progression.": "Current Spotify track, with cover art, artist and progress.",
  "Écran « Stream Ending »": "“Stream Ending” screen",
  "Écran de fin de live, dans la continuité des écrans de lancement et de pause.": "End-of-stream screen, continuing the starting and break screens.",
  "Écran « Stream Offline »": "“Stream Offline” screen",
  "Écran hors ligne avec le planning de la semaine et les réseaux sociaux.": "Offline screen with the weekly schedule and social media.",
  "Alertes néon": "Neon alerts",
  "Follow, sub, raid, cheer, don et sub offert : une carte néon par type d'événement.": "Follow, sub, raid, cheer, donation and gifted sub: one neon card per event type.",
  "Scènes « Gaming » et « Just Chatting »": "“Gaming” and “Just Chatting” scenes",
  "Les scènes de jeu et de discussion : webcam en incrustation ou en plein écran, bandeau d'infos animé, musique et objectif.":
    "Gaming and chatting scenes: inset or full-screen webcam, animated info bar, music and goal.",
  "Starting screen": "Starting screen",
  "Logo néon qui se dessine, titre de scène, tchat et alertes en direct, réseaux sociaux.": "Neon logo drawing itself, scene title, live chat and alerts, social media.",
  "Tchat communautaire": "Community chat",
  "Tchat au design de la chaîne, branché sur les vrais messages, avec badges VIP, abonnés et rôles.":
    "Chat in the channel's design, wired to real messages, with VIP, subscriber and role badges.",
  "Panneau « Le son »": "“Now playing” panel",
  "Morceau en cours via Last.fm ou Spotify (morceau fictif pour l'aperçu).": "Current track via Last.fm or Spotify (sample track for the preview).",
  "Alertes électriques": "Electric alerts",
  "Follow, sub, raid, bits, don et sub offert, pour StreamElements et Streamlabs.": "Follow, sub, raid, bits, donation and gifted sub, for StreamElements and Streamlabs.",
  "Emotes zer0oes": "zer0oes emotes",
  "19 emotes de follower et d'abonné, et 6 emotes animées, dans le style de la chaîne.": "19 follower and subscriber emotes, plus 6 animated emotes, in the channel's style.",
  "Logo TomaVega": "TomaVega logo",
  "Logo électrique aux éclats néon bleu, violet et vert, avec un V en forme d'éclair.": "Electric logo with blue, purple and green neon sparks, and a lightning-bolt V.",
  "Bannière YouTube": "YouTube banner",
  "Bannière sur fond minéral avec éclats verts et violets, logo néon, thèmes de la chaîne et réseaux sociaux.":
    "Banner on a mineral background with green and purple sparks, neon logo, channel themes and social media.",
  "Bannières Twitch et YouTube": "Twitch and YouTube banners",
  "Bannières assorties pour Twitch et YouTube : logo, réseaux sociaux et portrait dans l'univers néon de la chaîne.":
    "Matching Twitch and YouTube banners: logo, social media and portrait in the channel's neon universe.",
  "Photo de profil aux lumières néon de la chaîne, la même sur Twitch, YouTube et les réseaux, pour être reconnue partout.":
    "Profile picture in the channel's neon lights, the same on Twitch, YouTube and social media, to be recognised everywhere.",
  "Panneaux Twitch": "Twitch panels",
  "Titres de panneaux pour la page Bio de Twitch : à propos, soutien, planning, abonnement, sponsors et config.":
    "Panel titles for the Twitch About page: about, support, schedule, subscription, sponsors and setup.",

  // --- Études de cas ------------------------------------------------------------------------
  "Identité de stream / TomaVega": "Stream identity / TomaVega",
  "Un univers": "An electric",
  "électrique.": "universe.",
  "Une identité sur fond minéral, traversée de néons verts et violets. Du logo aux alertes, chaque élément parle le même langage.":
    "An identity on a mineral background, crossed by green and purple neon. From the logo to the alerts, every element speaks the same language.",
  "Overlay animé": "Animated overlay",
  "Widgets & alertes": "Widgets & alerts",
  YouTube: "YouTube",
  "La scène de lancement — l'univers en un regard.": "The starting scene — the whole universe at a glance.",
  "Le logo, point de départ de l'univers.": "The logo, where the universe begins.",
  "Le live en détail": "The live in detail",
  "Une communauté": "A community",
  "au cœur du décor.": "at the heart of the scene.",
  "Le tchat, dans l'habillage de la chaîne.": "The chat, dressed in the channel's look.",
  "Chaque événement": "Every event",
  "a son éclat.": "has its spark.",
  "Les alertes électriques.": "The electric alerts.",
  "Le panneau « Le son ».": "The “Now playing” panel.",
  "Au-delà du stream": "Beyond the stream",
  "La même identité": "The same identity",
  "sur YouTube.": "on YouTube.",
  "Une bannière qui prolonge l'univers minéral et électrique hors du live.": "A banner that extends the mineral, electric universe beyond the live.",
  "Ton prochain univers": "Your next universe",
  "Et si on imaginait": "What if we imagined",
  "l'identité de ta chaîne ?": "your channel's identity?",
  "Identité de stream / zer0oes": "Stream identity / zer0oes",
  "Une nuit": "A synthwave",
  "synthwave.": "night.",
  "Un horizon néon, une signature à la main et un univers qui relie toutes les scènes du stream.":
    "A neon horizon, a handwritten signature and a universe connecting every scene of the stream.",
  Overlays: "Overlays",
  Widgets: "Widgets",
  Emotes: "Emotes",
  "La signature": "The signature",
  "Un trait.": "One line.",
  "Un éclair.": "A lightning bolt.",
  "Le monogramme, jusque dans l'avatar.": "The monogram, right down to the avatar.",
  "Avatar / Monogramme": "Avatar / Monogram",
  "Création d’un monogramme personnalisé pour TomaVega, décliné en avatar pour ses réseaux sociaux. Une identité graphique sombre et dynamique, marquée par des lignes anguleuses et des accents vert néon.":
    "A custom monogram created for TomaVega, turned into an avatar for his social media. A dark, dynamic visual identity, marked by angular lines and neon green accents.",
  "Toute une identité.": "A whole identity.",
  "Le même univers, jusque dans l'avatar.": "The same universe, right down to the avatar.",
  "Les scènes du live": "The live scenes",
  "Un décor qui": "A setting that",
  "suit le stream.": "follows the stream.",
  "Une identité commune, déclinée pour chaque moment du live.": "One shared identity, adapted to every moment of the live.",
  "Gaming & Just Chatting": "Gaming & Just Chatting",
  Pause: "Break",
  "Fin de live": "Ending",
  "Hors ligne": "Offline",
  "La communauté": "The community",
  "entre dans le décor.": "steps into the scene.",
  "Le tchat, aux couleurs de la chaîne.": "The chat, in the channel's colours.",
  "Les petits détails": "The little details",
  "font l'ensemble.": "make the whole.",
  "Les alertes animées.": "The animated alerts.",
  "La musique.": "The music.",
  "L'objectif.": "The goal.",
  "Les réactions": "The reactions",
  "Toutes les": "Every",
  "émotions": "emotion",
  "du live.": "of the live.",
  "Une famille d'emotes dans le style de la chaîne.": "A family of emotes in the channel's style.",
  "Reconnaissable.": "Recognisable.",
  "Partout.": "Everywhere.",
  "La même identité sur Twitch, YouTube et les réseaux.": "The same identity on Twitch, YouTube and social media.",
  "Les panneaux Twitch.": "The Twitch panels.",

  // --- Catégories du portfolio -------------------------------------------------------------
  Alertes: "Alerts",
  Bannières: "Banners",
  "Réseaux sociaux": "Social media",
};

// Texte traduit (ou le texte français s'il n'a pas de traduction)
export function tr(locale: Locale, text: string): string;
export function tr(locale: Locale, text: string | undefined): string | undefined;
export function tr(locale: Locale, text: string | undefined) {
  if (locale === "fr" || text === undefined) return text;
  return en[text] ?? en[text.trim()] ?? text;
}

// Traduit toutes les chaînes d'un objet (offre, projet, étude de cas…). Les identifiants et
// adresses n'étant pas dans la table, ils restent inchangés.
export function trDeep<T>(locale: Locale, value: T): T {
  if (locale === "fr") return value;
  if (typeof value === "string") return tr(locale, value) as T;
  if (Array.isArray(value)) return value.map((v) => trDeep(locale, v)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, trDeep(locale, v)])) as T;
  }
  return value;
}

// Nom complet d'une commande (« Premier look — Pack avec emotes ») : chaque partie est traduite
export function trOfferName(locale: Locale, name: string) {
  return locale === "fr" ? name : name.split(" — ").map((part) => tr(locale, part)).join(" — ");
}

import { optionCategory, splitOptionName, type Option } from "./pricing";
import type { Locale } from "./i18n";

export const optionThemeColors = { overlays: "#A78BFA", emotes: "#E879C6", branding: "#818CF8", motion: "#67D4E8" };

// A product groups only known variants; custom admin options remain visible individually.
const families = [
  ["overlay-fixe-unite", "overlay-anime-unite"],
  ["alertes-fixes", "alertes-animees"],
  ["emote-statique", "emote-animee", "emotes-3", "emotes-animees-3", "emotes-5", "emotes-animees-5", "emotes-10", "emotes-animees-10"],
] as const;

export function optionProducts(options: Option[]) {
  const seen = new Set<string>();
  return options.flatMap((option) => {
    if (seen.has(option.id)) return [];
    const family = families.find((ids) => ids.some((id) => id === option.id));
    const variants = family ? family.flatMap((id) => options.filter((o) => o.id === id)) : [option];
    variants.forEach((o) => seen.add(o.id));
    return [{ id: variants[0].id, category: optionCategory(option), variants }];
  });
}

export function animatedOption(option: Option) {
  return /anim/i.test(option.id) || /anim/i.test(option.name);
}

export function emoteCount(option: Option) {
  return Number(option.id.match(/^emotes-(?:animees-)?(\d+)$/)?.[1] ?? 1);
}

export function optionProductTitle(name: string) {
  const title = splitOptionName(name);
  return { ...title, detail: title.detail && /^(unité|unit|each)$/i.test(title.detail.trim()) ? undefined : title.detail, main: title.main.replace(/(?<!\p{L})(?:fixes?|statiques?|animées?|animés?|fixed|static|animated)(?!\p{L})/giu, "").replace(/\s+/g, " ").trim() };
}

export function optionIncludes(option: Option, locale: Locale) {
  const category = optionCategory(option);
  const en = locale === "en";
  const count = option.id.match(/(?:emotes-(?:animees-)?|panneaux-)(\d+)/)?.[1];
  if (option.id === "logo-declinaisons") return en ? "A custom logo and its variations, adapted to your uses. Formats and variations confirmed in your quote." : "Un logo sur mesure et ses déclinaisons, adaptés à tes usages. Formats et déclinaisons confirmés dans le devis.";
  if (option.id === "logo") return en ? "A custom logo for your channel. Creative direction and deliverables confirmed in your quote." : "Création d’un logo sur mesure pour ta chaîne. Direction graphique et livrables confirmés dans le devis.";
  if (option.id === "widget-personnalise") return en ? "A widget styled for your channel: goal progress bar, chat display or sponsor panel. Choose its content and appearance in your brief." : "Un widget habillé pour ta chaîne : barre de progression d’un objectif, affichage du tchat ou encart sponsor. Choisis son contenu et son apparence dans ton brief.";
  if (option.id === "widget-avance") return en ? "An interactive widget with custom behaviour: reactions to live events, conditional displays or data-driven updates. Features and integrations are scoped in your quote." : "Un widget interactif avec une logique sur mesure : réactions aux événements du live, affichages conditionnels ou mises à jour selon des données. Fonctionnalités et intégrations définies sur devis.";
  if (option.id === "animation-overlay") return en ? "Light animation of one existing overlay. Supply your original visual for the quote." : "Animation légère d’un overlay existant. Fournis ton visuel d’origine pour le devis.";
  if (option.id === "animation-logo") return en ? "Animation of your existing logo. Movement and complexity confirmed in the quote." : "Animation de ton logo existant. Mouvement et complexité confirmés dans le devis.";
  if (category === "emotes") return en ? `${count ?? 1} custom ${animatedOption(option) ? "animated" : "static"} emote${count ? "s" : ""}.` : `${count ?? 1} emote${count ? "s" : ""} personnalisée${count ? "s" : ""}, ${animatedOption(option) ? "animée" : "statique"}${count ? "s" : ""}.`;
  if (/overlay/i.test(option.id + option.name)) return en ? `One custom ${animatedOption(option) ? "animated" : "static"} stream scene. Specify the scene and layout in your brief.` : `Une scène de stream ${animatedOption(option) ? "animée" : "statique"} sur mesure. Précise la scène et la disposition dans ton brief.`;
  if (/alerte|alert/i.test(option.id + option.name)) return en ? `5 custom ${animatedOption(option) ? "animated" : "static"} alerts: follow, sub, raid, cheer and tips.` : `5 alertes personnalisées ${animatedOption(option) ? "animées" : "statiques"} incluses : follow, sub, raid, cheer et tips.`;
  if (/panneau|panel/i.test(option.id + option.name)) return en ? "6 custom Twitch panels, with your headings and links." : "6 panneaux Twitch personnalisés, avec tes rubriques et liens.";
  if (/banni|banner/i.test(option.id + option.name)) return en ? "A custom banner for your YouTube or Twitch channel." : "Une bannière personnalisée pour ta chaîne YouTube ou Twitch.";
  if (/avatar/i.test(option.id + option.name)) return en ? "A custom avatar for your profile." : "Un avatar personnalisé pour ton profil.";
  if (option.priceFrom) return en ? "A custom creation. Scope and deliverables confirmed in your quote." : "Une création sur mesure. Périmètre et livrables confirmés dans ton devis.";
  return en ? `A custom creation: ${option.name}. Describe the elements in your brief.` : `Une création personnalisée : ${option.name}. Précise les éléments dans ton brief.`;
}

export function productBriefHint(line: string, locale: Locale) {
  const en = locale === "en";
  if (/overlay/i.test(line)) return en ? "Scene (starting, break, ending, chatting or gameplay), texts, camera and chat positions. For several scenes, describe each one." : "Scène (démarrage, pause, fin, discussion ou gameplay), textes, emplacement caméra et tchat. Pour plusieurs scènes, détaille chacune.";
  if (/emote/i.test(line)) return en ? "Character, expressions and poses for each emote. For animated emotes, describe the movement." : "Personnage, expressions et poses de chaque emote. Pour les emotes animées, précise le mouvement.";
  if (/alerte|alert/i.test(line)) return en ? "Your 5 included events: follow, sub, raid, cheer and tips. Specify the text for each and the desired movement for the animated variant." : "Tes 5 événements inclus : follow, sub, raid, cheer et tips. Précise les textes de chacun et le mouvement souhaité pour la variante animée.";
  if (/panneau/i.test(line)) return en ? "The six headings, texts and links." : "Les six rubriques, leurs textes et liens.";
  if (/banni/i.test(line)) return en ? "Platform, text, social handles and elements to include." : "Plateforme, textes, réseaux sociaux et éléments à afficher.";
  return en ? "Describe the requested visual and the elements to include." : "Décris le visuel souhaité et les éléments à inclure.";
}

// Fichiers concrètement livrés pour une création à prix fixe (liste « Tu reçois »).
// Les créations sur devis n'en ont pas : leurs livrables sont fixés dans le devis.
export function optionFiles(option: Option, locale: Locale): string[] {
  if (option.priceFrom) return [];
  const en = locale === "en";
  const animated = animatedOption(option);
  const guide = en ? "Step-by-step setup guide" : "Guide d’installation pas à pas";
  const key = option.id + " " + option.name;
  if (optionCategory(option) === "emotes")
    return animated
      ? [en ? "Animated GIF files at Twitch sizes (112, 56 and 28 px)" : "Fichiers GIF animés aux tailles Twitch (112, 56 et 28 px)", en ? "A large version for Discord and YouTube" : "Une version grand format pour Discord et YouTube"]
      : [en ? "PNG files with a transparent background, at Twitch sizes (112, 56 and 28 px)" : "Fichiers PNG à fond transparent, aux tailles Twitch (112, 56 et 28 px)", en ? "A large version for Discord and YouTube" : "Une version grand format pour Discord et YouTube"];
  if (/overlay/i.test(key))
    return [
      animated
        ? en ? "A looping 1920 × 1080 WEBM video with a transparent background" : "Une vidéo WEBM 1920 × 1080 en boucle, à fond transparent"
        : en ? "A 1920 × 1080 PNG with a transparent background" : "Un PNG 1920 × 1080 à fond transparent",
      en ? "Ready to add in OBS" : "Prêt à ajouter dans OBS",
      guide,
    ];
  if (/alerte|alert/i.test(key))
    return [
      en ? "Alerts ready to import into StreamElements, or code for Streamlabs" : "Alertes prêtes à importer dans StreamElements, ou code pour Streamlabs",
      animated ? (en ? "Animations as transparent WEBM" : "Animations en WEBM à fond transparent") : en ? "Visuals as transparent PNG" : "Visuels en PNG à fond transparent",
      guide,
    ];
  if (/panneau|panel/i.test(key)) return [en ? "6 PNG panels at Twitch format" : "6 panneaux PNG au format Twitch"];
  if (/banni|banner/i.test(key)) return [en ? "A PNG at the size of your platform (Twitch or YouTube)" : "Un PNG aux dimensions de ta plateforme (Twitch ou YouTube)"];
  if (/avatar/i.test(key)) return [en ? "A high-resolution square PNG, readable small and in a circle" : "Un PNG carré haute définition, lisible en petit et en rond"];
  return [];
}

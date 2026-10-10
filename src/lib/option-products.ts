import { optionCategory, splitOptionName, type Option } from "./pricing";
import type { Locale } from "./i18n";

export const optionThemeColors = { overlays: "#A78BFA", emotes: "#E879C6", branding: "#818CF8", motion: "#67D4E8" };

// Regroupements d'origine (une carte par famille) ; modifiables dans la fiche de chaque option (admin).
const families = [
  ["overlay-fixe-unite", "overlay-anime-unite"],
  ["alertes-fixes", "alertes-animees"],
  ["emote-statique", "emote-animee", "emotes-3", "emotes-animees-3", "emotes-5", "emotes-animees-5", "emotes-10", "emotes-animees-10"],
] as const;

const familyKeys = ["overlay", "alertes", "emotes"];
export function defaultGroup(option: Option): string | null {
  const i = families.findIndex((ids) => ids.some((id) => id === option.id));
  return i < 0 ? null : familyKeys[i];
}

// Une carte par regroupement (les options sans regroupement ont leur propre carte), dans l'ordre du catalogue
export function optionProducts(options: Option[], groupOf: (o: Option) => string | null = defaultGroup) {
  const seen = new Set<string>();
  return options.flatMap((option) => {
    if (seen.has(option.id)) return [];
    const group = groupOf(option);
    const variants = group ? options.filter((o) => groupOf(o) === group) : [option];
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

// Bloc du brief d'une création achetée : titre et consigne, selon l'offre et sa variante (statique ou animée)
type BriefBlock = [title: string, hint: string, titleEn: string, hintEn: string];
export function productBriefBlock(line: string, locale: Locale): { title: string; hint: string } {
  const quantity = Number(/×\s*(\d+)\s*$/.exec(line)?.[1] ?? 1) || 1;
  const name = line.split(" — ")[0].replace(/×\s*\d+\s*$/, "").trim();
  const animated = /anim/i.test(name);
  const emotes = (Number(/(\d+)\s+emotes?/i.exec(name)?.[1] ?? 1) || 1) * quantity;
  const block: BriefBlock =
    /animation/i.test(name) && /emote/i.test(name) ? ["Donne vie à ton emote", "Fournis un lien vers ton emote et décris le mouvement ou l’expression souhaités. Précise les éléments qui doivent rester fixes.", "Bring your emote to life", "Provide a link to your emote and describe the movement or expression you want. Specify the elements that must stay still."]
    : /animation/i.test(name) && /overlay/i.test(name) ? ["Anime ton overlay", "Fournis un lien vers ton overlay et indique les zones à animer ainsi que les effets souhaités.", "Animate your overlay", "Provide a link to your overlay and indicate the areas to animate and the effects you want."]
    : /animation/i.test(name) && /logo/i.test(name) ? ["Donne vie à ton logo", "Fournis un lien vers ton logo et décris son apparition, ses mouvements et sa sortie. Précise où l’animation sera utilisée et si elle doit tourner en boucle.", "Bring your logo to life", "Provide a link to your logo and describe its entrance, movements and exit. Specify where the animation will be used and whether it should loop."]
    : /alerte|alert/i.test(name) ? (animated
      ? ["Imagine tes 5 alertes animées", "Pour chaque alerte, décris le texte, le visuel et l’animation souhaités. Précise si elles doivent partager le même style ou avoir chacune leur personnalité.", "Imagine your 5 animated alerts", "For each alert, describe the text, visual and animation you want. Say whether they should share the same style or each have their own personality."]
      : ["Personnalise tes 5 alertes", "Pour chaque alerte — follow, sub, raid, cheer et tips — indique le texte à afficher, les couleurs et le visuel souhaité.", "Customize your 5 alerts", "For each alert — follow, sub, raid, cheer and tips — give the text to display, the colours and the visual you want."])
    : /overlay/i.test(name) ? (animated
      ? ["Imagine ton overlay animé", "Décris la disposition de ta scène et les éléments à animer. Précise l’ambiance et le mouvement souhaités : discrets, dynamiques, lumineux…", "Imagine your animated overlay", "Describe your scene layout and the elements to animate. Specify the mood and movement you want: subtle, dynamic, glowing…"]
      : ["Personnalise ton overlay", "Décris la scène souhaitée : disposition de la caméra, zone de jeu, chat, textes et informations à afficher.", "Customize your overlay", "Describe the scene you want: camera layout, game area, chat, texts and information to display."])
    : /widget/i.test(name) && /interactif|avancé|interactive|advanced/i.test(name) ? ["Imagine les interactions de ton widget", "Décris les événements qui déclenchent une réaction, ce qui doit se passer à l’écran et les éventuelles règles ou commandes.", "Imagine your widget’s interactions", "Describe the events that trigger a reaction, what should happen on screen and any rules or commands."]
    : /widget/i.test(name) ? ["Décris ton widget", "Explique ce que ton widget doit afficher : objectif, compteur, progression ou autre information. Précise son apparence et son emplacement à l’écran.", "Describe your widget", "Explain what your widget should display: goal, counter, progress or other information. Specify its look and its position on screen."]
    : /emote/i.test(name) ? (emotes > 1
      ? (animated
        ? [`Imagine tes ${emotes} emotes animées`, "Pour chaque emote, décris son expression et son animation. Indique les mouvements et détails importants.", `Imagine your ${emotes} animated emotes`, "For each emote, describe its expression and animation. Mention the important movements and details."]
        : [`Personnalise tes ${emotes} emotes`, "Pour chaque emote, indique le personnage ou l’objet, l’expression et la pose souhaités. Tu peux aussi préciser les émotions que tu veux représenter.", `Customize your ${emotes} emotes`, "For each emote, give the character or object, the expression and the pose you want. You can also specify the emotions you want to show."])
      : animated
        ? ["Imagine ton emote animée", "Décris le personnage ou l’objet, son expression et le mouvement souhaité. Précise comment l’animation doit se répéter.", "Imagine your animated emote", "Describe the character or object, its expression and the movement you want. Specify how the animation should loop."]
        : ["Décris ton emote", "Décris le personnage ou l’objet, son expression et sa pose. Ajoute les accessoires ou détails importants.", "Describe your emote", "Describe the character or object, its expression and pose. Add any important accessories or details."])
    : /logo/i.test(name) && /déclinaison|variation/i.test(name) ? ["Définis ton logo et ses déclinaisons", "Décris ton logo et ses usages. Précise les versions nécessaires : symbole seul, nom complet, fond clair ou sombre, formats horizontaux ou verticaux…", "Define your logo and its variations", "Describe your logo and its uses. Specify the versions you need: symbol only, full name, light or dark background, horizontal or vertical formats…"]
    : /logo/i.test(name) ? ["Définis ton logo", "Indique le nom à intégrer, les symboles souhaités et le style recherché. Précise où ton logo sera utilisé.", "Define your logo", "Give the name to include, the symbols you want and the style you’re after. Specify where your logo will be used."]
    : /banni|banner/i.test(name) ? ["Personnalise ta bannière", "Précise la plateforme, les textes à afficher et les éléments visuels à intégrer : personnage, logo, réseaux sociaux…", "Customize your banner", "Specify the platform, the texts to display and the visual elements to include: character, logo, social handles…"]
    : /avatar/i.test(name) ? ["Imagine ton avatar", "Décris le personnage, la pose, l’expression et le fond souhaités. Précise les détails qui permettront de te reconnaître.", "Imagine your avatar", "Describe the character, pose, expression and background you want. Mention the details that will make you recognisable."]
    : /panneau|panel/i.test(name) ? ["Personnalise tes 6 panneaux", "Pour chaque panneau, indique son titre, son texte éventuel et l’icône souhaitée. Ajoute les liens associés si nécessaire.", "Customize your 6 panels", "For each panel, give its title, any text and the icon you want. Add the related links if needed."]
    : [`Décris ta création : ${name}`, "Décris le visuel souhaité et les éléments à inclure.", `Describe your creation: ${name}`, "Describe the requested visual and the elements to include."];
  // Plusieurs exemplaires décrits dans un même champ (les emotes et les alertes ont un champ chacune)
  const en = locale === "en";
  const several = quantity > 1 && !/emote|alerte|alert/i.test(name) ? (en ? ` You ordered ${quantity}: describe each one.` : ` Tu en as commandé ${quantity} : détaille chacune.`) : "";
  return en ? { title: block[2], hint: block[3] + several } : { title: block[0], hint: block[1] + several };
}

export const productBriefHint = (line: string, locale: Locale) => productBriefBlock(line, locale).hint;

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

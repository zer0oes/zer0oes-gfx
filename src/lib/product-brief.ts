// Brief des créations achetées : une réponse par création, ou une par partie (chaque alerte d'un pack d'alertes,
// chaque emote selon le nombre acheté). Les parties sont réunies en une seule réponse « Partie : texte » par ligne.

export type BriefPart = { label: string; labelEn: string; example?: string; exampleEn?: string };

const ALERT_LABELS: Record<string, string> = { follow: "Follow", sub: "Sub", raid: "Raid", cheer: "Cheer", tips: "Tips", tip: "Tips" };

// Exemples affichés dans les champs : texte de l'alerte et couleurs (et animation pour la variante animée)
const ALERT_EXAMPLES: Record<string, [string, string]> = {
  Follow: ["Ex. : « Bienvenue [pseudo] ! », texte blanc sur fond violet", "E.g. “Welcome [name]!”, white text on purple"],
  Sub: ["Ex. : « Merci [pseudo] pour l’abonnement ! », rose néon et noir", "E.g. “Thanks [name] for subscribing!”, neon pink and black"],
  Raid: ["Ex. : « [pseudo] débarque avec [nombre] raiders ! », orange et jaune", "E.g. “[name] is raiding with [count] viewers!”, orange and yellow"],
  Cheer: ["Ex. : « [pseudo] envoie [nombre] bits ! », cyan et violet", "E.g. “[name] cheered [count] bits!”, cyan and purple"],
  Tips: ["Ex. : « Merci [pseudo] pour ton don de [montant] ! », vert menthe et blanc", "E.g. “Thanks [name] for the [amount] tip!”, mint green and white"],
};
const ALERT_MOTION: Record<string, [string, string]> = {
  Follow: ["le texte rebondit", "the text bounces"], Sub: ["une pluie de cœurs", "a shower of hearts"], Raid: ["une fusée traverse l’écran", "a rocket crosses the screen"],
  Cheer: ["des étincelles jaillissent", "sparkles burst out"], Tips: ["des pièces tombent en cascade", "coins cascade down"],
};
const EMOTE_EXAMPLES: [string, string][] = [
  ["Ex. : mon personnage qui fait un clin d’œil, un cœur dans les mains", "E.g. my character winking, holding a heart"],
  ["Ex. : « GG » avec mon personnage qui applaudit", "E.g. “GG” with my character clapping"],
  ["Ex. : visage surpris, yeux écarquillés", "E.g. surprised face, wide eyes"],
  ["Ex. : larmes de rire, poings serrés", "E.g. tears of laughter, clenched fists"],
  ["Ex. : pouce levé avec un grand sourire", "E.g. thumbs up with a big smile"],
  ["Ex. : mon chat qui dort sur le clavier", "E.g. my cat asleep on the keyboard"],
  ["Ex. : en colère, petite fumée au-dessus de la tête", "E.g. angry, a puff of smoke above the head"],
  ["Ex. : « Hype ! » avec mon personnage qui saute", "E.g. “Hype!” with my character jumping"],
  ["Ex. : en train de boire un café, l’air fatigué", "E.g. sipping coffee, looking tired"],
  ["Ex. : cœur brillant aux couleurs de ma chaîne", "E.g. a shiny heart in my channel colours"],
];
const EMOTE_MOTION: [string, string][] = [
  ["Ex. : mon personnage fait coucou de la main, en boucle", "E.g. my character waves, looping"],
  ["Ex. : « GG » qui clignote pendant que mon personnage applaudit", "E.g. a flashing “GG” while my character claps"],
  ["Ex. : visage surpris, les yeux qui s’agrandissent d’un coup", "E.g. surprised face, eyes suddenly widening"],
  ["Ex. : fou rire, le personnage tremble et pleure de rire", "E.g. laughing fit, the character shakes with tears of laughter"],
  ["Ex. : pouce levé qui pop avec un petit rebond", "E.g. a thumbs up popping in with a small bounce"],
  ["Ex. : mon chat qui dort, le ventre qui se soulève", "E.g. my cat sleeping, its belly rising and falling"],
  ["Ex. : en colère, la fumée qui sort par les oreilles", "E.g. angry, smoke puffing from the ears"],
  ["Ex. : mon personnage qui saute de joie", "E.g. my character jumping for joy"],
  ["Ex. : la tasse de café qui fume, les yeux qui se ferment", "E.g. a steaming coffee cup, eyes slowly closing"],
  ["Ex. : cœur qui bat aux couleurs de ma chaîne", "E.g. a beating heart in my channel colours"],
];
const PANEL_EXAMPLES: [string, string][] = [
  ["Ex. : « À propos », deux phrases sur moi, icône manette", "E.g. “About”, two sentences about me, gamepad icon"],
  ["Ex. : « Planning », lun-ven 20 h, icône calendrier", "E.g. “Schedule”, Mon-Fri 8 pm, calendar icon"],
  ["Ex. : « Réseaux », icône bulle, lien vers mon Instagram", "E.g. “Socials”, speech bubble icon, link to my Instagram"],
  ["Ex. : « Règles du tchat », icône bouclier", "E.g. “Chat rules”, shield icon"],
  ["Ex. : « Soutenir la chaîne », icône cœur, lien de don", "E.g. “Support the channel”, heart icon, tip link"],
  ["Ex. : « Mon setup », icône ordinateur, lien vers ma liste", "E.g. “My setup”, computer icon, link to my list"],
];
const pick = <T,>(list: T[], i: number) => list[i % list.length];
const MAX_PARTS = 30;

// Parties à décrire séparément pour une ligne de commande (null : une seule réponse)
export function productBriefParts(line: string): BriefPart[] | null {
  const quantity = Number(/×\s*(\d+)\s*$/.exec(line)?.[1] ?? 1) || 1;
  const animated = /anim/i.test(line);
  if (/alerte|alert/i.test(line) && line.includes(":")) {
    const types = line.slice(line.lastIndexOf(":") + 1).replace(/×\s*\d+\s*$/, "").split(",").map((t) => t.trim()).filter(Boolean);
    if (types.length > 1) return types.slice(0, MAX_PARTS).map((type) => { const label = ALERT_LABELS[type.toLowerCase()] ?? type; const [example, exampleEn] = ALERT_EXAMPLES[label] ?? []; const motion = animated ? ALERT_MOTION[label] : undefined; return { label, labelEn: label, example: example && motion ? `${example}, ${motion[0]}` : example, exampleEn: exampleEn && motion ? `${exampleEn}, ${motion[1]}` : exampleEn }; });
  }
  if (/emote/i.test(line)) {
    const count = Math.min(MAX_PARTS, (Number(/(\d+)\s+emotes?/i.exec(line)?.[1] ?? 1) || 1) * quantity);
    if (count > 1) return Array.from({ length: count }, (_, i) => ({ label: `Emote ${i + 1}`, labelEn: `Emote ${i + 1}`, example: pick(animated ? EMOTE_MOTION : EMOTE_EXAMPLES, i)[0], exampleEn: pick(animated ? EMOTE_MOTION : EMOTE_EXAMPLES, i)[1] }));
  }
  if (/panneau|panel/i.test(line)) {
    const count = Math.min(MAX_PARTS, (Number(/(\d+)\s+(?:panneaux|panels)/i.exec(line)?.[1] ?? 6) || 6) * quantity);
    if (count > 1) return Array.from({ length: count }, (_, i) => ({ label: `Panneau ${i + 1}`, labelEn: `Panel ${i + 1}`, example: pick(PANEL_EXAMPLES, i)[0], exampleEn: pick(PANEL_EXAMPLES, i)[1] }));
  }
  return null;
}

export const productBriefFieldName = (line: number, part?: number) => (part === undefined ? `productBrief_${line}` : `productBrief_${line}_${part}`);

// Réponse de chaque ligne ("" si une partie obligatoire manque)
export function readProductBrief(lines: string[], read: (name: string) => string): string[] {
  return lines.map((line, index) => {
    const parts = productBriefParts(line);
    if (!parts) return read(productBriefFieldName(index)).trim().slice(0, 5000);
    const answers = parts.map((part, j) => [part.label, read(productBriefFieldName(index, j)).trim().slice(0, 2000)] as const);
    return answers.some(([, text]) => !text) ? "" : answers.map(([label, text]) => `${label} : ${text}`).join("\n");
  });
}

// Réponse enregistrée découpée par partie (modification du brief)
export function splitProductBrief(line: string, value: string | undefined): string[] {
  const parts = productBriefParts(line);
  if (!parts || !value) return [];
  const result = parts.map(() => "");
  let current = -1;
  for (const row of value.split("\n")) {
    const found = parts.findIndex((part) => row.startsWith(`${part.label} : `));
    if (found >= 0) { current = found; result[found] = row.slice(parts[found].label.length + 3); }
    else if (current >= 0) result[current] += `\n${row}`;
  }
  return result;
}

export function productBriefFields(lines: string[], read: (name: string) => string) {
  const fields: Record<string, string> = {};
  for (const [index, value] of readProductBrief(lines, read).entries()) {
    if (!value) return null;
    fields[`Création ${index + 1} : ${lines[index]}`] = value;
  }
  return fields;
}

// Port verbatim des générateurs aléatoires du simulateur d'événements
// (public/app.js) : noms/montants/messages de démo utilisés quand le champ
// correspondant est laissé vide.

export const chatRoleBadges: Record<string, { type: string; version: string; url: string; description: string }> = {
  moderator: {
    type: "moderator",
    version: "1",
    url: "https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/3",
    description: "Modérateur"
  },
  vip: {
    type: "vip",
    version: "1",
    url: "https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc744dfa6ec/3",
    description: "VIP"
  },
  "artist-badge": {
    type: "artist-badge",
    version: "1",
    url: "https://static-cdn.jtvnw.net/badges/v1/4300a897-03dc-4e83-8c0e-c332fee7057f/3",
    description: "Artiste"
  },
  subscriber: {
    type: "subscriber",
    version: "1",
    url: "https://static-cdn.jtvnw.net/badges/v1/5d9f2208-5dd8-11e7-8513-2ff4adfae661/3",
    description: "Abonné"
  },
  broadcaster: {
    type: "broadcaster",
    version: "1",
    url: "https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/3",
    description: "Streamer"
  }
};

const chatBadgePool: (keyof typeof chatRoleBadges)[][] = [
  [],
  [],
  [],
  [],
  ["subscriber"],
  ["subscriber"],
  ["moderator"],
  ["vip"],
  ["artist-badge"],
  ["moderator", "subscriber"]
];

export function randomChatBadges() {
  const roles = chatBadgePool[Math.floor(Math.random() * chatBadgePool.length)];
  return roles.map((role) => chatRoleBadges[role]).filter(Boolean);
}

const chatMessageWords = [
  "salut", "coucou", "haha", "gg", "nice", "wow", "trop", "bien", "hype", "incroyable",
  "lol", "on", "y", "va", "cette", "partie", "est", "folle", "je", "adore", "ce", "stream",
  "chill", "super", "content", "d'être", "là", "soir", "vous", "êtes", "les", "meilleurs",
  "franchement", "ça", "déchire", "encore", "un", "peu", "et", "gagne", "clean", "propre",
  "belle", "action", "sérieux", "quel", "niveau", "j'y", "crois", "pas", "besoin", "d'un",
  "petit", "café", "avant", "de", "continuer", "vivement", "prochain", "objectif", "merci",
  "pour", "le", "contenu", "toujours", "aussi", "bon", "public", "au", "rendez", "vous"
]; 

function randomChatMessageLength(): number {
  const roll = Math.random();
  if (roll < 0.5) return Math.floor(Math.random() * 4) + 1;
  if (roll < 0.85) return Math.floor(Math.random() * 8) + 5;
  return Math.floor(Math.random() * 20) + 13;
}

export function randomChatMessage(): string {
  const length = randomChatMessageLength();
  const words = Array.from({ length }, () => chatMessageWords[Math.floor(Math.random() * chatMessageWords.length)]);
  const message = words.join(" ");
  return message.charAt(0).toUpperCase() + message.slice(1) + (Math.random() < 0.3 ? " !" : "");
}

const randomNameAdjectives = [
  "Pixel", "Nova", "Ombre", "Cyber", "Neon", "Astro", "Mystique", "Turbo",
  "Solaire", "Glacial", "Sauvage", "Cosmique", "Rebelle", "Chromatique", "Electrique"
]; 
const randomNameNouns = [
  "Loutre", "Renard", "Phoenix", "Wolf", "Faucon", "Dragon", "Panda",
  "Comete", "Ninja", "Griffon", "Lynx", "Corbeau", "Tigre", "Otarie", "Yeti"
]; 

export function randomEventName(): string {
  const adjective = randomNameAdjectives[Math.floor(Math.random() * randomNameAdjectives.length)];
  const noun = randomNameNouns[Math.floor(Math.random() * randomNameNouns.length)];
  const suffix = Math.random() < 0.5 ? String(Math.floor(Math.random() * 99)) : "";
  return `${adjective}${noun}${suffix}`;
}

const cheerBitAmounts = [100, 200, 300, 500, 1000, 1500, 2500, 5000, 10000];

export function randomEventAmount(listener: string): number {
  if (listener === "raid-latest") return Math.floor(Math.random() * 249) + 2;
  if (listener === "cheer-latest") return cheerBitAmounts[Math.floor(Math.random() * cheerBitAmounts.length)];
  return Math.floor(Math.random() * 50) + 1;
}

// Session de démo envoyée au chargement (onWidgetLoad / onLoad) : derniers
// abonnés, dons, bits, raids… avec de faux pseudos, comme les données de
// session StreamElements. Aucune donnée réelle de chaîne n'est lue.
export function demoSession() {
  const latest = (listener: string, extra: Record<string, unknown> = {}) => ({ name: randomEventName(), amount: randomEventAmount(listener), ...extra });
  const count = (max: number) => ({ count: Math.floor(Math.random() * max) + 1 });
  const total = (max: number) => ({ amount: Math.floor(Math.random() * max) + 1 });
  const data: Record<string, unknown> = {
    "follower-latest": { name: randomEventName() },
    "follower-session": count(20), "follower-week": count(80), "follower-month": count(300), "follower-goal": count(500), "follower-total": count(5000),
    "subscriber-latest": latest("subscriber-latest", { tier: "1000", message: randomChatMessage() }),
    "subscriber-new-latest": { name: randomEventName(), amount: 1 },
    "subscriber-resub-latest": latest("subscriber-latest", { message: randomChatMessage() }),
    "subscriber-gifted-latest": { name: randomEventName(), amount: 1, tier: "1000", sender: randomEventName() },
    "subscriber-session": count(10), "subscriber-week": count(30), "subscriber-month": count(100), "subscriber-goal": count(200), "subscriber-total": count(800), "subscriber-points": count(1000),
    "cheer-latest": latest("cheer-latest", { message: randomChatMessage() }),
    "cheer-session": total(5000), "cheer-week": total(20000), "cheer-month": total(80000), "cheer-goal": total(100000), "cheer-total": total(500000),
    "cheer-session-top-donation": latest("cheer-latest"), "cheer-alltime-top-donation": latest("cheer-latest"),
    "tip-latest": latest("tip-latest", { message: randomChatMessage() }),
    "tip-session": total(100), "tip-week": total(300), "tip-month": total(1000), "tip-goal": total(2000), "tip-total": total(10000),
    "tip-session-top-donation": latest("tip-latest"), "tip-alltime-top-donation": latest("tip-latest"),
    "raid-latest": latest("raid-latest"),
  };
  const recents = [
    { type: "follower", name: randomEventName() },
    { type: "subscriber", name: randomEventName(), amount: 1, tier: "1000" },
    { type: "cheer", name: randomEventName(), amount: randomEventAmount("cheer-latest") },
    { type: "tip", name: randomEventName(), amount: randomEventAmount("tip-latest") },
    { type: "raid", name: randomEventName(), amount: randomEventAmount("raid-latest") },
  ].map((event, i) => ({ ...event, createdAt: new Date(Date.now() - i * 600_000).toISOString() }));
  return { session: { data, settings: {}, count: Object.keys(data).length }, recents };
}

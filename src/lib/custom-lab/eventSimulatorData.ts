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

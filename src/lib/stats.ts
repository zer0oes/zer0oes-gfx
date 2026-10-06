// Statistiques de visite maison (page Admin > Statistiques) : classement des sources et
// appareils, filtrage des robots, et calculs affichés dans l'admin. Sans cookie ni adresse IP.
import { bucketsFor, parisDay, within, type Bucket } from "@/lib/dashboard";

export type StatKind = "vue" | "clic" | "formulaire";
export type Device = "mobile" | "tablette" | "ordinateur";

export type StatEvent = {
  createdAt: string;
  kind: StatKind;
  path: string;
  label?: string;
  // Provenance : renseignée sur la première page vue d'une visite seulement
  source?: string;
  device?: Device;
  // Empreinte anonyme du jour (même visiteur, même jour)
  visitor?: string;
};

export type NewStatEvent = Omit<StatEvent, "createdAt">;

// Conservation des statistiques
export const STATS_RETENTION_MONTHS = 13;

export const DIRECT = "Accès direct";

const BOT_RE = /bot|crawl|spider|slurp|preview|headless|lighthouse|pagespeed|facebookexternalhit|embedly|whatsapp|telegram|curl|wget|python|axios|node-fetch/i;

export function isBot(userAgent: string | null | undefined) {
  return !userAgent || BOT_RE.test(userAgent);
}

export function deviceOf(userAgent: string): Device {
  if (/iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobi))/i.test(userAgent)) return "tablette";
  if (/Mobi|iPhone|iPod|Android/i.test(userAgent)) return "mobile";
  return "ordinateur";
}

const knownSources: [RegExp, string][] = [
  [/(^|\.)twitch\.tv$/, "Twitch"],
  [/(^|\.)instagram\.com$/, "Instagram"],
  [/(^|\.)tiktok\.com$/, "TikTok"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "YouTube"],
  [/(^|\.)(x\.com|twitter\.com|t\.co)$/, "X (Twitter)"],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me)$/, "Facebook"],
  [/(^|\.)(discord\.com|discord\.gg|discordapp\.com)$/, "Discord"],
  [/(^|\.)bsky\.app$/, "Bluesky"],
  [/(^|\.)reddit\.com$/, "Reddit"],
  [/(^|\.)linkedin\.com$|^lnkd\.in$/, "LinkedIn"],
  [/(^|\.)pinterest\.[a-z.]+$|^pin\.it$/, "Pinterest"],
  [/(^|\.)behance\.net$/, "Behance"],
  [/(^|\.)google\.[a-z.]+$/, "Google"],
  [/(^|\.)bing\.com$/, "Bing"],
  [/(^|\.)duckduckgo\.com$/, "DuckDuckGo"],
  [/(^|\.)(qwant\.com|ecosia\.org|search\.yahoo\.com)$/, "Autre moteur de recherche"],
];

const bareHost = (h: string) => h.toLowerCase().replace(/^www\./, "");

// Provenance d'une visite : paramètre utm_source, sinon site référent, sinon accès direct.
// null : navigation interne au site (pas une nouvelle visite).
export function sourceOf(referrer: string | undefined, utmSource: string | undefined, siteHost: string): string | null {
  const utm = utmSource?.trim().toLowerCase().slice(0, 40);
  if (utm) {
    const known = knownSources.find(([re]) => re.test(utm) || re.test(`${utm}.com`));
    return known ? known[1] : utm.charAt(0).toUpperCase() + utm.slice(1);
  }
  if (!referrer) return DIRECT;
  let host: string;
  try {
    host = bareHost(new URL(referrer).hostname);
  } catch {
    return DIRECT;
  }
  if (!host || host === bareHost(siteHost)) return null;
  return knownSources.find(([re]) => re.test(host))?.[1] ?? host.slice(0, 60);
}

// Nom lisible d'une page du site
export function pageLabel(path: string): string {
  // Version anglaise : même nom de page, suivi de (EN)
  if (/^\/en(\/|\?|$)/.test(path)) return `${pageLabel(path.slice(3) || "/")} (EN)`;
  const [p, q] = path.split("?");
  const names: Record<string, string> = {
    "/": "Accueil",
    "/portfolio": "Portfolio",
    "/offres": "Offres",
    "/a-propos": "À propos",
    "/contact": q?.includes("onglet=message") ? "Contact : message simple" : "Contact : projet sur-mesure",
    "/merci": "Merci (après paiement)",
    "/cgv": "CGV",
    "/mentions-legales": "Mentions légales",
    "/confidentialite": "Confidentialité",
  };
  if (names[p]) return names[p];
  const project = p.match(/^\/portfolio\/([^/]+)/);
  if (project) return `Projet : ${decodeURIComponent(project[1])}${p.split("/").length > 3 ? ` (${p.split("/").slice(3).join("/")})` : ""}`;
  return p;
}

export type Ranked = { label: string; count: number };

function rank(values: (string | undefined)[], limit = 10): Ranked[] {
  const counts = new Map<string, number>();
  for (const v of values) if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "fr"))
    .slice(0, limit);
}

export type StatsPoint = Bucket & { views: number; visitors: number };

export type StatsSummary = {
  views: number;
  visitors: number;
  clicks: number;
  forms: number;
  points: StatsPoint[];
  pages: Ranked[];
  sources: Ranked[];
  devices: Ranked[];
  clickTargets: Ranked[];
  formsByType: Ranked[];
};

// Visiteur unique = une empreinte sur une journée (elle change chaque jour) :
// le total sur une période additionne les visiteurs uniques de chaque jour.
export function summarize(events: StatEvent[], period: { start: string; end: string }): StatsSummary {
  const inPeriod = events.map((e) => ({ ...e, day: parisDay(e.createdAt) })).filter((e) => within(e, period.start, period.end));
  const views = inPeriod.filter((e) => e.kind === "vue");
  const visitKey = (e: { day: string; visitor?: string }) => (e.visitor ? `${e.day}|${e.visitor}` : undefined);

  // Une entrée par visiteur et par jour : sa provenance et son appareil
  const visits = new Map<string, { source?: string; device?: Device }>();
  for (const e of views) {
    const k = visitKey(e);
    if (!k) continue;
    const v = visits.get(k) ?? {};
    v.source ??= e.source;
    v.device ??= e.device;
    visits.set(k, v);
  }

  const points = bucketsFor(period).map((b) => {
    const bucketViews = views.filter((e) => within(e, b.start, b.end));
    return { ...b, views: bucketViews.length, visitors: new Set(bucketViews.map(visitKey).filter(Boolean)).size };
  });

  const deviceNames: Record<Device, string> = { mobile: "Mobile", tablette: "Tablette", ordinateur: "Ordinateur" };
  const clicks = inPeriod.filter((e) => e.kind === "clic");
  const forms = inPeriod.filter((e) => e.kind === "formulaire");
  return {
    views: views.length,
    visitors: visits.size,
    clicks: clicks.length,
    forms: forms.length,
    points,
    pages: rank(views.map((e) => pageLabel(e.path)), 12),
    sources: rank([...visits.values()].map((v) => v.source ?? DIRECT)),
    devices: rank([...visits.values()].map((v) => (v.device ? deviceNames[v.device] : undefined))),
    clickTargets: rank(clicks.map((e) => e.label), 15),
    formsByType: rank(forms.map((e) => e.label)),
  };
}

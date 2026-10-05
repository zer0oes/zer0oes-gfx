import "server-only";
import { createHash } from "node:crypto";
import { isProductionLike, supabaseSecretKey } from "@/lib/env";
import { STATS_RETENTION_MONTHS, deviceOf, isBot, sourceOf, type NewStatEvent } from "@/lib/stats";
import { getStore } from "@/lib/store";

// Enregistrement des statistiques côté serveur. Ne bloque jamais le site : une erreur
// d'enregistrement est seulement écrite dans les logs.

// Hors production (localhost), rien n'est enregistré, sauf avec STATS_IN_DEV=1 :
// le site local utilise la même base que le site en ligne.
function enabled() {
  return isProductionLike() || process.env.STATS_IN_DEV === "1";
}

// Visite de l'admin connectée (cookie de session Supabase ou de développement) : ignorée
function isAdminVisit(cookieHeader: string | null) {
  return /(^|;\s*)(sb-[^=]*-auth-token[^=]*|zgfx_dev_admin)=/.test(cookieHeader ?? "");
}

// Empreinte anonyme du jour : ni l'adresse IP ni le navigateur ne sont conservés,
// et l'empreinte change chaque jour (salée avec la date et un secret du serveur).
function dailyVisitor(ip: string, userAgent: string) {
  const day = new Date().toISOString().slice(0, 10);
  const secret = supabaseSecretKey() ?? process.env.ADMIN_SESSION_SECRET ?? "zgfx";
  return createHash("sha256").update(`${day}|${secret}|${ip}|${userAgent}`).digest("hex").slice(0, 16);
}

async function save(event: NewStatEvent) {
  try {
    const store = getStore();
    await store.addStatEvent(event);
    // De temps en temps, suppression de ce qui dépasse la durée de conservation
    if (Math.random() < 0.02) {
      const limit = new Date();
      limit.setMonth(limit.getMonth() - STATS_RETENTION_MONTHS);
      await store.purgeStatEvents(limit.toISOString());
    }
  } catch (e) {
    console.error("[stats]", e);
  }
}

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\u0000-\u001f]/g, "").trim().slice(0, max) : "");

// Page vue ou clic envoyé par le navigateur (route /api/stats)
export async function recordBrowserEvent(request: Request) {
  if (!enabled()) return;
  const userAgent = request.headers.get("user-agent") ?? "";
  if (isBot(userAgent) || isAdminVisit(request.headers.get("cookie"))) return;

  let body: Record<string, unknown>;
  try {
    const text = await request.text();
    if (text.length > 2000) return;
    body = JSON.parse(text);
  } catch {
    return;
  }
  const kind = body.kind === "clic" ? "clic" : body.kind === "vue" ? "vue" : null;
  const path = clean(body.path, 300);
  if (!kind || !path.startsWith("/") || path.startsWith("/admin")) return;

  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  // Provenance : seulement sur la première page d'une visite (body.landing)
  const source = kind === "vue" && body.landing === true ? sourceOf(clean(body.ref, 500) || undefined, clean(body.utm, 40) || undefined, host.split(":")[0]) : null;

  await save({
    kind,
    path,
    label: kind === "clic" ? clean(body.label, 120) || "(sans texte)" : undefined,
    source: source ?? undefined,
    device: deviceOf(userAgent),
    visitor: dailyVisitor(ip, userAgent),
  });
}

// Formulaire envoyé (contact, message, brief) : compté sans aucune donnée du visiteur
export async function recordFormSent(label: string, path: string) {
  if (!enabled()) return;
  await save({ kind: "formulaire", path, label });
}

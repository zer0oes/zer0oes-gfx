// Livraison d'une commande : liens (partage d'overlay StreamElements…) et fichiers
// (zip Streamlabs, visuels, guide), consultables par le client via un lien privé.

// 500 Mo : limite du bucket privé « livrables »
export const DELIVERABLE_MAX_BYTES = 500 * 1024 * 1024;

// Jeton du lien privé de livraison (192 bits aléatoires, en hexadécimal)
export function newDeliveryToken() {
  return Array.from(globalThis.crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function isDeliveryToken(v: unknown): v is string {
  return typeof v === "string" && /^[0-9a-f]{48}$/.test(v);
}

// Seuls les liens https sont acceptés (pas de javascript:, data:, http: en clair…)
export function checkDeliveryLink(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  return u.protocol === "https:" && u.hostname.includes(".") ? u.toString() : null;
}

// Nom de fichier sûr pour le stockage (le nom d'origine reste affiché au client)
export function safeFilename(raw: string) {
  const name = raw.split(/[\\/]/).pop() ?? "";
  const dot = name.lastIndexOf(".");
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10) : "";
  return `${base || "fichier"}${ext ? `.${ext}` : ""}`;
}

export function downloadFilename(label: string, originalPath: string) {
  const originalName = originalPath.split("/").at(-1) ?? "";
  const extension = originalName.match(/\.[a-z0-9]+$/i)?.[0] ?? "";
  const base = label.replace(/[\x00-\x1f\x7f"\\/:*?<>|]/g, "-").trim().slice(0, 160) || "fichier";
  return extension && !base.toLowerCase().endsWith(extension.toLowerCase()) ? `${base}${extension}` : base;
}

// En-tête Content-Disposition valable avec accents et tirets longs : nom ASCII de secours + nom UTF-8 (RFC 6266).
// S3 refuse les en-têtes hors ISO-8859-1 (« — » dans « Overlay — overlay OBS »).
export function attachmentDisposition(filename: string) {
  const ascii = filename.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\u2013\u2014]/g, "-").replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)}`;
}

export function deliverablePath(orderId: string, filename: string, unique: string) {
  return `${orderId}/${unique}-${safeFilename(filename)}`;
}

// « 12,4 Mo »
export function formatBytes(n?: number) {
  if (!n) return "";
  const units = ["o", "Ko", "Mo", "Go"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toLocaleString("fr-FR", { maximumFractionDigits: i ? 1 : 0 })} ${units[i]}`;
}

export function deliveryEmail({ offerName, url, links, files }: { offerName: string; url: string; links: number; files: number }) {
  const parts = [links ? `${links} lien${links > 1 ? "s" : ""} d'import` : "", files ? `${files} fichier${files > 1 ? "s" : ""}` : ""].filter(Boolean);
  return {
    subject: `Ta livraison est prête — ${offerName}`,
    eyebrow: "Livraison prête !",
    heading: offerName,
    text: [
      "Bonjour,",
      "",
      `Ta commande « ${offerName} » est prête ! Tout est réuni dans ton espace commande${parts.length ? ` (${parts.join(" et ")})` : ""} :`,
      url,
      "",
      "Regarde chaque aperçu, puis valide-le ou demande une modification. Les fichiers HD et liens d'import (StreamElements, Streamlabs, OBS) se débloquent après ta validation et le règlement du solde.",
      "Garde ce lien pour toi : il donne accès à tes fichiers.",
      "",
      "Une question, une correction ? Réponds simplement à cet e-mail.",
      "",
      "À très vite en live,",
      "Aurore — zer0oes gfx",
    ].join("\n"),
  };
}

// Remarques du client sur un fichier livré (page /livraison/<jeton>)
export const MAX_NOTES = 30;
// corrections : nombre réglé sur la page de l'offre dans l'admin (readCorrections), pour les commandes de packs
export function itemRevisionLimit(order: { packId: string; revisionsIncluded?: number }, corrections?: number): number {
  if (order.packId === "sur-mesure" && order.revisionsIncluded === 1) return 1;
  if (order.packId === "options" || order.packId.startsWith("option:")) return 1;
  if (order.packId === "sur-mesure") return 2;
  return corrections ?? (order.packId === "univers-complet" ? 3 : 2);
}
export const NOTE_MAX_CHARS = 2000;

export function correctionPending(item: { clientNotes?: { at: string }[]; publishedAt?: string; previewVersions?: { publishedAt: string }[] }) {
  const note = item.clientNotes?.at(-1);
  if (!note) return false;
  const published = item.publishedAt ?? item.previewVersions?.at(-1)?.publishedAt;
  return !published || Date.parse(note.at) >= Date.parse(published);
}

export function cleanNote(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const body = raw.replace(/\r/g, "").trim().slice(0, NOTE_MAX_CHARS);
  return body || null;
}

// --- Validation et déblocage -----------------------------------------------------------

export const deliverableTypes = [
  { id: "overlay", label: "Overlay" },
  { id: "widget", label: "Widget" },
  { id: "alerte", label: "Alertes" },
  { id: "visuel", label: "Visuel" },
  { id: "video", label: "Vidéo" },
  { id: "fichier", label: "Fichier" },
  { id: "guide", label: "Guide" },
] as const;
export type DeliverableType = (typeof deliverableTypes)[number]["id"];

export function isDeliverableType(v: unknown): v is DeliverableType {
  return deliverableTypes.some((t) => t.id === v);
}

const VIDEO_EXT = /\.(mp4|webm|mov|m4v)$/i;
const IMAGE_EXT = /\.(png|jpe?g|webp|gif|avif|svg)$/i;

export function mediaKind(path?: string): "image" | "video" | null {
  if (!path) return null;
  return VIDEO_EXT.test(path) ? "video" : IMAGE_EXT.test(path) ? "image" : null;
}

// Type affiché en badge : celui choisi dans l'admin, sinon déduit (lien d'import → overlay)
export function itemType(d: { itemType?: string; kind: "lien" | "fichier"; storagePath?: string }): DeliverableType {
  if (isDeliverableType(d.itemType)) return d.itemType;
  if (d.kind === "lien") return "overlay";
  const k = mediaKind(d.storagePath);
  return k === "video" ? "video" : k === "image" ? "visuel" : "fichier";
}

// Un fichier final (ou un lien d'import) n'est servi qu'une fois l'élément validé par le
// client ET le solde de la commande réglé. Avant : seulement l'aperçu protégé.
export type UnlockState = "a_valider" | "solde_a_regler" | "debloque";

export function unlockState(order: { totalPrice: number; amountPaid: number }, d: { approvedAt?: string }): UnlockState {
  if (!d.approvedAt) return "a_valider";
  return order.totalPrice - order.amountPaid > 0 ? "solde_a_regler" : "debloque";
}

// Livrable ajouté à la main sans fichier principal (vide, ou fichiers du Laboratoire) : clé « prévue » propre,
// pour respecter la contrainte de la base et attendre son aperçu comme un livrable du plan de l'offre
export const MANUAL_KEY_PREFIX = "ajout-";
export const manualPlannedKey = () => `${MANUAL_KEY_PREFIX}${globalThis.crypto.randomUUID().slice(0, 8)}`;

export function previewPublished(item: { plannedKey?: string; publishedAt?: string; approvedAt?: string }) {
  return !item.plannedKey || Boolean(item.publishedAt);
}

export function pendingPreview(item: { previewPath?: string; storagePath?: string; plannedKey?: string; notifiedPreview?: string }) {
  const path = item.previewPath ?? (!item.plannedKey && mediaKind(item.storagePath) === "image" ? item.storagePath : undefined);
  return path && path !== item.notifiedPreview ? path : null;
}

export function previewsEmail({ offerName, url, labels, paid }: { offerName: string; url: string; labels: string[]; paid: boolean }) {
  return {
    subject: `Tes aperçus sont prêts à être validés — ${offerName}`,
    text: ["Bonjour,", "", `${labels.length} aperçu${labels.length > 1 ? "s" : ""} nouveau${labels.length > 1 ? "x" : ""} ou mis à jour pour ta commande « ${offerName} » :`, ...labels.map((label) => `• ${label}`), "", "Consulte-les dans ton espace commande, puis valide-les ou demande une modification :", url, "", paid ? "Les fichiers HD seront accessibles après validation." : "Les fichiers HD seront accessibles après validation et règlement intégral de la commande.", "", "Garde ce lien privé pour toi.", "", "Aurore — zer0oes gfx"].join("\n"),
  };
}

// Le client peut revenir sur sa validation tant que la commande n'est pas terminée
export function canCancelApproval(order: { status: string }) {
  return order.status !== "terminee";
}

export function deliveryProgress(items: { approvedAt?: string }[]) {
  const done = items.filter((d) => d.approvedAt).length;
  return { done, total: items.length, percent: items.length ? Math.round((done / items.length) * 100) : 0, complete: items.length > 0 && done === items.length };
}

// E-mail de confirmation de commande avec le lien de l'espace commande
export function portalEmail({ offerName, url }: { offerName: string; url: string }) {
  return {
    subject: `Ta commande est confirmée — ${offerName}`,
    eyebrow: "Commande confirmée",
    heading: offerName,
    text: [
      "Bonjour,",
      "",
      `Merci pour ta commande « ${offerName} » !`,
      "",
      "Tout est réuni dans ton espace commande privé :",
      url,
      "",
      "Pour lancer la création, ouvre ta commande et clique sur « Remplir mon brief ».",
      "Tu y retrouveras ton pack et les options sélectionnées, le suivi de ton projet, tes paiements, puis les aperçus à valider et tes fichiers définitifs.",
      "",
      "À très vite,",
      "Aurore — zer0oes gfx",
    ].join("\n"),
  };
}

// Commande entièrement validée par le client (tous les livrables validés) et marquée livrée ou au-delà :
// aperçus et livrables ne peuvent plus être retirés. Repasser la commande « En cours » à la main lève le verrou.
export function deliveryLocked(order: { status: string }, items: { approvedAt?: string }[]) {
  return items.length > 0 && items.every((d) => d.approvedAt) && ["livree", "solde_paye", "terminee"].includes(order.status);
}

export const deliveryLockedMessage = "La commande est entièrement validée : pour retirer un aperçu ou un livrable, repasse d'abord son statut à « En cours ».";

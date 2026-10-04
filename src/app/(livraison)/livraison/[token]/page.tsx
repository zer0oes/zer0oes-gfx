import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProtectedMedia } from "@/components/protection";
import {
  canCancelApproval,
  deliverableTypes,
  deliveryProgress,
  formatBytes,
  isDeliveryToken,
  itemType,
  mediaKind,
  NOTE_MAX_CHARS,
  unlockState,
  type DeliverableType,
} from "@/lib/delivery";
import { formatPrice } from "@/lib/pricing";
import { balanceDue, getStore, type Deliverable, type Order } from "@/lib/store";
import { addClientNoteAction, payBalanceAction, setClientApprovalAction } from "../actions";

// Page privée de livraison d'une commande (accès par lien, sans compte).
// Avant validation : aperçus protégés seulement. Les fichiers HD et liens d'import sont servis
// par /livraison/<jeton>/<id> une fois l'élément validé et le solde réglé (contrôle serveur).
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ta livraison", robots: { index: false, follow: false } };

const dateFmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" });
const dateTimeFmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" });

const notices: Record<string, { text: string; tone: "ok" | "warn" }> = {
  modification: { text: "Merci, ta demande de modification est bien envoyée.", tone: "ok" },
  valide: { text: "C'est validé, merci !", tone: "ok" },
  annule: { text: "Validation annulée.", tone: "warn" },
  vide: { text: "Décris la modification avant de l'envoyer.", tone: "warn" },
  cloturee: { text: "La livraison est clôturée : la validation ne peut plus être annulée.", tone: "warn" },
};

// Aide à l'installation, propre à chaque type d'élément
const help: Record<DeliverableType, string[]> = {
  overlay: [
    "Connecte-toi à StreamElements, puis clique sur « Importer dans StreamElements » : l'overlay s'ajoute à ton compte, déjà réglé.",
    "Ouvre l'overlay, copie son lien (« Copy URL ») et ajoute-le dans OBS comme source « Navigateur » en 1920 × 1080.",
  ],
  widget: [
    "StreamElements : importe le widget, puis ajoute son lien dans OBS comme source « Navigateur ».",
    "Streamlabs : dans le widget concerné, active « Custom HTML/CSS » et colle le code fourni.",
  ],
  alerte: [
    "StreamElements : importe l'overlay d'alertes, puis ajoute son lien dans OBS comme source « Navigateur » en 1920 × 1080.",
    "Streamlabs : dans l'Alert Box, active « Custom HTML/CSS » et colle le code fourni dans les fichiers.",
  ],
  visuel: ["Dans OBS, ajoute une source « Image » et choisis le fichier. Les PNG gardent leur fond transparent."],
  video: ["Dans OBS, ajoute une source « Média », choisis la vidéo et coche « Lecture en boucle ». Les WEBM gardent leur fond transparent."],
  fichier: ["Décompresse l'archive si besoin, puis suis le guide fourni. Pour Streamlabs : « Custom HTML/CSS » dans le widget concerné."],
  guide: ["Ouvre le guide : il reprend pas à pas l'installation de chaque élément."],
};

const card = "rounded-2xl border bg-surface-2 p-4 sm:p-5";
const field = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";

function Notice({ notice }: { notice?: { text: string; tone: "ok" | "warn" } }) {
  if (!notice) return null;
  return (
    <p role="status" className={`text-sm font-medium ${notice.tone === "ok" ? "text-emerald-300" : "text-amber-300"}`}>
      {notice.text}
    </p>
  );
}

function Preview({ d, token }: { d: Deliverable; token: string }) {
  const kind = d.previewPath ? (d.previewType ?? mediaKind(d.previewPath)) : mediaKind(d.storagePath) === "image" ? "image" : null;
  const src = `/livraison/${token}/${d.id}/apercu`;
  if (!kind) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-background px-4 py-3 text-sm text-muted">
        {d.kind === "lien" ? "L'overlay s'importe directement dans ton compte StreamElements une fois validé." : "Pas d'aperçu pour ce fichier."}
      </div>
    );
  }
  if (kind === "video") {
    // Pas de calque de protection par-dessus : il bloquerait les commandes de lecture.
    // Filigrane posé sur la vidéo (sans capter les clics), téléchargement retiré du lecteur.
    return (
      <div className="relative overflow-hidden rounded-xl border border-border bg-background">
        <video src={src} controls muted playsInline preload="metadata" controlsList="nodownload noplaybackrate" disablePictureInPicture className="aspect-video w-full" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-zeroes-gfx.png" alt="" aria-hidden draggable={false} className="pointer-events-none absolute left-1/2 top-[42%] w-2/5 -translate-x-1/2 -translate-y-1/2 opacity-25" />
      </div>
    );
  }
  return (
    <ProtectedMedia className="overflow-hidden rounded-xl border border-border bg-background">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={`Aperçu — ${d.label}`} loading="lazy" draggable={false} className="max-h-[480px] w-full object-contain" />
    </ProtectedMedia>
  );
}

function Item({ d, order, token, notice }: { d: Deliverable; order: Order; token: string; notice?: { text: string; tone: "ok" | "warn" } }) {
  const type = itemType(d);
  const state = unlockState(order, d);
  const cancellable = canCancelApproval(order);
  const hidden = (name: string, value: string) => <input type="hidden" name={name} value={value} />;

  return (
    <li id={`f-${d.id}`} className={`scroll-mt-24 ${card} ${d.approvedAt ? "border-emerald-500/40" : "border-border"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="mr-2 rounded-full bg-accent/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-accent">
            {deliverableTypes.find((t) => t.id === type)?.label}
          </span>
          <span className="font-semibold">{d.label}</span>
          {d.sizeBytes ? <span className="ml-2 text-xs text-muted">{formatBytes(d.sizeBytes)}</span> : null}
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${d.approvedAt ? "bg-emerald-500/15 text-emerald-300" : "bg-background text-muted"}`}>
          {d.approvedAt ? "✓ Validé" : "À valider"}
        </span>
      </div>

      <div className="mt-4">
        <Preview d={d} token={token} />
      </div>

      {(d.clientNotes ?? []).length > 0 && (
        <ul className="mt-4 space-y-2">
          {d.clientNotes!.map((n, i) => (
            <li key={i} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <span className="block text-xs text-muted">Ta demande du {dateTimeFmt.format(new Date(n.at))}</span>
              <span className="whitespace-pre-line">{n.body}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 space-y-3">
        <Notice notice={notice} />
        {state === "a_valider" ? (
          <form action={setClientApprovalAction}>
            {hidden("token", token)}
            {hidden("id", d.id)}
            {hidden("approved", "1")}
            <button className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-background hover:brightness-110">✓ Je valide cet élément</button>
          </form>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold text-emerald-300">✓ Validé le {dateFmt.format(new Date(d.approvedAt!))}</p>
            {state === "debloque" ? (
              <a
                href={`/livraison/${token}/${d.id}`}
                {...(d.kind === "lien" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-background hover:brightness-110"
              >
                {d.kind === "lien" ? "Importer dans StreamElements ↗" : "Télécharger le fichier HD"}
              </a>
            ) : (
              <a href="#solde" className="rounded-full border border-border px-4 py-2 text-sm text-muted hover:text-foreground">
                🔒 Débloqué après règlement du solde
              </a>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-start gap-x-5 gap-y-2">
          {cancellable && (
            <details className="group w-full">
              <summary className="cursor-pointer list-none text-sm text-accent hover:underline [&::-webkit-details-marker]:hidden">
                Demander une modification
              </summary>
              <form action={addClientNoteAction} className="mt-2 space-y-2">
                {hidden("token", token)}
                {hidden("id", d.id)}
                <textarea
                  name="body"
                  rows={3}
                  required
                  maxLength={NOTE_MAX_CHARS}
                  aria-label={`Modification souhaitée — ${d.label}`}
                  placeholder="Ex. le logo pourrait être un peu plus grand sur l'écran de pause"
                  className={field}
                />
                <button className="rounded-full border border-border bg-background px-4 py-2 text-sm hover:border-accent">Envoyer la demande</button>
                {d.approvedAt && <p className="text-xs text-muted">Envoyer une demande annule ta validation de cet élément.</p>}
              </form>
            </details>
          )}
          {d.approvedAt && cancellable && (
            <form action={setClientApprovalAction}>
              {hidden("token", token)}
              {hidden("id", d.id)}
              {hidden("approved", "0")}
              <button className="text-sm text-muted underline-offset-4 hover:text-foreground hover:underline">Annuler ma validation</button>
            </form>
          )}
        </div>

        <details className="rounded-lg border border-border bg-background/60 px-3 py-2 text-sm">
          <summary className="cursor-pointer text-muted">Besoin d&apos;aide pour l&apos;installer ?</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
            {help[type].map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </details>
      </div>
    </li>
  );
}

export default async function DeliveryPage({ params, searchParams }: PageProps<"/livraison/[token]">) {
  const { token } = await params;
  if (!isDeliveryToken(token)) notFound();
  const store = getStore();
  const order = await store.getOrderByDeliveryToken(token);
  if (!order) notFound();
  const items = await store.listDeliverables(order.id);
  const progress = deliveryProgress(items);
  const due = balanceDue(order);
  // Message après une action, affiché sous l'élément concerné (ancre #f-<id>)
  const { retour, f } = await searchParams;
  const notice = typeof retour === "string" ? notices[retour] : undefined;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="rounded-3xl border border-border bg-surface p-5 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.6)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Ta livraison</p>
        <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">{order.offerName}</h1>
        <p className="mt-3 text-muted">Garde ce lien pour toi : c&apos;est ton accès privé à ta livraison.</p>

        {items.length > 0 && (
          <div className="mt-6 rounded-2xl border border-border bg-background p-4" aria-live="polite">
            {progress.complete ? (
              <p className="font-display text-lg font-bold text-emerald-300">✓ Livraison validée</p>
            ) : (
              <p className="text-sm">
                <strong className="font-display text-lg">
                  {progress.done} / {progress.total}
                </strong>{" "}
                élément{progress.total > 1 ? "s" : ""} validé{progress.total > 1 ? "s" : ""}
              </p>
            )}
            <div
              role="progressbar"
              aria-label="Éléments validés"
              aria-valuemin={0}
              aria-valuemax={progress.total}
              aria-valuenow={progress.done}
              className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2"
            >
              <div className={`h-full rounded-full transition-all ${progress.complete ? "bg-emerald-400" : "bg-accent"}`} style={{ width: `${progress.percent}%` }} />
            </div>
            <p className="mt-3 text-xs text-muted">
              🔒 Les aperçus sont protégés jusqu&apos;à validation. Les fichiers HD et liens d&apos;import seront débloqués après
              validation et règlement du solde.
            </p>
          </div>
        )}

        {due > 0 && (
          <div id="solde" className="mt-4 flex scroll-mt-24 flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/5 p-4">
            <div>
              <p className="font-semibold">Solde à régler : {formatPrice(due)} HT</p>
              <p className="text-xs text-muted">
                {retour === "solde"
                  ? "Paiement reçu, merci ! La confirmation peut prendre quelques instants : recharge la page."
                  : retour === "paiement-erreur"
                    ? "Le paiement n'a pas pu démarrer. Réessaie dans un instant ou écris-moi."
                    : "Il débloque tes fichiers HD et liens d'import validés."}
              </p>
            </div>
            {retour !== "solde" && (
              <form action={payBalanceAction}>
                <input type="hidden" name="token" value={token} />
                <button className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-background hover:brightness-110">Régler le solde</button>
              </form>
            )}
          </div>
        )}

        <section aria-labelledby="elements" className="mt-8">
          <h2 id="elements" className="font-display text-xl font-bold">
            Éléments à valider
          </h2>
          {items.length === 0 ? (
            <p className="mt-3 text-muted">Ta livraison est en préparation : reviens un peu plus tard.</p>
          ) : (
            <>
              <p className="mt-1 text-sm text-muted">Regarde chaque aperçu, puis valide-le ou demande une modification.</p>
              <ul className="mt-4 space-y-4">
                {items.map((d) => (
                  <Item key={d.id} d={d} order={order} token={token} notice={f === d.id ? notice : undefined} />
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

    </div>
  );
}

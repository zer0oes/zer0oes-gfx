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
import { filesExpired, filesExpireAt, orderSteps, statusMessage, type Step } from "@/lib/portal";
import { formatPrice } from "@/lib/pricing";
import { balanceDue, getStore, type Deliverable, type Order } from "@/lib/store";
import { addClientNoteAction, payBalanceAction, setClientApprovalAction } from "../actions";

// Espace commande privé du client (accès par lien, sans compte) : statut et étapes du projet,
// paiement, aperçus protégés à valider, puis fichiers définitifs. Ceux-ci sont servis par
// /commande/<jeton>/<id> une fois l'élément validé et le solde réglé (contrôle serveur),
// pendant 90 jours après la clôture du projet.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ta commande", robots: { index: false, follow: false } };

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
  const src = `/commande/${token}/${d.id}/apercu`;
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

function Item({ d, order, token, expired, notice }: { d: Deliverable; order: Order; token: string; expired: boolean; notice?: { text: string; tone: "ok" | "warn" } }) {
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
            {expired ? (
              <span className="text-sm text-muted">Fichier archivé : écris-moi pour le récupérer.</span>
            ) : state === "debloque" ? (
              <a
                href={`/commande/${token}/${d.id}`}
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

// Étapes du projet : brief reçu, création, validation, solde, livraison
function Steps({ steps }: { steps: Step[] }) {
  return (
    <ol className="grid grid-cols-5 gap-1.5" aria-label="Étapes du projet">
      {steps.map((s, i) => (
        <li key={s.id} aria-current={s.state === "en_cours" ? "step" : undefined} className="min-w-0">
          <div
            className={`h-1.5 rounded-full ${s.state === "fait" ? "bg-emerald-400" : s.state === "en_cours" ? "bg-accent" : "bg-surface-2"}`}
          />
          <p className={`mt-2 text-[11px] font-semibold leading-tight sm:text-xs sm:uppercase sm:tracking-wider ${s.state === "a_venir" ? "text-muted/60" : s.state === "en_cours" ? "text-accent" : "text-emerald-300"}`}>
            <span className="hidden sm:inline">{i + 1}. </span>
            {s.label}
          </p>
          <p className="text-[11px] text-muted">{s.state === "fait" ? "✓ fait" : s.state === "en_cours" ? "en cours" : "à venir"}</p>
        </li>
      ))}
    </ol>
  );
}

export default async function OrderPortalPage({ params, searchParams }: PageProps<"/commande/[token]">) {
  const { token } = await params;
  if (!isDeliveryToken(token)) notFound();
  const store = getStore();
  const order = await store.getOrderByDeliveryToken(token);
  if (!order) notFound();
  const items = await store.listDeliverables(order.id);
  const progress = deliveryProgress(items);
  const steps = orderSteps(order, items);
  const due = balanceDue(order);
  const expired = filesExpired(order);
  const expiresAt = filesExpireAt(order);
  // Message après une action, affiché sous l'élément concerné (ancre #f-<id>)
  const { retour, f } = await searchParams;
  const notice = typeof retour === "string" ? notices[retour] : undefined;
  const block = "rounded-2xl border border-border bg-background p-4 sm:p-5";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="rounded-3xl border border-border bg-surface p-5 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.6)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Ta commande</p>
        <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">{order.offerName}</h1>
        <p className="mt-2 text-sm text-muted">
          Commandée le {dateFmt.format(new Date(order.createdAt))} · garde ce lien pour toi : c&apos;est ton accès privé.
        </p>

        {/* Statut et étapes */}
        <section aria-labelledby="statut" className={`mt-6 ${block}`}>
          <h2 id="statut" className="sr-only">
            Statut du projet
          </h2>
          <p className="font-medium" aria-live="polite">
            {statusMessage(steps)}
          </p>
          <div className="mt-4">
            <Steps steps={steps} />
          </div>
          {steps[0].state === "en_cours" && order.stripeSessionId && (
            <a href={`/merci?session_id=${encodeURIComponent(order.stripeSessionId)}`} className="mt-4 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-background hover:brightness-110">
              Remplir mon brief
            </a>
          )}
        </section>

        {/* Paiement */}
        <section id="solde" aria-labelledby="paiement" className={`mt-4 scroll-mt-24 ${block}`}>
          <h2 id="paiement" className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Paiement
          </h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted">Total</dt>
              <dd className="font-display text-lg font-bold">{formatPrice(order.totalPrice)} HT</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">{order.paymentType === "acompte" && due > 0 ? `Acompte payé (${order.depositPercent} %)` : "Déjà payé"}</dt>
              <dd className="font-display text-lg font-bold text-emerald-300">{formatPrice(order.amountPaid)} HT</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Solde restant</dt>
              <dd className={`font-display text-lg font-bold ${due > 0 ? "text-amber-300" : ""}`}>{due > 0 ? `${formatPrice(due)} HT` : "Réglé ✓"}</dd>
            </div>
          </dl>
          {due > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <p className="text-xs text-muted">
                {retour === "solde"
                  ? "Paiement reçu, merci ! La confirmation peut prendre quelques instants : recharge la page."
                  : retour === "paiement-erreur"
                    ? "Le paiement n'a pas pu démarrer. Réessaie dans un instant ou écris-moi."
                    : "Le solde débloque tes fichiers définitifs et liens d'import validés. Tu peux le régler quand tu veux."}
              </p>
              {retour !== "solde" && (
                <form action={payBalanceAction}>
                  <input type="hidden" name="token" value={token} />
                  <button className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-background hover:brightness-110">Régler le solde</button>
                </form>
              )}
            </div>
          )}
        </section>

        {/* Livrables */}
        <section aria-labelledby="elements" className="mt-8">
          <h2 id="elements" className="font-display text-xl font-bold">
            {items.length ? "Éléments à valider" : "Ta création"}
          </h2>
          {items.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Les aperçus de ta création apparaîtront ici dès qu&apos;ils seront prêts : tu recevras un e-mail.</p>
          ) : (
            <>
              <div className={`mt-3 ${block}`}>
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
                  {expired
                    ? "Projet clôturé depuis plus de 90 jours : les fichiers ne sont plus disponibles ici. Écris-moi pour les récupérer."
                    : expiresAt
                      ? `Projet terminé : tes fichiers définitifs restent disponibles ici jusqu'au ${dateFmt.format(expiresAt)}. Pense à les enregistrer.`
                      : "🔒 Les aperçus sont protégés jusqu'à validation. Les fichiers HD et liens d'import seront débloqués après validation et règlement du solde."}
                </p>
              </div>
              <ul className="mt-4 space-y-4">
                {items.map((d) => (
                  <Item key={d.id} d={d} order={order} token={token} expired={expired} notice={f === d.id ? notice : undefined} />
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

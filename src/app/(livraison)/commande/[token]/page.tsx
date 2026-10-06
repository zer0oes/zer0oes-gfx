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
import { href, intlLocale, type Locale } from "@/lib/i18n";
import { filesExpired, filesExpireAt, orderSteps, statusMessage, type Step } from "@/lib/portal";
import { formatPrice } from "@/lib/pricing";
import { requestLocale } from "@/lib/request-locale";
import { balanceDue, getStore, type Deliverable, type Order } from "@/lib/store";
import { trOfferName } from "@/lib/translations-en";
import { addClientNoteAction, payBalanceAction, setClientApprovalAction } from "../actions";

// Espace commande privé du client (accès par lien, sans compte) : statut et étapes du projet,
// paiement, aperçus protégés à valider, puis fichiers définitifs. Ceux-ci sont servis par
// /commande/<jeton>/<id> une fois l'élément validé et le solde réglé (contrôle serveur),
// pendant 6 mois après la clôture du projet. Français ou anglais selon le visiteur.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await requestLocale();
  return { title: locale === "en" ? "Your order" : "Ta commande", robots: { index: false, follow: false } };
}

type Notice = { text: string; tone: "ok" | "warn" };

const texts = {
  fr: {
    notices: {
      modification: { text: "Merci, ta demande de modification est bien envoyée.", tone: "ok" },
      valide: { text: "C'est validé, merci !", tone: "ok" },
      annule: { text: "Validation annulée.", tone: "warn" },
      vide: { text: "Décris la modification avant de l'envoyer.", tone: "warn" },
      cloturee: { text: "La livraison est clôturée : la validation ne peut plus être annulée.", tone: "warn" },
    } as Record<string, Notice>,
    help: {
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
    } as Record<DeliverableType, string[]>,
    types: {} as Partial<Record<DeliverableType, string>>,
    noPreviewLink: "L'overlay s'importe directement dans ton compte StreamElements une fois validé.",
    noPreview: "Pas d'aperçu pour ce fichier.",
    previewAlt: "Aperçu",
    approved: "✓ Validé",
    toApprove: "À valider",
    yourRequest: "Ta demande du",
    approve: "✓ Je valide cet élément",
    approvedOn: "✓ Validé le",
    archived: "Fichier archivé : écris-moi pour le récupérer.",
    importSe: "Importer dans StreamElements ↗",
    download: "Télécharger le fichier HD",
    locked: "🔒 Débloqué après règlement du solde",
    requestChange: "Demander une modification",
    changeLabel: "Modification souhaitée",
    changePlaceholder: "Ex. le logo pourrait être un peu plus grand sur l'écran de pause",
    sendRequest: "Envoyer la demande",
    requestCancels: "Envoyer une demande annule ta validation de cet élément.",
    cancelApproval: "Annuler ma validation",
    helpTitle: "Besoin d'aide pour l'installer ?",
    stepsLabel: "Étapes du projet",
    done: "✓ fait",
    ongoing: "en cours",
    upcoming: "à venir",
    yourOrder: "Ta commande",
    orderedOn: (d: string) => `Commandée le ${d} · garde ce lien pour toi : c'est ton accès privé.`,
    status: "Statut du projet",
    fillBrief: "Remplir mon brief",
    payment: "Paiement",
    total: "Total",
    depositPaid: (p: number) => `Acompte payé (${p} %)`,
    alreadyPaid: "Déjà payé",
    balanceLeft: "Solde restant",
    settled: "Réglé ✓",
    balancePaid: "Paiement reçu, merci ! La confirmation peut prendre quelques instants : recharge la page.",
    balanceError: "Le paiement n'a pas pu démarrer. Réessaie dans un instant ou écris-moi.",
    balanceHint: "Le solde débloque tes fichiers définitifs et liens d'import validés. Tu peux le régler quand tu veux.",
    payBalance: "Régler le solde",
    toApproveTitle: "Éléments à valider",
    yourCreation: "Ta création",
    previewsSoon: "Les aperçus de ta création apparaîtront ici dès qu'ils seront prêts : tu recevras un e-mail.",
    deliveryApproved: "✓ Livraison validée",
    validated: (n: number) => `élément${n > 1 ? "s" : ""} validé${n > 1 ? "s" : ""}`,
    approvedItems: "Éléments validés",
    expired: "Projet clôturé depuis plus de 6 mois : les fichiers ne sont plus disponibles ici. Écris-moi pour les récupérer.",
    expiresAt: (d: string) => `Projet terminé : tes fichiers définitifs restent disponibles ici jusqu'au ${d}. Pense à les enregistrer.`,
    protectedHint: "🔒 Les aperçus sont protégés jusqu'à validation. Les fichiers HD et liens d'import seront débloqués après validation et règlement du solde.",
  },
  en: {
    notices: {
      modification: { text: "Thank you, your change request has been sent.", tone: "ok" },
      valide: { text: "Approved, thank you!", tone: "ok" },
      annule: { text: "Approval cancelled.", tone: "warn" },
      vide: { text: "Describe the change before sending it.", tone: "warn" },
      cloturee: { text: "The delivery is closed: the approval can no longer be cancelled.", tone: "warn" },
    } as Record<string, Notice>,
    help: {
      overlay: [
        "Log in to StreamElements, then click “Import into StreamElements”: the overlay is added to your account, already set up.",
        "Open the overlay, copy its link (“Copy URL”) and add it to OBS as a “Browser” source at 1920 × 1080.",
      ],
      widget: [
        "StreamElements: import the widget, then add its link to OBS as a “Browser” source.",
        "Streamlabs: in the relevant widget, enable “Custom HTML/CSS” and paste the provided code.",
      ],
      alerte: [
        "StreamElements: import the alerts overlay, then add its link to OBS as a “Browser” source at 1920 × 1080.",
        "Streamlabs: in the Alert Box, enable “Custom HTML/CSS” and paste the provided code into the files.",
      ],
      visuel: ["In OBS, add an “Image” source and choose the file. PNGs keep their transparent background."],
      video: ["In OBS, add a “Media” source, choose the video and tick “Loop”. WEBMs keep their transparent background."],
      fichier: ["Unzip the archive if needed, then follow the included guide. For Streamlabs: “Custom HTML/CSS” in the relevant widget."],
      guide: ["Open the guide: it walks you through installing each item step by step."],
    } as Record<DeliverableType, string[]>,
    types: { alerte: "Alerts", visuel: "Visual", video: "Video", fichier: "File" } as Partial<Record<DeliverableType, string>>,
    noPreviewLink: "The overlay is imported directly into your StreamElements account once approved.",
    noPreview: "No preview for this file.",
    previewAlt: "Preview",
    approved: "✓ Approved",
    toApprove: "To approve",
    yourRequest: "Your request of",
    approve: "✓ I approve this item",
    approvedOn: "✓ Approved on",
    archived: "File archived: write to me to get it back.",
    importSe: "Import into StreamElements ↗",
    download: "Download the HD file",
    locked: "🔒 Unlocked once the balance is paid",
    requestChange: "Request a change",
    changeLabel: "Requested change",
    changePlaceholder: "E.g. the logo could be a bit bigger on the break screen",
    sendRequest: "Send the request",
    requestCancels: "Sending a request cancels your approval of this item.",
    cancelApproval: "Cancel my approval",
    helpTitle: "Need help installing it?",
    stepsLabel: "Project steps",
    done: "✓ done",
    ongoing: "in progress",
    upcoming: "upcoming",
    yourOrder: "Your order",
    orderedOn: (d: string) => `Ordered on ${d} · keep this link to yourself: it is your private access.`,
    status: "Project status",
    fillBrief: "Fill in my brief",
    payment: "Payment",
    total: "Total",
    depositPaid: (p: number) => `Deposit paid (${p}%)`,
    alreadyPaid: "Already paid",
    balanceLeft: "Balance due",
    settled: "Paid ✓",
    balancePaid: "Payment received, thank you! The confirmation may take a few moments: reload the page.",
    balanceError: "The payment could not start. Try again in a moment or write to me.",
    balanceHint: "The balance unlocks your approved final files and import links. You can pay it whenever you like.",
    payBalance: "Pay the balance",
    toApproveTitle: "Items to approve",
    yourCreation: "Your creation",
    previewsSoon: "Your previews will appear here as soon as they are ready: you'll receive an email.",
    deliveryApproved: "✓ Delivery approved",
    validated: (n: number) => `item${n > 1 ? "s" : ""} approved`,
    approvedItems: "Approved items",
    expired: "Project closed more than 6 months ago: the files are no longer available here. Write to me to get them back.",
    expiresAt: (d: string) => `Project complete: your final files remain available here until ${d}. Remember to save them.`,
    protectedHint: "🔒 Previews are protected until approval. HD files and import links will be unlocked after approval and payment of the balance.",
  },
};

type Texts = (typeof texts)["fr"];

const card = "rounded-2xl border bg-surface-2 p-4 sm:p-5";
const field = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";

function NoticeText({ notice }: { notice?: Notice }) {
  if (!notice) return null;
  return (
    <p role="status" className={`text-sm font-medium ${notice.tone === "ok" ? "text-emerald-300" : "text-amber-300"}`}>
      {notice.text}
    </p>
  );
}

function Preview({ d, token, tx }: { d: Deliverable; token: string; tx: Texts }) {
  const kind = d.previewPath ? (d.previewType ?? mediaKind(d.previewPath)) : mediaKind(d.storagePath) === "image" ? "image" : null;
  const src = `/commande/${token}/${d.id}/apercu`;
  if (!kind) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-background px-4 py-3 text-sm text-muted">
        {d.kind === "lien" ? tx.noPreviewLink : tx.noPreview}
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
      <img src={src} alt={`${tx.previewAlt} — ${d.label}`} loading="lazy" draggable={false} className="max-h-[480px] w-full object-contain" />
    </ProtectedMedia>
  );
}

function Item({
  d,
  order,
  token,
  expired,
  notice,
  tx,
  locale,
}: {
  d: Deliverable;
  order: Order;
  token: string;
  expired: boolean;
  notice?: Notice;
  tx: Texts;
  locale: Locale;
}) {
  const type = itemType(d);
  const state = unlockState(order, d);
  const cancellable = canCancelApproval(order);
  const hidden = (name: string, value: string) => <input type="hidden" name={name} value={value} />;
  const dateFmt = new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "long", timeZone: "Europe/Paris" });
  const dateTimeFmt = new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" });

  return (
    <li id={`f-${d.id}`} className={`scroll-mt-24 ${card} ${d.approvedAt ? "border-emerald-500/40" : "border-border"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="mr-2 rounded-full bg-accent/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-accent">
            {tx.types[type] ?? deliverableTypes.find((x) => x.id === type)?.label}
          </span>
          <span className="font-semibold">{d.label}</span>
          {d.sizeBytes ? <span className="ml-2 text-xs text-muted">{formatBytes(d.sizeBytes)}</span> : null}
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${d.approvedAt ? "bg-emerald-500/15 text-emerald-300" : "bg-background text-muted"}`}>
          {d.approvedAt ? tx.approved : tx.toApprove}
        </span>
      </div>

      <div className="mt-4">
        <Preview d={d} token={token} tx={tx} />
      </div>

      {(d.clientNotes ?? []).length > 0 && (
        <ul className="mt-4 space-y-2">
          {d.clientNotes!.map((n, i) => (
            <li key={i} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <span className="block text-xs text-muted">
                {tx.yourRequest} {dateTimeFmt.format(new Date(n.at))}
              </span>
              <span className="whitespace-pre-line">{n.body}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 space-y-3">
        <NoticeText notice={notice} />
        {state === "a_valider" ? (
          <form action={setClientApprovalAction}>
            {hidden("token", token)}
            {hidden("id", d.id)}
            {hidden("approved", "1")}
            <button className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-background hover:brightness-110">{tx.approve}</button>
          </form>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold text-emerald-300">
              {tx.approvedOn} {dateFmt.format(new Date(d.approvedAt!))}
            </p>
            {expired ? (
              <span className="text-sm text-muted">{tx.archived}</span>
            ) : state === "debloque" ? (
              <a
                href={`/commande/${token}/${d.id}`}
                {...(d.kind === "lien" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-background hover:brightness-110"
              >
                {d.kind === "lien" ? tx.importSe : tx.download}
              </a>
            ) : (
              <a href="#solde" className="rounded-full border border-border px-4 py-2 text-sm text-muted hover:text-foreground">
                {tx.locked}
              </a>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-start gap-x-5 gap-y-2">
          {cancellable && (
            <details className="group w-full">
              <summary className="cursor-pointer list-none text-sm text-accent hover:underline [&::-webkit-details-marker]:hidden">{tx.requestChange}</summary>
              <form action={addClientNoteAction} className="mt-2 space-y-2">
                {hidden("token", token)}
                {hidden("id", d.id)}
                <textarea
                  name="body"
                  rows={3}
                  required
                  maxLength={NOTE_MAX_CHARS}
                  aria-label={`${tx.changeLabel} — ${d.label}`}
                  placeholder={tx.changePlaceholder}
                  className={field}
                />
                <button className="rounded-full border border-border bg-background px-4 py-2 text-sm hover:border-accent">{tx.sendRequest}</button>
                {d.approvedAt && <p className="text-xs text-muted">{tx.requestCancels}</p>}
              </form>
            </details>
          )}
          {d.approvedAt && cancellable && (
            <form action={setClientApprovalAction}>
              {hidden("token", token)}
              {hidden("id", d.id)}
              {hidden("approved", "0")}
              <button className="text-sm text-muted underline-offset-4 hover:text-foreground hover:underline">{tx.cancelApproval}</button>
            </form>
          )}
        </div>

        <details className="rounded-lg border border-border bg-background/60 px-3 py-2 text-sm">
          <summary className="cursor-pointer text-muted">{tx.helpTitle}</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
            {tx.help[type].map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </details>
      </div>
    </li>
  );
}

// Étapes du projet : brief reçu, création, validation, solde, livraison
function Steps({ steps, tx }: { steps: Step[]; tx: Texts }) {
  return (
    <ol className="grid grid-cols-5 gap-1.5" aria-label={tx.stepsLabel}>
      {steps.map((s, i) => (
        <li key={s.id} aria-current={s.state === "en_cours" ? "step" : undefined} className="min-w-0">
          <div className={`h-1.5 rounded-full ${s.state === "fait" ? "bg-emerald-400" : s.state === "en_cours" ? "bg-accent" : "bg-surface-2"}`} />
          <p
            className={`mt-2 text-[11px] font-semibold leading-tight sm:text-xs sm:uppercase sm:tracking-wider ${
              s.state === "a_venir" ? "text-muted/60" : s.state === "en_cours" ? "text-accent" : "text-emerald-300"
            }`}
          >
            <span className="hidden sm:inline">{i + 1}. </span>
            {s.label}
          </p>
          <p className="text-[11px] text-muted">{s.state === "fait" ? tx.done : s.state === "en_cours" ? tx.ongoing : tx.upcoming}</p>
        </li>
      ))}
    </ol>
  );
}

export default async function OrderPortalPage({ params, searchParams }: PageProps<"/commande/[token]">) {
  const { token } = await params;
  if (!isDeliveryToken(token)) notFound();
  const locale = await requestLocale();
  const tx = texts[locale];
  const store = getStore();
  const order = await store.getOrderByDeliveryToken(token);
  if (!order) notFound();
  const items = await store.listDeliverables(order.id);
  const progress = deliveryProgress(items);
  const steps = orderSteps(order, items, locale);
  const due = balanceDue(order);
  const expired = filesExpired(order);
  const expiresAt = filesExpireAt(order);
  const dateFmt = new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "long", timeZone: "Europe/Paris" });
  const price = (cents: number) => formatPrice(cents, locale);
  // Message après une action, affiché sous l'élément concerné (ancre #f-<id>)
  const { retour, f } = await searchParams;
  const notice = typeof retour === "string" ? tx.notices[retour] : undefined;
  const block = "rounded-2xl border border-border bg-background p-4 sm:p-5";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="rounded-3xl border border-border bg-surface p-5 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.6)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{tx.yourOrder}</p>
        <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">{trOfferName(locale, order.offerName)}</h1>
        <p className="mt-2 text-sm text-muted">{tx.orderedOn(dateFmt.format(new Date(order.createdAt)))}</p>

        {/* Statut et étapes */}
        <section aria-labelledby="statut" className={`mt-6 ${block}`}>
          <h2 id="statut" className="sr-only">
            {tx.status}
          </h2>
          <p className="font-medium" aria-live="polite">
            {statusMessage(steps, locale)}
          </p>
          <div className="mt-4">
            <Steps steps={steps} tx={tx} />
          </div>
          {steps[0].state === "en_cours" && order.stripeSessionId && (
            <a
              href={`${href(locale, "/merci")}?session_id=${encodeURIComponent(order.stripeSessionId)}`}
              className="mt-4 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-background hover:brightness-110"
            >
              {tx.fillBrief}
            </a>
          )}
        </section>

        {/* Paiement */}
        <section id="solde" aria-labelledby="paiement" className={`mt-4 scroll-mt-24 ${block}`}>
          <h2 id="paiement" className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            {tx.payment}
          </h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted">{tx.total}</dt>
              <dd className="font-display text-lg font-bold">{price(order.totalPrice)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">{order.paymentType === "acompte" && due > 0 ? tx.depositPaid(order.depositPercent) : tx.alreadyPaid}</dt>
              <dd className="font-display text-lg font-bold text-emerald-300">{price(order.amountPaid)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">{tx.balanceLeft}</dt>
              <dd className={`font-display text-lg font-bold ${due > 0 ? "text-amber-300" : ""}`}>{due > 0 ? price(due) : tx.settled}</dd>
            </div>
          </dl>
          {due > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <p className="text-xs text-muted">{retour === "solde" ? tx.balancePaid : retour === "paiement-erreur" ? tx.balanceError : tx.balanceHint}</p>
              {retour !== "solde" && (
                <form action={payBalanceAction}>
                  <input type="hidden" name="token" value={token} />
                  <button className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-background hover:brightness-110">{tx.payBalance}</button>
                </form>
              )}
            </div>
          )}
        </section>

        {/* Livrables */}
        <section aria-labelledby="elements" className="mt-8">
          <h2 id="elements" className="font-display text-xl font-bold">
            {items.length ? tx.toApproveTitle : tx.yourCreation}
          </h2>
          {items.length === 0 ? (
            <p className="mt-2 text-sm text-muted">{tx.previewsSoon}</p>
          ) : (
            <>
              <div className={`mt-3 ${block}`}>
                {progress.complete ? (
                  <p className="font-display text-lg font-bold text-emerald-300">{tx.deliveryApproved}</p>
                ) : (
                  <p className="text-sm">
                    <strong className="font-display text-lg">
                      {progress.done} / {progress.total}
                    </strong>{" "}
                    {tx.validated(progress.total)}
                  </p>
                )}
                <div
                  role="progressbar"
                  aria-label={tx.approvedItems}
                  aria-valuemin={0}
                  aria-valuemax={progress.total}
                  aria-valuenow={progress.done}
                  className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2"
                >
                  <div className={`h-full rounded-full transition-all ${progress.complete ? "bg-emerald-400" : "bg-accent"}`} style={{ width: `${progress.percent}%` }} />
                </div>
                <p className="mt-3 text-xs text-muted">{expired ? tx.expired : expiresAt ? tx.expiresAt(dateFmt.format(expiresAt)) : tx.protectedHint}</p>
              </div>
              <ul className="mt-4 space-y-4">
                {items.map((d) => (
                  <Item key={d.id} d={d} order={order} token={token} expired={expired} notice={f === d.id ? notice : undefined} tx={tx} locale={locale} />
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

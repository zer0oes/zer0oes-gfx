import { ArchiveDownload } from "@/components/ArchiveDownload";
import { ApproveAllButton } from "@/components/ApproveAllButton";
import { QuoteBrief } from "@/components/QuoteBrief";
import { syncQuotePayment } from "@/lib/orders";
import { DeliverableCard } from "@/components/DeliverableCard";
import { allFinalsAccessed, hasFinalAccess } from "@/lib/final-downloads";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderPreview } from "@/components/OrderPreview";
import { ClientTestimonialForm } from "@/components/ClientTestimonialForm";
import { PreviewActions } from "@/components/PreviewActions";
import { OrderLiveRefresh } from "@/components/OrderLiveRefresh";
import { deliveryState } from "@/lib/delivery-plan";
import { previewHistory } from "@/lib/preview-history";
import { canDownloadArchive } from "@/lib/order-archive";
import {
  canCancelApproval,
  correctionPending,
  deliverableTypes,
  deliveryProgress,
  formatBytes,
  isDeliveryToken,
  itemType,
  mediaKind,
  NOTE_MAX_CHARS,
  itemRevisionLimit,
  unlockState,
  previewPublished,
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
      "deja-valide": { text: "Annule ta validation avant de demander une modification.", tone: "warn" },
      telecharge: { text: "La validation est verrouillée depuis le premier accès à un fichier final.", tone: "warn" },
      limite: { text: "Toutes les corrections incluses pour cet élément ont été utilisées. Contacte-moi pour une autre correction.", tone: "warn" },
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
    approve: "Valider cet élément",
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
    expiresAt: (d: string) => `Tes fichiers restent disponibles jusqu’au ${d}. Pense à les sauvegarder.`,
    protectedHint: "🔒 Les aperçus sont protégés jusqu'à validation. Les fichiers HD et liens d'import seront débloqués après validation et règlement du solde.",
  },
  en: {
    notices: {
      "deja-valide": { text: "Cancel your approval before requesting a change.", tone: "warn" },
      telecharge: { text: "Approval is locked since the first access to a final file.", tone: "warn" },
      limite: { text: "All included corrections for this item have been used. Contact me for further changes.", tone: "warn" },
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
    approve: "Approve this item",
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

function DownloadIcon() {
  return <svg aria-hidden="true" data-icon="download" viewBox="0 0 24 24" className="size-5 shrink-0" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" /></svg>;
}

function NoticeText({ notice }: { notice?: Notice }) {
  if (!notice) return null;
  return (
    <p role="status" className={`text-sm font-medium ${notice.tone === "ok" ? "text-emerald-300" : "text-amber-300"}`}>
      {notice.text}
    </p>
  );
}

function Preview({ d, token, tx }: { d: Deliverable; token: string; tx: Texts }) {
  const kind = d.previewPath ? (d.previewType ?? mediaKind(d.previewPath)) : d.previewVersions?.length ? "image" : mediaKind(d.storagePath) === "image" ? "image" : null;
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
    <OrderPreview src={src} alt={`${tx.previewAlt} — ${d.label}`} en={tx.previewAlt === "Preview"} />
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
  const downloaded = allFinalsAccessed(d);
  const state = unlockState(order, d);
  const published = previewPublished(d) || Boolean(d.previewVersions?.length);
  const waitingCorrection = correctionPending(d);
  const finalCount = (d.finalAssets?.length ?? 0) + (d.storagePath || d.url ? 1 : 0);
  const cancellable = canCancelApproval(order) && !hasFinalAccess(d);
  const versions = previewHistory(d);
  const currentNotes = versions.length ? versions.at(-1)!.notes : d.clientNotes ?? [];
  const revisionsLeft = Math.max(0, itemRevisionLimit(order) - (d.clientNotes?.length ?? 0));
  const hidden = (name: string, value: string) => <input type="hidden" name={name} value={value} />;
  const dateFmt = new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "long", timeZone: "Europe/Paris" });
  const dateTimeFmt = new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" });

  if (!published) return (
    <li id={`f-${d.id}`} className="flex scroll-mt-24 items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm">
      <span className="font-medium">{d.label}<span className="mt-1 block text-xs font-normal text-muted">{d.clientNotes?.length ?? 0}/{itemRevisionLimit(order)} {locale === "en" ? "corrections used" : "corrections utilisées"}</span>{finalCount > 0 && <span className="mt-1 block text-xs font-normal text-muted">{locale === "en" ? `${finalCount} final file(s) / link(s) prepared · locked` : `${finalCount} fichier(s) / lien(s) final(aux) préparé(s) · verrouillés`}</span>}</span>
      <span className={`shrink-0 text-xs ${d.previewPath ? "text-accent" : "text-muted"}`}>{d.previewPath ? (locale === "en" ? "Preview awaiting publication" : "Aperçu en attente de publication") : (locale === "en" ? "Preparing" : "À préparer")}</span>
    </li>
  );

  return (
    <li id={`f-${d.id}`} className="scroll-mt-24">
      <DeliverableCard downloaded={downloaded} className={`${card} ${downloaded ? "border-accent" : d.approvedAt ? "border-emerald-500/40" : "border-border"}`} summary={(
<div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="mr-2 rounded-full bg-accent/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-accent">
            {tx.types[type] ?? deliverableTypes.find((x) => x.id === type)?.label}
          </span>
          <span className="font-semibold">{d.label}</span>
          {d.sizeBytes ? <span className="ml-2 text-xs text-muted">{formatBytes(d.sizeBytes)}</span> : null}
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${d.approvedAt ? "bg-emerald-500/15 text-emerald-300" : "bg-background text-muted"}`}>
          {waitingCorrection ? (locale === "en" ? "Correction requested" : "Correction demandée") : d.plannedKey ? (locale === "en" ? ({ "À préparer": "Preparing", "À valider": "Awaiting approval", "Correction demandée": "Correction requested", "Validé": "Approved", "Téléchargé": "Downloaded", "Prêt à télécharger": "Ready to download" }[deliveryState(order, d)]) : deliveryState(order, d)) : d.approvedAt ? tx.approved : tx.toApprove}
        </span>
      </div>
      )}>
      <p className="mt-3 text-sm text-muted">{d.clientNotes?.length ?? 0}/{itemRevisionLimit(order)} {locale === "en" ? "corrections used" : "corrections utilisées"}</p>
      <div className="mt-4">
        <Preview d={d} token={token} tx={tx} />
      </div>
      {finalCount > 0 && state !== "debloque" && <p className="mt-3 text-xs text-muted">{locale === "en" ? `${finalCount} final file(s) / link(s) prepared. Available after approval and full payment.` : `${finalCount} fichier(s) / lien(s) final(aux) préparé(s). Accessibles après validation et paiement intégral.`}</p>}

      {currentNotes.length > 0 && (
        <ul className="mt-4 space-y-2">
          {currentNotes.map((n, i) => (
            <li key={i} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <span className="block text-xs text-muted">
                {tx.yourRequest} {dateTimeFmt.format(new Date(n.at))}
              </span>
              <span className="whitespace-pre-line">{n.body}</span>
            </li>
          ))}
        </ul>
      )}

      {versions.length > 1 && <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-muted">{locale === "en" ? "Preview versions" : "Historique des versions"} ({versions.length - 1})</summary>
        <div className="mt-3 space-y-3">{versions.slice(0, -1).map((v, i) => <div key={`${v.path}-${i}`}><p className="mb-2 text-xs text-muted">Version {i + 1} · {dateTimeFmt.format(new Date(v.publishedAt))}</p><OrderPreview src={`/commande/${token}/${d.id}/apercu?version=${i}`} alt={`${tx.previewAlt} — ${d.label} · ${i + 1}`} en={locale === "en"} /><ul className="mt-3 space-y-2">{v.notes.map((note, index) => <li key={index} className="rounded-lg border border-border p-3"><p className="text-xs text-muted">{tx.yourRequest} {dateTimeFmt.format(new Date(note.at))}</p><p className="mt-1 whitespace-pre-line">{note.body}</p></li>)}</ul></div>)}</div>
      </details>}
      {waitingCorrection && <p role="status" className="mt-4 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm">{locale === "en" ? "Your request has been received. You’ll be notified when the new version is ready." : "Ta demande a été reçue. Tu seras prévenu lorsque la nouvelle version sera prête."}</p>}
      {published && !waitingCorrection && <div className="mt-4 space-y-3">
        <NoticeText notice={notice} />
        {state === "a_valider" && <p className="text-sm text-muted">{locale === "en" ? "You confirm that this version suits you. You can cancel your approval until the first download of a final file." : "Tu confirmes que cette version te convient. Tu peux annuler ta validation jusqu’au premier téléchargement d’un fichier final."}</p>}
        <PreviewActions
          label={tx.requestChange}
          approval={state === "a_valider" ? (
<form action={setClientApprovalAction}>
            {hidden("token", token)}
            {hidden("id", d.id)}
            {hidden("approved", "1")}
            <button disabled={Boolean(d.plannedKey && !d.previewPath)} className="flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-5 py-3 text-center text-sm font-semibold leading-5 text-background hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40">{tx.approve}</button>
          </form>
          ) : undefined}
          correction={cancellable && !d.approvedAt && revisionsLeft > 0 ? (
<form action={addClientNoteAction} className="mt-2 space-y-2">
                {hidden("token", token)}
                {hidden("id", d.id)}
                <p className="text-sm text-muted">{locale === "en" ? `${revisionsLeft} change request${revisionsLeft === 1 ? "" : "s"} remaining for this item` : `${revisionsLeft} modification${revisionsLeft === 1 ? "" : "s"} restante${revisionsLeft === 1 ? "" : "s"} pour cet élément`}</p>
                <textarea
                  name="body"
                  rows={3}
                  disabled={revisionsLeft === 0}
                  required
                  maxLength={NOTE_MAX_CHARS}
                  aria-label={`${tx.changeLabel} — ${d.label}`}
                  placeholder={tx.changePlaceholder}
                  className={field}
                />
                <button disabled={revisionsLeft === 0} className="rounded-full border border-border bg-background px-4 py-2 text-sm hover:border-accent disabled:opacity-40">{tx.sendRequest}</button>
                {d.approvedAt && <p className="text-xs text-muted">{tx.requestCancels}</p>}
              </form>
          ) : undefined}
        />
        {state !== "a_valider" && (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold text-emerald-300">
              {tx.approvedOn} {dateFmt.format(new Date(d.approvedAt!))}
            </p>
            {expired ? (
              <span className="text-sm text-muted">{tx.archived}</span>
            ) : state === "debloque" && d.finalAssets?.length ? (
              <div className="ml-auto flex flex-wrap justify-end gap-2">{d.finalAssets.map((asset, index) => <a key={index} href={`/commande/${token}/${d.id}?asset=${index}`} target={asset.url ? "_blank" : undefined} rel={asset.url ? "noopener noreferrer" : undefined} className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-background"><DownloadIcon />{asset.label}</a>)}</div>
            ) : state === "debloque" && !d.storagePath && !d.url ? (
              <span className="text-sm text-muted">{locale === "en" ? "Final files are being prepared." : "Les fichiers finaux sont en préparation."}</span>
            ) : state === "debloque" ? (
              <a
                href={`/commande/${token}/${d.id}`}
                {...(d.kind === "lien" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="ml-auto inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-background hover:brightness-110"
              >
                <DownloadIcon />{d.kind === "lien" ? tx.importSe : tx.download}
              </a>
            ) : (
              <a href="#solde" className="rounded-full border border-border px-4 py-2 text-sm text-muted hover:text-foreground">
                {tx.locked}
              </a>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-start gap-x-5 gap-y-2">
          {d.approvedAt && cancellable && (
            <form action={setClientApprovalAction}>
              {hidden("token", token)}
              {hidden("id", d.id)}
              {hidden("approved", "0")}
              <button className="text-sm text-muted underline-offset-4 hover:text-foreground hover:underline">{tx.cancelApproval}</button>
            </form>
          )}
        </div>

        {state === "debloque" && ["overlay", "widget", "alerte"].includes(type) && (d.storagePath || d.url || d.finalAssets?.length) ? <details className="rounded-lg border border-border bg-background/60 px-3 py-2 text-sm">
          <summary className="cursor-pointer text-muted">{tx.helpTitle}</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
            {tx.help[type].map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </details> : null}
      </div>}
      </DeliverableCard>
    </li>
  );
}

// Étapes du projet : brief reçu, création, validation, solde, livraison
function Steps({ steps, tx }: { steps: Step[]; tx: Texts }) {
  return (
    <ol className="grid w-full gap-1.5" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }} aria-label={tx.stepsLabel}>
      {steps.map((s, i) => (
        <li key={s.id} aria-current={s.state === "en_cours" ? "step" : undefined} className="min-w-0">
          <div className={`h-1.5 rounded-full ${s.state === "fait" ? "bg-emerald-400" : s.state === "en_cours" ? "bg-accent" : "bg-surface-2"}`} />
          <p
            className={`mt-2 text-[11px] font-semibold leading-tight sm:text-xs sm:uppercase sm:tracking-wider ${
              s.state === "a_venir" ? "text-muted/60" : s.state === "en_cours" ? "text-accent" : "text-emerald-300"
            }`}
          >
            <span className="hidden sm:inline">{i + 1}. </span>
            {s.id === "brief" ? "Brief" : s.label}
          </p>
          <p className="text-[11px] text-muted">{s.id === "brief" && s.state === "en_cours" ? (tx.fillBrief === "Remplir mon brief" ? "À compléter" : "To complete") : s.state === "fait" ? tx.done : s.state === "en_cours" ? tx.ongoing : tx.upcoming}</p>
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
  let order = await store.getOrderByDeliveryToken(token);
  if (!order) notFound();
  order = await syncQuotePayment(order);
  const projectQuote = order.packId === "sur-mesure" ? await store.getQuoteByToken(token) : null;
  const items = await store.listDeliverables(order.id);
  const briefLocked = Boolean(order.deliveredAt) || items.some(previewPublished) || (order.briefRevisions?.length ?? 0) >= 2 || order.status === "terminee";
  const latestBriefAt = order.briefRevisions?.at(-1)?.at ?? order.briefReceivedAt;
  const progress = deliveryProgress(items);
  const steps = orderSteps({ ...order, ...(projectQuote ? { briefCompleted: Boolean(projectQuote.briefCompletedAt) } : {}) }, items, locale);
  const due = balanceDue(order);
  const expired = filesExpired(order);
  const downloadedCount = items.filter(allFinalsAccessed).length;
  const allDownloaded = items.length > 0 && downloadedCount === items.length;
  const finalFilesAvailable = !expired && canDownloadArchive(order, items);
  const expiresAt = filesExpireAt(order);
  if (expired) return <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6"><section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
    <h1 className="font-display text-2xl font-bold">{locale === "en" ? "Download access has expired" : "L’accès aux téléchargements a expiré"}</h1>
    <p className="mt-4 text-muted">{locale === "en" ? "Your files were available for six months after your project was completed. Your order history has been retained. Contact me if you need help retrieving your files." : "Tes fichiers étaient disponibles pendant six mois après la clôture du projet. L’historique de ta commande est conservé. Contacte-moi si tu as besoin de récupérer tes fichiers."}</p>
    <a href={href(locale, "/contact")} className="mt-6 inline-flex rounded-full bg-accent px-5 py-2.5 font-semibold text-background">{locale === "en" ? "Contact me" : "Me contacter"}</a>
  </section></div>;
  const dateFmt = new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "long", timeZone: "Europe/Paris" });
  const price = (cents: number) => formatPrice(cents, locale);
  // Message après une action, affiché sous l'élément concerné (ancre #f-<id>)
  const { retour, f } = await searchParams;
  const notice = typeof retour === "string" ? tx.notices[retour] : undefined;
  const block = "rounded-2xl border border-border bg-background p-4 sm:p-5";
  const canApproveAll = items.length > 0 && items.every((item) => previewPublished(item) && !correctionPending(item) && (!item.plannedKey || item.previewPath));
  const downloadsLockedByBalance = due > 0 && order.amountPaid > 0;
  const paymentPanel = (
      <>
        {downloadsLockedByBalance && <section className="mt-4 rounded-2xl border border-accent/60 bg-accent/10 p-5 sm:p-6" aria-labelledby="unlock-downloads">
          <h3 id="unlock-downloads" className="font-display text-xl font-bold">{locale === "en" ? "Unlock your HD files" : "Débloque tes fichiers HD"}</h3>
          <p className="mt-2 text-sm leading-relaxed">{progress.complete ? (locale === "en" ? "Pay the remaining balance to download your approved files." : "Règle le solde restant pour télécharger tes fichiers validés.") : (locale === "en" ? "Your files will be available after approval and payment of the balance." : "Tes fichiers seront disponibles après validation et règlement du solde.")}</p>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <div><p className="text-xs text-muted">{locale === "en" ? "Remaining balance" : "Solde à régler"}</p><p className="mt-1 font-display text-3xl font-bold text-accent">{price(due)}</p></div>
            <form action={payBalanceAction}><input type="hidden" name="token" value={token} /><button className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-background hover:brightness-110">{locale === "en" ? "Pay the balance on Stripe" : "Régler le solde sur Stripe"}</button></form>
          </div>
          {retour === "paiement-erreur" && <p role="alert" className="mt-3 text-sm text-amber-300">{tx.balanceError}</p>}
        </section>}
        <details id="solde" className={`group/payment mt-4 scroll-mt-24 ${block}`}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent [&::-webkit-details-marker]:hidden">
            {downloadsLockedByBalance ? (locale === "en" ? "Payment breakdown" : "Détail des paiements") : tx.payment}
            {due > 0 && !downloadsLockedByBalance && <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold normal-case tracking-normal text-amber-300">{locale === "en" ? "Balance due" : "Solde restant"} : {price(due)}</span>}
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="ml-auto size-5 shrink-0 transition-transform group-open/payment:rotate-180"><path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" /></svg>
          </summary>
          <dl className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted">{tx.total}</dt>
              <dd className="font-display text-lg font-bold">{price(order.totalPrice)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">{order.paymentType === "acompte" && order.depositPercent > 0 && due > 0 ? tx.depositPaid(order.depositPercent) : tx.alreadyPaid}</dt>
              <dd className="font-display text-lg font-bold text-emerald-300">{price(order.amountPaid)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">{tx.balanceLeft}</dt>
              <dd className={`font-display text-lg font-bold ${due > 0 ? "text-amber-300" : ""}`}>{due > 0 ? price(due) : tx.settled}</dd>
            </div>
          </dl>
          {due > 0 && !downloadsLockedByBalance && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              {order.packId === "sur-mesure" && order.amountPaid === 0 && order.paymentType === "acompte" && order.depositPercent > 0 && <p className="w-full text-sm text-accent">{locale === "en" ? "Deposit due now" : "Acompte à régler maintenant"} : {price(Math.round(order.totalPrice * order.depositPercent / 100))} ({order.depositPercent} %)</p>}
              <p className="text-xs text-muted">{retour === "solde" ? tx.balancePaid : retour === "paiement-erreur" ? tx.balanceError : tx.balanceHint}</p>
              {!downloadsLockedByBalance && (
                <form action={payBalanceAction}>
                  <input type="hidden" name="token" value={token} />
                  <button className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-background hover:brightness-110">{order.packId === "sur-mesure" && order.amountPaid === 0 ? order.paymentType === "acompte" && order.depositPercent > 0 ? (locale === "en" ? "Pay the deposit" : "Régler l’acompte") : (locale === "en" ? "Pay in full" : "Régler la totalité") : tx.payBalance}</button>
                </form>
              )}
            </div>
          )}
        </details>
      </>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <OrderLiveRefresh />
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
            {statusMessage(steps, locale, order.status === "terminee")}
          </p>
          <div className="mt-4">
            <Steps steps={steps} tx={tx} />
          </div>
          {!projectQuote && steps.find((step) => step.id === "brief")?.state === "en_cours" && order.stripeSessionId && (
            <a
              href={`${href(locale, "/merci")}?session_id=${encodeURIComponent(order.stripeSessionId)}`}
              className="mt-4 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-background hover:brightness-110"
            >
              {tx.fillBrief}
            </a>
          )}
        </section>

        {downloadsLockedByBalance && !progress.complete && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/40 bg-amber-400/10 p-4">
          <p className="text-sm font-medium text-amber-200">{locale === "en" ? `HD downloads locked · ${price(due)} balance remaining` : `Téléchargements HD verrouillés · ${price(due)} de solde restant`}</p>
          <a href="#solde" className="text-sm font-semibold text-accent underline underline-offset-4">{locale === "en" ? "View payment" : "Voir le paiement"}</a>
        </div>}

        {order.brief && (!projectQuote || projectQuote.briefCompletedAt) && <details className={`mt-4 ${block}`}>
          <summary className="cursor-pointer font-display text-lg font-bold">{locale === "en" ? "Your brief" : "Ton brief"}</summary>
          {!briefLocked && <p className="mt-2 text-sm text-muted">{locale === "en" ? "Need to clarify your ideas? Edit your brief: I’ll be notified of your changes." : "Besoin de préciser tes idées ? Modifie ton brief : je serai informée de tes changements."}</p>}
          <p className="mt-2 text-sm text-muted">{order.briefRevisions?.length ?? 0} / 2 {locale === "en" ? "updates used" : "modifications utilisées"}</p>
          {briefLocked ? <div className="-mx-4 mt-4 border-t border-border px-4 pt-4 sm:-mx-5 sm:px-5">
            <h3 className="text-sm font-semibold">{locale === "en" ? "Latest brief received · Read only" : "Dernière version reçue · Lecture seule"}</h3>
            {latestBriefAt && <p className="mt-1 text-xs text-muted">{new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" }).format(new Date(latestBriefAt))}</p>}
            <dl className="mt-4 space-y-4">{Object.entries(order.brief).filter(([, value]) => value).map(([label, value]) => <div key={label}><dt className="text-xs font-medium text-muted">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">{value}</dd></div>)}</dl>
            <p className="mt-4 text-xs text-muted">{locale === "en" ? "This brief is locked. Contact me for any further clarification." : "Ce brief est verrouillé. Contacte-moi pour toute précision supplémentaire."}</p>
          </div> : <a href={`${href(locale, "/merci")}?session_id=${encodeURIComponent(order.stripeSessionId)}&modifier=1`} className="mt-3 inline-block rounded-full border border-accent px-5 py-2.5 text-sm font-semibold text-accent hover:bg-accent/10">{locale === "en" ? "Edit my brief" : "Modifier mon brief"}</a>}
        </details>}
        {projectQuote && !projectQuote.briefCompletedAt && <details open className={`mt-4 ${block}`}>
          <summary className="cursor-pointer font-display text-lg font-bold">{locale === "en" ? "Your brief" : "Ton brief"}</summary>
          {order.amountPaid > 0 ? <QuoteBrief requiredFields={projectQuote.requiredBriefFields ?? ["email", "channel", "universe"]} optionalProducts={projectQuote.optionalBriefDeliverables} token={token} email={order.customerEmail} request={projectQuote.request} deliverables={projectQuote.deliverables} /> : <p className="mt-3 text-sm text-muted">{locale === "en" ? "Complete your brief after payment confirmation." : "Le brief sera accessible après confirmation du paiement."}</p>}
        </details>}

        {/* Livrables */}
        <section aria-labelledby="elements" className="mt-8">
          <h2 id="elements" className="font-display text-xl font-bold">
            {progress.complete || finalFilesAvailable ? (locale === "en" ? "Your files" : "Tes fichiers") : items.length && !items.some(previewPublished) ? (locale === "en" ? "Planned deliverables" : "Livrables prévus") : items.length ? tx.toApproveTitle : tx.yourCreation}
          </h2>
          {items.length === 0 ? (
            <p className="mt-2 text-sm text-muted">{tx.previewsSoon}</p>
          ) : (
            <>
              {!items.some(previewPublished) && <p className="mt-2 text-sm text-muted">{locale === "en" ? "You’ll be notified when your previews are ready." : "Tu seras prévenu lorsque les aperçus seront prêts."}</p>}
              {finalFilesAvailable ? <div className={`mt-3 ${block}`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className={`font-display text-lg font-bold ${allDownloaded ? "text-emerald-300" : ""}`}>{allDownloaded ? tx.deliveryApproved : (locale === "en" ? "Your files are ready" : "Tes fichiers sont prêts")}</p>
                    <p className="mt-1 text-sm text-muted">{allDownloaded ? (locale === "en" ? "All your files have been downloaded" : "Tous tes fichiers ont été téléchargés") : (locale === "en" ? `${downloadedCount} of ${items.length} deliverables downloaded` : `${downloadedCount} livrables sur ${items.length} téléchargés`)}</p>
                  </div>
                  <ArchiveDownload url={`/commande/${token}/archive`} en={locale === "en"} label={allDownloaded ? (locale === "en" ? "Download ZIP again" : "Télécharger à nouveau le ZIP") : (locale === "en" ? "Download the ZIP package" : "Télécharger le pack ZIP")} />
                </div>
                <div role="progressbar" aria-label={locale === "en" ? "Downloaded deliverables" : "Livrables téléchargés"} aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={downloadedCount} className="mt-4 h-2 overflow-hidden rounded-full bg-surface-2">
                  <div className={`h-full rounded-full transition-all ${allDownloaded ? "bg-emerald-400" : "bg-accent"}`} style={{ width: `${items.length ? downloadedCount / items.length * 100 : 0}%` }} />
                </div>
              </div> : items.some(previewPublished) && <div className={`mt-3 flex flex-wrap items-center justify-between gap-3 ${block}`}>
                <div className="flex flex-col justify-center gap-1"><p className="text-sm"><strong className="font-display text-lg">{progress.done} / {progress.total}</strong> {tx.validated(progress.total)}</p>{progress.complete && <p className="text-xs text-muted">{due > 0 ? (locale === "en" ? "Unlocked after balance payment" : "Débloqué après règlement du solde") : (locale === "en" ? "Final files are being prepared" : "Fichiers définitifs en préparation")}</p>}</div>
                {progress.complete && <button type="button" disabled title={due > 0 ? (locale === "en" ? "Available after balance payment" : "Disponible après règlement du solde") : (locale === "en" ? "Final files are being prepared" : "Fichiers définitifs en préparation")} className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-background opacity-40"><svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="size-4 shrink-0"><path d="M18 8h-1V6a5 5 0 0 0-10 0v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2ZM9 6a3 3 0 0 1 6 0v2H9Zm3 11a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" /></svg>{locale === "en" ? "Download ZIP" : "Télécharger le ZIP"}</button>}
                {!progress.complete && <ApproveAllButton token={token} disabled={!canApproveAll} en={locale === "en"} />}
              </div>}
              {progress.complete && paymentPanel}
              {progress.complete && due <= 0 && allDownloaded && <ClientTestimonialForm token={token} testimonial={order.testimonial} en={locale === "en"} />}
              {(expired || expiresAt || (!finalFilesAvailable && !progress.complete)) && <p className="mt-3 text-sm text-muted">{expired ? tx.expired : expiresAt ? tx.expiresAt(dateFmt.format(expiresAt)) : due <= 0 ? (locale === "en" ? "Your payment is settled: HD files will be available after approval." : "Ton paiement est réglé : les fichiers HD seront accessibles après validation.") : tx.protectedHint}</p>}
              <ul className="mt-4 space-y-4">
                {items.map((d) => (
                  <Item key={d.id} d={d} order={order} token={token} expired={expired} notice={f === d.id ? notice : undefined} tx={tx} locale={locale} />
                ))}
              </ul>
            </>
          )}
        </section>


        {/* Paiement */}
        {!progress.complete && paymentPanel}

      </div>
    </div>
  );
}

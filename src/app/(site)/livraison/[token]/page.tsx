import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { site } from "@/data/site";
import { formatBytes, isDeliveryToken, NOTE_MAX_CHARS } from "@/lib/delivery";
import { getStore, type Deliverable } from "@/lib/store";
import { addClientNoteAction, setClientApprovalAction } from "../actions";

// Page privée de livraison d'une commande (accès par lien, sans compte).
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ta livraison", robots: { index: false, follow: false } };

const card = "rounded-2xl border border-border bg-surface p-5 sm:p-6";
const dateFmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" });

const notices: Record<string, string> = {
  remarque: "Merci, ta remarque est bien envoyée.",
  valide: "C'est validé, merci !",
  annule: "Validation annulée : tu peux ajouter une remarque.",
  vide: "Écris ta remarque avant de l'envoyer.",
};

// Remarques et validation d'un élément livré
function Feedback({ d, token, notice }: { d: Deliverable; token: string; notice?: string }) {
  const notes = d.clientNotes ?? [];
  return (
    <div className="mt-3 space-y-3 border-t border-border pt-3">
      {notice && (
        <p role="status" className={`text-sm ${notice === notices.vide ? "text-amber-300" : "text-emerald-300"}`}>
          {notice}
        </p>
      )}
      {notes.length > 0 && (
        <ul className="space-y-2">
          {notes.map((n, i) => (
            <li key={i} className="rounded-lg bg-background px-3 py-2 text-sm">
              <span className="block text-xs text-muted">Ta remarque du {dateFmt.format(new Date(n.at))}</span>
              <span className="whitespace-pre-line">{n.body}</span>
            </li>
          ))}
        </ul>
      )}
      {d.approvedAt ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-emerald-300">✓ Validé le {dateFmt.format(new Date(d.approvedAt))}</p>
          <form action={setClientApprovalAction}>
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="id" value={d.id} />
            <input type="hidden" name="approved" value="0" />
            <button className="text-xs text-muted underline-offset-4 hover:text-foreground hover:underline">Annuler la validation</button>
          </form>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <form action={addClientNoteAction} className="space-y-2">
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="id" value={d.id} />
            <label className="block">
              <span className="mb-1 block text-xs text-muted">Une remarque, une correction sur cet élément ?</span>
              <textarea
                name="body"
                rows={2}
                required
                maxLength={NOTE_MAX_CHARS}
                placeholder="Ex. le logo pourrait être un peu plus grand sur l'écran de pause"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
            <button className="rounded-full border border-border px-4 py-2 text-sm hover:border-accent">Envoyer la remarque</button>
          </form>
          <form action={setClientApprovalAction}>
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="id" value={d.id} />
            <input type="hidden" name="approved" value="1" />
            <button className="w-full rounded-full bg-emerald-500/90 px-4 py-2 text-sm font-semibold text-background hover:brightness-110">
              ✓ C&apos;est ok pour moi
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default async function DeliveryPage({ params, searchParams }: PageProps<"/livraison/[token]">) {
  const { token } = await params;
  if (!isDeliveryToken(token)) notFound();
  const store = getStore();
  const order = await store.getOrderByDeliveryToken(token);
  if (!order) notFound();
  const items = await store.listDeliverables(order.id);
  const links = items.filter((d) => d.kind === "lien");
  const files = items.filter((d) => d.kind === "fichier");
  const approved = items.filter((d) => d.approvedAt).length;
  // Message après une remarque ou une validation, affiché sous l'élément concerné (ancre #f-<id>)
  const { retour, f } = await searchParams;
  const notice = typeof retour === "string" ? notices[retour] : undefined;

  const itemRow = (d: Deliverable, action: React.ReactNode, detail?: string) => (
    <li key={d.id} id={`f-${d.id}`} className="scroll-mt-24 rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span>
          <span className="font-medium">{d.label}</span>
          {detail && <span className="ml-2 text-xs text-muted">{detail}</span>}
          {d.approvedAt && <span className="ml-2 text-xs font-semibold text-emerald-300">✓ validé</span>}
        </span>
        {action}
      </div>
      <Feedback d={d} token={token} notice={f === d.id ? notice : undefined} />
    </li>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Ta livraison</p>
      <h1 className="mt-3 font-display text-4xl font-bold">{order.offerName}</h1>
      <p className="mt-3 text-muted">Tout ce qu&apos;il te faut pour lancer ton nouvel univers en live. Garde ce lien pour toi : il donne accès à tes fichiers.</p>
      {items.length > 0 && (
        <p className="mt-4 text-sm text-muted">
          Pour chaque élément, tu peux laisser une remarque ou le valider s&apos;il te convient.{" "}
          <span className={approved === items.length ? "font-semibold text-emerald-300" : "text-foreground"}>
            {approved === items.length ? "Tout est validé, merci !" : `${approved} sur ${items.length} validé${approved > 1 ? "s" : ""}.`}
          </span>
        </p>
      )}

      {links.length > 0 && (
        <section aria-labelledby="importer" className={`mt-10 ${card}`}>
          <h2 id="importer" className="font-display text-xl font-bold">
            Importer sur StreamElements
          </h2>
          <p className="mt-1 text-sm text-muted">Connecte-toi à StreamElements, puis ouvre chaque lien : l&apos;overlay s&apos;ajoute à ton compte, déjà réglé.</p>
          <ul className="mt-4 space-y-3">
            {links.map((d) =>
              itemRow(
                d,
                <a href={d.url} target="_blank" rel="noopener noreferrer" className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-background hover:brightness-110">
                  Importer ↗
                </a>,
              ),
            )}
          </ul>
        </section>
      )}

      {files.length > 0 && (
        <section aria-labelledby="fichiers" className={`mt-6 ${card}`}>
          <h2 id="fichiers" className="font-display text-xl font-bold">
            Tes fichiers
          </h2>
          <p className="mt-1 text-sm text-muted">Visuels, fichiers pour Streamlabs et OBS, guide d&apos;installation.</p>
          <ul className="mt-4 space-y-3">
            {files.map((d) =>
              itemRow(
                d,
                <a href={`/livraison/${token}/${d.id}`} className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:border-accent">
                  Télécharger
                </a>,
                d.sizeBytes ? formatBytes(d.sizeBytes) : undefined,
              ),
            )}
          </ul>
        </section>
      )}

      {items.length === 0 && <p className={`mt-10 ${card} text-muted`}>Ta livraison est en préparation : reviens un peu plus tard.</p>}

      <section aria-labelledby="installation" className="mt-10">
        <h2 id="installation" className="font-display text-xl font-bold">
          Installation en bref
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
          <li>
            <strong className="text-foreground">StreamElements</strong> : après l&apos;import, ouvre l&apos;overlay, copie son lien (« Copy URL ») et ajoute-le dans OBS comme
            source « Navigateur » en 1920 × 1080.
          </li>
          <li>
            <strong className="text-foreground">Streamlabs</strong> : dans le widget concerné (ex. Alert Box), active « Custom HTML/CSS » et colle le code fourni dans les
            fichiers.
          </li>
          <li>
            <strong className="text-foreground">OBS</strong> : les visuels se glissent directement dans tes scènes ; les PNG et WEBM gardent leur fond transparent.
          </li>
        </ul>
        <p className="mt-6 text-sm text-muted">
          Un souci, une question ?{" "}
          <a href={`mailto:${site.email}`} className="text-accent hover:underline">
            {site.email}
          </a>{" "}
          ou{" "}
          <Link href="/contact" className="text-accent hover:underline">
            le formulaire de contact
          </Link>
          .
        </p>
      </section>
    </div>
  );
}

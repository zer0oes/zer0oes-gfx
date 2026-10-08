import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderBriefPanel } from "@/components/admin/OrderBriefPanel";
import { ClientSpaceLinks } from "@/components/admin/DeliveryControls";
import { requireAdmin } from "@/lib/auth";
import { getStore } from "@/lib/store";
import { quoteEditable, quoteLabels } from "@/lib/quotes";
import { formatPrice } from "@/lib/pricing";
import { itemRevisionLimit } from "@/lib/delivery";
import { quoteBriefFields, defaultQuoteRequiredFields } from "@/lib/quote-brief";
import { siteUrl } from "@/lib/site-url";
import { deleteProjectQuote, proposeProjectQuote, sendProjectQuote, saveQuoteBriefRequirements } from "../../../devis-actions";

export const metadata = { title: "Gestion du devis" };
const dateFmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" });
const longFields = new Set(["Projet", "Message", "Inspirations", "Options", "Éléments disponibles"]);
const card = "rounded-2xl border border-border bg-surface p-5 sm:p-6";

export default async function QuotePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const q = await getStore().getQuote((await params).id);
  if (!q) notFound();
  const sp = await searchParams;
  const entries = Object.entries(q.request).filter(([, value]) => value);
  const input = "mt-1 w-full rounded-lg border border-border bg-background p-3 text-sm";
  const published = q.status !== "demande";
  const editable = quoteEditable(q);
  const editing = editable && (!published || sp.modifier === "1");
  const pageUrl = published ? `${await siteUrl()}/devis/${q.token}` : null;
  return <>
    <Link href="/admin/devis" className="text-sm text-muted hover:text-foreground">← Devis</Link>
    <header className={`mt-4 flex flex-wrap items-start justify-between gap-5 ${card}`}>
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-bold">{q.title || "Demande de devis"}</h1>
        <p className="mt-2 text-sm">{q.name} · <a href={`mailto:${q.email}`} className="text-accent hover:underline">{q.email}</a></p>
        <p className="mt-1 text-xs text-muted">Reçue le {dateFmt.format(new Date(q.createdAt))}</p>
      </div>
      <div className="flex flex-col items-end gap-3">
        <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent">{quoteLabels[q.status]}</span>
        {pageUrl && <a href={pageUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-accent hover:underline">Voir l’espace client ↗</a>}
      </div>
    </header>
    <div className="mt-6 space-y-6">
      <OrderBriefPanel unread={false} defaultOpen={!published} summary={`Demande du client · ${q.name} · Reçue le ${new Date(q.createdAt).toLocaleDateString("fr-FR")}`}>
        <div className="space-y-6">
          <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
            {entries.filter(([key]) => !longFields.has(key)).map(([key, value]) => <div key={key} className="min-w-0"><dt className="text-xs font-medium text-muted">{key}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm">{value}</dd></div>)}
          </dl>
          {entries.filter(([key]) => longFields.has(key)).map(([key, value]) => <div key={key} className="border-t border-border pt-4"><h3 className="text-sm font-semibold">{key}</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/85">{value}</p></div>)}
        </div>
      </OrderBriefPanel>
      <section id="proposition" className={`scroll-mt-24 ${card}`}>
        <h2 className="font-semibold">Proposition</h2>
        {q.deliverables.length > 0 && !q.briefCompletedAt && <details className="mt-4 rounded-xl border border-border p-4">
          <summary className="cursor-pointer text-sm font-semibold">Champs du brief : obligatoire ou facultatif</summary>
          <form action={saveQuoteBriefRequirements} className="mt-4 space-y-3">
            <input type="hidden" name="id" value={q.id} /><input type="hidden" name="updatedAt" value={q.updatedAt} />
            <h3 className="text-sm font-semibold">Champs généraux obligatoires</h3>
            <p className="text-xs text-muted">Coche les champs requis. Les champs décochés sont facultatifs.</p>
            <div className="grid gap-3 sm:grid-cols-2">{quoteBriefFields.map((field) => <label key={field.id} className="flex items-center gap-2 text-sm"><input type="checkbox" name="requiredBrief" value={field.id} defaultChecked={(q.requiredBriefFields ?? defaultQuoteRequiredFields).includes(field.id)} />{field.label}</label>)}</div>
            <h3 className="border-t border-border pt-3 text-sm font-semibold">Descriptions des livrables</h3>
            <input type="hidden" name="requiredDeliverablesMode" value="1" />
            <p className="text-xs text-muted">Coche les livrables dont la description est obligatoire.</p>
            {q.deliverables.map((line, i) => <label key={i} className="flex items-start gap-3 text-sm"><input type="checkbox" name="requiredDeliverable" value={line} defaultChecked={!q.optionalBriefDeliverables?.includes(line)} className="mt-1 accent-[var(--accent)]" /><span>{line}</span></label>)}
            <button className="rounded-full border border-accent px-4 py-2 text-sm font-semibold text-accent">Enregistrer les champs du brief</button>
            {sp.brief === "1" && <p role="status" className="text-sm text-emerald-300">Réglages du brief enregistrés.</p>}
          </form>
        </details>}
        <p className="mt-2 text-sm text-muted">{itemRevisionLimit({ packId: "sur-mesure", revisionsIncluded: q.revisionsIncluded }) === 1 ? "1 demande de modification incluse par livrable." : "2 demandes de modification incluses par livrable."}</p>
        {q.status === "refuse" && <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4"><h3 className="text-sm font-semibold text-amber-200">Raison du refus</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm">{q.declineReason || "Le client n’a pas précisé de raison."}</p></div>}
        <p className="mt-1 text-sm text-muted">Prépare la prestation et les livrables : le client accepte ou refuse le devis dans son espace privé.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm">
          {pageUrl ? <ClientSpaceLinks url={pageUrl} /> : <p className="text-muted">Le lien client sera disponible après publication de la proposition.</p>}
        </div>
        {sp.erreur && <p role="alert" className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{sp.erreur === "suppression" ? "Suppression impossible : la demande a changé ou a été convertie en commande. Actualise la page." : sp.erreur === "conflit" ? "La demande a changé. Actualise avant de réessayer." : "Vérifie le titre, le détail, les livrables, le montant et la date de validité."}</p>}
        {(sp.publie || sp.email) && <p role="status" className="mt-3 rounded-lg border border-border bg-background/50 px-3 py-2 text-sm">{sp.email ? sp.email === "envoye" ? "E-mail envoyé au client." : "E-mail non envoyé. Vérifie la configuration ou réessaie. Le lien privé reste disponible." : "Proposition publiée. Tu peux maintenant envoyer son lien au client."}</p>}
        {editing ? <form key={q.updatedAt} action={proposeProjectQuote} className="mt-5 space-y-5">
          <input type="hidden" name="id" value={q.id} /><input type="hidden" name="updatedAt" value={q.updatedAt} />
          <div className="space-y-4 rounded-xl border border-border bg-background/40 p-4">
            <label className="block text-sm font-medium">Titre<input name="title" defaultValue={q.title} required maxLength={200} className={input} /></label>
            <label className="block text-sm font-medium">Détail de la prestation<textarea name="description" defaultValue={q.description} required maxLength={5000} rows={4} className={input} /></label>
            <label className="block text-sm font-medium">Livrables (un par ligne)<textarea name="deliverables" defaultValue={q.deliverables.join("\n")} required rows={5} className={input} /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">Montant total HT (€)<input name="price" defaultValue={q.totalPrice ? q.totalPrice / 100 : ""} type="number" min="0.50" max="1000000" step="0.01" required className={input} /></label>
              <label className="block text-sm font-medium">Valable jusqu’au<input name="validUntil" defaultValue={q.validUntil} type="date" required min={new Date().toISOString().slice(0, 10)} className={input} /></label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="paymentType" value="acompte" /><p className="text-sm text-muted">Le client choisit entre acompte et paiement int?gral ? l?acceptation.</p>
              <label className="block text-sm font-medium">Acompte (%)<input name="depositPercent" type="number" min="1" max="99" step="1" defaultValue={q.depositPercent || 30} className={input} /><span className="mt-1 block text-xs text-muted">Utilisé uniquement pour le paiement avec acompte.</span></label>
            </div>
          </div>
          <div className="flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">L’acceptation crée une commande sans enregistrer de paiement.</p>
            <button className="shrink-0 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-background">{published ? "Enregistrer les modifications" : "Publier la proposition"}</button>
          </div>
        </form> : <>
          <div className="mt-5 rounded-xl border border-border bg-background/40 p-4"><h3 className="text-sm font-semibold">Prestation proposée</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{q.description}</p></div>
          <div className="mt-5 overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead className="bg-background/50 text-xs text-muted"><tr><th scope="col" className="px-3 py-3 font-medium">Livrable</th><th scope="col" className="px-3 py-3 font-medium">Statut du devis</th></tr></thead>
              <tbody className="divide-y divide-border">{q.deliverables.map((s, i) => <tr key={i}><td className="px-3 py-3 font-medium">{s}</td><td className="px-3 py-3"><span className="inline-flex whitespace-nowrap rounded-full border border-border bg-background/50 px-3 py-1.5 text-xs font-semibold">{quoteLabels[q.status]}</span></td></tr>)}</tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-muted">{q.deliverables.length} livrable{q.deliverables.length > 1 ? "s" : ""} inclus</p>
          <div className="mt-6 flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-sm font-semibold">{formatPrice(q.totalPrice)} HT</p><p className="mt-1 text-sm text-muted">{q.paymentType === "acompte" ? `Acompte ${q.depositPercent} % : ${formatPrice(Math.round(q.totalPrice * (q.depositPercent ?? 0) / 100))}, puis solde` : "Règlement intégral"}</p><p className="mt-1 text-xs text-muted">Valable jusqu’au {new Date(`${q.validUntil}T12:00:00Z`).toLocaleDateString("fr-FR", { timeZone: "UTC" })}</p></div>
            <div className="ml-auto flex items-center justify-end gap-3">
              {editable && <Link href={`/admin/devis/${q.id}?modifier=1#proposition`} className="rounded-full border border-accent px-5 py-2.5 text-sm font-semibold text-accent hover:bg-accent/10">Modifier la proposition</Link>}
              {q.status === "propose" && !q.sendingAt && <form action={sendProjectQuote}><input type="hidden" name="id" value={q.id} /><input type="hidden" name="updatedAt" value={q.updatedAt} /><button className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-background">Envoyer le devis par e-mail</button></form>}
            </div>
            {q.orderId && <Link href={`/admin/commandes/${q.orderId}`} className="rounded-full border border-accent px-5 py-2.5 text-sm font-semibold text-accent hover:bg-accent/10">Gérer la commande créée →</Link>}
          </div>
        </>}
        {editing && published && <Link href={`/admin/devis/${q.id}#proposition`} className="mt-4 inline-block text-sm text-muted hover:text-foreground">Annuler</Link>}
        {q.sentAt && <p className="mt-4 text-xs text-muted">Envoyé le {dateFmt.format(new Date(q.sentAt))} ? Proposition verrouillée.</p>}
        {q.sendingAt && <p role="status" className="mt-4 text-sm text-muted">Envoi du devis en cours. La proposition est temporairement verrouillée.</p>}
      </section>
      {q.status !== "accepte" && !q.orderId && <details className={card}>
        <summary className="cursor-pointer text-sm text-muted">Supprimer la demande de devis</summary>
        <form action={deleteProjectQuote} className="mt-4 space-y-3 border-t border-border pt-4">
          <input type="hidden" name="id" value={q.id} /><input type="hidden" name="updatedAt" value={q.updatedAt} />
          <p className="text-sm text-muted">La suppression est définitive. Le lien privé de ce devis ne sera plus accessible.</p>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="confirm" required /> Je confirme la suppression de cette demande.</label>
          <button className="rounded-full border border-red-400/50 px-5 py-2.5 text-sm text-red-300 hover:bg-red-400/10">Supprimer la demande de devis</button>
        </form>
      </details>}
    </div>
  </>;
}

import Link from "next/link";
import { QuoteAcceptForm } from "@/components/QuoteAcceptForm";
import { QuotePaymentProvider, QuoteSteps } from "@/components/QuotePayment";
import { OrderLiveRefresh } from "@/components/OrderLiveRefresh";
import { notFound, redirect } from "next/navigation";
import { getStore } from "@/lib/store";
import { isDeliveryToken, itemRevisionLimit } from "@/lib/delivery";
import { quoteExpired } from "@/lib/quotes";
import { formatPrice } from "@/lib/pricing";
import { requestLocale } from "@/lib/request-locale";
import { reopenProjectQuote } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Devis · zer0oes gfx", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default async function QuotePortal({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { token } = await params;
  if (!isDeliveryToken(token)) notFound();
  const q = await getStore().getQuoteByToken(token);
  if (!q || q.status === "demande") notFound();
  if (q.status === "accepte") redirect(`/commande/${token}`);
  const sp = await searchParams;
  const locale = await requestLocale();
  const en = locale === "en";
  const expired = quoteExpired(q);
  const declined = q.status === "refuse";
  const available = !expired && !declined;
  const dateFmt = new Intl.DateTimeFormat(en ? "en-GB" : "fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" });
  const block = "rounded-2xl border border-border bg-background p-4 sm:p-5";
  const status = declined ? (en ? "You declined this quote. Contact me if you would like to discuss a new proposal." : "Tu as refusé ce devis. Contacte-moi si tu souhaites discuter d’une nouvelle proposition.")
    : expired ? (en ? "This quote has expired. Contact me for a new proposal." : "Ce devis a expiré. Contacte-moi pour une nouvelle proposition.")
    : (en ? "Your proposal is ready! Review your project and accept the quote to confirm your order." : "Ta proposition est prête ! Découvre ton projet et accepte le devis pour confirmer ta commande.");
  return <QuotePaymentProvider key={q.updatedAt}><div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
    <OrderLiveRefresh />
    <div className="rounded-3xl border border-border bg-surface p-5 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.6)] sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{en ? "Your project · Quote stage" : "Ton projet · Étape devis"}</p>
      <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">{q.title}</h1>
      <p className="mt-2 text-sm text-muted">{en ? "Proposed on" : "Proposé le"} {dateFmt.format(new Date(q.updatedAt))} · {en ? "keep this link private: it gives access to your project." : "garde ce lien pour toi : c’est ton accès privé."}</p>
      <section aria-labelledby="statut" className={`mt-6 ${block}`}>
        <h2 id="statut" className="sr-only">{en ? "Project status" : "Statut du projet"}</h2>
        <p className="font-medium" aria-live="polite">{status}</p>
        <QuoteSteps en={en} available={available} declined={declined} expired={expired} />
      </section>
      {sp.erreur && <p role="alert" className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-200">{en ? "Please confirm the terms. If the quote has expired, contact me." : "Confirme les conditions. Si le devis n’est plus disponible, contacte-moi."}</p>}
      <section aria-labelledby="proposition" className="mt-8">
        <h2 id="proposition" className="font-display text-xl font-bold">{en ? "Your custom project" : "Ton projet sur mesure"}</h2>
        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/85">{q.description}</p>
        <p className="mt-3 text-sm text-muted">{itemRevisionLimit({ packId: "sur-mesure", revisionsIncluded: q.revisionsIncluded }) === 1 ? (en ? "1 modification request included per deliverable." : "1 demande de modification incluse par livrable.") : (en ? "2 modification requests included per deliverable." : "2 demandes de modification incluses par livrable.")}</p>
        <h3 className="mt-6 text-sm font-semibold">{en ? "Planned deliverables" : "Livrables prévus"}</h3>
        <ul className="mt-3 overflow-hidden divide-y divide-border rounded-xl border border-border bg-background">{q.deliverables.map((s, i) => <li key={i} className="flex items-start gap-3 px-4 py-3 text-sm">
          <span aria-hidden className="text-gradient shrink-0 text-xs font-semibold leading-5">{String(i + 1).padStart(2, "0")}</span>
          <span className="min-w-0 break-words">{s}</span>
        </li>)}</ul>
      </section>
      <details className={`mt-4 ${block}`}>
        <summary className="cursor-pointer font-display text-lg font-bold">{en ? "Your initial request" : "Ta demande initiale"}</summary>
        <dl className="mt-4 space-y-4">{Object.entries(q.request).filter(([, value]) => value).map(([key, value]) => <div key={key}><dt className="text-xs font-medium text-muted">{key}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm">{value}</dd></div>)}</dl>
      </details>
      <section aria-labelledby="montant" className={`mt-4 ${block}`}>
        <h2 id="montant" className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">{en ? "Quote summary and payment" : "Récapitulatif et paiement"}</h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-3">
          <div><dt className="text-xs text-muted">{en ? "Total project price excl. tax" : "Prix total du projet HT"}</dt><dd className="font-display text-lg font-bold">{formatPrice(q.totalPrice, locale)}</dd></div>
          <div><dt className="text-xs text-muted">{en ? "Valid until" : "Valable jusqu’au"}</dt><dd className="mt-1 text-sm font-semibold">{dateFmt.format(new Date(`${q.validUntil}T12:00:00Z`))}</dd></div>
          <div><dt className="text-xs text-muted">{en ? "Prepared for" : "Préparé pour"}</dt><dd className="mt-1 break-words text-sm font-semibold">{q.name}</dd></div>
        </dl>
        <p className="mt-4 text-sm text-muted">{en ? "Choose how much to pay now: a deposit with the balance before final delivery, or the full project price." : "Choisis le montant à payer maintenant : un acompte avec le solde avant livraison définitive, ou la totalité du projet."}</p>
        {available ? <div className="mt-5 border-t border-border pt-4">
            <QuoteAcceptForm key={q.updatedAt} token={token} en={en} request={q.request} deliverables={q.deliverables} updatedAt={q.updatedAt} totalPrice={q.totalPrice} depositPercent={q.depositPercent || 30} />
        </div> : <div className="mt-4 flex flex-wrap items-center gap-3">
          {declined && !expired && <form action={reopenProjectQuote}><input type="hidden" name="token" value={token} /><button className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-background hover:brightness-110">{en ? "I declined by mistake" : "J’ai refusé par erreur"}</button></form>}
          <Link href={en ? "/en/contact" : "/contact"} className="inline-block rounded-full border border-accent px-5 py-2.5 text-sm font-semibold text-accent hover:bg-accent/10">{en ? "Contact me" : "Me contacter"}</Link>
        </div>}
      </section>
    </div>
  </div></QuotePaymentProvider>;
}

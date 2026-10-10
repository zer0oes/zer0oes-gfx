import { previewPublished } from "@/lib/delivery";
import type { Metadata } from "next";
import Link from "next/link";
import { BriefForm } from "@/components/BriefForm";
import { PageHeader } from "@/components/ui";
import { quote, quoteFromMetadata } from "@/lib/orders";
import { asLocale, href, t } from "@/lib/i18n";
import { depositAmount, formatPrice, paymentLabel, type PaymentType } from "@/lib/pricing";
import { getStore } from "@/lib/store";
import { trOfferName } from "@/lib/translations-en";
import { getStripe } from "@/lib/stripe";
import { includedOverlays } from "@/lib/brief-overlays";
import { OrderedPackCard } from "@/components/OrderedPackCard";
import { withoutInstallLine } from "@/lib/brief-delivery";
import { productBriefMinutes } from "@/lib/product-brief";

export async function generateMetadata({ params }: PageProps<"/[lang]/merci">): Promise<Metadata> {
  const lang = asLocale((await params).lang);
  return { title: t(lang, { fr: "Merci pour ta commande", en: "Thank you for your order" }), robots: { index: false } };
}

type View = {
  deliveryTemplate?: string[];
  packId: string;
  formulaId: string;
  offerName: string;
  payment: PaymentType;
  hasLogo: boolean;
  listPrice: number;
  totalPrice: number;
  depositPercent: number;
  email?: string;
  paid: boolean;
  amountPaid?: number;
};

export default async function MerciPage({ params: routeParams, searchParams }: PageProps<"/[lang]/merci">) {
  const lang = asLocale((await routeParams).lang);
  const amount = (cents: number) => formatPrice(cents, lang);
  const params = await searchParams;
  const sessionId = typeof params.session_id === "string" ? params.session_id : undefined;
  const demo = params.demo === "1";
  const store = getStore();
  const catalog = await store.getCatalog();

  if (!sessionId && !demo) {
    return (
      <PageHeader title={t(lang, { fr: "Aucune commande trouvée", en: "No order found" })}>
        <p>
          {t(lang, { fr: "Cette page s'affiche après un paiement.", en: "This page appears after a payment." })}{" "}
          <Link href={href(lang, "/offres")} className="text-accent hover:underline">
            {t(lang, { fr: "Voir les offres", en: "See the packages" })}
          </Link>
        </p>
      </PageHeader>
    );
  }

  // 1. Commande enregistrée (webhook Stripe ou démo)
  let view: View | null = null;
  const order = sessionId ? await store.getOrderBySession(sessionId).catch(() => null) : null;
  // Espace commande privé : lien créé à l'enregistrement de la commande (webhook ou démo)
  const portal = order?.deliveryToken ?? null;
  const briefReceived = Boolean(order?.briefReceivedAt || order?.brief);
  const briefLocked = order ? Boolean(order.deliveredAt) || (await store.listDeliverables(order.id)).some(previewPublished) : false;
  const revisionsUsed = order?.briefRevisions?.length ?? 0;
  const editBrief = briefReceived && params.modifier === "1" && revisionsUsed < 2 && !briefLocked;
  if (order) {
    view = { ...order, payment: order.paymentType, email: order.customerEmail || undefined, paid: !order.demo };
  }

  // 2. Webhook pas encore reçu : lecture de la session Stripe
  const stripe = getStripe();
  if (!view && stripe && sessionId && !sessionId.startsWith("demo_")) {
    try {
      const s = await stripe.checkout.sessions.retrieve(sessionId);
      const q = s.metadata ? quoteFromMetadata(s.metadata) : null;
      if (q) {
        view = {
          ...q,
          totalPrice: Number(s.metadata?.totalPrice) || q.totalPrice,
          email: s.customer_details?.email ?? undefined,
          paid: s.payment_status === "paid",
          amountPaid: s.payment_status === "paid" ? s.amount_total ?? 0 : 0,
        };
      }
    } catch {
      // Session introuvable : on affiche quand même le formulaire.
    }
  }

  // 3. Démo sans base : reconstitution depuis l'URL (affichage seulement)
  if (!view && demo) {
    const q = quote(catalog, {
      packId: params.pack as string,
      formulaId: params.formule as string,
      payment: params.paiement,
      hasLogo: params.logo === "1",
    });
    if (q) view = { ...q, paid: false };
  }

  const pack = catalog.packs.find((p) => p.id === view?.packId);
  const overlayCount = includedOverlays(pack);
  const overlayHint =
    overlayCount !== null ? t(lang, { fr: `Choisis les ${overlayCount} overlays inclus dans ton pack. Pour changer un choix, décoche d’abord un overlay.`, en: `Choose the ${overlayCount} overlays included in your package. Uncheck an overlay to change your selection.` }) : undefined;
  const pricing = { ...catalog.settings, depositPercent: view?.depositPercent ?? catalog.settings.depositPercent };

  return (
    <>
      <PageHeader
        eyebrow={view?.paid || demo ? t(lang, { fr: "Commande confirmée", en: "Order confirmed" }) : t(lang, { fr: "Commande reçue", en: "Order received" })}
        title={t(lang, { fr: "Merci !", en: "Thank you!" })}
      >
        {view?.paid ? (
          <>
            <span className="block font-semibold text-emerald-300">{t(lang, { fr: `Paiement de ${amount(view.amountPaid ?? 0)} confirmé`, en: `Payment of ${amount(view.amountPaid ?? 0)} confirmed` })}</span>
            {view.totalPrice > (view.amountPaid ?? 0) && <span className="mt-1 block text-base">{t(lang, { fr: `Reste à payer : ${amount(view.totalPrice - (view.amountPaid ?? 0))}`, en: `Remaining balance: ${amount(view.totalPrice - (view.amountPaid ?? 0))}` })}</span>}
          </>
        ) : view ? (
          lang === "en" ? (
            <>
              Your package: <strong className="text-foreground">“{trOfferName(lang, view.offerName)}”</strong>.
            </>
          ) : (
            <>
              Ton pack : <strong className="text-foreground">« {view.offerName} »</strong>.
            </>
          )
        ) : (
          t(lang, { fr: "Ta commande est enregistrée.", en: "Your order is saved." })
        )}{" "}
        {view?.paid && <span className="mt-2 block text-base">{t(lang, {
          fr: `Ta commande ${view.offerName} est confirmée.`,
          en: `Your ${trOfferName(lang, view.offerName)} order is confirmed.`,
        })}</span>}
      </PageHeader>
      <div className="mx-auto grid max-w-5xl items-start gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_2fr]">
        <aside className="min-w-0 space-y-6 lg:sticky lg:top-24">
        {view && <OrderedPackCard pack={pack} offerName={view.offerName} formulaId={view.formulaId} totalPrice={view.totalPrice} hasLogo={view.hasLogo} locale={lang} deliveryTemplate={view.deliveryTemplate}>
          <p className="text-sm leading-relaxed text-muted">
            {view.hasLogo && (
              <>
                {t(lang, { fr: "Remise « logo déjà existant »", en: "“Existing logo” discount" })} : −{amount(view.listPrice - view.totalPrice)} (
                {formatPrice(view.listPrice, lang)} → {amount(view.totalPrice)})
                <br />
              </>
            )}
            {lang === "en"
              ? view.payment === "acompte"
                ? `${pricing.depositPercent}% deposit: ${amount(depositAmount(view.totalPrice, pricing))} of ${amount(view.totalPrice)} — balance of ${amount(view.totalPrice - depositAmount(view.totalPrice, pricing))} due on delivery`
                : "Paid in full"
              : view.payment === "acompte" ? paymentLabel(view.totalPrice, view.payment, pricing) : "Réglé intégralement"}
            {view.payment === "acompte" &&
              t(lang, {
                fr: ", avant la remise des fichiers définitifs. Je t'enverrai une facture ou un lien de paiement pour le solde.",
                en: ", before the final files are handed over. I'll send you an invoice or a payment link for the balance.",
              })}
          </p>
        </OrderedPackCard>}
        {demo && (
          <p className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {t(lang, {
              fr: "Mode démo : Stripe n'est pas encore configuré, aucun paiement n'a eu lieu.",
              en: "Demo mode: Stripe is not set up yet, no payment was made.",
            })}
          </p>
        )}
        </aside>
        <div className="min-w-0 rounded-2xl border border-border bg-surface p-6 sm:p-8">
          {briefReceived && !editBrief ? <div className="space-y-4">
            <h2 className="font-display text-2xl font-bold">{t(lang, { fr: "Ton brief a bien été reçu", en: "Your brief has been received" })}</h2>
            <p className="text-sm leading-relaxed text-foreground/80">{t(lang, { fr: "Tu n’as plus besoin de remplir ce formulaire. Je reviens vers toi sous 2 jours ouvrés. Pour toute précision, contacte-moi ou retrouve la suite dans ton espace commande.", en: "You don’t need to fill in this form again. I’ll get back to you within 2 business days. For any clarification, contact me or follow the next steps in your order space." })}</p>
            {portal && <Link href={`/commande/${portal}`} className="inline-flex rounded-full bg-accent px-6 py-3 font-semibold text-background hover:brightness-110">{t(lang, { fr: "Accéder à ma commande →", en: "Open my order →" })}</Link>}
            <p className="text-sm text-muted">{t(lang, { fr: `${revisionsUsed} / 2 modifications utilisées.`, en: `${revisionsUsed} / 2 updates used.` })}</p>
            {briefLocked ? <p className="text-sm text-muted">{t(lang, { fr: "Ton brief est verrouillé depuis les premiers aperçus. Demande tes corrections dans ton espace commande.", en: "Your brief is locked since the first previews. Request corrections in your order space." })}</p> : revisionsUsed < 2 ? <Link href={`${href(lang, "/merci")}?session_id=${encodeURIComponent(sessionId ?? "")}&modifier=1`} className="block text-sm font-semibold text-accent hover:underline">{t(lang, { fr: "Modifier mon brief", en: "Edit my brief" })}</Link> : <p className="text-sm text-muted">{t(lang, { fr: "La limite est atteinte. Contacte-moi pour tout autre changement.", en: "The limit has been reached. Contact me for further changes." })}</p>}
          </div> : <>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">{editBrief ? t(lang, { fr: "Modifier mon brief", en: "Edit my brief" }) : (() => {
            const [min, max] = productBriefMinutes(withoutInstallLine(view?.deliveryTemplate));
            return t(lang, { fr: `Prochaine étape · environ ${min} à ${max} minutes`, en: `Next step · about ${min} to ${max} minutes` });
          })()}</p>
          <h2 className="font-display text-2xl font-bold">{lang === "fr" ? <>Complète ton <span className="text-gradient">brief</span> pour lancer la <span className="text-gradient">création</span></> : <>Complete your <span className="text-gradient">brief</span> to start the <span className="text-gradient">creation</span></>}</h2>
          <p className="mb-6 mt-3 text-sm leading-relaxed text-foreground/80">{t(lang, { fr: "Les champs marqués d’un * sont obligatoires. Précise tes besoins pour les créations achetées avant d’envoyer.", en: "Fields marked * are required. Describe your needs for the purchased creations before sending." })}</p>
          <BriefForm
            sessionId={sessionId}
            packId={view?.packId}
            formulaId={view?.formulaId}
            payment={view?.payment}
            hasLogo={view?.hasLogo}
            email={view?.email}
            overlayHint={overlayHint}
            overlayCount={overlayCount}
            portalUrl={portal ? `/commande/${portal}` : undefined}
            initialBrief={editBrief ? order?.brief ?? {} : undefined}
            revisionsUsed={revisionsUsed}
            purchasedProducts={view?.packId === "options" || view?.packId.startsWith("option:") ? withoutInstallLine(view.deliveryTemplate) : undefined}
            productLines={view?.deliveryTemplate}
          />
          </>}
        </div>
      </div>
    </>
  );
}

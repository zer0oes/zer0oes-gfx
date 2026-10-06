import type { Metadata } from "next";
import Link from "next/link";
import { BriefForm } from "@/components/BriefForm";
import { PageHeader } from "@/components/ui";
import { quote } from "@/lib/orders";
import { asLocale, href, t } from "@/lib/i18n";
import { depositAmount, formatPrice, optionChoices, paymentLabel, type PaymentType } from "@/lib/pricing";
import { getStore } from "@/lib/store";
import { trOfferName } from "@/lib/translations-en";
import { getStripe } from "@/lib/stripe";

export async function generateMetadata({ params }: PageProps<"/[lang]/merci">): Promise<Metadata> {
  const lang = asLocale((await params).lang);
  return { title: t(lang, { fr: "Merci pour ta commande", en: "Thank you for your order" }), robots: { index: false } };
}

type View = {
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
  if (order) {
    view = { ...order, payment: order.paymentType, email: order.customerEmail || undefined, paid: true };
  }

  // 2. Webhook pas encore reçu : lecture de la session Stripe
  const stripe = getStripe();
  if (!view && stripe && sessionId && !sessionId.startsWith("demo_")) {
    try {
      const s = await stripe.checkout.sessions.retrieve(sessionId);
      const q = quote(catalog, {
        packId: s.metadata?.packId,
        formulaId: s.metadata?.formulaId,
        payment: s.metadata?.paymentType,
        hasLogo: s.metadata?.logoProvided === "oui",
      });
      if (q) {
        view = {
          ...q,
          totalPrice: Number(s.metadata?.totalPrice) || q.totalPrice,
          email: s.customer_details?.email ?? undefined,
          paid: s.payment_status === "paid",
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
  const overlayHint =
    pack?.id === "premier-look"
      ? t(lang, { fr: "Ton offre comprend 2 overlays au choix.", en: "Your package includes 2 overlays of your choice." })
      : pack
        ? t(lang, { fr: "Ton offre comprend 5 overlays au choix.", en: "Your package includes 5 overlays of your choice." })
        : undefined;
  const pricing = { ...catalog.settings, depositPercent: view?.depositPercent ?? catalog.settings.depositPercent };

  return (
    <>
      <PageHeader
        eyebrow={view?.paid || demo ? t(lang, { fr: "Commande confirmée", en: "Order confirmed" }) : t(lang, { fr: "Commande reçue", en: "Order received" })}
        title={t(lang, { fr: "Merci !", en: "Thank you!" })}
      >
        {view ? (
          lang === "en" ? (
            <>
              Your <strong className="text-foreground">“{trOfferName(lang, view.offerName)}”</strong> package is booked.
            </>
          ) : (
            <>
              Ton offre <strong className="text-foreground">« {view.offerName} »</strong> est réservée.
            </>
          )
        ) : (
          t(lang, { fr: "Ta commande est enregistrée.", en: "Your order is saved." })
        )}{" "}
        {t(lang, {
          fr: "Pour lancer la création, raconte-moi ta chaîne en quelques minutes.",
          en: "To get the creation started, tell me about your channel in a few minutes.",
        })}
      </PageHeader>
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        {portal && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/50 bg-accent/10 p-4">
            <p className="text-sm">
              {lang === "en" ? (
                <>
                  <strong>Your order space</strong>: follow progress, approve your previews and download your files.
                  <span className="block text-xs text-muted">Keep this link to yourself, it is also in your emails.</span>
                </>
              ) : (
                <>
                  <strong>Ton espace commande</strong> : suis l&apos;avancement, valide tes aperçus et récupère tes fichiers.
                  <span className="block text-xs text-muted">Garde ce lien pour toi, il est aussi dans tes e-mails.</span>
                </>
              )}
            </p>
            <Link href={`/commande/${portal}`} className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-background hover:brightness-110">
              {t(lang, { fr: "Mon espace commande →", en: "My order space →" })}
            </Link>
          </div>
        )}
        {view && (
          <p
            className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
              view.payment === "acompte" ? "border-accent/50 bg-accent/10 text-foreground" : "border-border bg-surface text-muted"
            }`}
          >
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
                : `Paid in full: ${amount(view.totalPrice)}`
              : paymentLabel(view.totalPrice, view.payment, pricing)}
            {view.payment === "acompte" &&
              t(lang, {
                fr: ", avant la remise des fichiers définitifs. Je t'enverrai une facture ou un lien de paiement pour le solde.",
                en: ", before the final files are handed over. I'll send you an invoice or a payment link for the balance.",
              })}
          </p>
        )}
        {demo && (
          <p className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {t(lang, {
              fr: "Mode démo : Stripe n'est pas encore configuré, aucun paiement n'a eu lieu.",
              en: "Demo mode: Stripe is not set up yet, no payment was made.",
            })}
          </p>
        )}
        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <h2 className="mb-6 font-display text-2xl font-bold">{t(lang, { fr: "Ton brief", en: "Your brief" })}</h2>
          <BriefForm
            sessionId={sessionId}
            packId={view?.packId}
            formulaId={view?.formulaId}
            payment={view?.payment}
            hasLogo={view?.hasLogo}
            email={view?.email}
            overlayHint={overlayHint}
            optionChoices={optionChoices(catalog.options, lang)}
          />
        </div>
      </div>
    </>
  );
}

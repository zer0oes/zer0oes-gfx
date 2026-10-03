import type { Metadata } from "next";
import Link from "next/link";
import { BriefForm } from "@/components/BriefForm";
import { PageHeader } from "@/components/ui";
import { quote } from "@/lib/orders";
import { formatPrice, optionChoices, paymentLabel, type PaymentType } from "@/lib/pricing";
import { getStore } from "@/lib/store";
import { getStripe } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Merci pour ta commande",
  robots: { index: false },
};

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

export default async function MerciPage({ searchParams }: PageProps<"/merci">) {
  const params = await searchParams;
  const sessionId = typeof params.session_id === "string" ? params.session_id : undefined;
  const demo = params.demo === "1";
  const store = getStore();
  const catalog = await store.getCatalog();

  if (!sessionId && !demo) {
    return (
      <PageHeader title="Aucune commande trouvée">
        <p>
          Cette page s&apos;affiche après un paiement.{" "}
          <Link href="/offres" className="text-accent hover:underline">Voir les offres</Link>
        </p>
      </PageHeader>
    );
  }

  // 1. Commande enregistrée (webhook Stripe ou démo)
  let view: View | null = null;
  const order = sessionId ? await store.getOrderBySession(sessionId).catch(() => null) : null;
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
      ? "Ton offre comprend 2 overlays au choix."
      : pack
        ? "Ton offre comprend 5 overlays au choix."
        : undefined;
  const pricing = { ...catalog.settings, depositPercent: view?.depositPercent ?? catalog.settings.depositPercent };

  return (
    <>
      <PageHeader eyebrow={view?.paid || demo ? "Commande confirmée" : "Commande reçue"} title="Merci !">
        {view ? (
          <>
            Ton offre <strong className="text-foreground">« {view.offerName} »</strong> est réservée.
          </>
        ) : (
          "Ta commande est enregistrée."
        )}{" "}
        Pour lancer la création, raconte-moi ta chaîne en quelques minutes.
      </PageHeader>
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        {view && (
          <p
            className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
              view.payment === "acompte" ? "border-accent/50 bg-accent/10 text-foreground" : "border-border bg-surface text-muted"
            }`}
          >
            {view.hasLogo && (
              <>
                Remise « logo déjà existant » : −{formatPrice(view.listPrice - view.totalPrice)} HT (
                {formatPrice(view.listPrice)} → {formatPrice(view.totalPrice)} HT)
                <br />
              </>
            )}
            {paymentLabel(view.totalPrice, view.payment, pricing)}
            {view.payment === "acompte" && (
              <>, avant la remise des fichiers définitifs. Je t&apos;enverrai une facture ou un lien de paiement pour le solde.</>
            )}
          </p>
        )}
        {demo && (
          <p className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Mode démo : Stripe n&apos;est pas encore configuré, aucun paiement n&apos;a eu lieu.
          </p>
        )}
        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <h2 className="mb-6 font-display text-2xl font-bold">Ton brief</h2>
          <BriefForm
            sessionId={sessionId}
            packId={view?.packId}
            formulaId={view?.formulaId}
            payment={view?.payment}
            hasLogo={view?.hasLogo}
            email={view?.email}
            overlayHint={overlayHint}
            optionChoices={optionChoices(catalog.options)}
          />
        </div>
      </div>
    </>
  );
}

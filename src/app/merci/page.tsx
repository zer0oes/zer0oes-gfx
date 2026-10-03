import type { Metadata } from "next";
import Link from "next/link";
import { BriefForm } from "@/components/BriefForm";
import { PageHeader } from "@/components/ui";
import { formulaName, getFormula, getPack } from "@/data/packs";
import { getStripe } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Merci pour votre commande",
  robots: { index: false },
};

export default async function MerciPage({ searchParams }: PageProps<"/merci">) {
  const params = await searchParams;
  const sessionId = typeof params.session_id === "string" ? params.session_id : undefined;
  const demo = params.demo === "1";

  let packId = typeof params.pack === "string" ? params.pack : undefined;
  let formulaId = typeof params.formule === "string" ? params.formule : undefined;
  let email: string | undefined;
  let paid = false;

  const stripe = getStripe();
  if (stripe && sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      packId = session.metadata?.packId ?? packId;
      formulaId = session.metadata?.formulaId ?? formulaId;
      email = session.customer_details?.email ?? undefined;
      paid = session.payment_status === "paid";
    } catch {
      // Session introuvable : on affiche quand même le formulaire.
    }
  }

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

  const pack = getPack(packId);
  const formula = pack ? getFormula(pack, formulaId) : undefined;
  const overlayHint =
    pack?.id === "premier-look"
      ? "Ton offre comprend 2 overlays au choix."
      : pack
        ? "Ton offre comprend 5 overlays au choix."
        : undefined;

  return (
    <>
      <PageHeader eyebrow={paid || demo ? "Commande confirmée" : "Commande reçue"} title="Merci !">
        {pack ? (
          <>
            Votre offre <strong className="text-foreground">« {formulaName(pack, formula)} »</strong> est réservée.
          </>
        ) : (
          "Votre commande est enregistrée."
        )}{" "}
        Pour lancer la création, racontez-moi votre chaîne en quelques minutes.
      </PageHeader>
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        {demo && (
          <p className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Mode démo : Stripe n&apos;est pas encore configuré, aucun paiement n&apos;a eu lieu.
          </p>
        )}
        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <h2 className="mb-6 font-display text-2xl font-bold">Votre brief</h2>
          <BriefForm sessionId={sessionId} packId={pack?.id} formulaId={formula?.id} email={email} overlayHint={overlayHint} />
        </div>
      </div>
    </>
  );
}

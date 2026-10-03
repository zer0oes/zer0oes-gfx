import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { assertNotProduction, isProductionLike } from "@/lib/env";
import { markBalancePaid } from "@/lib/orders";
import { formatPrice } from "@/lib/pricing";
import { balanceDue, getStore } from "@/lib/store";

export const metadata: Metadata = { title: "Paiement de démonstration", robots: { index: false } };

// Remplace la page Stripe en développement (sans clé Stripe) pour tester le paiement du solde.
async function simulate(formData: FormData) {
  "use server";
  assertNotProduction("Le paiement de démonstration");
  const id = formData.get("id")?.toString() ?? "";
  const order = await getStore().getOrder(id);
  if (!order) return;
  await markBalancePaid(order.id, balanceDue(order));
  redirect("/merci/solde?demo=1");
}

export default async function DemoBalancePage({ searchParams }: PageProps<"/paiement-demo/solde">) {
  if (isProductionLike()) notFound();
  const { commande } = await searchParams;
  const order = typeof commande === "string" ? await getStore().getOrder(commande) : null;
  if (!order) notFound();
  const due = balanceDue(order);

  return (
    <>
      <PageHeader eyebrow="Démo" title="Paiement du solde">
        {order.offerName} — {due > 0 ? `${formatPrice(due)} HT à régler` : "rien à régler"}
      </PageHeader>
      <div className="mx-auto max-w-md px-4 text-center">
        <p className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Page de démonstration (Stripe non configuré) : aucun paiement réel.
        </p>
        {due > 0 && (
          <form action={simulate}>
            <input type="hidden" name="id" value={order.id} />
            <button type="submit" className="rounded-full bg-accent px-6 py-3 font-semibold text-background hover:brightness-110">
              Simuler le paiement de {formatPrice(due)} HT
            </button>
          </form>
        )}
      </div>
    </>
  );
}

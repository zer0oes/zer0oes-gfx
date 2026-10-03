import { createAbbyApi, abbyConfigured } from "@/lib/abby";
import { getAdmin } from "@/lib/auth";
import { getStore } from "@/lib/store";

// PDF d'une facture Abby, pour l'admin uniquement (la clé Abby reste côté serveur).
export async function GET(_request: Request, { params }: RouteContext<"/admin/factures/[id]">) {
  if (!(await getAdmin())) return new Response("Non autorisé", { status: 401 });
  const { id } = await params;
  const inv = (await getStore().listInvoices()).find((i) => i.id === id);
  if (!inv?.abbyInvoiceId || inv.demo || !abbyConfigured()) return new Response("Facture indisponible", { status: 404 });
  const pdf = await createAbbyApi().downloadPdf(inv.abbyInvoiceId);
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="facture-${inv.number ?? inv.id}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}

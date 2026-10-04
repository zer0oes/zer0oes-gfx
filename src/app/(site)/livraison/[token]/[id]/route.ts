import { isDeliveryToken, safeFilename } from "@/lib/delivery";
import { getStore } from "@/lib/store";

// Téléchargement d'un fichier livré : contrôle du lien privé, puis redirection vers
// un lien de téléchargement temporaire (Supabase) ou envoi direct (développement).
export async function GET(_request: Request, { params }: RouteContext<"/livraison/[token]/[id]">) {
  const { token, id } = await params;
  const notFound = () => new Response("Fichier introuvable", { status: 404, headers: { "X-Robots-Tag": "noindex" } });
  if (!isDeliveryToken(token)) return notFound();
  const store = getStore();
  const order = await store.getOrderByDeliveryToken(token);
  if (!order) return notFound();
  const item = (await store.listDeliverables(order.id)).find((d) => d.id === id && d.kind === "fichier");
  if (!item?.storagePath) return notFound();

  // Nom proposé au téléchargement : le nom affiché, avec l'extension du fichier
  const ext = item.storagePath.includes(".") ? item.storagePath.slice(item.storagePath.lastIndexOf(".")) : "";
  const filename = safeFilename(item.label.toLowerCase().endsWith(ext.toLowerCase()) ? item.label : `${item.label}${ext}`);

  if (store.deliverableDownloadUrl) {
    return Response.redirect(await store.deliverableDownloadUrl(item.storagePath, filename), 302);
  }
  if (store.readDeliverableFile) {
    const data = await store.readDeliverableFile(item.storagePath);
    return new Response(Buffer.from(data), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex",
      },
    });
  }
  return notFound();
}

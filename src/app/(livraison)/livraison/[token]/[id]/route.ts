import { isDeliveryToken, safeFilename, unlockState } from "@/lib/delivery";
import { getStore } from "@/lib/store";

// Fichier final ou lien d'import d'un élément livré. Servi UNIQUEMENT si l'élément est
// validé par le client et le solde réglé : le lien réel n'apparaît jamais dans la page avant.
export async function GET(_request: Request, { params }: RouteContext<"/livraison/[token]/[id]">) {
  const { token, id } = await params;
  const headers = { "X-Robots-Tag": "noindex", "Cache-Control": "private, no-store" };
  const notFound = () => new Response("Élément introuvable", { status: 404, headers });
  if (!isDeliveryToken(token)) return notFound();
  const store = getStore();
  const order = await store.getOrderByDeliveryToken(token);
  if (!order) return notFound();
  const item = (await store.listDeliverables(order.id)).find((d) => d.id === id);
  if (!item) return notFound();
  if (unlockState(order, item) !== "debloque") {
    return new Response("Cet élément sera disponible après ta validation et le règlement du solde.", { status: 403, headers });
  }

  if (item.kind === "lien") return item.url ? Response.redirect(item.url, 302) : notFound();
  if (!item.storagePath) return notFound();

  // Nom proposé au téléchargement : le nom affiché, avec l'extension du fichier
  const ext = item.storagePath.includes(".") ? item.storagePath.slice(item.storagePath.lastIndexOf(".")) : "";
  const filename = safeFilename(item.label.toLowerCase().endsWith(ext.toLowerCase()) ? item.label : `${item.label}${ext}`);

  if (store.deliverableDownloadUrl) {
    return Response.redirect(await store.deliverableDownloadUrl(item.storagePath, filename), 302);
  }
  if (store.readDeliverableFile) {
    const data = await store.readDeliverableFile(item.storagePath);
    return new Response(Buffer.from(data), {
      headers: { ...headers, "Content-Type": "application/octet-stream", "Content-Disposition": `attachment; filename="${filename}"` },
    });
  }
  return notFound();
}

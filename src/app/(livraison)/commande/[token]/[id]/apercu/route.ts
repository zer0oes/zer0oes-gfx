import sharp from "sharp";
import { isDeliveryToken, mediaKind } from "@/lib/delivery";
import { getStore } from "@/lib/store";
import { applyWatermark } from "@/lib/watermark-core";

// Aperçu protégé d'un élément livré, visible avant validation :
// - image : redimensionnée (1280 px max) et filigranée en mosaïque légère, générée à chaque demande ;
//   à défaut d'aperçu dédié, elle est tirée du visuel final (jamais servi tel quel) ;
// - vidéo : l'aperçu basse résolution envoyé par Aurore (lien temporaire de 10 minutes).
export async function GET(_request: Request, { params }: RouteContext<"/commande/[token]/[id]/apercu">) {
  const { token, id } = await params;
  const headers = { "X-Robots-Tag": "noindex", "Cache-Control": "private, no-store" };
  const notFound = () => new Response("Aperçu introuvable", { status: 404, headers });
  if (!isDeliveryToken(token)) return notFound();
  const store = getStore();
  const order = await store.getOrderByDeliveryToken(token);
  if (!order) return notFound();
  const item = (await store.listDeliverables(order.id)).find((d) => d.id === id);
  if (!item || !store.readDeliverableFile) return notFound();

  const source = item.previewPath ?? (mediaKind(item.storagePath) === "image" ? item.storagePath : undefined);
  if (!source) return notFound();

  if ((item.previewType ?? mediaKind(source)) === "video") {
    if (store.deliverableDownloadUrl) return Response.redirect(await store.deliverableDownloadUrl(source), 302);
    const data = await store.readDeliverableFile(source);
    return new Response(Buffer.from(data), { headers: { ...headers, "Content-Type": source.endsWith(".webm") ? "video/webm" : "video/mp4" } });
  }

  const resized = await sharp(await store.readDeliverableFile(source), { animated: false })
    .resize({ width: 1280, height: 1280, fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();
  const marked = await applyWatermark(new Uint8Array(resized), "mosaique");
  return new Response(Buffer.from(marked!.data), { headers: { ...headers, "Content-Type": marked!.type } });
}

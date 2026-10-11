import { isDeliveryToken, downloadFilename, unlockState, previewPublished } from "@/lib/delivery";
import { filesExpired } from "@/lib/portal";
import { getStore } from "@/lib/store";
import { installAccessKey } from "@/lib/install-links";

// Fichier final ou lien d'import d'un élément livré. Servi UNIQUEMENT si l'élément est
// validé par le client et le solde réglé : le lien réel n'apparaît jamais dans la page avant.
export async function GET(request: Request, { params }: RouteContext<"/commande/[token]/[id]">) {
  const { token, id } = await params;
  const headers = { "X-Robots-Tag": "noindex", "Cache-Control": "private, no-store" };
  const notFound = () => new Response("Élément introuvable", { status: 404, headers });
  if (!isDeliveryToken(token)) return notFound();
  const store = getStore();
  const order = await store.getOrderByDeliveryToken(token);
  if (!order) return notFound();
  const item = (await store.listDeliverables(order.id)).find((d) => d.id === id);
  if (!item) return notFound();
  if (filesExpired(order)) {
    return new Response("Ce projet est clôturé depuis plus de 6 mois : écris-moi pour récupérer tes fichiers.", { status: 410, headers });
  }
  if (!previewPublished(item) || unlockState(order, item) !== "debloque") {
    return new Response("Cet élément sera disponible après ta validation et le règlement du solde.", { status: 403, headers });
  }

  const deliver = async (response: Response, assetKey: string) => {
    if (!await store.beginFinalAccess(item.id, [assetKey])) return new Response("Validation requise.", { status: 403, headers });
    const result = new Response(response.body, response);
    for (const [name, value] of Object.entries(headers)) result.headers.set(name, value);
    return result;
  };
  const assetIndex = new URL(request.url).searchParams.get("asset");
  if (assetIndex !== null) {
    if (!/^\d+$/.test(assetIndex)) return notFound();
    const asset = item.finalAssets?.[Number(assetIndex)];
    if (!asset) return notFound();
    // Code d'installation StreamElements (c4ldas) : renvoyé seulement à la demande, une fois l'élément débloqué
    if (new URL(request.url).searchParams.get("code") === "1") {
      if (asset.install !== "streamelements" || !asset.code) return notFound();
      return deliver(new Response(JSON.stringify({ code: asset.code }), { headers: { ...headers, "Content-Type": "application/json" } }), installAccessKey(asset));
    }
    if (asset.url) return deliver(Response.redirect(asset.url, 302), asset.install ? installAccessKey(asset) : asset.url);
    if (!asset.path || !asset.path.startsWith(`${order.id}/`)) return notFound();
    if (store.deliverableDownloadUrl) return deliver(Response.redirect(await store.deliverableDownloadUrl(asset.path, downloadFilename(asset.label, asset.path)), 302), asset.path);
    if (store.readDeliverableFile) return deliver(new Response(Buffer.from(await store.readDeliverableFile(asset.path)), { headers: { ...headers, "Content-Type": "application/octet-stream", "Content-Disposition": `attachment; filename="${downloadFilename(asset.label, asset.path)}"` } }), asset.path);
    return notFound();
  }

  if (item.kind === "lien") return item.url ? deliver(Response.redirect(item.url, 302), item.url) : notFound();
  if (!item.storagePath) return notFound();

  // Nom proposé au téléchargement : le nom affiché, avec l'extension du fichier
  const filename = downloadFilename(item.label, item.storagePath);

  if (store.deliverableDownloadUrl) {
    return deliver(Response.redirect(await store.deliverableDownloadUrl(item.storagePath, filename), 302), item.storagePath);
  }
  if (store.readDeliverableFile) {
    const data = await store.readDeliverableFile(item.storagePath);
    return deliver(new Response(Buffer.from(data), {
      headers: { ...headers, "Content-Type": "application/octet-stream", "Content-Disposition": `attachment; filename="${filename}"` },
    }), item.storagePath);
  }
  return notFound();
}

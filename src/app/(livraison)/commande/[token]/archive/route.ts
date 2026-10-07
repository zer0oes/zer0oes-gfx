import { ZipArchive } from "archiver";
import { Readable } from "node:stream";
import { isDeliveryToken, downloadFilename } from "@/lib/delivery";
import { canDownloadArchive, archiveEntries } from "@/lib/order-archive";
import { filesExpired } from "@/lib/portal";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: RouteContext<"/commande/[token]/archive">) {
  const { token } = await params;
  const headers = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" };
  const missing = () => new Response("Archive indisponible.", { status: 404, headers });
  if (!isDeliveryToken(token)) return missing();
  const store = getStore();
  const order = await store.getOrderByDeliveryToken(token);
  if (!order) return missing();
  const items = await store.listDeliverables(order.id);
  if (filesExpired(order)) return new Response("Fichiers archivés.", { status: 410, headers });
  if (!canDownloadArchive(order, items)) return new Response("Validation et paiement intégral requis.", { status: 403, headers });
  if (!store.readDeliverableFile) return missing();
  const entries = archiveEntries(order.id, items);
  const archive = new ZipArchive({ zlib: { level: 1 } });
  for (const entry of entries) {
    const read = store.readDeliverableFile;
    const source = Readable.from((async function* () {
      const data = entry.path ? Buffer.from(await read(entry.path)) : Buffer.from(`[InternetShortcut]\r\nURL=${entry.url}\r\n`);
      if (!await store.beginFinalAccess(entry.itemId, [entry.path ?? entry.url!])) throw new Error("Validation requise.");
      yield data;
    })());
    source.on("error", (error) => archive.destroy(error));
    archive.append(source, { name: entry.name });
  }
  const body = Readable.toWeb(archive) as ReadableStream<Uint8Array>;
  void archive.finalize().catch((error: Error) => archive.destroy(error));
  const pseudo = order.brief?.Pseudo?.trim() || order.customerName?.trim() || "Client";
  const filename = downloadFilename(`${pseudo} - ${order.offerName}`, "commande.zip");
  return new Response(body, { headers: { ...headers, "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="commande.zip"; filename*=UTF-8''${encodeURIComponent(filename)}` } });
}

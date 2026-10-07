import { requireAdmin } from "@/lib/auth";
import { getStore } from "@/lib/store";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const store = getStore();
  const order = await store.getOrder(id);
  if (!order?.briefLogoPreview?.startsWith(`${id}/`) || !store.readDeliverableFile) return new Response("Introuvable", { status: 404 });
  const data = await store.readDeliverableFile(order.briefLogoPreview);
  return new Response(Buffer.from(data), { headers: { "Content-Type": "image/webp", "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" } });
}

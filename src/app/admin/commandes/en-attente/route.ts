import { getAdmin } from "@/lib/auth";
import { countPendingOrders } from "@/lib/pending-orders";

export async function GET() {
  const headers = { "Cache-Control": "private, no-store" };
  if (!(await getAdmin())) {
    return Response.json({ error: "Non autorisé" }, { status: 401, headers });
  }
  return Response.json({ count: await countPendingOrders() }, { headers });
}

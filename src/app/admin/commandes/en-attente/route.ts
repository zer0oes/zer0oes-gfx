import { getAdmin } from "@/lib/auth";
import { countPendingOrders, countPendingQuotes } from "@/lib/pending-orders";

export async function GET() {
  const headers = { "Cache-Control": "private, no-store" };
  if (!(await getAdmin())) {
    return Response.json({ error: "Non autorisé" }, { status: 401, headers });
  }
  const [count, quotes] = await Promise.all([countPendingOrders(), countPendingQuotes()]);
  return Response.json({ count, quotes }, { headers });
}

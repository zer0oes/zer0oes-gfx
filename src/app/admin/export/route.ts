import { getAdmin } from "@/lib/auth";
import { toCsv } from "@/lib/dashboard";
import { loadDashboard, periodParams } from "@/lib/dashboard-data";

// Export CSV des encaissements et remboursements de la période (admin uniquement).
export async function GET(request: Request) {
  if (!(await getAdmin())) return new Response("Non autorisé", { status: 401 });
  const sp = Object.fromEntries(new URL(request.url).searchParams);
  const { period, inPeriod, sample } = await loadDashboard(periodParams(sp));
  const name = `encaissements-${sample ? "exemple-" : ""}${period.start}-au-${period.end}.csv`;
  return new Response(toCsv(inPeriod), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

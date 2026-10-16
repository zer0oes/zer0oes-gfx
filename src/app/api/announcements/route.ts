import { getStore } from "@/lib/store";
import { launchActive, launchStarted } from "@/lib/launch-offer";

export const dynamic = "force-dynamic";
export async function GET() {
  const state = await getStore().getLaunchState();
  return Response.json({ active: launchActive(state), started: launchStarted(state), remaining: state.ordersRemaining ?? null }, { headers: { "Cache-Control": "no-store" } });
}

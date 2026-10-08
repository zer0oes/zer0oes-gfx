import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminLiveRefresh } from "@/components/admin/AdminLiveRefresh";
import { requireAdmin } from "@/lib/auth";
import { getStore } from "@/lib/store";
import { countPendingOrders } from "@/lib/pending-orders";

// Toutes les pages de ce groupe exigent un admin connecté (contrôle côté serveur).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const store = getStore();
  const pendingOrders = await countPendingOrders();

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <AdminLiveRefresh />
      <AdminSidebar email={admin.email} storeKind={store.kind} pendingOrders={pendingOrders} />
      <main className="min-w-0 flex-1 p-4 sm:p-8">{children}</main>
    </div>
  );
}

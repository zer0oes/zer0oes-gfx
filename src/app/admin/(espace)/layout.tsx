import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { requireAdmin } from "@/lib/auth";
import { getStore } from "@/lib/store";

// Toutes les pages de ce groupe exigent un admin connecté (contrôle côté serveur).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const store = getStore();

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <AdminSidebar email={admin.email} storeKind={store.kind} />
      <main className="min-w-0 flex-1 p-4 sm:p-8">{children}</main>
    </div>
  );
}

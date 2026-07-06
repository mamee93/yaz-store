import { redirect } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { requireAdmin } from "@/features/auth/queries";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  if (!admin) {
    redirect("/login");
  }

  return <AdminShell>{children}</AdminShell>;
}

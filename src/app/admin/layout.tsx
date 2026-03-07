import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { validateSession } from "@/lib/auth";
import AdminShell from "@/components/admin/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const hasSession = !!cookieStore.get("admin_session")?.value;

  // No session cookie → skip validation (login page, or unauthenticated)
  if (!hasSession) {
    return <AdminShell role="admin">{children}</AdminShell>;
  }

  // Has session cookie → validate against DB
  const { valid, role } = await validateSession();
  if (!valid) {
    redirect("/admin/login");
  }

  return <AdminShell role={role as "admin" | "manager"}>{children}</AdminShell>;
}

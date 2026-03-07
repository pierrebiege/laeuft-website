import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { validateSession } from "@/lib/auth";
import AdminShell from "@/components/admin/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const hasSession = !!cookieStore.get("admin_session")?.value;

  // No session cookie → skip validation (login page or unauthenticated)
  if (!hasSession) {
    return <AdminShell role="admin">{children}</AdminShell>;
  }

  // Check if we're on the login page (avoid redirect loop with stale cookies)
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  if (pathname.startsWith("/admin/login")) {
    return <AdminShell role="admin">{children}</AdminShell>;
  }

  // Has session cookie → validate against DB
  const { valid, role } = await validateSession();
  if (!valid) {
    // Expired/invalid session — middleware protects admin pages,
    // don't redirect here to avoid loops with stale cookies
    return <AdminShell role="admin">{children}</AdminShell>;
  }

  return <AdminShell role={role as "admin" | "manager"}>{children}</AdminShell>;
}

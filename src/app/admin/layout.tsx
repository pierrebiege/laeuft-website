import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { validateSession } from "@/lib/auth";
import AdminShell from "@/components/admin/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isLoginPage = pathname.startsWith("/admin/login");

  // Server-side session validation (defense in depth — middleware also checks)
  if (!isLoginPage) {
    const isValid = await validateSession();
    if (!isValid) {
      redirect("/admin/login");
    }
  }

  return <AdminShell>{children}</AdminShell>;
}

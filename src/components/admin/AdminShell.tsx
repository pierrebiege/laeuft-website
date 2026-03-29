"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  FileText,
  Users,
  Receipt,
  Calculator,
  Handshake,
  Handshake as HandshakeIcon,
  Target,
  CalendarDays,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Video,
  Dumbbell,
} from "lucide-react";
import { AdminRoleProvider } from "./AdminRoleContext";

type Role = "admin" | "manager";

export default function AdminShell({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  // Don't show sidebar on login page
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const navItems = [
    { href: "/admin/kalender", label: "Kalender", icon: CalendarDays, roles: ["admin", "manager"] as Role[] },
    { href: "/admin/partners", label: "Partners", icon: HandshakeIcon, roles: ["admin", "manager"] as Role[] },
    { href: "/admin/akquise", label: "Akquise", icon: Target, roles: ["admin"] as Role[] },
    { href: "/admin", label: "Offerten", icon: FileText, roles: ["admin", "manager"] as Role[] },
    { href: "/admin/mandate", label: "Mandate", icon: Handshake, roles: ["admin", "manager"] as Role[] },
    { href: "/admin/rechnungen", label: "Rechnungen", icon: Receipt, roles: ["admin", "manager"] as Role[] },
    { href: "/admin/kunden", label: "Kunden", icon: Users, roles: ["admin", "manager"] as Role[] },
    { href: "/admin/buchhaltung", label: "Buchhaltung", icon: Calculator, roles: ["admin"] as Role[] },
    { href: "/admin/training", label: "Training", icon: Dumbbell, roles: ["admin"] as Role[] },
    { href: "/admin/content", label: "Content", icon: Video, roles: ["admin"] as Role[] },
    { href: "/admin/instagram", label: "Instagram", icon: BarChart3, roles: ["admin"] as Role[] },
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <AdminRoleProvider role={role}>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex">
        {/* Sidebar */}
        <aside
          className={`fixed top-0 left-0 h-full bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col transition-all duration-200 z-30 ${
            collapsed ? "w-[68px]" : "w-[240px]"
          }`}
        >
          {/* Logo */}
          <div className="px-5 py-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            {!collapsed && (
              <Link href="/admin" className="text-lg font-bold text-zinc-900 dark:text-white">
                Läuft<span className="text-zinc-400">.</span>
              </Link>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
            {visibleItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <item.icon size={18} className="shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Bottom section */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 p-3 space-y-1">
            <Link
              href="/"
              target="_blank"
              title={collapsed ? "Zur Website" : undefined}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <ExternalLink size={16} className="shrink-0" />
              {!collapsed && <span>Zur Website</span>}
            </Link>

            {/* Role badge + Logout */}
            <div className="flex items-center gap-2 px-3 py-2">
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                    {role === "admin" ? "Pierre" : "Anes"}
                  </div>
                  <div className="text-xs text-zinc-400">{role === "admin" ? "Admin" : "Manager"}</div>
                </div>
              )}
              <button
                onClick={handleLogout}
                title="Abmelden"
                className="p-1.5 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main
          className={`flex-1 transition-all duration-200 ${
            collapsed ? "ml-[68px]" : "ml-[240px]"
          }`}
        >
          <div className={pathname.startsWith("/admin/kalender") ? "max-w-[1400px] mx-auto px-6 py-8" : "max-w-6xl mx-auto px-6 py-8"}>{children}</div>
        </main>
      </div>
    </AdminRoleProvider>
  );
}

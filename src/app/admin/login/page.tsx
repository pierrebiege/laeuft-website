"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Smartphone } from "lucide-react";

type LoginTab = "admin" | "manager";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<LoginTab>("admin");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const body: Record<string, string> = { password };
      if (tab === "admin") {
        body.code = code;
        body.loginType = "admin";
      } else {
        body.loginType = "manager";
      }

      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        setError(data.error || "Login fehlgeschlagen");
      }
    } catch {
      setError("Verbindungsfehler");
    }

    setLoading(false);
  }

  const switchTab = (t: LoginTab) => {
    setTab(t);
    setPassword("");
    setCode("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Läuft<span className="text-zinc-400">.</span> Admin
          </h1>
          <p className="text-zinc-500 mt-2">Bitte einloggen</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex mb-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
          <button
            type="button"
            onClick={() => switchTab("admin")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === "admin"
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            Pierre
          </button>
          <button
            type="button"
            onClick={() => switchTab("manager")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === "manager"
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            Anes
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4"
        >
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              <Lock size={14} className="inline mr-2" />
              Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••••••"
              required
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
            />
          </div>

          {tab === "admin" && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                <Smartphone size={14} className="inline mr-2" />
                Authenticator Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                required
                maxLength={6}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white text-center text-2xl tracking-widest font-mono"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={
              loading ||
              password.length === 0 ||
              (tab === "admin" && code.length !== 6)
            }
            className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50"
          >
            {loading ? "Prüfen..." : "Einloggen"}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-400 mt-6">
          {tab === "admin"
            ? "Google Authenticator oder ähnliche App verwenden"
            : "Zugang ohne 2FA"}
        </p>
      </div>
    </div>
  );
}

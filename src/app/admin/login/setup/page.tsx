"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";
import { ArrowLeft, Copy, Check } from "lucide-react";

export default function SetupPage() {
  const [copied, setCopied] = useState(false);

  // TOTP Secret from env (you'll replace this with your actual secret)
  const secret = "MDEOCUELKJ45CCMBDPPTMDEOCUELKJ45";
  const issuer = "Laeuft";
  const account = "Admin";

  const otpauthUrl = `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;

  function copySecret() {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Authenticator Setup
          </h1>
          <p className="text-zinc-500 mt-2">
            Scanne den QR-Code mit Google Authenticator
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8">
          {/* QR Code */}
          <div className="flex justify-center mb-6">
            <div className="bg-white p-4 rounded-xl">
              <QRCodeSVG value={otpauthUrl} size={200} />
            </div>
          </div>

          {/* Manual entry */}
          <div className="text-center mb-6">
            <p className="text-sm text-zinc-500 mb-2">
              Oder manuell eingeben:
            </p>
            <div className="flex items-center justify-center gap-2">
              <code className="bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-lg text-sm font-mono">
                {secret}
              </code>
              <button
                onClick={copySecret}
                className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
            <p><strong>1.</strong> Öffne Google Authenticator (oder Authy, 1Password, etc.)</p>
            <p><strong>2.</strong> Tippe auf + → QR-Code scannen</p>
            <p><strong>3.</strong> Scanne den QR-Code oben</p>
            <p><strong>4.</strong> Der 6-stellige Code erscheint in der App</p>
          </div>

          <Link
            href="/admin/login"
            className="mt-6 flex items-center justify-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          >
            <ArrowLeft size={16} />
            Zurück zum Login
          </Link>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Wichtig:</strong> Diese Seite nur einmal aufrufen und dann den Link löschen. Der Secret sollte geheim bleiben.
        </div>
      </div>
    </div>
  );
}

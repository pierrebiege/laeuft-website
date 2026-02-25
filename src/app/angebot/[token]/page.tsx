"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase, Offer, Client, OfferItem } from "@/lib/supabase";
import { Check, Clock, Calendar, Building2, Printer, Download, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";

type FullOffer = Offer & {
  client: Client;
  items: OfferItem[];
};

export default function PublicOfferPage() {
  const params = useParams();
  const token = params.token as string;

  const [offer, setOffer] = useState<FullOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    loadOffer();
  }, [token]);

  async function loadOffer() {
    const { data, error } = await supabase
      .from("offers")
      .select(`*, client:clients(*), items:offer_items(*)`)
      .eq("unique_token", token)
      .single();

    if (error || !data) {
      setError("Offerte nicht gefunden");
    } else {
      setOffer(data as FullOffer);
      if (data.status === "accepted") {
        setAccepted(true);
      }
    }
    setLoading(false);
  }

  async function acceptOffer() {
    if (!offer) return;

    setAccepting(true);

    const { error } = await supabase
      .from("offers")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString()
      })
      .eq("id", offer.id);

    if (error) {
      alert("Fehler beim Annehmen der Offerte");
    } else {
      setAccepted(true);
      setOffer({ ...offer, status: "accepted" });
    }
    setAccepting(false);
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("de-CH", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  function formatAmount(amount: number) {
    return new Intl.NumberFormat("de-CH", {
      style: "currency",
      currency: "CHF",
      minimumFractionDigits: 0,
    }).format(amount);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500">Laden...</div>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
            Offerte nicht gefunden
          </h1>
          <p className="text-zinc-500">
            Diese Offerte existiert nicht oder ist nicht mehr gültig.
          </p>
        </div>
      </div>
    );
  }

  const isExpired = offer.valid_until && new Date(offer.valid_until) < new Date();

  function handlePrint() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4 print:bg-white print:py-0">
      {/* Action buttons - hidden on print */}
      <div className="max-w-2xl mx-auto mb-4 print:hidden flex gap-2 justify-center">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
        >
          <Printer size={16} />
          Drucken
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto print:max-w-none"
      >
        {/* Header */}
        <div className="text-center mb-8 print:mb-6 print:text-left print:flex print:justify-between print:items-start">
          <div>
            <div className="text-2xl font-bold mb-1 print:mb-0">
              Läuft<span className="text-zinc-400 print:text-zinc-600">.</span> <span className="font-normal text-zinc-600 dark:text-zinc-400 text-lg">Pierre Biege</span>
            </div>
            <p className="text-zinc-500 print:text-xs">Digital Systems & Branding</p>
          </div>
          <div className="hidden print:block text-right">
            <div className="text-xs text-zinc-500">Offerte</div>
            <div className="text-sm font-medium">{formatDate(offer.created_at)}</div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden print:rounded-none print:border-0 print:shadow-none">
          {/* Status Banner */}
          {accepted && (
            <div className="bg-green-500 text-white px-6 py-3 flex items-center justify-center gap-2 print:bg-green-100 print:text-green-800">
              <Check size={18} />
              Offerte angenommen am {offer.accepted_at && formatDate(offer.accepted_at)}
            </div>
          )}

          {isExpired && !accepted && (
            <div className="bg-red-500 text-white px-6 py-3 flex items-center justify-center gap-2 print:bg-red-100 print:text-red-800">
              <Clock size={18} />
              Diese Offerte ist abgelaufen
            </div>
          )}

          <div className="p-8 print:p-6">
            {/* Client Info */}
            <div className="flex items-start justify-between mb-8 pb-8 border-b border-zinc-100 dark:border-zinc-800 print:border-zinc-300">
              <div>
                <div className="flex items-center gap-2 text-zinc-500 mb-1 print:hidden">
                  <Building2 size={14} />
                  <span className="text-sm">Für</span>
                </div>
                <div className="hidden print:block text-xs text-zinc-500 uppercase tracking-wide mb-1">An</div>
                <div className="font-semibold text-zinc-900 dark:text-white print:text-black">
                  {offer.client.company || offer.client.name}
                </div>
                {offer.client.company && (
                  <div className="text-sm text-zinc-500 print:text-zinc-700">{offer.client.name}</div>
                )}
              </div>
              <div className="text-right print:hidden">
                <div className="flex items-center gap-2 text-zinc-500 mb-1 justify-end">
                  <Calendar size={14} />
                  <span className="text-sm">Erstellt am</span>
                </div>
                <div className="text-zinc-900 dark:text-white">
                  {formatDate(offer.created_at)}
                </div>
                {offer.valid_until && (
                  <div className="text-sm text-zinc-500">
                    Gültig bis {formatDate(offer.valid_until)}
                  </div>
                )}
              </div>
              <div className="hidden print:block text-right">
                {offer.valid_until && (
                  <div className="text-sm text-zinc-700">
                    <span className="text-zinc-500">Gültig bis:</span> {formatDate(offer.valid_until)}
                  </div>
                )}
              </div>
            </div>

            {/* Title & Description */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white print:text-black mb-2">
                {offer.title}
              </h1>
              {offer.description && (
                <p className="text-zinc-600 dark:text-zinc-400 print:text-zinc-700 whitespace-pre-line">
                  {offer.description}
                </p>
              )}
            </div>

            {/* Items */}
            <div className="space-y-4 mb-8">
              {offer.items
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl print:bg-zinc-100 print:rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-zinc-900 dark:text-white print:text-black">
                        {item.title}
                      </h3>
                      <span className="font-bold text-zinc-900 dark:text-white print:text-black">
                        {formatAmount(item.amount)}
                      </span>
                    </div>
                    {item.description && (
                      <div className="text-sm text-zinc-600 dark:text-zinc-400 print:text-zinc-700">
                        {item.description.split("\n").map((line, i) => (
                          <div key={i} className="flex items-start gap-2 py-0.5">
                            <span className="text-zinc-400 print:text-zinc-500">→</span>
                            {line}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between py-4 border-t border-zinc-200 dark:border-zinc-700 mb-8 print:border-zinc-400">
              <span className="text-lg text-zinc-600 dark:text-zinc-400 print:text-black">Total</span>
              <span className="text-3xl font-bold text-zinc-900 dark:text-white print:text-black">
                {formatAmount(offer.total_amount)}
              </span>
            </div>

            {/* Accept Button - hidden on print */}
            {!accepted && !isExpired && offer.status !== "rejected" && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={acceptOffer}
                disabled={accepting}
                className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-semibold text-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50 print:hidden"
              >
                {accepting ? "Wird angenommen..." : "Offerte annehmen"}
              </motion.button>
            )}

            {accepted && (
              <div className="text-center text-green-600 dark:text-green-400 print:text-green-700">
                <Check size={24} className="mx-auto mb-2" />
                Vielen Dank! Die Offerte wurde angenommen.
              </div>
            )}

            {/* QR Code for Print - Online Acceptance */}
            {!accepted && !isExpired && offer.status !== "rejected" && (
              <div className="hidden print:block mt-8 pt-6 border-t-2 border-dashed border-zinc-300">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <QRCodeSVG
                      value={typeof window !== "undefined" ? window.location.href : `https://laeuft.ch/angebot/${token}`}
                      size={80}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-black mb-1">Online annehmen</div>
                    <p className="text-xs text-zinc-600">
                      Scanne den QR-Code oder besuche laeuft.ch/angebot/{token} um die Offerte digital anzunehmen.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-zinc-400 print:mt-6 print:text-zinc-600">
          <p className="print:hidden">Bei Fragen: pierre@laeuft.ch</p>
          <p className="hidden print:block">
            Pierre Biege | Tschangaladongastrasse 3 | 3955 Albinen | pierre@laeuft.ch | 079 853 36 72
          </p>
        </div>
      </motion.div>
    </div>
  );
}

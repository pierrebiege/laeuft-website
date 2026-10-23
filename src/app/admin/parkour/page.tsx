"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/adminDb";

/* Eingänge der Parkour-Doku (laeuft.ch/parkour): Video-Statements,
   altes Material, Hinweise. Daten nur über @/lib/adminDb (Service-Role
   hinter der Admin-Session), Dateien über signierte Download-Links. */

type Datei = { pfad: string; name: string; groesse: number; typ: string; angekommen: boolean };
type Beitrag = {
  id: string;
  erstellt_am: string;
  art: "video" | "material" | "hinweis";
  sprache: string;
  name: string;
  kontakt: string;
  gruppe_ort: string | null;
  jahre: string | null;
  wer_zu_sehen: string | null;
  beschreibung: string | null;
  link: string | null;
  offline_material: boolean;
  hinweis: string | null;
  antworten: Record<string, string> | null;
  dateien: Datei[] | null;
  status: string;
  erledigt: boolean;
};

const ARTEN = { video: "Video-Statement", material: "Altes Material", hinweis: "Hinweis" } as const;
const FRAGEN: Record<string, string> = {
  wettkampf: "Gehört Wettkampf zu Parkour?",
  wer_gebracht: "Wer hat dich zu Parkour gebracht?",
  zukunft: "Parkour in 20 Jahren?",
};

function mb(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

function kontaktLink(k: string) {
  if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(k)) return `mailto:${k}`;
  return `https://instagram.com/${k.replace(/^@/, "")}`;
}

export default function ParkourAdmin() {
  const [liste, setListe] = useState<Beitrag[]>([]);
  const [laedt, setLaedt] = useState(true);
  const [fehler, setFehler] = useState<string | null>(null);
  const [filter, setFilter] = useState<"alle" | Beitrag["art"]>("alle");
  const [nurOffen, setNurOffen] = useState(false);

  const laden = useCallback(async () => {
    const { data, error } = await supabase
      .from("parkour_beitraege")
      .select(
        "id, erstellt_am, art, sprache, name, kontakt, gruppe_ort, jahre, wer_zu_sehen, beschreibung, link, offline_material, hinweis, antworten, dateien, status, erledigt",
      )
      .order("erstellt_am", { ascending: false })
      .limit(1000);
    if (error) setFehler(error.message);
    else setListe((data as Beitrag[]) ?? []);
    setLaedt(false);
  }, []);

  useEffect(() => {
    // Erst nach dem ersten Render laden (Microtask), nicht synchron im Effekt.
    void Promise.resolve().then(laden);
  }, [laden]);

  const sichtbar = useMemo(
    () => liste.filter((b) => (filter === "alle" || b.art === filter) && (!nurOffen || !b.erledigt)),
    [liste, filter, nurOffen],
  );

  const anzahl = (a: "alle" | Beitrag["art"]) => (a === "alle" ? liste.length : liste.filter((b) => b.art === a).length);

  async function umschalten(b: Beitrag) {
    setListe((l) => l.map((x) => (x.id === b.id ? { ...x, erledigt: !b.erledigt } : x)));
    const { error } = await supabase.from("parkour_beitraege").update({ erledigt: !b.erledigt }).eq("id", b.id);
    if (error) {
      setFehler(error.message);
      laden();
    }
  }

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Parkour-Doku</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Eingänge von{" "}
            <a href="/parkour" target="_blank" className="underline">
              laeuft.ch/parkour
            </a>
            . Download-Links gelten eine Stunde.
          </p>
        </div>
        <button
          onClick={() => {
            setLaedt(true);
            laden();
          }}
          className="px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          Neu laden
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        {(["alle", "video", "material", "hinweis"] as const).map((a) => (
          <button
            key={a}
            onClick={() => setFilter(a)}
            className={`px-3 py-1.5 text-sm rounded-lg border ${
              filter === a
                ? "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900"
                : "border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
            }`}
          >
            {a === "alle" ? "Alle" : ARTEN[a]} ({anzahl(a)})
          </button>
        ))}
        <label className="ml-2 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <input type="checkbox" checked={nurOffen} onChange={(e) => setNurOffen(e.target.checked)} />
          nur offene
        </label>
      </div>

      {fehler && <p className="mb-4 text-sm text-red-600">{fehler}</p>}
      {laedt ? (
        <p className="text-zinc-400 py-16 text-center">Laden…</p>
      ) : sichtbar.length === 0 ? (
        <p className="text-zinc-400 py-16 text-center">Noch nichts da.</p>
      ) : (
        <ul className="space-y-4">
          {sichtbar.map((b) => (
            <li
              key={b.id}
              className={`rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 ${
                b.erledigt ? "opacity-60" : ""
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{ARTEN[b.art]}</span>
                    <span>{new Date(b.erstellt_am).toLocaleString("de-CH")}</span>
                    <span>{b.sprache.toUpperCase()}</span>
                    {b.status !== "eingegangen" && (
                      <span className="text-amber-600">
                        {b.status === "hochladen" ? "Upload läuft / abgebrochen" : "unvollständig"}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-white">
                    {b.name}
                    {b.gruppe_ort && <span className="font-normal text-zinc-500"> · {b.gruppe_ort}</span>}
                    {b.jahre && <span className="font-normal text-zinc-500"> · {b.jahre}</span>}
                  </p>
                  <a href={kontaktLink(b.kontakt)} target="_blank" className="text-sm text-blue-600 underline">
                    {b.kontakt}
                  </a>
                </div>
                <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <input type="checkbox" checked={b.erledigt} onChange={() => umschalten(b)} />
                  erledigt
                </label>
              </div>

              <dl className="mt-4 grid gap-2 text-sm">
                {b.hinweis && (
                  <div>
                    <dt className="text-zinc-500">Hinweis</dt>
                    <dd className="whitespace-pre-wrap text-zinc-900 dark:text-zinc-100">{b.hinweis}</dd>
                  </div>
                )}
                {Object.entries(b.antworten ?? {}).map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-zinc-500">{FRAGEN[k] ?? k}</dt>
                    <dd className="whitespace-pre-wrap text-zinc-900 dark:text-zinc-100">{v}</dd>
                  </div>
                ))}
                {b.beschreibung && (
                  <div>
                    <dt className="text-zinc-500">Beschreibung</dt>
                    <dd className="whitespace-pre-wrap text-zinc-900 dark:text-zinc-100">{b.beschreibung}</dd>
                  </div>
                )}
                {b.wer_zu_sehen && (
                  <div>
                    <dt className="text-zinc-500">Wer ist zu sehen</dt>
                    <dd className="text-zinc-900 dark:text-zinc-100">{b.wer_zu_sehen}</dd>
                  </div>
                )}
                {b.link && (
                  <div>
                    <dt className="text-zinc-500">Link</dt>
                    <dd>
                      <a
                        href={/^https?:\/\//i.test(b.link) ? b.link : `https://${b.link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline break-all"
                      >
                        {b.link}
                      </a>
                    </dd>
                  </div>
                )}
                {b.offline_material && (
                  <div className="text-amber-700 dark:text-amber-400 font-medium">
                    Material liegt offline (Festplatte/Kassette/MiniDV) — melden.
                  </div>
                )}
              </dl>

              {(b.dateien?.length ?? 0) > 0 && (
                <ul className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800 border-t border-zinc-100 dark:border-zinc-800">
                  {b.dateien!.map((d) => (
                    <li key={d.pfad} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                      <span className={d.angekommen ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 line-through"}>
                        {d.name} <span className="text-zinc-400">({mb(d.groesse)})</span>
                      </span>
                      {d.angekommen ? (
                        <span className="flex gap-3">
                          <a
                            href={`/api/admin/parkour/datei?ansehen=1&pfad=${encodeURIComponent(d.pfad)}`}
                            target="_blank"
                            className="text-blue-600 underline"
                          >
                            Ansehen
                          </a>
                          <a
                            href={`/api/admin/parkour/datei?pfad=${encodeURIComponent(d.pfad)}&name=${encodeURIComponent(d.name)}`}
                            className="text-blue-600 underline"
                          >
                            Download
                          </a>
                        </span>
                      ) : (
                        <span className="text-zinc-400">nicht angekommen</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

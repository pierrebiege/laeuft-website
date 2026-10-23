"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TEXTE, type Art, type Sprache } from "./texte";
import { dateiErlaubt } from "./dateitypen";

/* Die drei Wege mitzumachen, in einem Formular.
   Dateien gehen nie durch unsere Server-Funktion (Vercel lässt dort nur
   4,5 MB durch): die Route legt den Beitrag an und gibt pro Datei eine
   signierte Upload-Adresse zurück, der Browser lädt direkt in den privaten
   Supabase-Bucket hoch und meldet danach, was angekommen ist. */

type DateiZeile = {
  id: string;
  datei: File;
  fehler: string | null;
  fortschritt: number;
  status: "wartet" | "laedt" | "ok" | "fehler";
};

const ARTEN: Art[] = ["video", "material", "hinweis"];
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const INSTAGRAM = /^@?[A-Za-z0-9._]{2,30}$/;

function groesse(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function hochladen(url: string, datei: File, typ: string, beiFortschritt: (p: number) => void) {
  return new Promise<boolean>((fertig) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("content-type", typ);
    xhr.setRequestHeader("x-upsert", "false");
    if (ANON_KEY) xhr.setRequestHeader("apikey", ANON_KEY);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) beiFortschritt(e.loaded / e.total);
    };
    xhr.onload = () => fertig(xhr.status >= 200 && xhr.status < 300);
    xhr.onerror = () => fertig(false);
    xhr.onabort = () => fertig(false);
    xhr.send(datei);
  });
}

export default function Mitmachen({ sprache, maxMb }: { sprache: Sprache; maxMb: number }) {
  const t = TEXTE[sprache];
  const m = t.mitmachen;
  const f = m.felder;
  const [art, setArt] = useState<Art>("video");
  const [name, setName] = useState("");
  const [gruppe, setGruppe] = useState("");
  const [jahre, setJahre] = useState("");
  const [kontakt, setKontakt] = useState("");
  const [zuSehen, setZuSehen] = useState("");
  const [beschreibung, setBeschreibung] = useState("");
  const [link, setLink] = useState("");
  const [offline, setOffline] = useState(false);
  const [hinweis, setHinweis] = useState("");
  const [antworten, setAntworten] = useState<Record<string, string>>({});
  const [einverstanden, setEinverstanden] = useState(false);
  const [falle, setFalle] = useState("");
  const [dateien, setDateien] = useState<DateiZeile[]>([]);
  const [phase, setPhase] = useState<"formular" | "senden" | "fertig">("formular");
  const [meldung, setMeldung] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [teilweise, setTeilweise] = useState(false);
  const [ziehen, setZiehen] = useState(false);
  const geoeffnet = useRef(Date.now());
  const abschnitt = useRef<HTMLElement>(null);
  const maxBytes = maxMb * 1024 * 1024;

  /* Links wie laeuft.ch/parkour#material öffnen direkt den passenden Weg. */
  useEffect(() => {
    const ausHash = (scrollen: boolean) => {
      const h = window.location.hash.replace("#", "") as Art;
      if (ARTEN.includes(h)) {
        setArt(h);
        if (scrollen) abschnitt.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    ausHash(true);
    const beiWechsel = () => ausHash(true);
    window.addEventListener("hashchange", beiWechsel);
    return () => window.removeEventListener("hashchange", beiWechsel);
  }, []);

  const hinzufuegen = useCallback(
    (liste: FileList | null) => {
      if (!liste) return;
      const neu: DateiZeile[] = Array.from(liste).map((datei) => {
        let fehler: string | null = null;
        if (!dateiErlaubt(datei.name, datei.type)) fehler = f.typFalsch;
        else if (datei.size > maxBytes) fehler = f.zuGross(maxMb);
        return {
          id: `${datei.name}-${datei.size}-${datei.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
          datei,
          fehler,
          fortschritt: 0,
          status: "wartet",
        };
      });
      setDateien((alt) => [...alt, ...neu].slice(0, 30));
      setMeldung(null);
    },
    [f, maxBytes, maxMb],
  );

  const gueltigeDateien = dateien.filter((d) => !d.fehler);

  function pruefen(): string | null {
    if (name.trim().length < 2) return m.fehler.name;
    const k = kontakt.trim();
    if (!EMAIL.test(k) && !INSTAGRAM.test(k)) return m.fehler.kontakt;
    if (art === "video" && !gueltigeDateien.length && !link.trim()) return m.fehler.leerVideo;
    if (art === "material" && !gueltigeDateien.length && !link.trim() && !offline) return m.fehler.leerMaterial;
    if (art === "hinweis" && hinweis.trim().length < 3) return m.fehler.leerHinweis;
    if (!einverstanden) return m.fehler.einverstaendnis;
    return null;
  }

  async function abschicken(e: React.FormEvent) {
    e.preventDefault();
    const problem = pruefen();
    if (problem) {
      setMeldung(problem);
      return;
    }
    setMeldung(null);
    setPhase("senden");
    setStatus(m.sendet);

    const mitDateien = art === "hinweis" ? [] : gueltigeDateien;
    try {
      const antwort = await fetch("/api/parkour/beitrag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          art,
          sprache,
          name,
          gruppe_ort: gruppe,
          jahre,
          kontakt,
          wer_zu_sehen: art === "hinweis" ? "" : zuSehen,
          beschreibung: art === "hinweis" ? "" : beschreibung,
          link: art === "hinweis" ? "" : link,
          offline_material: art === "material" ? offline : false,
          hinweis: art === "hinweis" ? hinweis : "",
          antworten: art === "hinweis" ? antworten : {},
          einverstaendnis: einverstanden,
          dateien: mitDateien.map((d) => ({ name: d.datei.name, groesse: d.datei.size, typ: d.datei.type })),
          pk_strasse: falle,
          dauer_ms: Date.now() - geoeffnet.current,
        }),
      });
      const daten = await antwort.json().catch(() => null);
      if (antwort.status === 429) throw new Error(m.fehler.zuViele);
      if (!antwort.ok || !daten?.ok) throw new Error(daten?.fehler || m.fehler.allgemein);

      const uploads: { pfad: string; url: string; typ: string }[] = daten.uploads ?? [];
      const angekommen: string[] = [];
      for (let i = 0; i < uploads.length; i++) {
        const zeile = mitDateien[i];
        if (!zeile) break;
        setStatus(m.laedt(i + 1, uploads.length));
        setDateien((alt) => alt.map((d) => (d.id === zeile.id ? { ...d, status: "laedt" } : d)));
        const ok = await hochladen(uploads[i].url, zeile.datei, uploads[i].typ, (p) =>
          setDateien((alt) => alt.map((d) => (d.id === zeile.id ? { ...d, fortschritt: p } : d))),
        );
        setDateien((alt) =>
          alt.map((d) =>
            d.id === zeile.id
              ? { ...d, status: ok ? "ok" : "fehler", fortschritt: ok ? 1 : d.fortschritt, fehler: ok ? null : m.fehler.upload(d.datei.name) }
              : d,
          ),
        );
        if (ok) angekommen.push(uploads[i].pfad);
      }

      if (uploads.length) {
        await fetch("/api/parkour/beitrag/fertig", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: daten.id, schluessel: daten.schluessel, angekommen }),
        }).catch(() => null);
      }
      setTeilweise(angekommen.length < uploads.length);
      setPhase("fertig");
      abschnitt.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (fehler) {
      setPhase("formular");
      setMeldung(fehler instanceof Error && fehler.message ? fehler.message : m.fehler.allgemein);
    }
  }

  function zuruecksetzen() {
    setDateien([]);
    setBeschreibung("");
    setLink("");
    setOffline(false);
    setHinweis("");
    setAntworten({});
    setZuSehen("");
    setEinverstanden(false);
    setTeilweise(false);
    setPhase("formular");
    geoeffnet.current = Date.now();
  }

  const sendet = phase === "senden";

  return (
    <section id="mitmachen" ref={abschnitt} className="pk-mit" aria-labelledby="pk-mit-titel">
      <div className="pk-rahmen">
        <h2 id="pk-mit-titel" className="pk-h2">
          {m.titel}
        </h2>
        <p className="pk-mit-intro">{m.intro}</p>

        <div className="pk-wege" role="tablist" aria-label={m.titel}>
          {ARTEN.map((a) => (
            <button
              key={a}
              type="button"
              role="tab"
              aria-selected={art === a}
              className={art === a ? "pk-weg pk-weg-an" : "pk-weg"}
              onClick={() => {
                setArt(a);
                setMeldung(null);
                if (phase === "fertig") zuruecksetzen();
                history.replaceState(null, "", `#${a}`);
              }}
            >
              <span className="pk-weg-titel">{m.wege[a].titel}</span>
              <span className="pk-weg-text">{m.wege[a].text}</span>
            </button>
          ))}
        </div>

        {phase === "fertig" ? (
          <div className="pk-danke" role="status">
            <p className="pk-danke-titel">{m.danke.titel}</p>
            <p>{m.danke.text}</p>
            {teilweise && <p className="pk-fehler">{m.danke.teilweise}</p>}
            <button type="button" className="pk-knopf pk-knopf-zwei" onClick={zuruecksetzen}>
              {m.danke.nochmal}
            </button>
          </div>
        ) : (
          <div className="pk-mit-raster">
            <div className="pk-mit-kontext">
              {art === "video" && (
                <>
                  <h3 className="pk-h3">{m.video.fragenTitel}</h3>
                  <ol className="pk-fragen">
                    {m.video.fragen.map((frage) => (
                      <li key={frage}>{frage}</li>
                    ))}
                  </ol>
                  <h3 className="pk-h3">{m.video.tippsTitel}</h3>
                  <ul className="pk-tipps">
                    {m.video.tipps.map((tipp) => (
                      <li key={tipp}>{tipp}</li>
                    ))}
                  </ul>
                </>
              )}
              {art === "material" && (
                <>
                  <h3 className="pk-h3">{m.material.titel}</h3>
                  <p className="pk-kontext-text">{m.material.text}</p>
                  <p className="pk-kontext-text pk-leise">{m.material.offlineHilfe}</p>
                </>
              )}
              {art === "hinweis" && (
                <>
                  <h3 className="pk-h3">{m.wege.hinweis.text}</h3>
                  <p className="pk-kontext-text">{t.karte.legende}</p>
                </>
              )}
            </div>

            <form className="pk-form" onSubmit={abschicken} noValidate>
              {/* Honigfalle für Bots: für Menschen unsichtbar und ohne Tab-Stopp. */}
              <div className="pk-falle" aria-hidden="true">
                <label>
                  Strasse
                  <input tabIndex={-1} autoComplete="off" value={falle} onChange={(e) => setFalle(e.target.value)} />
                </label>
              </div>

              {art === "hinweis" && (
                <>
                  <label className="pk-feld">
                    <span className="pk-label">{m.hinweis.label}</span>
                    <textarea
                      rows={6}
                      value={hinweis}
                      maxLength={6000}
                      placeholder={m.hinweis.platzhalter}
                      onChange={(e) => setHinweis(e.target.value)}
                    />
                  </label>
                  <fieldset className="pk-gruppe">
                    <legend className="pk-label">{m.hinweis.fragenTitel}</legend>
                    {m.hinweis.fragen.map((q) => (
                      <label key={q.schluessel} className="pk-feld">
                        <span className="pk-frage">{q.frage}</span>
                        <textarea
                          rows={2}
                          maxLength={2000}
                          value={antworten[q.schluessel] ?? ""}
                          onChange={(e) => setAntworten((a) => ({ ...a, [q.schluessel]: e.target.value }))}
                        />
                      </label>
                    ))}
                  </fieldset>
                </>
              )}

              {art !== "hinweis" && (
                <>
                  <div
                    className={ziehen ? "pk-ablage pk-ablage-an" : "pk-ablage"}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setZiehen(true);
                    }}
                    onDragLeave={() => setZiehen(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setZiehen(false);
                      hinzufuegen(e.dataTransfer.files);
                    }}
                  >
                    <span className="pk-label">{f.dateien}</span>
                    <label className="pk-knopf pk-knopf-zwei pk-ablage-knopf">
                      {f.dateienWaehlen}
                      <input
                        type="file"
                        multiple
                        accept={art === "video" ? "video/*" : "video/*,image/*,application/pdf"}
                        onChange={(e) => {
                          hinzufuegen(e.target.files);
                          e.target.value = "";
                        }}
                        disabled={sendet}
                      />
                    </label>
                    <span className="pk-ablage-ziehen">{f.dateienZiehen}</span>
                    <span className="pk-hilfe">{f.dateienHilfe(maxMb)}</span>
                  </div>

                  {dateien.length > 0 && (
                    <ul className="pk-dateien">
                      {dateien.map((d) => (
                        <li key={d.id} className={d.fehler ? "pk-datei pk-datei-fehler" : "pk-datei"}>
                          <span className="pk-datei-name">{d.datei.name}</span>
                          <span className="pk-datei-groesse">{groesse(d.datei.size)}</span>
                          {!sendet && d.status !== "ok" && (
                            <button
                              type="button"
                              className="pk-datei-weg"
                              onClick={() => setDateien((alt) => alt.filter((x) => x.id !== d.id))}
                            >
                              {f.entfernen}
                            </button>
                          )}
                          {d.fehler && <span className="pk-datei-hinweis">{d.fehler}</span>}
                          {(d.status === "laedt" || d.status === "ok") && (
                            <span className="pk-balken" aria-hidden="true">
                              <span style={{ transform: `scaleX(${d.fortschritt})` }} />
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  <label className="pk-feld">
                    <span className="pk-label">{f.link}</span>
                    <input
                      type="url"
                      inputMode="url"
                      value={link}
                      maxLength={1000}
                      placeholder="https://"
                      onChange={(e) => setLink(e.target.value)}
                    />
                    <span className="pk-hilfe">{f.linkHilfe}</span>
                  </label>

                  {art === "material" && (
                    <label className="pk-check">
                      <input type="checkbox" checked={offline} onChange={(e) => setOffline(e.target.checked)} />
                      <span>{m.material.offline}</span>
                    </label>
                  )}

                  <label className="pk-feld">
                    <span className="pk-label">{art === "video" ? f.beschreibungVideo : f.beschreibungMaterial}</span>
                    <textarea
                      rows={3}
                      maxLength={4000}
                      value={beschreibung}
                      onChange={(e) => setBeschreibung(e.target.value)}
                    />
                  </label>

                  <label className="pk-feld">
                    <span className="pk-label">{f.zuSehen}</span>
                    <input
                      value={zuSehen}
                      maxLength={500}
                      placeholder={f.zuSehenPlatzhalter}
                      onChange={(e) => setZuSehen(e.target.value)}
                    />
                  </label>
                </>
              )}

              <fieldset className="pk-gruppe">
                <legend className="pk-label pk-label-gross">{f.ueberDich}</legend>
                <div className="pk-zwei">
                  <label className="pk-feld">
                    <span className="pk-label">{f.name}</span>
                    <input
                      value={name}
                      maxLength={120}
                      autoComplete="name"
                      required
                      onChange={(e) => setName(e.target.value)}
                    />
                  </label>
                  <label className="pk-feld">
                    <span className="pk-label">{f.kontakt}</span>
                    <input
                      value={kontakt}
                      maxLength={160}
                      autoComplete="email"
                      autoCapitalize="none"
                      required
                      onChange={(e) => setKontakt(e.target.value)}
                    />
                    <span className="pk-hilfe">{f.kontaktHilfe}</span>
                  </label>
                  <label className="pk-feld">
                    <span className="pk-label">{f.gruppe}</span>
                    <input value={gruppe} maxLength={160} onChange={(e) => setGruppe(e.target.value)} />
                  </label>
                  <label className="pk-feld">
                    <span className="pk-label">{f.jahre}</span>
                    <input
                      value={jahre}
                      maxLength={60}
                      placeholder={f.jahrePlatzhalter}
                      onChange={(e) => setJahre(e.target.value)}
                    />
                  </label>
                </div>
              </fieldset>

              <div className="pk-einverstaendnis">
                <label className="pk-check">
                  <input
                    type="checkbox"
                    checked={einverstanden}
                    onChange={(e) => setEinverstanden(e.target.checked)}
                  />
                  <span>{art === "hinweis" ? m.einverstaendnis.hinweis : m.einverstaendnis.material}</span>
                </label>
                {art !== "hinweis" && (
                  <ul className="pk-punkte">
                    {m.einverstaendnis.punkte.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                    <li>{m.einverstaendnis.unter18}</li>
                  </ul>
                )}
              </div>

              {meldung && (
                <p className="pk-fehler" role="alert">
                  {meldung}
                </p>
              )}

              <div className="pk-senden">
                <button type="submit" className="pk-knopf" disabled={sendet}>
                  {sendet ? m.sendet : m.senden}
                </button>
                {sendet && (
                  <span className="pk-status" aria-live="polite">
                    {status}
                  </span>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}

"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { VIEW, CH_BORDER, CITIES, LETTERS, TOTAL_KM } from "./route-data";
import "./dryll.css";

const RED = "#FF2E1F";
const EASE = [0.22, 1, 0.36, 1] as const;
const fmt = (n: number) => n.toLocaleString("de-CH");
const CAPS = ["Königsetappe", "Königsetappe", "Mittelstück", "Finale", "Finale"];

function DryllLogo() {
  return (
    <svg viewBox="0 0 87 22" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="DRYLL">
      <path fill="currentColor" d="M69.7656 21.5412C69.7656 20.5773 69.7656 19.6393 69.7656 18.7274C69.7656 17.8069 69.7656 16.756 69.7656 15.5749V9.19172C69.7656 7.94982 69.7656 6.85121 69.7656 5.8959C69.7656 4.94059 69.7656 3.96358 69.7656 2.96484L76.1749 2.96484C76.1749 3.96358 76.1749 4.94059 76.1749 5.8959C76.1749 6.85121 76.1749 7.94982 76.1749 9.19172V14.5328C76.1749 15.7139 76.1749 16.7647 76.1749 17.6853C76.1749 18.5972 76.1749 19.5351 76.1749 20.4991L74.0385 16.0178H77.9205C78.7108 16.0178 79.4056 16.0178 80.0048 16.0178C80.6127 16.0178 81.1772 16.0178 81.6983 16.0178C82.2194 16.0178 82.7491 16.0178 83.2876 16.0178V21.5412L69.7656 21.5412Z" />
      <path fill="currentColor" d="M54.4219 21.5412C54.4219 20.5773 54.4219 19.6393 54.4219 18.7274C54.4219 17.8069 54.4219 16.756 54.4219 15.5749V9.19172C54.4219 7.94982 54.4219 6.85121 54.4219 5.8959C54.4219 4.94059 54.4219 3.96358 54.4219 2.96484L60.8311 2.96484C60.8311 3.96358 60.8311 4.94059 60.8311 5.8959C60.8311 6.85121 60.8311 7.94982 60.8311 9.19172V14.5328C60.8311 15.7139 60.8311 16.7647 60.8311 17.6853C60.8311 18.5972 60.8311 19.5351 60.8311 20.4991L58.6947 16.0178H62.5767C63.367 16.0178 64.0618 16.0178 64.661 16.0178C65.269 16.0178 65.8335 16.0178 66.3545 16.0178C66.8756 16.0178 67.4054 16.0178 67.9438 16.0178V21.5412L54.4219 21.5412Z" />
      <path fill="currentColor" d="M40.9325 15.7573L37.337 8.00627C36.9462 7.16386 36.5728 6.36053 36.2167 5.59628C35.8607 4.82335 35.4525 3.94621 34.9922 2.96484L42.2352 2.96484C42.3828 3.5554 42.5087 4.06779 42.6129 4.50202C42.7172 4.92757 42.817 5.3314 42.9126 5.71353C43.0081 6.09565 43.1123 6.51686 43.2252 6.97714L43.7723 9.19172H44.2413L44.8145 7.01622C44.9448 6.53857 45.0577 6.10433 45.1532 5.71353C45.2574 5.31403 45.366 4.90152 45.4789 4.47597C45.6004 4.04174 45.7351 3.53803 45.8827 2.96484L52.8912 2.96484C52.5091 3.80725 52.1226 4.65834 51.7318 5.51812C51.341 6.36921 50.9632 7.19425 50.5984 7.99324L47.0551 15.7573H40.9325ZM40.8022 21.5412C40.8022 20.5773 40.8022 19.6393 40.8022 18.7274C40.8022 17.8069 40.8022 16.756 40.8022 15.5749V10.3641L47.2115 10.3641V15.5749C47.2115 16.756 47.2115 17.8069 47.2115 18.7274C47.2115 19.6393 47.2115 20.5773 47.2115 21.5412L40.8022 21.5412Z" />
      <path fill="currentColor" d="M19.0312 21.5412C19.0312 20.5773 19.0312 19.6393 19.0312 18.7274C19.0312 17.8069 19.0312 16.756 19.0312 15.5749L19.0312 9.19172C19.0312 7.94982 19.0312 6.85121 19.0312 5.8959C19.0312 4.94059 19.0312 3.96358 19.0312 2.96484C19.6565 2.96484 20.4208 2.96484 21.324 2.96484C22.2359 2.96484 23.1912 2.96484 24.1899 2.96484C25.1973 2.96484 26.1613 2.96484 27.0819 2.96484C28.7059 2.96484 30.0955 3.12985 31.2505 3.45987C32.4143 3.78988 33.3044 4.37175 33.921 5.20548C34.5376 6.03052 34.8459 7.19425 34.8459 8.69669C34.8459 9.83438 34.6201 10.8157 34.1685 11.6408C33.7169 12.4571 33.0222 13.0868 32.0842 13.5297C31.155 13.9726 29.9739 14.1941 28.5409 14.1941L31.1724 12.24L33.2567 16.0439C33.578 16.6258 33.921 17.251 34.2858 17.9198C34.6592 18.5885 35.0196 19.2398 35.367 19.8738C35.7144 20.5078 36.0184 21.0636 36.2789 21.5412L29.1141 21.5412C28.7928 20.8725 28.4845 20.2386 28.1892 19.6393C27.8939 19.0401 27.603 18.4495 27.3164 17.8677L24.7631 12.6569L28.5149 15.0017L24.1378 15.0017V11.1718L26.7692 11.1718C27.0298 11.1718 27.273 11.1284 27.4988 11.0415C27.7246 10.9547 27.9069 10.7897 28.0459 10.5465C28.1848 10.2947 28.2543 9.92991 28.2543 9.45226C28.2543 9.18303 28.2239 8.94421 28.1631 8.73577C28.1023 8.52734 28.0111 8.34931 27.8896 8.20167C27.7767 8.05403 27.6377 7.94547 27.4727 7.876C27.3077 7.79783 27.1166 7.75875 26.8995 7.75875L20.6987 7.75875L25.3102 4.007C25.3102 5.00573 25.3102 5.98275 25.3102 6.93806C25.3102 7.89337 25.3102 8.99197 25.3102 10.2339V15.5749C25.3102 16.756 25.3102 17.8069 25.3102 18.7274C25.3102 19.6393 25.3102 20.5773 25.3102 21.5412H19.0312Z" />
      <path fill="currentColor" d="M0 21.5412C0 20.5773 0 19.6393 0 18.7274C0 17.8069 0 16.756 0 15.5749L0 9.19172C0 7.94982 0 6.85121 0 5.8959C0 4.94059 0 3.96358 0 2.96484C0.6774 2.96484 1.4677 2.96484 2.3709 2.96484C3.28279 2.96484 4.24678 2.96484 5.26288 2.96484C6.28767 2.96484 7.31245 2.96484 8.33724 2.96484C9.73546 2.96484 10.9817 3.16893 12.076 3.57711C13.1702 3.9766 14.0951 4.5715 14.8507 5.3618C15.6149 6.14341 16.1968 7.10741 16.5963 8.25378C16.9958 9.40015 17.1955 10.7202 17.1955 12.214C17.1955 13.5253 17.0175 14.7499 16.6614 15.8876C16.3141 17.0166 15.7496 18.0066 14.9679 18.8577C14.1863 19.7001 13.1485 20.3601 11.8545 20.8378C10.5692 21.3068 8.98858 21.5412 7.1127 21.5412C6.18345 21.5412 5.30196 21.5412 4.46824 21.5412C3.6432 21.5412 2.85724 21.5412 2.11036 21.5412C1.37217 21.5412 0.668716 21.5412 0 21.5412ZM6.40925 16.5129H7.08665C7.93774 16.5129 8.61514 16.3261 9.11885 15.9527C9.62256 15.5706 9.98297 15.0495 10.2001 14.3895C10.4172 13.7294 10.5258 12.9782 10.5258 12.1358C10.5258 11.5192 10.4606 10.959 10.3304 10.4553C10.2088 9.95162 10.0134 9.51739 9.74414 9.15264C9.48361 8.7792 9.14491 8.49261 8.72804 8.29286C8.31118 8.09311 7.80747 7.99324 7.21692 7.99324H6.40925C6.40925 8.38405 6.40925 8.79657 6.40925 9.2308C6.40925 9.66503 6.40925 10.1904 6.40925 10.8071L6.40925 13.9075C6.40925 14.4633 6.40925 14.9496 6.40925 15.3665C6.40925 15.7747 6.40925 16.1568 6.40925 16.5129Z" />
    </svg>
  );
}

// ==================== KARTE (SVG, rote Route — Pierres Animation) ====================

function SwissMap({ progress, className = "" }: { progress: MotionValue<number>; className?: string }) {
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const [lengths, setLengths] = useState<number[]>([]);

  useEffect(() => {
    setLengths(pathRefs.current.map((p) => (p ? p.getTotalLength() : 0)));
  }, []);

  const total = LETTERS.reduce((s, l) => s + l.km, 0);
  const fractions: [number, number][] = [];
  let acc = 0;
  for (const l of LETTERS) {
    fractions.push([acc / total, (acc + l.km) / total]);
    acc += l.km;
  }

  useEffect(() => {
    if (lengths.length === 0) return;
    const apply = (v: number) => {
      pathRefs.current.forEach((p, i) => {
        if (!p || !lengths[i]) return;
        const [a, b] = fractions[i];
        const local = Math.max(0, Math.min(1, (v - a) / (b - a)));
        p.style.strokeDashoffset = String(lengths[i] * (1 - local));
      });
    };
    apply(progress.get());
    const unsub = progress.on("change", apply);
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, lengths]);

  return (
    <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} className={className} preserveAspectRatio="xMidYMid meet">
      <defs>
        <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path d={CH_BORDER} fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.22)" strokeWidth="1.2" />
      {CITIES.map((c) => (
        <g key={c.n} opacity="0.45">
          <circle cx={c.x} cy={c.y} r="2.5" fill="rgba(255,255,255,0.6)" />
          <text x={c.x + 8} y={c.y + 4} fill="rgba(255,255,255,0.55)" fontSize="14" style={{ letterSpacing: "0.08em" }}>{c.n}</text>
        </g>
      ))}
      {LETTERS.map((l, i) => (
        <path
          key={i}
          ref={(el) => { pathRefs.current[i] = el; }}
          d={l.d}
          fill="none"
          stroke={RED}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#routeGlow)"
          style={lengths.length === 0 ? undefined : { strokeDasharray: lengths[i], strokeDashoffset: lengths[i] }}
        />
      ))}
    </svg>
  );
}

const LETTER_ACTS = [
  { t: "Der Auftakt im Westen", d: "Zwei Loops zwischen Freiburg und Bern — der grösste Buchstabe des Wortes." },
  { t: "Durchs Emmental", d: "Hügel, Höfe, Panoramen — das R frisst fast so viele Höhenmeter wie das D." },
  { t: "Die Mitte des Wortes", d: "Durchs Hügelland von Oberaargau und Luzerner Hinterland — Halbzeit auf der Karte." },
  { t: "Der schnellste Buchstabe", d: "Durchs Aargauer Freiamt — der kürzeste Abschnitt, das Ziel rückt in Sichtweite." },
  { t: "Das Finale im Zürcher Oberland", d: "Der letzte Strich. Danach steht das Wort — sichtbar aus dem All." },
];

function RouteMap() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [act, setAct] = useState(0);
  const [km, setKm] = useState(0);
  const drawProgress = useTransform(scrollYProgress, [0.06, 0.92], [0, 1], { clamp: true });

  const total = LETTERS.reduce((s, l) => s + l.km, 0);
  useEffect(() => {
    const unsub = drawProgress.on("change", (v) => {
      setKm(Math.round(v * total));
      let acc = 0, idx = 0;
      for (let i = 0; i < LETTERS.length; i++) {
        if (v * total >= acc) idx = i;
        acc += LETTERS[i].km;
      }
      setAct(idx);
    });
    return () => unsub();
  }, [drawProgress, total]);

  return (
    <div ref={ref} className="maproute">
      <div className="stick">
        <SwissMap progress={drawProgress} />
        <div className="topline">
          <span>Start · bei Bern</span>
          <span style={{ color: RED }}>Ziel · Zürcher Oberland</span>
        </div>
        <div className="act">
          {LETTER_ACTS.map((a, i) => (
            <motion.div key={i} style={{ position: "absolute", inset: 0 }} animate={{ opacity: act === i ? 1 : 0, y: act === i ? 0 : 14 }} transition={{ duration: 0.5, ease: EASE }}>
              <div className="k">Buchstabe {i + 1} · {LETTERS[i].label} · {fmt(LETTERS[i].km)} km · +{fmt(LETTERS[i].hm)} hm</div>
              <h3>{a.t}</h3>
              <p>{a.d}</p>
            </motion.div>
          ))}
        </div>
        <div className="counter">
          <div className="lab">Scrollen, um zu schreiben</div>
          <div className="val num">{fmt(km)}<span className="unit">km</span></div>
        </div>
      </div>
    </div>
  );
}

// ==================== PAGE ====================

export default function DryllPresentationPage() {
  return (
    <div className="dryllpage">
      <nav className="nav"><div className="wrap">
        <a className="logo" href="#top" aria-label="DRYLL"><DryllLogo /></a>
        <div className="links">
          <a href="#idee">Die Idee</a>
          <a href="#etappen">Etappen</a>
          <a href="#setup">Das Setup</a>
        </div>
      </div></nav>

      <header className="hero" id="top"><div className="wrap">
        <div className="eyebrow">DRYLL × Pierre Biege · Internes Konzept · Herbst 2026</div>
        <h1>The World&apos;s<br />Biggest Ad</h1>
        <p className="lead">Ein Läufer schreibt <b>DRYLL</b> quer über die Schweiz. Der Markenname als GPS-Artwork auf Strava, vom Freiburgerland bis ins Zürcher Oberland. <b>Reichweite: erlaufen, nicht erkauft.</b></p>
        <div className="kpis">
          <div className="kpi"><div className="v num">1&apos;079</div><div className="l">Kilometer gesamt</div></div>
          <div className="kpi"><div className="v num">28&apos;100</div><div className="l">Höhenmeter (3× Everest)</div></div>
          <div className="kpi"><div className="v num">5</div><div className="l">Buchstaben · 7 Loops</div></div>
          <div className="kpi"><div className="v num">153</div><div className="l">km Breite (Luftlinie)</div></div>
        </div>
      </div></header>

      <RouteMap />

      <section id="idee"><div className="wrap">
        <div className="tag">Die Idee</div>
        <h2>Die grösste erlaufene Werbung der Welt</h2>
        <div className="rule"></div>
        <div className="body">
          <p>Diesen Herbst entsteht der DRYLL-Schriftzug als durchgehendes Artwork über 1&apos;079 Kilometer. <b>Kein Mediabudget kauft diese Geschichte.</b> Sie wird gelaufen — Kilometer für Kilometer, live verfolgbar auf Strava, in den Social Feeds und auf einem Kampagnen-Hub.</p>
          <p>Pierre Biege ist Ultraläufer und Teil des DRYLL-Teams. Kein gekaufter Athlet, der ein Produkt hochhält — er läuft für die eigene Marke durch das ganze Land. Das Making-of zeigt die Arbeit dahinter.</p>
        </div>
      </div></section>

      <div className="quote"><div className="wrap">
        <blockquote>„Ich bin nicht das Testimonial. Ich bin Teil des Teams — und laufe das selbst.&quot;</blockquote>
        <cite>Pierre Biege</cite>
      </div></div>

      <section><div className="wrap">
        <div className="tag">Die Dimension</div>
        <h2>Ein Wort, so gross wie das Mittelland</h2>
        <div className="rule"></div>
        <div className="body"><p>Die Route ist fertig geplant. Jeder Kilometer liegt auf echten Wegen und Trails, alle grossen Seen sind umlaufen, die GPX-Datei ist bereit. Bisheriges Maximum zu Fuss: rund 153 km. Unser Wort: <b>1&apos;079 km.</b></p></div>
        <div className="metrics">
          <div className="metric"><div className="v num">1&apos;079</div><div className="l">km Gesamtdistanz — quer durchs Mittelland</div></div>
          <div className="metric"><div className="v num">+28&apos;100</div><div className="l">Höhenmeter — mehr als 3× Everest</div></div>
          <div className="metric"><div className="v num">5·7</div><div className="l">Buchstaben über sieben Loops</div></div>
          <div className="metric"><div className="v num">≈153</div><div className="l">km Breite des Schriftzugs (Luftlinie)</div></div>
        </div>
      </div></section>

      <section><div className="wrap">
        <div className="tag">Der Rekord</div>
        <h2>7× grösser als jedes erlaufene Artwork</h2>
        <div className="rule"></div>
        <div className="body"><p>Der Rekord ist der PR-Hebel. Er muss jedem Faktencheck standhalten. Hier die Rekordlage, recherchiert im Juli 2026.</p></div>
        <div className="records">
          <div className="rec"><div className="n num">01</div><p>Das grösste GPS-Drawing zu Fuss misst 116 km, nonstop in 24 Stunden (Wales, 2024). Das grösste mehrtägige Einzel-Artwork misst rund 153 km (San Francisco). <b>Unser Wort misst 1&apos;079 km.</b></p></div>
          <div className="rec"><div className="n num">02</div><p>Grössere GPS-Drawings existieren nur mit Fahrzeugen. Velo bis 7&apos;237 km, Auto 7&apos;164 km («Marry Me», Japan). Unser Claim heisst deshalb präzis: <b>das grösste je erlaufene GPS-Artwork der Welt.</b></p></div>
          <div className="rec"><div className="n num">03</div><p>Zur Transparenz: Ein Läufer in Toronto sammelte 2024 rund 1&apos;100 km für Strava-Art — verteilt auf über 100 kleine Einzelbilder. <b>Ein einzelnes Artwork dieser Grösse lief noch niemand.</b></p></div>
          <div className="rec"><div className="n num">04</div><p>«The World&apos;s Biggest Ad» ist Kampagnen-Titel, kein Rekord-Claim. Guinness misst Werbung in m². Der belastbare Superlativ lautet: <b>erlaufen.</b></p></div>
        </div>
      </div></section>

      <section id="etappen"><div className="wrap">
        <div className="tag">Wie ich das laufe</div>
        <h2>Ein Wort. Am Stück.</h2>
        <div className="rule"></div>
        <div className="letters">
          {LETTERS.map((l, i) => (
            <div className="let" key={i}>
              <div className="big">{l.label}</div>
              <div className="km num">{fmt(l.km)} km</div>
              <div className="hm num">+{fmt(l.hm)} hm</div>
              <div className="cap">{CAPS[i]}</div>
            </div>
          ))}
        </div>
        <div className="cols">
          <div className="col">
            <h3>Der Plan</h3><div className="sub">Alles am Stück</div>
            <ul>
              <li>Eine durchgehende Expedition vom ersten bis zum letzten Strich: 12–14 Tagesetappen à 80–90 km, ohne Ruhetag.</li>
              <li>Ein einziger erzählerischer Bogen — eine Geschichte ohne Unterbruch.</li>
              <li>Live-Tracking wird zum Dauerformat: Wo ist Pierre gerade?</li>
              <li>Jeder fertige Buchstabe bleibt ein eigener Meilenstein im Feed — das Wort wächst öffentlich.</li>
              <li>Zeitraum: Oktober / November 2026 · 12–14 Tage plus Reservetage.</li>
            </ul>
          </div>
          <div className="col">
            <h3>Der Rhythmus</h3><div className="sub">So sieht ein Tag aus</div>
            <ul>
              <li>Start im Morgengrauen — 80–90 km in 10–13 Stunden, in Blöcken mit Verpflegungsstopps.</li>
              <li>Das Crew-Fahrzeug springt voraus: Verpflegung, Kleiderwechsel, kurze Checks.</li>
              <li>Abends: Physio, Content-Schnitt, Schlaf im Basecamp — jeden Tag derselbe Ablauf.</li>
              <li>Puffer liegt am Ende, nicht unterwegs: Reservetage fangen Wetter und Körper ab.</li>
            </ul>
          </div>
        </div>
      </div></section>

      <section id="setup"><div className="wrap">
        <div className="tag">Das Setup</div>
        <h2>Einer läuft. Ein Team macht es möglich.</h2>
        <div className="rule"></div>
        <div className="body"><p>Sieben Rollen, ein Fahrzeug, zwei Wochen. Das ist die Crew, die aus einem Lauf eine Kampagne macht.</p></div>
        <div className="crew">
          <div className="role"><div className="rn">01</div><h4>Crew-Chief &amp; Logistik</h4><p>Plant Tagesabläufe, Verpflegung, Übernachtungen und Übergabepunkte. Die eine Person, die immer weiss, was als Nächstes passiert.</p></div>
          <div className="role"><div className="rn">02</div><h4>Crew-Fahrzeug</h4><p>Rollendes Basecamp: Schlafen, Küche, Material, Ladezentrale. Idee: Ford als Fahrzeugpartner an Bord — Branding auf dem Van inklusive.</p></div>
          <div className="role"><div className="rn">03</div><h4>Kamera-Team (2)</h4><p>Dokumentation in Kinoqualität plus Drohne. Material für die grosse Doku, den Making-of-Film und alle Cutdowns.</p></div>
          <div className="role"><div className="rn">04</div><h4>Live-Producer</h4><p>GPS-Live-Tracking und Streaming auf dem Kampagnen-Hub. Die Route zeichnet sich in Echtzeit auf der Karte — jeder kann zuschauen.</p></div>
          <div className="role"><div className="rn">05</div><h4>Social Media</h4><p>Begleitet das Projekt durchgehend. Tägliche Reels und Stories, beantwortet Kommentare. Content geht raus, während gelaufen wird.</p></div>
          <div className="role"><div className="rn">06</div><h4>Physio</h4><p>Tägliche Behandlung, Belastungssteuerung, Fussmanagement. Bei diesen Umfängen keine Option, sondern Voraussetzung.</p></div>
          <div className="role"><div className="rn">07</div><h4>Mentale Begleitung</h4><p>Eine Bezugsperson für die dunklen Stunden — Tag 9 im Dauerregen gewinnt man im Kopf, nicht in den Beinen.</p></div>
          <div className="role"><div className="rn">—</div><h4>Pierre</h4><p>Läuft. Alles davor und danach macht das Team — genau dafür steht dieses Konzept.</p></div>
        </div>
      </div></section>

      <section><div className="wrap">
        <div className="tag">Rollout</div>
        <h2>Spannung. Live. Nachhall.</h2>
        <div className="rule"></div>
        <div className="phases">
          <div className="phase"><div className="pn num">01</div><h4>Vorher</h4><p>Teaser, der andeutet statt verrät: «Diesen Herbst schreibe ich etwas, das man aus dem All sieht.» Presse-Seeding mit der Rekordzahl.</p></div>
          <div className="phase"><div className="pn num">02</div><h4>Während</h4><p>Live-Tracking auf dem Kampagnen-Hub, tägliche Reels und Stories, jeder fertige Buchstabe als eigener Strava- und Social-Moment.</p></div>
          <div className="phase"><div className="pn num">03</div><h4>Nachher</h4><p>Die grosse Doku und der Making-of-Film, Press-Kit mit der Rekordzahl — ein Artwork, das der Marke für immer gehört.</p></div>
        </div>
      </div></section>

      <div className="cred"><div className="wrap">
        <div className="tag">Warum das glaubwürdig ist</div>
        <h2>Aus dem Team, für die Marke</h2>
        <div className="rule"></div>
        <div className="body"><p>Pierre ist Ultraläufer, Content Creator und Teil des DRYLL-Teams. <b>Kein gekaufter Athlet, der ein Produkt hochhält.</b> Er läuft für die eigene Marke durch das ganze Land.</p></div>
        <div className="band">
          <div><div className="v num">12 Mio.</div><div className="l">Aufrufe / 90 Tage · alle Kanäle</div></div>
          <div><div className="v num">794k</div><div className="l">aktive Konten erreicht</div></div>
        </div>
      </div></div>

      <section className="dec"><div className="wrap">
        <div className="tag">Für die interne Diskussion</div>
        <h2>Fünf Entscheide, dann laufen wir.</h2>
        <div className="rule"></div>
        <div className="declist">
          <div className="decrow"><div className="di">01</div><div><div className="dq">Welcher Zeitraum im Oktober / November?</div><div className="da">12–14 Tage plus Reservetage. Muss mit dem ganzen Team, der Crew-Verfügbarkeit und Pierres Familie abgestimmt werden (Schulferien der Kids).</div></div></div>
          <div className="decrow"><div className="di">02</div><div><div className="dq">80 oder 90 km pro Tag?</div><div className="da">90 km/Tag = 12 Etappen, 80 km/Tag = 14. Definiert Enddatum, Reservetage und wie lange die Crew gebucht wird.</div></div></div>
          <div className="decrow"><div className="di">03</div><div><div className="dq">Ford als Fahrzeugpartner?</div><div className="da">Ein gebrandeter Van als rollendes Basecamp senkt Kosten und bringt einen zweiten Partner mit eigener Reichweite ins Projekt.</div></div></div>
          <div className="decrow"><div className="di">04</div><div><div className="dq">Livestream: 24/7 oder Daily?</div><div className="da">Durchgehender Stream mit fixem Producer — oder tägliche Live-Fenster plus Recap? Kosten- und Personalfrage.</div></div></div>
          <div className="decrow"><div className="di">05</div><div><div className="dq">Budgetrahmen &amp; Crew-Rekrutierung</div><div className="da">7 Rollen über ~2 Wochen: Welche besetzen wir aus dem Netzwerk, welche buchen wir ein? Entscheid nötig bis Ende August.</div></div></div>
        </div>
      </div></section>

      <div className="cta"><div className="wrap">
        <div className="big">„Man kann Werbung kaufen. Oder man kann sie laufen.&quot;</div>
        <div className="body">Route steht. GPX ist fertig. Zielfenster: Oktober / November 2026 — den genauen Zeitraum legen wir gemeinsam fest. Jetzt braucht es nur noch ein Go vom Team.</div>
        <div className="contact">
          <div className="name">Pierre Biege</div>
          <a href="mailto:pierre@laeuft.ch">pierre@laeuft.ch</a>
          <a href="tel:+41798533672">+41 79 853 36 72</a>
        </div>
      </div></div>

      <footer><div className="wrap">
        <div className="note">Internes Konzept · nicht öffentlich teilen</div>
        <div className="cities">Genf · Bern · Zürich · Basel · Luzern · Sion · St. Moritz · Lugano</div>
      </div></footer>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useRef, useState, useEffect, Fragment } from "react";
import { motion, useScroll, useTransform, useInView, type MotionValue } from "framer-motion";
import { Mail, Phone, Truck, Camera, Radio, MessageCircle, HeartPulse, Brain, ClipboardList, Map } from "lucide-react";
import { VIEW, CH_BORDER, CITIES, LETTERS, TOTAL_KM, TOTAL_HM } from "./route-data";

const EASE = [0.22, 1, 0.36, 1] as const;
const RED = "#FF2E1F"; // DRYLL Signalrot
const W = (n: number) => `/presentations/garmin/${String(n).padStart(2, "0")}.jpg`;
const fmt = (n: number) => n.toLocaleString("de-CH");

// ==================== PRIMITIVES ====================

function AnimatedWords({ text, className = "", delay = 0, stagger = 0.05 }: { text: string; className?: string; delay?: number; stagger?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const words = text.split(" ");
  return (
    <span ref={ref} className={className} style={{ display: "inline-block" }}>
      {words.map((word, i) => (
        <Fragment key={i}>
          <span style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top" }}>
            <motion.span style={{ display: "inline-block", willChange: "transform" }} initial={{ y: "110%", opacity: 0 }} animate={inView ? { y: "0%", opacity: 1 } : { y: "110%", opacity: 0 }} transition={{ duration: 0.9, ease: EASE, delay: delay + i * stagger }}>
              {word}
            </motion.span>
          </span>
          {i < words.length - 1 ? " " : ""}
        </Fragment>
      ))}
    </span>
  );
}

function FadeUp({ children, delay = 0, y = 40, className = "" }: { children: React.ReactNode; delay?: number; y?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  return (
    <motion.div ref={ref} className={className} initial={{ opacity: 0, y }} animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }} transition={{ duration: 1, ease: EASE, delay }}>
      {children}
    </motion.div>
  );
}

function ScrollRevealText({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "start 0.25"] });
  const words = text.split(" ");
  return (
    <p ref={ref} className={className}>
      {words.map((word, i) => {
        const start = i / words.length;
        const end = start + 1 / words.length;
        return <RevealWord key={i} progress={scrollYProgress} range={[start, end]}>{word}</RevealWord>;
      })}
    </p>
  );
}

function RevealWord({ children, progress, range }: { children: React.ReactNode; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.18, 1]);
  return <motion.span style={{ opacity }} className="inline-block mr-[0.25em]">{children}</motion.span>;
}

function ParallaxImage({ src, className = "" }: { src: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.12, 1.04]);
  return (
    <motion.div ref={ref} className={`relative overflow-hidden bg-zinc-900 ${className}`} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 1.1, ease: EASE }}>
      <motion.div className="absolute inset-0" style={{ y, scale }}><Image src={src} alt="" fill className="object-cover" /></motion.div>
    </motion.div>
  );
}

// ==================== KARTE (SVG, dunkel + rote Route) ====================

function SwissMap({ progress, className = "", staticFull = false }: { progress?: MotionValue<number>; className?: string; staticFull?: boolean }) {
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const [lengths, setLengths] = useState<number[]>([]);

  useEffect(() => {
    setLengths(pathRefs.current.map((p) => (p ? p.getTotalLength() : 0)));
  }, []);

  // km-Anteile bestimmen, wann welcher Buchstabe gezeichnet wird
  const total = LETTERS.reduce((s, l) => s + l.km, 0);
  const fractions: [number, number][] = [];
  let acc = 0;
  for (const l of LETTERS) {
    fractions.push([acc / total, (acc + l.km) / total]);
    acc += l.km;
  }

  useEffect(() => {
    if (staticFull || !progress || lengths.length === 0) return;
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
  }, [progress, lengths, staticFull]);

  return (
    <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} className={className} preserveAspectRatio="xMidYMid meet">
      <defs>
        <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Landesumriss */}
      <path d={CH_BORDER} fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.22)" strokeWidth="1.2" />
      {/* Städte zur Orientierung */}
      {CITIES.map((c) => (
        <g key={c.n} opacity="0.45">
          <circle cx={c.x} cy={c.y} r="2.5" fill="rgba(255,255,255,0.6)" />
          <text x={c.x + 8} y={c.y + 4} fill="rgba(255,255,255,0.55)" fontSize="14" fontFamily="inherit" style={{ letterSpacing: "0.08em" }}>{c.n}</text>
        </g>
      ))}
      {/* Route: pro Buchstabe ein Pfad, per Scroll gezeichnet */}
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
          style={staticFull || lengths.length === 0 ? undefined : { strokeDasharray: lengths[i], strokeDashoffset: lengths[i] }}
        />
      ))}
    </svg>
  );
}

// ==================== HEADER ====================

function Header() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.6);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? "bg-black/60 backdrop-blur-md py-4" : "py-6"}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className={`text-sm font-semibold uppercase tracking-[0.25em] text-white transition-opacity duration-500 ${scrolled ? "opacity-100" : "opacity-0 pointer-events-none"}`}>DRYLL × Pierre</button>
        <nav className="flex items-center gap-6 text-xs uppercase tracking-[0.2em] text-white/80">
          <button onClick={() => go("idee")} className="hover:text-white transition-colors">Die Idee</button>
          <button onClick={() => go("etappen")} className="hover:text-white transition-colors">Etappen</button>
          <button onClick={() => go("setup")} className="hover:text-white transition-colors"><span className="border-b-2 border-white pb-1">Das Setup</span></button>
        </nav>
      </div>
    </header>
  );
}

// ==================== HERO ====================

function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const mapY = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const mapScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.25]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  return (
    <section ref={ref} className="relative h-screen flex items-center justify-center overflow-hidden bg-black text-white">
      <motion.div className="absolute inset-0 flex items-center justify-center opacity-35" style={{ y: mapY, scale: mapScale }}>
        <SwissMap staticFull className="w-full h-full max-w-none p-8" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black" />
      </motion.div>
      <motion.div className="relative z-10 max-w-6xl mx-auto px-6 text-center" style={{ opacity: contentOpacity }}>
        <motion.div className="inline-block mb-8 px-5 py-2 border border-white/20 text-xs uppercase tracking-[0.4em] text-white/70" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2 }}>
          DRYLL Switzerland · Internes Konzept · Herbst 2026
        </motion.div>
        <h1 className="sr-only">The World&apos;s Biggest Ad — der DRYLL-Schriftzug als Strava-Artwork über die Schweiz</h1>
        <div className="text-5xl md:text-7xl lg:text-[7rem] font-black tracking-tight leading-[0.9] mb-8">
          <AnimatedWords text="The World's Biggest Ad." delay={0.35} stagger={0.08} />
        </div>
        <motion.p className="text-lg md:text-2xl text-white/80 font-light max-w-3xl mx-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 1.2 }}>
          Ein Läufer schreibt DRYLL quer über die Schweiz. {fmt(TOTAL_KM)} Kilometer, {fmt(TOTAL_HM)} Höhenmeter, fünf Buchstaben. Reichweite: Erlaufen, nicht erkauft.
        </motion.p>
      </motion.div>
      <motion.div className="absolute left-1/2 -translate-x-1/2 bottom-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 2 }}>
        <motion.div className="w-px h-16 bg-white/40" animate={{ scaleY: [0, 1, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} style={{ transformOrigin: "top" }} />
      </motion.div>
    </section>
  );
}

// ==================== ROUTE (Scroll-Animation) ====================

const LETTER_ACTS = [
  { k: "Buchstabe 1 · D", t: "Der Auftakt im Westen", d: "Zwei Loops zwischen Freiburg und Bern — der grösste Buchstabe des Wortes." },
  { k: "Buchstabe 2 · R", t: "Durchs Emmental", d: "Hügel, Höfe, Panoramen — das R frisst fast so viele Höhenmeter wie das D." },
  { k: "Buchstabe 3 · Y", t: "Die Mitte des Wortes", d: "Durchs Hügelland von Oberaargau und Luzerner Hinterland — Halbzeit auf der Karte." },
  { k: "Buchstabe 4 · L", t: "Der schnellste Buchstabe", d: "Durchs Aargauer Freiamt — der kürzeste Abschnitt, das Ziel rückt in Sichtweite." },
  { k: "Buchstabe 5 · L", t: "Das Finale im Zürcher Oberland", d: "Der letzte Strich. Danach steht das Wort — sichtbar aus dem All." },
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
    <section ref={ref} className="relative h-[520vh] bg-black">
      <div className="sticky top-0 h-screen overflow-hidden flex items-center justify-center">
        <SwissMap progress={drawProgress} className="w-full h-full max-h-screen px-4 md:px-12 py-24" />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-black/60" />
        <div className="absolute top-24 left-6 right-6 flex justify-between text-[10px] md:text-xs uppercase tracking-[0.3em] text-white/60 pointer-events-none">
          <span>Start · bei Bern</span>
          <span style={{ color: RED }}>Ziel · Zürcher Oberland</span>
        </div>
        <div className="absolute left-6 md:left-12 bottom-14 w-[85%] md:w-[30rem] h-44 pointer-events-none">
          {LETTER_ACTS.map((a, i) => (
            <motion.div key={i} className="absolute inset-0" animate={{ opacity: act === i ? 1 : 0, y: act === i ? 0 : 14 }} transition={{ duration: 0.5, ease: EASE }}>
              <div className="text-[11px] uppercase tracking-[0.25em] mb-3" style={{ color: RED }}>{a.k} · {fmt(LETTERS[i].km)} km · +{fmt(LETTERS[i].hm)} hm</div>
              <h3 className="text-3xl md:text-5xl font-black leading-[0.95] text-white mb-3">{a.t}</h3>
              <p className="text-white/70 font-light text-sm md:text-base">{a.d}</p>
            </motion.div>
          ))}
        </div>
        <div className="absolute right-6 md:right-12 bottom-14 text-right pointer-events-none">
          <div className="text-[10px] uppercase tracking-[0.3em] text-white/50 mb-1">Scrollen, um zu schreiben</div>
          <div className="text-4xl md:text-6xl font-black text-white/90 tabular-nums">{fmt(km)}<span className="text-lg md:text-2xl align-top ml-0.5">km</span></div>
        </div>
      </div>
    </section>
  );
}

// ==================== PITCH ====================

function Pitch() {
  return (
    <section className="bg-black text-white py-24 md:py-36 px-6 text-center border-y border-white/10">
      <FadeUp>
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] max-w-5xl mx-auto">
          Die extremste Werbung der Welt:<br className="hidden md:block" /> erlaufen, nicht erkauft.
        </h2>
      </FadeUp>
      <FadeUp delay={0.2}>
        <p className="text-lg md:text-2xl text-white/65 font-light mt-8 max-w-3xl mx-auto">
          Pierre Biege — Ultraläufer und Teil des DRYLL-Teams — schreibt den Markennamen als Strava-Artwork über das ganze Land. Die Aktion lebt dort, wo die Szene zuhause ist: Strava, Social Feeds und ein Live-Hub, auf dem alles zusammenläuft.
        </p>
      </FadeUp>
    </section>
  );
}

// ==================== IDEE ====================

function Idee() {
  return (
    <section id="idee" className="bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white py-40 md:py-48 px-6 overflow-hidden scroll-mt-16">
      <div className="max-w-4xl mx-auto">
        <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-12 text-center">Die Idee</div></FadeUp>
        <ScrollRevealText text="Diesen Herbst lassen wir die vermutlich grösste erlaufene Werbung der Welt entstehen: der DRYLL-Schriftzug als gigantisches Strava-Artwork, das sich vom Freiburgerland bis ins Zürcher Oberland erstreckt." className="text-2xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.25] text-center" />
      </div>
      <div className="max-w-4xl mx-auto mt-28">
        <ScrollRevealText text="Kein Mediabudget kauft diese Geschichte. Sie wird gelaufen — Kilometer für Kilometer, live verfolgbar, mit einem Making-of, das zeigt, was ein Mensch für eine Idee leistet." className="text-2xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.25] text-center" />
        <FadeUp delay={0.3}><p className="text-center mt-16 text-lg text-white/50 italic">„Ich bin nicht das Testimonial. Ich bin Teil des Teams — und laufe das selbst.“</p></FadeUp>
      </div>
    </section>
  );
}

// ==================== ECKWERTE ====================

function Eckwerte() {
  const stats = [
    { value: fmt(TOTAL_KM), unit: "km", label: "Gesamtdistanz — quer durchs Mittelland" },
    { value: `+${fmt(TOTAL_HM)}`, unit: "hm", label: "Höhenmeter — mehr als 3× Everest" },
    { value: "5", unit: "", label: "Buchstaben · 7 Loops" },
    { value: "≈153", unit: "km", label: "Breite des Schriftzugs Luftlinie" },
  ];
  return (
    <section className="bg-black text-white py-28 md:py-40 px-6">
      <div className="max-w-7xl mx-auto">
        <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Die Dimension</div></FadeUp>
        <h2 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.9] mb-16 max-w-4xl"><AnimatedWords text="Ein Wort, so gross wie das Mittelland." stagger={0.05} /></h2>
        <div className="grid grid-cols-2 md:grid-cols-4 border-t border-white/15">
          {stats.map((s, i) => (
            <FadeUp key={i} delay={i * 0.08}>
              <div className="border-b md:border-b-0 border-r border-white/15 py-10 pr-4 md:pl-6 first:md:pl-0">
                <div className="text-4xl md:text-6xl font-black tracking-tight" style={{ color: i === 0 ? RED : "#fff" }}>{s.value}<span className="text-xl md:text-2xl align-top ml-1">{s.unit}</span></div>
                <div className="text-xs uppercase tracking-wider text-white/50 mt-3">{s.label}</div>
              </div>
            </FadeUp>
          ))}
        </div>
        <FadeUp delay={0.3}>
          <p className="text-white/55 text-base md:text-lg font-light max-w-3xl mt-12">
            Die Route ist fertig geplant: auf echte Wege und Trails gesnappt, alle grossen Seen umlaufen, als GPX-Datei bereit. Die grössten dokumentierten GPS-Artworks zu Fuss liegen bei 116 bis rund 153 km — wir laufen ein einzelnes Wort von {fmt(TOTAL_KM)} km.
          </p>
        </FadeUp>
      </div>
    </section>
  );
}

// ==================== REKORD ====================

function Rekord() {
  const facts = [
    "Das grösste dokumentierte GPS-Drawing zu Fuss: 116 km, nonstop in 24 Stunden (Wales, 2024). Das grösste mehrtägig erlaufene Einzel-Artwork: rund 153 km (San Francisco). Unser Wort: " + fmt(TOTAL_KM) + " km.",
    "Grössere GPS-Drawings existieren nur mit Fahrzeugen: per Velo bis 7'237 km, per Auto 7'164 km («Marry Me», quer durch Japan). Unser Claim heisst deshalb präzis: das grösste je erlaufene GPS-Artwork der Welt.",
    "Volle Transparenz: Ein Läufer in Toronto sammelte 2024 rund 1'100 km für Strava-Art — verteilt auf über 100 kleine Einzelbilder einer Animation. Ein einzelnes, zusammenhängendes Artwork dieser Grösse ist zu Fuss noch nie entstanden.",
    "«The World's Biggest Ad» ist Kampagnen-Titel, kein Rekord-Claim: Physische Werbe-Rekorde misst Guinness in m² (grösstes Poster ~29'000 m²). Unser Schriftzug spannt sich über 150 km Landesbreite — eine andere Liga, aber kein Inserat. Der belastbare Superlativ lautet: erlaufen.",
  ];
  return (
    <section className="bg-zinc-950 text-white py-28 md:py-40 px-6">
      <div className="max-w-5xl mx-auto">
        <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Der Rekord</div></FadeUp>
        <h2 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.9] mb-8"><AnimatedWords text="7× grösser als jedes erlaufene Artwork." stagger={0.05} /></h2>
        <FadeUp delay={0.25}><p className="text-lg md:text-xl text-white/60 font-light max-w-3xl mb-14">Der Rekord ist der PR-Hebel — und er muss jedem Faktencheck standhalten. Darum hier die ehrliche Rekordlage (recherchiert, Stand Juli 2026).</p></FadeUp>
        <div>
          {facts.map((f, i) => (
            <FadeUp key={i} delay={0.04 * i}>
              <div className="grid grid-cols-[auto_1fr] gap-5 py-5 border-t border-white/12 items-baseline">
                <div className="text-sm font-bold tabular-nums text-white/50">{String(i + 1).padStart(2, "0")}</div>
                <p className="text-white/75 font-light md:text-lg leading-relaxed">{f}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==================== ETAPPEN ====================

function Etappen() {
  return (
    <section id="etappen" className="bg-black text-white py-28 md:py-40 px-6 scroll-mt-16">
      <div className="max-w-7xl mx-auto">
        <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Wie ich das laufe</div></FadeUp>
        <h2 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.9] mb-16 max-w-4xl"><AnimatedWords text="Ein Wort. Am Stück." stagger={0.05} /></h2>

        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <FadeUp>
            <div className="border border-white p-8 md:p-10 h-full relative overflow-hidden bg-white/[0.04]">
              <div className="inline-block text-[10px] uppercase tracking-[0.3em] px-3 py-1 mb-6 font-semibold bg-white text-black">Der Plan</div>
              <h3 className="text-3xl md:text-4xl font-extrabold mb-4">Alles am Stück</h3>
              <p className="text-white/70 font-light leading-relaxed mb-6">Eine durchgehende Expedition vom ersten bis zum letzten Strich: 12–14 Tagesetappen à 80–90 km, ohne Ruhetag.</p>
              <ul className="space-y-2.5 text-white/75 font-light">
                <li className="flex gap-3"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 bg-white" />Ein einziger erzählerischer Bogen — maximale Fallhöhe, echtes Expeditionsgefühl</li>
                <li className="flex gap-3"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 bg-white" />Live-Tracking wird zum Dauerformat: Wo ist Pierre gerade?</li>
                <li className="flex gap-3"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 bg-white" />Jeder fertige Buchstabe bleibt ein eigener Meilenstein im Feed — das Wort wächst öffentlich</li>
              </ul>
              <div className="mt-8 pt-6 border-t border-white/15 text-sm text-white/55">Zeitraum: <span className="text-white">Oktober / November 2026</span> · 12–14 Tage plus Reservetage — genaues Fenster definieren wir gemeinsam</div>
            </div>
          </FadeUp>
          <FadeUp delay={0.1}>
            <div className="border border-white/15 p-8 md:p-10 h-full">
              <div className="inline-block text-[10px] uppercase tracking-[0.3em] px-3 py-1 mb-6 border border-white/25 text-white/60">Der Rhythmus</div>
              <h3 className="text-3xl md:text-4xl font-extrabold mb-4">So sieht ein Tag aus</h3>
              <ul className="space-y-2.5 text-white/75 font-light">
                <li className="flex gap-3"><span className="mt-2.5 h-1.5 w-1.5 bg-white/40 shrink-0" />Start im Morgengrauen — 80–90 km in 10–13 Stunden, in Blöcken mit Verpflegungsstopps</li>
                <li className="flex gap-3"><span className="mt-2.5 h-1.5 w-1.5 bg-white/40 shrink-0" />Das Crew-Fahrzeug springt voraus: Verpflegung, Kleiderwechsel, kurze Checks</li>
                <li className="flex gap-3"><span className="mt-2.5 h-1.5 w-1.5 bg-white/40 shrink-0" />Abends: Physio, Content-Schnitt, Schlaf im Basecamp — jeden Tag derselbe Ablauf</li>
                <li className="flex gap-3"><span className="mt-2.5 h-1.5 w-1.5 bg-white/40 shrink-0" />Puffer liegt am Ende, nicht unterwegs: Reservetage fangen Wetter und Körper ab</li>
              </ul>
            </div>
          </FadeUp>
        </div>

        <FadeUp><div className="text-xs uppercase tracking-[0.3em] text-white/40 mb-5">Die fünf Buchstaben im Detail</div></FadeUp>
        <div className="grid grid-cols-2 md:grid-cols-5 border-t border-white/15">
          {LETTERS.map((l, i) => (
            <FadeUp key={i} delay={i * 0.06}>
              <div className="border-b md:border-b-0 border-r border-white/15 py-8 pr-4 md:pl-6 first:md:pl-0 h-full">
                <div className="text-6xl md:text-7xl font-black tracking-tight" style={{ color: RED }}>{l.label}</div>
                <div className="text-2xl md:text-3xl font-bold mt-4">{fmt(l.km)} km</div>
                <div className="text-sm text-white/55 font-light mt-1">+{fmt(l.hm)} hm</div>
                <div className="text-xs uppercase tracking-wider text-white/40 mt-3">{i < 2 ? "Königsetappe" : i === 2 ? "Mittelstück" : "Finale"}</div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==================== SETUP / CREW ====================

function Setup() {
  const roles = [
    { Icon: ClipboardList, t: "Crew-Chief & Logistik", d: "Plant Tagesabläufe, Verpflegung, Übernachtungen und Übergabepunkte. Die eine Person, die immer weiss, was als Nächstes passiert." },
    { Icon: Truck, t: "Crew-Fahrzeug", d: "Rollendes Basecamp: Schlafen, Küche, Material, Ladezentrale. Idee: Ford als Fahrzeugpartner an Bord holen — Branding auf dem Van inklusive." },
    { Icon: Camera, t: "Kamera-Team (2)", d: "Dokumentation in Kinoqualität plus Drohne. Material für die grosse Doku, den Making-of-Film und alle Cutdowns." },
    { Icon: Radio, t: "Live-Producer", d: "GPS-Live-Tracking und Streaming auf dem Kampagnen-Hub. Die Route zeichnet sich in Echtzeit auf der Karte — jeder kann zuschauen." },
    { Icon: MessageCircle, t: "Social Media", d: "Begleitet das Projekt durchgehend: tägliche Reels, Stories, Community-Antworten — Content geht raus, während gelaufen wird." },
    { Icon: HeartPulse, t: "Physio", d: "Tägliche Behandlung, Belastungssteuerung, Fussmanagement. Bei diesen Umfängen keine Option, sondern Voraussetzung." },
    { Icon: Brain, t: "Mentale Begleitung", d: "Eine Bezugsperson für die dunklen Stunden — Tag 9 im Dauerregen gewinnt man im Kopf, nicht in den Beinen." },
    { Icon: Map, t: "Pierre", d: "Läuft. Alles davor und danach macht das Team — genau dafür steht dieses Konzept." },
  ];
  return (
    <section id="setup" className="bg-zinc-950 text-white py-28 md:py-40 px-6 scroll-mt-16">
      <div className="max-w-7xl mx-auto">
        <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Das Setup</div></FadeUp>
        <h2 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.9] mb-8"><AnimatedWords text="Einer läuft. Ein Team macht es möglich." stagger={0.04} /></h2>
        <FadeUp delay={0.25}><p className="text-lg md:text-xl text-white/60 font-light max-w-3xl mb-14">Sieben Rollen, ein Fahrzeug, zwei Wochen. Das ist die Crew, die aus einem Lauf eine Kampagne macht.</p></FadeUp>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10">
          {roles.map(({ Icon, t, d }, i) => (
            <FadeUp key={i} delay={0.06 * i}>
              <div className="bg-zinc-950 p-8 h-full">
                <Icon size={28} strokeWidth={1.5} className="mb-5 text-white" />
                <h3 className="text-xl font-extrabold mb-2.5">{t}</h3>
                <p className="text-white/60 font-light text-sm leading-relaxed">{d}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==================== ROLLOUT ====================

function Rollout() {
  const phases = [
    { k: "Vorher", d: "Teaser, der andeutet statt verrät: «Diesen Herbst schreibe ich etwas, das man aus dem All sieht.» Presse-Seeding mit der Rekordzahl." },
    { k: "Während", d: "Live-Tracking auf dem Kampagnen-Hub, tägliche Reels und Stories, jeder fertige Buchstabe als eigener Strava- und Social-Moment. Optional: durchgehender Livestream." },
    { k: "Nachher", d: "Die grosse Doku als Herzstück, Making-of, Pressekit mit dem fertigen Artwork — und ein Bild, das DRYLL für immer gehört." },
  ];
  return (
    <section className="bg-black text-white py-28 md:py-40 px-6">
      <div className="max-w-7xl mx-auto">
        <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Rollout</div></FadeUp>
        <h2 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.9] mb-16"><AnimatedWords text="Spannung. Live. Nachhall." stagger={0.05} /></h2>
        <div className="grid md:grid-cols-3 gap-6">
          {phases.map((p, i) => (
            <FadeUp key={i} delay={0.1 * i}>
              <div className="border border-white/12 p-10 h-full">
                <div className="text-5xl font-black mb-6 text-white/40">{String(i + 1).padStart(2, "0")}</div>
                <h3 className="text-2xl font-extrabold mb-3">{p.k}</h3>
                <p className="text-white/60 font-light leading-relaxed">{p.d}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==================== WARUM PIERRE ====================

function WarumPierre() {
  return (
    <section className="bg-zinc-950 text-white py-28 md:py-40 px-6">
      <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-10 md:gap-16 items-center">
        <div className="md:col-span-7">
          <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Warum das glaubwürdig ist</div></FadeUp>
          <h2 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.9] mb-8"><AnimatedWords text="Aus dem Team, für die Marke." stagger={0.05} /></h2>
          <FadeUp delay={0.2}>
            <p className="text-lg md:text-xl text-white/65 font-light mb-10 max-w-2xl">
              Pierre ist Ultraläufer, Content Creator — und Teil des DRYLL-Teams. Kein gekaufter Athlet, der ein Produkt hochhält: Das hier ist die Geschichte von jemandem, der für seine eigene Marke durch das ganze Land läuft.
            </p>
          </FadeUp>
          <FadeUp delay={0.3}>
            <div className="flex gap-10 border-t border-white/15 pt-8">
              <div><div className="text-4xl md:text-6xl font-bold" style={{ color: RED }}>12 Mio.</div><div className="text-xs uppercase tracking-wider text-white/50 mt-2">Aufrufe / 90 Tage · alle Kanäle</div></div>
              <div><div className="text-4xl md:text-6xl font-bold">794k</div><div className="text-xs uppercase tracking-wider text-white/50 mt-2">aktive Konten erreicht</div></div>
            </div>
          </FadeUp>
        </div>
        <div className="md:col-span-5 grid grid-cols-2 gap-3 md:gap-4">
          <ParallaxImage src={W(19)} className="aspect-[3/4]" />
          <ParallaxImage src={W(9)} className="aspect-[3/4] mt-6 md:mt-12" />
        </div>
      </div>
    </section>
  );
}

// ==================== OFFENE ENTSCHEIDE ====================

function Entscheide() {
  const items = [
    { t: "Welcher Zeitraum im Oktober / November?", d: "12–14 Tage plus Reservetage. Muss mit dem ganzen Team, der Crew-Verfügbarkeit und Pierres Familie abgestimmt werden (Schulferien der Kids)." },
    { t: "80 oder 90 km pro Tag?", d: "90 km/Tag = 12 Etappen, 80 km/Tag = 14. Definiert Enddatum, Reservetage und wie lange die Crew gebucht wird." },
    { t: "Ford als Fahrzeugpartner?", d: "Ein gebrandeter Van als rollendes Basecamp senkt Kosten und bringt einen zweiten Partner mit eigener Reichweite ins Projekt." },
    { t: "Livestream: 24/7 oder Daily?", d: "Durchgehender Stream mit fixem Producer — oder tägliche Live-Fenster plus Recap? Kosten- und Personalfrage." },
    { t: "Budgetrahmen & Crew-Rekrutierung", d: "7 Rollen über ~2 Wochen: Welche besetzen wir aus dem Netzwerk, welche buchen wir ein? Entscheid nötig bis Ende August." },
  ];
  return (
    <section className="bg-black text-white py-28 md:py-40 px-6">
      <div className="max-w-5xl mx-auto">
        <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Für die interne Diskussion</div></FadeUp>
        <h2 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.9] mb-14"><AnimatedWords text="Fünf Entscheide, dann laufen wir." stagger={0.05} /></h2>
        <div>
          {items.map((it, i) => (
            <FadeUp key={i} delay={0.05 * i}>
              <div className="grid grid-cols-[auto_1fr] gap-5 py-6 border-t border-white/15 items-baseline">
                <div className="text-sm font-bold tabular-nums text-white/50">{String(i + 1).padStart(2, "0")}</div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-extrabold mb-1.5">{it.t}</h3>
                  <p className="text-white/60 font-light leading-relaxed">{it.d}</p>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==================== KONTAKT ====================

function Contact() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1.15, 1]);
  return (
    <section ref={ref} className="relative min-h-screen flex items-center px-6 py-32 overflow-hidden bg-black text-white">
      <motion.div className="absolute inset-0 flex items-center justify-center opacity-25" style={{ scale }}>
        <SwissMap staticFull className="w-full h-full p-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/40 to-black" />
      </motion.div>
      <div className="relative z-10 max-w-5xl mx-auto w-full text-center">
        <FadeUp><p className="text-xl md:text-3xl text-white/60 italic mb-12">„Man kann Werbung kaufen. Oder man kann sie laufen.“</p></FadeUp>
        <h2 className="text-6xl md:text-9xl font-black tracking-tight leading-[0.85] mb-10"><AnimatedWords text="Schreiben wir das Land an." stagger={0.07} /></h2>
        <FadeUp delay={0.35}><p className="text-lg md:text-xl text-white/70 font-light max-w-2xl mx-auto mb-12">Route steht. GPX ist fertig. Zielfenster: <span className="text-white">Oktober / November 2026</span> — den genauen Zeitraum legen wir gemeinsam fest. Jetzt braucht es nur noch ein Go vom Team.</p></FadeUp>
        <FadeUp delay={0.5}>
          <div className="inline-flex flex-col items-center gap-5">
            <div className="text-2xl font-semibold">Pierre Biege</div>
            <a href="mailto:pierre@laeuft.ch" className="flex items-center gap-3 text-white/80 hover:text-white transition-colors text-lg group"><Mail size={20} className="group-hover:scale-110 transition-transform" /> pierre@laeuft.ch</a>
            <a href="tel:+41798533672" className="flex items-center gap-3 text-white/80 hover:text-white transition-colors text-lg group"><Phone size={20} className="group-hover:scale-110 transition-transform" /> +41 79 853 36 72</a>
          </div>
        </FadeUp>
        <FadeUp delay={0.8}><div className="mt-24 text-xs uppercase tracking-[0.4em] text-white/30">Internes Konzept · nicht öffentlich teilen</div></FadeUp>
      </div>
    </section>
  );
}

// ==================== PAGE ====================

export default function DryllPresentationPage() {
  return (
    <div className="antialiased bg-black">
      <Header />
      <Hero />
      <RouteMap />
      <Pitch />
      <Idee />
      <Eckwerte />
      <Rekord />
      <Etappen />
      <Setup />
      <Rollout />
      <WarumPierre />
      <Entscheide />
      <Contact />
    </div>
  );
}

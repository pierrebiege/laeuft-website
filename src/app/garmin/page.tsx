"use client";

import Image from "next/image";
import { useRef, useState, useEffect, Fragment } from "react";
import { motion, useScroll, useTransform, useInView, type MotionValue } from "framer-motion";
import { Mail, Phone, Medal, Trophy, Infinity as InfinityIcon, Heart, Footprints, Mountain, Youtube, BarChart3 } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;
const GARMIN_BLUE = "#007CC3";

// Echte Wallis-/Alpen-/Adventure-Aufnahmen. Jedes Bild wird nur EINMAL verwendet.
const G = (n: number) => `/presentations/garmin/${String(n).padStart(2, "0")}.jpg`;

// ==================== MOTION PRIMITIVES ====================

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
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className={`text-sm font-semibold uppercase tracking-[0.25em] text-white transition-opacity duration-500 ${scrolled ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
          Pierre Biege
        </button>
        <nav className="flex items-center gap-6 text-xs uppercase tracking-[0.2em] text-white/80">
          <button onClick={() => go("pierre")} className="hover:text-white transition-colors">Über mich</button>
          <button onClick={() => go("vision")} className="hover:text-white transition-colors">Vision</button>
          <button onClick={() => go("kontakt")} className="hover:text-white transition-colors"><span className="border-b-2 pb-1" style={{ borderColor: GARMIN_BLUE }}>Kontakt</span></button>
        </nav>
      </div>
    </header>
  );
}

// ==================== HERO (zentriert) ====================

function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "35%"]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.1, 1.35]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  return (
    <section ref={ref} className="relative h-screen flex items-center justify-center overflow-hidden bg-black text-white">
      <motion.div className="absolute inset-0" style={{ y: imageY, scale: imageScale }}>
        <Image src={G(6)} alt="Matterhorn im Wallis" fill className="object-cover opacity-80" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black" />
      </motion.div>
      <motion.div className="relative z-10 max-w-6xl mx-auto px-6 text-center" style={{ y: contentY, opacity: contentOpacity }}>
        <motion.div className="inline-block mb-10 px-5 py-2 border border-white/20 rounded-full text-xs uppercase tracking-[0.4em] text-white/70" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2 }}>
          Pierre Biege × Garmin
        </motion.div>
        <h1 className="sr-only">Pierre Biege × Garmin — Aus dem Wallis. Ans Limit.</h1>
        <div className="text-7xl md:text-9xl lg:text-[11rem] font-bold tracking-tight leading-[0.85] mb-6">
          <AnimatedWords text="Aus dem Wallis. Ans Limit." delay={0.4} stagger={0.07} />
        </div>
        <motion.p className="text-xl md:text-3xl text-white/80 font-light tracking-wide mt-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 1.2 }}>
          Ultraläufer · Fotograf · Abenteurer aus den Walliser Alpen
        </motion.p>
      </motion.div>
      <motion.div className="absolute left-1/2 -translate-x-1/2 bottom-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 2 }}>
        <motion.div className="w-px h-16 bg-white/40" animate={{ scaleY: [0, 1, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} style={{ transformOrigin: "top" }} />
      </motion.div>
    </section>
  );
}

function Marquee({ items }: { items: string[] }) {
  const repeated = [...items, ...items, ...items, ...items];
  return (
    <div className="overflow-hidden py-6 bg-black border-y border-white/10">
      <motion.div className="flex gap-10 whitespace-nowrap" animate={{ x: ["0%", "-50%"] }} transition={{ duration: 38, repeat: Infinity, ease: "linear" }}>
        {repeated.map((item, i) => (
          <span key={i} className="text-2xl md:text-4xl font-bold tracking-tight uppercase text-white/70">{item} <span style={{ color: GARMIN_BLUE }} className="mx-3">/</span></span>
        ))}
      </motion.div>
    </div>
  );
}

// ==================== ABOUT (Text links, Bild-Grid rechts) ====================

function About() {
  const imgs = [G(12), G(1), G(9), G(15)];
  return (
    <section id="pierre" className="relative bg-black text-white py-28 md:py-40 px-6 scroll-mt-16 overflow-hidden">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center">
        <div>
          <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Wer ich bin</div></FadeUp>
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9] mb-8"><AnimatedWords text="Pierre Biege." stagger={0.07} /></h2>
          <FadeUp delay={0.3}>
            <p className="text-lg md:text-xl text-white/70 font-light leading-relaxed">
              Ultraläufer, Fotograf und Content Creator aus dem Wallis. Ich laufe täglich – seit Jahren ohne Pause – und lebe für extreme Formate: regelmässig über 200 Kilometer, oft mehr als 40 Stunden am Stück.
            </p>
          </FadeUp>
          <FadeUp delay={0.45}>
            <p className="text-lg md:text-xl text-white/70 font-light leading-relaxed mt-5">
              Familienvater, immer in Bewegung. Ich denke nicht in einer Saison, sondern in einem Jahrzehnt.
            </p>
          </FadeUp>
          <FadeUp delay={0.6}>
            <div className="mt-10 pt-6 border-t border-white/15 flex items-center gap-4">
              <Medal size={26} strokeWidth={1.5} style={{ color: GARMIN_BLUE }} className="shrink-0" />
              <p className="text-base text-white/75 leading-snug">An meiner Seite: <span className="font-semibold text-white">Tom Elmer</span>, Schweizer Meister – mein Coach, der mich aufs nächste Level bringt.</p>
            </div>
          </FadeUp>
        </div>
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {imgs.map((src, i) => (
            <ParallaxImage key={i} src={src} className={`aspect-[3/4] ${i % 2 === 1 ? "mt-6 md:mt-10" : ""}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ==================== WARUM GARMIN (Scrolltext) ====================

function Story() {
  return (
    <section className="bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white py-40 md:py-48 px-6 overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-12 text-center">Warum Garmin</div></FadeUp>
        <ScrollRevealText text="Ich laufe jeden einzelnen Tag. Jeder Kilometer, jeder Höhenmeter, jede Stunde am Limit – alles wird gemessen, alles zählt. Genau die Welt, in der Garmin zuhause ist." className="text-2xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.25] text-center" />
      </div>
      <div className="max-w-4xl mx-auto mt-28">
        <ScrollRevealText text="Ich denke nicht in einer Saison, sondern in einem Jahrzehnt. Aus dem Wallis hinaus, Tag für Tag, Berg für Berg – auf die grössten Ziele zu, die ich mir vorstellen kann." className="text-2xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.25] text-center" />
      </div>
      <div className="max-w-4xl mx-auto mt-28">
        <ScrollRevealText text="Mein Equipment muss allem standhalten: vier Jahreszeiten in den Alpen, 40 Stunden am Stück, jeder Höhenmeter, jede Nacht. Ausdauer, Präzision, Verlässlichkeit – genau dafür ist Garmin gebaut." className="text-2xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.25] text-center" />
        <FadeUp delay={0.3}><p className="text-center mt-16 text-lg text-white/50 italic">„Jeden Tag ein Schritt näher.“</p></FadeUp>
      </div>
    </section>
  );
}

// ==================== WALLIS (Bild-Grid links, Text rechts) ====================

function Wallis() {
  const imgs = [G(7), G(4), G(8), G(20)];
  const labels = ["Nebelmeer", "Matterhorn", "Sternenhimmel", "Stille Seen"];
  return (
    <section className="relative bg-black text-white py-28 md:py-40 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center">
        <div className="grid grid-cols-2 gap-3 md:gap-4 order-2 md:order-1">
          {imgs.map((src, i) => (
            <div key={i} className={i % 2 === 1 ? "mt-6 md:mt-10" : ""}>
              <ParallaxImage src={src} className="aspect-[3/4]" />
              <div className="mt-2 text-[10px] uppercase tracking-[0.25em] text-white/40">{labels[i]}</div>
            </div>
          ))}
        </div>
        <div className="order-1 md:order-2">
          <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Wo ich wohne</div></FadeUp>
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9] mb-8"><AnimatedWords text="Das Wallis ist mein Trainingsplatz." stagger={0.05} /></h2>
          <FadeUp delay={0.3}>
            <p className="text-lg md:text-xl text-white/70 font-light leading-relaxed">
              Eine der schönsten Regionen der Schweiz – Berge, Pässe, Schnee, Höhenmeter ohne Ende. Das ist keine Kulisse. Das ist mein täglicher Trainingsplatz.
            </p>
          </FadeUp>
          <FadeUp delay={0.45}>
            <p className="text-lg md:text-xl text-white/70 font-light leading-relaxed mt-5">
              Von hier aus erzähle ich meine Geschichten – ehrlich, draussen, am Limit. Eine Bühne, wie sie kein Studio liefern kann.
            </p>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

// ==================== REICHWEITE (v1 Bild-Kacheln) ====================

function StatTile({ value, label, image, highlight }: { value: string; label: string; image: string; highlight?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.2, 1.05]);
  return (
    <div ref={ref} className="relative aspect-[3/4] overflow-hidden bg-zinc-900 group">
      <motion.div className="absolute inset-0" style={{ y, scale }}>
        <Image src={image} alt="" fill className="object-cover opacity-55 group-hover:opacity-75 transition-opacity duration-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      </motion.div>
      <div className="absolute inset-0 p-6 md:p-7 flex flex-col justify-end">
        <div className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-none mb-3" style={{ color: highlight ? GARMIN_BLUE : "#fff" }}>{value}</div>
        <div className="text-xs uppercase tracking-wider text-white/70">{label}</div>
      </div>
    </div>
  );
}

function Reach() {
  const stats = [
    { value: "12 Mio.", label: "Aufrufe · 90 Tage", image: G(13), highlight: true },
    { value: "794k", label: "Konten erreicht · 90 Tage", image: G(19) },
    { value: "2,2 Mio.", label: "Aufrufe · 30 Tage", image: G(22) },
    { value: "200+", label: "Kilometer pro Race", image: G(17) },
  ];
  return (
    <section className="bg-black text-white py-28 md:py-40 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto mb-14">
        <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Die Reichweite</div></FadeUp>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9] max-w-4xl"><AnimatedWords text="Wir wachsen. Schnell." stagger={0.06} /></h2>
      </div>
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {stats.map((s, i) => (<FadeUp key={i} delay={i * 0.1} y={50}><StatTile {...s} /></FadeUp>))}
      </div>
      <div className="max-w-7xl mx-auto mt-10">
        <FadeUp delay={0.4}><p className="text-white/55 text-base md:text-lg font-light max-w-3xl">Ich bin (noch) kein riesiger Creator – aber ich erreiche schon heute extrem viele Menschen, und die Kurve zeigt steil nach oben. Wer jetzt einsteigt, wächst mit.</p></FadeUp>
      </div>
    </section>
  );
}

// ==================== YOUTUBE (Bild + 3 Kacheln) ====================

function YouTubeBuild() {
  const points = [
    { Icon: Youtube, title: "Aufbau mit einem Profi", text: "An meiner Seite: Clemens Hovekamp – Mitorganisator des Ultimate Run, verantwortlich für grosse YouTube-Formate wie «7 vs. Wild»." },
    { Icon: Mountain, title: "Garmin mittendrin", text: "Kein nachträgliches Logo, sondern fest in den Geschichten – mittendrin, während der Kanal wächst." },
    { Icon: BarChart3, title: "Ziel: starkes Wachstum", text: "Wir bauen den Kanal in den nächsten Jahren gezielt aus – langfristig, nicht für einen Moment." },
  ];
  return (
    <section className="bg-zinc-950 text-white py-24 md:py-32 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Der Plan</div></FadeUp>
        <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-[0.9] mb-12"><AnimatedWords text="Wir bauen YouTube auf." stagger={0.05} /></h2>
        <div className="grid md:grid-cols-12 gap-6 items-stretch">
          <FadeUp y={50} className="md:col-span-5">
            <div className="relative h-full min-h-[360px] overflow-hidden bg-zinc-900">
              <Image src={G(24)} alt="" fill className="object-cover" />
            </div>
          </FadeUp>
          <div className="md:col-span-7 grid gap-4">
            {points.map(({ Icon, title, text }, i) => (
              <FadeUp key={i} delay={0.15 + i * 0.1}>
                <div className="bg-black border border-white/10 p-7 flex gap-5 items-start h-full">
                  <Icon size={28} strokeWidth={1.5} className="shrink-0 mt-1" style={{ color: GARMIN_BLUE }} />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{title}</h3>
                    <p className="text-white/60 leading-relaxed font-light">{text}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ==================== VISION (v1 Kacheln + 4000er) ====================

function Vision() {
  const items = [
    { Icon: Trophy, title: "Swiss Alps 100", text: "Rekord-Versuch auf einer der härtesten 100-Meilen-Strecken der Alpen – daheim, im Wallis." },
    { Icon: InfinityIcon, title: "1000 km am Stück", text: "Nach 1000 Tagen täglichem Laufen: 1000 Kilometer ohne Halt." },
    { Icon: Heart, title: "100'000 Höhenmeter", text: "Für krebskranke Kinder – an wechselnden Spots in der ganzen Schweiz." },
    { Icon: Mountain, title: "Alle 4000er der Alpen", text: "Jeden Viertausender der Alpen besteigen – und in 10 Jahren alle in einem einzigen, durchgehenden Run verbinden." },
    { Icon: Footprints, title: "100 Laps bis 2035", text: "Backyard Ultra: konsequenter Aufbau über die nächsten Jahre. Das grosse Ziel sind 100 Runden." },
  ];
  return (
    <section id="vision" className="relative bg-zinc-950 text-white py-28 md:py-40 px-6 overflow-hidden scroll-mt-16">
      <div className="max-w-7xl mx-auto">
        <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Der lange Weg</div></FadeUp>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-10 leading-[0.9]"><AnimatedWords text="Die Vision bis 2035." stagger={0.05} /></h2>
        <FadeUp delay={0.3}><p className="text-lg md:text-2xl text-white/60 font-light leading-relaxed max-w-3xl mb-16">Ich denke in einem Jahrzehnt. Wer jetzt einsteigt, ist von der ersten Stunde an bei jeder dieser Geschichten dabei.</p></FadeUp>
        <div className="grid md:grid-cols-2 gap-6">
          {items.map(({ Icon, title, text }, i) => (
            <FadeUp key={i} delay={0.1 + i * 0.07}>
              <div className={`bg-black border border-white/10 p-10 h-full flex gap-6 items-start ${i === items.length - 1 ? "md:col-span-2" : ""}`}>
                <Icon size={32} strokeWidth={1.5} className="shrink-0 mt-1" style={{ color: GARMIN_BLUE }} />
                <div>
                  <h3 className="text-xl md:text-2xl font-semibold mb-2">{title}</h3>
                  <p className="text-white/60 leading-relaxed font-light">{text}</p>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==================== EVENTS ====================

function Events() {
  const races = [
    { name: "Ultimate Run", date: "24.–26. April 2026", loc: "Deutschland", done: true },
    { name: "Witikoner Backyard", date: "14.–16. Mai 2026", loc: "Zürich · 23 Runden", done: true },
    { name: "99 Lap Race", date: "25.–26. Juli 2026", loc: "Deutschland", done: false },
    { name: "Last Soul Ultra", date: "14. August 2026", loc: "International", done: false },
    { name: "Berlin Marathon", date: "27. September 2026", loc: "Berlin", done: false },
  ];
  return (
    <section className="relative bg-black text-white overflow-hidden">
      <div className="absolute inset-0 opacity-25">
        <Image src={G(11)} alt="" fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/60 to-black" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-28 md:py-40">
        <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/50 mb-6">Saison 2026</div></FadeUp>
        <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-[0.9] mb-14"><AnimatedWords text="Die Events dieses Jahr." stagger={0.05} /></h2>
        <div>
          {races.map((r, i) => (
            <FadeUp key={i} delay={0.05 * i}>
              <div className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_1fr_auto] gap-x-6 gap-y-1 items-center py-6 border-t border-white/15 last:border-b">
                <div className="text-2xl md:text-4xl font-bold tracking-tight">{r.name}</div>
                <div className="text-white/55 text-sm md:text-base md:text-right">{r.date}<span className="hidden md:inline"> · {r.loc}</span></div>
                <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color: r.done ? "rgba(255,255,255,0.4)" : GARMIN_BLUE }}>{r.done ? "gelaufen" : "kommt"}</div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==================== GALERIE (eine, am Schluss) ====================

function Gallery() {
  return (
    <section className="bg-black text-white py-24 md:py-32 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto mb-16">
        <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Impressionen</div></FadeUp>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9]"><AnimatedWords text="Draussen. Jeden Tag." stagger={0.05} /></h2>
      </div>
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-3 md:gap-4">
        <ParallaxImage src={G(3)} className="col-span-12 aspect-[21/9]" />
        <ParallaxImage src={G(23)} className="col-span-6 md:col-span-4 aspect-[3/4]" />
        <ParallaxImage src={G(5)} className="col-span-6 md:col-span-4 aspect-[3/4]" />
        <ParallaxImage src={G(25)} className="col-span-12 md:col-span-4 aspect-[3/4]" />
        <ParallaxImage src={G(14)} className="col-span-12 aspect-[21/9]" />
        <ParallaxImage src={G(26)} className="col-span-6 md:col-span-4 aspect-[3/4]" />
        <ParallaxImage src={G(2)} className="col-span-6 md:col-span-4 aspect-[3/4]" />
        <ParallaxImage src={G(21)} className="col-span-12 md:col-span-4 aspect-[3/4]" />
        <ParallaxImage src={G(18)} className="col-span-12 aspect-[21/9]" />
      </div>
    </section>
  );
}

// ==================== CONTACT ====================

function Contact() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1.2, 1]);
  return (
    <section id="kontakt" ref={ref} className="relative min-h-screen flex items-center px-6 py-32 overflow-hidden bg-black text-white scroll-mt-16">
      <motion.div className="absolute inset-0" style={{ scale }}>
        <Image src={G(16)} alt="" fill className="object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/50 to-black" />
      </motion.div>
      <div className="relative z-10 max-w-5xl mx-auto w-full text-center">
        <FadeUp><p className="text-xl md:text-3xl text-white/60 italic mb-12">„Ich würde mich freuen, diesen Weg mit Garmin zu gehen.“</p></FadeUp>
        <h2 className="text-6xl md:text-9xl lg:text-[11rem] font-bold tracking-tight leading-[0.85] mb-12"><AnimatedWords text="Lass uns reden." stagger={0.07} /></h2>
        <FadeUp delay={0.5}>
          <div className="inline-flex flex-col items-center gap-5">
            <div className="text-2xl font-semibold">Pierre Biege</div>
            <a href="mailto:pierre@laeuft.ch" className="flex items-center gap-3 text-white/80 hover:text-white transition-colors text-lg group"><Mail size={20} className="group-hover:scale-110 transition-transform" /> pierre@laeuft.ch</a>
            <a href="tel:+41798533672" className="flex items-center gap-3 text-white/80 hover:text-white transition-colors text-lg group"><Phone size={20} className="group-hover:scale-110 transition-transform" /> +41 79 853 36 72</a>
          </div>
        </FadeUp>
        <FadeUp delay={0.8}><div className="mt-24 text-xs uppercase tracking-[0.4em] text-white/30">laeuft.ch</div></FadeUp>
      </div>
    </section>
  );
}

// ==================== PAGE ====================

export default function GarminPresentationPage() {
  return (
    <div className="font-sans antialiased bg-black">
      <Header />
      <Hero />
      <Marquee items={["Pierre Biege", "Wallis", "Täglich laufen", "Ultra", "Swiss Alps 100", "Backyard", "Adventure", "2026"]} />
      <About />
      <Story />
      <Wallis />
      <Reach />
      <YouTubeBuild />
      <Vision />
      <Events />
      <Gallery />
      <Contact />
    </div>
  );
}

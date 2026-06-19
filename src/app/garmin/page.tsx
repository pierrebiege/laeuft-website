"use client";

import Image from "next/image";
import { useRef, useState, useEffect, Fragment } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { Mail, Phone, Medal } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;
const GARMIN_BLUE = "#007CC3";

// Echte Wallis-/Alpen-/Adventure-Aufnahmen (kuratiert).
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
            <motion.span
              style={{ display: "inline-block", willChange: "transform" }}
              initial={{ y: "110%", opacity: 0 }}
              animate={inView ? { y: "0%", opacity: 1 } : { y: "110%", opacity: 0 }}
              transition={{ duration: 0.9, ease: EASE, delay: delay + i * stagger }}
            >
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
          <button onClick={() => go("kontakt")} className="hover:text-white transition-colors" style={{ color: scrolled ? "#fff" : undefined }}>
            <span className="border-b-2 pb-1" style={{ borderColor: GARMIN_BLUE }}>Kontakt</span>
          </button>
        </nav>
      </div>
    </header>
  );
}

// ==================== HERO ====================

function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.08, 1.3]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-40%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  return (
    <section ref={ref} className="relative h-screen flex items-end justify-start overflow-hidden bg-black text-white">
      <motion.div className="absolute inset-0" style={{ y: imageY, scale: imageScale }}>
        <Image src={G(6)} alt="Matterhorn im Wallis" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/40" />
      </motion.div>
      <motion.div className="relative z-10 max-w-7xl mx-auto w-full px-6 pb-20 md:pb-28" style={{ y: contentY, opacity: contentOpacity }}>
        <motion.div className="mb-6 text-xs uppercase tracking-[0.4em] text-white/70" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2 }}>
          Pierre Biege <span style={{ color: GARMIN_BLUE }}>×</span> Garmin
        </motion.div>
        <h1 className="sr-only">Pierre Biege × Garmin — Jeden Tag. Jeder Berg.</h1>
        <div className="text-6xl md:text-8xl lg:text-[10rem] font-bold tracking-tight leading-[0.85] max-w-5xl">
          <AnimatedWords text="Jeden Tag. Jeder Berg." delay={0.35} stagger={0.07} />
        </div>
        <motion.p className="text-lg md:text-2xl text-white/80 font-light mt-8 max-w-2xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 1.1 }}>
          Ultraläufer, Fotograf & Abenteurer aus den Walliser Alpen.
        </motion.p>
      </motion.div>
      <motion.div className="absolute left-1/2 -translate-x-1/2 bottom-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 2 }}>
        <motion.div className="w-px h-14 bg-white/40" animate={{ scaleY: [0, 1, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} style={{ transformOrigin: "top" }} />
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
          <span key={i} className="text-2xl md:text-4xl font-bold tracking-tight uppercase text-white/70">
            {item} <span style={{ color: GARMIN_BLUE }} className="mx-3">/</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ==================== ABOUT ====================

function About() {
  return (
    <section id="pierre" className="relative bg-black text-white py-28 md:py-40 px-6 scroll-mt-16 overflow-hidden">
      <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-10 md:gap-16 items-center">
        <div className="md:col-span-6 order-2 md:order-1">
          <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Wer ich bin</div></FadeUp>
          <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-[0.9] mb-8">
            <AnimatedWords text="Pierre Biege." stagger={0.07} />
          </h2>
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
              <p className="text-base text-white/75 leading-snug">
                An meiner Seite: <span className="font-semibold text-white">Tom Elmer</span>, Schweizer Meister – mein Coach, der mich aufs nächste Level bringt.
              </p>
            </div>
          </FadeUp>
        </div>
        <div className="md:col-span-6 order-1 md:order-2">
          <FadeUp y={60}>
            <div className="relative aspect-[4/5] overflow-hidden">
              <Image src={G(12)} alt="" fill className="object-cover" />
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

// ==================== FULL-BLEED MOMENT ====================

function Moment({ src, eyebrow, text, position = "center" }: { src: string; eyebrow?: string; text: string; position?: "center" | "bottom" }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1.25, 1]);
  return (
    <section ref={ref} className={`relative h-screen flex overflow-hidden bg-black text-white ${position === "bottom" ? "items-end" : "items-center"} justify-center`}>
      <motion.div className="absolute inset-0" style={{ scale }}>
        <Image src={src} alt="" fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30" />
      </motion.div>
      <div className={`relative z-10 max-w-5xl mx-auto px-6 text-center ${position === "bottom" ? "pb-24" : ""}`}>
        {eyebrow && <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/60 mb-6">{eyebrow}</div></FadeUp>}
        <h2 className="text-4xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95]">
          <AnimatedWords text={text} stagger={0.05} />
        </h2>
      </div>
    </section>
  );
}

// ==================== WALLIS — scroll-gesteuerte Sequenz ====================

function Wallis() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  // 4 Bilder, die beim Scrollen ineinander übergehen
  const o1 = useTransform(scrollYProgress, [0, 0.22, 0.3], [1, 1, 0]);
  const o2 = useTransform(scrollYProgress, [0.22, 0.3, 0.47, 0.55], [0, 1, 1, 0]);
  const o3 = useTransform(scrollYProgress, [0.47, 0.55, 0.72, 0.8], [0, 1, 1, 0]);
  const o4 = useTransform(scrollYProgress, [0.72, 0.8, 1], [0, 1, 1]);
  const layers = [
    { src: G(7), o: o1, label: "Nebelmeer über dem Tal" },
    { src: G(16), o: o2, label: "Sonnenuntergang über den Gipfeln" },
    { src: G(8), o: o3, label: "Sternenhimmel über dem Wallis" },
    { src: G(20), o: o4, label: "Gefrorene Seen, stille Wälder" },
  ];
  return (
    <section ref={ref} className="relative h-[360vh] bg-black">
      <div className="sticky top-0 h-screen overflow-hidden text-white">
        {layers.map((l, i) => (
          <motion.div key={i} className="absolute inset-0" style={{ opacity: l.o }}>
            <Image src={l.src} alt="" fill className="object-cover" />
            <div className="absolute inset-0 bg-black/30" />
          </motion.div>
        ))}
        <div className="relative z-10 h-full flex flex-col justify-center px-6 max-w-7xl mx-auto">
          <div className="text-xs uppercase tracking-[0.4em] text-white/60 mb-6">Wo ich wohne</div>
          <h2 className="text-5xl md:text-8xl font-bold tracking-tight leading-[0.9] max-w-4xl">
            Das Wallis ist<br />mein Trainingsplatz.
          </h2>
          <p className="mt-8 text-lg md:text-2xl text-white/80 font-light max-w-xl">
            Eine der schönsten Regionen der Schweiz – Berge, Pässe, Schnee, Höhenmeter ohne Ende. Keine Kulisse. Mein Alltag.
          </p>
          {/* Fortschritts-Labels */}
          <div className="absolute bottom-10 left-6 right-6 max-w-7xl mx-auto flex flex-wrap gap-x-6 gap-y-1 text-[11px] uppercase tracking-[0.25em] text-white/50">
            {layers.map((l, i) => (
              <motion.span key={i} style={{ opacity: l.o }}>{l.label}</motion.span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ==================== REICHWEITE ====================

function Reach() {
  const stats = [
    { value: "12 Mio.", label: "Aufrufe / 90 Tage" },
    { value: "794k", label: "Konten erreicht / 90 Tage" },
    { value: "2,2 Mio.", label: "Aufrufe / 30 Tage" },
    { value: "200+", label: "Kilometer pro Race" },
  ];
  return (
    <section className="bg-black text-white py-28 md:py-40 px-6">
      <div className="max-w-7xl mx-auto">
        <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Die Reichweite</div></FadeUp>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9] max-w-4xl mb-16">
          <AnimatedWords text="Wir wachsen. Schnell." stagger={0.06} />
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 border-t border-white/15">
          {stats.map((s, i) => (
            <FadeUp key={i} delay={i * 0.08}>
              <div className="border-b md:border-b-0 border-r border-white/15 py-10 pr-4 md:pl-6 first:md:pl-0">
                <div className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight" style={{ color: i === 0 ? GARMIN_BLUE : "#fff" }}>{s.value}</div>
                <div className="text-xs uppercase tracking-wider text-white/50 mt-3">{s.label}</div>
              </div>
            </FadeUp>
          ))}
        </div>
        <FadeUp delay={0.3}>
          <p className="text-white/55 text-base md:text-lg font-light max-w-3xl mt-12">
            Ich bin (noch) kein riesiger Creator – aber ich erreiche schon heute extrem viele Menschen, und die Kurve zeigt steil nach oben. Wer jetzt einsteigt, wächst mit.
          </p>
        </FadeUp>
      </div>
    </section>
  );
}

// ==================== YOUTUBE ====================

function YouTube() {
  return (
    <section className="relative bg-black text-white overflow-hidden">
      <div className="grid md:grid-cols-2">
        <div className="relative min-h-[60vh] md:min-h-[80vh]">
          <Image src={G(24)} alt="" fill className="object-cover" />
        </div>
        <div className="flex items-center px-6 py-24 md:px-16">
          <div>
            <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Der Plan</div></FadeUp>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-[0.95] mb-8">
              <AnimatedWords text="Wir bauen YouTube auf." stagger={0.05} />
            </h2>
            <FadeUp delay={0.3}>
              <p className="text-lg text-white/70 font-light leading-relaxed">
                Kein einzelner Clip, sondern ein Kanal – langfristig gedacht. An meiner Seite: <span className="text-white font-medium">Clemens Hovekamp</span>, Mitorganisator des Ultimate Run und verantwortlich für den Aufbau grosser YouTube-Formate wie «7 vs. Wild».
              </p>
            </FadeUp>
            <FadeUp delay={0.45}>
              <p className="text-lg text-white/70 font-light leading-relaxed mt-5">
                Garmin ist dabei kein nachträgliches Logo, sondern fest in den Geschichten – mittendrin, während der Kanal wächst.
              </p>
            </FadeUp>
          </div>
        </div>
      </div>
    </section>
  );
}

// ==================== VISION ====================

function Vision() {
  const items = [
    { k: "01", title: "Swiss Alps 100", text: "Rekord-Versuch auf einer der härtesten 100-Meilen-Strecken der Alpen – daheim, im Wallis." },
    { k: "02", title: "1000 km am Stück", text: "Nach 1000 Tagen täglichem Laufen: 1000 Kilometer ohne Halt." },
    { k: "03", title: "100'000 Höhenmeter", text: "Für krebskranke Kinder – an wechselnden Spots in der ganzen Schweiz." },
    { k: "04", title: "100 Laps bis 2035", text: "Backyard Ultra: konsequenter Aufbau über die nächsten Jahre. Das grosse Ziel sind 100 Runden." },
  ];
  return (
    <section id="vision" className="relative bg-black text-white py-28 md:py-40 px-6 scroll-mt-16">
      <div className="max-w-7xl mx-auto">
        <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Der lange Weg</div></FadeUp>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9] mb-6">
          <AnimatedWords text="Die Vision bis 2035." stagger={0.05} />
        </h2>
        <FadeUp delay={0.3}>
          <p className="text-lg md:text-xl text-white/55 font-light max-w-2xl mb-16">
            Ich denke in einem Jahrzehnt. Wer jetzt einsteigt, ist von der ersten Stunde an bei jeder dieser Geschichten dabei.
          </p>
        </FadeUp>
        <div>
          {items.map((it, i) => (
            <FadeUp key={i} delay={0.05 * i}>
              <div className="group grid grid-cols-[auto_1fr] md:grid-cols-[6rem_1fr_2fr] gap-x-6 md:gap-x-10 gap-y-2 items-baseline py-8 border-t border-white/15">
                <div className="text-2xl md:text-3xl font-bold" style={{ color: GARMIN_BLUE }}>{it.k}</div>
                <h3 className="text-3xl md:text-5xl font-bold tracking-tight">{it.title}</h3>
                <p className="col-start-2 md:col-start-3 text-white/60 font-light leading-relaxed md:text-lg">{it.text}</p>
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
        <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-[0.9] mb-14">
          <AnimatedWords text="Die Events dieses Jahr." stagger={0.05} />
        </h2>
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

// ==================== GALLERY ====================

function ParallaxImage({ src, className = "" }: { src: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.15, 1.05]);
  return (
    <motion.div ref={ref} className={`relative overflow-hidden bg-zinc-900 ${className}`} initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 1.2, ease: EASE }}>
      <motion.div className="absolute inset-0" style={{ y, scale }}><Image src={src} alt="" fill className="object-cover" /></motion.div>
    </motion.div>
  );
}

function Gallery() {
  return (
    <section className="bg-black text-white py-24 md:py-32 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto mb-16">
        <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Impressionen</div></FadeUp>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9]">
          <AnimatedWords text="Draussen. Jeden Tag." stagger={0.05} />
        </h2>
      </div>
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-3 md:gap-4">
        <ParallaxImage src={G(18)} className="col-span-12 md:col-span-8 aspect-[16/9]" />
        <ParallaxImage src={G(9)} className="col-span-6 md:col-span-4 aspect-[3/4]" />
        <ParallaxImage src={G(13)} className="col-span-6 md:col-span-4 aspect-[3/4]" />
        <ParallaxImage src={G(19)} className="col-span-6 md:col-span-4 aspect-[3/4]" />
        <ParallaxImage src={G(4)} className="col-span-6 md:col-span-4 aspect-[3/4]" />
        <ParallaxImage src={G(16)} className="col-span-12 aspect-[16/7]" />
      </div>
    </section>
  );
}

// ==================== DRIFT ====================

function Drift() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], ["8%", "-42%"]);
  const images = [G(1), G(23), G(5), G(26), G(15), G(22), G(25), G(10), G(2)];
  return (
    <section ref={ref} className="bg-black py-24 md:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-14">
        <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Behind the Scenes</div></FadeUp>
        <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-[0.9] text-white">
          <AnimatedWords text="Jeder Tag zählt." stagger={0.06} />
        </h2>
      </div>
      <motion.div className="flex gap-4 px-6 will-change-transform" style={{ x }}>
        {images.map((src, i) => (
          <motion.div key={i} className="relative shrink-0 w-[78vw] md:w-[48vw] lg:w-[38vw] aspect-[4/5] overflow-hidden bg-zinc-900" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 1, ease: EASE, delay: i * 0.05 }}>
            <Image src={src} alt="" fill className="object-cover" />
          </motion.div>
        ))}
      </motion.div>
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
        <h2 className="text-6xl md:text-9xl lg:text-[11rem] font-bold tracking-tight leading-[0.85] mb-12">
          <AnimatedWords text="Lass uns reden." stagger={0.07} />
        </h2>
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
      <Moment src={G(3)} eyebrow="Aus dem Wallis" text="Da, wo die Geschichten passieren." position="bottom" />
      <Wallis />
      <Reach />
      <YouTube />
      <Moment src={G(24)} eyebrow="Jeden einzelnen Tag" text="Wo andere aufhören, fängt mein Tag erst an." position="bottom" />
      <Vision />
      <Events />
      <Gallery />
      <Drift />
      <Contact />
    </div>
  );
}

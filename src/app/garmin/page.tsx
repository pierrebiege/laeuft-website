"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useInView, type MotionValue } from "framer-motion";
import { Youtube, Instagram, Camera, Mountain, Mail, Phone, ArrowRight, Eye, Calendar, Trophy, Heart, Infinity as InfinityIcon, Footprints } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;
const GARMIN_BLUE = "#007CC3";

// Neutrale Lauf-/Adventure-Aufnahmen. ⚠️ Platzhalter — durch Wallis-/Alpen-
// Fotos ersetzen (gleicher Pfad public/presentations/garmin/NN.jpg).
const G = (n: number) => `/presentations/garmin/${String(n).padStart(2, "0")}.jpg`;

// ==================== MOTION PRIMITIVES ====================

function AnimatedWords({ text, className = "", delay = 0, stagger = 0.05 }: { text: string; className?: string; delay?: number; stagger?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const words = text.split(" ");
  return (
    <span ref={ref} className={className} style={{ display: "inline-block" }}>
      {words.map((word, i) => (
        <span key={i} style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top" }}>
          <motion.span
            style={{ display: "inline-block", willChange: "transform" }}
            initial={{ y: "110%", opacity: 0 }}
            animate={inView ? { y: "0%", opacity: 1 } : { y: "110%", opacity: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: delay + i * stagger }}
          >
            {word}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
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
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "start 0.2"] });
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

// ==================== SECTIONS ====================

function Header() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.55);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-colors duration-500 ${scrolled ? "bg-black/70 backdrop-blur-md border-b border-white/10" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className={`text-lg font-bold tracking-tight text-white transition-opacity duration-500 ${scrolled ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
          Pierre Biege
        </button>
        <nav className="flex items-center gap-2 md:gap-3">
          <button onClick={() => go("pierre")} className="px-4 py-2 rounded-full border border-white/30 text-xs md:text-sm text-white/90 hover:bg-white hover:text-black transition-colors">Über Pierre</button>
          <button onClick={() => go("vision")} className="px-4 py-2 rounded-full text-xs md:text-sm font-medium text-white transition-transform hover:scale-105" style={{ backgroundColor: GARMIN_BLUE }}>Die Vision</button>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.1, 1.4]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  return (
    <section ref={ref} className="relative h-screen flex items-center justify-center overflow-hidden bg-black text-white">
      <motion.div className="absolute inset-0" style={{ y: imageY, scale: imageScale }}>
        <Image src={G(6)} alt="" fill className="object-cover opacity-70" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black" />
      </motion.div>
      <motion.div className="relative z-10 max-w-6xl mx-auto px-6 text-center" style={{ y: contentY, opacity: contentOpacity }}>
        <motion.div className="inline-block mb-10 px-5 py-2 border border-white/20 rounded-full text-xs uppercase tracking-[0.4em] text-white/70" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2 }}>
          Pierre Biege × Garmin
        </motion.div>
        <h1 className="sr-only">Pierre Biege × Garmin — Beat Yesterday</h1>
        <div className="text-7xl md:text-9xl lg:text-[11rem] font-bold tracking-tight leading-[0.85] mb-6">
          <AnimatedWords text="Beat Yesterday." delay={0.4} stagger={0.08} />
        </div>
        <motion.p className="text-xl md:text-3xl text-white/80 font-light tracking-wide mt-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 1.2 }}>
          Ultraläufer · Content Creator · Täglich in den Walliser Alpen
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
    <div className="overflow-hidden py-8 border-y border-white/10 bg-black">
      <motion.div className="flex gap-12 whitespace-nowrap" animate={{ x: ["0%", "-50%"] }} transition={{ duration: 35, repeat: Infinity, ease: "linear" }}>
        {repeated.map((item, i) => (
          <span key={i} className="text-3xl md:text-5xl font-bold tracking-tight uppercase text-white/80">
            {item} <span style={{ color: GARMIN_BLUE }} className="mx-4">·</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

function Bio() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const img1Opacity = useTransform(scrollYProgress, [0, 0.33, 0.4], [1, 1, 0]);
  const img2Opacity = useTransform(scrollYProgress, [0.33, 0.4, 0.66, 0.73], [0, 1, 1, 0]);
  const img3Opacity = useTransform(scrollYProgress, [0.66, 0.73, 1], [0, 1, 1]);
  return (
    <section ref={ref} id="pierre" className="relative bg-white scroll-mt-20">
      <div className="md:h-[200vh]">
        <div className="md:sticky md:top-0 md:h-screen flex items-center px-6 py-28 md:py-0">
          <div className="max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-16 items-center">
            <div>
              <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-zinc-400 mb-6">Wer ich bin</div></FadeUp>
              <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-zinc-900 mb-10 leading-[0.9]">
                <AnimatedWords text="Pierre Biege." stagger={0.08} />
              </h2>
              <FadeUp delay={0.4}>
                <p className="text-lg md:text-xl text-zinc-600 leading-relaxed font-light">
                  Ich bin Ultraläufer, Fotograf und Content Creator aus dem Wallis. Ich laufe täglich – seit Jahren ohne Pause – und habe mich auf extreme Formate wie Backyard-Ultras spezialisiert: regelmässig über 200 Kilometer, oft mehr als 40 Stunden am Stück.
                </p>
              </FadeUp>
              <FadeUp delay={0.6}>
                <p className="text-lg md:text-xl text-zinc-600 leading-relaxed font-light mt-6">
                  Zuhause in den Bergen, Familienvater, immer in Bewegung. Ich baue nicht auf einen einzelnen Moment hin, sondern Schritt für Schritt auf die grössten Ziele, die ich mir vorstellen kann.
                </p>
              </FadeUp>
            </div>
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-zinc-100">
              <motion.div className="absolute inset-0" style={{ opacity: img1Opacity }}><Image src={G(11)} alt="" fill className="object-cover" /></motion.div>
              <motion.div className="absolute inset-0" style={{ opacity: img2Opacity }}><Image src={G(18)} alt="" fill className="object-cover" /></motion.div>
              <motion.div className="absolute inset-0" style={{ opacity: img3Opacity }}><Image src={G(3)} alt="" fill className="object-cover" /></motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Heimat() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);
  return (
    <section ref={ref} className="relative bg-white text-zinc-900 py-40 px-6 overflow-hidden border-t border-zinc-100">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-zinc-100 order-2 md:order-1">
          <motion.div className="absolute inset-0" style={{ y: imgY, scale: 1.15 }}><Image src={G(9)} alt="" fill className="object-cover" /></motion.div>
        </div>
        <div className="order-1 md:order-2">
          <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-zinc-400 mb-6">Wo ich herkomme</div></FadeUp>
          <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-[0.9] mb-10"><AnimatedWords text="Das Wallis." stagger={0.06} /></h2>
          <FadeUp delay={0.3}>
            <p className="text-lg md:text-xl text-zinc-600 leading-relaxed font-light">
              Ich lebe in einer der schönsten Regionen der Schweiz – im Wallis, mitten in den Alpen. Berge, Pässe, Schnee, Hitze, Höhenmeter ohne Ende: Das ist nicht meine Kulisse, das ist mein täglicher Trainingsplatz.
            </p>
          </FadeUp>
          <FadeUp delay={0.45}>
            <p className="text-lg md:text-xl text-zinc-600 leading-relaxed font-light mt-6">
              Genau von hier aus erzähle ich meine Geschichten – ehrlich, draussen, am Limit. Eine Bühne, wie sie kein Studio liefern kann.
            </p>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

function Story() {
  return (
    <section className="bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white py-48 px-6 overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-12 text-center">Warum Garmin</div></FadeUp>
        <ScrollRevealText
          text="Ich laufe jeden einzelnen Tag. Jeder Kilometer, jeder Höhenmeter, jede Stunde am Limit – alles wird gemessen, alles zählt. Genau das ist die Welt, in der Garmin zuhause ist."
          className="text-2xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.25] text-white text-center"
        />
      </div>
      <div className="max-w-4xl mx-auto mt-32">
        <ScrollRevealText
          text="Ich denke nicht in einer Saison, sondern in einem Jahrzehnt. Aus dem Wallis hinaus, Tag für Tag, Berg für Berg – auf die grössten Ziele zu, die ich mir vorstellen kann."
          className="text-2xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.25] text-white text-center"
        />
        <FadeUp delay={0.3}><p className="text-center mt-16 text-lg text-white/50 italic">„Beat Yesterday – das lebe ich, jeden einzelnen Tag.“</p></FadeUp>
      </div>
    </section>
  );
}

function StatsLine() {
  const stats = [
    { value: "Täglich", label: "Laufen – seit Jahren ohne Pause", image: G(6) },
    { value: "200+", label: "Kilometer pro Race", image: G(18) },
    { value: "40 h+", label: "am Stück unterwegs", image: G(2) },
    { value: "12 Mio.", label: "Aufrufe · letzte 90 Tage", image: G(14) },
  ];
  return (
    <section className="bg-black text-white py-32 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto mb-16">
        <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">In Zahlen</div></FadeUp>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9] max-w-4xl"><AnimatedWords text="Jeden Tag. Am Limit." stagger={0.06} /></h2>
      </div>
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {stats.map((s, i) => (<FadeUp key={i} delay={i * 0.1} y={50}><StatTile value={s.value} label={s.label} image={s.image} /></FadeUp>))}
      </div>
    </section>
  );
}

function StatTile({ value, label, image }: { value: string; label: string; image: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.2, 1.05]);
  return (
    <div ref={ref} className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-zinc-900 group">
      <motion.div className="absolute inset-0" style={{ y, scale }}>
        <Image src={image} alt="" fill className="object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      </motion.div>
      <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
        <div className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-none mb-3">{value}</div>
        <div className="text-xs uppercase tracking-wider text-white/70">{label}</div>
      </div>
    </div>
  );
}

function Channels() {
  const channels = [
    { Icon: Youtube, name: "YouTube", text: "Mehrteilige Adventure- & Event-Dokus auf einem gezielt wachsenden Kanal – cineastisch, ehrlich, am Limit." },
    { Icon: Camera, name: "Bilder", text: "Ich bin selbst Fotograf. Hochwertige Race- und Adventure-Bilder, direkt nutzbar für die Garmin-Kanäle." },
    { Icon: Instagram, name: "Reels & Live", text: "Daily Reels aus dem Alltag in den Bergen sowie Live-Reels alle 1–3 Stunden während der Events." },
    { Icon: Mountain, name: "Adventure-Content", text: "Echte Geschichten aus den Walliser Alpen – Daten, Distanz, Höhenmeter, Natur. Genau die Welt, die Garmin zeigt." },
  ];
  return (
    <section className="bg-zinc-950 text-white py-40 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Was ich erzähle</div></FadeUp>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-10 leading-[0.9]"><AnimatedWords text="Content aus der echten Welt." stagger={0.05} /></h2>
        <div className="grid md:grid-cols-2 gap-px bg-white/10 rounded-3xl overflow-hidden mt-12">
          {channels.map(({ Icon, name, text }, i) => (
            <FadeUp key={i} delay={0.2 + i * 0.1}>
              <div className="bg-zinc-950 p-12 h-full hover:bg-zinc-900 transition-colors">
                <Icon size={44} className="text-white/80 mb-8" strokeWidth={1.5} />
                <h3 className="text-3xl font-semibold mb-4">{name}</h3>
                <p className="text-white/60 leading-relaxed">{text}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

function Interlude({ text }: { text: string }) {
  return (
    <section className="bg-black text-white py-40 px-6 overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <ScrollRevealText text={text} className="text-2xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.25] text-white text-center" />
      </div>
    </section>
  );
}

function Vision() {
  const items = [
    { Icon: Trophy, title: "Swiss Alps 100", text: "Rekord-Versuch auf einer der härtesten 100-Meilen-Strecken der Alpen – daheim, im Wallis." },
    { Icon: InfinityIcon, title: "1000 km am Stück", text: "Nach 1000 Tagen täglichem Laufen: 1000 Kilometer ohne Halt. Ein Mega-Projekt." },
    { Icon: Heart, title: "100'000 Höhenmeter", text: "100'000 Höhenmeter für krebskranke Kinder – an wechselnden Spots in der ganzen Schweiz." },
    { Icon: Footprints, title: "100 Laps bis 2035", text: "Backyard Ultra: konsequenter Aufbau über die nächsten Jahre. Das grosse Ziel sind 100 Runden." },
  ];
  return (
    <section id="vision" className="relative bg-zinc-950 text-white py-40 px-6 overflow-hidden scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Der lange Weg</div></FadeUp>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-10 leading-[0.9]"><AnimatedWords text="Die Vision bis 2035." stagger={0.05} /></h2>
        <FadeUp delay={0.3}>
          <p className="text-lg md:text-2xl text-white/60 font-light leading-relaxed max-w-3xl mb-20">
            Ich denke nicht in einer Saison, sondern in einem Jahrzehnt. Wer jetzt einsteigt, ist von der ersten Stunde an bei jeder dieser Geschichten dabei.
          </p>
        </FadeUp>
        <div className="grid md:grid-cols-2 gap-6">
          {items.map(({ Icon, title, text }, i) => (
            <FadeUp key={i} delay={0.15 + i * 0.08}>
              <div className="bg-black rounded-2xl p-10 h-full hover:bg-zinc-900 transition-colors flex gap-6 items-start">
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

function Events() {
  const races = [
    { name: "Ultimate Run", date: "24.–26. April 2026", location: "Deutschland", done: true },
    { name: "Witikoner Backyard", date: "14.–16. Mai 2026", location: "Zürich · 23 Runden", done: true },
    { name: "99 Lap Race", date: "25.–26. Juli 2026", location: "Deutschland", done: false },
    { name: "Last Soul Ultra", date: "14. August 2026", location: "International", done: false },
  ];
  return (
    <section className="bg-black text-white py-32 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Saison 2026</div></FadeUp>
        <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-[0.9] mb-16"><AnimatedWords text="Die Events dieses Jahr." stagger={0.06} /></h2>
        <div className="grid md:grid-cols-4 gap-4">
          {races.map((r, i) => (
            <FadeUp key={i} delay={0.2 + i * 0.1}>
              <div className="bg-zinc-900 rounded-2xl p-8 hover:bg-zinc-800 transition-colors h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-4xl font-bold text-white/30">{String(i + 1).padStart(2, "0")}</div>
                  <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full" style={{ color: r.done ? "rgba(255,255,255,0.5)" : "#fff", backgroundColor: r.done ? "rgba(255,255,255,0.08)" : GARMIN_BLUE }}>{r.done ? "gelaufen" : "kommt"}</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{r.name}</h3>
                <p className="text-white/50 text-sm flex items-center gap-1.5"><Calendar size={13} /> {r.date}</p>
                <p className="text-white/40 text-sm mt-1">{r.location}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

function GalleryGrid() {
  const images = [G(2), G(4), G(8), G(12), G(15), G(19)];
  return (
    <section className="bg-black text-white py-32 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto mb-20">
        <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Impressionen</div></FadeUp>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9]"><AnimatedWords text="Draussen. Jeden Tag." stagger={0.05} /></h2>
      </div>
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-4 md:gap-6">
        <ParallaxImage src={images[0]} className="col-span-12 md:col-span-7 aspect-[4/3]" />
        <ParallaxImage src={images[1]} className="col-span-12 md:col-span-5 aspect-[4/5]" />
        <ParallaxImage src={images[2]} className="col-span-6 md:col-span-4 aspect-square" />
        <ParallaxImage src={images[3]} className="col-span-6 md:col-span-4 aspect-square" />
        <ParallaxImage src={images[4]} className="col-span-12 md:col-span-4 aspect-square" />
        <ParallaxImage src={images[5]} className="col-span-12 aspect-[16/7]" />
      </div>
    </section>
  );
}

function ParallaxImage({ src, className = "" }: { src: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.15, 1.05]);
  return (
    <motion.div ref={ref} className={`relative overflow-hidden rounded-3xl bg-zinc-900 ${className}`} initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 1.2, ease: EASE }}>
      <motion.div className="absolute inset-0" style={{ y, scale }}><Image src={src} alt="" fill className="object-cover" /></motion.div>
    </motion.div>
  );
}

function Contact() {
  return (
    <section className="bg-black text-white px-6 py-40 overflow-hidden relative">
      <div className="absolute inset-0">
        <Image src={G(6)} alt="" fill className="object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/70 to-black" />
      </div>
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <FadeUp><p className="text-2xl md:text-4xl text-white/50 italic mb-16">„Ich würde mich freuen, diesen Weg mit Garmin zu gehen.“</p></FadeUp>
        <h2 className="text-6xl md:text-9xl lg:text-[11rem] font-bold tracking-tight mb-10 leading-[0.85]"><AnimatedWords text="Lass uns reden." stagger={0.08} /></h2>
        <FadeUp delay={0.7}>
          <div className="inline-flex flex-col items-center gap-5">
            <div className="text-2xl font-semibold">Pierre Biege</div>
            <a href="mailto:pierre@laeuft.ch" className="flex items-center gap-3 text-white/80 hover:text-white transition-colors text-lg group"><Mail size={20} className="group-hover:scale-110 transition-transform" /> pierre@laeuft.ch</a>
            <a href="tel:+41798533672" className="flex items-center gap-3 text-white/80 hover:text-white transition-colors text-lg group"><Phone size={20} className="group-hover:scale-110 transition-transform" /> +41 79 853 36 72</a>
          </div>
        </FadeUp>
        <FadeUp delay={1}>
          <Link href="/insights" target="_blank" className="mt-16 inline-flex items-center gap-3 px-6 py-3 border border-white/20 rounded-full text-sm text-white/80 hover:bg-white hover:text-black transition-colors group">
            <Eye size={16} /> Live-Insights ansehen <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="mt-4 text-sm text-white/40">Passwort: partner2026</p>
        </FadeUp>
        <FadeUp delay={1.2}><div className="mt-24 text-xs uppercase tracking-[0.4em] text-white/30">laeuft.ch</div></FadeUp>
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
      <Marquee items={["Pierre Biege", "Wallis", "Täglich laufen", "Ultra", "Swiss Alps 100", "Backyard", "Adventure", "Garmin", "2026"]} />
      <Bio />
      <Heimat />
      <Story />
      <StatsLine />
      <Channels />
      <Interlude text="Berge, Schnee, Hitze, Nacht. Mein Trainingsplatz sind die Walliser Alpen – und das Abenteuer hört nie auf." />
      <Vision />
      <Events />
      <GalleryGrid />
      <Contact />
    </div>
  );
}

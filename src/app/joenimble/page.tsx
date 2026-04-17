"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform, useInView, type MotionValue } from "framer-motion";
import { Youtube, Instagram, Camera, Users, Mail, Phone, BarChart3, ArrowRight, Footprints, Heart } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

// ==================== ASSETS ====================

const LSU = (n: number) => `/presentations/yfood/lastsoul/${String(n).padStart(2, "0")}.jpg`;
const SOL = (n: number) => `/presentations/yfood/solstice/${String(n).padStart(2, "0")}.jpg`;

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
            {i < words.length - 1 ? "\u00A0" : ""}
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
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 1, ease: EASE, delay }}
    >
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
        <Image src={LSU(2)} alt="" fill className="object-cover opacity-70" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black" />
      </motion.div>
      <motion.div className="relative z-10 max-w-6xl mx-auto px-6 text-center" style={{ y: contentY, opacity: contentOpacity }}>
        <motion.div
          className="inline-block mb-10 px-5 py-2 border border-white/20 rounded-full text-xs uppercase tracking-[0.4em] text-white/70"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          Pierre Biege × Joe Nimble
        </motion.div>
        <h1 className="text-7xl md:text-9xl lg:text-[12rem] font-bold tracking-tight leading-[0.85] mb-6">
          <AnimatedWords text="Let's write history." delay={0.4} stagger={0.1} />
        </h1>
        <motion.p
          className="text-xl md:text-3xl text-white/80 font-light tracking-wide mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.2 }}
        >
          Ultraläufer · Content Creator · Barfussläufer seit Kind
        </motion.p>
      </motion.div>
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 bottom-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2 }}
      >
        <motion.div
          className="w-px h-16 bg-white/40"
          animate={{ scaleY: [0, 1, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "top" }}
        />
      </motion.div>
    </section>
  );
}

function Marquee({ items }: { items: string[] }) {
  const repeated = [...items, ...items, ...items, ...items];
  return (
    <div className="overflow-hidden py-8 border-y border-white/10 bg-black">
      <motion.div
        className="flex gap-12 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
      >
        {repeated.map((item, i) => (
          <span key={i} className="text-3xl md:text-5xl font-bold tracking-tight uppercase text-white/80">
            {item} <span className="text-white/30 mx-4">·</span>
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
    <section ref={ref} className="relative bg-white">
      <div className="h-[200vh]">
        <div className="sticky top-0 h-screen flex items-center px-6">
          <div className="max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-16 items-center">
            <div>
              <FadeUp>
                <div className="text-xs uppercase tracking-[0.4em] text-zinc-400 mb-6">Wer bin ich</div>
              </FadeUp>
              <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-zinc-900 mb-10 leading-[0.9]">
                <AnimatedWords text="Pierre Biege." stagger={0.08} />
              </h2>
              <FadeUp delay={0.4}>
                <p className="text-lg md:text-xl text-zinc-600 leading-relaxed font-light">
                  Pierre Biege ist ein Ultraläufer und Content Creator aus den Schweizer Bergen, der sich auf extreme Formate wie Backyard-Ultras spezialisiert hat. Er läuft regelmässig über 200–250 Kilometer und ist dabei oft mehr als 40 Stunden am Stück unterwegs.
                </p>
              </FadeUp>
              <FadeUp delay={0.6}>
                <p className="text-lg md:text-xl text-zinc-600 leading-relaxed font-light mt-6">
                  Neben seiner sportlichen Leistung steht er für mentale Stärke, Ausdauer und einen authentischen Lifestyle in der Natur. Als Familienvater verbindet er seine Abenteuer mit echtem Alltag.
                </p>
              </FadeUp>
            </div>
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-zinc-100">
              <motion.div className="absolute inset-0" style={{ opacity: img1Opacity }}>
                <Image src={LSU(1)} alt="" fill className="object-cover" />
              </motion.div>
              <motion.div className="absolute inset-0" style={{ opacity: img2Opacity }}>
                <Image src={SOL(2)} alt="" fill className="object-cover" />
              </motion.div>
              <motion.div className="absolute inset-0" style={{ opacity: img3Opacity }}>
                <Image src={LSU(11)} alt="" fill className="object-cover" />
              </motion.div>
              <div className="absolute bottom-6 left-6 right-6 flex gap-2 z-10">
                <div className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-white origin-left" style={{ scaleX: useTransform(scrollYProgress, [0, 0.4], [0, 1]) }} />
                </div>
                <div className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-white origin-left" style={{ scaleX: useTransform(scrollYProgress, [0.33, 0.73], [0, 1]) }} />
                </div>
                <div className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-white origin-left" style={{ scaleX: useTransform(scrollYProgress, [0.66, 1], [0, 1]) }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function JoeNimbleStory() {
  return (
    <section className="bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white py-48 px-6 overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <FadeUp>
          <div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-12 text-center">Warum Joe Nimble</div>
        </FadeUp>
        <ScrollRevealText
          text="Ich komme aus dem Parkour. Als Teenager hab ich angefangen, mich durch Städte zu bewegen – Mauern, Geländer, Beton. Minimalschuhe, dünne Sohle, Fuss am Boden. Ich hab nie anders trainiert. Jahrelang. Mein Körper hat gelernt, was die meisten Laufschuhe versuchen zu simulieren – echte Stabilität, aus dem Fuss selbst."
          className="text-2xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.25] text-white text-center"
        />
      </div>
      <div className="max-w-4xl mx-auto mt-32">
        <ScrollRevealText
          text="Und dann kamen die Ultras. 100 km. Dann mehr. 200 km. In Barfussschuhen. Weil meine Füsse das erlaubt haben. Aber irgendwo zwischen stundenlangem Laufen merkt man, wo die Grenzen liegen. Nicht die des Körpers – die des Schuhs."
          className="text-2xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.25] text-white text-center"
        />
      </div>
      <div className="max-w-4xl mx-auto mt-32">
        <ScrollRevealText
          text="«Mehr Schuh» bedeutet in dieser Industrie fast immer dasselbe: enger. Die Zehenbox wird kleiner, der Fuss wird zusammengepresst. Mein Fuss ist breit. Meine Zehen brauchen Platz. Irgendwann hört man auf zu suchen und arrangiert sich."
          className="text-2xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.25] text-white text-center"
        />
      </div>
      <div className="max-w-4xl mx-auto mt-32">
        <ScrollRevealText
          text="Joe Nimble kenne ich seit über 12 Jahren. Ich bin damals, als Teenager, schon in Joe Nimble Schuhen gelaufen – ohne genau zu wissen warum es sich richtig anfühlte. Heute weiss ich warum. Wir sollten nicht einfach einen Schuh bauen und dann fragen, ob der Fuss reinpasst. Zuerst gehts darum wie ein Fuss eigentlich aussieht."
          className="text-2xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.25] text-white text-center"
        />
        <FadeUp delay={0.3}>
          <p className="text-center mt-16 text-lg text-white/50 italic">„But what if it works."</p>
        </FadeUp>
      </div>
    </section>
  );
}

function StatsLine() {
  const stats = [
    { value: "200+", label: "Kilometer pro Race", image: LSU(7) },
    { value: "700", label: "Tage Run-Streak", image: LSU(13) },
    { value: "4", label: "Ultra Races 2026", image: LSU(8) },
    { value: "18k+", label: "Community", image: LSU(10) },
  ];
  return (
    <section className="bg-black text-white py-32 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto mb-16">
        <FadeUp>
          <div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Die Saison in Zahlen</div>
        </FadeUp>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9] max-w-4xl">
          <AnimatedWords text="An der Grenze." stagger={0.06} />
        </h2>
      </div>
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {stats.map((s, i) => (
          <FadeUp key={i} delay={i * 0.1} y={50}>
            <StatTile value={s.value} label={s.label} image={s.image} />
          </FadeUp>
        ))}
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
        <div className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight tabular-nums leading-none mb-3">{value}</div>
        <div className="text-xs uppercase tracking-wider text-white/70">{label}</div>
      </div>
    </div>
  );
}

function Channels() {
  const channels = [
    { Icon: Youtube, name: "YouTube Serie", text: "Dokumentation pro Event – mind. zweiteilig, Kinoqualität" },
    { Icon: Camera, name: "Bilder", text: "Hochwertige Race-Shootings, professionelle Fotograf:innen vor Ort" },
    { Icon: Instagram, name: "Reels & Kurzvideos", text: "Live-Reels alle 1–3 Stunden während des Events" },
    { Icon: Users, name: "Community", text: "Inner Circle, Hardcore-Fans und engagierte Schweizer Lauf-Szene" },
  ];
  return (
    <section className="bg-zinc-950 text-white py-40 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <FadeUp>
          <div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Was wir liefern</div>
        </FadeUp>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-10 leading-[0.9]">
          <AnimatedWords text="Jeder Schritt zählt." stagger={0.06} />
        </h2>
        <FadeUp delay={0.3}>
          <p className="text-lg md:text-2xl text-white/60 font-light leading-relaxed max-w-3xl mb-20">
            An jedem unserer Events liefern wir eine umfassende Doku-Serie, professionelle Bilder, Live-Reels rund um die Uhr und bauen eine engagierte Community auf. Hier ist was du als Partner bekommst – auf jedem Kanal, bei jedem Race.
          </p>
        </FadeUp>
        <div className="grid md:grid-cols-2 gap-px bg-white/10 rounded-3xl overflow-hidden">
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

function RacesCompact() {
  const races = [
    { name: "Witikon Backyard", date: "Mai 2026", location: "Zürich" },
    { name: "99 Lap Race", date: "Juli 2026", location: "Schweiz" },
    { name: "Last Soul Ultra", date: "August 2026", location: "International" },
    { name: "Ultimate Run", date: "2026", location: "Schweiz" },
  ];
  return (
    <section className="bg-black text-white py-32 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <FadeUp>
          <div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Saison 2026</div>
        </FadeUp>
        <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-[0.9] mb-16">
          <AnimatedWords text="Vier Races." stagger={0.08} />
        </h2>
        <div className="grid md:grid-cols-4 gap-4">
          {races.map((r, i) => (
            <FadeUp key={i} delay={0.2 + i * 0.1}>
              <div className="bg-zinc-900 rounded-2xl p-8 hover:bg-zinc-800 transition-colors">
                <div className="text-4xl font-bold text-white/30 mb-4">{String(i + 1).padStart(2, "0")}</div>
                <h3 className="text-xl font-semibold mb-2">{r.name}</h3>
                <p className="text-white/50 text-sm">{r.date} · {r.location}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

function HeroMoment() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.4, 1.1, 1]);
  const textScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 1.1]);

  return (
    <section ref={ref} className="relative h-screen flex items-center justify-center overflow-hidden bg-black text-white">
      <motion.div className="absolute inset-0" style={{ scale }}>
        <Image src={LSU(6)} alt="" fill className="object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black" />
      </motion.div>
      <motion.div className="relative z-10 text-center px-6" style={{ scale: textScale }}>
        <FadeUp>
          <div className="text-xs uppercase tracking-[0.4em] text-white/50 mb-8">Last Soul Ultra 2025</div>
        </FadeUp>
        <h2 className="text-[8rem] md:text-[16rem] lg:text-[20rem] font-bold tracking-tighter leading-[0.8]">
          <AnimatedWords text="3." delay={0.2} stagger={0} />
          <span className="text-white/40">/100</span>
        </h2>
        <FadeUp delay={0.6}>
          <p className="text-xl md:text-3xl text-white/80 font-light mt-8 max-w-2xl mx-auto">
            Letztes Jahr kämpfte sich Pierre über 40 Stunden durch jede Runde – und holte den 3. Platz.
          </p>
        </FadeUp>
      </motion.div>
    </section>
  );
}

function GalleryGrid() {
  const images = [LSU(3), LSU(7), LSU(10), LSU(12), LSU(14), LSU(16)];
  return (
    <section className="bg-black text-white py-32 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto mb-20">
        <FadeUp>
          <div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Impressionen</div>
        </FadeUp>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9]">
          <AnimatedWords text="Was zwischen den Stunden passiert." stagger={0.05} />
        </h2>
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
    <motion.div
      ref={ref}
      className={`relative overflow-hidden rounded-3xl bg-zinc-900 ${className}`}
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 1.2, ease: EASE }}
    >
      <motion.div className="absolute inset-0" style={{ y, scale }}>
        <Image src={src} alt="" fill className="object-cover" />
      </motion.div>
    </motion.div>
  );
}

function HorizontalDrift() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], ["10%", "-40%"]);
  const images = [LSU(4), LSU(5), LSU(8), LSU(9), LSU(13), LSU(15), SOL(1), SOL(3), SOL(5)];
  return (
    <section ref={ref} className="bg-black py-32 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 mb-20">
        <FadeUp>
          <div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Behind the Scenes</div>
        </FadeUp>
        <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-[0.9] text-white">
          <AnimatedWords text="40 Stunden. Eine Mission." stagger={0.06} />
        </h2>
      </div>
      <motion.div className="flex gap-6 px-6 will-change-transform" style={{ x }}>
        {images.map((src, i) => (
          <motion.div
            key={i}
            className="relative shrink-0 w-[80vw] md:w-[55vw] lg:w-[42vw] aspect-[4/5] rounded-3xl overflow-hidden bg-zinc-900"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 1, ease: EASE, delay: i * 0.05 }}
          >
            <Image src={src} alt="" fill className="object-cover" />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

function Offer() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);
  const bullets = [
    "Exklusiver Footwear-Partner von Pierre – über alle Kanäle und Formate hinweg",
    "Integration in Dokumentationen und Know-How Transfer rund um Foot Health",
    "Pierre läuft immer mit Joe Nimble – Training und Race – authentische Product-Stories aus über 40 Stunden am Limit",
    "Aktionen bei Events möglich, falls gewünscht",
    "Einbindung in Reels auf allen Plattformen",
    "Co-Author Posts spezifisch auf Joe Nimble abgestimmt – mehrere pro Jahr",
    "Integration mit Logo auf der Webseite und in allen Decks für Projekte",
    "Bild und Video für Joe Nimble – Social Media, Webseite, Online/Offline Werbung möglich (in Absprache)",
  ];
  return (
    <section ref={ref} className="relative bg-black text-white py-40 px-6 overflow-hidden">
      <motion.div className="absolute inset-0" style={{ y: bgY }}>
        <Image src={LSU(11)} alt="" fill className="object-cover opacity-15" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black" />
      </motion.div>
      <div className="relative z-10 max-w-5xl mx-auto">
        <FadeUp>
          <div className="text-xs uppercase tracking-[0.4em] text-white/50 mb-6">Was wir Joe Nimble bieten</div>
        </FadeUp>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-20 leading-[0.9]">
          <AnimatedWords text="Das Angebot." stagger={0.06} />
        </h2>
        <ul className="space-y-px bg-white/10 rounded-3xl overflow-hidden">
          {bullets.map((b, i) => (
            <FadeUp key={i} delay={0.1 + i * 0.06}>
              <motion.li
                className="bg-black px-8 py-7 flex items-start gap-8"
                whileHover={{ backgroundColor: "rgb(24 24 27)", x: 6 }}
                transition={{ duration: 0.3 }}
              >
                <span className="text-3xl font-bold text-white/30 tabular-nums shrink-0 w-12">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-lg md:text-xl font-light pt-1">{b}</span>
              </motion.li>
            </FadeUp>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Expectations() {
  const items = [
    { icon: Footprints, text: "Bis zu 9 Paar Schuhe pro Jahr, die an den Events nass werden können" },
    { icon: Footprints, text: "Danach einen Rabatt für weiteren Bezug von Schuhen" },
    { icon: Heart, text: "Finanzielle Unterstützung von CHF 6'000.–" },
    { icon: BarChart3, text: "Affiliate-Möglichkeit – Pierre wird bereits heute die ganze Zeit nach Schuhen gefragt" },
    { icon: Footprints, text: "Miteinbindung bei Entwicklung (Test- & Prototypenmodelle) – Pierre ist seit Kind Barfussläufer und hat ein eigenes Interesse, Joe Nimble gross zu machen" },
    { icon: Users, text: "Integration auf der Joe Nimble Webseite als Athlet" },
  ];
  return (
    <section className="bg-zinc-950 text-white py-40 px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <FadeUp>
          <div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Was wir erwarten</div>
        </FadeUp>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-20 leading-[0.9]">
          <AnimatedWords text="Unsere Seite." stagger={0.06} />
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {items.map(({ icon: Icon, text }, i) => (
            <FadeUp key={i} delay={0.15 + i * 0.08}>
              <div className="bg-black rounded-2xl p-8 h-full hover:bg-zinc-900 transition-colors flex gap-6 items-start">
                <Icon size={28} className="text-white/40 shrink-0 mt-1" strokeWidth={1.5} />
                <p className="text-lg font-light text-white/80 leading-relaxed">{text}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section className="bg-black text-white px-6 py-40 overflow-hidden relative">
      <div className="absolute inset-0">
        <Image src={LSU(15)} alt="" fill className="object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/70 to-black" />
      </div>
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <FadeUp>
          <p className="text-2xl md:text-4xl text-white/50 italic mb-16">„We rise together, we perform together."</p>
        </FadeUp>
        <h2 className="text-6xl md:text-9xl lg:text-[12rem] font-bold tracking-tight mb-10 leading-[0.85]">
          <AnimatedWords text="Let's talk." stagger={0.1} />
        </h2>
        <FadeUp delay={0.5}>
          <p className="text-xl md:text-2xl text-white/70 mb-16 font-light max-w-2xl mx-auto">
            Wir freuen uns auf das Gespräch mit Joe Nimble.
          </p>
        </FadeUp>
        <FadeUp delay={0.7}>
          <div className="inline-flex flex-col items-center gap-5">
            <div className="text-2xl font-semibold">Anes</div>
            <a href="mailto:anes@casaofsport.ch" className="flex items-center gap-3 text-white/80 hover:text-white transition-colors text-lg group">
              <Mail size={20} className="group-hover:scale-110 transition-transform" /> anes@casaofsport.ch
            </a>
            <a href="tel:+41764181028" className="flex items-center gap-3 text-white/80 hover:text-white transition-colors text-lg group">
              <Phone size={20} className="group-hover:scale-110 transition-transform" /> +41 76 418 10 28
            </a>
          </div>
        </FadeUp>
        <FadeUp delay={1}>
          <Link
            href="/insights"
            target="_blank"
            className="mt-16 inline-flex items-center gap-3 px-6 py-3 border border-white/20 rounded-full text-sm text-white/80 hover:bg-white hover:text-black transition-colors group"
          >
            <BarChart3 size={16} /> Live-Insights ansehen <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </FadeUp>
        <FadeUp delay={1.2}>
          <div className="mt-24 text-xs uppercase tracking-[0.4em] text-white/30">läuft.ch</div>
        </FadeUp>
      </div>
    </section>
  );
}

// ==================== PAGE ====================

export default function JoeNimblePresentationPage() {
  return (
    <div className="font-sans antialiased bg-black">
      <Hero />
      <Marquee items={["Pierre Biege", "Ultra", "200 km", "40 h", "Barfuss", "Joe Nimble", "Schweiz", "2026"]} />
      <Bio />
      <JoeNimbleStory />
      <StatsLine />
      <Channels />
      <RacesCompact />
      <HeroMoment />
      <GalleryGrid />
      <HorizontalDrift />
      <Offer />
      <Expectations />
      <Contact />
    </div>
  );
}

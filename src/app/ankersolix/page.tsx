"use client";

import Image from "next/image";
import { useRef, useState, useEffect, Fragment } from "react";
import { motion, useScroll, useTransform, useInView, type MotionValue } from "framer-motion";
import { Mail, Phone, BatteryCharging, Sun, Camera, Mountain, Youtube, Instagram, Calendar } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;
const ANKER = "#10c9b6"; // SOLIX Teal
// Wallis-/Alpen-/Adventure-Aufnahmen (geteilt). Jedes Bild nur einmal.
const A = (n: number) => `/presentations/garmin/${String(n).padStart(2, "0")}.jpg`;

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
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className={`text-sm font-semibold uppercase tracking-[0.25em] text-white transition-opacity duration-500 ${scrolled ? "opacity-100" : "opacity-0 pointer-events-none"}`}>Pierre × Anker SOLIX</button>
        <nav className="flex items-center gap-6 text-xs uppercase tracking-[0.2em] text-white/80">
          <button onClick={() => go("pierre")} className="hover:text-white transition-colors">Über mich</button>
          <button onClick={() => go("projekte")} className="hover:text-white transition-colors">Projekte</button>
          <button onClick={() => go("kontakt")} className="hover:text-white transition-colors"><span className="border-b-2 pb-1" style={{ borderColor: ANKER }}>Kontakt</span></button>
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
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.1, 1.3]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  return (
    <section ref={ref} className="relative h-screen flex items-center justify-center overflow-hidden bg-black text-white">
      <motion.div className="absolute inset-0" style={{ y: imageY, scale: imageScale }}>
        <Image src={A(8)} alt="Sternennacht über dem Tal" fill className="object-cover opacity-80" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black" />
      </motion.div>
      <motion.div className="relative z-10 max-w-5xl mx-auto px-6 text-center" style={{ opacity: contentOpacity }}>
        <motion.div className="inline-block mb-8 px-5 py-2 border border-white/20 rounded-full text-xs uppercase tracking-[0.4em] text-white/70" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2 }}>
          Pierre Biege × Anker SOLIX
        </motion.div>
        <h1 className="sr-only">Pierre Biege × Anker SOLIX — Strom für die Geschichte</h1>
        <div className="text-6xl md:text-8xl lg:text-[10rem] font-bold tracking-tight leading-[0.85] mb-8">
          <AnimatedWords text="Strom für die Geschichte." delay={0.35} stagger={0.07} />
        </div>
        <motion.p className="text-lg md:text-2xl text-white/80 font-light max-w-3xl mx-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 1.2 }}>
          Tagelang off-grid in den Alpen – Kamera, Stirnlampe, Uhr, Telefon. Wenn der Akku stirbt, stirbt die Geschichte. Anker SOLIX hält sie am Laufen.
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
          <span key={i} className="text-2xl md:text-4xl font-bold tracking-tight uppercase text-white/70">{item} <span style={{ color: ANKER }} className="mx-3">/</span></span>
        ))}
      </motion.div>
    </div>
  );
}

// ==================== ABOUT ====================

function About() {
  const imgs = [A(12), A(1), A(24), A(15)];
  return (
    <section id="pierre" className="relative bg-black text-white py-28 md:py-40 px-6 scroll-mt-16 overflow-hidden">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center">
        <div>
          <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Wer ich bin</div></FadeUp>
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9] mb-8"><AnimatedWords text="Pierre Biege." stagger={0.07} /></h2>
          <FadeUp delay={0.3}>
            <p className="text-lg md:text-xl text-white/70 font-light leading-relaxed">
              Ultraläufer, Fotograf und Content Creator aus dem Wallis. Ich dokumentiere mehrtägige Ultra-Events und Abenteuer – oft fernab jeder Steckdose, von der ersten Dämmerung bis tief in die Nacht.
            </p>
          </FadeUp>
          <FadeUp delay={0.45}>
            <p className="text-lg md:text-xl text-white/70 font-light leading-relaxed mt-5">
              Mein ganzer Content lebt von Strom: Kameras, Drohne, Stirnlampe, Uhr, Telefon. Energie ist nicht Zubehör – sie ist die Voraussetzung dafür, dass die Geschichte überhaupt entsteht.
            </p>
          </FadeUp>
        </div>
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {imgs.map((src, i) => (<ParallaxImage key={i} src={src} className={`aspect-[3/4] ${i % 2 === 1 ? "mt-6 md:mt-10" : ""}`} />))}
        </div>
      </div>
    </section>
  );
}

// ==================== WARUM ANKER SOLIX ====================

function Story() {
  return (
    <section className="bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white py-40 md:py-48 px-6 overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-12 text-center">Warum Anker SOLIX</div></FadeUp>
        <ScrollRevealText text="Wenn ich tagelang draussen bin – in den Bergen, bei Ultra-Events, bei mehrtägigen Projekten – läuft alles über Strom. Und es gibt keine Steckdose. Genau da entscheidet sich, ob die Geschichte weiterlebt oder im Dunkeln endet." className="text-2xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.25] text-center" />
      </div>
      <div className="max-w-4xl mx-auto mt-28">
        <ScrollRevealText text="Anker SOLIX passt nicht einfach in mein Umfeld – es ist die Voraussetzung dafür. Powerstation und Solar, die allem standhalten, was die Alpen über vier Jahreszeiten austeilen. Authentisch im Einsatz, weil ich es wirklich brauche." className="text-2xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.25] text-center" />
        <FadeUp delay={0.3}><p className="text-center mt-16 text-lg text-white/50 italic">„Energie, die durchhält, solange ich durchhalte.“</p></FadeUp>
      </div>
    </section>
  );
}

// ==================== REICHWEITE ====================

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
        <div className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-none mb-3" style={{ color: highlight ? ANKER : "#fff" }}>{value}</div>
        <div className="text-xs uppercase tracking-wider text-white/70">{label}</div>
      </div>
    </div>
  );
}

function Reach() {
  const stats = [
    { value: "12 Mio.", label: "Aufrufe · 90 Tage · alle Kanäle", image: A(13), highlight: true },
    { value: "794k", label: "aktive Konten erreicht", image: A(19) },
    { value: "2,2 Mio.", label: "Aufrufe · 30 Tage", image: A(22) },
    { value: "200+", label: "Kilometer pro Race", image: A(17) },
  ];
  return (
    <section className="bg-black text-white py-28 md:py-40 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto mb-14">
        <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Die Reichweite</div></FadeUp>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9] max-w-4xl"><AnimatedWords text="Ein aktives Outdoor-Publikum." stagger={0.05} /></h2>
      </div>
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {stats.map((s, i) => (<FadeUp key={i} delay={i * 0.1} y={50}><StatTile {...s} /></FadeUp>))}
      </div>
      <div className="max-w-7xl mx-auto mt-10">
        <FadeUp delay={0.4}><p className="text-white/55 text-base md:text-lg font-light max-w-3xl">Über meine Kanäle erreiche ich ein grosses, aktives und outdoor-affines Publikum – genau die Menschen, die mehrtägig draussen unterwegs sind und verlässliche Energie brauchen.</p></FadeUp>
      </div>
    </section>
  );
}

// ==================== MEHRTÄGIGE PROJEKTE 2026 ====================

function Projekte() {
  const items = [
    { Icon: BatteryCharging, title: "1000 km am Stück", text: "Nach 1000 Tagen täglichem Laufen: 1000 Kilometer ohne Halt. Tagelang unterwegs – Kameras und Geräte müssen durchlaufen." },
    { Icon: Mountain, title: "Alle 4000er der Alpen", text: "Jeden Viertausender der Alpen besteigen – in 10 Jahren alle in einem durchgehenden Run. Mehrtägige Etappen, komplett autark." },
    { Icon: Sun, title: "100'000 Höhenmeter", text: "Für krebskranke Kinder – an wechselnden Spots in der ganzen Schweiz. Mobile Energie als ständiger Begleiter." },
  ];
  return (
    <section id="projekte" className="relative bg-zinc-950 text-white py-28 md:py-40 px-6 overflow-hidden scroll-mt-16">
      <div className="max-w-7xl mx-auto">
        <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Mehrtägige Projekte · 2026 & darüber hinaus</div></FadeUp>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-10 leading-[0.9]"><AnimatedWords text="Tage draussen. Ohne Steckdose." stagger={0.05} /></h2>
        <FadeUp delay={0.3}><p className="text-lg md:text-2xl text-white/60 font-light leading-relaxed max-w-3xl mb-16">Genau die Projekte, bei denen mobile Energie zur Hauptrolle wird – authentisch im Einsatz, über mehrere Tage, mit konkreten Integrations-Ideen.</p></FadeUp>
        <div className="grid md:grid-cols-3 gap-6">
          {items.map(({ Icon, title, text }, i) => (
            <FadeUp key={i} delay={0.1 + i * 0.08}>
              <div className="bg-black border border-white/10 p-10 h-full">
                <Icon size={32} strokeWidth={1.5} className="mb-6" style={{ color: ANKER }} />
                <h3 className="text-xl md:text-2xl font-semibold mb-3">{title}</h3>
                <p className="text-white/60 leading-relaxed font-light">{text}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==================== WAS ANKER SOLIX BEKOMMT ====================

function Deliverables() {
  const items = [
    { Icon: Youtube, name: "YouTube-Dokus", text: "Mehrteilige Adventure- & Event-Dokus, in denen Anker SOLIX echter Teil der Geschichte ist – nicht nachträglich platziert." },
    { Icon: Camera, name: "Authentisch im Einsatz", text: "Ich bin selbst Fotograf. Die Powerstation lädt im Camp, das Solarpanel in der Sonne am Berg – ehrlich gezeigt, weil real gebraucht." },
    { Icon: Instagram, name: "Reels, Stories & Collabs", text: "Daily Reels, Live-Stories vom Lauf, Erwähnungen und Collab-Posts mit @ankersolix – wenn ihr möchtet." },
    { Icon: BatteryCharging, name: "Material zur Nutzung", text: "Eine Auswahl hochwertiger Fotos & Clips von Anker SOLIX im echten Einsatz – für eure eigenen Kanäle." },
  ];
  return (
    <section className="bg-black text-white py-28 md:py-40 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Was Anker SOLIX bekommt</div></FadeUp>
        <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-[0.9] mb-12"><AnimatedWords text="Echt im Einsatz, nicht inszeniert." stagger={0.04} /></h2>
        <div className="grid md:grid-cols-2 gap-px bg-white/10">
          {items.map(({ Icon, name, text }, i) => (
            <FadeUp key={i} delay={0.1 * i}>
              <div className="bg-black p-10 md:p-12 h-full">
                <Icon size={40} strokeWidth={1.5} style={{ color: ANKER }} className="mb-7" />
                <h3 className="text-2xl md:text-3xl font-semibold mb-3">{name}</h3>
                <p className="text-white/60 font-light leading-relaxed">{text}</p>
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
    <section className="relative bg-zinc-950 text-white overflow-hidden">
      <div className="absolute inset-0 opacity-25">
        <Image src={A(11)} alt="" fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/60 to-black" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-28 md:py-40">
        <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/50 mb-6">Saison 2026</div></FadeUp>
        <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-[0.9] mb-14"><AnimatedWords text="Die grössten medialen Events." stagger={0.05} /></h2>
        <div>
          {races.map((r, i) => (
            <FadeUp key={i} delay={0.05 * i}>
              <div className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_1fr_auto] gap-x-6 gap-y-1 items-center py-6 border-t border-white/15 last:border-b">
                <div className="text-2xl md:text-4xl font-bold tracking-tight">{r.name}</div>
                <div className="text-white/55 text-sm md:text-base md:text-right flex items-center gap-2 md:justify-end"><Calendar size={14} className="opacity-60" /> {r.date}<span className="hidden md:inline"> · {r.loc}</span></div>
                <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color: r.done ? "rgba(255,255,255,0.4)" : ANKER }}>{r.done ? "gelaufen" : "kommt"}</div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==================== GALLERY ====================

function Gallery() {
  return (
    <section className="bg-black text-white py-24 md:py-32 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto mb-14">
        <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Impressionen</div></FadeUp>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9]"><AnimatedWords text="Draussen. Tag und Nacht." stagger={0.05} /></h2>
      </div>
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-3 md:gap-4">
        <ParallaxImage src={A(18)} className="col-span-12 aspect-[21/9]" />
        <ParallaxImage src={A(23)} className="col-span-6 md:col-span-4 aspect-[3/4]" />
        <ParallaxImage src={A(5)} className="col-span-6 md:col-span-4 aspect-[3/4]" />
        <ParallaxImage src={A(25)} className="col-span-12 md:col-span-4 aspect-[3/4]" />
        <ParallaxImage src={A(14)} className="col-span-12 aspect-[21/9]" />
        <ParallaxImage src={A(9)} className="col-span-6 md:col-span-4 aspect-[3/4]" />
        <ParallaxImage src={A(2)} className="col-span-6 md:col-span-4 aspect-[3/4]" />
        <ParallaxImage src={A(20)} className="col-span-12 md:col-span-4 aspect-[3/4]" />
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
        <Image src={A(8)} alt="" fill className="object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/50 to-black" />
      </motion.div>
      <div className="relative z-10 max-w-5xl mx-auto w-full text-center">
        <FadeUp><p className="text-xl md:text-3xl text-white/60 italic mb-12">„Lasst uns Energie liefern, wo es keine Steckdose gibt.“</p></FadeUp>
        <h2 className="text-6xl md:text-9xl font-bold tracking-tight leading-[0.85] mb-12"><AnimatedWords text="Lass uns reden." stagger={0.07} /></h2>
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

export default function AnkerSolixPresentationPage() {
  return (
    <div className="font-sans antialiased bg-black">
      <Header />
      <Hero />
      <Marquee items={["Pierre Biege", "Off-Grid", "Ultra", "Mehrtägig", "Alpen", "Solar", "Anker SOLIX", "2026"]} />
      <About />
      <Story />
      <Reach />
      <Projekte />
      <Deliverables />
      <Events />
      <Gallery />
      <Contact />
    </div>
  );
}

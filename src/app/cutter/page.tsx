"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform, useInView, type MotionValue } from "framer-motion";
import {
  Scissors, Film, TrendingUp, Send, Camera, Calendar, Sparkles,
  Zap, Flame, Rocket, Eye, Clapperboard, Mail, Instagram, ArrowRight,
} from "lucide-react";

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
            {i < words.length - 1 ? " " : ""}
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
        <Image src={LSU(5)} alt="" fill className="object-cover opacity-60" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black" />
      </motion.div>
      <motion.div className="relative z-10 max-w-6xl mx-auto px-6 text-center" style={{ y: contentY, opacity: contentOpacity }}>
        <motion.div
          className="inline-block mb-10 px-5 py-2 border border-white/20 rounded-full text-xs uppercase tracking-[0.4em] text-white/70"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          Cut · Social Media · Videograf
        </motion.div>
        <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-bold tracking-tight leading-[0.85] mb-6">
          <AnimatedWords text="Ich suche meine rechte Hand." delay={0.4} stagger={0.08} />
        </h1>
        <motion.p
          className="text-xl md:text-3xl text-white/80 font-light tracking-wide mt-10 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.2 }}
        >
          Cutter, der mitdenkt. Storyteller, der Viralität versteht. Jemand, der mit mir etwas Grosses baut.
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

function Intro() {
  return (
    <section className="bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white py-48 px-6 overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <FadeUp>
          <div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-12 text-center">Worum es geht</div>
        </FadeUp>
        <ScrollRevealText
          text="Ich bin Pierre. Ultraläufer, Content Creator. Aus ein paar Videos ist eine Bewegung geworden – mit einer Community, die jeden Schritt mitgeht. Über 200 Kilometer am Stück, über 40 Stunden am Limit. Und alles davon wird erzählt."
          className="text-2xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.25] text-white text-center"
        />
      </div>
      <div className="max-w-4xl mx-auto mt-32">
        <ScrollRevealText
          text="Aber ich komme an einen Punkt, wo ich alleine nicht mehr nachkomme. Ich laufe, ich filme, ich schneide, ich poste – alles selbst. Die Ideen sind da. Das Rohmaterial ist da. Was fehlt, sind die Hände und der Kopf, der daraus täglich Content macht."
          className="text-2xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.25] text-white text-center"
        />
      </div>
      <div className="max-w-4xl mx-auto mt-32">
        <ScrollRevealText
          text="Ich suche keinen Angestellten, der Tasks abarbeitet. Ich suche jemanden, der Content lebt. Der versteht, warum das eine Reel durch die Decke geht und das andere untergeht. Der einen roten Faden sieht, wo andere nur Clips sehen."
          className="text-2xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.25] text-white text-center"
        />
        <FadeUp delay={0.3}>
          <p className="text-center mt-16 text-lg text-white/50 italic">{"„Ich hab die Story. Ich brauche jemanden, der sie erzählt.“"}</p>
        </FadeUp>
      </div>
    </section>
  );
}

function Role() {
  const roles = [
    { Icon: Scissors, name: "Cut", text: "Du schneidest die verschiedenen Formate – Shorts, Reels, Vlogs, Podcast-Clips. Schnell, sauber, mit Gefühl für Rhythmus und Spannung." },
    { Icon: Film, name: "Storytelling", text: "Roter Faden, Storyline, Spannungsbogen. Jedes Video trägt eine Geschichte – du findest sie im Rohmaterial und erzählst sie." },
    { Icon: TrendingUp, name: "Viralität", text: "Du verstehst, was auf TikTok und Instagram zündet. Hook in den ersten zwei Sekunden, Pattern, Trends, der Moment, der hängen bleibt." },
    { Icon: Send, name: "Posting", text: "Du führst die Kanäle selbstständig – Instagram, TikTok, YouTube. Caption, Timing, was wann rausgeht. Du hältst den Feed am Leben." },
    { Icon: Camera, name: "Filmen", text: "Wenn du gut filmen kannst, ist das ein riesiger Vorteil. Beim Training, bei Events, im Alltag – nah dran an den Momenten, die zählen." },
    { Icon: Calendar, name: "Events", text: "Du bist bei Events live mittendrin. Backstage, an der Strecke, in der Nacht – da, wo die besten Geschichten passieren." },
  ];
  return (
    <section className="bg-zinc-950 text-white py-40 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <FadeUp>
          <div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Deine Rolle</div>
        </FadeUp>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-10 leading-[0.9]">
          <AnimatedWords text="Mehr als nur schneiden." stagger={0.06} />
        </h2>
        <FadeUp delay={0.3}>
          <p className="text-lg md:text-2xl text-white/60 font-light leading-relaxed max-w-3xl mb-20">
            Du bist meine kreative rechte Hand hinter der Kamera und am Schnittplatz. Vom Rohmaterial bis zum fertigen Post – du machst aus Momenten Content, der bewegt.
          </p>
        </FadeUp>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 rounded-3xl overflow-hidden">
          {roles.map(({ Icon, name, text }, i) => (
            <FadeUp key={i} delay={0.15 + i * 0.08}>
              <div className="bg-zinc-950 p-10 h-full hover:bg-zinc-900 transition-colors">
                <Icon size={40} className="text-white/80 mb-8" strokeWidth={1.5} />
                <h3 className="text-2xl font-semibold mb-4">{name}</h3>
                <p className="text-white/60 leading-relaxed">{text}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

function GoodDay() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);
  return (
    <section ref={ref} className="relative bg-black text-white py-40 px-6 overflow-hidden">
      <motion.div className="absolute inset-0" style={{ y: bgY }}>
        <Image src={LSU(9)} alt="" fill className="object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black" />
      </motion.div>
      <div className="relative z-10 max-w-4xl mx-auto">
        <FadeUp>
          <div className="text-xs uppercase tracking-[0.4em] text-white/50 mb-8 text-center">{"So sieht’s aus"}</div>
        </FadeUp>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9] mb-16 text-center">
          <AnimatedWords text="Ein richtig guter Tag." stagger={0.06} />
        </h2>
        <ScrollRevealText
          text="Ein richtig guter Tag heisst: Du machst eine Handvoll Short Reels für die Daily Postings. Instagram und TikTok wollen jeden Tag gefüttert werden. Du gehst durchs Rohmaterial, ziehst die besten Momente raus, baust den Hook, setzt den Schnitt – und am Ende des Tages steht Content für die ganze Woche im Kasten."
          className="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight leading-[1.3] text-white text-center"
        />
      </div>
    </section>
  );
}

function Stack() {
  const stats = [
    { value: "Daily", label: "Reels für Instagram & TikTok", image: LSU(7) },
    { value: "Shorts", label: "Kurzformat mit Hook & Punch", image: LSU(13) },
    { value: "Vlogs", label: "YouTube & Langformat schneiden", image: SOL(2) },
    { value: "Podcast", label: "Clips & Auskopplungen", image: LSU(8) },
  ];
  return (
    <section className="bg-zinc-950 text-white py-32 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto mb-16">
        <FadeUp>
          <div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Der Format-Stack</div>
        </FadeUp>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9] max-w-4xl">
          <AnimatedWords text="Was wir produzieren." stagger={0.06} />
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
        <Image src={image} alt="" fill className="object-cover opacity-55 group-hover:opacity-75 transition-opacity duration-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      </motion.div>
      <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
        <div className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-none mb-3">{value}</div>
        <div className="text-xs uppercase tracking-wider text-white/70">{label}</div>
      </div>
    </div>
  );
}

function Requirements() {
  const bullets = [
    "Du kannst schneiden – richtig schneiden. Verschiedene Formate, verschiedene Längen, sauberer Rhythmus.",
    "Du verstehst Viralität und Storytelling. Hook, Spannungsbogen, roter Faden – das ist dein Handwerk.",
    "Du denkst in Geschichten, nicht in einzelnen Clips.",
    "Du bist auf Abruf verfügbar und kannst auch mal schnell reagieren, wenn ein Moment frisch raus muss.",
    "Filmen ist ein Plus – kein Muss, aber ein grosser Vorteil.",
    "Du kannst die Kanäle selbstständig führen und posten – Instagram, TikTok, YouTube.",
    "Du hast Bock, bei Events live dabei zu sein und mittendrin zu produzieren.",
  ];
  return (
    <section className="bg-black text-white py-40 px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <FadeUp>
          <div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Was du mitbringst</div>
        </FadeUp>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-20 leading-[0.9]">
          <AnimatedWords text="Was du draufhaben musst." stagger={0.05} />
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

function WhyYou() {
  const items = [
    { icon: Rocket, text: "Du baust an einer echten Marke mit – von früh dabei, mit Reichweite, die jeden Monat wächst." },
    { icon: Sparkles, text: "Kreative Freiheit. Deine Ideen zählen. Du gestaltest mit, statt nur abzuarbeiten." },
    { icon: Flame, text: "Mittendrin statt nur dabei: Races, Events, Backstage – da, wo es passiert." },
    { icon: Zap, text: "Flexibel und freelance, auf Abruf. Wir finden ein Modell, das für beide Seiten passt." },
    { icon: Eye, text: "Sichtbarkeit für deine Arbeit – dein Schnitt läuft vor einer Community, die jeden Tag zuschaut." },
    { icon: Clapperboard, text: "Was hier entsteht, ist erst der Anfang. Wer jetzt mitbaut, wächst mit." },
  ];
  return (
    <section className="bg-zinc-950 text-white py-40 px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <FadeUp>
          <div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Was dich erwartet</div>
        </FadeUp>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-20 leading-[0.9]">
          <AnimatedWords text="Warum es sich lohnt." stagger={0.06} />
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

function GalleryGrid() {
  const images = [LSU(3), LSU(7), LSU(10), LSU(12), LSU(14), LSU(16)];
  return (
    <section className="bg-black text-white py-32 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto mb-20">
        <FadeUp>
          <div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Das Rohmaterial</div>
        </FadeUp>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9]">
          <AnimatedWords text="Aus diesen Momenten machst du Content." stagger={0.05} />
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

function Contact() {
  return (
    <section className="bg-black text-white px-6 py-40 overflow-hidden relative">
      <div className="absolute inset-0">
        <Image src={LSU(15)} alt="" fill className="object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/70 to-black" />
      </div>
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <FadeUp>
          <p className="text-2xl md:text-4xl text-white/50 italic mb-16">{"„Keine langweilige Bewerbung – zeig mir, wie du denkst.“"}</p>
        </FadeUp>
        <h2 className="text-6xl md:text-9xl lg:text-[12rem] font-bold tracking-tight mb-10 leading-[0.85]">
          <AnimatedWords text="Bock drauf?" stagger={0.08} />
        </h2>
        <FadeUp delay={0.5}>
          <p className="text-xl md:text-2xl text-white/70 mb-16 font-light max-w-2xl mx-auto">
            Dann schick mir deine besten Schnitte. Ein Showreel, ein paar Reels, die du gemacht hast – egal in welchem Format. Ich will sehen, was du draufhast und wie du Geschichten erzählst.
          </p>
        </FadeUp>
        <FadeUp delay={0.7}>
          <div className="inline-flex flex-col items-center gap-5">
            <div className="text-2xl font-semibold">Pierre Biege</div>
            <a href="mailto:pierre@laeuft.ch?subject=Bewerbung%20Cut%20%26%20Social%20Media" className="flex items-center gap-3 text-white/80 hover:text-white transition-colors text-lg group">
              <Mail size={20} className="group-hover:scale-110 transition-transform" /> pierre@laeuft.ch
            </a>
            <a href="https://instagram.com/pierrebiege" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-white/80 hover:text-white transition-colors text-lg group">
              <Instagram size={20} className="group-hover:scale-110 transition-transform" /> @pierrebiege
            </a>
          </div>
        </FadeUp>
        <FadeUp delay={1}>
          <a
            href="mailto:pierre@laeuft.ch?subject=Bewerbung%20Cut%20%26%20Social%20Media"
            className="mt-16 inline-flex items-center gap-3 px-7 py-4 bg-white text-black rounded-full text-base font-semibold hover:bg-white/90 transition-colors group"
          >
            Zeig mir was <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </a>
        </FadeUp>
        <FadeUp delay={1.2}>
          <div className="mt-24 text-xs uppercase tracking-[0.4em] text-white/30">läuft.ch</div>
        </FadeUp>
      </div>
    </section>
  );
}

// ==================== PAGE ====================

export default function CutterPage() {
  return (
    <div className="font-sans antialiased bg-black">
      <Hero />
      <Marquee items={["Cut", "Reels", "Storytelling", "Viralität", "Shorts", "TikTok", "Instagram", "YouTube", "Podcast", "Vlogs", "Events"]} />
      <Intro />
      <Role />
      <GoodDay />
      <Stack />
      <Requirements />
      <WhyYou />
      <GalleryGrid />
      <Contact />
    </div>
  );
}

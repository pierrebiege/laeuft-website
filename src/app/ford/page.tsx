"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useInView, type MotionValue } from "framer-motion";
import { Youtube, Instagram, Camera, Users, Mail, Phone, BarChart3, ArrowRight, Car, Mountain, Heart, Eye, Calendar } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;
const FORD_BLUE = "#1565ff";

// ==================== ASSETS ====================
// Ford × Pierre – Ultimate Run 2026
// 01 running/dirty + READY SET + Ranger · 02 READY SET Ford banner · 03 grey Ranger stand
// 04 arms crossed grey Ranger · 05 am Steuer / Abenteuer statt Alltag · 06 red Raptor sitzend
// 07 red Raptor landscape · 08 dreckige Hände · 09 dreckiges Gesicht · 10 erschöpft am READY SET FORD
// 11 Nacht Ford-Jacke · 12 Nacht Langzeit rot · 13 YOU VS YOU · 14 Nacht rot · 15 Mustang Lightpainting · 16 Camp/Rest

const F = (n: number) => `/presentations/ford/${String(n).padStart(2, "0")}.jpg`;
const LOGO = "/presentations/ford/laeuft-logo.png"; // READY SET Ford Kampagnen-Lockup (weiss)

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
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Nach oben"
          className={`relative h-11 w-20 transition-opacity duration-500 ${scrolled ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          <Image src={LOGO} alt="Ready Set Ford" fill className="object-contain object-left" />
        </button>
        <nav className="flex items-center gap-2 md:gap-3">
          <button
            onClick={() => go("pierre")}
            className="px-4 py-2 rounded-full border border-white/30 text-xs md:text-sm text-white/90 hover:bg-white hover:text-black transition-colors"
          >
            Über Pierre
          </button>
          <button
            onClick={() => go("angebot")}
            className="px-4 py-2 rounded-full text-xs md:text-sm font-medium text-white transition-transform hover:scale-105"
            style={{ backgroundColor: FORD_BLUE }}
          >
            Das Angebot
          </button>
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
        <Image src={F(1)} alt="" fill className="object-cover opacity-70" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black" />
      </motion.div>
      <motion.div className="relative z-10 max-w-6xl mx-auto px-6 text-center" style={{ y: contentY, opacity: contentOpacity }}>
        <motion.div
          className="inline-block mb-10 px-5 py-2 border border-white/20 rounded-full text-xs uppercase tracking-[0.4em] text-white/70"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          Pierre Biege × Ford
        </motion.div>
        <h1 className="sr-only">Pierre Biege × Ford — Ready. Set. Ford.</h1>
        <motion.div
          className="relative w-[78vw] max-w-[480px] aspect-[1346/1210] mx-auto mb-4"
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.3, delay: 0.4, ease: EASE }}
        >
          <Image src={LOGO} alt="Ready Set Ford" fill className="object-contain" priority />
        </motion.div>
        <motion.p
          className="text-xl md:text-3xl text-white/80 font-light tracking-wide mt-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.2 }}
        >
          Ultraläufer · Content Creator · Fotograf · Familienvater
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
            {item} <span style={{ color: FORD_BLUE }} className="mx-4">·</span>
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
              <FadeUp>
                <div className="text-xs uppercase tracking-[0.4em] text-zinc-400 mb-6">Wer bin ich</div>
              </FadeUp>
              <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-zinc-900 mb-10 leading-[0.9]">
                <AnimatedWords text="Pierre Biege." stagger={0.08} />
              </h2>
              <FadeUp delay={0.4}>
                <p className="text-lg md:text-xl text-zinc-600 leading-relaxed font-light">
                  Pierre Biege ist Ultraläufer, Fotograf und Content Creator aus den Schweizer Bergen. Er läuft extreme Formate wie Backyard-Ultras – regelmässig über 200 Kilometer, oft mehr als 40 Stunden am Stück.
                </p>
              </FadeUp>
              <FadeUp delay={0.6}>
                <p className="text-lg md:text-xl text-zinc-600 leading-relaxed font-light mt-6">
                  Als Familienvater von drei Kindern verbindet er seine Abenteuer mit echtem Alltag. Berge, Dreck, Natur – und immer ein Wagen, der die ganze Familie und das Equipment dorthin bringt, wo die Geschichten passieren.
                </p>
              </FadeUp>
            </div>
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-zinc-100">
              <motion.div className="absolute inset-0" style={{ opacity: img1Opacity }}>
                <Image src={F(3)} alt="" fill className="object-cover" />
              </motion.div>
              <motion.div className="absolute inset-0" style={{ opacity: img2Opacity }}>
                <Image src={F(5)} alt="" fill className="object-cover" />
              </motion.div>
              <motion.div className="absolute inset-0" style={{ opacity: img3Opacity }}>
                <Image src={F(9)} alt="" fill className="object-cover" />
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

function FordStory() {
  return (
    <section className="bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white py-48 px-6 overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <FadeUp>
          <div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-12 text-center">Warum Ford</div>
        </FadeUp>
        <ScrollRevealText
          text="Ford habe ich am Ultimate Run kennengelernt. Mitten in der Nacht, dreckig, am absoluten Limit – und genau da hat es Klick gemacht. Eure Welt ist nicht das saubere Gym. Sie ist draussen, im Dreck, im Abenteuer. Genau da lebe ich."
          className="text-2xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.25] text-white text-center"
        />
      </div>
      <div className="max-w-4xl mx-auto mt-32">
        <ScrollRevealText
          text="Ich bin in den Alpen zuhause. Mit einem Wagen komme ich überall hin – auf jeden Pass, an jeden Startpunkt, in jede Geschichte. Performance, die man nicht inszeniert, sondern die einfach passiert. You vs You."
          className="text-2xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.25] text-white text-center"
        />
      </div>
    </section>
  );
}

function Interlude({ text, quote }: { text: string; quote?: string }) {
  return (
    <section className="bg-black text-white py-40 px-6 overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <ScrollRevealText
          text={text}
          className="text-2xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.25] text-white text-center"
        />
        {quote && (
          <FadeUp delay={0.3}>
            <p className="text-center mt-16 text-lg text-white/50 italic">{quote}</p>
          </FadeUp>
        )}
      </div>
    </section>
  );
}

function StatsLine() {
  const stats = [
    { value: "12 Mio.", label: "Aufrufe · letzte 90 Tage", image: F(1) },
    { value: "794k", label: "Konten erreicht · 90 Tage", image: F(13) },
    { value: "2,2 Mio.", label: "Aufrufe · letzte 30 Tage", image: F(14) },
    { value: "200+", label: "Kilometer pro Race", image: F(10) },
  ];
  return (
    <section className="bg-black text-white py-32 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto mb-16">
        <FadeUp>
          <div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Die Reichweite in Zahlen</div>
        </FadeUp>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9] max-w-4xl">
          <AnimatedWords text="Wir wachsen. Schnell." stagger={0.06} />
        </h2>
      </div>
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {stats.map((s, i) => (
          <FadeUp key={i} delay={i * 0.1} y={50}>
            <StatTile value={s.value} label={s.label} image={s.image} />
          </FadeUp>
        ))}
      </div>
      <div className="max-w-6xl mx-auto mt-10">
        <FadeUp delay={0.4}>
          <p className="text-white/50 text-base md:text-lg font-light max-w-3xl">
            Ich bin (noch) kein riesiger Creator – aber ich erreiche schon heute extrem viele Menschen, und die Kurve zeigt steil nach oben. Wer jetzt einsteigt, wächst mit. Genau das ist die Chance.
          </p>
        </FadeUp>
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
        <div className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight tabular-nums leading-none mb-3">{value}</div>
        <div className="text-xs uppercase tracking-wider text-white/70">{label}</div>
      </div>
    </div>
  );
}

function YouTubeBuild() {
  const points = [
    { Icon: Youtube, title: "Aufbau mit einem Profi", text: "An meiner Seite: Clemens Hovekamp – Mitorganisator des Ultimate Run und verantwortlich für den Aufbau grosser YouTube-Formate wie «7 vs. Wild». Er betreut mich und den Kanal." },
    { Icon: Mountain, title: "Ford mittendrin", text: "Ford ist von Anfang an Teil der Adventures – kein nachträglich platziertes Logo, sondern fest in den Geschichten. Ford fährt mit, während der Kanal wächst." },
    { Icon: BarChart3, title: "Ziel: starkes Wachstum", text: "Wir bauen den Kanal im kommenden Jahr gezielt aus. Wer jetzt einsteigt, ist von der ersten Stunde an bei jeder Geschichte dabei." },
  ];
  return (
    <section className="bg-black text-white py-28 px-6 overflow-hidden border-t border-white/10">
      <div className="max-w-6xl mx-auto">
        <FadeUp>
          <div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-5">Ausserdem · der Plan</div>
        </FadeUp>
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-5 leading-[0.95]">
          <AnimatedWords text="Wir bauen YouTube auf." stagger={0.05} />
        </h2>
        <FadeUp delay={0.3}>
          <p className="text-base md:text-lg text-white/55 font-light leading-relaxed max-w-2xl mb-12">
            Parallel zu allem anderen: der gezielte Aufbau eines YouTube-Kanals – und Ford ist bei den Abenteuern mittendrin, nicht nur dabei.
          </p>
        </FadeUp>
        <div className="grid md:grid-cols-3 gap-5">
          {points.map(({ Icon, title, text }, i) => (
            <FadeUp key={i} delay={0.2 + i * 0.1}>
              <div className="bg-zinc-950 border border-white/10 rounded-2xl p-7 h-full hover:bg-zinc-900 transition-colors">
                <Icon size={30} strokeWidth={1.5} className="mb-5" style={{ color: FORD_BLUE }} />
                <h3 className="text-base font-semibold mb-2">{title}</h3>
                <p className="text-sm text-white/55 leading-relaxed font-light">{text}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

function Channels() {
  const channels = [
    { Icon: Youtube, name: "YouTube-Dokus", text: "Mehrteilige Adventure- & Event-Dokus auf dem wachsenden Kanal – cineastisch, ehrlich, am Limit. Ford mittendrin." },
    { Icon: Camera, name: "Bilder", text: "Pierre ist selbst Fotograf. Hochwertige Race- und Adventure-Bilder, direkt nutzbar für die Ford-Kanäle – ohne externes Team." },
    { Icon: Instagram, name: "Reels & Live", text: "Daily Reels aus dem Alltag sowie Live-Reels alle 1–3 Stunden während der Events – Nähe in Echtzeit." },
    { Icon: Mountain, name: "Auto- & Adventure-Content", text: "Content speziell für eure Kanäle: der Ford im echten Leben – Berge, Familie, Dreck, Abenteuer. Genau die Welt, die ihr zeigen wollt." },
  ];
  return (
    <section className="bg-zinc-950 text-white py-40 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <FadeUp>
          <div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Was wir liefern</div>
        </FadeUp>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-10 leading-[0.9]">
          <AnimatedWords text="Content, der nicht inszeniert wirkt." stagger={0.05} />
        </h2>
        <FadeUp delay={0.3}>
          <p className="text-lg md:text-2xl text-white/60 font-light leading-relaxed max-w-3xl mb-20">
            Kanalübergreifend, authentisch und alles aus einer Hand – konkret <span className="text-white font-medium">2–4 nutzbare Content-Pieces pro Monat</span> (Videos, Reels &amp; Bilder), die Ford frei auf den eigenen Kanälen einsetzen kann. Hier ist, was drinsteckt.
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

function Everyday() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);
  return (
    <section ref={ref} className="relative bg-white text-zinc-900 py-40 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        <div>
          <FadeUp>
            <div className="text-xs uppercase tracking-[0.4em] text-zinc-400 mb-6">Abenteuer statt Alltag</div>
          </FadeUp>
          <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-[0.9] mb-10">
            <AnimatedWords text="Nicht nur am Event." stagger={0.06} />
          </h2>
          <FadeUp delay={0.3}>
            <p className="text-lg md:text-xl text-zinc-600 leading-relaxed font-light">
              Ein Ford bleibt nicht im Rampenlicht der Races stehen. Er ist Teil meines Lebens – beim Einkaufen, in den Ferien, beim Einladen der drei Kids (Platz ohne Ende), auf dem Weg in die Berge.
            </p>
          </FadeUp>
          <FadeUp delay={0.45}>
            <p className="text-lg md:text-xl text-zinc-600 leading-relaxed font-light mt-6">
              So entsteht echte, dauerpräsente Sichtbarkeit – nicht als Werbung, sondern als gelebter Alltag. Genau die Geschichte, die «Abenteuer statt Alltag» erzählen will.
            </p>
          </FadeUp>
        </div>
        <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-zinc-100">
          <motion.div className="absolute inset-0" style={{ y: imgY, scale: 1.15 }}>
            <Image src={F(5)} alt="" fill className="object-cover" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Races() {
  const races = [
    {
      tag: "Das erste Projekt",
      name: "99 Lap Race",
      date: "25.–26. Juli 2026 · Deutschland",
      image: F(7),
      text: "Hier startet die Partnerschaft – als Ford Athlet. 99 Runden bis ans Limit, eine eigene Doku-Reihe, Live-Content direkt aus dem Camp und Ford präsent auf jeder Etappe. Das Projekt, das ich als erstes besetzen will.",
    },
    {
      tag: "Der Härtetest",
      name: "Last Soul Ultra",
      date: "14. August 2026 · International",
      image: F(6),
      text: "100 Runden, über 40 Stunden am Stück. Letztes Jahr Platz 3. Dieses Jahr mit Ford an der Seite – über 40 Stunden Content am absoluten Limit, von Tag bis tief in die Nacht.",
    },
  ];
  return (
    <section className="bg-black text-white py-40 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto mb-16">
        <FadeUp>
          <div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Saison 2026</div>
        </FadeUp>
        <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-[0.9]">
          <AnimatedWords text="Zwei Bühnen." stagger={0.08} />
        </h2>
      </div>
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
        {races.map((r, i) => (
          <FadeUp key={i} delay={0.2 + i * 0.12}>
            <div className="relative rounded-3xl overflow-hidden bg-zinc-900 h-full min-h-[460px] group">
              <Image src={r.image} alt="" fill className="object-cover opacity-50 group-hover:opacity-65 transition-opacity duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
              <div className="relative z-10 p-10 flex flex-col justify-end h-full">
                <div className="text-xs uppercase tracking-[0.3em] mb-4" style={{ color: FORD_BLUE }}>{r.tag}</div>
                <h3 className="text-4xl md:text-5xl font-bold mb-3 leading-tight">{r.name}</h3>
                <p className="text-white/50 text-sm mb-6 flex items-center gap-2"><Calendar size={14} /> {r.date}</p>
                <p className="text-white/80 text-lg font-light leading-relaxed">{r.text}</p>
              </div>
            </div>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}

function HeroMoment() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.4, 1.1, 1]);
  const textScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.85, 1, 1.08]);

  return (
    <section ref={ref} className="relative h-screen flex items-center justify-center overflow-hidden bg-black text-white">
      <motion.div className="absolute inset-0" style={{ scale }}>
        <Image src={F(10)} alt="" fill className="object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black" />
      </motion.div>
      <motion.div className="relative z-10 text-center px-6" style={{ scale: textScale }}>
        <FadeUp>
          <div className="text-xs uppercase tracking-[0.4em] text-white/50 mb-8">Ultimate Run 2026</div>
        </FadeUp>
        <h2 className="text-5xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-[0.9] max-w-5xl mx-auto">
          <AnimatedWords text="Wo andere aufhören, fängt die Geschichte an." stagger={0.04} />
        </h2>
        <FadeUp delay={0.6}>
          <p className="text-xl md:text-2xl text-white/70 font-light mt-10 max-w-2xl mx-auto">
            Dort war Ford schon dabei. Genau diese Momente will ich weitererzählen.
          </p>
        </FadeUp>
      </motion.div>
    </section>
  );
}

function GalleryGrid() {
  const images = [F(2), F(8), F(4), F(16), F(9), F(7)];
  return (
    <section className="bg-black text-white py-32 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto mb-20">
        <FadeUp>
          <div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Impressionen</div>
        </FadeUp>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9]">
          <AnimatedWords text="Dreck. Natur. Performance." stagger={0.05} />
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
  const images = [F(12), F(15), F(11), F(14), F(13), F(16)];
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

function Pipeline() {
  const items = [
    { value: "1000 km", title: "Nach 1000 Tagen", text: "Im Februar: 1000 Kilometer am Stück – nach 1000 Tagen ununterbrochenem Run-Streak. Ein Mega-Projekt mit riesiger medialer Strahlkraft." },
    { value: "100'000 hm", title: "Für krebskranke Kinder", text: "100'000 Höhenmeter und 100'000+ Franken für krebskranke Kinder. An wechselnden Spots in der ganzen Schweiz – ein Wagen ist überall dabei und dauerpräsent." },
    { value: "48 × 4000", title: "Alle Viertausender", text: "Alle Viertausender der Schweiz – erst einzeln, dann in 7–8 Jahren alle kombiniert. Ein Langzeit-Projekt, das eine Partnerschaft über Jahre trägt." },
  ];
  return (
    <section className="bg-zinc-950 text-white py-40 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <FadeUp>
          <div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">In der Pipeline</div>
        </FadeUp>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-10 leading-[0.9]">
          <AnimatedWords text="Gemeinsam wachsen." stagger={0.06} />
        </h2>
        <FadeUp delay={0.3}>
          <p className="text-lg md:text-2xl text-white/60 font-light leading-relaxed max-w-3xl mb-20">
            Noch nicht Teil des Pakets – aber die Richtung, in die es geht. Wer jetzt einsteigt, ist bei diesen Geschichten von Anfang an dabei.
          </p>
        </FadeUp>
        <div className="grid md:grid-cols-3 gap-6">
          {items.map((it, i) => (
            <FadeUp key={i} delay={0.2 + i * 0.1}>
              <div className="bg-black rounded-2xl p-10 h-full hover:bg-zinc-900 transition-colors">
                <div className="text-4xl md:text-5xl font-bold tracking-tight mb-6" style={{ color: FORD_BLUE }}>{it.value}</div>
                <h3 className="text-xl font-semibold mb-4">{it.title}</h3>
                <p className="text-white/60 leading-relaxed font-light">{it.text}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

function Offer() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);
  const bullets = [
    "2–4 nutzbare Content-Pieces pro Monat – Videos, Reels und Bilder, die Ford frei auf den eigenen Kanälen verwenden kann",
    "99 Lap Race als Ford Athlet – das erste Projekt, inkl. Doku-Reihe und Live-Content (inkl. Buyout)",
    "Last Soul Ultra mit Ford an der Seite – über 40 Stunden Content am absoluten Limit",
    "Ford-Branding auf der Kleidung – Ford bestimmt, auf welchen Teilen. Getragen in den YouTube-Videos und vor allem bei den Daily Runs",
    "Regelmässige Präsenz im Alltag – Ford beim Einkaufen, in den Ferien, mit den Kids (viel Platz), in den Bergen",
    "Auto- & Adventure-Content speziell für die Ford-Kanäle – direkt verwertbar",
    "Verfügbarkeit für 2–3 Ford-Events in DE oder CH – exklusiv",
    "Ford Runner für diverse Kampagnen (im angemessenen Rahmen)",
    "Buyout: Ford darf den Content während der gesamten Partnerschaft + 1 Monat danach verwerten",
    "Pierre ist selbst Fotograf & Creator – hochwertiges Material inklusive, kein externes Team nötig",
  ];
  return (
    <section ref={ref} id="angebot" className="relative bg-black text-white py-40 px-6 overflow-hidden scroll-mt-20">
      <motion.div className="absolute inset-0" style={{ y: bgY }}>
        <Image src={F(10)} alt="" fill className="object-cover opacity-15" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black" />
      </motion.div>
      <div className="relative z-10 max-w-5xl mx-auto">
        <FadeUp>
          <div className="text-xs uppercase tracking-[0.4em] text-white/50 mb-6">Das Angebot</div>
        </FadeUp>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-10 leading-[0.9]">
          <AnimatedWords text="Was Ford bekommt." stagger={0.06} />
        </h2>
        <FadeUp delay={0.2}>
          <p className="text-lg md:text-xl text-white/60 font-light leading-relaxed max-w-3xl mb-16">
            Ein massgeschneiderter Vorschlag für eine Partnerschaft auf Augenhöhe – für Ford gemacht. Das steckt drin:
          </p>
        </FadeUp>
        <ul className="space-y-px bg-white/10 rounded-3xl overflow-hidden">
          {bullets.map((b, i) => (
            <FadeUp key={i} delay={0.1 + i * 0.06}>
              <motion.li
                className="bg-black px-8 py-7 flex items-start gap-8"
                whileHover={{ backgroundColor: "rgb(24 24 27)", x: 6 }}
                transition={{ duration: 0.3 }}
              >
                <span className="text-3xl font-bold tabular-nums shrink-0 w-12" style={{ color: FORD_BLUE }}>{String(i + 1).padStart(2, "0")}</span>
                <span className="text-lg md:text-xl font-light pt-1">{b}</span>
              </motion.li>
            </FadeUp>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Exclusivity() {
  return (
    <section className="bg-white text-zinc-900 py-40 px-6 overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <FadeUp>
          <div className="text-xs uppercase tracking-[0.4em] text-zinc-400 mb-6">Exklusivität</div>
        </FadeUp>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-12 leading-[0.9]">
          <AnimatedWords text="Nur Ford." stagger={0.08} />
        </h2>
        <FadeUp delay={0.2}>
          <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-10 md:p-12">
            <Car size={40} strokeWidth={1.5} className="mb-8" style={{ color: FORD_BLUE }} />
            <h3 className="text-2xl md:text-3xl font-semibold mb-4">Exklusiver Auto-Partner</h3>
            <p className="text-zinc-600 text-lg font-light leading-relaxed">
              Ford ist die einzige Automarke an Pierres Seite – über die gesamte Partnerschaft. Andere aus der Auto-Branche haben bereits angefragt, Mini eingeschlossen.
            </p>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

function Expectations() {
  const items = [
    { icon: Car, text: "Ford Tourneo Custom für 12 Monate – oder ein Ford mit Dachzelt/Aufstelldach, fast noch praktischer für unterwegs mit der 5-köpfigen Familie, Equipment und Abenteuer" },
    { icon: Heart, text: "Monatliche Vergütung – CHF 2'000–3'000 pro Monat" },
    { icon: BarChart3, text: "Buyout-Vereinbarung für die Verwertung des Contents (Partnerschaft + 1 Monat danach)" },
    { icon: Users, text: "Integration als Ford Runner / Athlet auf den Ford-Kanälen" },
  ];
  return (
    <section className="bg-zinc-950 text-white py-40 px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <FadeUp>
          <div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Was wir uns wünschen</div>
        </FadeUp>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-20 leading-[0.9]">
          <AnimatedWords text="Unsere Seite." stagger={0.06} />
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {items.map(({ icon: Icon, text }, i) => (
            <FadeUp key={i} delay={0.15 + i * 0.08}>
              <div className="bg-black rounded-2xl p-8 h-full hover:bg-zinc-900 transition-colors flex gap-6 items-start">
                <Icon size={28} className="shrink-0 mt-1" strokeWidth={1.5} style={{ color: FORD_BLUE }} />
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
        <Image src={F(2)} alt="" fill className="object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/70 to-black" />
      </div>
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <FadeUp>
          <p className="text-2xl md:text-4xl text-white/50 italic mb-16">„Ich will Ford schon jetzt an meiner Seite wissen – und gemeinsam wachsen.“</p>
        </FadeUp>
        <h2 className="text-6xl md:text-9xl lg:text-[11rem] font-bold tracking-tight mb-10 leading-[0.85]">
          <AnimatedWords text="Ready. Set." stagger={0.08} />
        </h2>
        <FadeUp delay={0.5}>
          <p className="text-xl md:text-2xl text-white/70 mb-16 font-light max-w-2xl mx-auto">
            Wir freuen uns auf das Gespräch mit Ford.
          </p>
        </FadeUp>
        <FadeUp delay={0.7}>
          <div className="inline-flex flex-col items-center gap-5">
            <div className="text-2xl font-semibold">Pierre Biege</div>
            <a href="mailto:pierre@laeuft.ch" className="flex items-center gap-3 text-white/80 hover:text-white transition-colors text-lg group">
              <Mail size={20} className="group-hover:scale-110 transition-transform" /> pierre@laeuft.ch
            </a>
            <a href="tel:+41798533672" className="flex items-center gap-3 text-white/80 hover:text-white transition-colors text-lg group">
              <Phone size={20} className="group-hover:scale-110 transition-transform" /> +41 79 853 36 72
            </a>
          </div>
        </FadeUp>
        <FadeUp delay={1}>
          <Link
            href="/insights"
            target="_blank"
            className="mt-16 inline-flex items-center gap-3 px-6 py-3 border border-white/20 rounded-full text-sm text-white/80 hover:bg-white hover:text-black transition-colors group"
          >
            <Eye size={16} /> Live-Insights ansehen <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="mt-4 text-sm text-white/40">Passwort: partner2026</p>
        </FadeUp>
        <FadeUp delay={1.2}>
          <div className="mt-24 text-xs uppercase tracking-[0.4em] text-white/30">laeuft.ch</div>
        </FadeUp>
      </div>
    </section>
  );
}

// ==================== PAGE ====================

export default function FordPresentationPage() {
  return (
    <div className="font-sans antialiased bg-black">
      <Header />
      <Hero />
      <Marquee items={["Pierre Biege", "Abenteuer statt Alltag", "Ultra", "200 km", "Alpen", "You vs You", "Ford", "2026"]} />
      <Bio />
      <FordStory />
      <StatsLine />
      <Channels />
      <YouTubeBuild />
      <Interlude text="Ich bin Vater von drei Kindern, Fotograf und Content Creator. Mein Leben ist Bewegung – mit der Familie in die Ferien, mit Equipment in die Berge, mit den Kids ins Abenteuer. Ein Ford ist da nicht Werbefläche. Er ist Teil des Alltags." />
      <Everyday />
      <Races />
      <HeroMoment />
      <GalleryGrid />
      <HorizontalDrift />
      <Interlude
        text="«Abenteuer statt Alltag» ist kein Claim, den ich spielen muss. Es ist, wie ich lebe. Und «Ready, Set, Ford» fühlt sich an, als wäre es für mich geschrieben."
        quote="„Ich will nicht irgendein Partner sein. Ich will Ford Runner sein.“"
      />
      <Pipeline />
      <Offer />
      <Exclusivity />
      <Expectations />
      <Contact />
    </div>
  );
}

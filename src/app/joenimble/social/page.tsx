"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform, useInView, type MotionValue } from "framer-motion";
import {
  Instagram,
  Music2,
  Users,
  Camera,
  Video,
  FlaskConical,
  Footprints,
  MessageCircle,
  Mail,
  Phone,
} from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;
const ACID = "#E3F32A";

// Bildauswahl aus dem Joe-Nimble-Material (Ultimate Run, 99 Laps, Albinen 2026)
const IMG = (n: number) => `/presentations/joenimble/${String(n).padStart(2, "0")}.jpg`;

// ==================== MOTION ====================

function AnimatedWords({
  text,
  className = "",
  delay = 0,
  stagger = 0.05,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
}) {
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

function FadeUp({
  children,
  delay = 0,
  y = 40,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });
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
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "start 0.25"] });
  const words = text.split(" ");
  return (
    <p ref={ref} className={className}>
      {words.map((word, i) => {
        const start = i / words.length;
        const end = start + 1 / words.length;
        return (
          <RevealWord key={i} progress={scrollYProgress} range={[start, end]}>
            {word}
          </RevealWord>
        );
      })}
    </p>
  );
}

function RevealWord({
  children,
  progress,
  range,
}: {
  children: React.ReactNode;
  progress: MotionValue<number>;
  range: [number, number];
}) {
  const opacity = useTransform(progress, range, [0.15, 1]);
  return (
    <motion.span style={{ opacity }} className="inline-block mr-[0.25em]">
      {children}
    </motion.span>
  );
}

function ParallaxImage({ src, className = "", opacity = 1 }: { src: string; className?: string; opacity?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.15, 1.05]);
  return (
    <motion.div
      ref={ref}
      className={`relative overflow-hidden bg-zinc-900 ${className}`}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 1.1, ease: EASE }}
    >
      <motion.div className="absolute inset-0" style={{ y, scale }}>
        <Image src={src} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" style={{ opacity }} />
      </motion.div>
    </motion.div>
  );
}

function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <span className="h-px w-10" style={{ background: ACID }} />
      <span
        className={`text-[11px] uppercase tracking-[0.35em] ${dark ? "text-white/50" : "text-zinc-500"}`}
      >
        {children}
      </span>
    </div>
  );
}

// ==================== HERO ====================

function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.08, 1.3]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-25%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-screen flex items-end overflow-hidden bg-black text-white">
      <motion.div className="absolute inset-0" style={{ y: imageY, scale: imageScale }}>
        <Image
          src={IMG(4)}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-95 object-[68%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/45" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />
      </motion.div>

      <motion.div
        className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-20 pt-40"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        <motion.div
          className="mb-10 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] uppercase tracking-[0.35em] text-white/60"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <span style={{ color: ACID }}>Joe Nimble</span>
          <span className="text-white/30">×</span>
          <span>Anes</span>
          <span className="text-white/30">×</span>
          <span>Pierre Biege</span>
        </motion.div>

        <h1 className="text-[3.4rem] leading-[0.88] sm:text-7xl md:text-8xl lg:text-[8.5rem] font-bold tracking-[-0.03em] max-w-5xl">
          <AnimatedWords text="Social Media," delay={0.35} stagger={0.08} />
          <br />
          <AnimatedWords text="Content &" delay={0.5} stagger={0.08} />
          <br />
          <span style={{ color: ACID }}>
            <AnimatedWords text="Partnerships." delay={0.65} stagger={0.08} />
          </span>
        </h1>

        <motion.p
          className="mt-10 max-w-2xl text-lg md:text-2xl font-light text-white/75 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.1 }}
        >
          Unser Konzept für Joe Nimble. Wir bauen die Marke sichtbar auf — mit einer eigenen
          Bildsprache, verständlicher Wissenschaft und echtem Proof aus dem Laufsport.
        </motion.p>

        <motion.div
          className="mt-14 h-px w-full bg-white/15"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.4, delay: 1.4, ease: EASE }}
          style={{ transformOrigin: "left" }}
        />
        <motion.div
          className="mt-6 grid grid-cols-3 gap-6 max-w-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.6 }}
        >
          {["Brand", "Science", "Proof"].map((p, i) => (
            <div key={p}>
              <div className="text-[11px] tabular-nums text-white/40">{String(i + 1).padStart(2, "0")}</div>
              <div className="text-base md:text-xl font-semibold tracking-tight">{p}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

// ==================== MARQUEE ====================

function Marquee() {
  const items = [
    "Toefreedom",
    "Brand",
    "Science",
    "Proof",
    "Community",
    "UGC",
    "Social Runs",
    "Athleten",
    "Launches",
  ];
  const repeated = [...items, ...items, ...items];
  return (
    <div className="overflow-hidden py-7 bg-black border-y border-white/10">
      <motion.div
        className="flex gap-10 whitespace-nowrap"
        animate={{ x: ["0%", "-33.333%"] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        {repeated.map((item, i) => (
          <span key={i} className="text-2xl md:text-4xl font-bold tracking-tight uppercase text-white/70">
            {item}
            <span className="mx-6" style={{ color: ACID }}>
              ·
            </span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ==================== VISION ====================

function Vision() {
  return (
    <section className="bg-[#F4F2ED] text-zinc-900 py-32 md:py-48 px-6">
      <div className="max-w-6xl mx-auto">
        <FadeUp>
          <Eyebrow>Unsere Vision</Eyebrow>
        </FadeUp>
        <h2 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-[-0.03em] leading-[0.95] max-w-4xl">
          <AnimatedWords text="Eine Marke, die man erkennt, bevor man das Logo sieht." stagger={0.04} />
        </h2>
        <div className="mt-16 grid md:grid-cols-2 gap-12 md:gap-20">
          <FadeUp delay={0.15}>
            <p className="text-xl md:text-2xl font-light leading-relaxed text-zinc-700">
              Wir wollen Joe Nimble als starke, wiedererkennbare und visuell eigenständige Marke
              aufbauen — mit der Kombination aus Wissenschaft, Produktkompetenz und echtem Proof.
            </p>
          </FadeUp>
          <FadeUp delay={0.3}>
            <p className="text-lg font-light leading-relaxed text-zinc-500">
              Das Produkt ist da. Die Haltung dahinter ist da. Was fehlt, ist eine Oberfläche, auf
              der beides jeden Tag sichtbar wird — und eine Community, die das weiterträgt. Genau
              daran arbeiten wir. Unsere Content-Strategie steht auf drei Säulen.
            </p>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

// ==================== DIE DREI SÄULEN ====================

const PILLARS = [
  {
    n: "01",
    key: "Brand",
    icon: Camera,
    title: "Eine Bildsprache, die niemand sonst hat.",
    text: "Starke, hochwertige Bilder und Videos schaffen eine klare visuelle Identität und machen Joe Nimble wiedererkennbar.",
    detail:
      "Ein festes Set aus Licht, Farbe, Bildausschnitt und Typografie. Nicht ein schönes Bild, sondern ein System, das jedes Bild erkennbar macht — auf Instagram, im Shop, im Newsletter, auf der Verpackung.",
    img: IMG(1),
  },
  {
    n: "02",
    key: "Science",
    icon: FlaskConical,
    title: "Wissenschaft, die man in 20 Sekunden versteht.",
    text: "Wissenschaft und Produkttechnologie werden einfach, visuell und verständlich vermittelt – ohne zu technisch zu werden.",
    detail:
      "Toefreedom, der grosse Zeh als natürliche Pronationskontrolle, Zero-Drop statt Carbonplatte: Das sind eure stärksten Argumente und gleichzeitig die, die am seltensten erklärt werden. Wir machen daraus Erklärvideos, Vergleiche und Animationen, die eine Kaufentscheidung tragen.",
    img: IMG(5),
  },
  {
    n: "03",
    key: "Proof",
    icon: Footprints,
    title: "Beweis statt Behauptung.",
    text: "Athleten, Influencer und die Community zeigen Joe Nimble im echten Einsatz. Authentischer Content und UGC schaffen Vertrauen und Glaubwürdigkeit.",
    detail:
      "Ein dreckiger Schuh nach 40 Stunden sagt mehr als jede Produktkachel. Wir holen diesen Beweis dort, wo er entsteht: an Rennen, im Training, bei Leuten, die die Schuhe wirklich tragen.",
    img: IMG(3),
  },
];

function Pillars() {
  return (
    <section className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 pt-32 md:pt-44 pb-16">
        <FadeUp>
          <Eyebrow dark>Drei Säulen</Eyebrow>
        </FadeUp>
        <h2 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-[-0.03em] leading-[0.95] max-w-4xl">
          <AnimatedWords text="Worauf die Strategie steht." stagger={0.05} />
        </h2>
      </div>

      {PILLARS.map((p, i) => (
        <Pillar key={p.key} pillar={p} flip={i % 2 === 1} />
      ))}
    </section>
  );
}

function Pillar({ pillar, flip }: { pillar: (typeof PILLARS)[number]; flip: boolean }) {
  const Icon = pillar.icon;
  return (
    <div className="border-t border-white/10">
      <div
        className={`max-w-7xl mx-auto px-6 py-20 md:py-28 grid md:grid-cols-2 gap-12 md:gap-20 items-center ${
          flip ? "md:[direction:rtl]" : ""
        }`}
      >
        <div className={flip ? "md:[direction:ltr]" : ""}>
          <FadeUp>
            <div className="flex items-baseline gap-5 mb-8">
              <span className="text-6xl md:text-8xl font-bold tabular-nums leading-none" style={{ color: ACID }}>
                {pillar.n}
              </span>
              <span className="text-2xl md:text-3xl font-semibold uppercase tracking-[0.18em] text-white/80">
                {pillar.key}
              </span>
            </div>
          </FadeUp>
          <h3 className="text-3xl md:text-5xl font-bold tracking-[-0.02em] leading-[1.05] mb-8 max-w-xl">
            <AnimatedWords text={pillar.title} stagger={0.035} />
          </h3>
          <FadeUp delay={0.15}>
            <p className="text-lg md:text-xl font-light text-white/75 leading-relaxed max-w-xl">{pillar.text}</p>
          </FadeUp>
          <FadeUp delay={0.25}>
            <div className="mt-8 flex gap-5 max-w-xl">
              <Icon size={22} strokeWidth={1.5} className="shrink-0 mt-1 text-white/30" />
              <p className="text-base font-light text-white/50 leading-relaxed">{pillar.detail}</p>
            </div>
          </FadeUp>
        </div>
        <div className={flip ? "md:[direction:ltr]" : ""}>
          <ParallaxImage src={pillar.img} className="aspect-[4/5] rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// ==================== SOCIAL MEDIA ====================

function SocialMedia() {
  const platforms = [
    {
      Icon: Instagram,
      name: "Instagram",
      claim: "Die visuelle Bühne",
      text: "Instagram wird zur visuellen Plattform für Brand Building, Produkte, Athleten und Community.",
      points: ["Brand- und Produktbilder in eigener Bildsprache", "Athleten und Community im Feed", "Reels aus echten Situationen", "Stories als tägliche Marken-Stimme"],
    },
    {
      Icon: Music2,
      name: "TikTok",
      claim: "Wissen und Unterhaltung",
      text: "TikTok bietet mehr Raum für Wissen und Unterhaltung: Technologien erklären, Schuhe vergleichen, Produkte vorstellen, Fragen beantworten und zeigen, welcher Schuh für welchen Einsatz geeignet ist.",
      points: ["Technologien erklären", "Schuhe direkt vergleichen", "Fragen aus den Kommentaren beantworten", "Welcher Schuh für welchen Einsatz"],
    },
  ];

  const community = [
    "Tägliches Community Management",
    "Umfragen und Feedback aus der Community",
    "Gewinnspiele",
    "Challenges",
    "Gemeinsame Aktivitäten",
  ];

  return (
    <section className="bg-[#F4F2ED] text-zinc-900 py-32 md:py-44 px-6">
      <div className="max-w-7xl mx-auto">
        <FadeUp>
          <Eyebrow>Social Media</Eyebrow>
        </FadeUp>
        <h2 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-[-0.03em] leading-[0.95] max-w-4xl mb-20">
          <AnimatedWords text="Zwei Plattformen, zwei Aufgaben." stagger={0.05} />
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {platforms.map(({ Icon, name, claim, text, points }, i) => (
            <FadeUp key={name} delay={i * 0.12}>
              <div className="h-full bg-white rounded-2xl p-9 md:p-12 border border-zinc-200/70">
                <Icon size={30} strokeWidth={1.5} className="text-zinc-900 mb-8" />
                <div className="text-[11px] uppercase tracking-[0.3em] text-zinc-400 mb-3">{claim}</div>
                <h3 className="text-3xl md:text-4xl font-bold tracking-tight mb-5">{name}</h3>
                <p className="text-lg font-light text-zinc-600 leading-relaxed">{text}</p>
                <ul className="mt-8 space-y-3">
                  {points.map((p) => (
                    <li key={p} className="flex items-start gap-3 text-zinc-700">
                      <span
                        className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: ACID }}
                      />
                      <span className="font-light">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeUp>
          ))}
        </div>

        <FadeUp delay={0.2}>
          <div className="mt-6 bg-zinc-900 text-white rounded-2xl p-9 md:p-12">
            <div className="flex flex-col md:flex-row md:items-start gap-10 md:gap-16">
              <div className="md:w-2/5">
                <MessageCircle size={30} strokeWidth={1.5} className="mb-6" style={{ color: ACID }} />
                <h3 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Community</h3>
                <p className="text-lg font-light text-white/65 leading-relaxed">
                  Gleichzeitig bauen wir eine aktive Community auf. Nicht als Kampagne, sondern als
                  Dauerbetrieb.
                </p>
              </div>
              <ul className="md:w-3/5 grid sm:grid-cols-2 gap-x-8 gap-y-4 self-center">
                {community.map((c) => (
                  <li key={c} className="flex items-start gap-3">
                    <span className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: ACID }} />
                    <span className="font-light text-white/85">{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ==================== ATHLETEN & UGC ====================

function Athletes() {
  return (
    <section className="relative bg-black text-white py-32 md:py-48 px-6 overflow-hidden">
      <div className="absolute inset-0">
        <Image src={IMG(14)} alt="" fill sizes="100vw" className="object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/75 to-black" />
      </div>
      <div className="relative z-10 max-w-5xl mx-auto">
        <FadeUp>
          <Eyebrow dark>Athleten, Influencer & UGC</Eyebrow>
        </FadeUp>
        <ScrollRevealText
          text="Wir bauen ein kleines, relevantes Athleten- und Influencer-Netzwerk auf. Dabei geht es nicht nur um Reichweite, sondern vor allem um authentischen Content, Produkt-Proof und eine stärkere Verbindung zur Zielgruppe."
          className="text-2xl md:text-4xl lg:text-5xl font-semibold tracking-[-0.02em] leading-[1.25]"
        />
        <FadeUp delay={0.2}>
          <p className="mt-14 text-lg md:text-xl font-light text-white/55 leading-relaxed max-w-3xl">
            Lieber zehn Leute, die den Schuh wirklich tragen, als hundert, die ihn einmal in die
            Kamera halten. UGC wird dabei zu einem wichtigen Bestandteil der Markenkommunikation —
            und zu einem Content-Fundus, der euch dauerhaft gehört.
          </p>
        </FadeUp>
      </div>
    </section>
  );
}

// ==================== LAUNCHES & EXPERIENCES ====================

function Launches() {
  const formats = [
    { t: "Social Runs", d: "Gemeinsame Läufe mit Community und Athleten. Erlebnis und Content im selben Termin." },
    { t: "Test & Try Events", d: "Leute laufen den Schuh, statt ihn nur anzuschauen. Die stärkste Conversion, die es gibt." },
    { t: "Running Club Kooperationen", d: "Bestehende Lauf-Crews als Multiplikatoren — mit ihrem eigenen Publikum." },
    { t: "Community Events", d: "Wiederkehrende Termine, die zur Marke gehören und nicht zur Kampagne." },
    { t: "Brand Collaborations", d: "Partner, deren Publikum zu Joe Nimble passt — gemeinsam sichtbar." },
  ];
  return (
    <section className="bg-[#F4F2ED] text-zinc-900 py-32 md:py-44 px-6">
      <div className="max-w-7xl mx-auto">
        <FadeUp>
          <Eyebrow>Launches & Community Experiences</Eyebrow>
        </FadeUp>
        <h2 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-[-0.03em] leading-[0.95] max-w-4xl">
          <AnimatedWords text="Ein Launch ist ein Termin, kein Post." stagger={0.045} />
        </h2>
        <FadeUp delay={0.15}>
          <p className="mt-10 text-xl md:text-2xl font-light text-zinc-600 leading-relaxed max-w-3xl">
            Neue Produkte und Drops werden gemeinsam mit Athleten, Influencern und der Community
            aktiviert. So entstehen gleichzeitig Erlebnis, Content, UGC und Brand Awareness.
          </p>
        </FadeUp>

        <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-300 rounded-2xl overflow-hidden">
          {formats.map((f, i) => (
            <FadeUp key={f.t} delay={0.1 + i * 0.07}>
              <div className="h-full bg-[#F4F2ED] p-9 md:p-11 hover:bg-white transition-colors duration-500">
                <div className="text-sm tabular-nums mb-6 font-semibold" style={{ color: "#93a300" }}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="text-2xl font-bold tracking-tight mb-4">{f.t}</h3>
                <p className="font-light text-zinc-600 leading-relaxed">{f.d}</p>
              </div>
            </FadeUp>
          ))}
          <div className="hidden lg:block bg-[#F4F2ED]" />
        </div>
      </div>
    </section>
  );
}

// ==================== WAS WIR ÜBERNEHMEN ====================

function Scope() {
  const items = [
    "Content Creation",
    "Social Media Management & Community Management",
    "Aufbau und Betreuung eines Athleten-/Influencer-Netzwerks",
    "UGC-Strategie und Content-Gewinnung",
    "Kampagnen & Produktlaunches",
    "Events & Community Activations",
    "Zusammenarbeit mit E-Commerce, Website & Newsletter",
    "SEO / SEA",
    "META Paid Social (optional)",
    "Analyse, Reporting & laufende Optimierung",
    "Evaluation weiterer Plattformen und Möglichkeiten",
  ];
  return (
    <section className="bg-black text-white py-32 md:py-44 px-6">
      <div className="max-w-6xl mx-auto">
        <FadeUp>
          <Eyebrow dark>Was wir übernehmen</Eyebrow>
        </FadeUp>
        <h2 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-[-0.03em] leading-[0.95] mb-16 max-w-4xl">
          <AnimatedWords text="Alles, was zwischen Produkt und Publikum liegt." stagger={0.04} />
        </h2>
        <ul className="border-t border-white/12">
          {items.map((item, i) => (
            <FadeUp key={item} delay={Math.min(i, 6) * 0.05} y={20}>
              <motion.li
                className="border-b border-white/12 py-6 md:py-7 flex items-baseline gap-6 md:gap-10"
                whileHover={{ x: 8 }}
                transition={{ duration: 0.35, ease: EASE }}
              >
                <span className="text-sm tabular-nums shrink-0 w-8 text-white/35">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-xl md:text-3xl font-light tracking-tight">{item}</span>
              </motion.li>
            </FadeUp>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ==================== BILDER & VIDEOS ====================

function Material() {
  const kinds = [
    { Icon: Camera, t: "Branding Bilder", d: "Produkt, Detail, Situation. Bilder, die nicht nach Katalog aussehen und trotzdem den Schuh verkaufen." },
    { Icon: Video, t: "Lauf Videos", d: "Bewegtbild aus dem echten Einsatz — Trail, Strasse, Nacht, Rennen. Für Reels, Shorts und Ads." },
    { Icon: FlaskConical, t: "Erklär Video", d: "Science-basiert: Toefreedom, grosser Zeh, Zero-Drop. Verständlich in unter einer Minute." },
  ];
  return (
    <section className="bg-[#F4F2ED] text-zinc-900 py-32 md:py-44 px-6">
      <div className="max-w-7xl mx-auto">
        <FadeUp>
          <Eyebrow>Deine Bilder und Videos</Eyebrow>
        </FadeUp>
        <h2 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-[-0.03em] leading-[0.95] max-w-4xl">
          <AnimatedWords text="Material, das euch gehört." stagger={0.05} />
        </h2>
        <FadeUp delay={0.15}>
          <p className="mt-10 text-xl md:text-2xl font-light text-zinc-600 leading-relaxed max-w-3xl">
            Wir produzieren selbst. Die Bilder auf dieser Seite sind in den letzten Monaten
            entstanden — an Rennen, im Camp und in Albinen, alle mit Joe Nimble an den Füssen. So
            sieht die Grundlage aus, auf der wir aufbauen.
          </p>
        </FadeUp>

        <div className="mt-16 grid md:grid-cols-3 gap-6">
          {kinds.map(({ Icon, t, d }, i) => (
            <FadeUp key={t} delay={0.1 + i * 0.1}>
              <div className="h-full bg-white rounded-2xl p-9 border border-zinc-200/70">
                <Icon size={26} strokeWidth={1.5} className="mb-6 text-zinc-900" />
                <h3 className="text-2xl font-bold tracking-tight mb-3">{t}</h3>
                <p className="font-light text-zinc-600 leading-relaxed">{d}</p>
              </div>
            </FadeUp>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-12 gap-4 md:gap-6">
          <ParallaxImage src={IMG(1)} className="col-span-12 md:col-span-7 aspect-[4/3] rounded-2xl" />
          <ParallaxImage src={IMG(13)} className="col-span-12 md:col-span-5 aspect-[4/5] rounded-2xl" />
          <ParallaxImage src={IMG(2)} className="col-span-6 md:col-span-4 aspect-square rounded-2xl" />
          <ParallaxImage src={IMG(11)} className="col-span-6 md:col-span-4 aspect-square rounded-2xl" />
          <ParallaxImage src={IMG(14)} className="col-span-12 md:col-span-4 aspect-square rounded-2xl" />
          <ParallaxImage src={IMG(7)} className="col-span-12 aspect-[16/7] rounded-2xl" />
        </div>
      </div>
    </section>
  );
}

function Drift() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], ["8%", "-38%"]);
  const images = [IMG(3), IMG(5), IMG(8), IMG(9), IMG(10), IMG(11), IMG(14)];
  return (
    <section ref={ref} className="bg-[#F4F2ED] pb-32 md:pb-44 overflow-hidden">
      <motion.div className="flex gap-5 md:gap-6 px-6 will-change-transform" style={{ x }}>
        {images.map((src, i) => (
          <motion.div
            key={i}
            className="relative shrink-0 w-[72vw] md:w-[42vw] lg:w-[32vw] aspect-[4/5] rounded-2xl overflow-hidden bg-zinc-200"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.9, ease: EASE, delay: i * 0.04 }}
          >
            <Image src={src} alt="" fill sizes="(max-width: 768px) 72vw, 32vw" className="object-cover" />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

// ==================== UNSER ANSATZ ====================

function Approach() {
  const phases = [
    {
      n: "01",
      t: "Identität",
      d: "Zuerst schaffen wir eine klare visuelle Identität und Positionierung. Bildsprache, Tonalität, Formate, Kanalrollen — festgelegt und dokumentiert, damit jeder Post danach dieselbe Marke zeigt.",
    },
    {
      n: "02",
      t: "Aufbau",
      d: "Danach bauen wir Community, Athleten, UGC und relevante Formate auf. Täglicher Betrieb statt Kampagnenlogik: Posten, antworten, testen, dokumentieren.",
    },
    {
      n: "03",
      t: "Skalieren",
      d: "Und dann skalieren wir, was funktioniert. Reporting zeigt, welche Formate tragen — dort geht Budget und Produktion hin, der Rest fällt raus.",
    },
  ];
  return (
    <section className="bg-black text-white py-32 md:py-44 px-6">
      <div className="max-w-7xl mx-auto">
        <FadeUp>
          <Eyebrow dark>Unser Ansatz</Eyebrow>
        </FadeUp>
        <h2 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-[-0.03em] leading-[0.95] max-w-4xl">
          <AnimatedWords text="Keine Kampagne. Eine Plattform." stagger={0.05} />
        </h2>
        <FadeUp delay={0.15}>
          <p className="mt-10 text-xl md:text-2xl font-light text-white/65 leading-relaxed max-w-3xl">
            Wir wollen keine kurzfristige Social-Media-Kampagne, sondern eine Plattform schaffen, auf
            der Joe Nimble langfristig wachsen kann.
          </p>
        </FadeUp>

        <div className="mt-20 grid md:grid-cols-3 gap-px bg-white/12 rounded-2xl overflow-hidden">
          {phases.map((p, i) => (
            <FadeUp key={p.n} delay={0.1 + i * 0.1}>
              <div className="h-full bg-black p-9 md:p-12">
                <div className="text-5xl md:text-6xl font-bold tabular-nums mb-8" style={{ color: ACID }}>
                  {p.n}
                </div>
                <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-5">{p.t}</h3>
                <p className="font-light text-white/60 leading-relaxed">{p.d}</p>
              </div>
            </FadeUp>
          ))}
        </div>

        <FadeUp delay={0.3}>
          <p className="mt-24 text-center text-3xl md:text-6xl font-bold tracking-[-0.03em] leading-[1.1]">
            Build the identity.
            <br />
            Create the proof.
            <br />
            <span style={{ color: ACID }}>Grow the community.</span>
          </p>
        </FadeUp>
      </div>
    </section>
  );
}

// ==================== ÜBER UNS ====================

function AboutUs() {
  const people = [
    {
      name: "Anes",
      role: "Social Media & Community",
      text: "Anes verantwortet Social Media und Community Management: den täglichen Betrieb der Kanäle, den Aufbau des Athleten- und Influencer-Netzwerks und die Events, aus denen Erlebnis und Content gleichzeitig entstehen.",
      tasks: ["Social Media Management", "Community Management", "Athleten & Influencer", "Events & Activations"],
    },
    {
      name: "Pierre Biege",
      role: "Content & Produktion",
      text: "Pierre ist Ultraläufer und Content Creator aus dem Wallis — Backyard-Ultras über 200 Kilometer, oft über 40 Stunden am Stück. Er läuft seit über zwölf Jahren in Joe Nimble und produziert Bild, Video und Text selbst. Kein gekaufter Athlet, der ein Produkt hochhält.",
      tasks: ["Foto & Video", "Schnitt und Animation", "Formate & Redaktion", "Reichweite als Athlet"],
    },
  ];
  return (
    <section className="bg-[#F4F2ED] text-zinc-900 py-32 md:py-44 px-6">
      <div className="max-w-7xl mx-auto">
        <FadeUp>
          <Eyebrow>Über uns</Eyebrow>
        </FadeUp>
        <h2 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-[-0.03em] leading-[0.95] max-w-4xl mb-16">
          <AnimatedWords text="Zwei Leute, die das selbst machen." stagger={0.05} />
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {people.map((p, i) => (
            <FadeUp key={p.name} delay={i * 0.12}>
              <div className="h-full bg-white rounded-2xl border border-zinc-200/70 p-9 md:p-12 flex flex-col">
                <div className="text-[11px] uppercase tracking-[0.3em] text-zinc-400 mb-4">{p.role}</div>
                <h3 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">{p.name}</h3>
                <p className="font-light text-zinc-600 leading-relaxed">{p.text}</p>
                <ul className="mt-auto pt-8 border-t border-zinc-200 flex flex-wrap gap-x-3 gap-y-2">
                  {p.tasks.map((t) => (
                    <li
                      key={t}
                      className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-light text-zinc-600"
                    >
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeUp>
          ))}
        </div>

        <FadeUp delay={0.2}>
          <div className="mt-6 bg-zinc-900 text-white rounded-2xl p-9 md:p-14">
            <div className="text-[11px] uppercase tracking-[0.3em] text-white/40 mb-10">
              Pierres Reichweite · Stand heute
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
              {[
                { v: "12 Mio.", l: "Aufrufe · 90 Tage · alle Kanäle" },
                { v: "2,2 Mio.", l: "Aufrufe · 30 Tage" },
                { v: "794k", l: "aktive Konten erreicht" },
                { v: "12 Jahre", l: "in Joe Nimble unterwegs" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="text-3xl md:text-5xl font-bold tracking-tight tabular-nums mb-3">{s.v}</div>
                  <div className="text-sm font-light text-white/50 leading-snug">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ==================== KONTAKT ====================

function Contact() {
  return (
    <section className="relative bg-black text-white px-6 py-36 md:py-48 overflow-hidden">
      <div className="absolute inset-0">
        <Image src={IMG(9)} alt="" fill sizes="100vw" className="object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black" />
      </div>
      <div className="relative z-10 max-w-5xl mx-auto text-center">
        <h2 className="text-5xl sm:text-7xl md:text-[9rem] font-bold tracking-[-0.04em] leading-[0.88]">
          <AnimatedWords text="Reden wir." stagger={0.09} />
        </h2>
        <FadeUp delay={0.35}>
          <p className="mt-10 text-lg md:text-2xl font-light text-white/65 max-w-2xl mx-auto leading-relaxed">
            Das Konzept steht. Was jetzt fehlt, ist ein Gespräch über Umfang, Zeitplan und Budget.
          </p>
        </FadeUp>

        <FadeUp delay={0.5}>
          <div className="mt-16 grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto text-left">
            <div className="rounded-2xl border border-white/15 p-8">
              <div className="text-[11px] uppercase tracking-[0.3em] text-white/40 mb-3">
                Social Media & Community
              </div>
              <div className="text-2xl font-semibold mb-5">Anes</div>
              <a
                href="mailto:anes@casaofsport.ch"
                className="flex items-center gap-3 text-white/75 hover:text-white transition-colors mb-2"
              >
                <Mail size={17} /> anes@casaofsport.ch
              </a>
              <a
                href="tel:+41764181028"
                className="flex items-center gap-3 text-white/75 hover:text-white transition-colors"
              >
                <Phone size={17} /> +41 76 418 10 28
              </a>
            </div>
            <div className="rounded-2xl border border-white/15 p-8">
              <div className="text-[11px] uppercase tracking-[0.3em] text-white/40 mb-3">Content & Produktion</div>
              <div className="text-2xl font-semibold mb-5">Pierre Biege</div>
              <a
                href="mailto:pierre@laeuft.ch"
                className="flex items-center gap-3 text-white/75 hover:text-white transition-colors mb-2"
              >
                <Mail size={17} /> pierre@laeuft.ch
              </a>
              <a
                href="tel:+41798533672"
                className="flex items-center gap-3 text-white/75 hover:text-white transition-colors"
              >
                <Phone size={17} /> +41 79 853 36 72
              </a>
            </div>
          </div>
        </FadeUp>

        <FadeUp delay={0.7}>
          <div className="mt-24 flex flex-col items-center gap-4">
            <Users size={20} className="text-white/25" strokeWidth={1.5} />
            <div className="text-[11px] uppercase tracking-[0.35em] text-white/30">
              Internes Konzept · nicht öffentlich teilen
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ==================== PAGE ====================

export default function JoeNimbleSocialPage() {
  return (
    <div className="font-sans antialiased bg-black">
      <Hero />
      <Marquee />
      <Vision />
      <Pillars />
      <SocialMedia />
      <Athletes />
      <Launches />
      <Scope />
      <Material />
      <Drift />
      <Approach />
      <AboutUs />
      <Contact />
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform, useInView, AnimatePresence, type MotionValue } from "framer-motion";
import {
  FileSearch,
  Phone,
  Brain,
  TrendingUp,
  Workflow,
  ArrowRight,
  Mail,
  Check,
  Shield,
  Zap,
  MapPin,
  Plus,
  Minus,
} from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

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
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} className="relative h-screen flex items-center justify-center overflow-hidden bg-black text-white">
      {/* Animated gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.15),_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(168,85,247,0.1),_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(34,197,94,0.08),_transparent_50%)]" />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <motion.div className="relative z-10 max-w-6xl mx-auto px-6 text-center" style={{ y: contentY, opacity: contentOpacity }}>
        <motion.div
          className="inline-flex items-center gap-2 mb-10 px-5 py-2 border border-white/15 rounded-full text-xs uppercase tracking-[0.4em] text-white/70 backdrop-blur-sm bg-white/5"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          läuft.ch · AI · 2026
        </motion.div>

        <h1 className="text-5xl md:text-7xl lg:text-[8rem] font-bold tracking-tight leading-[0.95] mb-8">
          <AnimatedWords text="Wir bauen KI," delay={0.4} stagger={0.06} />
          <br />
          <AnimatedWords text="die hunderte Stunden spart." delay={0.7} stagger={0.06} />
        </h1>

        <motion.p
          className="text-xl md:text-2xl text-white/70 font-light tracking-wide max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.4 }}
        >
          Code statt Slides. Live in 4 Wochen. Für Schweizer KMU.
        </motion.p>

        <motion.div
          className="mt-14 flex flex-wrap items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.7 }}
        >
          <a
            href="#kontakt"
            className="px-8 py-4 bg-white text-black rounded-full font-semibold text-base hover:bg-white/90 transition-colors flex items-center gap-2 group"
          >
            Kostenloses Erstgespräch
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </a>
          <a
            href="#pakete"
            className="px-8 py-4 border border-white/20 text-white rounded-full font-semibold text-base hover:bg-white/10 transition-colors"
          >
            Pakete ansehen
          </a>
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute left-1/2 -translate-x-1/2 bottom-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2.2 }}
      >
        <motion.div
          className="w-px h-16 bg-white/30"
          animate={{ scaleY: [0, 1, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "top" }}
        />
      </motion.div>
    </section>
  );
}

function PainPoints() {
  const pains = [
    { q: "Belege, Verträge, Anträge — alles manuell?", a: "Wir automatisieren es." },
    { q: "Telefon klingelt während du arbeitest?", a: "Ein Voice Agent nimmt ab." },
    { q: "Wissen verteilt auf 5 verschiedene Tools?", a: "Ein Bot, der alles weiss." },
  ];
  return (
    <section className="bg-black text-white py-32 px-6 overflow-hidden border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <FadeUp>
          <div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-12 text-center">Kommt dir bekannt vor?</div>
        </FadeUp>
        <div className="grid md:grid-cols-3 gap-6">
          {pains.map((p, i) => (
            <FadeUp key={i} delay={0.15 + i * 0.1}>
              <div className="bg-zinc-950 border border-white/10 rounded-3xl p-8 h-full">
                <p className="text-xl md:text-2xl font-semibold leading-snug mb-4">{p.q}</p>
                <p className="text-white/60 text-base">{p.a}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

function Marquee() {
  const items = [
    "AI Audit",
    "Voice Agents",
    "Custom GPT",
    "Workflow Automation",
    "Sales AI",
    "Wissens-Bots",
    "CH-Hosted",
    "DSGVO",
    "Vor Ort",
  ];
  const repeated = [...items, ...items, ...items];
  return (
    <div className="overflow-hidden py-8 border-y border-white/10 bg-black">
      <motion.div
        className="flex gap-12 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        {repeated.map((item, i) => (
          <span key={i} className="text-3xl md:text-5xl font-bold tracking-tight uppercase text-white/70">
            {item} <span className="text-white/20 mx-4">·</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

function ProblemStatement() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "end 0.5"] });
  const statements = [
    "Tausend KI-Tools.",
    "Zehn Berater.",
    "Hundert LinkedIn-Posts.",
    "Und du fragst dich:",
    "Was bringt mich konkret weiter?",
    "Du brauchst keinen weiteren Workshop.",
    "Du brauchst keine Strategie auf 60 Slides.",
    "Du brauchst jemanden, der baut.",
    "Etwas, das morgen läuft.",
    "Etwas, das deinem Team hilft.",
    "Etwas, das sich rechnet.",
    "Genau dafür sind wir da.",
  ];
  const allWords = statements.join(" ").split(" ");
  const total = allWords.length;
  return (
    <section ref={ref} className="bg-white text-zinc-900 py-40 px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <p className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.15]">
          {allWords.map((word, i) => {
            const start = i / total;
            const end = start + 1 / total;
            return <RevealWord key={i} progress={scrollYProgress} range={[start, end]}>{word}</RevealWord>;
          })}
        </p>
      </div>
    </section>
  );
}

function Manifesto() {
  return (
    <section className="bg-black text-white py-48 px-6 overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <FadeUp>
          <div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-12 text-center">Was wir machen</div>
        </FadeUp>
        <ScrollRevealText
          text="Wir bringen AI in Schweizer Unternehmen. Nicht als Slide, nicht als Workshop ohne Konsequenzen. Sondern als Lösung, die nach vier Wochen läuft, Stunden spart und sich rechnet. Lokal. Konkret. Ohne Bullshit."
          className="text-2xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.25] text-white text-center"
        />
      </div>
    </section>
  );
}

function UseCases() {
  const cases = [
    {
      icon: FileSearch,
      title: "Dokumenten-Automatisierung",
      text: "Belege, Verträge, Anträge. AI liest, sortiert, verarbeitet – du prüfst nur noch.",
      example: "Treuhand · Anwalt · Versicherung",
    },
    {
      icon: Phone,
      title: "Voice Agents",
      text: "AI nimmt Anrufe entgegen, qualifiziert Leads, bucht Termine – 24/7, mehrsprachig.",
      example: "Praxis · Hotel · Service",
    },
    {
      icon: Brain,
      title: "Wissens-Bots (Custom GPT)",
      text: "Dein Firmenwissen, jederzeit abrufbar. Mitarbeiter fragen, AI antwortet aus deinen Dokumenten.",
      example: "Industrie · KMU · Schule",
    },
    {
      icon: TrendingUp,
      title: "Sales & Marketing AI",
      text: "Lead-Recherche, Personalisierung, Follow-Ups. AI macht 80% der Outreach-Arbeit.",
      example: "B2B · Agentur · SaaS",
    },
    {
      icon: Workflow,
      title: "Workflow Automation",
      text: "Daten zwischen Tools, Triggers, Reports. AI verbindet alles, was bisher manuell lief.",
      example: "ERP · CRM · Buchhaltung",
    },
  ];

  return (
    <section className="bg-zinc-950 text-white py-40 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <FadeUp>
          <div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Was wir liefern</div>
        </FadeUp>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-10 leading-[0.9]">
          <AnimatedWords text="Fünf Use-Cases." stagger={0.06} />
        </h2>
        <FadeUp delay={0.3}>
          <p className="text-lg md:text-2xl text-white/60 font-light leading-relaxed max-w-3xl mb-20">
            Wir bauen keine generischen "AI-Strategien". Wir liefern konkrete Lösungen aus diesen fünf Familien – passend zu deinem Schmerz.
          </p>
        </FadeUp>
        <div className="grid md:grid-cols-2 gap-px bg-white/10 rounded-3xl overflow-hidden">
          {cases.map(({ icon: Icon, title, text, example }, i) => (
            <FadeUp key={i} delay={0.15 + i * 0.08}>
              <div className="bg-zinc-950 p-10 h-full hover:bg-zinc-900 transition-colors group cursor-default">
                <Icon size={36} className="text-white/80 mb-6 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                <h3 className="text-2xl md:text-3xl font-semibold mb-3">{title}</h3>
                <p className="text-white/60 leading-relaxed mb-5">{text}</p>
                <div className="text-xs uppercase tracking-wider text-white/40">{example}</div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Erstgespräch",
      duration: "30 Minuten · kostenlos",
      text: "Wir reden 30 Minuten. Du erzählst, was bei dir manuell läuft. Ich sage dir, ob AI hilft – und wenn ja, welche.",
    },
    {
      number: "02",
      title: "AI Audit",
      duration: "1 Tag vor Ort · CHF 4'500",
      text: "Ich komme zu dir, schaue mir deine Prozesse an, spreche mit deinem Team. Du bekommst einen Report mit 5 priorisierten Use-Cases inkl. ROI-Schätzung.",
    },
    {
      number: "03",
      title: "AI Sprint",
      duration: "4 Wochen · ab CHF 18'000",
      text: "Wir bauen einen Use-Case end-to-end. Custom wo nötig, Tools wo möglich. Hosting in der Schweiz. Nach 4 Wochen läuft es bei dir live.",
    },
    {
      number: "04",
      title: "AI Champion",
      duration: "Optional · ab CHF 2'500/Monat",
      text: "Wir bleiben dran. Neue Use-Cases, Erweiterungen, Updates. Direkter Slack-Kontakt. Du wirst Schritt für Schritt zum AI-Champion deiner Branche.",
    },
  ];
  return (
    <section className="bg-zinc-950 text-white py-40 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <FadeUp>
          <div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">So funktioniert's</div>
        </FadeUp>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-10 leading-[0.9]">
          <AnimatedWords text="Vom Gespräch zum Live-System." stagger={0.05} />
        </h2>
        <FadeUp delay={0.3}>
          <p className="text-lg md:text-2xl text-white/60 font-light leading-relaxed max-w-3xl mb-20">
            Vier klare Schritte. Du kannst nach jedem stoppen. Kein Vertrag der dich bindet, kein Lock-in.
          </p>
        </FadeUp>
        <div className="space-y-px bg-white/10 rounded-3xl overflow-hidden">
          {steps.map((s, i) => (
            <FadeUp key={i} delay={0.15 + i * 0.1}>
              <div className="bg-zinc-950 px-8 py-10 md:px-12 md:py-12 hover:bg-zinc-900 transition-colors">
                <div className="grid md:grid-cols-[120px_1fr_auto] gap-6 md:gap-12 items-start">
                  <div className="text-5xl md:text-7xl font-bold text-white/20 tabular-nums leading-none">{s.number}</div>
                  <div>
                    <h3 className="text-2xl md:text-4xl font-bold mb-3">{s.title}</h3>
                    <p className="text-white/60 text-lg leading-relaxed">{s.text}</p>
                  </div>
                  <div className="text-sm uppercase tracking-wider text-white/50 md:text-right md:max-w-[180px]">
                    {s.duration}
                  </div>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    {
      q: "Was kostet ein typisches Projekt am Ende wirklich?",
      a: "Audit CHF 4'500. Ein Sprint 18'000–28'000 je nach Komplexität. Optional Champion-Retainer ab 2'500/Monat. Keine versteckten Kosten, keine Stundenabrechnung. Du weißt vorher genau was du zahlst.",
    },
    {
      q: "Wir haben schon ChatGPT/Copilot. Was bringt mir das?",
      a: "ChatGPT ist ein Chat. Wir bauen Lösungen die in deine Prozesse eingebettet sind: Belege werden automatisch verarbeitet während du schläfst. Anrufe werden 24/7 entgegengenommen. Wissen aus deinen Dokumenten ist sofort abrufbar. Das ersetzt nicht ChatGPT — es nutzt die Modelle dahinter, aber ohne dass jemand bei euch tippen muss.",
    },
    {
      q: "Was passiert mit unseren Daten? DSGVO?",
      a: "Wir hosten in der Schweiz. Wir nutzen wo immer möglich europäische oder selbst-gehostete Modelle. Wo OpenAI/Anthropic eingesetzt wird, immer mit Zero-Retention-API. FINMA-tauglich für regulierte Branchen. Du bekommst eine schriftliche Datenschutz-Übersicht im Audit.",
    },
    {
      q: "Was wenn die AI Fehler macht?",
      a: "Macht sie. Deshalb bauen wir Systeme so, dass Menschen Edge-Cases prüfen — nicht 100% der Fälle. Bei kritischen Prozessen (Buchhaltung, Recht) ist immer ein Human-in-the-Loop. Du sparst 80% der Zeit, die anderen 20% kontrollierst du. Das ist sicherer als 100% manuell, weil Menschen auch Fehler machen.",
    },
    {
      q: "Wie lange dauert es bis ich Resultate sehe?",
      a: "Audit-Resultate: nach 1 Tag. Erste Sprint-Implementation live: nach 4 Wochen. Erste messbare Zeitersparnis: ab Woche 5. Payback typischerweise nach 5–9 Monaten je nach Use-Case.",
    },
    {
      q: "Ich bin keine grosse Firma. Lohnt sich das überhaupt?",
      a: "Gerade dann. Grosse Firmen haben IT-Abteilungen — die machen das selbst. KMU haben den größten Hebel pro investiertem Franken, weil eine einzige Automatisierung oft eine ganze Mitarbeiter-Stelle entlastet. Unsere besten Kunden sind 10–80 Personen.",
    },
    {
      q: "Was unterscheidet euch von anderen AI-Beratern?",
      a: "Wir bauen selbst. Wir liefern Code, nicht PowerPoints. Kein Junior, kein Projektmanager dazwischen — du redest immer mit Pierre. Wir sind Schweizer mit Schweizer Hosting. Und wir zeigen unsere Preise offen.",
    },
    {
      q: "Was wenn ich nach dem Audit nicht weitermache?",
      a: "Dann hast du für CHF 4'500 einen Report mit konkreten Use-Cases bekommen den du selbst oder mit anderen umsetzen kannst. Kein Druck. Wir empfehlen den Sprint nur wenn er klar Sinn macht.",
    },
  ];
  return (
    <section className="bg-white text-zinc-900 py-40 px-6 overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <FadeUp>
          <div className="text-xs uppercase tracking-[0.4em] text-zinc-400 mb-6">Häufige Fragen</div>
        </FadeUp>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-20 leading-[0.9]">
          <AnimatedWords text="Antworten." stagger={0.08} />
        </h2>
        <div className="divide-y divide-zinc-200">
          {faqs.map((f, i) => (
            <FAQItem key={i} q={f.q} a={f.a} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="py-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between gap-6 text-left group"
      >
        <span className="text-xl md:text-2xl font-semibold text-zinc-900 group-hover:text-black transition-colors">{q}</span>
        <span className="shrink-0 mt-1 w-9 h-9 rounded-full border border-zinc-300 flex items-center justify-center text-zinc-500 group-hover:border-zinc-900 group-hover:text-zinc-900 transition-colors">
          {open ? <Minus size={16} /> : <Plus size={16} />}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="overflow-hidden"
          >
            <p className="pt-4 pr-12 text-lg text-zinc-600 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Packages() {
  const pkgs = [
    {
      name: "AI Audit",
      eyebrow: "Start hier",
      duration: "1 Tag vor Ort + 1 Tag Analyse",
      price: "CHF 4'500",
      highlight: false,
      features: [
        "Vor-Ort Workshop mit deinem Team",
        "5 konkrete AI-Use-Cases identifiziert",
        "Priorisierung nach ROI und Aufwand",
        "Implementierungsplan & Tool-Empfehlungen",
        "Schriftlicher Report",
      ],
      cta: "Audit buchen",
    },
    {
      name: "AI Sprint",
      eyebrow: "Hauptprodukt",
      duration: "4 Wochen, 1 Use-Case live",
      price: "ab CHF 18'000",
      highlight: true,
      features: [
        "Ein konkreter Use-Case end-to-end implementiert",
        "Custom-Build wo nötig, Tools wo möglich",
        "Schweiz-konformes Hosting (DSGVO, FINMA-ready)",
        "Onboarding deines Teams",
        "30 Tage Garantie nach Go-Live",
        "Dokumentation und Übergabe",
      ],
      cta: "Sprint starten",
    },
    {
      name: "AI Champion",
      eyebrow: "Recurring",
      duration: "Ab CHF 2'500 / Monat",
      price: "Retainer",
      highlight: false,
      features: [
        "1 Tag Support pro Monat",
        "Neue Use-Cases & Erweiterungen",
        "Team-Workshops bei Bedarf",
        "Updates und Wartung",
        "Direkter Slack/WhatsApp-Kontakt",
      ],
      cta: "Anfrage stellen",
    },
  ];

  return (
    <section id="pakete" className="bg-black text-white py-40 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <FadeUp>
          <div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Pakete & Preise</div>
        </FadeUp>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-10 leading-[0.9]">
          <AnimatedWords text="Drei Wege rein." stagger={0.06} />
        </h2>
        <FadeUp delay={0.3}>
          <p className="text-lg md:text-2xl text-white/60 font-light leading-relaxed max-w-3xl mb-20">
            Klar definierte Pakete, transparente Preise. Keine versteckten Kosten, kein "auf Anfrage", keine Slides die nichts liefern.
          </p>
        </FadeUp>

        <div className="grid md:grid-cols-3 gap-6">
          {pkgs.map((p, i) => (
            <FadeUp key={i} delay={0.2 + i * 0.15}>
              <div
                className={`relative h-full rounded-3xl p-8 md:p-10 flex flex-col ${
                  p.highlight ? "bg-white text-black" : "bg-zinc-950 border border-white/10 text-white"
                }`}
              >
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-black text-white text-xs uppercase tracking-wider rounded-full">
                    Beliebt
                  </div>
                )}
                <div className={`text-xs uppercase tracking-[0.3em] mb-4 ${p.highlight ? "text-black/50" : "text-white/40"}`}>
                  {p.eyebrow}
                </div>
                <h3 className="text-3xl md:text-4xl font-bold mb-2">{p.name}</h3>
                <p className={`text-sm mb-8 ${p.highlight ? "text-black/60" : "text-white/50"}`}>{p.duration}</p>
                <div className="text-4xl md:text-5xl font-bold tabular-nums mb-8">{p.price}</div>
                <ul className="space-y-3 mb-10 flex-1">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm">
                      <Check size={16} className={`shrink-0 mt-1 ${p.highlight ? "text-black/70" : "text-white/50"}`} />
                      <span className={p.highlight ? "text-black/80" : "text-white/70"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="#kontakt"
                  className={`block text-center py-4 rounded-full font-semibold transition-colors ${
                    p.highlight ? "bg-black text-white hover:bg-zinc-800" : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {p.cta}
                </a>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyCH() {
  const points = [
    { Icon: MapPin, title: "Vor Ort", text: "Workshops und Implementierung persönlich – Wallis, Bern, Zürich, Basel." },
    { Icon: Shield, title: "CH-Datenschutz", text: "Schweizer Server, FINMA-ready, kein US-Vendor-Lock-in." },
    { Icon: Zap, title: "Wir bauen selbst", text: "Wir liefern Code, nicht nur PowerPoints. End-to-End in einer Hand." },
  ];
  return (
    <section className="bg-zinc-950 text-white py-40 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <FadeUp>
          <div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Warum läuft.ch</div>
        </FadeUp>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-20 leading-[0.9]">
          <AnimatedWords text="Schweiz. Builder. Lokal." stagger={0.06} />
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {points.map(({ Icon, title, text }, i) => (
            <FadeUp key={i} delay={0.2 + i * 0.15}>
              <div className="bg-black border border-white/10 rounded-3xl p-10 h-full">
                <Icon size={36} className="text-white/80 mb-6" strokeWidth={1.5} />
                <h3 className="text-2xl font-semibold mb-3">{title}</h3>
                <p className="text-white/60 leading-relaxed">{text}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrackRecord() {
  const cases = [
    {
      tag: "Beispielrechnung · Treuhand",
      name: "Belegverarbeitung automatisieren",
      problem: "300 Belege pro Monat, manuell erfasst, 12 Std/Woche Aufwand für eine Mitarbeiterin.",
      solution: "AI liest, sortiert, prüft und verbucht. Mitarbeiterin prüft nur noch Edge-Cases.",
      result: "9 Std/Woche gespart = 36 Std/Monat = CHF 2'700/Monat bei CHF 75/h.",
      invest: "AI Sprint CHF 18'000",
      payback: "Payback nach 7 Monaten. Danach reine Ersparnis.",
    },
    {
      tag: "Beispielrechnung · Praxis",
      name: "Voice Agent für Terminbuchung",
      problem: "Empfang nimmt täglich 40+ Anrufe entgegen. Hälfte davon Terminbuchungen, Rest Rückfragen.",
      solution: "AI Voice Agent nimmt Anrufe 24/7 entgegen, bucht Termine im Kalender, beantwortet FAQ.",
      result: "60% der Anrufe automatisiert = 4 Std/Tag freie Empfangs-Kapazität.",
      invest: "AI Sprint CHF 22'000",
      payback: "Payback nach 5 Monaten. Mehr Kunden, weniger verpasste Anrufe.",
    },
  ];
  return (
    <section className="bg-white text-zinc-900 py-40 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <FadeUp>
          <div className="text-xs uppercase tracking-[0.4em] text-zinc-400 mb-6">So sieht ein Sprint aus</div>
        </FadeUp>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-10 leading-[0.9]">
          <AnimatedWords text="Konkret durchgerechnet." stagger={0.06} />
        </h2>
        <FadeUp delay={0.3}>
          <p className="text-lg md:text-2xl text-zinc-600 font-light leading-relaxed max-w-3xl mb-20">
            Zwei reale Beispiele wie ein AI Sprint aussieht — von Problem über Lösung bis zum Payback. Genau so durchrechnen wir auch deinen Use-Case im Audit.
          </p>
        </FadeUp>
        <div className="grid md:grid-cols-2 gap-6">
          {cases.map((c, i) => (
            <FadeUp key={i} delay={0.15 + i * 0.15}>
              <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-10 h-full">
                <div className="text-xs uppercase tracking-wider text-zinc-400 mb-4">{c.tag}</div>
                <h3 className="text-3xl md:text-4xl font-bold mb-8">{c.name}</h3>
                <div className="space-y-5">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-zinc-400 mb-1">Das Problem</div>
                    <p className="text-zinc-700">{c.problem}</p>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-zinc-400 mb-1">Die Lösung</div>
                    <p className="text-zinc-700">{c.solution}</p>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-zinc-400 mb-1">Das Ergebnis</div>
                    <p className="text-zinc-900 font-semibold">{c.result}</p>
                  </div>
                  <div className="pt-4 border-t border-zinc-200 flex items-baseline justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-zinc-400 mb-1">Investment</div>
                      <p className="text-zinc-900 font-bold tabular-nums">{c.invest}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs uppercase tracking-wider text-zinc-400 mb-1">Payback</div>
                      <p className="text-green-700 font-semibold text-sm">{c.payback}</p>
                    </div>
                  </div>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
        <FadeUp delay={0.5}>
          <p className="mt-12 text-center text-sm text-zinc-500">
            Beispielrechnungen basierend auf typischen Schweizer KMU-Szenarien. Tatsächliche Zahlen variieren je nach Setup.
          </p>
        </FadeUp>
      </div>
    </section>
  );
}

function About() {
  return (
    <section className="bg-black text-white py-40 px-6 overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <FadeUp>
          <div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-12 text-center">Über Pierre</div>
        </FadeUp>
        <ScrollRevealText
          text="Pierre Biege ist Schweizer Tech-Founder aus dem Wallis. Er baut seit über zehn Jahren Software für KMU – von Custom-Plattformen bis zu Marken. Heute fokussiert er sich auf das, was Schweizer Unternehmen wirklich brauchen: AI, die in Wochen läuft und Stunden spart. Kein Beraterspeak, keine generischen Workshops. Builder statt Talker."
          className="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight leading-[1.3] text-white text-center"
        />
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="kontakt" className="bg-black text-white px-6 py-40 overflow-hidden relative">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.12),_transparent_60%)]" />
      </div>
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <FadeUp>
          <div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-8">Kontakt</div>
        </FadeUp>
        <h2 className="text-6xl md:text-9xl lg:text-[12rem] font-bold tracking-tight mb-10 leading-[0.85]">
          <AnimatedWords text="Reden wir." stagger={0.1} />
        </h2>
        <FadeUp delay={0.5}>
          <p className="text-xl md:text-2xl text-white/70 mb-16 font-light max-w-2xl mx-auto">
            30 Minuten. Kostenlos. Du erfährst konkret welche AI-Use-Cases in deinem Unternehmen Sinn machen – ohne Pitch.
          </p>
        </FadeUp>
        <FadeUp delay={0.7}>
          <a
            href="mailto:pierre@laeuft.ch?subject=AI-Erstgespräch"
            className="inline-flex items-center gap-3 px-10 py-5 bg-white text-black rounded-full font-semibold text-lg hover:bg-white/90 transition-colors group"
          >
            <Mail size={20} />
            Erstgespräch buchen
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </a>
        </FadeUp>
        <FadeUp delay={0.9}>
          <p className="mt-10 text-white/50">
            oder direkt:{" "}
            <a href="mailto:pierre@laeuft.ch" className="text-white hover:underline">
              pierre@laeuft.ch
            </a>
          </p>
        </FadeUp>
        <FadeUp delay={1.2}>
          <div className="mt-24 text-xs uppercase tracking-[0.4em] text-white/30">läuft.ch · Wallis · Schweiz</div>
        </FadeUp>
      </div>
    </section>
  );
}

// ==================== PAGE ====================

export default function AiPage() {
  return (
    <div className="font-sans antialiased bg-black">
      <Hero />
      <PainPoints />
      <ProblemStatement />
      <Marquee />
      <Manifesto />
      <UseCases />
      <HowItWorks />
      <Packages />
      <TrackRecord />
      <WhyCH />
      <FAQ />
      <About />
      <Contact />
    </div>
  );
}

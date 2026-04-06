"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useInView, AnimatePresence, type MotionValue } from "framer-motion";
import {
  FileText,
  Phone,
  Brain,
  TrendingUp,
  Workflow,
  ArrowRight,
  Mail,
  Check,
  Shield,
  MapPin,
  Plus,
  Minus,
  Sparkles,
  Calendar,
  ArrowDown,
  Zap,
  Database,
  Bot,
  Building2,
} from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

// ==================== MOTION PRIMITIVES ====================

function FadeUp({ children, delay = 0, y = 30, className = "" }: { children: React.ReactNode; delay?: number; y?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.8, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

function RevealWord({ children, progress, range }: { children: React.ReactNode; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.15, 1]);
  return <motion.span style={{ opacity }} className="inline-block mr-[0.25em]">{children}</motion.span>;
}

// ==================== VISUALIZATION BLOCKS ====================

function InvoiceProcessor() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setStep((s) => (s + 1) % 5), 1800);
    return () => clearInterval(interval);
  }, []);

  const fields = [
    { label: "Lieferant", value: "Migros AG", show: step >= 1 },
    { label: "Datum", value: "06.04.2026", show: step >= 1 },
    { label: "Betrag", value: "CHF 247.50", show: step >= 2 },
    { label: "MwSt", value: "8.1%", show: step >= 2 },
    { label: "Kategorie", value: "Verpflegung", show: step >= 3 },
    { label: "Status", value: "Verbucht", show: step >= 4, success: true },
  ];

  return (
    <div className="bg-white dark:bg-zinc-900 border border-border rounded-3xl p-6 sm:p-8 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-foreground text-background flex items-center justify-center">
            <FileText size={16} />
          </div>
          <div>
            <div className="font-semibold text-sm">Belegverarbeitung</div>
            <div className="text-xs text-muted">Live · Auto-Modus</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          AI aktiv
        </div>
      </div>

      <div className="relative bg-zinc-50 dark:bg-zinc-950 border border-border rounded-2xl p-5 mb-4 min-h-[180px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-16 bg-white dark:bg-zinc-800 border border-border rounded shrink-0 relative overflow-hidden">
                <div className="absolute inset-x-1 top-2 h-0.5 bg-zinc-200 dark:bg-zinc-700" />
                <div className="absolute inset-x-1 top-4 h-0.5 bg-zinc-200 dark:bg-zinc-700" />
                <div className="absolute inset-x-1 top-6 h-0.5 bg-zinc-200 dark:bg-zinc-700 w-2/3" />
                <div className="absolute inset-x-1 bottom-3 h-0.5 bg-zinc-200 dark:bg-zinc-700" />
                {step === 0 && (
                  <motion.div
                    className="absolute inset-x-0 h-0.5 bg-blue-500"
                    initial={{ top: "0%" }}
                    animate={{ top: "100%" }}
                    transition={{ duration: 1.5, ease: "linear" }}
                  />
                )}
              </div>
              <div className="flex-1 space-y-2">
                {fields.map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: f.show ? 1 : 0.15, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-muted">{f.label}</span>
                    <span className={`font-mono font-medium ${f.success ? "text-green-600 dark:text-green-400 flex items-center gap-1" : ""}`}>
                      {f.success && <Check size={12} />}
                      {f.value}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between text-xs text-muted">
        <span>Heute verarbeitet</span>
        <span className="font-mono font-semibold text-foreground tabular-nums">147 / 152</span>
      </div>
    </div>
  );
}

function VoiceAgentDemo() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setStep((s) => (s + 1) % 5), 2000);
    return () => clearInterval(interval);
  }, []);

  const messages = [
    { role: "kunde", text: "Guten Tag, ich hätte gern einen Termin nächste Woche.", show: step >= 1 },
    { role: "ai", text: "Sehr gern. Donnerstag um 14:30 Uhr wäre frei. Passt das?", show: step >= 2 },
    { role: "kunde", text: "Ja, perfekt. Maria Bürki.", show: step >= 3 },
    { role: "ai", text: "Termin gebucht. Bestätigung kommt per SMS.", show: step >= 4 },
  ];

  return (
    <div className="bg-foreground text-background rounded-3xl p-6 sm:p-8 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-xl bg-background/10 flex items-center justify-center">
            <Phone size={16} />
            {step === 0 && (
              <motion.div
                className="absolute inset-0 rounded-xl border-2 border-background"
                animate={{ scale: [1, 1.4, 1.4], opacity: [1, 0, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </div>
          <div>
            <div className="font-semibold text-sm">Voice Agent</div>
            <div className="text-xs text-background/60">{step === 0 ? "Eingehender Anruf..." : "Im Gespräch · 0:" + (10 + step * 8)}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-background/60">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Live
        </div>
      </div>

      <div className="bg-background/5 rounded-2xl p-5 mb-4 min-h-[200px] space-y-3">
        {messages.map((m, i) => (
          <AnimatePresence key={i}>
            {m.show && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE }}
                className={`flex ${m.role === "ai" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs ${
                    m.role === "ai" ? "bg-background text-foreground" : "bg-background/10 text-background"
                  }`}
                >
                  {m.text}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        ))}
        {step === 4 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="mt-4 bg-background text-foreground rounded-xl p-3 flex items-center gap-3 text-xs"
          >
            <Calendar size={16} className="text-green-600" />
            <div className="flex-1">
              <div className="font-semibold">Donnerstag, 14:30</div>
              <div className="text-muted">Maria Bürki · Termin</div>
            </div>
            <Check size={14} className="text-green-600" />
          </motion.div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-background/60">
        <span>Anrufe heute</span>
        <span className="font-mono font-semibold text-background tabular-nums">28 · 100% beantwortet</span>
      </div>
    </div>
  );
}

function WorkflowDemo() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 100);
    return () => clearInterval(interval);
  }, []);
  const phase = (tick / 12) % 4;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-border rounded-3xl p-6 sm:p-8 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-foreground text-background flex items-center justify-center">
            <Workflow size={16} />
          </div>
          <div>
            <div className="font-semibold text-sm">Workflow Automation</div>
            <div className="text-xs text-muted">Sync alle 5 Min</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <Sparkles size={12} className="text-blue-500" />
          AI verbindet
        </div>
      </div>

      <div className="bg-zinc-50 dark:bg-zinc-950 border border-border rounded-2xl p-5 mb-4 min-h-[200px]">
        <div className="grid grid-cols-3 gap-2 items-center">
          {/* Source */}
          <div className="bg-white dark:bg-zinc-900 border border-border rounded-xl p-3 text-center">
            <Database size={20} className="mx-auto mb-2 text-zinc-500" />
            <div className="text-xs font-semibold">CRM</div>
            <div className="text-[10px] text-muted">Neue Leads</div>
          </div>
          {/* Arrow with dots */}
          <div className="relative h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full">
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500"
              animate={{ left: ["0%", "100%"] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            />
          </div>
          {/* AI */}
          <div className="bg-foreground text-background rounded-xl p-3 text-center">
            <Bot size={20} className="mx-auto mb-2" />
            <div className="text-xs font-semibold">AI</div>
            <div className="text-[10px] text-background/60">Anreichern</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 items-center mt-4">
          <div className="col-span-1" />
          <div className="relative h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full">
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-green-500"
              animate={{ left: ["0%", "100%"] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear", delay: 0.6 }}
            />
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-border rounded-xl p-3 text-center">
            <Mail size={20} className="mx-auto mb-2 text-zinc-500" />
            <div className="text-xs font-semibold">Mailtool</div>
            <div className="text-[10px] text-muted">Sequenz</div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-[11px] text-muted">
          <Zap size={11} className="text-green-500" />
          <span>14 Leads verarbeitet · 0 Fehler</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted">
        <span>Letzte Synchronisation</span>
        <span className="font-mono font-semibold text-foreground">vor 12s</span>
      </div>
    </div>
  );
}

// ==================== SECTIONS ====================

function Hero() {
  return (
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left */}
          <div>
            <FadeUp>
              <div className="inline-flex items-center gap-2 bg-foreground/10 text-sm px-4 py-2 rounded-full mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                läuft.ch · AI · Schweiz
              </div>
            </FadeUp>
            <FadeUp delay={0.1}>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
                Wir bauen KI,
                <br />
                <span className="italic font-serif font-normal">die wirklich läuft.</span>
              </h1>
            </FadeUp>
            <FadeUp delay={0.2}>
              <p className="text-xl text-muted mb-8 max-w-lg">
                Konkrete AI-Lösungen für Schweizer KMU. Code statt Slides. Live in 4 Wochen. Lokal gehostet.
              </p>
            </FadeUp>
            <FadeUp delay={0.3}>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="#kontakt"
                  className="inline-flex items-center justify-center h-14 px-8 bg-foreground text-background font-medium rounded-full hover:opacity-90 transition-opacity"
                >
                  Kostenloses Erstgespräch
                </a>
                <a
                  href="#pakete"
                  className="inline-flex items-center justify-center h-14 px-8 border border-border font-medium rounded-full hover:border-foreground/30 transition-colors"
                >
                  Pakete & Preise
                </a>
              </div>
            </FadeUp>
          </div>
          {/* Right: Live Demo */}
          <FadeUp delay={0.3}>
            <InvoiceProcessor />
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

function PainPoints() {
  const pains = [
    { q: "Belege manuell erfassen", a: "AI liest und verbucht — du prüfst nur." },
    { q: "Telefon klingelt durchgehend", a: "Voice Agent nimmt 24/7 entgegen." },
    { q: "Wissen verteilt auf 5 Tools", a: "Ein Bot, der alles kennt." },
  ];
  return (
    <section className="py-20 px-6 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <FadeUp>
          <p className="text-sm uppercase tracking-widest text-muted mb-12">Kommt dir bekannt vor?</p>
        </FadeUp>
        <div className="grid md:grid-cols-3 gap-6">
          {pains.map((p, i) => (
            <FadeUp key={i} delay={i * 0.1}>
              <div className="bg-white dark:bg-zinc-900 border border-border rounded-3xl p-8 hover:shadow-xl transition-shadow">
                <p className="text-xl font-semibold mb-3">{p.q}</p>
                <p className="text-muted">{p.a}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProblemStatement() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const statements = [
    "Tausend KI-Tools.",
    "Zehn Berater.",
    "Hundert LinkedIn-Posts.",
    "Und du fragst dich:",
    "Was bringt mich konkret weiter?",
    "Du brauchst keinen Workshop.",
    "Du brauchst keine Strategie.",
    "Du brauchst jemanden, der baut.",
    "Etwas, das morgen läuft.",
    "Etwas, das sich rechnet.",
  ];
  const allWords = statements.join(" ").split(" ");
  const total = allWords.length;
  return (
    <section ref={ref} className="relative h-[300vh] border-t border-border">
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center px-6">
        <FadeUp>
          <p className="text-sm uppercase tracking-widest text-muted mb-8">Das Problem</p>
        </FadeUp>
        <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-medium text-center max-w-4xl leading-relaxed">
          {allWords.map((word, i) => {
            const start = i / total;
            const end = (i + 1) / total;
            return <RevealWord key={i} progress={scrollYProgress} range={[start, end]}>{word}</RevealWord>;
          })}
        </p>
      </div>
    </section>
  );
}

function LiveDemos() {
  return (
    <section className="py-32 bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-6 mb-16">
        <FadeUp>
          <p className="text-sm uppercase tracking-widest text-background/60 mb-4">Live Demos</p>
        </FadeUp>
        <FadeUp delay={0.1}>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
            Was AI bei dir <span className="italic font-serif font-normal">macht</span>.
          </h2>
        </FadeUp>
        <FadeUp delay={0.2}>
          <p className="text-background/60 text-lg max-w-2xl">
            Drei Beispiele die direkt in deinem Unternehmen laufen können. Nicht Demo-Videos. Echte Systeme.
          </p>
        </FadeUp>
      </div>
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-6">
        <FadeUp delay={0.1}>
          <VoiceAgentDemo />
        </FadeUp>
        <FadeUp delay={0.2}>
          <div className="bg-white text-foreground rounded-3xl p-6 sm:p-8 shadow-sm overflow-hidden h-full">
            <InvoiceProcessor />
          </div>
        </FadeUp>
        <FadeUp delay={0.3}>
          <div className="bg-white text-foreground rounded-3xl p-6 sm:p-8 shadow-sm overflow-hidden h-full">
            <WorkflowDemo />
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

function UseCases() {
  const cases = [
    { Icon: FileText, title: "Dokumenten-Automatisierung", text: "Belege, Verträge, Anträge. AI liest, sortiert, verarbeitet — du prüfst nur noch.", tag: "Treuhand · Anwalt · Versicherung" },
    { Icon: Phone, title: "Voice Agents", text: "AI nimmt Anrufe entgegen, qualifiziert Leads, bucht Termine. 24/7. Mehrsprachig.", tag: "Praxis · Hotel · Service" },
    { Icon: Brain, title: "Wissens-Bots", text: "Dein Firmenwissen, jederzeit abrufbar. Mitarbeiter fragen, AI antwortet aus deinen Dokumenten.", tag: "Industrie · KMU · Schule" },
    { Icon: TrendingUp, title: "Sales & Marketing AI", text: "Lead-Recherche, Personalisierung, Follow-Ups. AI macht 80% der Outreach-Arbeit.", tag: "B2B · Agentur · SaaS" },
    { Icon: Workflow, title: "Workflow Automation", text: "Daten zwischen Tools, Triggers, Reports. AI verbindet alles, was bisher manuell lief.", tag: "ERP · CRM · Buchhaltung" },
  ];
  return (
    <section className="py-32 px-6 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <FadeUp>
          <p className="text-sm uppercase tracking-widest text-muted mb-4">Was wir liefern</p>
        </FadeUp>
        <FadeUp delay={0.1}>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Fünf <span className="italic font-serif font-normal">Use-Cases</span>.
          </h2>
        </FadeUp>
        <FadeUp delay={0.2}>
          <p className="text-muted text-lg max-w-2xl mb-16">
            Wir bauen keine generischen "AI-Strategien". Wir liefern konkrete Lösungen aus diesen fünf Familien — passend zu deinem Schmerz.
          </p>
        </FadeUp>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map(({ Icon, title, text, tag }, i) => (
            <FadeUp key={i} delay={i * 0.08}>
              <div className="bg-white dark:bg-zinc-900 border border-border rounded-3xl p-8 h-full hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-foreground text-background rounded-2xl flex items-center justify-center mb-6">
                  <Icon size={20} />
                </div>
                <h3 className="text-2xl font-bold mb-3">{title}</h3>
                <p className="text-muted mb-6 leading-relaxed">{text}</p>
                <p className="text-xs uppercase tracking-wider text-muted">{tag}</p>
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
    { n: "1", title: "Gespräch", duration: "30 Min · kostenlos", text: "Du erzählst, was bei dir manuell läuft. Ich sage dir, ob AI hilft — und wenn ja, welche.", inverse: false },
    { n: "2", title: "AI Audit", duration: "1 Tag · CHF 4'500", text: "Ich komme zu dir, schaue Prozesse an, spreche mit deinem Team. Du bekommst 5 priorisierte Use-Cases.", inverse: false },
    { n: "3", title: "AI Sprint", duration: "4 Wochen · ab CHF 18'000", text: "Wir bauen einen Use-Case end-to-end. Custom wo nötig, Tools wo möglich. Live nach 4 Wochen.", inverse: true },
    { n: "4", title: "Champion", duration: "Optional · ab CHF 2'500/Mt", text: "Wir bleiben dran. Neue Use-Cases, Erweiterungen, Updates. Direkter Slack-Kontakt.", inverse: false },
  ];
  return (
    <section id="so-funktionierts" className="py-32 px-6 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <FadeUp>
          <p className="text-sm uppercase tracking-widest text-muted mb-4">So funktioniert's</p>
        </FadeUp>
        <FadeUp delay={0.1}>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-16">
            Vom Gespräch zum <span className="italic font-serif font-normal">Live-System</span>.
          </h2>
        </FadeUp>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <FadeUp key={i} delay={i * 0.1}>
              <div
                className={`rounded-3xl p-8 h-full hover:shadow-xl transition-all ${
                  s.inverse ? "bg-foreground text-background" : "bg-white dark:bg-zinc-900 border border-border"
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold mb-8 ${
                    s.inverse ? "bg-background text-foreground" : "bg-foreground text-background"
                  }`}
                >
                  {s.n}
                </div>
                <h3 className="text-2xl font-bold mb-2">{s.title}</h3>
                <p className={`text-xs uppercase tracking-wider mb-4 ${s.inverse ? "text-background/60" : "text-muted"}`}>{s.duration}</p>
                <p className={s.inverse ? "text-background/70" : "text-muted"}>{s.text}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

function Packages() {
  const pkgs = [
    {
      name: "AI Audit",
      eyebrow: "Start hier",
      price: "CHF 4'500",
      duration: "1 Tag vor Ort + Report",
      features: ["Vor-Ort Workshop mit deinem Team", "5 konkrete AI-Use-Cases identifiziert", "Priorisierung nach ROI", "Implementierungsplan", "Schriftlicher Report"],
      cta: "Audit buchen",
      inverse: false,
    },
    {
      name: "AI Sprint",
      eyebrow: "Beliebt",
      price: "ab CHF 18'000",
      duration: "4 Wochen, 1 Use-Case live",
      features: ["End-to-End Implementation", "Custom-Build wo nötig", "Schweiz-konformes Hosting", "Team-Onboarding", "30 Tage Garantie nach Go-Live", "Vollständige Dokumentation"],
      cta: "Sprint starten",
      inverse: true,
    },
    {
      name: "AI Champion",
      eyebrow: "Recurring",
      price: "ab CHF 2'500",
      duration: "Pro Monat · jederzeit kündbar",
      features: ["1 Tag Support pro Monat", "Neue Use-Cases & Erweiterungen", "Team-Workshops bei Bedarf", "Updates und Wartung", "Direkter Slack/WhatsApp-Kontakt"],
      cta: "Anfrage stellen",
      inverse: false,
    },
  ];
  return (
    <section id="pakete" className="py-32 px-6 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <FadeUp>
          <p className="text-sm uppercase tracking-widest text-muted mb-4">Pakete & Preise</p>
        </FadeUp>
        <FadeUp delay={0.1}>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Drei <span className="italic font-serif font-normal">Wege rein</span>.
          </h2>
        </FadeUp>
        <FadeUp delay={0.2}>
          <p className="text-muted text-lg max-w-2xl mb-16">
            Klar definierte Pakete, transparente Preise. Keine versteckten Kosten, kein "auf Anfrage", keine Slides die nichts liefern.
          </p>
        </FadeUp>
        <div className="grid md:grid-cols-3 gap-6">
          {pkgs.map((p, i) => (
            <FadeUp key={i} delay={i * 0.1}>
              <div
                className={`relative rounded-3xl p-8 h-full flex flex-col ${
                  p.inverse ? "bg-foreground text-background" : "bg-white dark:bg-zinc-900 border border-border"
                }`}
              >
                <div className={`text-xs uppercase tracking-wider mb-4 ${p.inverse ? "text-background/60" : "text-muted"}`}>{p.eyebrow}</div>
                <h3 className="text-3xl font-bold mb-2">{p.name}</h3>
                <p className={`text-sm mb-8 ${p.inverse ? "text-background/60" : "text-muted"}`}>{p.duration}</p>
                <div className="text-4xl font-bold tabular-nums mb-8">{p.price}</div>
                <ul className="space-y-3 mb-10 flex-1">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm">
                      <Check size={16} className={`shrink-0 mt-0.5 ${p.inverse ? "text-background/60" : "text-foreground/50"}`} />
                      <span className={p.inverse ? "text-background/80" : "text-foreground/80"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="#kontakt"
                  className={`inline-flex items-center justify-center h-12 px-6 rounded-full font-medium transition-opacity ${
                    p.inverse ? "bg-background text-foreground hover:opacity-90" : "bg-foreground text-background hover:opacity-90"
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

function Beispielrechnungen() {
  const cases = [
    {
      tag: "Treuhand",
      name: "Belegverarbeitung automatisiert",
      problem: "300 Belege/Monat manuell erfasst, 12 Std/Woche Aufwand für eine Mitarbeiterin.",
      solution: "AI liest, sortiert, prüft, verbucht. Mitarbeiterin prüft nur Edge-Cases.",
      result: "9 Std/Woche gespart = CHF 2'700/Monat (bei CHF 75/h).",
      invest: "CHF 18'000",
      payback: "Payback nach 7 Monaten",
    },
    {
      tag: "Praxis",
      name: "Voice Agent für Terminbuchung",
      problem: "Empfang nimmt täglich 40+ Anrufe entgegen. Hälfte sind Terminbuchungen.",
      solution: "AI Voice Agent nimmt Anrufe 24/7, bucht Termine im Kalender, beantwortet FAQ.",
      result: "60% der Anrufe automatisiert = 4 Std/Tag freie Empfangs-Kapazität.",
      invest: "CHF 22'000",
      payback: "Payback nach 5 Monaten",
    },
  ];
  return (
    <section className="py-32 px-6 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <FadeUp>
          <p className="text-sm uppercase tracking-widest text-muted mb-4">Beispielrechnungen</p>
        </FadeUp>
        <FadeUp delay={0.1}>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Konkret <span className="italic font-serif font-normal">durchgerechnet</span>.
          </h2>
        </FadeUp>
        <FadeUp delay={0.2}>
          <p className="text-muted text-lg max-w-2xl mb-16">
            Zwei reale Beispiele wie ein AI Sprint aussieht — von Problem über Lösung bis zum Payback. Genau so rechnen wir auch deinen Use-Case durch.
          </p>
        </FadeUp>
        <div className="grid md:grid-cols-2 gap-6">
          {cases.map((c, i) => (
            <FadeUp key={i} delay={i * 0.15}>
              <div className="bg-white dark:bg-zinc-900 border border-border rounded-3xl p-10 h-full">
                <div className="text-xs uppercase tracking-wider text-muted mb-4">{c.tag}</div>
                <h3 className="text-3xl font-bold mb-8">{c.name}</h3>
                <div className="space-y-5">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted mb-1">Das Problem</div>
                    <p className="text-foreground/80">{c.problem}</p>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted mb-1">Die Lösung</div>
                    <p className="text-foreground/80">{c.solution}</p>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted mb-1">Das Ergebnis</div>
                    <p className="font-semibold">{c.result}</p>
                  </div>
                  <div className="pt-4 border-t border-border flex items-baseline justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted mb-1">Investment</div>
                      <p className="font-bold tabular-nums">{c.invest}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs uppercase tracking-wider text-muted mb-1">Payback</div>
                      <p className="text-green-700 dark:text-green-400 font-semibold text-sm">{c.payback}</p>
                    </div>
                  </div>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
        <FadeUp delay={0.3}>
          <p className="mt-8 text-center text-sm text-muted">
            Beispielrechnungen basierend auf typischen Schweizer KMU-Szenarien. Tatsächliche Zahlen variieren je nach Setup.
          </p>
        </FadeUp>
      </div>
    </section>
  );
}

function WhyCH() {
  const points = [
    { Icon: MapPin, title: "Vor Ort", text: "Workshops und Implementierung persönlich – Wallis, Bern, Zürich, Basel." },
    { Icon: Shield, title: "CH-Datenschutz", text: "Schweizer Server, FINMA-ready, kein US-Vendor-Lock-in." },
    { Icon: Building2, title: "Wir bauen selbst", text: "Wir liefern Code, nicht nur PowerPoints. End-to-End in einer Hand." },
  ];
  return (
    <section className="py-32 bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-6">
        <FadeUp>
          <p className="text-sm uppercase tracking-widest text-background/60 mb-4">Warum läuft.ch</p>
        </FadeUp>
        <FadeUp delay={0.1}>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-16">
            Schweiz. Builder. <span className="italic font-serif font-normal">Lokal</span>.
          </h2>
        </FadeUp>
        <div className="grid md:grid-cols-3 gap-6">
          {points.map(({ Icon, title, text }, i) => (
            <FadeUp key={i} delay={i * 0.1}>
              <div className="bg-background/5 border border-background/10 rounded-3xl p-10 h-full">
                <div className="w-12 h-12 bg-background text-foreground rounded-2xl flex items-center justify-center mb-6">
                  <Icon size={20} />
                </div>
                <h3 className="text-2xl font-bold mb-3">{title}</h3>
                <p className="text-background/70 leading-relaxed">{text}</p>
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
    { q: "Was kostet ein typisches Projekt am Ende wirklich?", a: "Audit CHF 4'500. Ein Sprint 18'000–28'000 je nach Komplexität. Optional Champion-Retainer ab 2'500/Monat. Keine versteckten Kosten, keine Stundenabrechnung. Du weißt vorher genau was du zahlst." },
    { q: "Wir haben schon ChatGPT/Copilot. Was bringt mir das?", a: "ChatGPT ist ein Chat. Wir bauen Lösungen die in deine Prozesse eingebettet sind: Belege werden automatisch verarbeitet während du schläfst. Anrufe werden 24/7 entgegengenommen. Wissen aus deinen Dokumenten ist sofort abrufbar. Das ersetzt nicht ChatGPT — es nutzt die Modelle dahinter, aber ohne dass jemand bei euch tippen muss." },
    { q: "Was passiert mit unseren Daten? DSGVO?", a: "Wir hosten in der Schweiz. Wir nutzen wo immer möglich europäische oder selbst-gehostete Modelle. Wo OpenAI/Anthropic eingesetzt wird, immer mit Zero-Retention-API. FINMA-tauglich für regulierte Branchen. Du bekommst eine schriftliche Datenschutz-Übersicht im Audit." },
    { q: "Was wenn die AI Fehler macht?", a: "Macht sie. Deshalb bauen wir Systeme so, dass Menschen Edge-Cases prüfen — nicht 100% der Fälle. Bei kritischen Prozessen ist immer ein Human-in-the-Loop. Du sparst 80% der Zeit, die anderen 20% kontrollierst du." },
    { q: "Wie lange bis ich Resultate sehe?", a: "Audit-Resultate nach 1 Tag. Erste Sprint-Implementation live nach 4 Wochen. Erste messbare Zeitersparnis ab Woche 5. Payback typischerweise nach 5–9 Monaten je nach Use-Case." },
    { q: "Ich bin keine grosse Firma. Lohnt sich das?", a: "Gerade dann. Grosse Firmen haben IT-Abteilungen. KMU haben den größten Hebel pro investiertem Franken, weil eine einzige Automatisierung oft eine ganze Stelle entlastet. Unsere besten Kunden sind 10–80 Personen." },
    { q: "Was unterscheidet euch von anderen AI-Beratern?", a: "Wir bauen selbst. Wir liefern Code, nicht PowerPoints. Kein Junior, kein Projektmanager dazwischen — du redest immer mit Pierre. Wir sind Schweizer mit Schweizer Hosting. Und wir zeigen unsere Preise offen." },
    { q: "Was wenn ich nach dem Audit nicht weitermache?", a: "Dann hast du für CHF 4'500 einen Report mit konkreten Use-Cases bekommen, den du selbst oder mit anderen umsetzen kannst. Kein Druck. Wir empfehlen den Sprint nur wenn er klar Sinn macht." },
  ];
  return (
    <section className="py-32 px-6 border-t border-border">
      <div className="max-w-4xl mx-auto">
        <FadeUp>
          <p className="text-sm uppercase tracking-widest text-muted mb-4">Häufige Fragen</p>
        </FadeUp>
        <FadeUp delay={0.1}>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-16">
            <span className="italic font-serif font-normal">Antworten</span>.
          </h2>
        </FadeUp>
        <div className="divide-y divide-border">
          {faqs.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} />)}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="py-6">
      <button onClick={() => setOpen(!open)} className="w-full flex items-start justify-between gap-6 text-left group">
        <span className="text-xl md:text-2xl font-semibold group-hover:text-black dark:group-hover:text-white transition-colors">{q}</span>
        <span className="shrink-0 mt-1 w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted group-hover:border-foreground group-hover:text-foreground transition-colors">
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
            <p className="pt-4 pr-12 text-lg text-muted leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Contact() {
  return (
    <section id="kontakt" className="py-32 px-6 border-t border-border">
      <div className="max-w-4xl mx-auto text-center">
        <FadeUp>
          <p className="text-sm uppercase tracking-widest text-muted mb-4">Kontakt</p>
        </FadeUp>
        <FadeUp delay={0.1}>
          <h2 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-[0.95]">
            Reden <span className="italic font-serif font-normal">wir</span>.
          </h2>
        </FadeUp>
        <FadeUp delay={0.2}>
          <p className="text-xl text-muted mb-12 max-w-2xl mx-auto">
            30 Minuten. Kostenlos. Du erfährst konkret welche AI-Use-Cases in deinem Unternehmen Sinn machen — ohne Pitch.
          </p>
        </FadeUp>
        <FadeUp delay={0.3}>
          <a
            href="mailto:pierre@laeuft.ch?subject=AI-Erstgespräch"
            className="inline-flex items-center gap-3 h-14 px-8 bg-foreground text-background font-medium rounded-full hover:opacity-90 transition-opacity group"
          >
            <Mail size={18} />
            Erstgespräch buchen
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </a>
        </FadeUp>
        <FadeUp delay={0.4}>
          <p className="mt-8 text-muted">
            oder direkt:{" "}
            <a href="mailto:pierre@laeuft.ch" className="text-foreground hover:underline">
              pierre@laeuft.ch
            </a>
          </p>
        </FadeUp>
      </div>
    </section>
  );
}

// ==================== PAGE ====================

export default function AiPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="text-xl font-semibold tracking-tight">
            Läuft.<span className="text-muted">ai</span>
          </a>
          <div className="flex items-center gap-4">
            <a href="#pakete" className="hidden sm:block text-sm text-muted hover:text-foreground transition-colors">Pakete</a>
            <a href="#so-funktionierts" className="hidden sm:block text-sm text-muted hover:text-foreground transition-colors">So funktioniert's</a>
            <a href="#kontakt" className="text-sm font-medium bg-foreground text-background px-4 py-2 rounded-full hover:opacity-90 transition-opacity">
              Gespräch buchen
            </a>
          </div>
        </div>
      </nav>
      <Hero />
      <PainPoints />
      <ProblemStatement />
      <LiveDemos />
      <UseCases />
      <HowItWorks />
      <Packages />
      <Beispielrechnungen />
      <WhyCH />
      <FAQ />
      <Contact />
    </main>
  );
}

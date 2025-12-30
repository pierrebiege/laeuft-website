"use client";

import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { useState, useRef } from "react";
import { Zap, User, Cog, Globe, Database, ArrowUp, X, Plus, Quote } from "lucide-react";

// FAQ Accordion Item
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-border">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left hover:opacity-70 transition-opacity"
      >
        <span className="text-lg sm:text-xl font-medium pr-8">{question}</span>
        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-2xl flex-shrink-0"
        >
          +
        </motion.span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-muted max-w-2xl">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Word component for scroll-based reveal
function Word({
  children,
  progress,
  range,
}: {
  children: string;
  progress: any;
  range: [number, number];
}) {
  const opacity = useTransform(progress, range, [0.15, 1]);

  return (
    <motion.span style={{ opacity }} className="inline-block mr-[0.25em]">
      {children}
    </motion.span>
  );
}

// Pricing Card
function PricingCard({
  title,
  price,
  period,
  description,
  features,
  cta,
  example,
  featured = false,
  delay = 0,
}: {
  title: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  example: string;
  featured?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      viewport={{ once: true }}
      transition={{ delay }}
      className={`rounded-3xl p-8 h-full flex flex-col hover:shadow-xl transition-shadow duration-300 ${
        featured
          ? "bg-foreground text-background"
          : "bg-white dark:bg-zinc-900 border border-border"
      }`}
    >
      {featured && (
        <div className="text-sm bg-background/20 text-background px-3 py-1 rounded-full w-fit mb-4">
          Beliebt
        </div>
      )}
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <div className="mb-4">
        <span className="text-4xl font-bold">{price}</span>
        <span className={featured ? "text-background/70" : "text-muted"}>
          {period}
        </span>
      </div>
      <p className={`mb-6 ${featured ? "text-background/70" : "text-muted"}`}>
        {description}
      </p>
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3 text-sm">
            <span
              className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${
                featured ? "bg-background" : "bg-foreground"
              }`}
            />
            {feature}
          </li>
        ))}
      </ul>
      <a
        href="#kontakt"
        className={`block w-full text-center py-4 rounded-xl font-medium transition-all hover:scale-[1.02] active:scale-[0.98] ${
          featured
            ? "bg-background text-foreground hover:bg-background/90"
            : "bg-foreground text-background hover:bg-foreground/90"
        }`}
      >
        {cta}
      </a>
      <div className={`mt-6 pt-6 border-t ${featured ? "border-background/20" : "border-border"}`}>
        <p className={`text-xs ${featured ? "text-background/50" : "text-muted"}`}>
          <span className="font-medium">Beispiel:</span> {example}
        </p>
      </div>
    </motion.div>
  );
}

// Portfolio Item
function PortfolioItem({
  title,
  category,
  index,
}: {
  title: string;
  category: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="group cursor-pointer"
    >
      <div className="aspect-[4/3] bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800 rounded-2xl mb-4 overflow-hidden relative group-hover:shadow-lg transition-shadow duration-300">
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors" />
      </div>
      <p className="text-sm text-muted mb-1">{category}</p>
      <h3 className="font-semibold group-hover:text-foreground/80 transition-colors">{title}</h3>
    </motion.div>
  );
}

// Service Card with Modal
function ServiceCard({
  icon: Icon,
  title,
  shortDesc,
  example,
  details,
  index,
}: {
  icon: React.ElementType;
  title: string;
  shortDesc: string;
  example: string;
  details: string[];
  index: number;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1 }}
        className="flex-shrink-0 w-[320px] sm:w-[380px] bg-background/10 rounded-3xl p-8 cursor-pointer hover:bg-background/15 transition-all duration-300 group"
        onClick={() => setIsOpen(true)}
      >
        <Icon className="w-10 h-10 mb-6" />
        <h3 className="text-2xl font-bold mb-3">{title}</h3>
        <p className="text-background/70 mb-6">{shortDesc}</p>
        <p className="text-background/50 text-sm italic mb-6">&ldquo;{example}&rdquo;</p>
        <div className="flex items-center gap-2 text-sm font-medium group-hover:gap-3 transition-all">
          <span>Mehr erfahren</span>
          <Plus className="w-4 h-4" />
        </div>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-foreground text-background rounded-3xl p-8 sm:p-12 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-8">
                <Icon className="w-12 h-12" />
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-background/10 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <h3 className="text-3xl font-bold mb-4">{title}</h3>
              <p className="text-background/70 text-lg mb-8">{shortDesc}</p>

              <div className="space-y-4 mb-8">
                {details.map((detail, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-background mt-2.5 shrink-0" />
                    <p className="text-background/80">{detail}</p>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-background/10 rounded-2xl">
                <p className="text-sm text-background/50 mb-2">Beispiel aus der Praxis:</p>
                <p className="text-background/90">{example}</p>
              </div>

              <a
                href="#kontakt"
                onClick={() => setIsOpen(false)}
                className="block w-full text-center py-4 mt-8 bg-background text-foreground rounded-xl font-medium hover:bg-background/90 transition-colors"
              >
                Projekt besprechen
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function Home() {
  const problemRef = useRef<HTMLDivElement>(null);
  const [showFloatingCTA, setShowFloatingCTA] = useState(false);

  const { scrollYProgress } = useScroll({
    target: problemRef,
    offset: ["start start", "end end"],
  });

  // Track scroll for floating CTA
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (latest) => {
    setShowFloatingCTA(latest > 500);
  });

  const problemStatements = [
    "Du hast gebaut.",
    "Es läuft.",
    "Aber es skaliert nicht.",
    "Drei Standorte.",
    "Fünf Tools.",
    "Nichts redet miteinander.",
    "Du weisst, was fehlt.",
    "Ein System, das mitwächst.",
    "Kein Tool. Kein Plugin.",
    "Etwas, das es noch nicht gibt.",
  ];

  const allWords = problemStatements.join(" ").split(" ");
  const totalWords = allWords.length;

  const faqs = [
    {
      question: "Was baust du genau?",
      answer:
        "Systeme, die dein Business zusammenhalten. Dashboards, die Daten aus 5 Tools an einem Ort zeigen. Buchungssysteme, die mit Zahlung und Kommunikation verbunden sind. Shops, die automatisch ans Lager und den Versand gekoppelt sind. Keine Einzellösungen – alles verbunden.",
    },
    {
      question: "Brauche ich technisches Wissen?",
      answer:
        "Nein. Du erzählst mir, was fehlt. Ich baue es. Du bekommst etwas, das funktioniert – keine Schulung, kein Handbuch, kein Selbststudium nötig.",
    },
    {
      question: "Wie lange dauert ein Projekt?",
      answer:
        "Kommt drauf an. Eine Automatisierung: 1-2 Wochen. Ein Shop mit Lageranbindung: 4-6 Wochen. Ein Komplettsystem mit Dashboard und Datenbank: 6-10 Wochen. Ich sage dir nach dem ersten Gespräch, was realistisch ist.",
    },
    {
      question: "Was ist der Unterschied zwischen Projekt und Abo?",
      answer:
        "Projekt = einmalig. Du brauchst ein System, ich baue es, fertig. Abo = laufend. Dein Business entwickelt sich, ich entwickle das System mit. Die meisten starten mit einem Projekt und wechseln dann ins Abo.",
    },
    {
      question: "Kann ich das Abo pausieren?",
      answer:
        "Jederzeit. Monatlich kündbar, keine Mindestlaufzeit. Wenn du einen Monat weniger brauchst, pausierst du. Die restlichen Tage verfallen nicht.",
    },
    {
      question: "Arbeitest du alleine?",
      answer:
        "Ja. Du redest immer mit mir. Ich baue alles selbst. Kein Projektmanager dazwischen, kein Junior, der die Arbeit macht. Das hält die Qualität hoch und die Kommunikation kurz.",
    },
    {
      question: "Für wen ist das nichts?",
      answer:
        "Wenn du ein bestehendes Tool suchst, das du einfach kaufen kannst – Google es. Wenn du eine Beratung willst, die dir sagt, was du tun solltest – such dir einen Berater. Ich bin für Leute, die wissen, was sie brauchen, und jemanden suchen, der es baut.",
    },
  ];

  const portfolioItems = [
    { title: "ParkourONE AcademyBoard", category: "System" },
    { title: "RubikONE", category: "Plattform" },
    { title: "Ein richtig guter Tag", category: "Shop" },
    { title: "7 WordPress-Sites verbunden", category: "Automatisierung" },
    { title: "Event-Buchungssystem", category: "System" },
    { title: "Multi-Standort Dashboard", category: "Datenbank" },
  ];

  const serviceItems = [
    {
      icon: Cog,
      title: "Systeme",
      shortDesc: "Dashboards, Buchungssysteme, interne Tools – alles, was dein Business zusammenhält.",
      example: "Für ParkourONE baue ich das AcademyBoard – ein System, das Trainer, Kurse und Teilnehmer an einem Ort verwaltet.",
      details: [
        "Massgeschneiderte Dashboards für deine Daten",
        "Buchungssysteme mit Zahlungsintegration",
        "Interne Tools, die genau das tun, was du brauchst",
        "Anbindung an bestehende Software",
      ],
    },
    {
      icon: Database,
      title: "Datenbanken",
      shortDesc: "Strukturierte Daten statt Excel-Chaos. Alles an einem Ort, sauber organisiert.",
      example: "Ein Betrieb mit 3 Standorten – alle Daten in einer Supabase-Datenbank, zugänglich von überall.",
      details: [
        "Supabase, PostgreSQL, moderne Datenbanken",
        "Migration von Excel und alten Systemen",
        "Berechtigungen und Zugriffssteuerung",
        "Echtzeit-Synchronisation zwischen Standorten",
      ],
    },
    {
      icon: Globe,
      title: "Shops",
      shortDesc: "Shopify-Stores, die verkaufen. Mit Lager, Versand und allem, was dazugehört.",
      example: "Mein eigener Shop 'Ein richtig guter Tag' läuft auf Shopify – mit automatisiertem Fulfillment.",
      details: [
        "Shopify-Setup und Customization",
        "Anbindung an Lagersysteme",
        "Automatisierter Versand und Fulfillment",
        "Internationale Shops mit Steuern und Währungen",
      ],
    },
    {
      icon: Zap,
      title: "Automationen",
      shortDesc: "Workflows, die dir Stunden sparen. Was sich wiederholt, läuft automatisch.",
      example: "7 WordPress-Sites, die automatisch synchronisiert werden. Einmal ändern, überall aktualisiert.",
      details: [
        "n8n und Make für komplexe Workflows",
        "Verbindung zwischen allen deinen Tools",
        "Automatische E-Mails, Benachrichtigungen, Reports",
        "Datenübertragung ohne manuelles Kopieren",
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-[#f5f5f5] dark:bg-zinc-950 text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#f5f5f5]/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-semibold tracking-tight">Läuft.</span>
          <div className="flex items-center gap-4">
            <a
              href="#arbeiten"
              className="hidden sm:block text-sm text-muted hover:text-foreground transition-colors"
            >
              Arbeiten
            </a>
            <a
              href="#preise"
              className="hidden sm:block text-sm text-muted hover:text-foreground transition-colors"
            >
              Preise
            </a>
            <a
              href="#kontakt"
              className="text-sm font-medium bg-foreground text-background px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
            >
              Gespräch buchen
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left: Text */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-block bg-foreground/10 text-sm px-4 py-2 rounded-full mb-6"
              >
                Für Unternehmer, die mehr brauchen als Tools
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
              >
                Ich baue Systeme,
                <br />
                <span className="italic font-serif font-normal">die es noch nicht gibt.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-muted mb-8 max-w-lg"
              >
                Datenbanken. Automationen. Shops. Alles verbunden.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <a
                  href="#kontakt"
                  className="inline-flex items-center justify-center h-14 px-8 bg-foreground text-background font-medium rounded-full hover:opacity-90 transition-opacity"
                >
                  Gespräch buchen
                </a>
                <a
                  href="#so-funktionierts"
                  className="inline-flex items-center justify-center h-14 px-8 border border-border font-medium rounded-full hover:border-foreground/30 transition-colors"
                >
                  So funktioniert&apos;s
                </a>
              </motion.div>
            </div>

            {/* Right: Value Props Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="bg-foreground text-background rounded-3xl p-8 sm:p-10">
                <div className="space-y-6 mb-8">
                  <div className="flex items-center gap-4">
                    <Cog className="w-5 h-5" />
                    <p className="font-medium">Supabase, n8n, Shopify</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Zap className="w-5 h-5" />
                    <p className="font-medium">Systeme, die mitwachsen</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <User className="w-5 h-5" />
                    <p className="font-medium">Ein Entwickler, kein Team</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-background/20">
                  <p className="text-background/60 text-sm">
                    Ab CHF 1&apos;500 (Projekt) · Ab CHF 990/Mt (Monatlich)
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem Section - Word by Word Reveal */}
      <section
        ref={problemRef}
        className="relative h-[300vh] border-t border-border"
      >
        <div className="sticky top-0 h-screen flex flex-col items-center justify-center px-6">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-sm uppercase tracking-widest text-muted mb-8"
          >
            Das Problem
          </motion.p>

          <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium text-center max-w-5xl leading-relaxed">
            {allWords.map((word, index) => {
              const start = index / totalWords;
              const end = (index + 1) / totalWords;

              return (
                <Word key={index} progress={scrollYProgress} range={[start, end]}>
                  {word}
                </Word>
              );
            })}
          </p>
        </div>
      </section>

      {/* What I build Section */}
      <section className="py-32 bg-foreground text-background">
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl sm:text-5xl font-bold tracking-tight mb-4"
          >
            Was ich <span className="italic font-serif font-normal">baue</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-background/70 text-lg"
          >
            Nicht Teile. Das Ganze.
          </motion.p>
        </div>

        {/* Horizontal Scroll */}
        <div className="overflow-x-auto pb-6">
          <div className="flex gap-6 px-6 w-max">
            {serviceItems.map((service, index) => (
              <ServiceCard
                key={index}
                icon={service.icon}
                title={service.title}
                shortDesc={service.shortDesc}
                example={service.example}
                details={service.details}
                index={index}
              />
            ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-6">
          <p className="text-background/40 text-sm">← Scroll für mehr</p>
        </div>
      </section>

      {/* How it works */}
      <section id="so-funktionierts" className="py-32 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-16"
          >
            So funktioniert&apos;s
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              viewport={{ once: true }}
              className="bg-white dark:bg-zinc-900 border border-border rounded-3xl p-10 hover:shadow-xl transition-all duration-300"
            >
              <div className="w-14 h-14 bg-foreground text-background rounded-2xl flex items-center justify-center text-xl font-bold mb-8">
                1
              </div>
              <h3 className="text-2xl font-bold mb-4">Gespräch</h3>
              <p className="text-muted">
                20 Minuten. Du erzählst, was nervt und was fehlt. Ich höre zu und stelle Fragen. Kein Pitch, kein Bullshit.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-zinc-900 border border-border rounded-3xl p-10 hover:shadow-xl transition-all duration-300"
            >
              <div className="w-14 h-14 bg-foreground text-background rounded-2xl flex items-center justify-center text-xl font-bold mb-8">
                2
              </div>
              <h3 className="text-2xl font-bold mb-4">Umsetzung</h3>
              <p className="text-muted">
                Ich baue. Du machst was anderes. Regelmässige Updates, keine Überraschungen. Du siehst den Fortschritt.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-foreground text-background rounded-3xl p-10 hover:shadow-xl transition-all duration-300"
            >
              <div className="w-14 h-14 bg-background text-foreground rounded-2xl flex items-center justify-center text-xl font-bold mb-8">
                3
              </div>
              <h3 className="text-2xl font-bold mb-4">Läuft</h3>
              <p className="text-background/70">
                System arbeitet. Ab Tag 1. Ich zeige dir alles, beantworte Fragen und bin da, wenn was ist.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 px-6 bg-foreground text-background">
        <div className="max-w-6xl mx-auto">
          {/* Numbers */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <p className="text-5xl sm:text-6xl font-bold mb-2">100+</p>
              <p className="text-background/60">Webseiten</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <p className="text-5xl sm:text-6xl font-bold mb-2">15</p>
              <p className="text-background/60">Jahre Erfahrung</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <p className="text-5xl sm:text-6xl font-bold mb-2">1</p>
              <p className="text-background/60">Ansprechpartner</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <p className="text-5xl sm:text-6xl font-bold mb-2">48h</p>
              <p className="text-background/60">Lieferung</p>
            </motion.div>
          </div>

          {/* Quote Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-background/10 rounded-3xl p-10 sm:p-14 mb-16"
          >
            <Quote className="w-10 h-10 text-background/30 mb-6" />
            <p className="text-2xl sm:text-3xl font-medium leading-relaxed mb-8 text-background/80">
              &ldquo;Hier kommt ein Kundenzitat hin. Etwas Echtes von jemandem, der mit Pierre gearbeitet hat.&rdquo;
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-background/20" />
              <div>
                <p className="font-semibold">Kundenname</p>
                <p className="text-background/60 text-sm">Firma / Position</p>
              </div>
            </div>
          </motion.div>

          {/* Logo Placeholders */}
          <div className="text-center">
            <p className="text-background/40 text-sm uppercase tracking-widest mb-8">Projekte für</p>
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
              {[1, 2, 3, 4, 5].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="w-24 h-12 bg-background/10 rounded-lg flex items-center justify-center"
                >
                  <span className="text-background/30 text-xs">Logo {i}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Preview */}
      <section id="arbeiten" className="py-32 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold text-center mb-12"
          >
            Arbeiten
          </motion.h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolioItems.map((item, index) => (
              <PortfolioItem
                key={index}
                title={item.title}
                category={item.category}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="preise" className="py-32 px-6 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-12"
          >
            Preise
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-6">
            <PricingCard
              title="Projekt"
              price="Ab 1'500"
              period=" CHF"
              description="Einmal richtig."
              features={[
                "Fixpreis",
                "Revisionen inklusive",
                "Support inklusive",
              ]}
              cta="Projekt besprechen"
              example="Website für einen Schreinerbetrieb. Design, Texte, Bilder – in einer Woche online."
              delay={0}
            />

            <PricingCard
              title="Monatlich"
              price="990"
              period=" CHF/Mt"
              description="Ich wachse mit."
              features={[
                "Eine Anfrage zur Zeit",
                "48h Lieferung",
                "Pausieren jederzeit",
              ]}
              cta="Monatlich starten"
              example="Laufende Betreuung für einen Eventveranstalter. Buchungen, Zahlungen, Support – ich halte alles am Laufen."
              featured
              delay={0.1}
            />

            <PricingCard
              title="Partner"
              price="2'500"
              period=" CHF/Mt"
              description="Dein Mann fürs Digitale."
              features={[
                "Unbegrenzte Anfragen",
                "Priorität",
                "Grössere Projekte",
              ]}
              cta="Partner werden"
              example="Komplettsystem für einen Betrieb mit 3 Standorten. Dashboard, Datenbank, Automationen – plus alles, was noch kommt."
              delay={0.2}
            />
          </div>

        </div>
      </section>

      {/* About */}
      <section className="py-32 px-6 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Photo placeholder */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="aspect-square bg-zinc-200 dark:bg-zinc-800 rounded-3xl flex items-center justify-center"
            >
              <span className="text-6xl font-bold text-foreground/10">P</span>
            </motion.div>

            {/* Text */}
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl sm:text-4xl font-bold mb-6"
              >
                Ich bin Pierre.
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="space-y-4 text-muted"
              >
                <p>
                  Ich baue das AcademyBoard für ParkourONE. RubikONE habe ich entwickelt.
                  Mein eigener Shop läuft auf Shopify mit eigener Marke.
                </p>
                <p>
                  Supabase. n8n. Make. Shopify. Next.js. Das ist mein Stack.
                  Keine PowerPoints. Keine Beratung. Ich baue.
                </p>
                <p>
                  Wenn du ein Tool suchst, das es schon gibt – Google es.
                  Wenn du ein System brauchst, das es noch nicht gibt – ruf mich an.
                </p>
                <p className="text-foreground font-medium pt-2">
                  Du redest mit mir. Nicht mit einem Verkäufer.
                  Mit dem, der es baut.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Full-Width Statement */}
      <section className="py-32 px-6 bg-zinc-100 dark:bg-zinc-900 border-y border-border">
        <div className="max-w-5xl mx-auto text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight"
          >
            Keine Agentur.
            <br />
            <span className="text-muted">Kein Team.</span>
            <br />
            <span className="italic font-serif font-normal">Nur ich.</span>
          </motion.p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-32 px-6 bg-foreground text-background">
        <div className="max-w-3xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-12 text-center"
          >
            Fragen
          </motion.h2>

          <div>
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-background/20">
                <button
                  onClick={() => {
                    const el = document.getElementById(`faq-${index}`);
                    if (el) el.classList.toggle("hidden");
                  }}
                  className="w-full py-6 flex items-center justify-between text-left hover:opacity-70 transition-opacity"
                >
                  <span className="text-lg sm:text-xl font-medium pr-8">{faq.question}</span>
                  <span className="text-2xl flex-shrink-0">+</span>
                </button>
                <div id={`faq-${index}`} className="hidden pb-6">
                  <p className="text-background/70 max-w-2xl">{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="kontakt" className="py-32 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
              >
                Du weisst, was
                <br />
                <span className="italic font-serif font-normal">du brauchst.</span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-muted text-lg"
              >
                20 Minuten. Ich höre zu. Dann sag ich dir, ob ich der Richtige bin.
              </motion.p>
            </div>

            {/* Calendar Placeholder */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-foreground text-background rounded-3xl p-8"
            >
              <div className="aspect-[4/3] bg-background/10 rounded-2xl flex items-center justify-center mb-6">
                <div className="text-center">
                  <p className="text-background/60 text-sm mb-2">Kalender-Widget</p>
                  <p className="font-semibold">Cal.com / Calendly</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-background/60">Lieber per E-Mail?</span>
                <a
                  href="mailto:hallo@laeuft.ch"
                  className="font-medium hover:underline"
                >
                  hallo@laeuft.ch
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-foreground text-background border-t border-background/10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-background/60">
          <span>Läuft. – Wallis, Schweiz</span>
          <div className="flex items-center gap-6">
            <a
              href="/impressum"
              className="hover:text-background transition-colors"
            >
              Impressum
            </a>
            <a
              href="/datenschutz"
              className="hover:text-background transition-colors"
            >
              Datenschutz
            </a>
          </div>
        </div>
      </footer>

      {/* Floating CTA */}
      <AnimatePresence>
        {showFloatingCTA && (
          <motion.a
            href="#kontakt"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 bg-foreground text-background px-6 py-3 rounded-full font-medium shadow-lg hover:shadow-xl transition-shadow flex items-center gap-2"
          >
            Gespräch buchen
            <ArrowUp className="w-4 h-4 rotate-45" />
          </motion.a>
        )}
      </AnimatePresence>
    </main>
  );
}

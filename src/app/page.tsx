"use client";

import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useState, useRef } from "react";
import { Zap, Clock, User, RefreshCw, Check, Cog, Globe, Sparkles, Smartphone } from "lucide-react";

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
  featured = false,
  delay = 0,
}: {
  title: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  featured?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className={`rounded-3xl p-8 h-full flex flex-col ${
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
      <ul className="space-y-3 mb-8 flex-grow">
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
        className={`block w-full text-center py-4 rounded-xl font-medium transition-opacity hover:opacity-90 ${
          featured
            ? "bg-background text-foreground"
            : "bg-foreground text-background"
        }`}
      >
        {cta}
      </a>
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
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="group cursor-pointer"
    >
      <div className="aspect-[4/3] bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800 rounded-2xl mb-4 overflow-hidden relative">
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors" />
      </div>
      <p className="text-sm text-muted mb-1">{category}</p>
      <h3 className="font-semibold">{title}</h3>
    </motion.div>
  );
}

export default function Home() {
  const problemRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: problemRef,
    offset: ["start start", "end end"],
  });

  const problemStatements = [
    "Montagmorgen.",
    "47 E-Mails.",
    "Die Hälfte davon hättest du nicht gebraucht.",
    "Daten kopieren.",
    "Von Hand.",
    "Jeden Tag.",
    "Der Chef entscheidet alles.",
    "Weil das System es nicht kann.",
    "Du bist nicht langsam.",
    "Deine Systeme sind es.",
  ];

  const allWords = problemStatements.join(" ").split(" ");
  const totalWords = allWords.length;

  const faqs = [
    {
      question: "Was genau automatisiert ihr?",
      answer:
        "Alles, was sich wiederholt und Zeit frisst. E-Mail-Workflows, Angebotserstellung, Kundenkommunikation, Datenübertragung zwischen Systemen, Terminbuchungen, Rechnungsstellung. Wir schauen uns deinen Alltag an und finden die Stellen, wo du Stunden verlierst.",
    },
    {
      question: "Brauche ich technisches Wissen?",
      answer:
        "Nein. Du erzählst mir, was nervt. Ich baue die Lösung. Du bekommst etwas, das funktioniert – keine Schulung, kein Handbuch, kein Selbststudium nötig.",
    },
    {
      question: "Wie schnell sehe ich Resultate?",
      answer:
        "Die meisten Automatisierungen sind in 1-2 Wochen live. Ab Tag 1 sparst du Zeit. Bei grösseren Projekten wie Shops oder Datenbanksystemen reden wir von 4-8 Wochen.",
    },
    {
      question: "Was ist der Unterschied zwischen Projekt und Abo?",
      answer:
        "Projekt = einmalig. Du hast ein konkretes Problem, wir lösen es, fertig. Abo = laufend. Du hast regelmässig Bedarf, ich bin dein Mann für alles Digitale. Die meisten starten mit einem Projekt und wechseln dann ins Abo.",
    },
    {
      question: "Kann ich das Abo pausieren oder kündigen?",
      answer:
        "Jederzeit. Monatlich kündbar, keine Mindestlaufzeit. Wenn du einen Monat weniger brauchst, pausierst du einfach. Die restlichen Tage verfallen nicht.",
    },
    {
      question: "Macht ihr auch Webseiten und Branding?",
      answer:
        "Ja. Webseiten, Shops, Logos, Branding, Social Media – alles was ein KMU digital braucht. Aber das Besondere an Läuft. ist die Automatisierung. Die Webseite macht dich sichtbar. Die Automatisierung macht dich schnell.",
    },
    {
      question: "Für wen ist das nichts?",
      answer:
        "Wenn du jemanden suchst, der dir erklärt, was du tun solltest – such dir einen Berater. Wenn du jemanden suchst, der PowerPoint-Präsentationen macht – such dir eine Agentur. Ich baue Dinge, die funktionieren. Keine Theorie, nur Resultate.",
    },
  ];

  const portfolioItems = [
    { title: "Automatische Angebotserstellung", category: "Automatisierung" },
    { title: "E-Commerce mit Lagersystem", category: "Shop" },
    { title: "KI-Kundenassistent", category: "KI" },
    { title: "Handwerksbetrieb Rebrand", category: "Branding" },
    { title: "Buchungssystem Praxis", category: "Automatisierung" },
    { title: "Startup Webseite", category: "Web" },
  ];

  return (
    <main className="min-h-screen bg-[#f5f5f5] dark:bg-zinc-950 text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#f5f5f5]/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-semibold tracking-tight">Läuft.</span>
          <div className="flex items-center gap-4">
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
                Für KMU, die keine Zeit zu verlieren haben
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
              >
                Dein Betrieb.
                <br />
                <span className="italic font-serif font-normal">Automatisiert.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-muted mb-8 max-w-lg"
              >
                Systeme, die arbeiten. Damit du es nicht musst.
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
                    <Zap className="w-5 h-5" />
                    <p className="font-medium">Weniger Handarbeit</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Clock className="w-5 h-5" />
                    <p className="font-medium">Stunden zurück pro Woche</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <User className="w-5 h-5" />
                    <p className="font-medium">Ein Ansprechpartner</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-background/20">
                  <p className="text-background/60 text-sm">
                    Ab CHF 1&apos;500 (Projekt) · Ab CHF 990/Mt (Abo)
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

      {/* Solution Section */}
      <section className="py-32 px-6 bg-foreground text-background">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-center mb-20"
          >
            Was wäre, wenn es
            <br />
            <span className="italic font-serif font-normal">einfach läuft?</span>
          </motion.h2>

          <div className="grid sm:grid-cols-3 gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-background/10 flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <p className="text-lg font-medium">Anfrage rein, Antwort raus</p>
              <p className="text-background/60 text-sm mt-2">Automatisch</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-background/10 flex items-center justify-center">
                <RefreshCw className="w-6 h-6" />
              </div>
              <p className="text-lg font-medium">Daten fliessen von selbst</p>
              <p className="text-background/60 text-sm mt-2">Kein Kopieren</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-background/10 flex items-center justify-center">
                <Check className="w-6 h-6" />
              </div>
              <p className="text-lg font-medium">Du siehst nur, was zählt</p>
              <p className="text-background/60 text-sm mt-2">Kein Rauschen</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* What I do Section */}
      <section className="py-32 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl sm:text-5xl font-bold tracking-tight mb-4"
            >
              Alles aus <span className="italic font-serif font-normal">einer Hand</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-muted text-lg"
            >
              Ein Ansprechpartner. Keine Agentur. Kein Chaos.
            </motion.p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-zinc-900 border border-border rounded-2xl p-6 text-center"
            >
              <Cog className="w-8 h-8 mx-auto mb-4" />
              <p className="font-semibold mb-1">Automatisierung</p>
              <p className="text-muted text-sm">Systeme, die arbeiten</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="bg-white dark:bg-zinc-900 border border-border rounded-2xl p-6 text-center"
            >
              <Globe className="w-8 h-8 mx-auto mb-4" />
              <p className="font-semibold mb-1">Web</p>
              <p className="text-muted text-sm">Seiten & Shops</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-zinc-900 border border-border rounded-2xl p-6 text-center"
            >
              <Sparkles className="w-8 h-8 mx-auto mb-4" />
              <p className="font-semibold mb-1">Branding</p>
              <p className="text-muted text-sm">Logo & Identität</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="bg-white dark:bg-zinc-900 border border-border rounded-2xl p-6 text-center"
            >
              <Smartphone className="w-8 h-8 mx-auto mb-4" />
              <p className="font-semibold mb-1">Social</p>
              <p className="text-muted text-sm">Strategie & Content</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="so-funktionierts" className="py-32 px-6 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-12"
          >
            So funktioniert&apos;s
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-zinc-900 border border-border rounded-2xl p-6"
            >
              <div className="w-10 h-10 bg-foreground text-background rounded-full flex items-center justify-center text-sm font-bold mb-4">
                1
              </div>
              <h3 className="text-lg font-bold mb-2">Gespräch</h3>
              <p className="text-muted text-sm">20 Minuten. Du erzählst, was nervt.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-zinc-900 border border-border rounded-2xl p-6"
            >
              <div className="w-10 h-10 bg-foreground text-background rounded-full flex items-center justify-center text-sm font-bold mb-4">
                2
              </div>
              <h3 className="text-lg font-bold mb-2">Umsetzung</h3>
              <p className="text-muted text-sm">Ich baue. Du machst was anderes.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-foreground text-background rounded-2xl p-6"
            >
              <div className="w-10 h-10 bg-background text-foreground rounded-full flex items-center justify-center text-sm font-bold mb-4">
                3
              </div>
              <h3 className="text-lg font-bold mb-2">Läuft</h3>
              <p className="text-background/70 text-sm">System arbeitet. Ab Tag 1.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Portfolio Preview */}
      <section className="py-32 px-6 border-t border-border">
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
              description="Einmalig"
              features={[
                "Fixpreis",
                "Revisionen inklusive",
                "Support inklusive",
              ]}
              cta="Projekt besprechen"
              delay={0}
            />

            <PricingCard
              title="Starter-Abo"
              price="990"
              period=" CHF/Mt"
              description="Laufend"
              features={[
                "Eine Anfrage zur Zeit",
                "48h Lieferung",
                "Pausieren jederzeit",
              ]}
              cta="Abo starten"
              featured
              delay={0.1}
            />

            <PricingCard
              title="Alles-Abo"
              price="2'500"
              period=" CHF/Mt"
              description="Unbegrenzt"
              features={[
                "Unbegrenzte Anfragen",
                "Priorität",
                "Grössere Projekte",
              ]}
              cta="Alles-Abo starten"
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

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-muted text-lg mb-6"
              >
                15 Jahre digitales Handwerk. Vom Grafikdesign zu Automationen.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 }}
                className="text-foreground font-medium"
              >
                Du redest mit mir. Nicht mit einem Verkäufer.
                <br />
                Mit dem, der es baut.
              </motion.p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-32 px-6 border-t border-border">
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
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="kontakt" className="py-32 px-6 bg-foreground text-background">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
              >
                Bereit?
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-background/70 text-lg"
              >
                20 Minuten. Unverbindlich.
              </motion.p>
            </div>

            {/* Calendar Placeholder */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-background text-foreground rounded-3xl p-8"
            >
              <div className="aspect-[4/3] bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-6">
                <div className="text-center">
                  <p className="text-muted text-sm mb-2">Kalender-Widget</p>
                  <p className="font-semibold">Cal.com / Calendly</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Lieber per E-Mail?</span>
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
    </main>
  );
}

"use client";

import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useState, useRef } from "react";

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

// Service Tag
function ServiceTag({ children }: { children: string }) {
  return (
    <span className="inline-block px-4 py-2 bg-white dark:bg-zinc-800 rounded-full text-sm font-medium border border-border hover:border-foreground/30 transition-colors cursor-default">
      {children}
    </span>
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
                Ich baue Systeme, die arbeiten. Damit du es nicht musst.
                Weniger Handarbeit. Mehr Zeit fürs Wesentliche.
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
                <h2 className="text-2xl font-bold mb-6">Was du bekommst:</h2>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-background/20 flex items-center justify-center shrink-0 mt-1">
                      <span className="text-sm">1</span>
                    </div>
                    <div>
                      <p className="font-medium">Systeme, die Arbeit abnehmen</p>
                      <p className="text-background/60 text-sm">
                        Automatisierte Abläufe statt Handarbeit
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-background/20 flex items-center justify-center shrink-0 mt-1">
                      <span className="text-sm">2</span>
                    </div>
                    <div>
                      <p className="font-medium">Zeit zurück</p>
                      <p className="text-background/60 text-sm">
                        Stunden pro Woche, nicht Minuten
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-background/20 flex items-center justify-center shrink-0 mt-1">
                      <span className="text-sm">3</span>
                    </div>
                    <div>
                      <p className="font-medium">Einen Ansprechpartner</p>
                      <p className="text-background/60 text-sm">
                        Kein Agentur-Chaos, keine Praktikanten
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-background/20">
                  <p className="text-background/60 text-sm mb-2">
                    Projekte ab CHF 1&apos;500 · Abo ab CHF 990/Monat
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
      <section className="py-24 px-6 bg-foreground text-background">
        <div className="max-w-4xl mx-auto text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm uppercase tracking-widest text-background/60 mb-4"
          >
            Die Lösung
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-8"
          >
            Was wäre, wenn es
            <br />
            <span className="italic font-serif font-normal">einfach läuft?</span>
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="space-y-4 text-xl text-background/80 max-w-2xl mx-auto"
          >
            <p>Kundenanfrage rein. System antwortet. Du siehst nur, was wichtig ist.</p>
            <p>Angebot nötig? Drei Klicks. Raus.</p>
            <p>Daten fliessen automatisch. Kein Kopieren. Kein Suchen.</p>
            <p className="text-background font-medium pt-4">
              Das ist keine Zukunftsmusik. Das baue ich. In Wochen, nicht Monaten.
            </p>
          </motion.div>
        </div>
      </section>

      {/* What I do Section */}
      <section className="py-24 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left: Main service */}
            <div>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-sm uppercase tracking-widest text-muted mb-4"
              >
                Was ich mache
              </motion.p>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl sm:text-4xl font-bold tracking-tight mb-6"
              >
                Automatisierung
                <br />
                <span className="italic font-serif font-normal">ist der Kern</span>
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="space-y-4 text-muted mb-8"
              >
                <p>
                  Ich schaue mir an, wo du Zeit verlierst. Dann baue ich Systeme,
                  die diese Arbeit übernehmen. Keine Theorie, keine Beratung –
                  funktionierende Lösungen.
                </p>
                <p>
                  E-Mail-Workflows. Automatische Angebote. KI-Assistenten.
                  Datenbank-Systeme. Alles, was sich wiederholt und Zeit frisst.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-zinc-900 border border-border rounded-2xl p-6"
              >
                <p className="font-medium mb-2">Typisches Resultat:</p>
                <p className="text-muted text-sm">
                  &quot;Ich spare 8 Stunden pro Woche. Das System macht jetzt, was
                  ich früher von Hand gemacht habe.&quot;
                </p>
              </motion.div>
            </div>

            {/* Right: Additional services */}
            <div>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-sm uppercase tracking-widest text-muted mb-4"
              >
                Und sonst noch
              </motion.p>

              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-2xl font-bold mb-6"
              >
                Alles, was ein KMU
                <br />
                digital braucht
              </motion.h3>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="flex flex-wrap gap-2 mb-6"
              >
                {[
                  "Webseiten",
                  "Webshops",
                  "Branding",
                  "Logos",
                  "Social Media",
                  "KI-Assistenten",
                  "Datenbanken",
                  "Präsentationen",
                  "Newsletter",
                ].map((service) => (
                  <ServiceTag key={service}>{service}</ServiceTag>
                ))}
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-muted"
              >
                Die Webseite macht dich sichtbar. Das Branding macht dich
                erkennbar. Aber die Automatisierung macht dich schnell.{" "}
                <span className="text-foreground font-medium">
                  Das ist der Unterschied.
                </span>
              </motion.p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="so-funktionierts" className="py-24 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-sm uppercase tracking-widest text-muted mb-4"
            >
              So funktioniert&apos;s
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl font-bold tracking-tight"
            >
              Drei Schritte.{" "}
              <span className="italic font-serif font-normal">Dann läuft&apos;s.</span>
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-zinc-900 border border-border rounded-3xl p-8"
            >
              <div className="w-12 h-12 bg-foreground text-background rounded-full flex items-center justify-center text-lg font-bold mb-6">
                1
              </div>
              <h3 className="text-xl font-bold mb-3">Gespräch</h3>
              <p className="text-muted">
                Du erzählst mir, was nervt. Wo du Zeit verlierst. Was besser
                laufen müsste. 20 Minuten reichen.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-zinc-900 border border-border rounded-3xl p-8"
            >
              <div className="w-12 h-12 bg-foreground text-background rounded-full flex items-center justify-center text-lg font-bold mb-6">
                2
              </div>
              <h3 className="text-xl font-bold mb-3">Umsetzung</h3>
              <p className="text-muted">
                Ich baue die Lösung. Du schaust zu oder machst was anderes.
                Keine Workshops, keine Schulungen.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-foreground text-background rounded-3xl p-8"
            >
              <div className="w-12 h-12 bg-background text-foreground rounded-full flex items-center justify-center text-lg font-bold mb-6">
                3
              </div>
              <h3 className="text-xl font-bold mb-3">Läuft</h3>
              <p className="text-background/70">
                Das System arbeitet. Du hast Zeit für das, wofür du mal
                angetreten bist. Ab Tag 1.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Portfolio Preview */}
      <section className="py-24 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-sm uppercase tracking-widest text-muted mb-2">
                Referenzen
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold">Letzte Arbeiten</h2>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
      <section id="preise" className="py-24 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-sm uppercase tracking-widest text-muted mb-4"
            >
              Preise
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4"
            >
              Klar.{" "}
              <span className="italic font-serif font-normal">Fair.</span>{" "}
              Transparent.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-muted max-w-xl mx-auto"
            >
              Keine versteckten Kosten. Du weisst vorher, was es kostet –
              und was es dir bringt.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <PricingCard
              title="Projekt"
              price="Ab 1'500"
              period=" CHF"
              description="Einmalig. Ein Problem, eine Lösung. Ideal für konkrete Vorhaben."
              features={[
                "Fixpreis nach Gespräch",
                "Automatisierung, Web oder Branding",
                "Revisionen inklusive",
                "Support nach Abschluss",
              ]}
              cta="Projekt besprechen"
              delay={0}
            />

            <PricingCard
              title="Starter-Abo"
              price="990"
              period=" CHF/Monat"
              description="Für regelmässigen Bedarf. Ideal zum Einstieg."
              features={[
                "Laufende Anfragen",
                "Eine Anfrage zur Zeit",
                "Durchschnittlich 48h Lieferung",
                "Pausieren jederzeit",
                "Monatlich kündbar",
              ]}
              cta="Abo starten"
              featured
              delay={0.1}
            />

            <PricingCard
              title="Alles-Abo"
              price="2'500"
              period=" CHF/Monat"
              description="Für Vielnutzer. Ich bin dein Mann für alles Digitale."
              features={[
                "Unbegrenzte Anfragen",
                "Priorität bei Umsetzung",
                "Grössere Projekte inklusive",
                "Strategische Beratung",
                "Direkte Kommunikation",
              ]}
              cta="Alles-Abo starten"
              delay={0.2}
            />
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-muted mt-8 text-sm"
          >
            Nicht sicher, was passt? Lass uns reden. 20 Minuten, unverbindlich.
          </motion.p>
        </div>
      </section>

      {/* About */}
      <section className="py-24 px-6 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
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
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-sm uppercase tracking-widest text-muted mb-4"
              >
                Über mich
              </motion.p>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl font-bold mb-6"
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
                  15 Jahre digitales Handwerk. Angefangen mit Pixeln. Heute:
                  Systeme, die Betriebe schneller machen.
                </p>
                <p>
                  Der Weg war nie geplant: Grafikdesign führte zu Shops. Shops zu
                  Datenbanken. Datenbanken zu Automationen.
                </p>
                <p>
                  Ich habe gesehen, wie Unternehmen an ihren eigenen Systemen
                  scheitern. Nicht weil sie schlecht sind. Sondern weil niemand
                  Zeit hatte, es richtig aufzusetzen.
                </p>
                <p className="text-foreground font-medium">
                  Ich arbeite allein. Das bedeutet: Du redest mit mir. Nicht mit
                  einem Verkäufer. Mit dem, der es baut.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
            <div>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-sm uppercase tracking-widest text-muted mb-4"
              >
                FAQ
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight sticky top-24"
              >
                <span className="italic font-serif font-normal">Häufig</span>{" "}
                gestellte
                <br />
                Fragen
              </motion.h2>
            </div>

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
        </div>
      </section>

      {/* CTA */}
      <section id="kontakt" className="py-24 px-6 bg-foreground text-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
              >
                Bereit?
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="space-y-4 text-background/70 text-lg"
              >
                <p>Ein Gespräch. 20 Minuten. Kein Verkaufspitch.</p>
                <p>
                  Du erzählst, was nervt. Ich sage dir ehrlich, ob ich helfen
                  kann – und was es kosten würde.
                </p>
                <p className="text-background">
                  Wenn ja: In wenigen Wochen läuft&apos;s.
                  <br />
                  Wenn nein: Du hast 20 Minuten investiert und weisst Bescheid.
                </p>
              </motion.div>
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

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

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

// Benefit Card
function BenefitCard({
  title,
  description,
  index,
}: {
  title: string;
  description: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="flex-shrink-0 w-64 sm:w-72"
    >
      {/* Placeholder Image */}
      <div className="aspect-square bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800 rounded-2xl mb-4 flex items-center justify-center">
        <div className="w-16 h-16 bg-foreground/10 rounded-xl" />
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted text-sm">{description}</p>
    </motion.div>
  );
}

// Portfolio Item
function PortfolioItem({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="group cursor-pointer"
    >
      <div className="aspect-[4/3] bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800 rounded-2xl mb-4 overflow-hidden relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-bold text-foreground/10">
            {index + 1}
          </span>
        </div>
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors" />
      </div>
    </motion.div>
  );
}

export default function Home() {
  const services = [
    "Webseiten",
    "Webshops",
    "Branding",
    "Logos",
    "Social Media",
    "Automationen",
    "KI-Assistenten",
    "Präsentationen",
    "Flyer",
    "Visitenkarten",
    "Newsletter",
    "SEO",
  ];

  const benefits = [
    {
      title: "Fixpreis",
      description: "Keine Überraschungen. Du weisst vorher, was es kostet.",
    },
    {
      title: "Schnelle Lieferung",
      description: "Die meisten Anfragen sind in wenigen Tagen erledigt.",
    },
    {
      title: "Alles aus einer Hand",
      description: "Web, Branding, Social, Automatisierung. Ein Ansprechpartner.",
    },
    {
      title: "Flexibel",
      description: "Pausieren oder kündigen jederzeit. Keine Knebelverträge.",
    },
    {
      title: "Senior-Qualität",
      description: "15 Jahre Erfahrung. Kein Junior, kein Outsourcing.",
    },
  ];

  const faqs = [
    {
      question: "Wie schnell bekomme ich meine Anfrage?",
      answer:
        "Die meisten Anfragen sind innerhalb von 2-5 Werktagen erledigt. Komplexere Projekte wie komplette Webseiten dauern entsprechend länger – das besprechen wir vorab.",
    },
    {
      question: "Was ist, wenn mir das Ergebnis nicht gefällt?",
      answer:
        "Kein Problem. Wir überarbeiten so lange, bis du zufrieden bist. Revisionen sind im Preis inbegriffen.",
    },
    {
      question: "Wie funktioniert die Zusammenarbeit?",
      answer:
        "Du schickst mir deine Anfrage per E-Mail oder über ein einfaches Board. Ich arbeite daran und liefere. Keine komplizierten Tools, keine unnötigen Meetings.",
    },
    {
      question: "Kann ich auch einzelne Projekte beauftragen?",
      answer:
        "Ja. Neben dem monatlichen Abo biete ich auch Einzelprojekte an. Ideal für einmalige Sachen wie ein Logo oder eine Landingpage.",
    },
    {
      question: "Wer steckt hinter Läuft?",
      answer:
        "Ich bin Pierre. Seit 15 Jahren im digitalen Handwerk. Ich arbeite allein – das heisst, du redest immer direkt mit dem, der es umsetzt.",
    },
    {
      question: "Arbeitest du auch mit Unternehmen ausserhalb des Wallis?",
      answer:
        "Klar. Die meiste Kommunikation läuft digital. Ob Zürich, Bern oder sonstwo – funktioniert genauso gut.",
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
              href="#pricing"
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
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
              >
                Alles für KMU.
                <br />
                <span className="italic font-serif font-normal">Aus einer Hand.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-lg text-muted mb-2"
              >
                Pausieren oder kündigen jederzeit.
              </motion.p>
            </div>

            {/* Right: Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <div className="bg-foreground text-background rounded-3xl p-8 sm:p-10">
                {/* Placeholder Image Area */}
                <div className="absolute -top-6 -right-6 w-32 h-24 bg-zinc-300 dark:bg-zinc-600 rounded-2xl rotate-6 hidden lg:block" />

                <div className="relative">
                  <div className="inline-block bg-background/20 text-sm px-3 py-1 rounded-full mb-6">
                    Jetzt starten
                  </div>

                  <h2 className="text-3xl sm:text-4xl font-bold mb-2">
                    Läuft.
                  </h2>
                  <p className="text-background/70 mb-8">
                    Ein Abo. Alles drin.
                  </p>

                  <a
                    href="#pricing"
                    className="block w-full bg-background text-foreground text-center py-4 rounded-xl font-medium hover:opacity-90 transition-opacity mb-4"
                  >
                    Preise ansehen
                  </a>

                  <a
                    href="#kontakt"
                    className="flex items-center justify-between text-sm text-background/70 hover:text-background transition-colors"
                  >
                    <span>15-Minuten Intro-Call buchen</span>
                    <span>→</span>
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Tagline */}
      <section className="py-16 px-6 border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            So{" "}
            <span className="italic font-serif font-normal">hätte es</span>
            <br />
            schon immer sein sollen
          </h2>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-zinc-200 dark:bg-zinc-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden"
            >
              <div className="aspect-video bg-zinc-300 dark:bg-zinc-700 rounded-2xl mb-6 flex items-center justify-center">
                <span className="text-4xl font-bold text-foreground/20">1</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Anfragen</h3>
              <p className="text-muted text-sm">
                Schick mir so viele Anfragen wie du willst. Web, Branding, Social – alles.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-zinc-300 dark:bg-zinc-700 rounded-3xl p-6 sm:p-8 relative overflow-hidden"
            >
              <div className="aspect-video bg-zinc-400 dark:bg-zinc-600 rounded-2xl mb-6 flex items-center justify-center flex-wrap gap-2 p-4">
                {["Web", "Logo", "Social", "Flyer"].map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-background/80 rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h3 className="text-xl font-bold mb-2">Umsetzen</h3>
              <p className="text-muted text-sm">
                Ich arbeite daran. Eine Anfrage nach der anderen. Schnell und gründlich.
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-foreground text-background rounded-3xl p-6 sm:p-8 relative overflow-hidden"
            >
              <div className="aspect-video bg-background/10 rounded-2xl mb-6 flex items-center justify-center">
                <span className="text-4xl">✓</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Erhalten</h3>
              <p className="text-background/70 text-sm">
                Du bekommst dein Ergebnis. Revisionen inklusive. Bis du zufrieden bist.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Client Logos */}
      <section className="py-12 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 opacity-50">
            {["Kunde 1", "Kunde 2", "Kunde 3", "Kunde 4", "Kunde 5"].map(
              (client) => (
                <span key={client} className="text-lg font-semibold">
                  {client}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 sm:p-12 text-center border border-border">
            <p className="text-lg sm:text-xl text-muted leading-relaxed">
              Läuft. ist eine Ein-Mann-Agentur, geführt von{" "}
              <span className="text-foreground font-medium underline">Pierre</span>.
              Ich arbeite nicht mit anderen Designern oder Entwicklern zusammen und
              outsource nichts. Du arbeitest direkt mit mir – von Anfang bis Ende.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm uppercase tracking-widest text-muted mb-4">
              Vorteile
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Es ist{" "}
              <span className="italic font-serif font-normal">
                &quot;nie wieder anders&quot;
              </span>{" "}
              gut
            </h2>
            <p className="text-muted mt-4 max-w-xl mx-auto">
              Läuft. ersetzt unzuverlässige Freelancer und teure Agenturen.
              Für einen fixen Monatspreis.
            </p>
          </div>

          {/* Horizontal scroll on mobile */}
          <div className="flex gap-6 overflow-x-auto pb-4 -mx-6 px-6 snap-x">
            {benefits.map((benefit, index) => (
              <BenefitCard
                key={index}
                title={benefit.title}
                description={benefit.description}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Portfolio preview */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="aspect-[3/4] bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
                <div className="aspect-[3/4] bg-zinc-300 dark:bg-zinc-700 rounded-2xl mt-8" />
              </div>
            </motion.div>

            {/* Right: Services */}
            <div>
              <div className="flex flex-wrap gap-2 mb-8">
                {services.map((service) => (
                  <ServiceTag key={service}>{service}</ServiceTag>
                ))}
                <span className="inline-block px-4 py-2 text-sm text-muted">
                  + mehr
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Web, Branding,
                <br />
                Automatisierung & mehr
              </h2>
              <p className="text-muted">
                Alles was du brauchst. Unter einem Dach.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Work */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold">Letzte Arbeiten</h2>
              <p className="text-muted mt-2">
                Ein Auszug aus aktuellen Projekten.
              </p>
            </div>
            <a
              href="#"
              className="hidden sm:inline-flex items-center gap-2 bg-foreground text-background px-5 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Alle ansehen
            </a>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <PortfolioItem key={index} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm uppercase tracking-widest text-muted mb-4">
              Preise
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Ein Abo,
              <br />
              <span className="italic font-serif font-normal">
                endlose Möglichkeiten
              </span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-center max-w-5xl mx-auto">
            {/* Left: Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="aspect-square bg-zinc-200 dark:bg-zinc-800 rounded-3xl flex items-center justify-center"
            >
              <span className="text-6xl font-bold text-foreground/10">Läuft.</span>
            </motion.div>

            {/* Right: Pricing Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-foreground text-background rounded-3xl p-8 sm:p-10"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">Monats-Abo</h3>
                <span className="text-sm bg-background/20 px-3 py-1 rounded-full">
                  Jederzeit kündbar
                </span>
              </div>

              <div className="border-t border-background/20 pt-6 mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl sm:text-6xl font-bold">CHF 2&apos;500</span>
                  <span className="text-background/70">/Monat</span>
                </div>
              </div>

              <div className="bg-background/10 rounded-2xl p-6 mb-6">
                <p className="text-sm uppercase tracking-widest text-background/50 mb-4">
                  Inklusive
                </p>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 bg-background rounded-full" />
                    Unbegrenzte Anfragen
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 bg-background rounded-full" />
                    Eine Anfrage zur Zeit
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 bg-background rounded-full" />
                    Durchschnittlich 48h Lieferung
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 bg-background rounded-full" />
                    Unbegrenzte Revisionen
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 bg-background rounded-full" />
                    Pausieren jederzeit möglich
                  </li>
                </ul>
              </div>

              <a
                href="#kontakt"
                className="block w-full bg-background text-foreground text-center py-4 rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                Jetzt starten
              </a>
            </motion.div>
          </div>

          {/* Additional options */}
          <div className="grid sm:grid-cols-2 gap-6 mt-8 max-w-5xl mx-auto">
            <div className="bg-white dark:bg-zinc-900 border border-border rounded-2xl p-6">
              <h4 className="font-semibold mb-2">Pausieren jederzeit</h4>
              <p className="text-muted text-sm">
                Nicht genug Arbeit für einen Monat? Pausiere dein Abo und nutze
                die restlichen Tage später.
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-border rounded-2xl p-6">
              <h4 className="font-semibold mb-2">Einzelprojekte</h4>
              <p className="text-muted text-sm">
                Nur ein Logo oder eine Landingpage? Kein Problem. Fixpreis,
                einmalig.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Left: Title */}
            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight sticky top-24">
                <span className="italic font-serif font-normal">Häufig</span>{" "}
                gestellte
                <br />
                Fragen
              </h2>
            </div>

            {/* Right: FAQ Items */}
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
      <section
        id="kontakt"
        className="py-20 px-6 bg-foreground text-background"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                Finde heraus, ob
                <br />
                <span className="italic font-serif font-normal">
                  Läuft. zu dir passt
                </span>
              </h2>
              <p className="text-background/70 text-lg">
                15 Minuten. Unverbindlich. Ich zeige dir, wie es funktioniert.
              </p>
            </div>

            {/* Right: Calendar Placeholder */}
            <div className="bg-background text-foreground rounded-3xl p-6 sm:p-8">
              <div className="aspect-[4/3] bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-6">
                <div className="text-center">
                  <p className="text-muted text-sm mb-2">Kalender-Widget</p>
                  <p className="font-semibold">Calendly / Cal.com</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Oder per E-Mail:</span>
                <a
                  href="mailto:hallo@laeuft.ch"
                  className="font-medium hover:underline"
                >
                  hallo@laeuft.ch
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-foreground text-background border-t border-background/10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-background/60">
          <span>Läuft. – Wallis, Schweiz</span>
          <div className="flex items-center gap-6">
            <a href="/impressum" className="hover:text-background transition-colors">
              Impressum
            </a>
            <a href="/datenschutz" className="hover:text-background transition-colors">
              Datenschutz
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

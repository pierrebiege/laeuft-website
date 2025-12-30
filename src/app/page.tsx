"use client";

import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const letterAnimation = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// Navigation component
function Navigation() {
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setHidden(currentScrollY > lastScrollY && currentScrollY > 100);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <motion.nav
      initial={{ y: 0 }}
      animate={{ y: hidden ? -100 : 0 }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md"
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <span className="text-xl font-semibold tracking-tight">Läuft.</span>
        <a
          href="#kontakt"
          className="text-sm font-medium text-muted hover:text-foreground transition-colors relative group"
        >
          Kontakt
          <span className="absolute -bottom-1 left-0 w-0 h-px bg-foreground transition-all duration-300 group-hover:w-full" />
        </a>
      </div>
    </motion.nav>
  );
}

// Hero Section
function HeroSection() {
  const headline = "Euer Betrieb. Schneller.";

  return (
    <section className="min-h-screen flex items-center justify-center px-6 gradient-bg relative overflow-hidden">
      <div className="max-w-4xl mx-auto text-center">
        {/* Logo with pulsing dot */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-16"
        >
          <span className="text-6xl sm:text-7xl md:text-8xl font-bold tracking-tight inline-flex items-baseline">
            Läuft
            <span className="pulse-dot inline-block w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 bg-foreground rounded-full ml-1" />
          </span>
        </motion.div>

        {/* Headline with letter animation */}
        <motion.h1
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-8"
        >
          {headline.split("").map((char, index) => (
            <motion.span
              key={index}
              variants={letterAnimation}
              transition={{ duration: 0.3, delay: 1 + index * 0.03 }}
              className="inline-block"
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
        </motion.h1>

        {/* Subline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2, duration: 0.8 }}
          className="text-xl sm:text-2xl text-muted max-w-xl mx-auto mb-12"
        >
          Nicht irgendwann.
          <br />
          In 14 Tagen.
        </motion.p>

        {/* CTA Button */}
        <motion.a
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.6, duration: 0.5 }}
          href="#kontakt"
          className="inline-flex items-center justify-center h-14 px-8 bg-foreground text-background font-medium rounded-full btn-gradient transition-all duration-300 hover:scale-105"
        >
          Gespräch buchen
        </motion.a>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3, duration: 0.5 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-6 h-10 border-2 border-muted rounded-full flex justify-center pt-2"
          >
            <div className="w-1 h-2 bg-muted rounded-full" />
          </motion.div>
        </motion.div>
      </div>
    </section>
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

// Problem Section with Word-by-Word Reveal
function ProblemSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const statements = [
    "Montagmorgen. 47 E-Mails. Die Hälfte davon hättest du nicht gebraucht.",
    "Ihr kopiert Daten von A nach B. Von Hand. Jeden Tag.",
    "Irgendwo gibt es ein Dokument. Niemand weiss wo.",
    "Der Chef entscheidet alles. Weil das System es nicht kann.",
    "Ihr seid schnell. Eure Systeme nicht.",
    "Am Ende des Tages hast du gearbeitet. Aber nicht das, wofür du angetreten bist.",
  ];

  // Combine all statements into words with their indices
  const allWords: { word: string; isLastStatement: boolean }[] = [];
  statements.forEach((statement, statementIndex) => {
    const words = statement.split(" ");
    words.forEach((word) => {
      allWords.push({
        word,
        isLastStatement: statementIndex === statements.length - 1,
      });
    });
  });

  const totalWords = allWords.length;

  return (
    <section ref={containerRef} className="relative h-[400vh] border-t border-border">
      {/* Sticky container */}
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center px-6 py-20">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-xl sm:text-2xl font-medium text-muted mb-12"
        >
          Das kennt ihr.
        </motion.h2>

        <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium text-center max-w-5xl leading-relaxed">
          {allWords.map((item, index) => {
            const start = index / totalWords;
            const end = (index + 1) / totalWords;

            return (
              <span
                key={index}
                className={item.isLastStatement ? "font-bold" : ""}
              >
                <Word progress={scrollYProgress} range={[start, end]}>
                  {item.word}
                </Word>
                {/* Add line break before last statement */}
                {index === totalWords - 14 && (
                  <>
                    <br className="hidden sm:block" />
                    <br className="hidden sm:block" />
                  </>
                )}
              </span>
            );
          })}
        </p>
      </div>
    </section>
  );
}

// Solution Section
function SolutionSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-20%" });

  const solutions = [
    {
      title: "Anfrage rein",
      description: "System antwortet. Du siehst nur, was wichtig ist.",
    },
    {
      title: "Daten fliessen",
      description: "Automatisch. Ohne dass jemand kopiert.",
    },
    {
      title: "Du machst Feierabend",
      description: "Und das System arbeitet weiter.",
    },
  ];

  return (
    <section ref={ref} className="py-32 px-6 bg-background">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6"
        >
          Was wäre, wenn es einfach läuft?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl text-muted mb-20"
        >
          Kein Wunschtraum. Realität. In 14 Tagen.
        </motion.p>

        <div className="grid gap-12 md:grid-cols-3">
          {solutions.map((solution, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.15 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="group"
            >
              <div className="w-16 h-16 rounded-2xl bg-foreground/[0.05] flex items-center justify-center mb-6 group-hover:bg-foreground/[0.1] transition-colors">
                <div className="w-3 h-3 rounded-full bg-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{solution.title}</h3>
              <p className="text-muted">{solution.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Process Timeline Section
function ProcessSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const lineWidth = useTransform(scrollYProgress, [0.2, 0.8], ["0%", "100%"]);

  const steps = [
    {
      title: "Wir analysieren",
      description: "Ein Gespräch. Wir verstehen euren Betrieb.",
    },
    {
      title: "Wir bauen",
      description: "Keine Präsentationen. Funktionierende Systeme.",
    },
    {
      title: "Ihr spart Zeit",
      description: "Ab Tag 1. Messbar. Dauerhaft.",
    },
  ];

  return (
    <section ref={ref} className="py-32 px-6 border-t border-border overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl font-bold tracking-tight mb-20 text-center"
        >
          So funktioniert es.
        </motion.h2>

        {/* Timeline */}
        <div className="relative">
          {/* Background line */}
          <div className="absolute top-8 left-0 right-0 h-px bg-border hidden md:block" />

          {/* Animated line */}
          <motion.div
            style={{ width: lineWidth }}
            className="absolute top-8 left-0 h-px bg-foreground hidden md:block"
          />

          <div className="grid gap-12 md:grid-cols-3">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                {/* Step number */}
                <div className="w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center text-xl font-bold mb-6 relative z-10">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Comparison Section
function ComparisonSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-20%" });

  const comparisons = [
    { other: "Verkaufen Stunden", us: "Wir verkaufen Zustände." },
    { other: "Machen Workshops", us: "Wir machen Automationen." },
    { other: "Erklären", us: "Wir liefern." },
  ];

  return (
    <section ref={ref} className="py-32 px-6 bg-foreground text-background overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <div className="grid gap-16 md:grid-cols-2">
          {/* Andere */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 0.4, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <h3 className="text-sm uppercase tracking-widest opacity-50 mb-8">
              Andere
            </h3>
            {comparisons.map((item, index) => (
              <p
                key={index}
                className="text-2xl sm:text-3xl line-through opacity-50"
              >
                {item.other}
              </p>
            ))}
          </motion.div>

          {/* Wir */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-8"
          >
            <h3 className="text-sm uppercase tracking-widest mb-8">Wir</h3>
            {comparisons.map((item, index) => (
              <motion.p
                key={index}
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 0.4 + index * 0.15 }}
                className="text-2xl sm:text-3xl font-semibold"
              >
                {item.us}
              </motion.p>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Pricing Card Component
function PricingCard({
  title,
  subtitle,
  description,
  features,
  price,
  priceNote,
  featured = false,
  delay = 0,
}: {
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  price: string;
  priceNote: string;
  featured?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className={`p-8 rounded-2xl relative transition-all duration-300 ${
        featured
          ? "border-2 border-foreground glow"
          : "border border-border hover:border-foreground/30"
      }`}
    >
      {featured && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute -top-3 left-6 bg-background px-3 py-1 text-sm font-medium"
        >
          <motion.span
            animate={{ opacity: [1, 0.7, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Beliebt
          </motion.span>
        </motion.div>
      )}

      <div className="text-sm text-muted mb-4">{subtitle}</div>
      <h3 className="text-2xl font-bold mb-4">{title}</h3>
      <p className="text-muted mb-6">{description}</p>

      <ul className="space-y-3 mb-8 text-sm">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-foreground mt-2 shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="pt-6 border-t border-border">
        <p className="text-2xl font-bold">{price}</p>
        <p className="text-sm text-muted mt-1">{priceNote}</p>
      </div>
    </motion.div>
  );
}

// Pricing Section
function PricingSection() {
  return (
    <section className="py-32 px-6 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Drei Wege. Ein Ziel.
          </h2>
          <p className="text-xl text-muted">Fixpreise. Keine Überraschungen.</p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-3">
          <PricingCard
            subtitle="14 Tage"
            title="Betriebs-Upgrade"
            description="Wir kommen. Wir analysieren. Wir bauen. Nach 14 Tagen läuft euer Betrieb schneller."
            features={[
              "Prozess-Analyse vor Ort",
              "3 Automationen implementiert",
              "Team eingeführt",
            ]}
            price="CHF 3'000 – 6'000"
            priceNote="Einmalig. Fixpreis."
            delay={0}
          />

          <PricingCard
            subtitle="Setup + Betreuung"
            title="KI-Arbeitsplatz"
            description="Ein Assistent, der funktioniert. Kein Kurs. Kein Selbststudium. Fertig eingerichtet."
            features={[
              "Persönlicher KI-Assistent",
              "Auf eure Arbeit trainiert",
              "Optionale monatliche Betreuung",
            ]}
            price="CHF 2'000 – 4'000"
            priceNote="Setup + CHF 300–800/Monat optional"
            delay={0.1}
          />

          <PricingCard
            subtitle="Laufend"
            title="Betriebsservice"
            description="Wir sind eure Leute für alles, was schneller werden muss. Monatlich. Planbar."
            features={[
              "Kontinuierliche Optimierung",
              "Neue Automationen nach Bedarf",
              "Support wenn's klemmt",
            ]}
            price="CHF 1'000 – 3'000"
            priceNote="Pro Monat. Jederzeit kündbar."
            featured
            delay={0.2}
          />
        </div>
      </div>
    </section>
  );
}

// About Section
function AboutSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-20%" });

  return (
    <section ref={ref} className="py-32 px-6 border-t border-border">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          className="text-3xl sm:text-4xl font-bold tracking-tight mb-16"
        >
          Wer dahinter steht.
        </motion.h2>

        <div className="grid gap-12 md:grid-cols-2 items-start">
          {/* Placeholder for photo - geometric shape */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.6 }}
            className="aspect-square bg-foreground/[0.05] rounded-2xl flex items-center justify-center"
          >
            <div className="text-6xl font-bold text-foreground/20">P</div>
          </motion.div>

          {/* Story */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <p className="text-2xl font-semibold">Ich bin Pierre.</p>

            <p className="text-muted">
              15 Jahre digitales Handwerk. Angefangen mit Pixeln. Heute: Systeme,
              die Betriebe schneller machen.
            </p>

            <p className="text-muted">
              Der Weg war nie geplant: Grafikdesign führte zu Shops. Shops zu
              Datenbanken. Datenbanken zu Automationen. Jede Stufe komplexer.
              Jede Stufe näher am Kern.
            </p>

            <p className="text-muted">
              Heute ist KI da. Nicht als Spielerei. Als Werkzeug, das alles
              verändert. Wer es nutzt, gewinnt Zeit. Wer wartet, verliert sie.
            </p>

            <p className="font-medium">
              Ich arbeite allein. Das ist kein Nachteil. Das bedeutet: Du redest
              mit mir. Nicht mit einem Verkäufer. Mit dem, der es baut.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Not Doing Section
function NotDoingSection() {
  const items = [
    {
      title: "Keine Workshops",
      description: "Wir setzen um. Ihr schaut zu. Dann läuft es.",
    },
    {
      title: "Keine Strategiepapiere",
      description: "Ihr bekommt Systeme, keine Dokumente.",
    },
    {
      title: "Keine Buzzwords",
      description: "Wir reden nicht von Transformation. Wir machen euren Betrieb schneller.",
    },
    {
      title: "Keine versteckten Kosten",
      description: "Fixpreis heisst Fixpreis.",
    },
  ];

  return (
    <section className="py-32 px-6 border-t border-border">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl font-bold tracking-tight mb-16"
        >
          Was wir nicht machen.
        </motion.h2>

        <div className="grid gap-6 sm:grid-cols-2">
          {items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-6 border-l-2 border-foreground/20 hover:border-foreground transition-colors"
            >
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-muted text-sm">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// CTA Section
function CTASection() {
  return (
    <section id="kontakt" className="py-32 px-6 bg-foreground text-background">
      <div className="max-w-3xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="text-5xl sm:text-6xl font-bold tracking-tight mb-8"
        >
          Bereit?
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="space-y-6 mb-12"
        >
          <p className="text-xl opacity-80">
            Ein Gespräch. 20 Minuten. Kein Verkaufspitch.
          </p>
          <p className="text-lg opacity-60">
            Ich höre zu. Ihr erzählt, was nervt.
            <br />
            Dann sage ich euch ehrlich, ob ich helfen kann.
          </p>
          <p className="text-lg opacity-80">
            Wenn ja: In 14 Tagen läuft es.
            <br />
            Wenn nein: Ihr habt 20 Minuten investiert und wisst Bescheid.
          </p>
        </motion.div>

        <motion.a
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          href="mailto:hallo@laeuft.ch"
          className="inline-flex items-center justify-center h-14 px-10 bg-background text-foreground font-medium rounded-full transition-all duration-300"
        >
          Gespräch buchen
        </motion.a>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-muted">
            <span className="font-medium text-foreground">Läuft.</span>
            <span>Wallis, Schweiz</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted">
            <a href="/impressum" className="hover:text-foreground transition-colors">
              Impressum
            </a>
            <a href="/datenschutz" className="hover:text-foreground transition-colors">
              Datenschutz
            </a>
            <a
              href="mailto:hallo@laeuft.ch"
              className="hover:text-foreground transition-colors"
            >
              hallo@laeuft.ch
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Main Page
export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navigation />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <ProcessSection />
      <ComparisonSection />
      <PricingSection />
      <AboutSection />
      <NotDoingSection />
      <CTASection />
      <Footer />
    </main>
  );
}

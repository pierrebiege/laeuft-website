"use client";

import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent, useInView } from "framer-motion";
import { useState, useRef, useEffect } from "react";
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

// Portfolio Item with Modal
function PortfolioItem({
  title,
  category,
  index,
  thumbnail,
  images,
}: {
  title: string;
  category: string;
  index: number;
  thumbnail?: string;
  images?: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const hasImages = images && images.length > 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1 }}
        className="group cursor-pointer"
        onClick={() => hasImages && setIsOpen(true)}
      >
        <div className="aspect-[4/3] bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800 rounded-2xl mb-4 overflow-hidden relative group-hover:shadow-lg transition-shadow duration-300">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors" />
        </div>
        <p className="text-sm text-muted mb-1">{category}</p>
        <h3 className="font-semibold group-hover:text-foreground/80 transition-colors">{title}</h3>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && hasImages && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90"
            onClick={() => setIsOpen(false)}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="fixed top-6 right-6 z-50 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Header */}
            <div className="fixed top-6 left-6 z-50">
              <p className="text-white/60 text-sm">{category}</p>
              <h3 className="text-white text-xl font-semibold">{title}</h3>
            </div>

            {/* Scrollable Images */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="h-full overflow-y-auto pt-24 pb-12 px-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="max-w-4xl mx-auto space-y-6">
                {images.map((image, i) => (
                  <img
                    key={i}
                    src={image}
                    alt={`${title} - Bild ${i + 1}`}
                    className="w-full rounded-xl"
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Animated Counter Hook
function useCounter(end: number, duration: number = 2000, start: boolean = true) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, start]);

  return count;
}

// Walliserdeutsch Custom Modal
function WalliserdeutschModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const modalRef = useRef(null);
  const isInView = useInView(modalRef, { once: true });
  const wordCount = useCounter(3302, 2000, isOpen);
  const [activeWordIndex, setActiveWordIndex] = useState(0);

  const walliserWords = [
    { word: "BLACHTA", meaning: "Sauerampfer", type: "N. f." },
    { word: "Chäller", meaning: "Keller", type: "N. m." },
    { word: "ichromu", meaning: "einzäunen", type: "V." },
    { word: "Donschtag", meaning: "Donnerstag", type: "N. m." },
    { word: "gämmillich", meaning: "schrecklich, sehr", type: "Adj." },
  ];

  // Rotate words
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setActiveWordIndex((prev) => (prev + 1) % walliserWords.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isOpen, walliserWords.length]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          onClick={onClose}
        >
          {/* Backdrop with blur */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "linear-gradient(135deg, #1a1a1a 0%, #2d1f1f 50%, #1a1a1a 100%)",
            }}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>

            <div className="p-6 sm:p-10 md:p-14">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-8 sm:mb-12"
              >
                <p className="text-[#A50E1F] text-sm font-medium tracking-widest uppercase mb-2 sm:mb-3">
                  Datenbank-Projekt
                </p>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4">
                  Walliserdeutsch.ch
                </h2>
                <p className="text-white/60 text-base sm:text-lg max-w-xl">
                  Eine lebendige Datenbank zur Bewahrung des Walliser Dialekts.
                  Jedes Wort ein Stück Heimat.
                </p>
              </motion.div>

              {/* Featured Word Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative mb-8 sm:mb-12"
              >
                <div className="absolute inset-0 bg-[#A50E1F]/20 rounded-2xl blur-xl" />
                <div className="relative bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeWordIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="text-white/40 text-xs sm:text-sm mb-1 sm:mb-2">
                        {walliserWords[activeWordIndex].type}
                      </p>
                      <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 sm:mb-3 font-serif italic">
                        &ldquo;{walliserWords[activeWordIndex].word}&rdquo;
                      </p>
                      <p className="text-white/70 text-base sm:text-lg">
                        {walliserWords[activeWordIndex].meaning}
                      </p>
                    </motion.div>
                  </AnimatePresence>

                  {/* Word indicators */}
                  <div className="flex gap-1.5 sm:gap-2 mt-4 sm:mt-6">
                    {walliserWords.map((_, i) => (
                      <motion.div
                        key={i}
                        className={`h-1 rounded-full transition-all duration-300 ${
                          i === activeWordIndex ? "w-6 sm:w-8 bg-[#A50E1F]" : "w-1.5 sm:w-2 bg-white/20"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-3 gap-3 sm:gap-6 mb-8 sm:mb-12"
              >
                <div className="text-center p-3 sm:p-6 bg-white/5 rounded-xl sm:rounded-2xl">
                  <p className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-0.5 sm:mb-1">
                    {wordCount.toLocaleString()}+
                  </p>
                  <p className="text-white/50 text-xs sm:text-sm">Wörter gesammelt</p>
                </div>
                <div className="text-center p-3 sm:p-6 bg-white/5 rounded-xl sm:rounded-2xl">
                  <p className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-0.5 sm:mb-1">10k</p>
                  <p className="text-white/50 text-xs sm:text-sm">Ziel bis 2027</p>
                </div>
                <div className="text-center p-3 sm:p-6 bg-white/5 rounded-xl sm:rounded-2xl">
                  <p className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-0.5 sm:mb-1">6</p>
                  <p className="text-white/50 text-xs sm:text-sm">Regionen</p>
                </div>
              </motion.div>

              {/* Progress Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-8 sm:mb-12"
              >
                <div className="flex justify-between text-xs sm:text-sm text-white/50 mb-2 sm:mb-3">
                  <span>Fortschritt</span>
                  <span>33%</span>
                </div>
                <div className="h-2 sm:h-3 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "33%" }}
                    transition={{ delay: 0.6, duration: 1.5, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{
                      background: "linear-gradient(90deg, #A50E1F 0%, #d42a3a 100%)",
                    }}
                  />
                </div>
              </motion.div>

              {/* Features */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="grid sm:grid-cols-2 gap-3 sm:gap-4 mb-8 sm:mb-12"
              >
                {[
                  { icon: "🎙️", text: "Audio-Aufnahmen geplant" },
                  { icon: "🗺️", text: "Regionale Variationen" },
                  { icon: "📱", text: "Lern-App in Entwicklung" },
                  { icon: "🤝", text: "Community-Beiträge" },
                ].map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/5 rounded-xl"
                  >
                    <span className="text-xl sm:text-2xl">{feature.icon}</span>
                    <span className="text-white/80 text-sm sm:text-base">{feature.text}</span>
                  </motion.div>
                ))}
              </motion.div>

              {/* Tech Stack */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mb-8 sm:mb-10"
              >
                <p className="text-white/40 text-xs sm:text-sm mb-2 sm:mb-3">Tech Stack</p>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {["Next.js", "Supabase", "Tailwind", "Vercel", "PostgreSQL"].map((tech, i) => (
                    <motion.span
                      key={tech}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 + i * 0.05 }}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 text-white/80 rounded-full text-xs sm:text-sm font-medium"
                    >
                      {tech}
                    </motion.span>
                  ))}
                </div>
              </motion.div>

              {/* CTA */}
              <motion.a
                href="https://www.walliserdeutsch.ch"
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center gap-2 sm:gap-3 w-full py-3 sm:py-4 bg-[#A50E1F] hover:bg-[#8a0c1a] text-white rounded-xl sm:rounded-2xl font-medium transition-colors text-sm sm:text-base"
              >
                <span>Live ansehen</span>
                <ArrowUp className="w-4 h-4 rotate-45" />
              </motion.a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Walliserdeutsch Portfolio Item (Special)
function WalliserdeutschItem({ index }: { index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1 }}
        className="group cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        {/* Custom Thumbnail */}
        <div
          className="aspect-[4/3] rounded-2xl mb-4 overflow-hidden relative group-hover:shadow-lg transition-all duration-300"
          style={{
            background: "linear-gradient(135deg, #1a1a1a 0%, #2d1f1f 50%, #1a1a1a 100%)",
          }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
            <motion.p
              className="text-[#A50E1F] text-xs font-medium tracking-widest uppercase mb-2"
              initial={{ opacity: 0.7 }}
              whileHover={{ opacity: 1 }}
            >
              3'302+ Wörter
            </motion.p>
            <p className="text-2xl sm:text-3xl font-bold text-white text-center font-serif italic">
              &ldquo;Walliserdütsch&rdquo;
            </p>
          </div>
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
        </div>
        <p className="text-sm text-muted mb-1">Datenbank</p>
        <h3 className="font-semibold group-hover:text-foreground/80 transition-colors">
          Walliserdeutsch.ch
        </h3>
      </motion.div>

      <WalliserdeutschModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

// Portfolio Card (Horizontal Scroll)
function PortfolioCard({
  title,
  category,
  description,
  thumbnail,
  images,
  type,
  index,
  longDescription,
  features,
  techStack,
  liveUrl,
}: {
  title: string;
  category: string;
  description: string;
  thumbnail?: string;
  images?: string[];
  type?: "walliserdeutsch";
  index: number;
  longDescription?: string;
  features?: string[];
  techStack?: string[];
  liveUrl?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const isWalliserdeutsch = type === "walliserdeutsch";

  const walliserWords = [
    { word: "BLACHTA", meaning: "Sauerampfer" },
    { word: "Chäller", meaning: "Keller" },
    { word: "ichromu", meaning: "einzäunen" },
  ];

  useEffect(() => {
    if (!isWalliserdeutsch) return;
    const interval = setInterval(() => {
      setActiveWordIndex((prev) => (prev + 1) % walliserWords.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isWalliserdeutsch, walliserWords.length]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1 }}
        whileHover={{ y: -8, transition: { duration: 0.3 } }}
        className="flex-shrink-0 w-[340px] sm:w-[420px] lg:w-[500px] cursor-pointer group"
        onClick={() => setIsOpen(true)}
      >
        {/* Card */}
        <div
          className={`relative rounded-3xl overflow-hidden transition-shadow duration-500 group-hover:shadow-2xl ${
            isWalliserdeutsch ? "" : "bg-zinc-100 dark:bg-zinc-900"
          }`}
          style={isWalliserdeutsch ? {
            background: "linear-gradient(135deg, #1a1a1a 0%, #2d1f1f 50%, #1a1a1a 100%)",
          } : undefined}
        >
          {/* Image / Visual Area */}
          <div className="aspect-[4/3] relative overflow-hidden">
            {isWalliserdeutsch ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                <div className="absolute inset-0 bg-[#A50E1F]/10" />
                <div className="relative text-center">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-[#A50E1F]" />
                    <span className="text-white/40 text-xs uppercase tracking-wider">Live Wort</span>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeWordIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="text-3xl sm:text-4xl font-bold text-white mb-2 font-serif italic">
                        &ldquo;{walliserWords[activeWordIndex].word}&rdquo;
                      </p>
                      <p className="text-white/50 text-sm">
                        {walliserWords[activeWordIndex].meaning}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <>
                <img
                  src={thumbnail}
                  alt={title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </>
            )}
          </div>

          {/* Content */}
          <div className={`p-6 sm:p-8 ${isWalliserdeutsch ? "text-white" : ""}`}>
            <p className={`text-xs font-medium tracking-widest uppercase mb-2 ${
              isWalliserdeutsch ? "text-[#A50E1F]" : "text-muted"
            }`}>
              {category}
            </p>
            <h3 className="text-xl sm:text-2xl font-bold mb-2">{title}</h3>
            <p className={`text-sm mb-4 ${isWalliserdeutsch ? "text-white/60" : "text-muted"}`}>
              {description}
            </p>
            <div className={`flex items-center gap-2 text-sm font-medium ${
              isWalliserdeutsch
                ? "text-white/40 group-hover:text-white/70"
                : "text-foreground/50 group-hover:text-foreground/80"
            } transition-colors`}>
              <span>Ansehen</span>
              <ArrowUp className="w-4 h-4 rotate-45 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95"
            onClick={() => setIsOpen(false)}
          >
            <button
              onClick={() => setIsOpen(false)}
              className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="h-full overflow-y-auto py-16 sm:py-24 px-4 sm:px-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="max-w-4xl mx-auto">
                {/* Header - Minimalistisch */}
                <div className="mb-12 sm:mb-16">
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`text-sm font-medium tracking-widest uppercase mb-6 ${
                      isWalliserdeutsch ? "text-[#A50E1F]" : "text-white/40"
                    }`}
                  >
                    {category}
                  </motion.p>
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 sm:mb-8 tracking-tight"
                  >
                    {title}
                  </motion.h2>
                  {longDescription && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="text-white/60 text-lg sm:text-xl max-w-2xl leading-relaxed"
                    >
                      {longDescription}
                    </motion.p>
                  )}
                </div>

                {/* Walliserdeutsch: Animated Word Card */}
                {isWalliserdeutsch && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-12"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-[#A50E1F]/20 rounded-2xl blur-xl" />
                      <div
                        className="relative rounded-2xl p-8 sm:p-12 border border-white/10"
                        style={{
                          background: "linear-gradient(135deg, rgba(26,26,26,0.8) 0%, rgba(45,31,31,0.8) 50%, rgba(26,26,26,0.8) 100%)",
                        }}
                      >
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-2 h-2 rounded-full bg-[#A50E1F] animate-pulse" />
                          <span className="text-white/40 text-sm">Beispiel aus der Datenbank</span>
                        </div>
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={activeWordIndex}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                          >
                            <p className="text-4xl sm:text-5xl font-bold text-white mb-3 font-serif italic">
                              &ldquo;{walliserWords[activeWordIndex].word}&rdquo;
                            </p>
                            <p className="text-white/60 text-lg">
                              {walliserWords[activeWordIndex].meaning}
                            </p>
                          </motion.div>
                        </AnimatePresence>
                        <div className="flex gap-2 mt-8">
                          {walliserWords.map((_, i) => (
                            <div
                              key={i}
                              className={`h-1 rounded-full transition-all duration-300 ${
                                i === activeWordIndex ? "w-8 bg-[#A50E1F]" : "w-2 bg-white/20"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Images */}
                {images && images.length > 0 && (
                  <div className="space-y-4 sm:space-y-6 mb-12">
                    {images.map((image, i) => (
                      <motion.img
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + i * 0.05 }}
                        src={image}
                        alt={`${title} - Bild ${i + 1}`}
                        className="w-full rounded-xl sm:rounded-2xl"
                      />
                    ))}
                  </div>
                )}

                {/* Tech Stack - Ganz unten, dezent */}
                {techStack && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mb-8"
                  >
                    <p className={`text-sm ${isWalliserdeutsch ? "text-[#A50E1F]/50" : "text-white/25"}`}>
                      {techStack.join(" · ")}
                    </p>
                  </motion.div>
                )}

                {/* Live URL */}
                {liveUrl && (
                  <motion.a
                    href={liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className={`inline-flex items-center gap-3 px-6 py-3 rounded-full font-medium transition-colors ${
                      isWalliserdeutsch
                        ? "bg-[#A50E1F] text-white hover:bg-[#8a0c1a]"
                        : "bg-white text-black hover:bg-white/90"
                    }`}
                  >
                    <span>Live ansehen</span>
                    <ArrowUp className="w-4 h-4 rotate-45" />
                  </motion.a>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Walliserdeutsch Full-Width Showcase (keeping for reference, but not used)
function WalliserdeutschShowcase() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState(0);

  const walliserWords = [
    { word: "BLACHTA", meaning: "Sauerampfer" },
    { word: "Chäller", meaning: "Keller" },
    { word: "Donschtag", meaning: "Donnerstag" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveWordIndex((prev) => (prev + 1) % walliserWords.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [walliserWords.length]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        className="relative cursor-pointer group"
        onClick={() => setIsOpen(true)}
        style={{
          background: "linear-gradient(135deg, #1a1a1a 0%, #2d1f1f 50%, #1a1a1a 100%)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-24 sm:py-32 lg:py-40">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left: Text */}
            <div>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-[#A50E1F] text-sm font-medium tracking-widest uppercase mb-4"
              >
                Datenbank
              </motion.p>
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6"
              >
                Walliserdeutsch.ch
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-white/60 text-lg sm:text-xl mb-8 max-w-md"
              >
                Eine lebendige Datenbank mit über 3&apos;300 Wörtern zur Bewahrung des Walliser Dialekts.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-4 text-white/40 group-hover:text-white/60 transition-colors"
              >
                <span className="text-sm font-medium">Projekt ansehen</span>
                <ArrowUp className="w-4 h-4 rotate-45 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </motion.div>
            </div>

            {/* Right: Animated Word Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-[#A50E1F]/20 rounded-3xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-3xl p-8 sm:p-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-2 h-2 rounded-full bg-[#A50E1F]" />
                  <span className="text-white/40 text-sm">Wort des Augenblicks</span>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeWordIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-4xl sm:text-5xl font-bold text-white mb-3 font-serif italic">
                      &ldquo;{walliserWords[activeWordIndex].word}&rdquo;
                    </p>
                    <p className="text-white/60 text-lg">
                      {walliserWords[activeWordIndex].meaning}
                    </p>
                  </motion.div>
                </AnimatePresence>
                <div className="flex gap-2 mt-8">
                  {walliserWords.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        i === activeWordIndex ? "w-8 bg-[#A50E1F]" : "w-2 bg-white/20"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors pointer-events-none" />
      </motion.div>

      <WalliserdeutschModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

// Project Showcase (Full-Width)
function ProjectShowcase({
  title,
  category,
  description,
  thumbnail,
  images,
  index,
  reversed = false,
}: {
  title: string;
  category: string;
  description: string;
  thumbnail: string;
  images: string[];
  index: number;
  reversed?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        className={`relative cursor-pointer group ${
          index % 2 === 0 ? "bg-zinc-100 dark:bg-zinc-900" : "bg-background"
        }`}
        onClick={() => setIsOpen(true)}
      >
        <div className="max-w-7xl mx-auto px-6 py-24 sm:py-32">
          <div className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${
            reversed ? "lg:grid-flow-dense" : ""
          }`}>
            {/* Text */}
            <div className={reversed ? "lg:col-start-2" : ""}>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-sm font-medium tracking-widest uppercase text-muted mb-4"
              >
                {category}
              </motion.p>
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
              >
                {title}
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-muted text-lg sm:text-xl mb-8 max-w-md"
              >
                {description}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-4 text-foreground/50 group-hover:text-foreground/80 transition-colors"
              >
                <span className="text-sm font-medium">Projekt ansehen</span>
                <ArrowUp className="w-4 h-4 rotate-45 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </motion.div>
            </div>

            {/* Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className={`relative ${reversed ? "lg:col-start-1 lg:row-start-1" : ""}`}
            >
              <div className="aspect-[4/3] rounded-2xl sm:rounded-3xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 group-hover:shadow-2xl transition-shadow duration-500">
                <img
                  src={thumbnail}
                  alt={title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90"
            onClick={() => setIsOpen(false)}
          >
            <button
              onClick={() => setIsOpen(false)}
              className="fixed top-6 right-6 z-50 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            <div className="fixed top-6 left-6 z-50">
              <p className="text-white/60 text-sm">{category}</p>
              <h3 className="text-white text-xl font-semibold">{title}</h3>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="h-full overflow-y-auto pt-24 pb-12 px-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="max-w-4xl mx-auto space-y-6">
                {images.map((image, i) => (
                  <motion.img
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    src={image}
                    alt={`${title} - Bild ${i + 1}`}
                    className="w-full rounded-xl"
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
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

  const portfolioItems: Array<{
    title: string;
    category: string;
    type?: "walliserdeutsch";
    thumbnail?: string;
    images?: string[];
  }> = [
    {
      title: "Walliserdeutsch.ch",
      category: "Datenbank",
      type: "walliserdeutsch",
    },
    {
      title: "KULT klein/gross",
      category: "Branding",
      thumbnail: "/projekte/kult-branding/1.jpg",
      images: [
        "/projekte/kult-branding/1.jpg",
        "/projekte/kult-branding/2.jpg",
        "/projekte/kult-branding/3.jpg",
      ]
    },
    {
      title: "Curto",
      category: "Branding",
      thumbnail: "/projekte/curto/0c708d28615069.55c985bee75fe.webp",
      images: [
        "/projekte/curto/0c708d28615069.55c985bee75fe.webp",
        "/projekte/curto/7c939a28615069.55c985bf2dcdc.webp",
        "/projekte/curto/cda97c28615069.55c985bee87b6.webp",
        "/projekte/curto/b03bc928615069.55c985bf3062a.webp",
      ]
    },
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

      {/* Social Proof + Services */}
      <section className="py-24 px-6 bg-foreground text-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-12 lg:gap-16">
            {/* Left 2/3: Stats + Quote */}
            <div className="lg:col-span-2">
              {/* Numbers */}
              <div className="grid grid-cols-3 gap-6 sm:gap-8 mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <p className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-2">100+</p>
                  <p className="text-background/60 text-sm sm:text-base">Webseiten</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="text-center"
                >
                  <p className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-2">15</p>
                  <p className="text-background/60 text-sm sm:text-base">Jahre Erfahrung</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="text-center"
                >
                  <p className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-2">1</p>
                  <p className="text-background/60 text-sm sm:text-base">Ansprechpartner</p>
                </motion.div>
              </div>

              {/* Quote */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-background/10 rounded-3xl p-8 sm:p-12"
              >
                <Quote className="w-8 h-8 text-background/30 mb-4" />
                <p className="text-xl sm:text-2xl font-medium leading-relaxed mb-6 text-background/80">
                  &ldquo;Hier kommt ein Kundenzitat hin. Etwas Echtes von jemandem, der mit Pierre gearbeitet hat.&rdquo;
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-background/20" />
                  <div>
                    <p className="font-semibold text-sm">Kundenname</p>
                    <p className="text-background/60 text-xs">Firma / Position</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right 1/3: Services */}
            <div className="lg:col-span-1">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-sm uppercase tracking-widest text-background/40 mb-4"
              >
                Alles unter einem Dach
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="flex flex-wrap gap-2"
              >
                {[
                  "Web Apps",
                  "Datenbanken",
                  "Web Design",
                  "Logos",
                  "Branding",
                  "UI/UX Design",
                  "Shopify",
                  "Mobile Apps",
                  "Automationen",
                  "Social Media",
                  "Print Design",
                  "Icons",
                  "Brand Guides",
                ].map((service, i) => (
                  <motion.span
                    key={service}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.03 * i }}
                    className="px-3 py-1.5 rounded-full border border-background/20 text-xs sm:text-sm text-background/70 hover:text-background hover:border-background/40 transition-colors cursor-default"
                  >
                    {service}
                  </motion.span>
                ))}
              </motion.div>
            </div>
          </div>

          {/* Logo Placeholders */}
          <div className="text-center mt-16">
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

      {/* Portfolio - Horizontal Slide Cards */}
      <section id="arbeiten" className="py-32 border-t border-border">
        {/* Section Header */}
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm uppercase tracking-widest text-muted mb-4"
          >
            Ausgewählte Projekte
          </motion.p>
          <div className="flex items-end justify-between gap-8">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl font-bold tracking-tight"
            >
              Arbeiten
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="hidden sm:block text-muted text-sm"
            >
              ← Scrollen für mehr →
            </motion.p>
          </div>
        </div>

        {/* Horizontal Scroll Container */}
        <div className="overflow-x-auto pb-8 scrollbar-hide">
          <div className="flex gap-6 px-6 w-max">
            {/* Walliserdeutsch Card */}
            <PortfolioCard
              title="Walliserdeutsch.ch"
              category="Datenbank"
              description="3'300+ Wörter zur Bewahrung des Walliser Dialekts"
              type="walliserdeutsch"
              thumbnail="/projekte/walliserdeutsch/1-hero.png"
              images={[
                "/projekte/walliserdeutsch/1-hero.png",
                "/projekte/walliserdeutsch/2-wort.png",
                "/projekte/walliserdeutsch/3-liste.png",
                "/projekte/walliserdeutsch/4-wort-detail.png",
                "/projekte/walliserdeutsch/5-suche.png",
                "/projekte/walliserdeutsch/6-mobile.png",
                "/projekte/walliserdeutsch/7-mobile-detail.png",
              ]}
              index={0}
              longDescription="Eine lebendige Datenbank zur Bewahrung des Walliser Dialekts. Jedes Wort ein Stück Heimat – gesammelt, dokumentiert und für die Zukunft bewahrt."
              features={[
                "Datenbank mit über 3'300 Dialektwörtern",
                "Regionale Variationen aus 6 Bezirken",
                "Such- und Filterfunktionen",
                "Audio-Aufnahmen in Planung",
                "Community-Beiträge möglich",
              ]}
              techStack={["Next.js", "Supabase", "PostgreSQL", "Tailwind", "Vercel"]}
              liveUrl="https://www.walliserdeutsch.ch"
            />

            {/* Ein richtig guter Tag Card */}
            <PortfolioCard
              title="Ein richtig guter Tag"
              category="Shop · Eigene Marke"
              description="Kalender, Tee & Prints – eine Einladung, jeden Tag bewusst zu leben"
              thumbnail="/projekte/ergt/1-hero.png"
              images={[
                "/projekte/ergt/1-hero.png",
                "/projekte/ergt/2-story.png",
                "/projekte/ergt/3-warum.png",
                "/projekte/ergt/4-kalender.png",
                "/projekte/ergt/5-produkt.png",
              ]}
              index={1}
              longDescription="Was bedeutet es, wirklich zu leben? Diese Frage führte zu einer eigenen Marke – mit Produkten, die täglich daran erinnern, jeden Tag bewusst zu gestalten."
              features={[
                "Komplettes Branding von Grund auf entwickelt",
                "Alle Produktfotos selbst fotografiert",
                "Produkte selbst designed (Kalender, Tee, Prints)",
                "Shopify Store mit Custom Theme aufgebaut",
                "Social Media Aufbau auf 17k Follower",
              ]}
              techStack={["Shopify", "Liquid", "Figma", "Lightroom", "Photoshop"]}
              liveUrl="https://einrichtiggutertag.ch"
            />

            {/* KULT Card */}
            <PortfolioCard
              title="KULT klein/gross"
              category="Branding"
              description="Komplette Markenidentität für ein Kultur- und Theaterfestival"
              thumbnail="/projekte/kult-branding/1.jpg"
              images={[
                "/projekte/kult-branding/1.jpg",
                "/projekte/kult-branding/2.jpg",
                "/projekte/kult-branding/3.jpg",
              ]}
              index={2}
              longDescription="KULT bringt Musik, Theater und Tanz für Klein bis Gross nach Brig. Eine Kampagne, die auffällt – von der Idee bis zum Plakat an der Strasse."
              features={[
                "Logo-Design und Konzept entwickelt",
                "Komplettes Farbsystem mit 6 Pantone-Farben",
                "Broschüren und Programmhefte gestaltet",
                "Infografiken und Illustrationen erstellt",
                "Plakate und Aussenwerbung produziert",
                "Druckproduktion koordiniert",
              ]}
              techStack={["Illustrator", "InDesign", "Photoshop"]}
            />

            {/* Curto Card */}
            <PortfolioCard
              title="Curto"
              category="Branding · Web"
              description="Markenidentität für ein Schuhgeschäft seit 1976"
              thumbnail="/projekte/curto/0c708d28615069.55c985bee75fe.webp"
              images={[
                "/projekte/curto/0c708d28615069.55c985bee75fe.webp",
                "/projekte/curto/7c939a28615069.55c985bf2dcdc.webp",
                "/projekte/curto/cda97c28615069.55c985bee87b6.webp",
                "/projekte/curto/b03bc928615069.55c985bf3062a.webp",
              ]}
              index={3}
              longDescription="Ein traditionsreiches Schuhgeschäft verdient einen Auftritt, der Handwerk und Qualität widerspiegelt. Vom Logo bis zur Website – alles aus einem Guss."
              features={[
                "Logo und Markenidentität neu entwickelt",
                "Produktfotografie im Atelier",
                "Geschäftsausstattung (Visitenkarten, Briefpapier)",
                "Website auf WordPress Basis umgesetzt",
                "Print-Materialien für den Store",
              ]}
              techStack={["WordPress", "Illustrator", "InDesign", "Photoshop"]}
            />
          </div>
        </div>
      </section>

      {/* Benefits - Horizontal Swipe Cards */}
      <section className="py-24 sm:py-32 border-t border-border bg-zinc-50 dark:bg-zinc-900/50">
        {/* Section Header */}
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm uppercase tracking-widest text-muted mb-4"
          >
            Warum so arbeiten
          </motion.p>
          <div className="flex items-end justify-between gap-8">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight"
            >
              Kein Bullshit.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="hidden sm:block text-muted text-sm"
            >
              ← Scrollen →
            </motion.p>
          </div>
        </div>

        {/* Horizontal Scroll Container */}
        <div className="overflow-x-auto pb-8 scrollbar-hide">
          <div className="flex gap-6 px-6 w-max">
            {[
              {
                title: "Du redest mit dem, der baut.",
                description: "Kein Verkäufer. Kein Projektmanager. Du sprichst direkt mit mir – und ich bin der, der dein System baut.",
                highlight: "1 Ansprechpartner",
              },
              {
                title: "Ich arbeite alleine.",
                description: "Kein Junior, der die Arbeit macht. Das hält die Qualität hoch und die Kommunikation kurz.",
                highlight: "Qualität",
              },
              {
                title: "Keine Beratung. Ich baue.",
                description: "Keine PowerPoints. Keine Workshops. Du sagst, was fehlt – ich baue es. Ergebnisse statt Slides.",
                highlight: "Macher",
              },
              {
                title: "Jederzeit pausieren.",
                description: "Monatlich kündbar. Keine Mindestlaufzeit. Die restlichen Tage verfallen nicht. Dein Tempo.",
                highlight: "Flexibel",
              },
              {
                title: "15 Jahre Erfahrung.",
                description: "100+ Webseiten. Komplexe Systeme. Von Shopify bis Supabase. Kein Anfänger, der noch lernt.",
                highlight: "Senior-Level",
              },
            ].map((benefit, i) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="flex-shrink-0 w-[300px] sm:w-[360px] bg-white dark:bg-zinc-800 rounded-3xl p-8 sm:p-10 border border-border hover:shadow-xl transition-shadow duration-500 cursor-default"
              >
                <span className="inline-block px-3 py-1 rounded-full bg-foreground/5 text-xs font-medium text-muted mb-6">
                  {benefit.highlight}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold mb-4 leading-tight">
                  {benefit.title}
                </h3>
                <p className="text-muted text-sm sm:text-base leading-relaxed">
                  {benefit.description}
                </p>
              </motion.div>
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
                "Schnelle Umsetzung",
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
            Du sagst, was fehlt.
            <br />
            <span className="italic font-serif font-normal">Ich baue es.</span>
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

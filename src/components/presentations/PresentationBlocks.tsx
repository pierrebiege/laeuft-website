"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform, useInView, type Variants } from "framer-motion";
import { Youtube, Instagram, Camera, Users, Mail, Phone, MapPin, Calendar, BarChart3 } from "lucide-react";

export type Block =
  | { type: "cover"; title: string; subtitle?: string; image?: string }
  | { type: "bio"; heading: string; text: string; image?: string; stats?: { label: string; value: string }[] }
  | { type: "content-overview"; heading: string; channels: { icon: string; name: string; reach: string }[] }
  | { type: "race"; name: string; date: string; location: string; description: string; image?: string; logo?: string }
  | { type: "goal"; heading: string; text: string }
  | { type: "team"; heading: string; members: { name: string; role: string; image?: string }[] }
  | { type: "offer"; heading: string; bullets: string[]; price?: string }
  | { type: "contact"; name: string; email: string; phone?: string };

export interface PresentationData {
  customer_name: string;
  customer_logo_url?: string | null;
  title?: string | null;
  blocks: Block[];
}

const ICON_MAP: Record<string, React.ElementType> = {
  youtube: Youtube,
  instagram: Instagram,
  camera: Camera,
  users: Users,
};

// ==================== MOTION PRIMITIVES ====================

const EASE = [0.22, 1, 0.36, 1] as const; // Apple-ish easeOutQuint

// Word-by-word reveal — splits text and animates each word
function AnimatedWords({
  text,
  className = "",
  delay = 0,
  stagger = 0.04,
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
            {i < words.length - 1 ? "\u00A0" : ""}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

// Generic fade-up
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

// ==================== BLOCKS ====================

function CoverBlock({ block, customer }: { block: Extract<Block, { type: "cover" }>; customer: PresentationData }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.1, 1.25]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-20%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} className="relative h-screen flex items-center justify-center overflow-hidden bg-black text-white">
      {block.image && (
        <motion.div className="absolute inset-0" style={{ y: imageY, scale: imageScale }}>
          <Image src={block.image} alt="" fill className="object-cover opacity-60" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black" />
        </motion.div>
      )}
      <motion.div className="relative z-10 max-w-5xl mx-auto px-6 text-center" style={{ y: contentY, opacity: contentOpacity }}>
        {customer.customer_logo_url && (
          <motion.div
            className="mb-12 inline-block"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: EASE, delay: 0.2 }}
          >
            <Image src={customer.customer_logo_url} alt={customer.customer_name} width={160} height={80} className="object-contain mx-auto" />
          </motion.div>
        )}
        <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-bold tracking-tight leading-[0.9] mb-6">
          <AnimatedWords text={block.title} delay={0.4} stagger={0.08} />
        </h1>
        {block.subtitle && (
          <motion.p
            className="text-xl md:text-2xl text-white/70 font-light tracking-wide"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: EASE, delay: 1.2 }}
          >
            {block.subtitle}
          </motion.p>
        )}
        <motion.p
          className="mt-16 text-xs uppercase tracking-[0.4em] text-white/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 1.8 }}
        >
          Eine Präsentation für {customer.customer_name}
        </motion.p>
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 bottom-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2.2 }}
        >
          <motion.div
            className="w-px h-16 bg-white/40"
            animate={{ scaleY: [0, 1, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "top" }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

function BioBlock({ block }: { block: Extract<Block, { type: "bio" }> }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.15, 0.95]);
  const imageY = useTransform(scrollYProgress, [0, 1], ["10%", "-10%"]);

  return (
    <section ref={ref} className="min-h-screen flex items-center bg-white py-32 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center w-full">
        <div>
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-zinc-900 mb-10 leading-[0.9]">
            <AnimatedWords text={block.heading} stagger={0.06} />
          </h2>
          <FadeUp delay={0.4}>
            <p className="text-xl md:text-2xl text-zinc-600 leading-relaxed font-light">{block.text}</p>
          </FadeUp>
          {block.stats && block.stats.length > 0 && (
            <div className="mt-12 grid grid-cols-3 gap-6">
              {block.stats.map((s, i) => (
                <FadeUp key={i} delay={0.6 + i * 0.1} y={20}>
                  <div>
                    <div className="text-4xl md:text-5xl font-bold text-zinc-900 tabular-nums">{s.value}</div>
                    <div className="text-xs uppercase tracking-wider text-zinc-500 mt-2">{s.label}</div>
                  </div>
                </FadeUp>
              ))}
            </div>
          )}
        </div>
        {block.image && (
          <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-zinc-100">
            <motion.div className="absolute inset-0" style={{ scale: imageScale, y: imageY }}>
              <Image src={block.image} alt="" fill className="object-cover" />
            </motion.div>
          </div>
        )}
      </div>
    </section>
  );
}

function ContentOverviewBlock({ block }: { block: Extract<Block, { type: "content-overview" }> }) {
  return (
    <section className="min-h-screen flex items-center bg-zinc-950 text-white py-32 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto w-full">
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-20 leading-[0.9]">
          <AnimatedWords text={block.heading} stagger={0.06} />
        </h2>
        <div className="grid md:grid-cols-2 gap-px bg-zinc-800 rounded-3xl overflow-hidden">
          {block.channels.map((c, i) => {
            const Icon = ICON_MAP[c.icon] || Users;
            return (
              <FadeUp key={i} delay={0.2 + i * 0.1} y={30}>
                <motion.div
                  className="bg-zinc-950 p-10 h-full"
                  whileHover={{ backgroundColor: "rgb(24 24 27)" }}
                  transition={{ duration: 0.3 }}
                >
                  <Icon size={40} className="text-white/80 mb-6" strokeWidth={1.5} />
                  <h3 className="text-2xl font-semibold mb-2">{c.name}</h3>
                  <p className="text-white/60">{c.reach}</p>
                </motion.div>
              </FadeUp>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function RaceBlock({ block, index }: { block: Extract<Block, { type: "race" }>; index: number }) {
  const dark = index % 2 === 0;
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.2, 0.95]);
  const imageY = useTransform(scrollYProgress, [0, 1], ["10%", "-10%"]);
  const reverse = index % 2 !== 0;

  return (
    <section
      ref={ref}
      className={`min-h-screen flex items-center py-32 px-6 overflow-hidden ${dark ? "bg-black text-white" : "bg-white text-zinc-900"}`}
    >
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center w-full">
        {block.image && (
          <div className={`relative aspect-square rounded-3xl overflow-hidden ${dark ? "bg-zinc-900" : "bg-zinc-100"} ${reverse ? "md:order-2" : ""}`}>
            <motion.div className="absolute inset-0" style={{ scale: imageScale, y: imageY }}>
              <Image src={block.image} alt={block.name} fill className="object-cover" />
            </motion.div>
          </div>
        )}
        <div>
          <FadeUp y={20}>
            <div className={`text-xs uppercase tracking-[0.4em] mb-6 ${dark ? "text-white/50" : "text-zinc-500"}`}>
              Race {String(index).padStart(2, "0")}
            </div>
          </FadeUp>
          {block.logo && (
            <FadeUp y={20} delay={0.1}>
              <div className={`mb-8 ${dark ? "" : "invert"}`}>
                <Image src={block.logo} alt={`${block.name} Logo`} width={220} height={80} className="object-contain object-left" style={{ height: "auto", maxHeight: "80px", width: "auto" }} />
              </div>
            </FadeUp>
          )}
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-[0.9]">
            <AnimatedWords text={block.name} stagger={0.07} />
          </h2>
          <FadeUp delay={0.3}>
            <div className={`flex flex-wrap gap-6 mb-8 text-sm ${dark ? "text-white/70" : "text-zinc-600"}`}>
              <span className="flex items-center gap-2"><Calendar size={16} /> {block.date}</span>
              <span className="flex items-center gap-2"><MapPin size={16} /> {block.location}</span>
            </div>
          </FadeUp>
          <FadeUp delay={0.5}>
            <p className={`text-xl md:text-2xl font-light leading-relaxed ${dark ? "text-white/80" : "text-zinc-600"}`}>
              {block.description}
            </p>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

function GoalBlock({ block }: { block: Extract<Block, { type: "goal" }> }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.92, 1, 1.05]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0.3]);

  return (
    <section
      ref={ref}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white px-6 py-32 overflow-hidden"
    >
      <motion.div className="max-w-5xl mx-auto text-center" style={{ scale, opacity }}>
        <FadeUp y={20}>
          <div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-10">{block.heading}</div>
        </FadeUp>
        <p className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
          <AnimatedWords text={block.text} stagger={0.025} />
        </p>
      </motion.div>
    </section>
  );
}

function TeamBlock({ block }: { block: Extract<Block, { type: "team" }> }) {
  return (
    <section className="min-h-screen flex items-center bg-white py-32 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto w-full">
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-zinc-900 mb-20 leading-[0.9]">
          <AnimatedWords text={block.heading} stagger={0.06} />
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {block.members.map((m, i) => (
            <FadeUp key={i} delay={0.2 + i * 0.15} y={40}>
              <div className="group">
                <div className="aspect-square rounded-3xl bg-zinc-100 mb-6 overflow-hidden relative">
                  {m.image && (
                    <motion.div className="absolute inset-0" whileHover={{ scale: 1.05 }} transition={{ duration: 0.6, ease: EASE }}>
                      <Image src={m.image} alt={m.name} fill className="object-cover" />
                    </motion.div>
                  )}
                </div>
                <h3 className="text-2xl font-semibold text-zinc-900">{m.name}</h3>
                <p className="text-zinc-500">{m.role}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

function OfferBlock({ block, customer: _customer }: { block: Extract<Block, { type: "offer" }>; customer?: PresentationData }) {
  return (
    <section className="min-h-screen flex items-center bg-zinc-950 text-white py-32 px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto w-full">
        <FadeUp y={20}>
          <div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Angebot</div>
        </FadeUp>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-16 leading-[0.9]">
          <AnimatedWords text={block.heading} stagger={0.06} />
        </h2>
        <ul className="space-y-px bg-white/10 rounded-3xl overflow-hidden">
          {block.bullets.map((b, i) => (
            <FadeUp key={i} delay={0.1 + i * 0.08} y={20}>
              <motion.li
                className="bg-zinc-950 px-8 py-6 flex items-start gap-6"
                whileHover={{ backgroundColor: "rgb(24 24 27)", x: 4 }}
                transition={{ duration: 0.3 }}
              >
                <span className="text-2xl font-bold text-white/30 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-lg md:text-xl font-light pt-1">{b}</span>
              </motion.li>
            </FadeUp>
          ))}
        </ul>
        {block.price && (
          <FadeUp delay={0.5}>
            <div className="mt-12 text-right">
              <div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-2">Investment</div>
              <div className="text-5xl md:text-6xl font-bold tabular-nums">{block.price}</div>
            </div>
          </FadeUp>
        )}
      </div>
    </section>
  );
}

function ContactBlock({ block, customer }: { block: Extract<Block, { type: "contact" }>; customer: PresentationData }) {
  return (
    <section className="min-h-screen flex items-center justify-center bg-black text-white px-6 py-32 overflow-hidden">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight mb-8 leading-[0.9]">
          <AnimatedWords text="Let's Talk." stagger={0.1} />
        </h2>
        <FadeUp delay={0.6}>
          <p className="text-xl md:text-2xl text-white/60 mb-16 font-light">
            Wir freuen uns auf das Gespräch mit {customer.customer_name}.
          </p>
        </FadeUp>
        <FadeUp delay={0.8}>
          <div className="inline-block text-left space-y-4">
            <div className="text-2xl font-semibold">{block.name}</div>
            <a href={`mailto:${block.email}`} className="flex items-center gap-3 text-white/80 hover:text-white transition-colors text-lg group">
              <Mail size={20} className="group-hover:scale-110 transition-transform" /> {block.email}
            </a>
            {block.phone && (
              <a href={`tel:${block.phone}`} className="flex items-center gap-3 text-white/80 hover:text-white transition-colors text-lg group">
                <Phone size={20} className="group-hover:scale-110 transition-transform" /> {block.phone}
              </a>
            )}
          </div>
        </FadeUp>
        <FadeUp delay={1.0}>
          <a
            href="/insights"
            target="_blank"
            className="mt-16 inline-flex items-center gap-3 px-6 py-3 border border-white/20 rounded-full text-sm text-white/80 hover:bg-white hover:text-black transition-colors group"
          >
            <BarChart3 size={16} className="group-hover:scale-110 transition-transform" />
            Live-Insights ansehen
          </a>
        </FadeUp>
        <FadeUp delay={1.2}>
          <div className="mt-24 text-xs uppercase tracking-[0.4em] text-white/30">läuft.ch</div>
        </FadeUp>
      </div>
    </section>
  );
}

// ==================== ENTRY ====================

export function RenderBlock({ block, index, customer }: { block: Block; index: number; customer: PresentationData }) {
  switch (block.type) {
    case "cover": return <CoverBlock block={block} customer={customer} />;
    case "bio": return <BioBlock block={block} />;
    case "content-overview": return <ContentOverviewBlock block={block} />;
    case "race": return <RaceBlock block={block} index={index} />;
    case "goal": return <GoalBlock block={block} />;
    case "team": return <TeamBlock block={block} />;
    case "offer": return <OfferBlock block={block} customer={customer} />;
    case "contact": return <ContactBlock block={block} customer={customer} />;
    default: return null;
  }
}

export function PresentationView({ data }: { data: PresentationData }) {
  return (
    <div className="font-sans antialiased">
      {data.blocks.map((block, i) => (
        <RenderBlock key={i} block={block} index={i} customer={data} />
      ))}
    </div>
  );
}

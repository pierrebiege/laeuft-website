"use client";

import Image from "next/image";
import { useRef, useState, useEffect, Fragment } from "react";
import { motion, useScroll, useTransform, useInView, type MotionValue } from "framer-motion";
import { Mail, Phone, Sunrise, Users, Waves } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;
const GOMS = "#2fb4c4"; // Gletscher-Türkis

// ==================== PRIMITIVES ====================

function AnimatedWords({ text, className = "", delay = 0, stagger = 0.05 }: { text: string; className?: string; delay?: number; stagger?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const words = text.split(" ");
  return (
    <span ref={ref} className={className} style={{ display: "inline-block" }}>
      {words.map((word, i) => (
        <Fragment key={i}>
          <span style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top" }}>
            <motion.span style={{ display: "inline-block", willChange: "transform" }} initial={{ y: "110%", opacity: 0 }} animate={inView ? { y: "0%", opacity: 1 } : { y: "110%", opacity: 0 }} transition={{ duration: 0.9, ease: EASE, delay: delay + i * stagger }}>
              {word}
            </motion.span>
          </span>
          {i < words.length - 1 ? " " : ""}
        </Fragment>
      ))}
    </span>
  );
}

function FadeUp({ children, delay = 0, y = 40, className = "" }: { children: React.ReactNode; delay?: number; y?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  return (
    <motion.div ref={ref} className={className} initial={{ opacity: 0, y }} animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }} transition={{ duration: 1, ease: EASE, delay }}>
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
        return <RevealWord key={i} progress={scrollYProgress} range={[start, end]}>{word}</RevealWord>;
      })}
    </p>
  );
}

function RevealWord({ children, progress, range }: { children: React.ReactNode; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.18, 1]);
  return <motion.span style={{ opacity }} className="inline-block mr-[0.25em]">{children}</motion.span>;
}

// ==================== HEADER ====================

function Header() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.6);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? "bg-black/60 backdrop-blur-md py-4" : "py-6"}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className={`text-sm font-semibold uppercase tracking-[0.25em] text-white transition-opacity duration-500 ${scrolled ? "opacity-100" : "opacity-0 pointer-events-none"}`}>Goms × Pierre</button>
        <nav className="flex items-center gap-6 text-xs uppercase tracking-[0.2em] text-white/80">
          <button onClick={() => go("idee")} className="hover:text-white transition-colors">Die Idee</button>
          <button onClick={() => go("angebot")} className="hover:text-white transition-colors"><span className="border-b-2 pb-1" style={{ borderColor: GOMS }}>Das Angebot</span></button>
        </nav>
      </div>
    </header>
  );
}

// ==================== HERO ====================

function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.1, 1.3]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  return (
    <section ref={ref} className="relative h-screen flex items-center justify-center overflow-hidden bg-black text-white">
      <motion.div className="absolute inset-0" style={{ y: imageY, scale: imageScale }}>
        <Image src="/goms/aerial.png" alt="Das Goms aus der Luft" fill className="object-cover opacity-60" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black" />
      </motion.div>
      <motion.div className="relative z-10 max-w-5xl mx-auto px-6 text-center" style={{ opacity: contentOpacity }}>
        <motion.div className="inline-block mb-8 px-5 py-2 border border-white/20 rounded-full text-xs uppercase tracking-[0.4em] text-white/70" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2 }}>
          Pierre Biege × Goms Tourismus
        </motion.div>
        <h1 className="sr-only">Ultra durchs Goms zum Gletscher</h1>
        <div className="text-6xl md:text-8xl lg:text-[9rem] font-bold tracking-tight leading-[0.85] mb-8">
          <AnimatedWords text="Vom ersten Licht zum Gletscher." delay={0.35} stagger={0.06} />
        </div>
        <motion.p className="text-lg md:text-2xl text-white/80 font-light max-w-3xl mx-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 1.2 }}>
          Ein Läufer mit grosser Community durchquert das ganze Goms an einem Tag – Dörfer, Trails, Berge, bis zum Gletscher. Und hält die Region für immer fest: YouTube-Folge, Reel, Stories, Bilder.
        </motion.p>
      </motion.div>
      <motion.div className="absolute left-1/2 -translate-x-1/2 bottom-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 2 }}>
        <motion.div className="w-px h-16 bg-white/40" animate={{ scaleY: [0, 1, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} style={{ transformOrigin: "top" }} />
      </motion.div>
    </section>
  );
}

// ==================== 3D-ROUTE (Scroll-Animation) ====================

function RouteMap() {
  const ref = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [act, setAct] = useState(0);
  useEffect(() => {
    const unsub = scrollYProgress.on("change", (v) => {
      const rev = Math.max(0, Math.min(1, (v - 0.08) / 0.82));
      iframeRef.current?.contentWindow?.postMessage({ rev }, "*");
      setAct(rev < 0.25 ? 0 : rev < 0.52 ? 1 : rev < 0.82 ? 2 : 3);
    });
    return () => unsub();
  }, [scrollYProgress]);
  const acts = [
    { k: "Akt 1 · Das erste Licht", t: "Sonnenaufgang auf der Galealp", d: "Das ganze Goms unter dir, der silberne Faden des Rotten – in der Ferne das Eis." },
    { k: "Akt 2 · Hinunter zu den Menschen", t: "Die Walserdörfer", d: "Dörfer, die sich seit Jahrhunderten kaum verändert haben. Die kulturelle Ebene." },
    { k: "Akt 3 · Dem Fluss entgegen", t: "Münster, Ulrichen, Oberwald", d: "Der Rotten wird jünger, wilder, schmaler. Berge, Trails, crazy Aussichten." },
    { k: "Akt 4 · Die Konfrontation", t: "Gletsch zur Gletscherzunge", d: "Das Ziel ist kein Gipfel, sondern ein Abschied." },
  ];
  return (
    <section ref={ref} className="relative h-[440vh] bg-black">
      <div className="sticky top-0 h-screen overflow-hidden">
        <iframe ref={iframeRef} src="/goms/scene.html" title="Die Strecke durchs Goms" className="absolute inset-0 w-full h-full border-0" />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/75 via-transparent to-black/50" />
        <div className="absolute top-24 left-6 right-6 flex justify-between text-[10px] md:text-xs uppercase tracking-[0.3em] text-white/60 pointer-events-none">
          <span>Start · Lax · 1’040 m</span>
          <span style={{ color: GOMS }}>Ziel · Rhonegletscher · 2’200 m</span>
        </div>
        <div className="absolute left-6 md:left-12 bottom-14 w-[85%] md:w-[28rem] h-44 pointer-events-none">
          {acts.map((a, i) => (
            <motion.div key={i} className="absolute inset-0" animate={{ opacity: act === i ? 1 : 0, y: act === i ? 0 : 14 }} transition={{ duration: 0.5, ease: EASE }}>
              <div className="text-[11px] uppercase tracking-[0.25em] mb-3" style={{ color: GOMS }}>{a.k}</div>
              <h3 className="text-3xl md:text-5xl font-bold leading-[0.95] text-white mb-3">{a.t}</h3>
              <p className="text-white/70 font-light text-sm md:text-base">{a.d}</p>
            </motion.div>
          ))}
        </div>
        <div className="absolute right-6 md:right-12 bottom-14 text-right pointer-events-none">
          <div className="text-[10px] uppercase tracking-[0.3em] text-white/50 mb-1">Scrollen, um zu laufen</div>
          <div className="text-4xl md:text-6xl font-bold text-white/90">60<span className="text-lg md:text-2xl align-top">km</span></div>
        </div>
      </div>
    </section>
  );
}

// ==================== IDEE ====================

function Idee() {
  return (
    <section id="idee" className="bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white py-40 md:py-48 px-6 overflow-hidden scroll-mt-16">
      <div className="max-w-4xl mx-auto">
        <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-12 text-center">Die Idee</div></FadeUp>
        <ScrollRevealText text="Ein Läufer mit grosser Community durchquert das ganze Goms an einem Tag – aus eigener Kraft, von ganz unten bis zum Eis. Vorbei an Walserdörfern, über Trails, durch eines der eindrücklichsten und untertouristischsten Hochtäler der Schweiz." className="text-2xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.25] text-center" />
      </div>
      <div className="max-w-4xl mx-auto mt-28">
        <ScrollRevealText text="Er durchlebt die Geschichte und hält alles für immer fest: in einer YouTube-Folge, einem Reel, mehreren Stories und hunderten Bildern. Das Finale am verschwindenden Rhonegletscher macht sie teilbar." className="text-2xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.25] text-center" />
        <FadeUp delay={0.3}><p className="text-center mt-16 text-lg text-white/50 italic">„Ein richtig guter Tag.“ – eine Region, die man fühlt.</p></FadeUp>
      </div>
    </section>
  );
}

// ==================== ECKWERTE ====================

function Eckwerte() {
  const stats = [
    { value: "60", unit: "km", label: "an einem Tag" },
    { value: "4'500", unit: "hm", label: "im Aufstieg" },
    { value: "1", unit: "Tag", label: "vom Dunkeln bis zum Eis" },
    { value: "0", unit: "", label: "Hilfsmittel · alles selbst gelaufen" },
  ];
  return (
    <section className="bg-black text-white py-28 md:py-40 px-6">
      <div className="max-w-7xl mx-auto">
        <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Der Tag</div></FadeUp>
        <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-[0.9] mb-16 max-w-4xl"><AnimatedWords text="Lax am Rotten bis zum Rhonegletscher." stagger={0.05} /></h2>
        <div className="grid grid-cols-2 md:grid-cols-4 border-t border-white/15">
          {stats.map((s, i) => (
            <FadeUp key={i} delay={i * 0.08}>
              <div className="border-b md:border-b-0 border-r border-white/15 py-10 pr-4 md:pl-6 first:md:pl-0">
                <div className="text-5xl md:text-7xl font-bold tracking-tight" style={{ color: i === 0 ? GOMS : "#fff" }}>{s.value}<span className="text-xl md:text-2xl align-top ml-1">{s.unit}</span></div>
                <div className="text-xs uppercase tracking-wider text-white/50 mt-3">{s.label}</div>
              </div>
            </FadeUp>
          ))}
        </div>
        <FadeUp delay={0.3}>
          <p className="text-white/55 text-base md:text-lg font-light max-w-3xl mt-12">
            Start im Dunkeln bei Lax. Aufstieg zur Galealp – Sonnenaufgang über dem ganzen Tal. Abstieg, dann dem jungen Rotten entlang das Obergoms hinauf bis zur Gletscherzunge bei Gletsch.
          </p>
        </FadeUp>
      </div>
    </section>
  );
}

// ==================== BOTSCHAFT ====================

function Botschaft() {
  const facts = [
    "2025 verloren die Schweizer Gletscher rund 3 % ihres Volumens – einer der grössten Eisverluste seit Messbeginn.",
    "Am Rhonegletscher wird das Eis mit weissen Planen abgedeckt; die berühmte Eisgrotte musste 2025 aufgegeben werden.",
    "Hier, auf rund 2'200 m, entspringt die Rhone – im Goms der „Rotten“. Genau hier endet der Lauf.",
  ];
  return (
    <section className="bg-zinc-950 text-white py-28 md:py-40 px-6">
      <div className="max-w-5xl mx-auto">
        <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Das Finale · der Gletscher</div></FadeUp>
        <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-[0.9] mb-8"><AnimatedWords text="Gezeigt, nicht doziert." stagger={0.05} /></h2>
        <FadeUp delay={0.25}><p className="text-lg md:text-xl text-white/60 font-light max-w-3xl mb-14">Bilder sprechen lassen: die weissen Planen, der wachsende türkise See, die Jahreszahl-Säulen. Ein, zwei ehrliche Sätze – maximal ~15 % der Videolänge.</p></FadeUp>
        <div>
          {facts.map((f, i) => (
            <FadeUp key={i} delay={0.04 * i}>
              <div className="grid grid-cols-[auto_1fr] gap-5 py-5 border-t border-white/12 items-baseline">
                <div className="text-sm font-bold tabular-nums" style={{ color: GOMS }}>{String(i + 1).padStart(2, "0")}</div>
                <p className="text-white/75 font-light md:text-lg leading-relaxed">{f}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==================== VISUELLE UMSETZUNG ====================

function Visuell() {
  const balance = [
    { pct: "60%", label: "Abenteuer & Aussichten", w: "60%" },
    { pct: "25%", label: "Goms · Dörfer · Menschen", w: "25%" },
    { pct: "15%", label: "Gletscher als Finale", w: "15%" },
  ];
  const items = [
    { Icon: Sunrise, t: "Drohne & Mood", d: "Der Läufer als kleiner Punkt in gewaltiger Natur. Ruhig, cinematisch, eingebettet in die Landschaft." },
    { Icon: Users, t: "Team vor Ort", d: "Pierre + Fotografin/Filmerin, an Schlüsselpunkten platziert. Live-Fotos schon während des Laufs – sofort postbar." },
    { Icon: Waves, t: "Schlüsselbilder", d: "Galealp im ersten Licht · der Rotten · die Dörfer · der Gommer Höhenweg · Viertausender-Aussichten · Gletscherzunge." },
  ];
  return (
    <section className="bg-black text-white py-28 md:py-40 px-6">
      <div className="max-w-7xl mx-auto">
        <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Visuelle Umsetzung</div></FadeUp>
        <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-[0.9] mb-16"><AnimatedWords text="Gewaltige Natur, ehrlich erzählt." stagger={0.04} /></h2>
        <div className="grid md:grid-cols-3 gap-px bg-white/10 mb-16">
          {items.map(({ Icon, t, d }, i) => (
            <FadeUp key={i} delay={0.1 * i}><div className="bg-black p-10 h-full"><Icon size={32} strokeWidth={1.5} style={{ color: GOMS }} className="mb-6" /><h3 className="text-2xl font-semibold mb-3">{t}</h3><p className="text-white/60 font-light leading-relaxed">{d}</p></div></FadeUp>
          ))}
        </div>
        <FadeUp delay={0.2}>
          <div className="max-w-3xl">
            <div className="text-xs uppercase tracking-[0.3em] text-white/40 mb-5">Content-Balance</div>
            <div className="space-y-4">
              {balance.map((b, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1.5"><span className="text-white/80">{b.label}</span><span className="text-white/50">{b.pct}</span></div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden"><motion.div className="h-full rounded-full" style={{ background: GOMS }} initial={{ width: 0 }} whileInView={{ width: b.w }} viewport={{ once: true }} transition={{ duration: 1.1, ease: EASE, delay: 0.15 * i }} /></div>
                </div>
              ))}
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ==================== DIE REGION ====================

function Region() {
  const items = [
    { t: "Die Walserdörfer", d: "Münster, Geschinen, Ulrichen, Obergesteln, Oberwald – seit Jahrhunderten kaum verändert." },
    { t: "Trails & Höhenweg", d: "Der Gommer Höhenweg, einsame Pfade, der junge Rotten als ständiger Begleiter." },
    { t: "Berge & Aussichten", d: "Viertausender am Horizont, Pässe, Gipfel – gewaltige Natur zum Greifen nah." },
    { t: "Untertouristisch", d: "Ein Hochtal, das die wenigsten kennen – genau das macht es so wertvoll." },
  ];
  return (
    <section className="bg-black text-white py-28 md:py-40 px-6">
      <div className="max-w-7xl mx-auto">
        <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Die Region</div></FadeUp>
        <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-[0.9] mb-8"><AnimatedWords text="Das ganze Goms – erlebt, nicht abfotografiert." stagger={0.04} /></h2>
        <FadeUp delay={0.25}><p className="text-lg md:text-xl text-white/60 font-light max-w-3xl mb-14">Drei Ziele in einem Film: ein starkes Abenteuer für die Community, eine einzigartige Region sichtbar machen – und Aufmerksamkeit für den Gletscher. In genau dieser Reihenfolge.</p></FadeUp>
        <div className="grid md:grid-cols-2 gap-x-12">
          {items.map((it, i) => (
            <FadeUp key={i} delay={0.06 * i}>
              <div className="grid grid-cols-[auto_1fr] gap-5 py-7 border-t border-white/15 items-baseline">
                <div className="text-sm font-bold tabular-nums" style={{ color: GOMS }}>{String(i + 1).padStart(2, "0")}</div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-1.5">{it.t}</h3>
                  <p className="text-white/60 font-light leading-relaxed">{it.d}</p>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==================== DAS BEKOMMT IHR ====================

function Deliverables() {
  const pieces = [
    { n: "1", t: "YouTube-Folge", d: "Das Herzstück. Die ganze Geschichte – für immer festgehalten." },
    { n: "1", t: "Reel", d: "Der virale Kurzclip aus den stärksten Momenten." },
    { n: "Mehrere", t: "Stories", d: "Live vom Lauf: Sonnenaufgang, Etappen, Ziel – Reichweite am Tag selbst." },
    { n: "100+", t: "Fotos & Footage", d: "Hochwertige Aufnahmen zur freien Nutzung durch die Region." },
  ];
  return (
    <section className="bg-zinc-950 text-white py-28 md:py-40 px-6">
      <div className="max-w-7xl mx-auto">
        <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Das bekommt ihr</div></FadeUp>
        <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-[0.9] mb-16"><AnimatedWords text="Eure Region, festgehalten." stagger={0.05} /></h2>
        <div className="grid grid-cols-2 md:grid-cols-4 border-t border-white/15">
          {pieces.map((p, i) => (
            <FadeUp key={i} delay={i * 0.08}>
              <div className="border-b md:border-b-0 border-r border-white/15 py-9 pr-4 md:pl-6 first:md:pl-0 h-full">
                <div className="text-3xl md:text-5xl font-bold tracking-tight" style={{ color: i === 0 ? GOMS : "#fff" }}>{p.n}</div>
                <div className="text-base font-semibold mt-3">{p.t}</div>
                <div className="text-sm text-white/55 font-light mt-2 leading-relaxed">{p.d}</div>
              </div>
            </FadeUp>
          ))}
        </div>
        <FadeUp delay={0.3}>
          <div className="mt-14 flex flex-col md:flex-row md:items-end gap-6 md:gap-16 border-t border-white/15 pt-10">
            <div className="flex gap-10">
              <div><div className="text-4xl md:text-6xl font-bold" style={{ color: GOMS }}>12 Mio.</div><div className="text-xs uppercase tracking-wider text-white/50 mt-2">Aufrufe / 90 Tage</div></div>
              <div><div className="text-4xl md:text-6xl font-bold">794k</div><div className="text-xs uppercase tracking-wider text-white/50 mt-2">Konten erreicht</div></div>
            </div>
            <p className="text-white/60 font-light md:text-lg md:max-w-md">Eure Region – vor einem Publikum, das wirklich hinschaut. Plus freigegebenes Material zur Weiternutzung.</p>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ==================== ROLLOUT ====================

function Rollout() {
  const phases = [
    { k: "Vorher", d: "Teaser-Reel, das andeutet statt verrät. Ankündigung an die Community, Partner getaggt." },
    { k: "Während", d: "Live-Fotos & Stories vom Lauf – Sonnenaufgang, Etappen, Ziel. Auswahl sofort postbar für Reichweite am Tag." },
    { k: "Nachher", d: "YouTube-Hauptvideo als Herzstück. Reels & Shorts, Collab-Posts, freigegebenes Material für die Region." },
  ];
  return (
    <section className="bg-black text-white py-28 md:py-40 px-6">
      <div className="max-w-7xl mx-auto">
        <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-6">Rollout</div></FadeUp>
        <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-[0.9] mb-16"><AnimatedWords text="Spannung. Live. Nachhall." stagger={0.05} /></h2>
        <div className="grid md:grid-cols-3 gap-6">
          {phases.map((p, i) => (
            <FadeUp key={i} delay={0.1 * i}>
              <div className="border border-white/12 p-10 h-full">
                <div className="text-5xl font-bold mb-6" style={{ color: GOMS }}>{String(i + 1).padStart(2, "0")}</div>
                <h3 className="text-2xl font-semibold mb-3">{p.k}</h3>
                <p className="text-white/60 font-light leading-relaxed">{p.d}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==================== ANGEBOT ====================

function Angebot() {
  const incl = [
    "Konzeption, Lauf-Projekt & Durchführung (60 km / 4'500 hm, an einem Tag)",
    "Team vor Ort: Pierre + Fotografin/Filmerin an Schlüsselpunkten",
    "YouTube-Hauptvideo (das Herzstück)",
    "Reels & Shorts aus den besten Momenten",
    "Live-Content am Tag (Stories & Fotos)",
    "Freigegebenes Bild-/Videomaterial zur Weiternutzung durch die Region",
  ];
  return (
    <section id="angebot" className="relative bg-zinc-950 text-white py-28 md:py-40 px-6 overflow-hidden scroll-mt-16">
      <div className="absolute inset-0 opacity-20">
        <Image src="/goms/aerial.png" alt="" fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/70 to-black" />
      </div>
      <div className="relative z-10 max-w-5xl mx-auto">
        <FadeUp><div className="text-xs uppercase tracking-[0.4em] text-white/50 mb-6">Das Angebot</div></FadeUp>
        <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-[0.9] mb-10"><AnimatedWords text="Alles aus einer Hand." stagger={0.05} /></h2>
        <div className="grid md:grid-cols-[1fr_auto] gap-10 md:gap-16 items-end">
          <ul className="space-y-3">
            {incl.map((b, i) => (
              <FadeUp key={i} delay={0.05 * i}><li className="flex items-start gap-3 text-white/80 font-light md:text-lg"><span className="mt-2.5 h-1.5 w-1.5 rounded-full shrink-0" style={{ background: GOMS }} /> {b}</li></FadeUp>
            ))}
          </ul>
          <FadeUp delay={0.2}>
            <div className="border border-white/15 p-8 md:p-10 text-center md:text-right bg-black/40">
              <div className="text-xs uppercase tracking-[0.3em] text-white/50 mb-3">Pauschale</div>
              <div className="text-6xl md:text-7xl font-bold tracking-tight">CHF 3’000</div>
              <div className="text-sm text-white/50 mt-3">für das gesamte Projekt</div>
            </div>
          </FadeUp>
        </div>
        <FadeUp delay={0.3}><p className="text-white/45 text-sm mt-12 max-w-2xl">Termin: 30. Juni oder 4. Juli 2026 (Wetter-Ausweichtermin definiert). Nutzungsrechte & Collab-Bedingungen vorab kurz schriftlich.</p></FadeUp>
      </div>
    </section>
  );
}

// ==================== KONTAKT ====================

function Contact() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1.2, 1]);
  return (
    <section ref={ref} className="relative min-h-screen flex items-center px-6 py-32 overflow-hidden bg-black text-white">
      <motion.div className="absolute inset-0" style={{ scale }}>
        <Image src="/goms/aerial.png" alt="" fill className="object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/50 to-black" />
      </motion.div>
      <div className="relative z-10 max-w-5xl mx-auto w-full text-center">
        <FadeUp><p className="text-xl md:text-3xl text-white/60 italic mb-12">„Ich bin 60 km gelaufen, um diesen Gletscher zu sehen – bevor er weg ist.“</p></FadeUp>
        <h2 className="text-6xl md:text-9xl font-bold tracking-tight leading-[0.85] mb-12"><AnimatedWords text="Lauf mit uns." stagger={0.07} /></h2>
        <FadeUp delay={0.5}>
          <div className="inline-flex flex-col items-center gap-5">
            <div className="text-2xl font-semibold">Pierre Biege</div>
            <a href="mailto:pierre@laeuft.ch" className="flex items-center gap-3 text-white/80 hover:text-white transition-colors text-lg group"><Mail size={20} className="group-hover:scale-110 transition-transform" /> pierre@laeuft.ch</a>
            <a href="tel:+41798533672" className="flex items-center gap-3 text-white/80 hover:text-white transition-colors text-lg group"><Phone size={20} className="group-hover:scale-110 transition-transform" /> +41 79 853 36 72</a>
          </div>
        </FadeUp>
        <FadeUp delay={0.8}><div className="mt-24 text-xs uppercase tracking-[0.4em] text-white/30">laeuft.ch · Ein richtig guter Tag</div></FadeUp>
      </div>
    </section>
  );
}

// ==================== PAGE ====================

export default function GomsPresentationPage() {
  return (
    <div className="font-sans antialiased bg-black">
      <Header />
      <Hero />
      <RouteMap />
      <Idee />
      <Region />
      <Eckwerte />
      <Deliverables />
      <Visuell />
      <Botschaft />
      <Rollout />
      <Angebot />
      <Contact />
    </div>
  );
}

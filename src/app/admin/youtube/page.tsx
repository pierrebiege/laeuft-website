"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Mountain,
  Zap,
  Flame,
  Brain,
  Heart,
  Rocket,
  Users,
  Star,
  CalendarDays,
  LayoutGrid,
  Film,
  ChevronDown,
  ChevronRight,
  PlayCircle,
} from "lucide-react";

// ============================================================
// Types
// ============================================================
type VideoStatus = "open" | "progress" | "done";
type Rating = "S" | "A";
type ArcPhase = "Prequel" | "Setup" | "Race Day" | "Aftermath";
type ViewMode = "calendar" | "clusters" | "arcs";

interface VideoIdea {
  id: number;
  title: string;
  rating: Rating;
  cluster: string;
  color: string;
  desc: string;
  formula: string | null;
  week: string;
  arc?: ArcPhase;
  arcRace?: string;
}

// ============================================================
// Data
// ============================================================
const RACES = [
  { name: "Wittiker Backyard", who: "Pierre", date: "2026-05-14", color: "#22c55e" },
  { name: "Varner Backyard", who: "Lea", date: "2026-06-27", color: "#f472b6" },
  { name: "99 Laps", who: "Pierre", date: "2026-07-25", color: "#f59e0b" },
  { name: "Last Soul Ultra", who: "Pierre", date: "2026-08-14", color: "#ef4444" },
];

const CLUSTER_ICONS: Record<string, React.ElementType> = {
  "Wittiker Backyard": Mountain,
  "Varner Backyard (Lea)": Heart,
  "99 Laps": Zap,
  "Last Soul Ultra": Flame,
  "Training & Wissenschaft": Brain,
  "Mindset & Story": Heart,
  "Challenges & Crossover": Rocket,
  "Collabs & Hybrid": Users,
  "Evergreen": Star,
};

const VIDEOS: VideoIdea[] = [
  // W15: LAUNCH
  { id: 49, title: "Mein Weg zum Ultrarunner – die komplette Geschichte", rating: "S", cluster: "Mindset & Story", color: "#ec4899", desc: "Origin-Video MUSS zuerst kommen", formula: null, week: "W15" },
  { id: 50, title: "Tag 600: Warum ich fast aufgehört habe", rating: "S", cluster: "Mindset & Story", color: "#ec4899", desc: "Stärkster Hook deines Channels", formula: null, week: "W15" },
  // W16: Lea Varner
  { id: 91, title: "Meine Frau läuft ihren ersten Backyard Ultra", rating: "S", cluster: "Varner Backyard (Lea)", color: "#f472b6", desc: "Paar-Content = breiter Appeal. Footage von März!", formula: null, week: "W16", arc: "Setup", arcRace: "Varner" },
  { id: 92, title: "Lea vs. Backyard Ultra – Das komplette Rennen", rating: "S", cluster: "Varner Backyard (Lea)", color: "#f472b6", desc: "Race-Footage von März sofort nutzen", formula: null, week: "W16", arc: "Race Day", arcRace: "Varner" },
  // W17-W19: Wittiker Setup
  { id: 1, title: "Was ist ein Backyard Ultra? Das brutalste Rennformat der Welt", rating: "S", cluster: "Wittiker Backyard", color: "#22c55e", desc: "Evergreen-Explainer, kaum DE-Konkurrenz", formula: null, week: "W17", arc: "Setup", arcRace: "Wittiker" },
  { id: 2, title: "Meine Backyard-Strategie: Schlafen, Essen, Überleben", rating: "S", cluster: "Wittiker Backyard", color: "#22c55e", desc: "Hohe Suchnachfrage, fast null Content", formula: null, week: "W17", arc: "Setup", arcRace: "Wittiker" },
  { id: 3, title: "6 Wochen bis zum Backyard Ultra – so bereite ich mich vor", rating: "A", cluster: "Wittiker Backyard", color: "#22c55e", desc: "Countdown-Serie", formula: null, week: "W18", arc: "Setup", arcRace: "Wittiker" },
  { id: 5, title: "Wie schläft man bei einem 48h-Rennen?", rating: "S", cluster: "Wittiker Backyard", color: "#22c55e", desc: "Massives Suchinteresse", formula: null, week: "W18", arc: "Setup", arcRace: "Wittiker" },
  { id: 4, title: "Was ich bei einem Backyard Ultra esse (10.000+ kcal)", rating: "S", cluster: "Wittiker Backyard", color: "#22c55e", desc: "Full day of eating + Shock-Value", formula: null, week: "W19", arc: "Setup", arcRace: "Wittiker" },
  { id: 6, title: "Mein komplettes Race-Setup für den Wittiker Backyard", rating: "A", cluster: "Wittiker Backyard", color: "#22c55e", desc: "Gear-Content mit Search-Intent", formula: null, week: "W19", arc: "Setup", arcRace: "Wittiker" },
  // W20-W22: Wittiker Evergreen + Race + Aftermath
  { id: 29, title: "Vergiss Gels – probier dieses natürliche Race Fuel", rating: "A", cluster: "Last Soul Ultra", color: "#ef4444", desc: "Identity-Formel", formula: "Identity", week: "W20", arc: "Aftermath", arcRace: "Last Soul" },
  { id: 30, title: "30 Tage Hybrid Training als Ultrarunner", rating: "A", cluster: "Last Soul Ultra", color: "#ef4444", desc: "Transformation-Format", formula: "Transformation", week: "W20", arc: "Aftermath", arcRace: "Last Soul" },
  { id: 7, title: "Wittiker Backyard Ultra – Das komplette Rennen", rating: "S", cluster: "Wittiker Backyard", color: "#22c55e", desc: "EIN starkes Video, kein Split", formula: null, week: "W21", arc: "Race Day", arcRace: "Wittiker" },
  { id: 8, title: "Wittiker Backyard – Was ich gelernt habe", rating: "A", cluster: "Wittiker Backyard", color: "#22c55e", desc: "Reflexion + Learnings", formula: null, week: "W21", arc: "Aftermath", arcRace: "Wittiker" },
  { id: 9, title: "Backyard Ultra vs. Ultramarathon – was ist härter?", rating: "A", cluster: "Wittiker Backyard", color: "#22c55e", desc: "Vergleichsformat", formula: null, week: "W22", arc: "Aftermath", arcRace: "Wittiker" },
  { id: 10, title: "ULTRARUNNER ERKLÄRT: Laufgewohnheiten die dich verletzen", rating: "S", cluster: "Wittiker Backyard", color: "#22c55e", desc: "Authority-Formel (61x Outlier)", formula: "Authority 61x", week: "W22", arc: "Aftermath", arcRace: "Wittiker" },
  // W23: Last Soul Prequel
  { id: 94, title: "Ich bin am Last Soul 2025 angetreten und es hat mich zerstört", rating: "S", cluster: "Last Soul Ultra", color: "#ef4444", desc: "PREQUEL: Flashback 2025, emotional", formula: null, week: "W23", arc: "Prequel", arcRace: "Last Soul" },
  { id: 95, title: "Was ich beim Last Soul 2025 falsch gemacht habe", rating: "S", cluster: "Last Soul Ultra", color: "#ef4444", desc: "Bridge 2025→2026", formula: null, week: "W23", arc: "Prequel", arcRace: "Last Soul" },
  // W24-W25: Collab + Evergreen
  { id: 77, title: "Ich trainiere einen Tag mit Kim Gottwald", rating: "S", cluster: "Collabs & Hybrid", color: "#f97316", desc: "FRÜH platziert = maximaler Boost", formula: null, week: "W24" },
  { id: 54, title: "Warum Ultrarunning NICHT gesund ist", rating: "S", cluster: "Mindset & Story", color: "#ec4899", desc: "Kontroverser Take, breiter Appeal", formula: null, week: "W24" },
  { id: 36, title: "Was ich an einem Trainingstag esse (Full Day of Eating)", rating: "S", cluster: "Training & Wissenschaft", color: "#8b5cf6", desc: "Bewährtes Format", formula: null, week: "W25" },
  { id: 39, title: "Was passiert mit deinem Körper bei einem 100km-Lauf?", rating: "S", cluster: "Training & Wissenschaft", color: "#8b5cf6", desc: "Massives Suchvolumen, virales Potenzial", formula: null, week: "W25" },
  // W26-W27: Varner + Evergreen
  { id: 93, title: "Was Lea beim Varner gelernt hat (und was ICH als Crew)", rating: "A", cluster: "Varner Backyard (Lea)", color: "#f472b6", desc: "Doppel-Perspektive nach dem Race", formula: null, week: "W26", arc: "Aftermath", arcRace: "Varner" },
  { id: 40, title: "Was passiert mit deinem Darm bei einem Ultra?", rating: "S", cluster: "Training & Wissenschaft", color: "#8b5cf6", desc: "Schock + Wissenschaft", formula: null, week: "W26" },
  { id: 58, title: "Ultra-Laufen als Vater – Familie und Training", rating: "S", cluster: "Mindset & Story", color: "#ec4899", desc: "Breiter Appeal", formula: null, week: "W27" },
  { id: 37, title: "Koffein-Strategie beim Backyard Ultra", rating: "A", cluster: "Training & Wissenschaft", color: "#8b5cf6", desc: "Spezifisch, hoher Nutzen", formula: null, week: "W27" },
  // W28-W30: 99 Laps Setup
  { id: 13, title: "99 Laps erklärt: Das brutalste Elimination-Rennen", rating: "S", cluster: "99 Laps", color: "#f59e0b", desc: "FIRST MOVER auf YouTube", formula: null, week: "W28", arc: "Setup", arcRace: "99 Laps" },
  { id: 14, title: "Ich laufe gegen Andri Stöhle, Stefan Pütz & Co", rating: "S", cluster: "99 Laps", color: "#f59e0b", desc: "Name-Dropping, zieht Audiences", formula: null, week: "W28", arc: "Setup", arcRace: "99 Laps" },
  { id: 15, title: "Meine Strategie für ein Elimination Race", rating: "A", cluster: "99 Laps", color: "#f59e0b", desc: "Sprint oder Verstecken?", formula: null, week: "W29", arc: "Setup", arcRace: "99 Laps" },
  { id: 19, title: "Die Mathe hinter 99 Laps", rating: "A", cluster: "99 Laps", color: "#f59e0b", desc: "Daten/Taktik-Content", formula: null, week: "W29", arc: "Setup", arcRace: "99 Laps" },
  { id: 80, title: "Ich trainiere mit Andri Stöhle vor 99 Laps", rating: "A", cluster: "Collabs & Hybrid", color: "#f97316", desc: "Pre-Race Collab", formula: null, week: "W30" },
  { id: 45, title: "Apple Watch Ultra vs. 20-CHF-Casio auf 100km", rating: "S", cluster: "Training & Wissenschaft", color: "#8b5cf6", desc: "Tech-Crossover", formula: null, week: "W30" },
  // W31: 99 Laps Race
  { id: 16, title: "99 Laps – Das komplette Rennen", rating: "S", cluster: "99 Laps", color: "#f59e0b", desc: "Race Vlog", formula: null, week: "W31", arc: "Race Day", arcRace: "99 Laps" },
  { id: 17, title: "99 Laps – Was ich daraus gelernt habe", rating: "A", cluster: "99 Laps", color: "#f59e0b", desc: "Recap + Überleitung Last Soul", formula: null, week: "W31", arc: "Aftermath", arcRace: "99 Laps" },
  // W32: 99 Laps Aftermath
  { id: 18, title: "Elimination Race vs. Backyard Ultra – brutaler?", rating: "A", cluster: "99 Laps", color: "#f59e0b", desc: "Vergleich deiner Erfahrungen", formula: null, week: "W32", arc: "Aftermath", arcRace: "99 Laps" },
  { id: 20, title: "20 Tage zwischen 99 Laps und Last Soul", rating: "A", cluster: "99 Laps", color: "#f59e0b", desc: "Bridge zu Last Soul", formula: null, week: "W32", arc: "Aftermath", arcRace: "99 Laps" },
  // W33: Last Soul Setup
  { id: 21, title: "Last Soul Ultra 2026 – warum ich zurückgehe", rating: "S", cluster: "Last Soul Ultra", color: "#ef4444", desc: "Redemption-Arc", formula: null, week: "W33", arc: "Setup", arcRace: "Last Soul" },
  { id: 23, title: "4 Wochen bis Last Soul – mein neuer Plan", rating: "A", cluster: "Last Soul Ultra", color: "#ef4444", desc: "Was sich seit 2025 verändert hat", formula: null, week: "W33", arc: "Setup", arcRace: "Last Soul" },
  // W34: Last Soul Race
  { id: 24, title: "Last Soul Ultra 2026 – Das komplette Rennen", rating: "S", cluster: "Last Soul Ultra", color: "#ef4444", desc: "MAIN EVENT Race Doku", formula: null, week: "W34", arc: "Race Day", arcRace: "Last Soul" },
  { id: 25, title: "Last Soul hat alles verändert", rating: "S", cluster: "Last Soul Ultra", color: "#ef4444", desc: "Emotional, Cliffhanger", formula: null, week: "W34", arc: "Aftermath", arcRace: "Last Soul" },
  // W35: Last Soul Aftermath
  { id: 26, title: "Meine Frau und Kinder waren nicht dabei", rating: "A", cluster: "Last Soul Ultra", color: "#ef4444", desc: "Einschulung vs. Race", formula: null, week: "W35", arc: "Aftermath", arcRace: "Last Soul" },
  { id: 27, title: "Last Soul 2025 vs. 2026 – der komplette Vergleich", rating: "A", cluster: "Last Soul Ultra", color: "#ef4444", desc: "Schliesst den Redemption-Arc ab", formula: null, week: "W35", arc: "Aftermath", arcRace: "Last Soul" },
  // W36-W40: Post-Race
  { id: 42, title: "Schlafentzug beim Ultra: 30+ Stunden wach", rating: "S", cluster: "Training & Wissenschaft", color: "#8b5cf6", desc: "Halluzinationen als Hook", formula: null, week: "W36" },
  { id: 66, title: "50km nur mit Google Maps 'schlechteste Route'", rating: "S", cluster: "Challenges & Crossover", color: "#06b6d4", desc: "Fun, unberechenbar", formula: null, week: "W36" },
  { id: 41, title: "Was 100 Meilen mit deinem Gehirn machen", rating: "A", cluster: "Training & Wissenschaft", color: "#8b5cf6", desc: "Neurowissenschaft", formula: null, week: "W37" },
  { id: 67, title: "ChatGPT plant mein Ultra-Training 30 Tage", rating: "S", cluster: "Challenges & Crossover", color: "#06b6d4", desc: "AI-Trend 2026", formula: null, week: "W37" },
  { id: 52, title: "Meine grössten Fails als Läufer (Top 5)", rating: "A", cluster: "Mindset & Story", color: "#ec4899", desc: "Listicle + Authentizität", formula: null, week: "W38" },
  { id: 43, title: "Recovery-Routine nach 200km", rating: "A", cluster: "Training & Wissenschaft", color: "#8b5cf6", desc: "Praktisch", formula: null, week: "W38" },
  { id: 76, title: "COACH VERRÄT: Deine Zone-2-Daten sind falsch", rating: "S", cluster: "Training & Wissenschaft", color: "#8b5cf6", desc: "Authority-Formel (61x)", formula: "Authority 61x", week: "W39" },
  { id: 71, title: "Nicht-Läufer reagieren auf Ultra-Content", rating: "A", cluster: "Challenges & Crossover", color: "#06b6d4", desc: "Reaktionsformat", formula: null, week: "W39" },
  { id: 70, title: "Ernährungstausch mit einem Bodybuilder", rating: "S", cluster: "Challenges & Crossover", color: "#06b6d4", desc: "Collab, Gym-Audience", formula: null, week: "W40" },
  { id: 74, title: "Hört auf Goggins zu schauen – fangt an zu laufen", rating: "A", cluster: "Challenges & Crossover", color: "#06b6d4", desc: "Polarisiert", formula: null, week: "W40" },
  // W41-W44: Collabs + Hybrid
  { id: 48, title: "700 Tage Garmin-Schlafdaten in 12 Minuten", rating: "S", cluster: "Training & Wissenschaft", color: "#8b5cf6", desc: "Compression-Formel (80x)", formula: "Compression 80x", week: "W41" },
  { id: 79, title: "Ich teste Kims Trainingsplan für eine Woche", rating: "A", cluster: "Collabs & Hybrid", color: "#f97316", desc: "'Ich teste X'-Format", formula: null, week: "W41" },
  { id: 35, title: "Hör auf zu dehnen – mach DAS statt dessen", rating: "A", cluster: "Training & Wissenschaft", color: "#8b5cf6", desc: "Contrarian", formula: null, week: "W42" },
  { id: 72, title: "Die verrücktesten Ultraläufe der Welt", rating: "A", cluster: "Challenges & Crossover", color: "#06b6d4", desc: "Listicle", formula: null, week: "W42" },
  { id: 57, title: "Ich bin 35 – 10 Minuten, 10 Jahre Verletzungen gespart", rating: "A", cluster: "Mindset & Story", color: "#ec4899", desc: "Mentor-Formel (6.8x)", formula: "Mentor 6.8x", week: "W43" },
  { id: 59, title: "Tagesablauf: IT-Firma, Ultra, Familie", rating: "A", cluster: "Mindset & Story", color: "#ec4899", desc: "Day in the Life", formula: null, week: "W43" },
  { id: 31, title: "90% aller Läufer trainieren zu schnell", rating: "S", cluster: "Training & Wissenschaft", color: "#8b5cf6", desc: "Contrarian + Suchvolumen", formula: null, week: "W44" },
  { id: 32, title: "Zone 2: Langsamer Laufen = schneller werden", rating: "S", cluster: "Training & Wissenschaft", color: "#8b5cf6", desc: "Riesiges Keyword, Evergreen", formula: null, week: "W44" },
  // W45-W48: Contrarian + Hybrid
  { id: 28, title: "Du hast genug Cardio. Fang an zu heben.", rating: "S", cluster: "Challenges & Crossover", color: "#06b6d4", desc: "Identity-Formel (100x)", formula: "Identity 100x", week: "W45" },
  { id: 47, title: "Teure Laufschuhe sind ein Scam", rating: "A", cluster: "Training & Wissenschaft", color: "#8b5cf6", desc: "Contrarian", formula: null, week: "W45" },
  { id: 44, title: "Smartwatch für Recovery – die 2026-Methode", rating: "A", cluster: "Training & Wissenschaft", color: "#8b5cf6", desc: "Novelty-Formel (11x)", formula: "Novelty 11x", week: "W46" },
  { id: 75, title: "'Einfach weiterlaufen' ist der dümmste Rat", rating: "A", cluster: "Challenges & Crossover", color: "#06b6d4", desc: "Contrarian", formula: null, week: "W46" },
  { id: 62, title: "Die wahren Kosten eines Ultralaufs", rating: "A", cluster: "Mindset & Story", color: "#ec4899", desc: "Geld = Neugier", formula: null, week: "W47" },
  { id: 64, title: "Easy Mode: Dein erster 50k", rating: "A", cluster: "Mindset & Story", color: "#ec4899", desc: "Beginner-Content", formula: "Novelty 65x", week: "W47" },
  { id: 83, title: "Blueprint: Hybrid-Athlete-Körper", rating: "S", cluster: "Collabs & Hybrid", color: "#f97316", desc: "Blueprint-Formel (100x)", formula: "Blueprint 100x", week: "W48" },
  { id: 84, title: "Verlierst du Muskeln beim Laufen?", rating: "A", cluster: "Collabs & Hybrid", color: "#f97316", desc: "Identity-Formel, Gym", formula: "Identity", week: "W48" },
  // W49-W50: Milestones
  { id: 51, title: "1000 Tage täglich laufen – Countdown", rating: "S", cluster: "Mindset & Story", color: "#ec4899", desc: "Milestone: 31% mehr Engagement", formula: null, week: "W49" },
  { id: 53, title: "Warum ich KEINE Marathons mehr laufe", rating: "A", cluster: "Mindset & Story", color: "#ec4899", desc: "Contrarian", formula: null, week: "W49" },
  { id: 55, title: "Mentale Tricks bei Kilometer 150", rating: "A", cluster: "Mindset & Story", color: "#ec4899", desc: "Praktisch + Neugier", formula: null, week: "W50" },
  { id: 69, title: "Subscriber bestimmen meinen 24h-Lauf", rating: "A", cluster: "Collabs & Hybrid", color: "#f97316", desc: "Community-Engagement", formula: null, week: "W50" },
  // W51-W53: Jahresende
  { id: 89, title: "Jahresrückblick 2026: 3 Races, 1000 Tage", rating: "S", cluster: "Evergreen", color: "#10b981", desc: "Dezember-Pflicht-Video", formula: null, week: "W51" },
  { id: 56, title: "5 Jahre Ultrarunning-Wissen in 14 Minuten", rating: "A", cluster: "Mindset & Story", color: "#ec4899", desc: "Compression (80x)", formula: "Compression 80x", week: "W51" },
  { id: 86, title: "Anfänger-Guide: Von 0 auf deinen ersten Ultra", rating: "S", cluster: "Evergreen", color: "#10b981", desc: "Evergreen, Search-Traffic", formula: null, week: "W52" },
  { id: 87, title: "Warum ich jeden Tag laufe", rating: "A", cluster: "Evergreen", color: "#10b981", desc: "Persönlich", formula: null, week: "W52" },
  { id: 90, title: "Race Season 2027 – was kommt", rating: "A", cluster: "Evergreen", color: "#10b981", desc: "Cliffhanger", formula: null, week: "W53" },
  { id: 34, title: "Schwer heben OHNE Laufen zu ruinieren", rating: "A", cluster: "Training & Wissenschaft", color: "#8b5cf6", desc: "Gym-Crossover", formula: null, week: "W53" },
  // Evergreen
  { id: 65, title: "Ich laufe jeden SBB-Halt ab", rating: "S", cluster: "Challenges & Crossover", color: "#06b6d4", desc: "Kims Tram-Challenge für CH", formula: null, week: "W20" },
];

// ============================================================
// Week helpers
// ============================================================
function getWeekDate(week: string): { start: Date; end: Date; label: string } {
  const wNum = parseInt(week.replace("W", ""));
  const start = new Date(2026, 3, 6); // Apr 6 = W15
  start.setDate(start.getDate() + (wNum - 15) * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return {
    start,
    end,
    label: `${start.getDate()}.${start.getMonth() + 1}. – ${end.getDate()}.${end.getMonth() + 1}.`,
  };
}

const MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

// ============================================================
// Status persistence
// ============================================================
function getStatus(id: number): VideoStatus {
  if (typeof window === "undefined") return "open";
  return (localStorage.getItem(`yt-v-${id}`) as VideoStatus) || "open";
}

function setStatusStorage(id: number, status: VideoStatus) {
  localStorage.setItem(`yt-v-${id}`, status);
}

// ============================================================
// Component
// ============================================================
export default function YouTubePage() {
  const [view, setView] = useState<ViewMode>("calendar");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "s" | "open" | "progress" | "done">("all");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [, forceUpdate] = useState(0);

  const filtered = useMemo(() => {
    return VIDEOS.filter((v) => {
      const st = getStatus(v.id);
      const ms =
        !search ||
        v.title.toLowerCase().includes(search.toLowerCase()) ||
        v.cluster.toLowerCase().includes(search.toLowerCase()) ||
        (v.formula || "").toLowerCase().includes(search.toLowerCase()) ||
        v.desc.toLowerCase().includes(search.toLowerCase());
      let mf = true;
      if (filter === "s") mf = v.rating === "S";
      else if (filter === "open") mf = st === "open";
      else if (filter === "progress") mf = st === "progress";
      else if (filter === "done") mf = st === "done";
      return ms && mf;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filter, expanded]);

  const stats = useMemo(() => {
    const all = VIDEOS.map((v) => getStatus(v.id));
    return {
      total: VIDEOS.length,
      s: VIDEOS.filter((v) => v.rating === "S").length,
      done: all.filter((s) => s === "done").length,
      progress: all.filter((s) => s === "progress").length,
      open: all.filter((s) => s === "open").length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  function handleStatus(id: number, status: VideoStatus) {
    setStatusStorage(id, status);
    forceUpdate((n) => n + 1);
  }

  function toggleExpand(id: number) {
    setExpanded(expanded === id ? null : id);
  }

  // ============================================================
  // Render helpers
  // ============================================================
  function StatusBadge({ status }: { status: VideoStatus }) {
    const colors = {
      open: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
      progress: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      done: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    };
    const labels = { open: "Offen", progress: "In Arbeit", done: "Erledigt" };
    return <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${colors[status]}`}>{labels[status]}</span>;
  }

  function VideoCard({ v, compact }: { v: VideoIdea; compact?: boolean }) {
    const st = getStatus(v.id);
    const isExpanded = expanded === v.id;
    return (
      <div
        onClick={() => toggleExpand(v.id)}
        className={`rounded-lg border p-3 cursor-pointer transition-all ${
          st === "done"
            ? "opacity-40 border-green-800"
            : st === "progress"
            ? "border-amber-500 border-2"
            : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600"
        } bg-white dark:bg-zinc-900`}
      >
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            {!compact && <div className="text-[10px] text-zinc-400 mb-0.5">#{v.id} · {v.week}</div>}
            <div className={`text-sm font-semibold leading-tight ${st === "done" ? "line-through text-zinc-500" : "text-zinc-900 dark:text-white"}`}>
              {v.title}
            </div>
            <div className="flex gap-1 mt-1.5 flex-wrap">
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${v.rating === "S" ? "bg-amber-400 text-black" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"}`}>
                {v.rating === "S" ? "Pflicht" : "Stark"}
              </span>
              {v.arc && (
                <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: `${v.color}20`, color: v.color, border: `1px solid ${v.color}40` }}>
                  {v.arc}
                </span>
              )}
              {v.formula && <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">{v.formula}</span>}
              <StatusBadge status={st} />
            </div>
          </div>
        </div>
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <p className="text-xs text-zinc-500 mb-3">{v.desc}</p>
            <div className="flex gap-2">
              {(["open", "progress", "done"] as VideoStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={(e) => { e.stopPropagation(); handleStatus(v.id, s); }}
                  className={`text-[11px] px-3 py-1 rounded-md border transition-colors ${
                    st === s
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent"
                      : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  {{ open: "Offen", progress: "In Arbeit", done: "Erledigt" }[s]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // Calendar View
  // ============================================================
  function CalendarView() {
    const weeks = Array.from(new Set(VIDEOS.map((v) => v.week))).sort((a, b) => {
      return parseInt(a.replace("W", "")) - parseInt(b.replace("W", ""));
    });

    let currentMonth = -1;
    const fIds = new Set(filtered.map((v) => v.id));

    return (
      <div className="space-y-1">
        {weeks.map((week) => {
          const info = getWeekDate(week);
          const weekVideos = VIDEOS.filter((v) => v.week === week);
          const visibleVideos = weekVideos.filter((v) => fIds.has(v.id));
          const monthNum = info.start.getMonth();
          const showMonth = monthNum !== currentMonth;
          if (showMonth) currentMonth = monthNum;

          const raceThisWeek = RACES.find((r) => {
            const rd = new Date(r.date);
            return rd >= info.start && rd <= info.end;
          });

          return (
            <div key={week}>
              {showMonth && (
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mt-6 mb-3 flex items-center gap-3">
                  {MONTHS[monthNum]} 2026
                  {RACES.filter((r) => new Date(r.date).getMonth() === monthNum).map((r) => (
                    <span key={r.name} className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: `${r.color}20`, color: r.color }}>
                      {r.name} ({r.who}) – {new Date(r.date).getDate()}.{monthNum + 1}.
                    </span>
                  ))}
                </h3>
              )}
              {raceThisWeek && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-1" style={{ background: `${raceThisWeek.color}10`, border: `1px solid ${raceThisWeek.color}30` }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: raceThisWeek.color }} />
                  <span className="text-sm font-semibold" style={{ color: raceThisWeek.color }}>
                    {raceThisWeek.name} – {raceThisWeek.who}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-[70px_1fr_1fr] gap-2 items-start">
                <div className="text-xs text-zinc-400 pt-3 font-mono">{week}<br /><span className="text-[10px]">{info.label}</span></div>
                {visibleVideos.length > 0
                  ? visibleVideos.map((v) => <VideoCard key={v.id} v={v} />)
                  : weekVideos.map((v) => (
                      <div key={v.id} className="rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 p-3 opacity-30">
                        <div className="text-xs text-zinc-400">Gefiltert</div>
                      </div>
                    ))}
                {weekVideos.length < 2 && <div className="rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 p-3 opacity-20"><div className="text-xs text-zinc-500">Flex</div></div>}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ============================================================
  // Cluster View
  // ============================================================
  function ClusterView() {
    const clusters: Record<string, VideoIdea[]> = {};
    filtered.forEach((v) => {
      if (!clusters[v.cluster]) clusters[v.cluster] = [];
      clusters[v.cluster].push(v);
    });

    return (
      <div className="space-y-8">
        {Object.entries(clusters).map(([name, videos]) => {
          const Icon = CLUSTER_ICONS[name] || Star;
          const color = videos[0]?.color || "#888";
          return (
            <div key={name}>
              <div className="flex items-center gap-3 mb-3 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}20`, color }}>
                  <Icon size={16} />
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-white">{name}</h3>
                <span className="text-xs text-zinc-400 ml-auto">{videos.length} Videos</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                {videos.map((v) => <VideoCard key={v.id} v={v} />)}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ============================================================
  // Story Arc View
  // ============================================================
  function ArcView() {
    const arcRaces = ["Wittiker", "Varner", "99 Laps", "Last Soul"];
    const arcLabels: Record<string, string> = {
      Wittiker: "Wittiker Backyard – 14. Mai",
      Varner: "Varner Backyard (Lea) – 27. Juni",
      "99 Laps": "99 Laps – 25./26. Juli",
      "Last Soul": "Last Soul Ultra – 14. August",
    };
    const arcColors: Record<string, string> = { Wittiker: "#22c55e", Varner: "#f472b6", "99 Laps": "#f59e0b", "Last Soul": "#ef4444" };
    const phases: ArcPhase[] = ["Prequel", "Setup", "Race Day", "Aftermath"];

    return (
      <div className="space-y-10">
        {arcRaces.map((race) => {
          const raceVideos = filtered.filter((v) => v.arcRace === race);
          if (raceVideos.length === 0) return null;
          const col = arcColors[race];

          return (
            <div key={race}>
              <div className="flex items-center gap-3 mb-4">
                <Film size={20} style={{ color: col }} />
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{arcLabels[race]}</h3>
                <span className="text-xs text-zinc-400">{raceVideos.length} Videos</span>
              </div>
              {/* Arc progress */}
              <div className="flex gap-1 mb-4 h-1.5 rounded-full overflow-hidden">
                {phases.map((phase) => {
                  const has = raceVideos.some((v) => v.arc === phase);
                  const allDone = raceVideos.filter((v) => v.arc === phase).every((v) => getStatus(v.id) === "done");
                  return <div key={phase} className="flex-1 rounded-full" style={{ background: has ? col : "#333", opacity: has ? (allDone ? 1 : 0.4) : 0.1 }} />;
                })}
              </div>
              {phases.map((phase) => {
                const phaseVideos = raceVideos.filter((v) => v.arc === phase);
                if (phaseVideos.length === 0) return null;
                return (
                  <div key={phase} className="mb-4">
                    <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: col }}>{phase}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                      {phaseVideos.map((v) => <VideoCard key={v.id} v={v} />)}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }

  // ============================================================
  // Main Render
  // ============================================================
  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">YouTube Masterplan 2026</h1>
        <p className="text-sm text-zinc-500 mt-1">Ziel: 30.000 Abonnenten · 2 Videos/Woche · 4 Race Story-Arcs</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Videos", value: stats.total, color: "text-zinc-900 dark:text-white" },
          { label: "Pflicht (S)", value: stats.s, color: "text-amber-600" },
          { label: "Offen", value: stats.open, color: "text-zinc-500" },
          { label: "In Arbeit", value: stats.progress, color: "text-amber-500" },
          { label: "Erledigt", value: stats.done, color: "text-green-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-zinc-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* View Tabs */}
      <div className="flex gap-1 mb-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1 w-fit">
        {([
          { key: "calendar" as ViewMode, label: "Kalender", icon: CalendarDays },
          { key: "clusters" as ViewMode, label: "Cluster", icon: LayoutGrid },
          { key: "arcs" as ViewMode, label: "Story Arcs", icon: Film },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setView(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              view === t.key
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suche nach Titel, Cluster, Formel..."
            className="w-full pl-8 pr-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:border-zinc-400 dark:focus:border-zinc-600 text-zinc-900 dark:text-white"
          />
        </div>
        {(["all", "s", "open", "progress", "done"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
              filter === f
                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent"
                : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            {{ all: "Alle", s: "Pflicht (S)", open: "Offen", progress: "In Arbeit", done: "Erledigt" }[f]}
          </button>
        ))}
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">Keine Videos gefunden.</div>
      ) : view === "calendar" ? (
        <CalendarView />
      ) : view === "clusters" ? (
        <ClusterView />
      ) : (
        <ArcView />
      )}
    </div>
  );
}

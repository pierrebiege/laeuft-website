"use client";

import Image from "next/image";
import { Youtube, Instagram, Camera, Users, Mail, Phone, MapPin, Calendar } from "lucide-react";

export type Block =
  | { type: "cover"; title: string; subtitle?: string; image?: string }
  | { type: "bio"; heading: string; text: string; image?: string; stats?: { label: string; value: string }[] }
  | { type: "content-overview"; heading: string; channels: { icon: string; name: string; reach: string }[] }
  | { type: "race"; name: string; date: string; location: string; description: string; image?: string }
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

function CoverBlock({ block, customer }: { block: Extract<Block, { type: "cover" }>; customer: PresentationData }) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black text-white">
      {block.image && (
        <div className="absolute inset-0">
          <Image src={block.image} alt="" fill className="object-cover opacity-50" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black" />
        </div>
      )}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {customer.customer_logo_url && (
          <div className="mb-12 inline-block">
            <Image src={customer.customer_logo_url} alt={customer.customer_name} width={160} height={80} className="object-contain mx-auto" />
          </div>
        )}
        <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-[0.95] mb-6">
          {block.title}
        </h1>
        {block.subtitle && (
          <p className="text-xl md:text-2xl text-white/70 font-light tracking-wide">{block.subtitle}</p>
        )}
        <p className="mt-16 text-sm uppercase tracking-[0.3em] text-white/40">
          Eine Präsentation für {customer.customer_name}
        </p>
      </div>
    </section>
  );
}

function BioBlock({ block }: { block: Extract<Block, { type: "bio" }> }) {
  return (
    <section className="min-h-screen flex items-center bg-white py-32 px-6">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        <div>
          <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-zinc-900 mb-8 leading-none">
            {block.heading}
          </h2>
          <p className="text-xl md:text-2xl text-zinc-600 leading-relaxed font-light">{block.text}</p>
          {block.stats && block.stats.length > 0 && (
            <div className="mt-12 grid grid-cols-3 gap-6">
              {block.stats.map((s, i) => (
                <div key={i}>
                  <div className="text-4xl md:text-5xl font-bold text-zinc-900">{s.value}</div>
                  <div className="text-xs uppercase tracking-wider text-zinc-500 mt-2">{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        {block.image && (
          <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-zinc-100">
            <Image src={block.image} alt="" fill className="object-cover" />
          </div>
        )}
      </div>
    </section>
  );
}

function ContentOverviewBlock({ block }: { block: Extract<Block, { type: "content-overview" }> }) {
  return (
    <section className="min-h-screen flex items-center bg-zinc-950 text-white py-32 px-6">
      <div className="max-w-6xl mx-auto w-full">
        <h2 className="text-5xl md:text-7xl font-bold tracking-tight mb-20 leading-none">{block.heading}</h2>
        <div className="grid md:grid-cols-2 gap-px bg-zinc-800 rounded-3xl overflow-hidden">
          {block.channels.map((c, i) => {
            const Icon = ICON_MAP[c.icon] || Users;
            return (
              <div key={i} className="bg-zinc-950 p-10 hover:bg-zinc-900 transition-colors">
                <Icon size={40} className="text-white/80 mb-6" strokeWidth={1.5} />
                <h3 className="text-2xl font-semibold mb-2">{c.name}</h3>
                <p className="text-white/60">{c.reach}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function RaceBlock({ block, index }: { block: Extract<Block, { type: "race" }>; index: number }) {
  const dark = index % 2 === 0;
  return (
    <section className={`min-h-screen flex items-center py-32 px-6 ${dark ? "bg-black text-white" : "bg-white text-zinc-900"}`}>
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        {block.image && (
          <div className={`relative aspect-square rounded-3xl overflow-hidden ${dark ? "bg-zinc-900" : "bg-zinc-100"} ${index % 2 === 0 ? "" : "md:order-2"}`}>
            <Image src={block.image} alt={block.name} fill className="object-cover" />
          </div>
        )}
        <div>
          <div className={`text-xs uppercase tracking-[0.3em] mb-6 ${dark ? "text-white/50" : "text-zinc-500"}`}>
            Race {String(index).padStart(2, "0")}
          </div>
          <h2 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[0.95]">{block.name}</h2>
          <div className={`flex flex-wrap gap-6 mb-8 text-sm ${dark ? "text-white/70" : "text-zinc-600"}`}>
            <span className="flex items-center gap-2"><Calendar size={16} /> {block.date}</span>
            <span className="flex items-center gap-2"><MapPin size={16} /> {block.location}</span>
          </div>
          <p className={`text-xl md:text-2xl font-light leading-relaxed ${dark ? "text-white/80" : "text-zinc-600"}`}>
            {block.description}
          </p>
        </div>
      </div>
    </section>
  );
}

function GoalBlock({ block }: { block: Extract<Block, { type: "goal" }> }) {
  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white px-6 py-32">
      <div className="max-w-4xl mx-auto text-center">
        <div className="text-xs uppercase tracking-[0.3em] text-white/40 mb-8">{block.heading}</div>
        <p className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">{block.text}</p>
      </div>
    </section>
  );
}

function TeamBlock({ block }: { block: Extract<Block, { type: "team" }> }) {
  return (
    <section className="min-h-screen flex items-center bg-white py-32 px-6">
      <div className="max-w-6xl mx-auto w-full">
        <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-zinc-900 mb-20 leading-none">{block.heading}</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {block.members.map((m, i) => (
            <div key={i} className="group">
              <div className="aspect-square rounded-3xl bg-zinc-100 mb-6 overflow-hidden relative">
                {m.image && <Image src={m.image} alt={m.name} fill className="object-cover" />}
              </div>
              <h3 className="text-2xl font-semibold text-zinc-900">{m.name}</h3>
              <p className="text-zinc-500">{m.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function OfferBlock({ block, customer }: { block: Extract<Block, { type: "offer" }>; customer: PresentationData }) {
  return (
    <section className="min-h-screen flex items-center bg-zinc-950 text-white py-32 px-6">
      <div className="max-w-5xl mx-auto w-full">
        <div className="text-xs uppercase tracking-[0.3em] text-white/40 mb-6">Angebot</div>
        <h2 className="text-5xl md:text-7xl font-bold tracking-tight mb-16 leading-[0.95]">{block.heading}</h2>
        <ul className="space-y-px bg-white/10 rounded-3xl overflow-hidden">
          {block.bullets.map((b, i) => (
            <li key={i} className="bg-zinc-950 px-8 py-6 flex items-start gap-6 hover:bg-zinc-900 transition-colors">
              <span className="text-2xl font-bold text-white/30 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-lg md:text-xl font-light pt-1">{b}</span>
            </li>
          ))}
        </ul>
        {block.price && (
          <div className="mt-12 text-right">
            <div className="text-xs uppercase tracking-[0.3em] text-white/40 mb-2">Investment</div>
            <div className="text-5xl font-bold">{block.price}</div>
          </div>
        )}
      </div>
    </section>
  );
}

function ContactBlock({ block, customer }: { block: Extract<Block, { type: "contact" }>; customer: PresentationData }) {
  return (
    <section className="min-h-screen flex items-center justify-center bg-black text-white px-6 py-32">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-none">Let&apos;s Talk.</h2>
        <p className="text-xl text-white/60 mb-16 font-light">
          Wir freuen uns auf das Gespräch mit {customer.customer_name}.
        </p>
        <div className="inline-block text-left space-y-4">
          <div className="text-2xl font-semibold">{block.name}</div>
          <a href={`mailto:${block.email}`} className="flex items-center gap-3 text-white/80 hover:text-white transition-colors text-lg">
            <Mail size={20} /> {block.email}
          </a>
          {block.phone && (
            <a href={`tel:${block.phone}`} className="flex items-center gap-3 text-white/80 hover:text-white transition-colors text-lg">
              <Phone size={20} /> {block.phone}
            </a>
          )}
        </div>
        <div className="mt-24 text-xs uppercase tracking-[0.3em] text-white/30">
          läuft.ch
        </div>
      </div>
    </section>
  );
}

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

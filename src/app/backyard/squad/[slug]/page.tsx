import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Reveal from "@/app/backyard/_components/Reveal";
import Instagram from "@/app/backyard/_components/Instagram";
import { TEAM, PHOTO_BASE, pastResults, type Athlete } from "@/app/backyard/_data/event";
import { PROFILES, STAFF_PROFILES, PEOPLE_PHOTOS, type Profile } from "@/app/backyard/_data/people";

/** Läufer in Kaderreihenfolge, danach die Leute aus der Organisation. */
const RUNNERS = TEAM.filter((a): a is Athlete & { photo: string } => Boolean(a.photo));
const ORDER = [...RUNNERS.map((a) => a.photo), ...Object.keys(STAFF_PROFILES)];

type Person = {
  slug: string;
  first: string;
  name: string;
  stamp: string;
  profile: Profile;
  rows: [string, string][];
};

function person(slug: string): Person | null {
  const a = RUNNERS.find((r) => r.photo === slug);
  if (a) {
    const p = PROFILES[slug];
    if (!p) return null;
    const past = pastResults(a);
    const rows: [string, string][] = [
      ["Ticket", a.status === "silver" ? "Silver Ticket" : "At Large"],
      ["Qualifying", `${a.qual} loops`],
      ["Best", `${a.pb} loops`],
      ["Team championships", past.length ? past.map((r) => `${r.year}: ${r.laps}`).join(" · ") : "First time"],
      ...(p.facts ?? []),
    ];
    if (a.role) rows.unshift(["Role", a.role]);
    return {
      slug,
      first: p.call ?? a.first,
      name: a.name,
      stamp: `Squad · ${String(a.pos).padStart(2, "0")}`,
      profile: p,
      rows,
    };
  }
  const s = STAFF_PROFILES[slug];
  if (!s) return null;
  return {
    slug,
    first: s.first,
    name: s.name,
    stamp: `Race organisation · ${s.role}`,
    profile: s,
    rows: [["Role", s.role], ["Running on Saturday", "No"], ...(s.facts ?? [])],
  };
}

export function generateStaticParams() {
  return ORDER.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = person((await params).slug);
  if (!p) return {};
  return { title: `${p.first} ${p.name}`, description: p.profile.lead };
}

export default async function PersonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = person(slug);
  if (!p) notFound();
  const { profile } = p;

  const i = ORDER.indexOf(slug);
  const prev = person(ORDER[(i - 1 + ORDER.length) % ORDER.length])!;
  const next = person(ORDER[(i + 1) % ORDER.length])!;

  // Ohne eigene Bilder bleibt das Porträt von der Squad-Seite.
  const photos = profile.photos.length
    ? profile.photos.map(([w, h], n) => ({ src: `${PEOPLE_PHOTOS}/${slug}/${n + 1}.jpg`, w, h }))
    : [{ src: `${PHOTO_BASE}/${slug}.jpg`, w: 490, h: 800 }];
  const [hero, ...rest] = photos;

  return (
    <>
      <section data-hour="tag" data-stamp={p.stamp} className="px-5 pb-16 pt-28 sm:pb-24 sm:pt-32">
        <div className="mx-auto max-w-[76rem]">
          <div className="mb-10 flex items-baseline justify-between gap-6 border-b pb-4 rule">
            <span className="stamp">{p.stamp}</span>
            <Link href="/squad" className="stamp">
              All of the squad →
            </Link>
          </div>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
            <div className="self-start overflow-hidden border rule lg:sticky lg:top-24">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={hero.src}
                alt={`${p.first} ${p.name}`}
                width={hero.w}
                height={hero.h}
                className="block h-auto w-full"
                style={{ filter: "grayscale(1) contrast(1.06)" }}
              />
            </div>

            <div>
              <h1 className="display text-[2.8rem] leading-[0.95] sm:text-7xl">
                {p.first}
                <br />
                {p.name}
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-relaxed">{profile.lead}</p>

              <div className="mt-10 border-t rule">
                {p.rows.map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-6 border-b py-3 rule">
                    <span className="stamp">{k}</span>
                    <span className="text-right font-mono text-sm tnum">{v}</span>
                  </div>
                ))}
                {profile.instagram && (
                  <div className="flex items-baseline justify-between gap-6 border-b py-3 rule">
                    <span className="stamp">Instagram</span>
                    <a
                      href={`https://www.instagram.com/${profile.instagram}/`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-sm underline underline-offset-4"
                    >
                      @{profile.instagram} ↗
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-10 space-y-5">
                {profile.story.map((t) => (
                  <p key={t} className="max-w-xl text-[15px] leading-relaxed" style={{ color: "var(--byd-mute)" }}>
                    {t}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {profile.quote && (
        <section data-hour="daemmerung" data-stamp={`${p.first} in their words`} className="px-5 py-24 sm:py-32">
          <div className="mx-auto max-w-[76rem]">
            <Reveal>
              <blockquote>
                <p className="display max-w-4xl text-[2rem] leading-[1.05] sm:text-5xl">«{profile.quote}»</p>
                <footer className="stamp mt-8">
                  {p.first} {p.name}
                </footer>
              </blockquote>
            </Reveal>
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section data-hour="tag" data-stamp={`${p.first} · photos`} className="px-5 py-24">
          <div className="mx-auto max-w-[76rem]">
            <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
              {rest.map((ph) => (
                <div key={ph.src} className="mb-5 break-inside-avoid overflow-hidden border rule">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ph.src}
                    alt={`${p.first} ${p.name}`}
                    width={ph.w}
                    height={ph.h}
                    loading="lazy"
                    className="block h-auto w-full"
                    style={{ filter: "grayscale(1) contrast(1.06)" }}
                  />
                </div>
              ))}
            </div>
            {profile.credit && <p className="stamp mt-4">{profile.credit}</p>}
          </div>
        </section>
      )}

      <section data-hour="tag" data-stamp="Next" className="px-5 pb-24">
        <div className="mx-auto max-w-[76rem]">
          <div className="grid border-y sm:grid-cols-2 rule">
            <Link href={`/squad/${prev.slug}`} className="block py-8 sm:border-r sm:pr-8 rule">
              <span className="stamp">← Previous</span>
              <span className="display mt-3 block text-2xl sm:text-3xl">
                {prev.first} {prev.name}
              </span>
            </Link>
            <Link href={`/squad/${next.slug}`} className="block border-t py-8 sm:border-t-0 sm:pl-8 sm:text-right rule">
              <span className="stamp">Next →</span>
              <span className="display mt-3 block text-2xl sm:text-3xl">
                {next.first} {next.name}
              </span>
            </Link>
          </div>
          <Instagram className="mt-14" />
        </div>
      </section>
    </>
  );
}

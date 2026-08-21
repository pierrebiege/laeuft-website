"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSectionTheme } from "./useSectionTheme";
import { useRaceClock, countdownText } from "@/app/backyard/_lib/clock";
import { EVENT } from "@/app/backyard/_data/event";

const LINKS = [
  { href: "/backyard/live", label: "Live" },
  { href: "/backyard/welt", label: "Weltstand" },
  { href: "/backyard/team", label: "Kader" },
  { href: "/backyard/strecke", label: "Strecke" },
  { href: "/backyard/format", label: "Format" },
];

export default function Chrome() {
  const { hour, label, scrolled } = useSectionTheme();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const clock = useRaceClock(EVENT.startISO, 1000);

  useEffect(() => setOpen(false), [path]);

  return (
    <>
      <header
        data-hour={hour}
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
          scrolled || open ? "border-b" : "border-b border-transparent"
        }`}
        style={{
          background: scrolled || open ? "color-mix(in oklab, var(--byd-bg) 94%, transparent)" : "transparent",
          color: "var(--byd-fg)",
          borderColor: scrolled || open ? "var(--byd-rule)" : "transparent",
          backdropFilter: scrolled || open ? "blur(14px)" : undefined,
        }}
      >
        <nav className="mx-auto flex h-14 max-w-[76rem] items-center gap-6 px-5">
          <Link href="/backyard" className="flex shrink-0 items-center gap-2.5">
            <span className="relative grid h-[18px] w-[18px] place-items-center" style={{ background: "var(--byd-accent)" }}>
              <span className="absolute h-[11px] w-[3px] bg-white" />
              <span className="absolute h-[3px] w-[11px] bg-white" />
            </span>
            <span className="text-[13px] font-semibold uppercase tracking-[0.06em]">
              Team Schweiz
            </span>
          </Link>

          <div className="ml-auto hidden items-center gap-7 md:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="stamp transition-opacity hover:opacity-100"
                style={{ color: path === l.href ? "var(--byd-fg)" : undefined, opacity: path === l.href ? 1 : 0.75 }}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <Link
            href="/backyard/live"
            className="ml-auto flex shrink-0 items-center gap-2.5 border px-3 py-1.5 md:ml-0"
            style={{ borderColor: "var(--byd-rule)" }}
          >
            <span className="h-1.5 w-1.5 shrink-0 blink" style={{ background: "var(--byd-accent)" }} />
            <span className="font-mono text-[11px] tnum leading-none">
              {clock.running ? `RUNDE ${clock.lap}` : countdownText(clock)}
            </span>
          </Link>

          <button
            onClick={() => setOpen((o) => !o)}
            className="flex h-8 w-8 shrink-0 items-center justify-center md:hidden"
            aria-label="Menü"
            aria-expanded={open}
          >
            <span className="flex flex-col gap-[5px]">
              <span className="block h-px w-5 bg-current" />
              <span className="block h-px w-5 bg-current" />
            </span>
          </button>
        </nav>

        {open && (
          <div className="border-t px-5 pb-6 pt-3 md:hidden" style={{ borderColor: "var(--byd-rule)" }}>
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="display block border-b py-3 text-2xl"
                style={{ borderColor: "var(--byd-rule)" }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Die Stundenschiene: zeigt am linken Rand, in welcher Rennstunde
          man beim Scrollen gerade steckt. */}
      {label && (
        <div
          data-hour={hour}
          className="pointer-events-none fixed left-0 top-1/2 z-40 hidden -translate-y-1/2 lg:block"
          style={{ color: "var(--byd-fg)" }}
        >
          <div
            className="stamp whitespace-nowrap py-2 pl-4"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            {label}
          </div>
        </div>
      )}
    </>
  );
}

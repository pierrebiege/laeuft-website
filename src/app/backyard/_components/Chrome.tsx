"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSectionTheme } from "./useSectionTheme";
import { useRaceClock, countdownText } from "@/app/backyard/_lib/clock";
import { EVENT } from "@/app/backyard/_data/event";

const LINKS = [
  { href: "/live", label: "Live" },
  { href: "/world", label: "World" },
  { href: "/squad", label: "Squad" },
  { href: "/course", label: "Course" },
  { href: "/rules", label: "Rules" },
];

export default function Chrome() {
  const { hour, label, scrolled } = useSectionTheme();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const clock = useRaceClock(EVENT.startISO, 1000);

  // Nach einem Seitenwechsel schliesst sich das Menü.
  // eslint-disable-next-line react-hooks/set-state-in-effect
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
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <span className="relative grid h-[18px] w-[18px] place-items-center" style={{ background: "var(--byd-accent)" }}>
              <span className="absolute h-[11px] w-[3px] bg-white" />
              <span className="absolute h-[3px] w-[11px] bg-white" />
            </span>
            <span className="text-[13px] font-semibold uppercase tracking-[0.06em]">
              Team Switzerland
            </span>
          </Link>

          <div className="ml-auto hidden items-center gap-7 md:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="stamp transition-colors"
                style={{ color: path === l.href ? "var(--byd-fg)" : undefined }}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Unter sm wandert die Uhr ins Menü – sonst schiebt sie den
              Menüknopf aus dem Bild und die Navigation ist unerreichbar. */}
          <Link
            href="/live"
            className="ml-auto hidden shrink-0 items-center gap-2.5 border px-3 py-1.5 sm:flex md:ml-0"
            style={{ borderColor: "var(--byd-rule)" }}
          >
            <span
              className={`h-1.5 w-1.5 shrink-0 ${clock.running ? "blink" : ""}`}
              style={{ background: clock.running ? "var(--byd-accent)" : "var(--bar)" }}
            />
            <span className="font-mono text-[11px] tnum leading-none">
              {clock.running ? `LOOP ${clock.lap}` : countdownText(clock)}
            </span>
          </Link>

          <button
            onClick={() => setOpen((o) => !o)}
            className="ml-auto flex h-11 w-11 shrink-0 items-center justify-center sm:ml-0 md:hidden"
            aria-label="Menu"
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
            {/* Die Uhr, die unter sm aus der Leiste genommen ist. */}
            <Link href="/live" className="mt-4 flex items-center gap-2.5 sm:hidden">
              <span
                className="h-1.5 w-1.5 shrink-0"
                style={{ background: clock.running ? "var(--byd-accent)" : "var(--bar)" }}
              />
              <span className="font-mono text-[11px] tnum leading-none">
                {clock.running ? `LOOP ${clock.lap}` : countdownText(clock)}
              </span>
            </Link>
          </div>
        )}
      </header>

      {/* Die Stundenschiene: zeigt am linken Rand, in welcher Rennstunde
          man beim Scrollen gerade steckt. */}
      {label && (
        <div
          data-hour={hour}
          className="pointer-events-none fixed left-0 top-1/2 z-40 hidden -translate-y-1/2 xl:block"
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

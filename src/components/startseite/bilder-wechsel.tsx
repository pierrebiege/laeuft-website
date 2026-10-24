"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useState } from "react";

export type Folie =
  | { bild: StaticImageData; alt: string; ganz?: boolean }
  | { screens: StaticImageData[]; alt: string };

const TAKT = 4500;

export function BilderWechsel({ folien, prio = false }: { folien: Folie[]; prio?: boolean }) {
  const [aktiv, setAktiv] = useState(0);
  const [pause, setPause] = useState(false);

  useEffect(() => {
    if (folien.length < 2 || pause) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => setAktiv((a) => (a + 1) % folien.length), TAKT);
    return () => clearTimeout(t);
  }, [aktiv, pause, folien.length]);

  return (
    <div onMouseEnter={() => setPause(true)} onMouseLeave={() => setPause(false)}>
      <button
        type="button"
        aria-label="Nächstes Bild"
        onClick={() => setAktiv((a) => (a + 1) % folien.length)}
        className="relative block aspect-[16/10] w-full cursor-pointer overflow-hidden rounded-[6px] bg-[#f3f2ef]"
      >
        {folien.map((f, i) => (
          <div
            key={i}
            aria-hidden={i !== aktiv}
            className={`absolute inset-0 transition-opacity duration-700 ${i === aktiv ? "opacity-100" : "opacity-0"}`}
          >
            {"bild" in f ? (
              <Image
                src={f.bild}
                alt={f.alt}
                fill
                priority={prio && i === 0}
                sizes="(min-width: 1280px) 1180px, 100vw"
                className={f.ganz ? "object-contain p-[6%]" : "object-cover object-top"}
              />
            ) : (
              <div className="flex h-full items-center justify-center gap-[3%]">
                {f.screens.map((s, k) => (
                  <div
                    key={k}
                    className="relative overflow-hidden rounded-[8px] border border-black/[0.06] sm:rounded-[18px]"
                    style={{ aspectRatio: `${s.width} / ${s.height}`, width: f.screens.length > 3 ? "18%" : "23%" }}
                  >
                    <Image src={s} alt={k === 0 ? f.alt : ""} fill sizes="(min-width: 1024px) 300px, 30vw" className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </button>
      {folien.length > 1 && (
        <div className="mt-3 flex gap-1.5">
          {folien.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Bild ${i + 1} von ${folien.length}`}
              onClick={() => setAktiv(i)}
              className="py-2"
            >
              <span className={`block h-[2px] w-7 transition-colors ${i === aktiv ? "bg-[#141414]" : "bg-black/15"}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

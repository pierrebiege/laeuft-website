"use client";

import { useEffect, useRef, useState } from "react";
import CoursePlan from "@/app/backyard/_components/CoursePlan";
import { COURSE_ASSETS, COURSE_TOTAL_M, COURSE_TURN } from "@/app/backyard/_data/course-path";
import { COURSE, LOOP_M } from "@/app/backyard/_data/event";

/** Vor- und Nachlauf: die Runde startet erst, wenn das Bild steht, und hält am Ende. */
const LEAD_IN = 0.08;
const LEAD_OUT = 0.1;

/**
 * Die Kapitel der Runde, an Streckenmetern festgemacht. Ein Rundkurs, den
 * man sechzig Mal läuft, hat keine Landschaft zu erzählen – aber einen
 * Ablauf, und der ist jede Stunde derselbe.
 */
const ACTS: { m: number; title: string; text: string }[] = [
  {
    m: 0,
    title: "The bell",
    text: "Every hour, on the hour. Everyone still in the race starts together — the ones who feel good and the ones who do not.",
  },
  {
    m: COURSE.crossings[0].m,
    title: "First crossing",
    text: "A quiet street with no zebra crossing. You look, then you go — at four in the morning as much as at two in the afternoon.",
  },
  {
    m: COURSE.crossings[1].m,
    title: "Second crossing",
    text: "Just before 2 km, with an island in the middle. From here the gravel runs along the Lorze and the trees close over the path.",
  },
  {
    m: COURSE_TURN[2],
    title: "Turnaround",
    text: "3.3 km out and 19 metres lower than the clubhouse. Everything from this cone onwards is uphill.",
  },
  {
    m: 5600,
    title: "The way back",
    text: "The climb home, with the bell already in earshot. Whatever is left of the hour is the rest — and then it is the same again on the next hour.",
  },
];

/**
 * Die Strecke in ihrem Gelände. Beim Scrollen läuft die Runde ab: im Bild
 * zieht sich die rote Linie durch das Tal, darunter läuft derselbe Punkt
 * durchs Höhenprofil.
 *
 * Das Gelände liegt als eigenständige Szene in einem iframe (three.js,
 * Satellitenbild und Höhenkarte als eigene Dateien). Der Fortschritt geht
 * per postMessage hinein, dort läuft eine eigene Bildschleife – React
 * rendert pro Bild nichts mit. Geladen wird erst, wenn der Abschnitt in
 * die Nähe kommt; wo kein WebGL läuft, steht der Grundriss.
 */
export default function CourseTerrain() {
  const wrap = useRef<HTMLDivElement>(null);
  const iframe = useRef<HTMLIFrameElement>(null);
  const raf = useRef(0);
  const [rev, setRev] = useState(0);
  const latest = useRef(0);
  const [vert, setVert] = useState(false);
  const [still, setStill] = useState(false);
  const [near, setNear] = useState(false);
  const [gl, setGl] = useState<boolean | null>(null);

  useEffect(() => {
    // WebGL einmal prüfen. Ohne bleibt es beim Grundriss – der zeigt
    // dieselbe Runde und braucht nichts als SVG.
    try {
      const c = document.createElement("canvas");
      setGl(Boolean(c.getContext("webgl2") ?? c.getContext("webgl")));
    } catch {
      setGl(false);
    }
    const narrow = window.matchMedia("(max-width: 767px)");
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      setVert(narrow.matches);
      setStill(calm.matches);
    };
    apply();
    narrow.addEventListener("change", apply);
    calm.addEventListener("change", apply);
    return () => {
      narrow.removeEventListener("change", apply);
      calm.removeEventListener("change", apply);
    };
  }, []);

  useEffect(() => {
    // Die Szene meldet sich, sobald sie steht, und bekommt dann den Stand,
    // den sie verpasst hat – sonst bliebe sie bei null, wenn jemand mitten
    // in den Abschnitt springt und danach nicht mehr scrollt.
    const onReady = (e: MessageEvent) => {
      if ((e.data as { sceneReady?: boolean })?.sceneReady) {
        iframe.current?.contentWindow?.postMessage({ rev: latest.current }, "*");
      }
    };
    window.addEventListener("message", onReady);
    return () => window.removeEventListener("message", onReady);
  }, []);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    // Erst laden, wenn der Abschnitt in Reichweite ist, und die Bildschleife
    // im iframe anhalten, sobald er wieder draussen ist.
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setNear(true);
        iframe.current?.contentWindow?.postMessage({ visible: e.isIntersecting }, "*");
      },
      { rootMargin: "400px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const measure = () => {
      raf.current = 0;
      const el = wrap.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const raw = total <= 0 ? 0 : -r.top / total;
      const eased = (raw - LEAD_IN) / (1 - LEAD_IN - LEAD_OUT);
      const v = Math.min(1, Math.max(0, eased));
      latest.current = v;
      iframe.current?.contentWindow?.postMessage({ rev: v }, "*");
      // Für React gerastert – das SVG darunter braucht keine 60 Zustände.
      setRev(Math.round(v * 400) / 400);
    };
    const onScroll = () => {
      if (!raf.current) raf.current = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  const dist = rev * COURSE_TOTAL_M;
  const outFrac = COURSE_TURN[2] / COURSE_TOTAL_M;
  const act = ACTS.reduce((best, a, i) => (dist >= a.m ? i : best), 0);
  const loopM = Math.round(rev * LOOP_M);

  return (
    <div ref={wrap} className="relative" style={{ height: "360vh" }}>
      <div className="sticky top-0 flex h-dvh flex-col justify-center px-5 pt-20 md:pt-0">
        <div className="mx-auto w-full max-w-[76rem]">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <span className="stamp">The loop from above</span>
            <span className="stamp">{rev < outFrac ? "Out" : "Back"} · scroll to run it</span>
          </div>

          {gl === false ? (
            <CoursePlan
              rev={rev}
              vert={vert}
              still={still}
              className={vert ? "max-h-[56vh] w-auto" : "max-h-[52vh] w-full"}
            />
          ) : (
            <div
              className="relative w-full overflow-hidden"
              style={{ aspectRatio: vert ? "4 / 5" : "16 / 9", maxHeight: "58vh" }}
            >
              {near && (
                <iframe
                  ref={iframe}
                  src={`${COURSE_ASSETS}/scene.html`}
                  title="The championship loop in Baar, drawn on the terrain it runs through"
                  className="absolute inset-0 h-full w-full"
                  style={{ border: 0 }}
                  loading="lazy"
                />
              )}
            </div>
          )}

          <div className="mt-4 grid gap-3 border-t pt-4 rule md:grid-cols-[1fr_auto_1fr] md:items-baseline md:gap-8">
            <p className="order-2 max-w-[42ch] text-[15px] leading-relaxed md:order-none">
              <span className="stamp mr-2">{ACTS[act].title}</span>
              {ACTS[act].text}
            </p>
            <span className="display tnum order-1 text-3xl md:order-none md:text-center md:text-4xl">
              {loopM.toLocaleString("en-GB")}
              <span className="stamp ml-2">of {LOOP_M} m</span>
            </span>
            <span className="stamp order-3 md:order-none md:text-right">
              {COURSE.elevation}
              <br className="hidden md:block" />
              <span className="md:hidden"> · </span>
              GPX: Doron De Wolf{gl === false ? "" : " · relief 1.8×"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

/** Zählt eine Zahl hoch, sobald sie ins Bild kommt. Tabellarische Ziffern, kein Zittern. */
export default function Count({
  to,
  duration = 900,
  className = "",
  style,
}: {
  to: number;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [v, setV] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        if (reduce) return setV(to);
        const t0 = performance.now();
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          setV(Math.round(to * eased));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);

  return (
    <span ref={ref} className={`tnum ${className}`} style={style}>
      {v.toLocaleString("en-GB")}
    </span>
  );
}

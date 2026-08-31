/**
 * Datenquellen der Nationen.
 *
 * Für 2026 existieren die race|result-Events noch nicht – sobald eine Nation
 * ihre Event-ID veröffentlicht, kommt sie hier in `id2026` und der Weltstand
 * zieht sie automatisch mit ein. `id2024` ist echt und live abfragbar; damit
 * lässt sich das ganze Live-System vor dem Rennen testen.
 */

export type NationSource = {
  slug: string;
  nation: string;
  cc: string;
  id2024?: string;
  id2026?: string;
  contest?: string;
};

export const NATIONS: NationSource[] = [
  { slug: "ch", nation: "Switzerland", cc: "CH", id2024: "310176", id2026: process.env.RR_CH_2026 },
  { slug: "de", nation: "Germany", cc: "DE", id2024: "313630", id2026: process.env.RR_DE_2026 },
  { slug: "be", nation: "Belgium", cc: "BE", id2024: "313634", id2026: process.env.RR_BE_2026 },
  { slug: "nz", nation: "New Zealand", cc: "NZ", id2024: "312584", id2026: process.env.RR_NZ_2026 },
  { slug: "se", nation: "Sweden", cc: "SE", id2024: "309311", id2026: process.env.RR_SE_2026 },
];

export function sourcesFor(year: "2024" | "2026") {
  return NATIONS.map((n) => ({ ...n, eventId: year === "2024" ? n.id2024 : n.id2026 })).filter(
    (n): n is NationSource & { eventId: string } => Boolean(n.eventId),
  );
}

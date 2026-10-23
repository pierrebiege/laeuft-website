/* Der Titel als Satz grosser Wörter. Kurze Bindewörter («in der», «en»,
   «le») werden nicht riesig gesetzt, sondern klein vor das nächste grosse
   Wort gestellt. So trägt jedes grosse Wort eine eigene Zeile. */

export type TitelZeile = { klein?: string; gross: string };

export function titelZeilen(titel: string): TitelZeile[] {
  const woerter = titel.trim().split(/\s+/).filter(Boolean);
  const zeilen: TitelZeile[] = [];
  let klein: string[] = [];
  for (const w of woerter) {
    if (!/\p{L}/u.test(w) && zeilen.length) {
      zeilen[zeilen.length - 1].gross += ` ${w}`;
      continue;
    }
    const kurz = w.replace(/[^\p{L}]/gu, "").length <= 3 && /^\p{L}+$/u.test(w);
    if (kurz) {
      klein.push(w);
      continue;
    }
    zeilen.push(klein.length ? { klein: klein.join(" "), gross: w } : { gross: w });
    klein = [];
  }
  if (klein.length) {
    const letzte = zeilen[zeilen.length - 1];
    if (letzte) letzte.gross = `${letzte.gross} ${klein.join(" ")}`;
    else zeilen.push({ gross: klein.join(" ") });
  }
  return zeilen;
}

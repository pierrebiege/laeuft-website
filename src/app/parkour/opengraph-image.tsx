import { ogBild, OG_GROESSE } from "./_og/bild";

export const size = OG_GROESSE;
export const contentType = "image/png";
export const alt = "Wem gehört Parkour? 25 Jahre Parkour in der Schweiz";

export default function Bild() {
  return ogBild("de");
}

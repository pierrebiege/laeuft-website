import { ogBild, OG_GROESSE } from "./_og/bild";

export const size = OG_GROESSE;
export const contentType = "image/png";
export const alt = "Parkour in der Schweiz. Die Doku.";

export default function Bild() {
  return ogBild("de");
}

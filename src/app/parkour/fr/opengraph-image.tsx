import { ogBild, OG_GROESSE } from "../_og/bild";

export const size = OG_GROESSE;
export const contentType = "image/png";
export const alt = "À qui appartient le parkour ? 25 ans de parkour en Suisse";

export default function Bild() {
  return ogBild("fr");
}

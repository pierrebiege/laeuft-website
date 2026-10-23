import { ogBild, OG_GROESSE } from "../_og/bild";

export const size = OG_GROESSE;
export const contentType = "image/png";
export const alt = "Le parkour en Suisse. Le documentaire.";

export default function Bild() {
  return ogBild("fr");
}

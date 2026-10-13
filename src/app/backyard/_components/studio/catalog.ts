import { TEAM_FORMATS, type Format } from "./formats";
import { PIERRE_FORMATS } from "./pierre";

/** Alle Vorlagen des Studios, Team zuerst */
export const FORMATS: Format[] = [...TEAM_FORMATS, ...PIERRE_FORMATS];

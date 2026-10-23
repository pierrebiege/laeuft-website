/* Welche Dateien angenommen werden: Video, Bild, PDF. Alte Formate (MiniDV,
   AVCHD, .mod) kommen oft ohne MIME-Typ vom Browser, darum zusätzlich über
   die Endung. Der Bucket lässt nur video/*, image/* und application/pdf zu,
   deshalb bekommt jede Datei hier einen passenden Typ. */

const NACH_ENDUNG: Record<string, string> = {
  mp4: "video/mp4",
  m4v: "video/x-m4v",
  mov: "video/quicktime",
  avi: "video/x-msvideo",
  mts: "video/mp2t",
  m2ts: "video/mp2t",
  ts: "video/mp2t",
  mpg: "video/mpeg",
  mpeg: "video/mpeg",
  mod: "video/mpeg",
  vob: "video/mpeg",
  wmv: "video/x-ms-wmv",
  mkv: "video/x-matroska",
  webm: "video/webm",
  "3gp": "video/3gpp",
  dv: "video/x-dv",
  flv: "video/x-flv",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  tif: "image/tiff",
  tiff: "image/tiff",
  bmp: "image/bmp",
  pdf: "application/pdf",
};

function endung(name: string) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

function typOk(typ: string) {
  if (typ === "image/svg+xml") return false; // SVG kann Skripte enthalten
  return typ.startsWith("video/") || typ.startsWith("image/") || typ === "application/pdf";
}

export function dateiErlaubt(name: string, typ: string) {
  return typOk(typ) || endung(name) in NACH_ENDUNG;
}

/* Der Typ, mit dem hochgeladen wird. */
export function dateiTyp(name: string, typ: string) {
  if (typOk(typ)) return typ;
  return NACH_ENDUNG[endung(name)] ?? "application/octet-stream";
}

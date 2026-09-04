import { TEAM_PHOTOS } from "@/app/backyard/_data/event";

/**
 * Ein Bild im Ton der Seite: schwarzweiss wie die Porträts auf den
 * Läuferkarten, Haarlinie aussen, darunter die Legende als Stempelzeile.
 * Breite und Höhe stehen dran, damit beim Nachladen nichts springt.
 */
export default function Photo({
  src,
  alt,
  caption,
  width,
  height,
  className,
}: {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
  className?: string;
}) {
  return (
    <figure className={className}>
      <div className="overflow-hidden border rule">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${TEAM_PHOTOS}/${src}`}
          alt={alt}
          width={width}
          height={height}
          className="block h-auto w-full"
          style={{ filter: "grayscale(1) contrast(1.06)" }}
          loading="lazy"
        />
      </div>
      <figcaption className="stamp mt-3">{caption}</figcaption>
    </figure>
  );
}

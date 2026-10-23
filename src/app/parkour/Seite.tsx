import Image from "next/image";
import Link from "next/link";
import KarteSvg from "./KarteSvg";
import ZeitKarte from "./ZeitKarte";
import Mitmachen from "./Mitmachen";
import { KONTAKT_MAIL, TEXTE, type Sprache } from "./texte";

/* Obergrenze pro Datei für den direkten Upload. Sie muss zur globalen
   Grenze des Supabase-Projekts passen (Settings → Storage), sonst bricht
   der Upload ab. Stand 23.10.2026: 50 MB. */
const MAX_MB = Number(process.env.PARKOUR_MAX_MB) || 50;

export default function Seite({ sprache }: { sprache: Sprache }) {
  const t = TEXTE[sprache];
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(t.teilen.nachricht)}`;

  return (
    <div className="pk" lang={t.htmlLang}>
      <header className="pk-kopf">
        <div className="pk-rahmen pk-kopf-innen">
          <a href="#oben" className="pk-marke">
            {t.hero.titel.join(" ")}
          </a>
          <nav className="pk-nav" aria-label="Navigation">
            <a href="#projekt" className="pk-nav-weit">
              {t.nav.projekt}
            </a>
            <a href="#karte" className="pk-nav-weit">
              {t.nav.karte}
            </a>
            <a href="#wir" className="pk-nav-weit">
              {t.nav.wir}
            </a>
            <a href="#mitmachen">{t.nav.mitmachen}</a>
            <span className="pk-sprachen">
              {sprache === "de" ? (
                <>
                  <span aria-current="page">DE</span>
                  <Link href={t.andererPfad} hrefLang="fr" lang="fr">
                    FR
                  </Link>
                </>
              ) : (
                <>
                  <Link href={t.andererPfad} hrefLang="de" lang="de">
                    DE
                  </Link>
                  <span aria-current="page">FR</span>
                </>
              )}
            </span>
          </nav>
        </div>
      </header>

      <main>
        <section id="oben" className="pk-hero">
          <div className="pk-rahmen pk-hero-innen">
            <h1 className="pk-h1">
              <span className="pk-h1-a">{t.hero.titel[0]}</span>
              <span className="pk-h1-b">{t.hero.titel[1]}</span>
            </h1>
            <div className="pk-hero-unten">
              <div className="pk-hero-text">
                <p className="pk-arbeitstitel">{t.hero.arbeitstitel}</p>
                <p className="pk-lead">{t.hero.satz}</p>
                <div className="pk-ctas">
                  <a href="#video" className="pk-knopf">
                    {t.hero.ctaGeschichte}
                  </a>
                  <a href="#material" className="pk-knopf pk-knopf-zwei">
                    {t.hero.ctaMaterial}
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="pk-hero-karte" aria-hidden="true">
            <KarteSvg beschriften={false} hervorheben={false} className="pk-hero-svg" />
          </div>
        </section>

        <section id="projekt" className="pk-worum">
          <div className="pk-rahmen">
            <h2 className="pk-h2">{t.worum.titel}</h2>
            <p className="pk-regionen">
              {t.worum.regionen.map((r) => (
                <span key={r}>{r}</span>
              ))}
            </p>
            <div className="pk-worum-text">
              <p>{t.worum.text1}</p>
              <p>{t.worum.text2}</p>
            </div>
          </div>
        </section>

        <ZeitKarte sprache={sprache} />

        <section className="pk-karte-ende">
          <div className="pk-rahmen pk-karte-ende-innen">
            <p className="pk-gross">{t.karte.ende}</p>
            <a href="#hinweis" className="pk-knopf pk-knopf-zwei">
              {t.karte.endeKnopf}
            </a>
          </div>
        </section>

        <section className="pk-gen">
          <div className="pk-rahmen pk-gen-innen">
            <h2 className="pk-h2">{t.generationen.titel}</h2>
            <p className="pk-gen-text">{t.generationen.text}</p>
          </div>
        </section>

        <Mitmachen sprache={sprache} maxMb={MAX_MB} />

        <section className="pk-teilen">
          <div className="pk-rahmen pk-teilen-innen">
            <h2 className="pk-h3">{t.teilen.titel}</h2>
            <p>{t.teilen.text}</p>
            <a href={whatsapp} className="pk-knopf pk-knopf-zwei" target="_blank" rel="noopener noreferrer">
              {t.teilen.knopf}
            </a>
          </div>
        </section>

        <section id="wir" className="pk-wir">
          <div className="pk-rahmen">
            <h2 className="pk-h2">{t.wir.titel}</h2>
            <div className="pk-wir-raster">
              <figure className="pk-person">
                <div className="pk-foto pk-foto-leer">
                  <span>{t.wir.fotoFolgt}</span>
                </div>
                <figcaption>
                  <span className="pk-person-name">Ramon Siegenthaler</span>
                  <span className="pk-person-text">{t.wir.ramon}</span>
                </figcaption>
              </figure>
              <figure className="pk-person">
                <div className="pk-foto">
                  <Image
                    src="/parkour/pierre-biege.jpg"
                    alt="Pierre Biege"
                    fill
                    sizes="(max-width: 760px) 100vw, 40vw"
                    style={{ objectFit: "cover", objectPosition: "50% 35%" }}
                  />
                </div>
                <figcaption>
                  <span className="pk-person-name">Pierre Biege</span>
                  <span className="pk-person-text">{t.wir.pierre}</span>
                </figcaption>
              </figure>
            </div>
            <p className="pk-offen">{t.wir.offenlegung}</p>
          </div>
        </section>

        <section className="pk-partner">
          <div className="pk-rahmen pk-partner-innen">
            <h2 className="pk-h3">{t.partner.titel}</h2>
            <p>{t.partner.text}</p>
            <a className="pk-mail" href={`mailto:${KONTAKT_MAIL}`}>
              {KONTAKT_MAIL}
            </a>
          </div>
        </section>
      </main>

      <footer className="pk-fuss">
        <div className="pk-rahmen pk-fuss-innen">
          <p>{t.fuss.datenschutz}</p>
          <p>{t.fuss.arbeitstitel}</p>
          <p className="pk-fuss-links">
            <a href={`mailto:${KONTAKT_MAIL}`}>{KONTAKT_MAIL}</a>
            <a href="/impressum">{t.fuss.impressum}</a>
            <span>laeuft.ch</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

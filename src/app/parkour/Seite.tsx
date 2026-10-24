import Image from "next/image";
import Link from "next/link";
import KarteSvg from "./KarteSvg";
import ZeitKarte from "./ZeitKarte";
import Mitmachen from "./Mitmachen";
import Hero from "./Hero";
import { Auftritt, Kante, Zaehler } from "./Bewegung";
import { FernsehMoment, Kapitelband, SchnittAnSchnitt, Sprunglinie, Tusche } from "./Doku";
import { ORTE } from "./karte-daten";
import { KONTAKT_MAIL, TEXTE, type Sprache } from "./texte";
import { ZUSATZ } from "./texte-zusatz";
import { titelZeilen } from "./titel";

/* Obergrenze pro Datei für den direkten Upload. Sie muss zur globalen
   Grenze des Supabase-Projekts passen (Settings → Storage), sonst bricht
   der Upload ab. Stand 23.10.2026: 50 MB. */
const MAX_MB = Number(process.env.PARKOUR_MAX_MB) || 50;

/* Stummer Loop aus altem Material für den ersten Bildschirm. Sobald es ihn
   gibt: Datei nach public/parkour/ legen (MP4, H.264, ohne Ton, < 4 MB)
   und hier eintragen. Bis dahin zeigt das Bildfenster die Karte. */
const HERO_VIDEO: string | undefined = undefined;
const HERO_POSTER: string | undefined = undefined;

export default function Seite({ sprache }: { sprache: Sprache }) {
  const t = TEXTE[sprache];
  const z = ZUSATZ[sprache];
  const titel = t.hero.titel.join(" ");
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(t.teilen.nachricht)}`;

  return (
    <div className="pk" lang={t.htmlLang}>
      <Tusche />
      <header className="pk-kopf">
        <div className="pk-rahmen pk-kopf-innen">
          <a href="#oben" className="pk-marke">
            {titel}
          </a>
          <nav className="pk-nav" aria-label="Navigation">
            <a href="#projekt" className="pk-nav-weit">
              {t.nav.projekt}
            </a>
            <a href="#karte" className="pk-nav-weit">
              {t.nav.karte}
            </a>
            <a href="#film" className="pk-nav-weit">
              {t.nav.film}
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
        <Hero
          zeilen={titelZeilen(titel)}
          bildLabel={z.hero.bild}
          sprache={sprache}
          videoSrc={HERO_VIDEO}
          videoPoster={HERO_POSTER}
          moment={<FernsehMoment kasten={z.doku.tvKasten} zeile={z.doku.tvZeile} />}
          unter={
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
          }
        />

        <Sprunglinie art="gelaender" />

        <section id="projekt" className="pk-worum">
          <div className="pk-rahmen">
            <Kante zeilen={[t.worum.titel]} className="pk-h2" />
            <div className="pk-regionen">
              {t.worum.regionen.map((r, i) => (
                <Auftritt key={r} className="pk-region" verzoegerung={i * 0.07} versatz={60}>
                  {r}
                </Auftritt>
              ))}
            </div>
            <div className="pk-zahlen">
              <Auftritt className="pk-zahl">
                <Zaehler bis={25} className="pk-zahl-wert" />
                <span className="pk-zahl-text">{z.zahlen.jahre}</span>
              </Auftritt>
              <Auftritt className="pk-zahl" verzoegerung={0.1}>
                <Zaehler bis={ORTE.length} className="pk-zahl-wert pk-zahl-signal" />
                <span className="pk-zahl-text">{z.zahlen.orte}</span>
              </Auftritt>
              <Auftritt className="pk-zahl" verzoegerung={0.2}>
                <span className="pk-zahl-wert">{z.zahlen.abstimmungDatum}</span>
                <span className="pk-zahl-text">{z.zahlen.abstimmung}</span>
              </Auftritt>
            </div>
            <div className="pk-worum-text">
              <Auftritt als="p">{t.worum.text1}</Auftritt>
              <Auftritt als="p" verzoegerung={0.12}>
                {t.worum.text2}
              </Auftritt>
            </div>
          </div>
        </section>

        <Sprunglinie art="mauer" spiegeln />

        <ZeitKarte sprache={sprache} />

        <section className="pk-karte-ende">
          <div className="pk-rahmen pk-karte-ende-innen">
            <Kante als="p" zeilen={[t.karte.ende]} className="pk-gross" />
            <a href="#hinweis" className="pk-knopf pk-knopf-zwei">
              {t.karte.endeKnopf}
            </a>
          </div>
        </section>

        <Sprunglinie art="luecke" />

        <section id="film" className="pk-film">
          <div className="pk-rahmen">
            <div className="pk-film-kopf">
              <Kante zeilen={[t.film.titel]} className="pk-h2" />
              <Auftritt als="p" className="pk-film-text">
                {t.film.text}
              </Auftritt>
            </div>
            <h3 className="pk-h3 pk-kap-ueber">{z.doku.kapitelTitel}</h3>
            <Kapitelband kapitel={z.doku.kapitel} />
            <h3 className="pk-h3 pk-eck-ueber">{z.doku.eckTitel}</h3>
            <dl className="pk-eck">
              {t.film.eckdaten.map(([k, v], i) => (
                <Auftritt key={k} className="pk-eck-zeile" verzoegerung={i * 0.05}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </Auftritt>
              ))}
            </dl>
            <div className="pk-regeln">
              <h3 className="pk-h3">{t.film.regelnTitel}</h3>
              <ul>
                {t.film.regeln.map((regel) => (
                  <li key={regel}>{regel}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="pk-gen">
          <div className="pk-rahmen pk-gen-innen">
            <Kante zeilen={[t.generationen.titel]} className="pk-h2" />
            <Auftritt als="p" className="pk-gen-text">
              {t.generationen.text}
            </Auftritt>
          </div>
          <div className="pk-rahmen">
            <SchnittAnSchnitt
              frage={z.doku.sasFrage}
              links={z.doku.sasLinks}
              rechts={z.doku.sasRechts}
              schnitt={z.doku.sasSchnitt}
            />
          </div>
        </section>

        <Sprunglinie art="stufen" spiegeln />

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
            <Kante zeilen={[t.wir.titel]} className="pk-h2" />
            <div className="pk-wir-raster">
              <Auftritt als="figure" className="pk-person pk-person-pierre">
                <div className="pk-foto pk-foto-gross">
                  <span className="pk-foto-tusche" aria-hidden="true" />
                  <Image
                    src="/parkour/pierre-biege.jpg"
                    alt="Pierre Biege"
                    fill
                    sizes="(max-width: 760px) 100vw, 58vw"
                    style={{ objectFit: "cover", objectPosition: "50% 40%" }}
                  />
                </div>
                <figcaption>
                  <span className="pk-person-name">Pierre Biege</span>
                  <span className="pk-person-text">{t.wir.pierre}</span>
                </figcaption>
              </Auftritt>
              <Auftritt als="figure" className="pk-person pk-person-ramon" verzoegerung={0.15}>
                <div className="pk-foto pk-foto-karte">
                  <span className="pk-foto-tusche" aria-hidden="true" />
                  <span className="pk-foto-name" aria-hidden="true">
                    Ramon
                  </span>
                  <KarteSvg
                    nur={["Münsingen"]}
                    ortsnamen={{ Münsingen: z.wir.ort.ramon }}
                    ausschnitt={[150, 160, 420, 300]}
                    zuschnitt
                    className="pk-foto-svg"
                    titel={z.wir.ort.ramon}
                  />
                  <span className="pk-foto-folgt">{t.wir.fotoFolgt}</span>
                </div>
                <figcaption>
                  <span className="pk-person-name">Ramon Siegenthaler</span>
                  <span className="pk-person-text">{t.wir.ramon}</span>
                </figcaption>
              </Auftritt>
            </div>
            <Auftritt als="p" className="pk-offen">
              {t.wir.offenlegung}
            </Auftritt>
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

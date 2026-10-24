import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import weile from "../../public/arbeiten/weile.webp";
import weileApp1 from "../../public/arbeiten/weile-app-1.webp";
import weileApp2 from "../../public/arbeiten/weile-app-2.webp";
import weileApp3 from "../../public/arbeiten/weile-app-3.webp";
import weileApp4 from "../../public/arbeiten/weile-app-4.webp";
import weileApp5 from "../../public/arbeiten/weile-app-5.webp";
import coachEinheit from "../../public/arbeiten/coach-einheit.webp";
import coachKraft from "../../public/arbeiten/coach-kraft.webp";
import na from "../../public/arbeiten/na.webp";
import coachHeute from "../../public/arbeiten/coach-heute.webp";
import coachPlan from "../../public/arbeiten/coach-plan.webp";
import coachPlayer from "../../public/arbeiten/coach-player.webp";
import coachFortschritt from "../../public/arbeiten/coach-fortschritt.webp";
import albinen from "../../public/arbeiten/albinen.webp";
import gemeindeplatz from "../../public/arbeiten/gemeindeplatz.webp";
import fuelyard from "../../public/arbeiten/fuelyard.webp";
import graatzug from "../../public/arbeiten/graatzug.webp";
import ytDoku from "../../public/arbeiten/yt-Id8m3b0ckf8.webp";
import ytVersagt from "../../public/arbeiten/yt-TOlj2ZJKPXw.webp";
import yt99 from "../../public/arbeiten/yt-Hvxd_fWYZ4M.webp";
import ytUltimate from "../../public/arbeiten/yt-V7si1J2Rf6E.webp";
import animTempo from "../../public/arbeiten/anim-tempo.webp";
import animKarten from "../../public/arbeiten/anim-karten.webp";
import animKoffein from "../../public/arbeiten/anim-koffein.webp";
import animNaechte from "../../public/arbeiten/anim-naechte.webp";
import animR84 from "../../public/arbeiten/anim-r84.webp";
import animApril from "../../public/arbeiten/anim-april.webp";
import pierre from "../../public/arbeiten/pierre.webp";
import rennen from "../../public/arbeiten/rennen.webp";

const MAIL = "pierre@laeuft.ch";

const videos = [
  { id: "Id8m3b0ckf8", titel: "Last Soul Ultra 26, eine Backyard-Doku", bild: ytDoku },
  { id: "TOlj2ZJKPXw", titel: "Versagt? Last Soul Ultra 2026", bild: ytVersagt },
  { id: "Hvxd_fWYZ4M", titel: "Härter als ein Backyard? 99 Laps", bild: yt99 },
  { id: "V7si1J2Rf6E", titel: "Das ist beim Ultimate Run passiert", bild: ytUltimate },
];

const animationen = [
  { bild: animTempo, alt: "Grafik: gleicher Puls, anderes Tempo am Tag und in der Nacht" },
  { bild: animKoffein, alt: "Grafik: Koffein über 33 Runden" },
  { bild: animKarten, alt: "Karten: Hitze, Koffein, Essen, Eisen" },
  { bild: animNaechte, alt: "Zeitachse: die dritte Nacht" },
  { bild: animR84, alt: "Titelkarte: Runde 84 am 99 Laps" },
  { bild: animApril, alt: "Rückblick: Ultimate Run im April, 200 km in 48 Stunden" },
];

const felder = [
  {
    titel: "Eigene Apps",
    text: "Ich baue Produkte, die ich selbst brauche, und bringe sie bis in den App Store. Design, Code, Backend, Texte, alles aus einer Hand.",
  },
  {
    titel: "Konzept-Websites",
    text: "Manchmal sehe ich eine Firma, deren Arbeit mich begeistert, und ihre Website zeigt das nicht. Dann baue ich ihr einen Entwurf. Ungefragt, als Geschenk. Falls du deshalb hier bist: schön, dass du schaust.",
  },
  {
    titel: "Gemeinden und Vereine",
    text: "Websites mit eigenem Redaktionssystem, die eine Verwaltung oder ein Vorstand selbst pflegen kann. Ohne Agentur im Rücken.",
  },
  {
    titel: "Eigene Systeme",
    text: "Offerten, Rechnungen, Anmeldungen, Trainingspläne. Die Werkzeuge, mit denen ich meine Firmen führe, baue ich selbst.",
  },
];

function Bild({
  src,
  alt,
  prio = false,
  sizes = "(min-width: 1024px) 1100px, 100vw",
  rund = "rounded-[6px]",
}: {
  src: StaticImageData;
  alt: string;
  prio?: boolean;
  sizes?: string;
  rund?: string;
}) {
  return (
    <div className={`overflow-hidden ${rund} border border-black/[0.06] bg-[#f3f2ef]`}>
      <Image src={src} alt={alt} priority={prio} placeholder="blur" sizes={sizes} className="h-auto w-full" />
    </div>
  );
}

function Screen({ src, alt, prio = false }: { src: StaticImageData; alt: string; prio?: boolean }) {
  return <Bild src={src} alt={alt} prio={prio} rund="rounded-[22px]" sizes="(min-width: 1024px) 280px, 50vw" />;
}

function Kopf({ name, art, text, url, domain }: { name: string; art: string; text: string; url: string; domain: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_1fr] sm:gap-16">
      <div>
        <h3 className="text-[30px] font-semibold tracking-[-0.025em] sm:text-[36px]">{name}</h3>
        <p className="mt-1 text-[14px] text-[#E0572B]">{art}</p>
      </div>
      <div>
        <p className="max-w-[48ch] text-[17px] leading-[1.6] text-[#4a4a4a]">{text}</p>
        <a href={url} target="_blank" rel="noopener" className="mt-3 inline-block text-[15px] underline underline-offset-4 hover:text-[#E0572B]">
          {domain}
        </a>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-[#141414] [color-scheme:light]">
      <header className="mx-auto flex max-w-[1240px] items-center justify-between px-5 py-6 sm:px-8">
        <Link href="/" className="text-[19px] font-semibold tracking-tight">
          Läuft.
        </Link>
        <nav className="flex gap-6 text-[15px] text-[#555] sm:gap-8">
          <a href="#arbeiten" className="hover:text-[#141414]">Arbeiten</a>
          <a href="#pierre" className="hover:text-[#141414]">Über mich</a>
          <a href="#kontakt" className="hover:text-[#141414]">Kontakt</a>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-[1240px] px-5 pb-16 pt-16 sm:px-8 sm:pb-24 sm:pt-28">
          <h1 className="max-w-[15ch] text-[44px] font-semibold leading-[1.02] tracking-[-0.035em] sm:text-[72px] lg:text-[92px]">
            Ich baue Apps und Websites.
          </h1>
          <div className="mt-8 grid gap-6 sm:mt-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
            <p className="max-w-[34ch] text-[21px] leading-[1.4] text-[#141414] sm:text-[24px]">
              Ich bin Pierre Biege, Programmierer aus Albinen im Wallis. Heute baue ich mit KI-Agenten
              als Team und schaffe so allein, wofür es früher ein ganzes Büro brauchte.
            </p>
            <p className="max-w-[44ch] text-[17px] leading-[1.6] text-[#5a5a5a]">
              Eigene Apps, Konzept-Websites für Marken, die ich mag, Plattformen für Gemeinden. Und
              nebenbei laufe ich Backyard Ultras und erzähle davon auf YouTube.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            <Screen src={weileApp1} alt="Weile: Startbildschirm am Morgen" prio />
            <Screen src={coachHeute} alt="Coach-App: heutige Einheit" prio />
            <Screen src={weileApp2} alt="Weile: Player mit gesprochenem Gebet" prio />
            <Screen src={coachPlan} alt="Coach-App: Wochenplan" prio />
          </div>
          <p className="mt-4 text-[14px] text-[#777]">Weile und die Coach-App von Natural Athletics, beide 2026 gebaut.</p>
        </section>

        <section id="arbeiten" className="mx-auto max-w-[1240px] scroll-mt-8 px-5 pt-28 sm:px-8 sm:pt-40">
          <h2 className="text-[34px] font-semibold tracking-[-0.03em] sm:text-[52px]">Arbeiten</h2>

          <article className="mt-14 sm:mt-20">
            <Kopf
              name="Weile"
              art="Eigene App · iOS und Web"
              text="Ein Gebet am Morgen, eins am Abend. Ruhig gesprochen, gratis und ohne Werbung, auf Deutsch. Seit Oktober 2026 im App Store."
              url="https://weile.app"
              domain="weile.app"
            />
            <div className="mt-10">
              <Bild src={weile} alt="Startseite von weile.app" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 sm:mt-6 sm:gap-6">
              <Screen src={weileApp4} alt="Weile: Rosenkranz" />
              <Screen src={weileApp3} alt="Weile: Bibel und Psalmen" />
              <Screen src={weileApp5} alt="Weile: Lieder" />
            </div>
          </article>

          <article className="mt-28 sm:mt-40">
            <Kopf
              name="Natural Athletics"
              art="Eigene Firma · Website und Coach-App"
              text="Meine Bewegungsschule in Brig und Albinen. Website mit Kursen, Anmeldung und Abos. Dazu eine eigene App, in der ich Laufpläne schreibe und Athletinnen und Athleten ihre Woche abhaken, Kraft-Workouts mit Timer inklusive."
              url="https://natural-athletics.ch/laufcoaching"
              domain="natural-athletics.ch"
            />
            <div className="mt-10">
              <Bild src={na} alt="Laufcoaching-Seite von natural-athletics.ch" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-6 lg:grid-cols-4">
              <Screen src={coachEinheit} alt="Coach-App: Einheit mit Anweisung" />
              <Screen src={coachKraft} alt="Coach-App: Kraft-Workouts" />
              <Screen src={coachPlayer} alt="Coach-App: Workout-Player" />
              <Screen src={coachFortschritt} alt="Coach-App: Fortschritt" />
            </div>
          </article>

          <article className="mt-28 sm:mt-40">
            <Kopf
              name="Gemeinden"
              art="Albinen und Gemeindeplatz"
              text="Für meine Wohngemeinde Albinen habe ich eine Website mit Webcam, Live-Wetter, Formularen und eigenem Redaktionssystem gebaut. Daraus ist Gemeindeplatz entstanden: dieselbe Plattform, fertig für jede Schweizer Gemeinde."
              url="https://gemeindeplatz.vercel.app"
              domain="Gemeindeplatz ansehen"
            />
            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <a href="https://albinen.vercel.app" target="_blank" rel="noopener" className="block">
                <Bild src={albinen} alt="Website der Gemeinde Albinen" sizes="(min-width: 1024px) 600px, 100vw" />
                <p className="mt-3 text-[14px] text-[#777]">Gemeinde Albinen</p>
              </a>
              <a href="https://gemeindeplatz.vercel.app" target="_blank" rel="noopener" className="block">
                <Bild src={gemeindeplatz} alt="Startseite von Gemeindeplatz" sizes="(min-width: 1024px) 600px, 100vw" />
                <p className="mt-3 text-[14px] text-[#777]">Gemeindeplatz</p>
              </a>
            </div>
          </article>

          <article className="mt-28 sm:mt-40">
            <Kopf
              name="YouTube"
              art="Eigener Kanal · Videos und Animationen"
              text="Auf @pierreoutdoor erzähle ich von Backyard Ultras, in langen Dokus statt kurzen Clips. Grafiken und Animationen baue ich selbst: als Code geschrieben, in 4K gerendert und in den Schnitt gelegt."
              url="https://www.youtube.com/@pierreoutdoor"
              domain="youtube.com/@pierreoutdoor"
            />
            <div className="mt-10 grid gap-x-6 gap-y-8 sm:grid-cols-2">
              {videos.map((v) => (
                <a key={v.id} href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener" className="group block">
                  <Bild src={v.bild} alt={v.titel} sizes="(min-width: 640px) 600px, 100vw" />
                  <p className="mt-3 text-[17px] font-medium group-hover:underline group-hover:underline-offset-4">{v.titel}</p>
                </a>
              ))}
            </div>
            <div className="mt-16 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
              {animationen.map((a) => (
                <Bild key={a.alt} src={a.bild} alt={a.alt} sizes="(min-width: 1024px) 400px, 50vw" />
              ))}
            </div>
            <p className="mt-4 text-[14px] text-[#777]">Animationen aus dem Recap zum Last Soul Ultra 2026.</p>
          </article>

          <div className="mt-28 grid gap-x-10 gap-y-20 sm:mt-40 lg:grid-cols-2">
            {[
              { name: "Fuelyard", art: "Eigene App · Backyard Ultra", text: "Für die Crew am Rand der Strecke: Verpflegung, Koffein und Wechsel, Runde für Runde. Läuft offline im Zelt.", url: "https://fuelyard.de", domain: "fuelyard.de", bild: fuelyard },
              { name: "Graatzug", art: "Eigenes Rennen · Website mit Anmeldung", text: "Ein Backyard Ultra im Wallis. Anmeldung, Startplatz-Lotterie und alles, was Läuferinnen und Läufer vor dem Start wissen wollen.", url: "https://graatzug.ch", domain: "graatzug.ch", bild: graatzug },
            ].map((a, i) => (
              <article key={a.name} className={i === 1 ? "lg:mt-32" : ""}>
                <a href={a.url} target="_blank" rel="noopener" className="group block">
                  <Bild src={a.bild} alt={`Startseite von ${a.domain}`} sizes="(min-width: 1024px) 600px, 100vw" />
                  <div className="mt-6 flex items-baseline justify-between gap-4">
                    <h3 className="text-[26px] font-semibold tracking-[-0.02em] group-hover:underline group-hover:underline-offset-4">{a.name}</h3>
                    <span className="text-[14px] text-[#777]">{a.domain}</span>
                  </div>
                  <p className="mt-1 text-[14px] text-[#E0572B]">{a.art}</p>
                  <p className="mt-3 max-w-[48ch] text-[17px] leading-[1.6] text-[#4a4a4a]">{a.text}</p>
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1240px] px-5 pt-32 sm:px-8 sm:pt-48">
          <div className="grid gap-12 lg:grid-cols-[5fr_7fr] lg:gap-20">
            <h2 className="text-[34px] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-[52px]">
              Was ich mache
            </h2>
            <div className="divide-y divide-black/10 border-y border-black/10">
              {felder.map((f) => (
                <div key={f.titel} className="grid gap-2 py-8 sm:grid-cols-[200px_1fr] sm:gap-8">
                  <h3 className="text-[19px] font-semibold">{f.titel}</h3>
                  <p className="text-[17px] leading-[1.6] text-[#4a4a4a]">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1240px] px-5 pt-32 sm:px-8 sm:pt-48">
          <p className="max-w-[22ch] text-[32px] font-semibold leading-[1.15] tracking-[-0.025em] sm:text-[48px]">
            Ich schreibe kaum noch Code von Hand. Ich führe die Agenten, die ihn schreiben.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:max-w-[1000px] lg:gap-16">
            <p className="text-[17px] leading-[1.6] text-[#4a4a4a]">
              Einer recherchiert, einer baut, einer prüft. Ich entscheide Richtung, Geschmack und was
              live geht. Weil ich jahrelang selbst programmiert habe, sehe ich, wenn etwas nicht stimmt.
            </p>
            <p className="text-[17px] leading-[1.6] text-[#4a4a4a]">
              So entsteht eine App in Wochen statt in Monaten, und eine Konzept-Website an einem
              Wochenende. Alles, was ich dabei lerne, fliesst in die nächste Arbeit.
            </p>
          </div>
        </section>

        <section id="pierre" className="mx-auto max-w-[1240px] scroll-mt-8 px-5 pt-32 sm:px-8 sm:pt-48">
          <div className="grid items-end gap-10 lg:grid-cols-[5fr_7fr] lg:gap-20">
            <div>
              <Bild src={pierre} alt="Pierre Biege" />
            </div>
            <div className="lg:pb-4">
              <h2 className="text-[34px] font-semibold tracking-[-0.03em] sm:text-[52px]">Pierre Biege</h2>
              <p className="mt-6 max-w-[46ch] text-[19px] leading-[1.55]">
                Programmierer, Webentwickler, Ultraläufer. Ich lebe und arbeite in Albinen, oberhalb
                von Leuk.
              </p>
              <p className="mt-4 max-w-[46ch] text-[17px] leading-[1.6] text-[#4a4a4a]">
                2026 bin ich für das Team Schweiz an der Backyard-WM gelaufen. Auf YouTube zeige ich,
                was hinter solchen Rennen steckt. Wer mehr über mich als Läufer wissen will, findet es
                auf pierrebiege.ch.
              </p>
              <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-[16px]">
                <a href="https://www.youtube.com/@pierreoutdoor" target="_blank" rel="noopener" className="underline underline-offset-4 hover:text-[#E0572B]">
                  YouTube
                </a>
                <a href="https://www.instagram.com/pierrebiege" target="_blank" rel="noopener" className="underline underline-offset-4 hover:text-[#E0572B]">
                  Instagram
                </a>
                <a href="https://www.pierrebiege.ch" target="_blank" rel="noopener" className="underline underline-offset-4 hover:text-[#E0572B]">
                  pierrebiege.ch
                </a>
              </div>
            </div>
          </div>
          <div className="mt-20 sm:mt-28">
            <Bild src={rennen} alt="Pierre Biege nachts an einem Backyard Ultra" />
          </div>
        </section>

        <section id="kontakt" className="mx-auto max-w-[1240px] scroll-mt-8 px-5 pb-28 pt-32 sm:px-8 sm:pb-40 sm:pt-48">
          <h2 className="text-[44px] font-semibold leading-[1.02] tracking-[-0.035em] sm:text-[72px] lg:text-[92px]">
            Schreib mir.
          </h2>
          <p className="mt-6 max-w-[44ch] text-[19px] leading-[1.55] text-[#4a4a4a]">
            Eine Idee für eine App, eine Gemeinde mit alter Website, oder einfach eine Frage. Ich
            antworte selbst.
          </p>
          <a
            href={`mailto:${MAIL}`}
            className="mt-10 inline-block border-b-2 border-[#E0572B] pb-1 text-[26px] font-semibold tracking-[-0.02em] sm:text-[40px]"
          >
            {MAIL}
          </a>
        </section>
      </main>

      <footer className="border-t border-black/10">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-4 px-5 py-8 text-[14px] text-[#777] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>Läuft. · Pierre Biege · Albinen, Wallis</span>
          <div className="flex gap-6">
            <Link href="/impressum" className="hover:text-[#141414]">Impressum</Link>
            <Link href="/datenschutz" className="hover:text-[#141414]">Datenschutz</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

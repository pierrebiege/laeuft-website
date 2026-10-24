import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { BilderWechsel, type Folie } from "../components/startseite/bilder-wechsel";
import ergtShop from "../../public/arbeiten/ergt-shop.webp";
import ergtEinband from "../../public/arbeiten/ergt-einband.webp";
import ergtStart from "../../public/arbeiten/ergt-v8-10.webp";
import ergtWoche from "../../public/arbeiten/ergt-v8-11.webp";
import ergtAnkommen from "../../public/arbeiten/ergt-v8-45.webp";
import weile from "../../public/arbeiten/weile.webp";
import weileApp1 from "../../public/arbeiten/weile-app-1.webp";
import weileApp2 from "../../public/arbeiten/weile-app-2.webp";
import weileApp3 from "../../public/arbeiten/weile-app-3.webp";
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
import yt99 from "../../public/arbeiten/yt-Hvxd_fWYZ4M.webp";
import animTempo from "../../public/arbeiten/anim-tempo.webp";
import animKoffein from "../../public/arbeiten/anim-koffein.webp";
import animKarten from "../../public/arbeiten/anim-karten.webp";
import pierre from "../../public/arbeiten/pierre.webp";
import rennen from "../../public/arbeiten/rennen.webp";

const MAIL = "pierre@laeuft.ch";

type Projekt = {
  name: string;
  zeile: string;
  art: string;
  text: string;
  url: string;
  link: string;
  folien: Folie[];
};

const projekte: Projekt[] = [
  {
    name: "Ein richtig guter Tag",
    zeile: "eine Marke aus einem einzigen Satz",
    art: "Marke, Shop, Journal",
    text: "Nicht jeder Tag ist gut, aber an jedem gibt es etwas Gutes. Daraus sind ein Kalender, Postkarten und Poster im eigenen Shop entstanden. Gerade baue ich das Journal dazu: 182 Tage, jeden Tag ein Schritt und drei gute Dinge. Gesetzt als Code, acht Fassungen in zwei Wochen.",
    url: "https://einrichtiggutertag.ch",
    link: "einrichtiggutertag.ch",
    folien: [
      { bild: ergtShop, alt: "Shop einrichtiggutertag.ch mit dem Kalender 2027" },
      { bild: ergtEinband, alt: "Einband des Journals in Apricot", ganz: true },
      { bild: ergtWoche, alt: "Journal: Doppelseite einer Woche", ganz: true },
      { bild: ergtStart, alt: "Journal: Farbseite und Kapitel Klein anfangen", ganz: true },
      { bild: ergtAnkommen, alt: "Journal: Farbseite und Kapitel Ankommen", ganz: true },
    ],
  },
  {
    name: "Weile",
    zeile: "jeden Tag ein Gebet, ruhig gesprochen",
    art: "App für iOS und Web",
    text: "Ein Gebet am Morgen, eins am Abend. Gratis, ohne Werbung, auf Deutsch. Seit Oktober 2026 im App Store.",
    url: "https://weile.app",
    link: "weile.app",
    folien: [
      { bild: weile, alt: "Startseite von weile.app" },
      { screens: [weileApp1, weileApp2, weileApp3], alt: "Weile: Startbildschirm, Player und Psalmen" },
    ],
  },
  {
    name: "Natural Athletics",
    zeile: "meine Bewegungsschule, mit eigener Coach-App",
    art: "Website, App, Abos",
    text: "Kurse in Brig und Albinen, Anmeldung und Abos auf der Website. Dazu eine App, in der ich Laufpläne schreibe und Athletinnen und Athleten ihre Woche abhaken.",
    url: "https://natural-athletics.ch/laufcoaching",
    link: "natural-athletics.ch",
    folien: [
      { bild: na, alt: "Laufcoaching-Seite von natural-athletics.ch" },
      { screens: [coachHeute, coachPlan, coachPlayer, coachFortschritt], alt: "Coach-App: Heute, Plan, Workout und Fortschritt" },
    ],
  },
  {
    name: "Gemeindeplatz",
    zeile: "aus der Website von Albinen wird eine Plattform",
    art: "Gemeinde-Websites",
    text: "Für meine Wohngemeinde Albinen habe ich eine Website mit Webcam, Live-Wetter, Formularen und eigenem Redaktionssystem gebaut. Daraus ist Gemeindeplatz entstanden, fertig für jede Schweizer Gemeinde.",
    url: "https://gemeindeplatz.vercel.app",
    link: "Gemeindeplatz ansehen",
    folien: [
      { bild: albinen, alt: "Website der Gemeinde Albinen" },
      { bild: gemeindeplatz, alt: "Startseite von Gemeindeplatz" },
    ],
  },
  {
    name: "YouTube",
    zeile: "Backyard-Dokus mit eigenen Animationen",
    art: "Kanal @pierreoutdoor",
    text: "Ich erzähle von Backyard Ultras in langen Dokus statt kurzen Clips. Grafiken und Animationen baue ich selbst, als Code geschrieben und in 4K gerendert.",
    url: "https://www.youtube.com/@pierreoutdoor",
    link: "youtube.com/@pierreoutdoor",
    folien: [
      { bild: ytDoku, alt: "Vorschaubild: Last Soul Ultra 26, eine Backyard-Doku" },
      { bild: animTempo, alt: "Animation: gleicher Puls, anderes Tempo" },
      { bild: animKoffein, alt: "Animation: Koffein über 33 Runden" },
      { bild: animKarten, alt: "Animation: Hitze, Koffein, Essen, Eisen" },
      { bild: yt99, alt: "Vorschaubild: 99 Laps" },
    ],
  },
  {
    name: "Fuelyard",
    zeile: "die App für die Crew am Backyard",
    art: "Web-App, offline",
    text: "Verpflegung, Koffein und Wechsel, Runde für Runde. Läuft auch ohne Netz im Zelt.",
    url: "https://fuelyard.de",
    link: "fuelyard.de",
    folien: [{ bild: fuelyard, alt: "Startseite von fuelyard.de" }],
  },
  {
    name: "Graatzug",
    zeile: "ein Backyard Ultra im Wallis",
    art: "Website, Anmeldung, Lotterie",
    text: "Alles, was Läuferinnen und Läufer vor dem Start wissen wollen, dazu Anmeldung und Startplatz-Lotterie.",
    url: "https://graatzug.ch",
    link: "graatzug.ch",
    folien: [{ bild: graatzug, alt: "Startseite von graatzug.ch" }],
  },
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

function Bild({ src, alt }: { src: StaticImageData; alt: string }) {
  return (
    <div className="overflow-hidden rounded-[6px] border border-black/[0.06] bg-[#f3f2ef]">
      <Image src={src} alt={alt} placeholder="blur" sizes="(min-width: 1024px) 1100px, 100vw" className="h-auto w-full" />
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
              Eigene Apps, meine Marke «Ein richtig guter Tag», Konzept-Websites für Marken, die ich mag,
              Plattformen für Gemeinden. Und nebenbei laufe ich Backyard Ultras und erzähle davon auf
              YouTube.
            </p>
          </div>
        </section>

        <section id="arbeiten" className="mx-auto max-w-[1240px] scroll-mt-8 px-5 sm:px-8">
          {projekte.map((p, i) => (
            <article key={p.name} className={i === 0 ? "" : "pt-28 sm:pt-40"}>
              <BilderWechsel folien={p.folien} prio={i === 0} />
              <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_1fr] sm:gap-16">
                <div>
                  <h2 className="text-[24px] leading-[1.2] tracking-[-0.02em] sm:text-[30px]">
                    <span className="font-semibold">{p.name}</span> — {p.zeile}
                  </h2>
                  <p className="mt-2 text-[14px] text-[#8a8a8a]">{p.art}</p>
                </div>
                <div>
                  <p className="max-w-[50ch] text-[16px] leading-[1.65] text-[#4a4a4a]">{p.text}</p>
                  <a href={p.url} target="_blank" rel="noopener" className="mt-4 inline-block text-[15px] underline underline-offset-4 hover:text-[#E0572B]">
                    {p.link}
                  </a>
                </div>
              </div>
            </article>
          ))}
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

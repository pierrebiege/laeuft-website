import Link from "next/link";

export const metadata = {
  title: "Datenschutz | Läuft.",
  description: "Datenschutzerklärung",
};

export default function Datenschutz() {
  return (
    <main className="min-h-screen bg-[#f5f5f5] dark:bg-zinc-950 text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#f5f5f5]/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            Läuft.
          </Link>
        </div>
      </nav>

      {/* Content */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-12">Datenschutzerklärung</h1>

          <div className="space-y-8 text-muted">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Verantwortliche Stelle
              </h2>
              <p>Pierre Biege</p>
              <p>Tschangaladongastrasse 3</p>
              <p>3955 Albinen</p>
              <p>Schweiz</p>
              <p className="mt-2">
                <a
                  href="mailto:pierre@laeuft.ch"
                  className="hover:text-foreground transition-colors"
                >
                  pierre@laeuft.ch
                </a>
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Allgemeines
              </h2>
              <p className="leading-relaxed">
                Der Schutz Ihrer persönlichen Daten ist mir ein besonderes
                Anliegen. Ich verarbeite Ihre Daten daher ausschliesslich auf
                Grundlage der gesetzlichen Bestimmungen (DSG, DSGVO).
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Hosting
              </h2>
              <p className="leading-relaxed">
                Diese Website wird bei Vercel Inc. gehostet. Die Server befinden
                sich in verschiedenen Rechenzentren weltweit. Beim Besuch der
                Website werden automatisch technische Zugriffsdaten erhoben
                (Server-Logfiles), wie z.B. IP-Adresse, Browsertyp, Betriebssystem
                und Zeitpunkt des Zugriffs.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Analyse
              </h2>
              <p className="leading-relaxed">
                Diese Website verwendet Vercel Analytics zur anonymisierten
                Auswertung des Nutzerverhaltens. Es werden keine Cookies gesetzt
                und keine persönlichen Daten erfasst. Die Daten werden auf
                Servern von Vercel Inc. verarbeitet.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Terminbuchung
              </h2>
              <p className="leading-relaxed">
                Für die Terminbuchung wird Calendly verwendet. Bei der Buchung
                werden die von Ihnen eingegebenen Daten (Name, E-Mail) an
                Calendly LLC übermittelt und dort verarbeitet. Weitere
                Informationen finden Sie in der{" "}
                <a
                  href="https://calendly.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground transition-colors"
                >
                  Datenschutzerklärung von Calendly
                </a>
                .
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Kontakt per E-Mail
              </h2>
              <p className="leading-relaxed">
                Wenn Sie mich per E-Mail kontaktieren, werden Ihre Angaben zur
                Bearbeitung der Anfrage und für mögliche Anschlussfragen
                gespeichert. Diese Daten gebe ich nicht ohne Ihre Einwilligung
                weiter.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Ihre Rechte
              </h2>
              <p className="leading-relaxed">
                Sie haben das Recht auf Auskunft, Berichtigung, Löschung und
                Einschränkung der Verarbeitung Ihrer personenbezogenen Daten.
                Wenden Sie sich dafür an die oben genannte Kontaktadresse.
              </p>
            </div>

            <div>
              <p className="text-sm">Stand: Januar 2026</p>
            </div>
          </div>

          <div className="mt-16">
            <Link
              href="/"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              ← Zurück zur Startseite
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

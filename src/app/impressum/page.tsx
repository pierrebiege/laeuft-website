import Link from "next/link";

export const metadata = {
  title: "Impressum | Läuft.",
  description: "Impressum und rechtliche Informationen",
};

export default function Impressum() {
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
          <h1 className="text-4xl font-bold mb-12">Impressum</h1>

          <div className="space-y-8 text-muted">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Kontakt
              </h2>
              <p>Pierre Biege</p>
              <p>Tschangaladongastrasse 3</p>
              <p>3955 Albinen</p>
              <p>Schweiz</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">
                E-Mail
              </h2>
              <p>
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
                Haftungsausschluss
              </h2>
              <p className="leading-relaxed">
                Der Autor übernimmt keinerlei Gewähr hinsichtlich der
                inhaltlichen Richtigkeit, Genauigkeit, Aktualität,
                Zuverlässigkeit und Vollständigkeit der Informationen.
              </p>
              <p className="leading-relaxed mt-4">
                Haftungsansprüche gegen den Autor wegen Schäden materieller oder
                immaterieller Art, welche aus dem Zugriff oder der Nutzung bzw.
                Nichtnutzung der veröffentlichten Informationen entstanden sind,
                werden ausgeschlossen.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Urheberrechte
              </h2>
              <p className="leading-relaxed">
                Die Urheber- und alle anderen Rechte an Inhalten, Bildern, Fotos
                oder anderen Dateien auf der Website gehören ausschliesslich
                Pierre Biege oder den speziell genannten Rechtsinhabern.
              </p>
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

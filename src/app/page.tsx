export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-semibold tracking-tight">Läuft.</span>
          <a
            href="#kontakt"
            className="text-sm font-medium text-muted hover:text-foreground transition-colors"
          >
            Kontakt
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-6 pt-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-8">
            Euer Betrieb.
            <br />
            Schneller.
          </h1>

          <p className="text-xl sm:text-2xl text-muted max-w-xl mx-auto mb-12">
            Keine Beratung. Keine Workshops.
            <br />
            Direkte Umsetzung. 14 Tage.
          </p>

          <a
            href="#kontakt"
            className="inline-flex items-center justify-center h-14 px-8 bg-foreground text-background font-medium rounded-full hover:opacity-90 transition-opacity"
          >
            Gespräch buchen
          </a>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-32 px-6 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-16">
            Das kennt ihr.
          </h2>

          <div className="grid gap-8 sm:grid-cols-2">
            <div className="p-8 rounded-2xl bg-foreground/[0.03] dark:bg-foreground/[0.05]">
              <p className="text-lg">
                Ihr kopiert Daten von A nach B. Von Hand.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-foreground/[0.03] dark:bg-foreground/[0.05]">
              <p className="text-lg">
                Jede Anfrage braucht 4 E-Mails.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-foreground/[0.03] dark:bg-foreground/[0.05]">
              <p className="text-lg">
                Niemand weiss, wo die aktuelle Version liegt.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-foreground/[0.03] dark:bg-foreground/[0.05]">
              <p className="text-lg">
                Der Chef entscheidet alles. Weil das System es nicht kann.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-foreground/[0.03] dark:bg-foreground/[0.05] sm:col-span-2">
              <p className="text-lg">
                Ihr seid schnell. Eure Systeme nicht.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Lösung Section */}
      <section className="py-32 px-6 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-8">
            Andere beraten. Wir bauen.
          </h2>

          <p className="text-xl text-muted mb-16 max-w-2xl">
            Nach 14 Tagen arbeitet ihr messbar schneller als vorher.
          </p>

          <div className="grid gap-12 sm:grid-cols-3">
            <div>
              <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center text-lg font-semibold mb-6">
                1
              </div>
              <h3 className="text-lg font-semibold mb-3">Wir analysieren</h3>
              <p className="text-muted">
                Ein Gespräch. Wir verstehen euren Betrieb.
              </p>
            </div>

            <div>
              <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center text-lg font-semibold mb-6">
                2
              </div>
              <h3 className="text-lg font-semibold mb-3">Wir bauen</h3>
              <p className="text-muted">
                Keine Präsentationen. Funktionierende Systeme.
              </p>
            </div>

            <div>
              <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center text-lg font-semibold mb-6">
                3
              </div>
              <h3 className="text-lg font-semibold mb-3">Ihr spart Zeit</h3>
              <p className="text-muted">
                Ab Tag 1. Messbar. Dauerhaft.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Kontrast Section */}
      <section className="py-32 px-6 bg-foreground text-background">
        <div className="max-w-4xl mx-auto">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-muted text-sm mb-2 opacity-60">Andere</p>
              <p className="text-lg line-through opacity-50">Verkaufen Stunden</p>
              <p className="text-xl font-semibold mt-3">Wir verkaufen Zustände.</p>
            </div>

            <div>
              <p className="text-muted text-sm mb-2 opacity-60">Andere</p>
              <p className="text-lg line-through opacity-50">Machen Workshops</p>
              <p className="text-xl font-semibold mt-3">Wir machen Automationen.</p>
            </div>

            <div>
              <p className="text-muted text-sm mb-2 opacity-60">Andere</p>
              <p className="text-lg line-through opacity-50">Erklären</p>
              <p className="text-xl font-semibold mt-3">Wir liefern.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Angebote Section */}
      <section className="py-32 px-6 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
            Drei Wege. Ein Ziel.
          </h2>

          <p className="text-xl text-muted mb-16">
            Fixpreise. Keine Überraschungen.
          </p>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Angebot A */}
            <div className="p-8 rounded-2xl border border-border hover:border-foreground/20 transition-colors">
              <div className="text-sm text-muted mb-4">14 Tage</div>
              <h3 className="text-2xl font-bold mb-4">Betriebs-Upgrade</h3>
              <p className="text-muted mb-6">
                Wir kommen. Wir analysieren. Wir bauen. Nach 14 Tagen läuft euer Betrieb schneller.
              </p>
              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground mt-2 shrink-0"></span>
                  <span>Prozess-Analyse vor Ort</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground mt-2 shrink-0"></span>
                  <span>3 Automationen implementiert</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground mt-2 shrink-0"></span>
                  <span>Team eingeführt</span>
                </li>
              </ul>
              <div className="pt-6 border-t border-border">
                <p className="text-2xl font-bold">CHF 3'000 – 6'000</p>
                <p className="text-sm text-muted mt-1">Einmalig. Fixpreis.</p>
              </div>
            </div>

            {/* Angebot B */}
            <div className="p-8 rounded-2xl border border-border hover:border-foreground/20 transition-colors">
              <div className="text-sm text-muted mb-4">Setup + Betreuung</div>
              <h3 className="text-2xl font-bold mb-4">KI-Arbeitsplatz</h3>
              <p className="text-muted mb-6">
                Ein Assistent, der funktioniert. Kein Kurs. Kein Selbststudium. Fertig eingerichtet.
              </p>
              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground mt-2 shrink-0"></span>
                  <span>Persönlicher KI-Assistent</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground mt-2 shrink-0"></span>
                  <span>Auf eure Arbeit trainiert</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground mt-2 shrink-0"></span>
                  <span>Optionale monatliche Betreuung</span>
                </li>
              </ul>
              <div className="pt-6 border-t border-border">
                <p className="text-2xl font-bold">CHF 2'000 – 4'000</p>
                <p className="text-sm text-muted mt-1">Setup + CHF 300–800/Monat optional</p>
              </div>
            </div>

            {/* Angebot C */}
            <div className="p-8 rounded-2xl border-2 border-foreground relative">
              <div className="absolute -top-3 left-6 bg-background px-3 text-sm font-medium">
                Beliebt
              </div>
              <div className="text-sm text-muted mb-4">Laufend</div>
              <h3 className="text-2xl font-bold mb-4">Betriebsservice</h3>
              <p className="text-muted mb-6">
                Wir sind eure Leute für alles, was schneller werden muss. Monatlich. Planbar.
              </p>
              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground mt-2 shrink-0"></span>
                  <span>Kontinuierliche Optimierung</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground mt-2 shrink-0"></span>
                  <span>Neue Automationen nach Bedarf</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground mt-2 shrink-0"></span>
                  <span>Support wenn's klemmt</span>
                </li>
              </ul>
              <div className="pt-6 border-t border-border">
                <p className="text-2xl font-bold">CHF 1'000 – 3'000</p>
                <p className="text-sm text-muted mt-1">Pro Monat. Jederzeit kündbar.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Über uns Section */}
      <section className="py-32 px-6 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-12">
            Die, die es richten.
          </h2>

          <div className="max-w-2xl">
            <p className="text-xl mb-6">
              Wir kommen aus dem Wallis. Wir kennen KMU.
            </p>

            <p className="text-muted mb-6">
              Wir haben gesehen, wie Betriebe kämpfen. Nicht weil sie schlecht sind.
              Sondern weil ihre Systeme nicht mithalten.
            </p>

            <p className="text-muted mb-6">
              Wir haben aufgehört zu erklären. Wir haben angefangen zu bauen.
            </p>

            <p className="text-muted">
              Schnell. Tief. Dauerhaft.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-32 px-6 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-16">
            Was wir nicht machen.
          </h2>

          <div className="grid gap-8 sm:grid-cols-2">
            <div className="p-6 border-l-2 border-foreground/20">
              <h3 className="font-semibold mb-2">Keine Workshops</h3>
              <p className="text-muted text-sm">
                Wir setzen um. Ihr schaut zu. Dann läuft es.
              </p>
            </div>

            <div className="p-6 border-l-2 border-foreground/20">
              <h3 className="font-semibold mb-2">Keine Strategiepapiere</h3>
              <p className="text-muted text-sm">
                Ihr bekommt Systeme, keine Dokumente.
              </p>
            </div>

            <div className="p-6 border-l-2 border-foreground/20">
              <h3 className="font-semibold mb-2">Keine Buzzwords</h3>
              <p className="text-muted text-sm">
                Wir reden nicht von Transformation. Wir machen euren Betrieb schneller.
              </p>
            </div>

            <div className="p-6 border-l-2 border-foreground/20">
              <h3 className="font-semibold mb-2">Keine versteckten Kosten</h3>
              <p className="text-muted text-sm">
                Fixpreis heisst Fixpreis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="kontakt" className="py-32 px-6 bg-foreground text-background">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            Bereit?
          </h2>

          <p className="text-xl opacity-70 mb-12">
            Ein Gespräch. 20 Minuten. Dann wisst ihr Bescheid.
          </p>

          <a
            href="mailto:hallo@laeuft.ch"
            className="inline-flex items-center justify-center h-14 px-8 bg-background text-foreground font-medium rounded-full hover:opacity-90 transition-opacity"
          >
            hallo@laeuft.ch
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted">
          <span>Läuft. Betriebssystem für KMU.</span>
          <span>Wallis, Schweiz</span>
        </div>
      </footer>
    </div>
  );
}

/* Alle Texte der Projektseite laeuft.ch/parkour, Deutsch, Französisch und Englisch.
   Grundlage: ~/Documents/parkour-doku (DOSSIER.md, AUFRUF-CHAT-ENTWURF.md).
   Regel: keine Jahreszahl und kein Ort, die nicht im DOSSIER belegt sind,
   nichts aus dem Abschnitt «Widersprüche», keine Wertung über Organisationen. */

export type Sprache = "de" | "fr" | "en";

export const KONTAKT_MAIL = "pierre@natural-athletics.ch";
export const SEITEN_URL = "https://laeuft.ch/parkour";

export type Art = "video" | "material" | "hinweis";

export type Epoche = { von: number; bis: number; text: string };

export type Texte = {
  htmlLang: string;
  pfad: string;
  andererPfad: string;
  meta: { titel: string; beschreibung: string; ogTitel: string; ogZeile: string };
  nav: { projekt: string; karte: string; film: string; mitmachen: string; wir: string };
  hero: {
    titel: [string, string];
    arbeitstitel: string;
    satz: string;
    ctaGeschichte: string;
    ctaMaterial: string;
  };
  worum: {
    titel: string;
    regionen: string[];
    text1: string;
    text2: string;
  };
  karte: {
    epochen: Epoche[];
    legende: string;
    ende: string;
    endeKnopf: string;
    keinePunkte: string;
    ortsnamen: Record<string, string>;
    zeitachse: string;
  };
  film: {
    titel: string;
    text: string;
    eckdaten: [string, string][];
    regelnTitel: string;
    regeln: string[];
  };
  generationen: { titel: string; text: string };
  mitmachen: {
    titel: string;
    intro: string;
    perMail: string;
    wege: Record<Art, { titel: string; text: string }>;
    video: { fragenTitel: string; fragen: string[]; tippsTitel: string; tipps: string[] };
    material: { titel: string; text: string; offline: string; offlineHilfe: string };
    hinweis: {
      titel: string;
      label: string;
      platzhalter: string;
      fragenTitel: string;
      fragen: { schluessel: "wettkampf" | "wer_gebracht" | "zukunft"; frage: string }[];
    };
    felder: {
      ueberDich: string;
      name: string;
      gruppe: string;
      jahre: string;
      jahrePlatzhalter: string;
      kontakt: string;
      kontaktHilfe: string;
      zuSehen: string;
      zuSehenPlatzhalter: string;
      beschreibungVideo: string;
      beschreibungMaterial: string;
      link: string;
      linkHilfe: string;
      dateien: string;
      dateienWaehlen: string;
      dateienZiehen: string;
      dateienHilfe: (maxMb: number) => string;
      zuGross: (maxMb: number) => string;
      typFalsch: string;
      entfernen: string;
    };
    einverstaendnis: {
      material: string;
      punkte: string[];
      unter18: string;
      hinweis: string;
    };
    senden: string;
    sendet: string;
    laedt: (n: number, total: number) => string;
    danke: { titel: string; text: string; nochmal: string; teilweise: string };
    fehler: {
      name: string;
      kontakt: string;
      einverstaendnis: string;
      leerVideo: string;
      leerMaterial: string;
      leerHinweis: string;
      allgemein: string;
      upload: (name: string) => string;
      zuViele: string;
    };
  };
  wir: {
    titel: string;
    ramon: string;
    pierre: string;
    offenlegung: string;
    fotoFolgt: string;
  };
  teilen: { titel: string; text: string; knopf: string; nachricht: string };
  partner: { titel: string; text: string };
  fuss: { datenschutz: string; impressum: string; arbeitstitel: string };
};

const de: Texte = {
  htmlLang: "de-CH",
  pfad: "/parkour",
  andererPfad: "/parkour/fr",
  meta: {
    titel: "Parkour in der Schweiz. Ein Dokumentarfilm.",
    beschreibung:
      "Ein Dokumentarfilm von Ramon Siegenthaler und Pierre Biege über die Pioniere der Schweizer Parkour-Szene und darüber, wie sich Parkour seit 2000 entwickelt hat. Wir suchen deine Geschichte und deine alten Videos.",
    ogTitel: "Mach mit bei der Doku «Parkour in der Schweiz»",
    ogZeile:
      "Von den ersten Sprüngen in Münsingen bis zur Abstimmung bei Swiss Olympic. Ramon Siegenthaler und Pierre Biege suchen deine Geschichte und dein altes Material.",
  },
  nav: { projekt: "Projekt", karte: "Karte", film: "Der Film", mitmachen: "Mitmachen", wir: "Wer wir sind" },
  hero: {
    titel: ["Parkour", "in der Schweiz"],
    arbeitstitel: "Ein Dokumentarfilm von Ramon Siegenthaler und Pierre Biege. Arbeitstitel «Wem gehört Parkour?»",
    satz: "Über die Pioniere der Schweizer Szene und darüber, wie sich Parkour seit 2000 entwickelt hat. Dafür brauchen wir deine Geschichte und deine alten Videos.",
    ctaGeschichte: "Deine Geschichte erzählen",
    ctaMaterial: "Altes Material schicken",
  },
  worum: {
    titel: "Jede Crew gehört rein.",
    regionen: ["Deutschschweiz", "Romandie", "Tessin", "Wallis", "Graubünden"],
    text1:
      "Die Hauptfigur ist die Szene selbst, nicht eine Organisation und nicht eine einzelne Person. Zu Wort kommen die Pioniere, die heute über 40 sind, die Crews, die es längst nicht mehr gibt, und die Jungen, die in der Halle angefangen haben.",
    text2:
      "Wir erzählen von den ersten Sprüngen um 2000 bis zum 20. November 2026. An dem Tag stimmt Swiss Olympic über die Aufnahme des Verbands ab. Und wir fragen: Was bleibt von Parkour, wenn es Sport wird?",
  },
  karte: {
    epochen: [
      {
        von: 2000,
        bis: 2004,
        text: "Um 2000 sieht Roger Widmer in Münsingen einen kurzen Beitrag auf ARTE und fängt mit Ramon an zu trainieren. 2001 kommt der Film «Yamakasi». Jugendliche springen über Mauern und Geländer. Einen Verein gibt es nicht, oft nicht mal ein Wort dafür. Aus diesen Jahren sind kaum Videos übrig. Wenn du dabei warst, erzähl es uns.",
      },
      {
        von: 2005,
        bis: 2009,
        text: "Man verabredet sich im Forum zum Training und filmt sich gegenseitig. Die Videos landen auf YouTube. Am 15. August 2009 ist in Basel der «First Swiss Jam».",
      },
      {
        von: 2010,
        bis: 2016,
        text: "Aus Crews werden Vereine. In Luzern baut sich die Szene einen eigenen Park. In Basel sammeln Traceure 2014 Geld für eine Halle, den Parkour Palast. Gebaut wird sie nie.",
      },
      {
        von: 2017,
        bis: 2022,
        text: "2017 will der Weltturnverband Parkour als eigene Disziplin. Die Szene gründet 2018 ihren eigenen Verband. 2020 nimmt der Bund Parkour in Jugend+Sport auf.",
      },
      {
        von: 2023,
        bis: 2026,
        text: "Junge Athletinnen und Athleten fahren an Wettkämpfe. Wer um 2000 angefangen hat, ist heute über 40. Am 20. November 2026 stimmt Swiss Olympic über die Aufnahme des Verbands ab.",
      },
    ],
    legende:
      "Ein Punkt erscheint im Jahr der ersten Spur, die wir belegen können, etwa ein Video, ein Zeitungsbericht oder jemand, der dabei war. An den meisten Orten hat es früher angefangen.",
    ende: "Die Karte hat Lücken. Wo hast du trainiert, und seit wann?",
    endeKnopf: "Sag es uns",
    keinePunkte: "Noch keine Spur",
    ortsnamen: {},
    zeitachse: "Zeitachse 2000 bis 2026",
  },
  film: {
    titel: "Der Film.",
    text: "Ein Dokumentarfilm aus Interviews, dem Archiv der Szene und Animation, chronologisch von 2000 bis November 2026. Am Anfang steht Münsingen. Danach entsteht Parkour an vielen Orten gleichzeitig, oft ohne dass man voneinander weiss.",
    eckdaten: [
      ["Länge", "Rund 75 Minuten, auch als Serie in vier Folgen"],
      ["Sprachen", "Deutsch, Französisch und Italienisch im Original, mit Untertiteln"],
      ["Drehbeginn", "November 2026"],
      ["Premiere", "Ziel ist Anfang 2028, danach Vorführungen in den Städten der Karte"],
      ["Produktion", "Wir suchen eine Schweizer Produktionsfirma als Partner"],
    ],
    regelnTitel: "Unsere Regeln",
    regeln: [
      "Jede Jahreszahl und jeder Ort hat einen Beleg. Was nicht belegt ist, kommt nicht als Fakt in den Film.",
      "Wer etwas über sich selbst sagt, bekommt im Bild ein «laut …».",
      "Erinnern sich zwei verschieden, zeigen wir beide Versionen. Kein Off-Kommentar entscheidet.",
      "Wer den Film unterstützt, redet beim Inhalt nicht mit.",
    ],
  },
  generationen: {
    titel: "Zehn Fragen an alle.",
    text: "Wer um 2000 angefangen hat, bekommt dieselben zehn Fragen wie jemand, der letztes Jahr in der Halle angefangen hat. Gleicher Wortlaut, gleicher Bildausschnitt. Im Film schneiden wir die Antworten nebeneinander, und am Schluss zeigt jede Person die erste Bewegung, die sie gelernt hat. Wir brauchen deine echte Sicht, auch wenn du heute anders über Parkour denkst als damals.",
  },
  mitmachen: {
    titel: "Mach mit.",
    intro: "Such dir aus, was passt. Was du schickst, sehen nur wir zwei.",
    perMail: "Lieber per Mail? Schick alles an",
    wege: {
      video: {
        titel: "Video-Statement",
        text: "Stell das Handy hin und beantworte unsere Fragen.",
      },
      material: {
        titel: "Altes Material",
        text: "Videos, Fotos und Flyer bis etwa 2015. Auch verwackelt.",
      },
      hinweis: {
        titel: "Hinweis",
        text: "Uns fehlt eine Gruppe oder ein Jahr stimmt nicht? Schreib es uns.",
      },
    },
    video: {
      fragenTitel: "Zehn Fragen",
      fragen: [
        "Wann und wo hast du zum ersten Mal Parkour gesehen? Was genau war es?",
        "Wo war dein erster Spot? Gibt es ihn noch?",
        "Mit wem hast du angefangen? Was machen die Leute heute?",
        "Was ist Parkour für dich? In einem Satz.",
        "Was unterscheidet Parkour von anderen Sportarten?",
        "Gehört Wettkampf zu Parkour?",
        "Was weisst du über die, die vor dir da waren? Oder was denkst du über die, die nach dir kamen?",
        "Was hat dich Parkour gekostet? Und was hat es dir gegeben?",
        "Wo soll Parkour in der Schweiz in 20 Jahren stehen?",
        "Zum Schluss: Zeig uns die erste Bewegung, die du gelernt hast.",
      ],
      tippsTitel: "So klappt die Aufnahme",
      tipps: [
        "Handy quer halten.",
        "Such dir einen ruhigen Ort ohne Wind und Verkehr.",
        "Geh nah ans Handy und hör dir eine kurze Probe an.",
        "Sag am Anfang, wie du heisst, wo du trainierst und seit wann.",
        "1 bis 2 Minuten pro Frage. Du musst nicht alle beantworten.",
        "Jede Frage einzeln oder alles am Stück, wie es dir passt.",
      ],
    },
    material: {
      titel: "Was wir suchen",
      text: "Alles bis etwa 2015. Videos vom Handy oder von der MiniDV-Kassette, auch verwackelt. Fotos, Flyer von Jams, Screenshots aus dem Forum, alte Websites, Zeitungsausschnitte.",
      offline: "Mein Material liegt noch auf einer alten Festplatte oder MiniDV-Kassette. Meldet euch.",
      offlineHilfe: "Wir holen es ab oder digitalisieren es. Du bekommst alles zurück.",
    },
    hinweis: {
      titel: "Dein Hinweis",
      label: "Dein Hinweis",
      platzhalter: "Welche Gruppe fehlt? Welches Jahr stimmt nicht?",
      fragenTitel: "Wenn du magst, beantworte noch das. Alles freiwillig.",
      fragen: [
        { schluessel: "wettkampf", frage: "Gehört Wettkampf zu Parkour?" },
        { schluessel: "wer_gebracht", frage: "Wer hat dich zu Parkour gebracht?" },
        { schluessel: "zukunft", frage: "Wo soll Parkour in der Schweiz in 20 Jahren stehen?" },
      ],
    },
    felder: {
      ueberDich: "Über dich",
      name: "Name",
      gruppe: "Gruppe / Ort",
      jahre: "Jahr(e)",
      jahrePlatzhalter: "z. B. 2006–2012",
      kontakt: "E-Mail oder Instagram",
      kontaktHilfe: "Damit wir nachfragen können.",
      zuSehen: "Wer ist zu sehen?",
      zuSehenPlatzhalter: "Namen oder Gruppe, soweit du sie kennst",
      beschreibungVideo: "Noch etwas dazu?",
      beschreibungMaterial: "Was ist drauf?",
      link: "Link (WeTransfer, Google Drive, YouTube, Dropbox)",
      linkHilfe: "Falls die Dateien zu gross sind oder schon online liegen.",
      dateien: "Dateien",
      dateienWaehlen: "Dateien wählen",
      dateienZiehen: "oder hierher ziehen",
      dateienHilfe: (maxMb) => `Video, Foto oder PDF, bis ${maxMb} MB pro Datei. Grössere Dateien bitte als Link.`,
      zuGross: (maxMb) => `Grösser als ${maxMb} MB. Bitte als Link schicken.`,
      typFalsch: "Nur Video, Foto oder PDF.",
      entfernen: "Entfernen",
    },
    einverstaendnis: {
      material: "Ja, ihr dürft das Material für die Doku nutzen und damit für sie werben (Trailer, Social Media).",
      punkte: [
        "Ihr nennt mich als Urheberin oder Urheber.",
        "Wer zu sehen ist, ist einverstanden. Sonst fragt ihr die Person, bevor ihr etwas zeigt.",
        "Das Original bleibt bei mir.",
      ],
      unter18: "Unter 18? Sprich vorher mit deinen Eltern.",
      hinweis: "Ja, ihr dürft meinen Hinweis für die Recherche nutzen. Zitieren nur nach Rückfrage.",
    },
    senden: "Abschicken",
    sendet: "Wird gesendet …",
    laedt: (n, total) => `Datei ${n} von ${total} wird hochgeladen`,
    danke: {
      titel: "Angekommen. Danke.",
      text: "Wir schauen alles an und melden uns, wenn wir Fragen haben.",
      nochmal: "Noch etwas schicken",
      teilweise: "Nicht alle Dateien kamen durch. Schick die fehlenden bitte nochmal oder als Link.",
    },
    fehler: {
      name: "Bitte trag deinen Namen ein.",
      kontakt: "Bitte gib eine E-Mail-Adresse oder deinen Instagram-Namen an.",
      einverstaendnis: "Bitte bestätige das Einverständnis.",
      leerVideo: "Bitte lade ein Video hoch oder schick einen Link.",
      leerMaterial: "Bitte lade etwas hoch, schick einen Link oder sag uns, wo das Material liegt.",
      leerHinweis: "Bitte schreib deinen Hinweis.",
      allgemein: `Das hat nicht geklappt. Versuch es nochmal oder schreib an ${KONTAKT_MAIL}.`,
      upload: (name) => `«${name}» konnte nicht hochgeladen werden.`,
      zuViele: "Zu viele Versuche in kurzer Zeit. Bitte probier es später nochmal.",
    },
  },
  wir: {
    titel: "Wer wir sind",
    ramon:
      "Ramon trainiert seit 2000 in Münsingen und hat dort PKM, Parkour Münsingen, mitgegründet. Seit 2006 leitet er Trainings. 2026 hat er Black Panther Athletics gegründet.",
    pierre:
      "Pierre hat 2006 im Wallis angefangen, 2011 entstand mit Patrick Hunziker das Showreel von Parkourwallis. Heute führt er Natural Athletics im Oberwallis und dreht, schneidet und animiert selbst.",
    offenlegung:
      "Wir sind selbst Teil dieser Geschichte. Darum stellen wir allen dieselben Fragen, interviewen uns gegenseitig und lassen heikle Kapitel von jemandem gegenlesen, der nicht dabei war.",
    fotoFolgt: "Foto folgt",
  },
  teilen: {
    titel: "Weitersagen",
    text: "Kennst du Leute, die früher gesprungen sind und heute in keinem Chat mehr sind? Schick ihnen den Link. Aus der Romandie und dem Tessin haben wir noch wenig, und Frauen aus den ersten Jahren fehlen in fast allen Quellen.",
    knopf: "Per WhatsApp teilen",
    nachricht:
      "Hey, Ramon und Pierre machen eine Doku über Parkour in der Schweiz und suchen Geschichten und altes Material von früher. Mach mit: https://laeuft.ch/parkour",
  },
  partner: {
    titel: "Partner und Förderer",
    text: "Wir machen die Doku unabhängig und suchen eine Schweizer Produktionsfirma als Partner. Gemeinden, Stiftungen und Marken, die uns unterstützen wollen, melden sich bei Pierre. Wer Geld gibt, redet beim Inhalt nicht mit. Von der Szene wollen wir kein Geld, sondern Material.",
  },
  fuss: {
    datenschutz: `Was du hier schickst, liegt in einem privaten Speicher in der EU. Sehen können es nur Ramon und Pierre, und wir nutzen es nur für die Doku. Willst du etwas löschen lassen, schreib an ${KONTAKT_MAIL}.`,
    impressum: "Impressum",
    arbeitstitel: "«Parkour in der Schweiz», eine Doku von Ramon Siegenthaler und Pierre Biege.",
  },
};

const fr: Texte = {
  htmlLang: "fr-CH",
  pfad: "/parkour/fr",
  andererPfad: "/parkour",
  meta: {
    titel: "Le parkour en Suisse. Un documentaire.",
    beschreibung:
      "Un documentaire de Ramon Siegenthaler et Pierre Biege sur les pionniers de la scène suisse du parkour et sur la façon dont le parkour a évolué depuis 2000. On cherche ton histoire et tes vieilles vidéos.",
    ogTitel: "Participe au documentaire « Le parkour en Suisse »",
    ogZeile:
      "Des premiers sauts à Münsingen au vote de Swiss Olympic. Ramon Siegenthaler et Pierre Biege cherchent ton histoire et tes vieilles images.",
  },
  nav: { projekt: "Le projet", karte: "Carte", film: "Le film", mitmachen: "Participer", wir: "Qui on est" },
  hero: {
    titel: ["Le parkour", "en Suisse"],
    arbeitstitel: "Un documentaire de Ramon Siegenthaler et Pierre Biege. Titre de travail « À qui appartient le parkour ? »",
    satz: "Sur les pionniers de la scène suisse et sur la façon dont le parkour a évolué depuis 2000. Pour ça, il nous faut ton histoire et tes vieilles vidéos.",
    ctaGeschichte: "Raconter ton histoire",
    ctaMaterial: "Envoyer du vieux matos",
  },
  worum: {
    titel: "Chaque crew a sa place.",
    regionen: ["Suisse alémanique", "Romandie", "Tessin", "Valais", "Grisons"],
    text1:
      "Le personnage principal, c’est la scène elle-même, pas une organisation ni une seule personne. On donne la parole aux pionniers qui ont aujourd’hui passé la quarantaine, aux crews qui n’existent plus depuis longtemps et aux jeunes qui ont commencé en salle.",
    text2:
      "On raconte tout, des premiers sauts vers 2000 jusqu’au 20 novembre 2026. Ce jour-là, Swiss Olympic vote sur l’admission de la fédération. Et on pose la question : que reste-t-il du parkour quand il devient un sport ?",
  },
  karte: {
    epochen: [
      {
        von: 2000,
        bis: 2004,
        text: "Vers 2000, à Münsingen, Roger Widmer voit un court sujet sur ARTE et commence à s’entraîner avec Ramon. En 2001 sort le film « Yamakasi ». Des jeunes sautent par-dessus les murs et les barrières. Pas d’association, souvent même pas de mot pour ça. De ces années-là, il ne reste presque rien en vidéo. Si tu y étais, raconte-nous.",
      },
      {
        von: 2005,
        bis: 2009,
        text: "On se donne rendez-vous sur le forum pour s’entraîner, on se filme les uns les autres. Les vidéos finissent sur YouTube. Le 15 août 2009, le « First Swiss Jam » a lieu à Bâle.",
      },
      {
        von: 2010,
        bis: 2016,
        text: "Les crews deviennent des associations. À Lucerne, la scène se construit son propre parc. À Bâle, des traceurs récoltent de l’argent en 2014 pour une salle, le Parkour Palast. Elle ne verra jamais le jour.",
      },
      {
        von: 2017,
        bis: 2022,
        text: "En 2017, la fédération internationale de gymnastique veut faire du parkour une de ses disciplines. En 2018, la scène fonde sa propre fédération. En 2020, la Confédération fait entrer le parkour dans Jeunesse+Sport.",
      },
      {
        von: 2023,
        bis: 2026,
        text: "Une jeune génération enchaîne les compétitions. Ceux qui ont commencé vers 2000 ont passé la quarantaine. Le 20 novembre 2026, Swiss Olympic vote sur l’admission de la fédération.",
      },
    ],
    legende:
      "Un point apparaît l’année de la première trace qu’on peut prouver, par exemple une vidéo, un article de journal ou quelqu’un qui y était. Dans la plupart des endroits, ça a commencé plus tôt.",
    ende: "La carte a des trous. Tu t’entraînais où, et depuis quand ?",
    endeKnopf: "Dis-nous",
    keinePunkte: "Encore aucune trace",
    ortsnamen: {
      Genf: "Genève",
      Bern: "Berne",
      Basel: "Bâle",
      Zürich: "Zurich",
      Luzern: "Lucerne",
      Solothurn: "Soleure",
      Schaffhausen: "Schaffhouse",
      "St. Gallen": "Saint-Gall",
      Oberwallis: "Haut-Valais",
      Biel: "Bienne",
      Freiburg: "Fribourg",
      Neuenburg: "Neuchâtel",
    },
    zeitachse: "Ligne du temps de 2000 à 2026",
  },
  film: {
    titel: "Le film.",
    text: "Un documentaire fait d’interviews, des archives de la scène et d’animation, raconté dans l’ordre de 2000 à novembre 2026. Au début, il y a Münsingen. Ensuite, le parkour naît à plein d’endroits en même temps, souvent sans qu’on sache les uns des autres.",
    eckdaten: [
      ["Durée", "Environ 75 minutes, aussi en série de quatre épisodes"],
      ["Langues", "Allemand, français et italien en version originale, avec sous-titres"],
      ["Début du tournage", "Novembre 2026"],
      ["Première", "Objectif début 2028, puis des projections dans les villes de la carte"],
      ["Production", "On cherche une société de production suisse comme partenaire"],
    ],
    regelnTitel: "Nos règles",
    regeln: [
      "Chaque année et chaque lieu a une source. Ce qui n’est pas prouvé n’entre pas dans le film comme un fait.",
      "Quand quelqu’un parle de lui-même, on l’indique à l’écran par un « selon … ».",
      "Quand deux personnes se souviennent autrement, on montre les deux versions. Aucune voix off ne tranche.",
      "Qui soutient le film n’a pas son mot à dire sur le contenu.",
    ],
  },
  generationen: {
    titel: "Dix questions pour tout le monde.",
    text: "Celui qui a commencé vers 2000 reçoit les dix mêmes questions que celle qui a commencé l’an dernier en salle. Même formulation, même cadrage. Dans le film, on met les réponses côte à côte, et à la fin chaque personne montre le premier mouvement qu’elle a appris. On a besoin de ton vrai regard, même si tu vois le parkour autrement aujourd’hui qu’à l’époque.",
  },
  mitmachen: {
    titel: "Participe.",
    intro: "Choisis ce qui te va. Ce que tu envoies, on est les deux seuls à le voir.",
    perMail: "Tu préfères par e-mail ? Envoie tout à",
    wege: {
      video: {
        titel: "Témoignage vidéo",
        text: "Pose ton natel et réponds à nos questions.",
      },
      material: {
        titel: "Vieux matos",
        text: "Vidéos, photos et flyers jusqu’à 2015 environ. Même flous.",
      },
      hinweis: {
        titel: "Info",
        text: "Il manque un groupe ou une date est fausse ? Écris-nous.",
      },
    },
    video: {
      fragenTitel: "Dix questions",
      fragen: [
        "Quand et où as-tu vu du parkour pour la première fois ? C’était quoi, exactement ?",
        "C’était où, ton premier spot ? Il existe encore ?",
        "Avec qui tu as commencé ? Qu’est-ce qu’ils font aujourd’hui ?",
        "C’est quoi, le parkour, pour toi ? En une phrase.",
        "Qu’est-ce qui distingue le parkour des autres sports ?",
        "La compétition, ça fait partie du parkour ?",
        "Qu’est-ce que tu sais de ceux qui étaient là avant toi ? Ou qu’est-ce que tu penses de ceux qui sont arrivés après ?",
        "Qu’est-ce que le parkour t’a coûté ? Et qu’est-ce qu’il t’a donné ?",
        "Où devrait en être le parkour en Suisse dans 20 ans ?",
        "Pour finir : montre-nous le premier mouvement que tu as appris.",
      ],
      tippsTitel: "Pour bien filmer",
      tipps: [
        "Tiens ton natel à l’horizontale.",
        "Trouve un endroit calme, sans vent ni trafic.",
        "Reste près du natel et réécoute un court essai.",
        "Au début, dis comment tu t’appelles, où tu t’entraînes et depuis quand.",
        "1 à 2 minutes par question. Pas besoin de répondre à tout.",
        "Une vidéo par question ou tout d’une traite, comme tu veux.",
      ],
    },
    material: {
      titel: "Ce qu’on cherche",
      text: "Tout ce qui date d’avant 2015 environ. Des vidéos au natel ou sur cassette MiniDV, même floues. Des photos, des flyers de jams, des captures du forum, des vieux sites, des coupures de journaux.",
      offline: "Mon matos est encore sur un vieux disque dur ou une cassette MiniDV. Contactez-moi.",
      offlineHilfe: "On passe le chercher ou on le numérise. Tu récupères tout.",
    },
    hinweis: {
      titel: "Ton info",
      label: "Ton info",
      platzhalter: "Quel groupe manque ? Quelle date est fausse ?",
      fragenTitel: "Si tu veux, réponds encore à ça. Tout est facultatif.",
      fragen: [
        { schluessel: "wettkampf", frage: "La compétition, ça fait partie du parkour ?" },
        { schluessel: "wer_gebracht", frage: "Qui t’a amené au parkour ?" },
        { schluessel: "zukunft", frage: "Où devrait en être le parkour en Suisse dans 20 ans ?" },
      ],
    },
    felder: {
      ueberDich: "À propos de toi",
      name: "Nom",
      gruppe: "Groupe / lieu",
      jahre: "Année(s)",
      jahrePlatzhalter: "p. ex. 2006–2012",
      kontakt: "E-mail ou Instagram",
      kontaktHilfe: "Pour qu’on puisse te recontacter.",
      zuSehen: "Qui apparaît ?",
      zuSehenPlatzhalter: "Noms ou groupe, si tu les connais",
      beschreibungVideo: "Autre chose à ajouter ?",
      beschreibungMaterial: "Qu’est-ce qu’on y voit ?",
      link: "Lien (WeTransfer, Google Drive, YouTube, Dropbox)",
      linkHilfe: "Si les fichiers sont trop lourds ou déjà en ligne.",
      dateien: "Fichiers",
      dateienWaehlen: "Choisir des fichiers",
      dateienZiehen: "ou les glisser ici",
      dateienHilfe: (maxMb) =>
        `Vidéo, photo ou PDF, jusqu’à ${maxMb} Mo par fichier. Les fichiers plus lourds par lien, s’il te plaît.`,
      zuGross: (maxMb) => `Plus de ${maxMb} Mo. Envoie-le plutôt par lien.`,
      typFalsch: "Uniquement vidéo, photo ou PDF.",
      entfernen: "Retirer",
    },
    einverstaendnis: {
      material:
        "Oui, vous pouvez utiliser ce matériel pour le documentaire et pour sa promo (bande-annonce, réseaux sociaux).",
      punkte: [
        "Vous me citez comme auteur ou autrice.",
        "Les personnes visibles sont d’accord. Sinon, vous leur demandez avant de montrer quoi que ce soit.",
        "L’original reste chez moi.",
      ],
      unter18: "Moins de 18 ans ? Parles-en d’abord à tes parents.",
      hinweis: "Oui, vous pouvez utiliser mon info pour la recherche. Pour me citer, vous me demandez d’abord.",
    },
    senden: "Envoyer",
    sendet: "Envoi en cours …",
    laedt: (n, total) => `Envoi du fichier ${n} sur ${total}`,
    danke: {
      titel: "Bien reçu. Merci.",
      text: "On regarde tout et on te recontacte si on a des questions.",
      nochmal: "Envoyer autre chose",
      teilweise: "Certains fichiers ne sont pas passés. Renvoie-les ou envoie-les par lien, s’il te plaît.",
    },
    fehler: {
      name: "Indique ton nom, s’il te plaît.",
      kontakt: "Indique une adresse e-mail ou ton nom Instagram.",
      einverstaendnis: "Confirme ton accord, s’il te plaît.",
      leerVideo: "Ajoute une vidéo ou envoie un lien.",
      leerMaterial: "Ajoute un fichier, un lien, ou dis-nous où se trouve le matériel.",
      leerHinweis: "Écris ton info, s’il te plaît.",
      allgemein: `Ça n’a pas marché. Réessaie ou écris à ${KONTAKT_MAIL}.`,
      upload: (name) => `« ${name} » n’a pas pu être envoyé.`,
      zuViele: "Trop d’essais en peu de temps. Réessaie plus tard.",
    },
  },
  wir: {
    titel: "Qui on est",
    ramon:
      "Ramon s’entraîne depuis 2000 à Münsingen, où il a cofondé PKM, Parkour Münsingen. Il donne des entraînements depuis 2006. En 2026, il a fondé Black Panther Athletics.",
    pierre:
      "Pierre a commencé en 2006 en Valais. En 2011, il a tourné avec Patrick Hunziker le showreel de Parkourwallis. Aujourd’hui, il dirige Natural Athletics dans le Haut-Valais et filme, monte et anime lui-même.",
    offenlegung:
      "On fait nous-mêmes partie de cette histoire. C’est pour ça qu’on pose les mêmes questions à tout le monde, qu’on s’interviewe l’un l’autre et qu’on fait relire les chapitres sensibles par quelqu’un qui n’y était pas.",
    fotoFolgt: "Photo à venir",
  },
  teilen: {
    titel: "Fais tourner",
    text: "Tu connais des gens qui sautaient à l’époque et qui ne sont plus dans aucun groupe ? Envoie-leur le lien. De Romandie et du Tessin, on a encore peu de choses, et les femmes des premières années manquent dans presque toutes les sources.",
    knopf: "Partager sur WhatsApp",
    nachricht:
      "Salut, Ramon et Pierre font un documentaire sur le parkour en Suisse et cherchent des histoires et des vieilles images de l’époque. Participe : https://laeuft.ch/parkour/fr",
  },
  partner: {
    titel: "Partenaires et soutiens",
    text: "On fait ce documentaire en indépendants et on cherche une société de production suisse comme partenaire. Les communes, fondations et marques qui veulent nous soutenir écrivent à Pierre. Qui met de l’argent n’a pas son mot à dire sur le contenu. De la scène, on ne veut pas d’argent, mais du matériel.",
  },
  fuss: {
    datenschutz: `Ce que tu envoies ici est stocké dans un espace privé dans l’UE. Seuls Ramon et Pierre y ont accès, et on l’utilise uniquement pour le documentaire. Pour faire supprimer quelque chose, écris à ${KONTAKT_MAIL}.`,
    impressum: "Mentions légales",
    arbeitstitel: "« Le parkour en Suisse », un documentaire de Ramon Siegenthaler et Pierre Biege.",
  },
};

const en: Texte = {
  htmlLang: "en",
  pfad: "/parkour/en",
  andererPfad: "/parkour",
  meta: {
    titel: "Parkour in Switzerland. A documentary.",
    beschreibung:
      "A documentary by Ramon Siegenthaler and Pierre Biege about the pioneers of the Swiss parkour scene and how parkour has changed since 2000. We’re looking for your story and your old videos.",
    ogTitel: "Be part of the documentary «Parkour in Switzerland»",
    ogZeile:
      "From the first jumps in Münsingen to the Swiss Olympic vote. Ramon Siegenthaler and Pierre Biege are looking for your story and your old footage.",
  },
  nav: { projekt: "Project", karte: "Map", film: "The film", mitmachen: "Take part", wir: "Who we are" },
  hero: {
    titel: ["Parkour", "in Switzerland"],
    arbeitstitel: "A documentary by Ramon Siegenthaler and Pierre Biege. Working title «Who owns parkour?»",
    satz: "About the pioneers of the Swiss scene and how parkour has changed since 2000. For that, we need your story and your old videos.",
    ctaGeschichte: "Tell your story",
    ctaMaterial: "Send old footage",
  },
  worum: {
    titel: "Every crew belongs in it.",
    regionen: ["German-speaking", "Romandie", "Ticino", "Valais", "Grisons"],
    text1:
      "The main character is the scene itself, not an organisation and not a single person. We hear from the pioneers who are now over 40, the crews that disappeared long ago, and the kids who started in the gym.",
    text2:
      "We tell the story from the first jumps around 2000 to 20 November 2026. That day, Swiss Olympic votes on admitting the federation. And we ask: what is left of parkour once it becomes a sport?",
  },
  karte: {
    epochen: [
      {
        von: 2000,
        bis: 2004,
        text: "Around 2000, in Münsingen, Roger Widmer sees a short clip on ARTE and starts training with Ramon. In 2001 the film «Yamakasi» comes out. Teenagers jump over walls and railings. No club, often not even a word for it. Hardly any videos from those years survive. If you were there, tell us.",
      },
      {
        von: 2005,
        bis: 2009,
        text: "People meet up on forums to train and film each other. The videos end up on YouTube. On 15 August 2009, Basel hosts the «First Swiss Jam».",
      },
      {
        von: 2010,
        bis: 2016,
        text: "Crews become clubs. In Lucerne, the scene builds its own park. In Basel, traceurs raise money in 2014 for an indoor hall, the Parkour Palast. It never gets built.",
      },
      {
        von: 2017,
        bis: 2022,
        text: "In 2017 the international gymnastics federation wants parkour as one of its disciplines. In 2018 the scene founds its own federation. In 2020 the Swiss government adds parkour to Jugend+Sport.",
      },
      {
        von: 2023,
        bis: 2026,
        text: "Young athletes travel to competitions. Those who started around 2000 are now over 40. On 20 November 2026, Swiss Olympic votes on admitting the federation.",
      },
    ],
    legende:
      "A dot appears in the year of the first trace we can prove, such as a video, a newspaper article or someone who was there. In most places it started earlier.",
    ende: "The map has gaps. Where did you train, and since when?",
    endeKnopf: "Tell us",
    keinePunkte: "No trace yet",
    ortsnamen: {
      Genf: "Geneva",
      Zürich: "Zurich",
      Luzern: "Lucerne",
      Tessin: "Ticino",
      Oberwallis: "Upper Valais",
      Freiburg: "Fribourg",
      Neuenburg: "Neuchâtel",
    },
    zeitachse: "Timeline 2000 to 2026",
  },
  film: {
    titel: "The film.",
    text: "A documentary built from interviews, the scene’s own archive and animation, told in order from 2000 to November 2026. It starts in Münsingen. After that, parkour appears in many places at once, often without people knowing about each other.",
    eckdaten: [
      ["Length", "About 75 minutes, also as a four-part series"],
      ["Languages", "German, French and Italian in the original, with subtitles"],
      ["Filming starts", "November 2026"],
      ["Premiere", "Aiming for early 2028, then screenings in the cities on the map"],
      ["Production", "We’re looking for a Swiss production company as a partner"],
    ],
    regelnTitel: "Our rules",
    regeln: [
      "Every year and every place has a source. Anything we can’t prove doesn’t go into the film as fact.",
      "When someone talks about themselves, the screen says «according to …».",
      "When two people remember things differently, we show both versions. No voice-over decides.",
      "Whoever supports the film has no say over its content.",
    ],
  },
  generationen: {
    titel: "Ten questions for everyone.",
    text: "Someone who started around 2000 gets the same ten questions as someone who started in a gym last year. Same wording, same framing. In the film we cut the answers side by side, and at the end everyone shows the first move they ever learned. We want your real view, even if you see parkour differently today than back then.",
  },
  mitmachen: {
    titel: "Take part.",
    intro: "Pick whatever suits you. Only the two of us see what you send.",
    perMail: "Prefer email? Send everything to",
    wege: {
      video: {
        titel: "Video statement",
        text: "Set up your phone and answer our questions.",
      },
      material: {
        titel: "Old footage",
        text: "Videos, photos and flyers up to around 2015. Shaky is fine.",
      },
      hinweis: {
        titel: "Tip",
        text: "A group is missing or a year is wrong? Tell us.",
      },
    },
    video: {
      fragenTitel: "Ten questions",
      fragen: [
        "When and where did you first see parkour? What exactly was it?",
        "Where was your first spot? Does it still exist?",
        "Who did you start with? What are they doing today?",
        "What is parkour to you? In one sentence.",
        "What makes parkour different from other sports?",
        "Does competition belong in parkour?",
        "What do you know about the people who came before you? Or what do you think of those who came after?",
        "What has parkour cost you? And what has it given you?",
        "Where should parkour in Switzerland be in 20 years?",
        "Finally: show us the first move you ever learned.",
      ],
      tippsTitel: "How to record it",
      tipps: [
        "Hold your phone sideways.",
        "Find a quiet place without wind or traffic.",
        "Stay close to the phone and listen to a short test first.",
        "At the start, say your name, where you train and since when.",
        "1 to 2 minutes per question. You don’t have to answer them all.",
        "One video per question or all in one go, whatever works for you.",
      ],
    },
    material: {
      titel: "What we’re looking for",
      text: "Anything up to around 2015. Phone videos or MiniDV tapes, shaky is fine. Photos, jam flyers, forum screenshots, old websites, newspaper clippings.",
      offline: "My footage is still on an old hard drive or MiniDV tape. Get in touch.",
      offlineHilfe: "We’ll pick it up or digitise it. You get everything back.",
    },
    hinweis: {
      titel: "Your tip",
      label: "Your tip",
      platzhalter: "Which group is missing? Which year is wrong?",
      fragenTitel: "If you like, answer these too. All optional.",
      fragen: [
        { schluessel: "wettkampf", frage: "Does competition belong in parkour?" },
        { schluessel: "wer_gebracht", frage: "Who got you into parkour?" },
        { schluessel: "zukunft", frage: "Where should parkour in Switzerland be in 20 years?" },
      ],
    },
    felder: {
      ueberDich: "About you",
      name: "Name",
      gruppe: "Group / place",
      jahre: "Year(s)",
      jahrePlatzhalter: "e.g. 2006–2012",
      kontakt: "Email or Instagram",
      kontaktHilfe: "So we can get back to you.",
      zuSehen: "Who can be seen?",
      zuSehenPlatzhalter: "Names or group, as far as you know",
      beschreibungVideo: "Anything to add?",
      beschreibungMaterial: "What’s on it?",
      link: "Link (WeTransfer, Google Drive, YouTube, Dropbox)",
      linkHilfe: "If the files are too big or already online.",
      dateien: "Files",
      dateienWaehlen: "Choose files",
      dateienZiehen: "or drop them here",
      dateienHilfe: (maxMb) => `Video, photo or PDF, up to ${maxMb} MB per file. Please send bigger files as a link.`,
      zuGross: (maxMb) => `Larger than ${maxMb} MB. Please send it as a link.`,
      typFalsch: "Video, photo or PDF only.",
      entfernen: "Remove",
    },
    einverstaendnis: {
      material: "Yes, you may use this material for the documentary and to promote it (trailer, social media).",
      punkte: [
        "You credit me as the author.",
        "Everyone who can be seen agrees. Otherwise you ask them before showing anything.",
        "The original stays with me.",
      ],
      unter18: "Under 18? Talk to your parents first.",
      hinweis: "Yes, you may use my tip for research. Quote me only after asking.",
    },
    senden: "Send",
    sendet: "Sending …",
    laedt: (n, total) => `Uploading file ${n} of ${total}`,
    danke: {
      titel: "Received. Thank you.",
      text: "We’ll look at everything and get in touch if we have questions.",
      nochmal: "Send something else",
      teilweise: "Not all files made it. Please send the missing ones again or as a link.",
    },
    fehler: {
      name: "Please enter your name.",
      kontakt: "Please enter an email address or your Instagram name.",
      einverstaendnis: "Please confirm your consent.",
      leerVideo: "Please upload a video or send a link.",
      leerMaterial: "Please upload something, send a link or tell us where the material is.",
      leerHinweis: "Please write your tip.",
      allgemein: `That didn’t work. Try again or write to ${KONTAKT_MAIL}.`,
      upload: (name) => `«${name}» could not be uploaded.`,
      zuViele: "Too many attempts in a short time. Please try again later.",
    },
  },
  wir: {
    titel: "Who we are",
    ramon:
      "Ramon has been training in Münsingen since 2000, where he co-founded PKM, Parkour Münsingen. He has been coaching since 2006. In 2026 he founded Black Panther Athletics.",
    pierre:
      "Pierre started in Valais in 2006. In 2011 he made the Parkourwallis showreel with Patrick Hunziker. Today he runs Natural Athletics in Upper Valais and films, edits and animates himself.",
    offenlegung:
      "We’re part of this story ourselves. That’s why we ask everyone the same questions, interview each other and have sensitive chapters checked by someone who wasn’t involved.",
    fotoFolgt: "Photo coming",
  },
  teilen: {
    titel: "Pass it on",
    text: "Know people who used to jump and aren’t in any group chat anymore? Send them the link. We still have little from Romandie and Ticino, and women from the early years are missing from almost every source.",
    knopf: "Share on WhatsApp",
    nachricht:
      "Hey, Ramon and Pierre are making a documentary about parkour in Switzerland and are looking for stories and old footage. Take part: https://laeuft.ch/parkour/en",
  },
  partner: {
    titel: "Partners and funders",
    text: "We’re making this documentary independently and are looking for a Swiss production company as a partner. Municipalities, foundations and brands that want to support us can contact Pierre. Whoever gives money has no say over the content. From the scene, we don’t want money, we want material.",
  },
  fuss: {
    datenschutz: `What you send here is stored privately in the EU. Only Ramon and Pierre can see it, and we use it only for the documentary. To have something deleted, write to ${KONTAKT_MAIL}.`,
    impressum: "Imprint",
    arbeitstitel: "«Parkour in Switzerland», a documentary by Ramon Siegenthaler and Pierre Biege.",
  },
};

export const TEXTE: Record<Sprache, Texte> = { de, fr, en };

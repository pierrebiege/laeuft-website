/* Alle Texte der Projektseite laeuft.ch/parkour, Deutsch und Französisch.
   Grundlage: ~/Documents/parkour-doku (DOSSIER.md, AUFRUF-CHAT-ENTWURF.md).
   Regel: keine Jahreszahl und kein Ort, die nicht im DOSSIER belegt sind,
   nichts aus dem Abschnitt «Widersprüche», keine Wertung über Organisationen. */

export type Sprache = "de" | "fr";

export const KONTAKT_MAIL = "pierre@laeuft.ch";
export const SEITEN_URL = "https://laeuft.ch/parkour";

export type Art = "video" | "material" | "hinweis";

export type Epoche = { von: number; bis: number; text: string };

export type Texte = {
  htmlLang: string;
  pfad: string;
  andererPfad: string;
  meta: { titel: string; beschreibung: string; ogTitel: string; ogZeile: string };
  nav: { projekt: string; karte: string; mitmachen: string; wir: string };
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
  generationen: { titel: string; text: string };
  mitmachen: {
    titel: string;
    intro: string;
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
    titel: "Parkour in der Schweiz. Die Doku.",
    beschreibung:
      "Ramon Siegenthaler und Pierre Biege machen eine Doku über Parkour in der Schweiz, von den ersten Sprüngen um 2000 bis heute. Wir suchen deine Geschichte und deine alten Videos.",
    ogTitel: "Parkour in der Schweiz. Die Doku.",
    ogZeile: "Wir machen einen Film über die Szene. Dafür brauchen wir deine Geschichte und deine alten Videos.",
  },
  nav: { projekt: "Projekt", karte: "Karte", mitmachen: "Mitmachen", wir: "Wer wir sind" },
  hero: {
    titel: ["Parkour", "in der Schweiz"],
    arbeitstitel: "Die Doku. Von Ramon Siegenthaler und Pierre Biege.",
    satz: "Wir machen einen Film über die Leute, die hier seit gut 25 Jahren über Mauern springen. Dafür brauchen wir deine Geschichte und deine alten Videos.",
    ctaGeschichte: "Deine Geschichte erzählen",
    ctaMaterial: "Altes Material schicken",
  },
  worum: {
    titel: "Jede Crew gehört rein.",
    regionen: ["Deutschschweiz", "Romandie", "Tessin", "Wallis", "Graubünden"],
    text1:
      "Die grossen Vereine gehören rein. Die Crew aus drei Leuten, die es längst nicht mehr gibt, auch. Wir erzählen von den ersten Sprüngen um 2000 bis zum 20. November 2026. An dem Tag stimmt Swiss Olympic über die Aufnahme des Verbands ab.",
    text2:
      "Das letzte Wort hat bei uns niemand. Wenn sich zwei an dieselbe Sache verschieden erinnern, kommen beide Versionen in den Film.",
  },
  karte: {
    epochen: [
      {
        von: 2000,
        bis: 2004,
        text: "Ein paar Sekunden Fernsehen, 2001 dann der Film «Yamakasi». Jugendliche springen über Mauern und Geländer. Einen Verein gibt es nicht, oft nicht mal ein Wort dafür. Aus diesen Jahren sind kaum Videos übrig. Wenn du dabei warst, erzähl es uns.",
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
      "Ein Punkt erscheint im Jahr der ersten Spur, die wir belegen können, etwa ein Video oder ein Zeitungsbericht. An den meisten Orten hat es früher angefangen.",
    ende: "Die Karte hat Lücken. Wo hast du trainiert, und seit wann?",
    endeKnopf: "Sag es uns",
    keinePunkte: "Noch keine Spur",
    ortsnamen: {},
    zeitachse: "Zeitachse 2000 bis 2026",
  },
  generationen: {
    titel: "Dieselben Fragen an alle.",
    text: "Wer um 2000 angefangen hat, bekommt dieselben neun Fragen wie jemand, der letztes Jahr in der Halle angefangen hat. Im Film schneiden wir die Antworten nebeneinander.",
  },
  mitmachen: {
    titel: "Mach mit.",
    intro: "Such dir aus, was passt. Was du schickst, sehen nur wir zwei.",
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
      fragenTitel: "Neun Fragen",
      fragen: [
        "Wann und wo hast du zum ersten Mal Parkour gesehen? Was genau war es?",
        "Wo war dein erster Spot? Gibt es ihn noch?",
        "Mit wem hast du angefangen? Was machen die Leute heute?",
        "Was ist Parkour für dich? In einem Satz.",
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
      "Ramon trainiert seit Anfang der 2000er-Jahre. Heute führt er in Münsingen Black Panther Athletics.",
    pierre: "Pierre hat 2006 im Wallis angefangen. Heute führt er im Oberwallis Natural Athletics.",
    offenlegung:
      "Wir sind selbst Teil dieser Geschichte. Viele von euch kennen wir von Jams und vom Training. Deshalb stellen wir jeder Gruppe, die wir finden, dieselben Fragen.",
    fotoFolgt: "Foto folgt",
  },
  teilen: {
    titel: "Weitersagen",
    text: "Kennst du Leute, die früher gesprungen sind und heute in keinem Chat mehr sind? Schick ihnen den Link. Aus der Romandie und dem Tessin haben wir noch wenig.",
    knopf: "Per WhatsApp teilen",
    nachricht:
      "Hey, Ramon und Pierre machen eine Doku über Parkour in der Schweiz. Sie suchen alte Videos und Geschichten von früher: https://laeuft.ch/parkour",
  },
  partner: {
    titel: "Partner und Förderer",
    text: "Wir machen die Doku unabhängig. Gemeinden, Stiftungen und Marken, die uns unterstützen wollen, melden sich bei Pierre. Wer Geld gibt, redet beim Inhalt nicht mit.",
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
    titel: "Le parkour en Suisse. Le documentaire.",
    beschreibung:
      "Ramon Siegenthaler et Pierre Biege font un documentaire sur le parkour en Suisse, des premiers sauts vers 2000 à aujourd’hui. On cherche ton histoire et tes vieilles vidéos.",
    ogTitel: "Le parkour en Suisse. Le documentaire.",
    ogZeile: "On fait un film sur la scène. Pour ça, il nous faut ton histoire et tes vieilles vidéos.",
  },
  nav: { projekt: "Le projet", karte: "Carte", mitmachen: "Participer", wir: "Qui on est" },
  hero: {
    titel: ["Le parkour", "en Suisse"],
    arbeitstitel: "Le documentaire. Par Ramon Siegenthaler et Pierre Biege.",
    satz: "On fait un film sur les gens qui sautent les murs d’ici depuis plus de 25 ans. Pour ça, il nous faut ton histoire et tes vieilles vidéos.",
    ctaGeschichte: "Raconter ton histoire",
    ctaMaterial: "Envoyer du vieux matos",
  },
  worum: {
    titel: "Chaque crew a sa place.",
    regionen: ["Suisse alémanique", "Romandie", "Tessin", "Valais", "Grisons"],
    text1:
      "Les grosses associations sont dedans. La crew de trois potes qui n’existe plus depuis longtemps aussi. On raconte tout, des premiers sauts vers 2000 jusqu’au 20 novembre 2026. Ce jour-là, Swiss Olympic vote sur l’admission de la fédération.",
    text2:
      "Chez nous, personne n’a le dernier mot. Quand deux personnes se souviennent autrement de la même chose, les deux versions vont dans le film.",
  },
  karte: {
    epochen: [
      {
        von: 2000,
        bis: 2004,
        text: "Quelques secondes à la télé, puis le film « Yamakasi » en 2001. Des jeunes sautent par-dessus les murs et les barrières. Pas d’association, souvent même pas de mot pour ça. De ces années-là, il ne reste presque rien en vidéo. Si tu y étais, raconte-nous.",
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
      "Un point apparaît l’année de la première trace qu’on peut prouver, par exemple une vidéo ou un article de journal. Dans la plupart des endroits, ça a commencé plus tôt.",
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
  generationen: {
    titel: "Les mêmes questions pour tout le monde.",
    text: "Celui qui a commencé vers 2000 reçoit les neuf mêmes questions que celle qui a commencé l’an dernier en salle. Dans le film, on met les réponses côte à côte.",
  },
  mitmachen: {
    titel: "Participe.",
    intro: "Choisis ce qui te va. Ce que tu envoies, on est les deux seuls à le voir.",
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
      fragenTitel: "Neuf questions",
      fragen: [
        "Quand et où as-tu vu du parkour pour la première fois ? C’était quoi, exactement ?",
        "C’était où, ton premier spot ? Il existe encore ?",
        "Avec qui tu as commencé ? Qu’est-ce qu’ils font aujourd’hui ?",
        "C’est quoi, le parkour, pour toi ? En une phrase.",
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
    ramon: "Ramon s’entraîne depuis le début des années 2000. Aujourd’hui, il dirige Black Panther Athletics à Münsingen.",
    pierre: "Pierre a commencé en 2006 en Valais. Aujourd’hui, il dirige Natural Athletics dans le Haut-Valais.",
    offenlegung:
      "On fait nous-mêmes partie de cette histoire. Beaucoup d’entre vous, on vous connaît des jams et de l’entraînement. C’est pour ça qu’on pose les mêmes questions à chaque groupe qu’on trouve.",
    fotoFolgt: "Photo à venir",
  },
  teilen: {
    titel: "Fais tourner",
    text: "Tu connais des gens qui sautaient à l’époque et qui ne sont plus dans aucun groupe ? Envoie-leur le lien. De Romandie et du Tessin, on a encore peu de choses.",
    knopf: "Partager sur WhatsApp",
    nachricht:
      "Salut, Ramon et Pierre font un documentaire sur le parkour en Suisse. Ils cherchent des vieilles vidéos et des histoires de l’époque : https://laeuft.ch/parkour/fr",
  },
  partner: {
    titel: "Partenaires et soutiens",
    text: "On fait ce documentaire en indépendants. Les communes, fondations et marques qui veulent nous soutenir écrivent à Pierre. Qui met de l’argent n’a pas son mot à dire sur le contenu.",
  },
  fuss: {
    datenschutz: `Ce que tu envoies ici est stocké dans un espace privé dans l’UE. Seuls Ramon et Pierre y ont accès, et on l’utilise uniquement pour le documentaire. Pour faire supprimer quelque chose, écris à ${KONTAKT_MAIL}.`,
    impressum: "Mentions légales",
    arbeitstitel: "« Le parkour en Suisse », un documentaire de Ramon Siegenthaler et Pierre Biege.",
  },
};

export const TEXTE: Record<Sprache, Texte> = { de, fr };

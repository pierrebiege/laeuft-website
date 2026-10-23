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
    titel: "Wem gehört Parkour? 25 Jahre Parkour in der Schweiz",
    beschreibung:
      "Ramon Siegenthaler und Pierre Biege machen eine Doku über 25 Jahre Parkour in der Schweiz, erzählt von der ganzen Szene. Erzähl deine Geschichte oder schick altes Material.",
    ogTitel: "Wem gehört Parkour?",
    ogZeile: "Eine Doku über 25 Jahre Parkour in der Schweiz. Erzählt von der Szene. Auch von dir.",
  },
  nav: { projekt: "Projekt", karte: "Karte", mitmachen: "Mitmachen", wir: "Wer wir sind" },
  hero: {
    titel: ["Wem gehört", "Parkour?"],
    arbeitstitel: "Arbeitstitel einer Doku über 25 Jahre Parkour in der Schweiz",
    satz: "Erzählt von denen, die dabei waren. Also auch von dir.",
    ctaGeschichte: "Deine Geschichte erzählen",
    ctaMaterial: "Altes Material schicken",
  },
  worum: {
    titel: "Die Hauptfigur ist die Szene.",
    regionen: ["Deutschschweiz", "Romandie", "Tessin", "Wallis", "Graubünden"],
    text1:
      "Alle Gruppen, die es gab und gibt. Die grossen, die kleinen und die, die es nicht mehr gibt. Von den ersten Sprüngen um 2000 bis zur Abstimmung von Swiss Olympic am 20. November 2026.",
    text2:
      "Kein Verein, keine Schule und keine Firma bekommt das letzte Wort. Wo sich Erinnerungen widersprechen, zeigen wir beide.",
  },
  karte: {
    epochen: [
      {
        von: 2000,
        bis: 2004,
        text: "Ein paar Sekunden Fernsehen, ein Film aus Frankreich. Jugendliche springen über Mauern, ohne Verein, ohne Halle, ohne Wort dafür. Aus diesen Jahren gibt es kaum Belege, nur Erinnerungen. Genau die suchen wir.",
      },
      {
        von: 2005,
        bis: 2009,
        text: "Foren, die ersten Websites, YouTube. Crews filmen sich gegenseitig. 2009 findet in Basel der «First Swiss Jam» statt.",
      },
      {
        von: 2010,
        bis: 2016,
        text: "Aus Crews werden Vereine. Es gibt Jams, Shows, eigene Parks und Hallen. Manches klappt, manches nicht.",
      },
      {
        von: 2017,
        bis: 2022,
        text: "Der Weltturnverband will Parkour als eigene Disziplin. Die Szene gründet 2018 einen eigenen Verband, 2020 nimmt der Bund Parkour in Jugend+Sport auf.",
      },
      {
        von: 2023,
        bis: 2026,
        text: "Eine junge Wettkampfgeneration ist da, die Pioniere sind über 40. Am 20. November 2026 stimmt Swiss Olympic über die Aufnahme des Verbands ab.",
      },
    ],
    legende:
      "Ein Punkt erscheint in dem Jahr, ab dem wir eine Spur belegen können: ein Video, einen Verein, einen Bericht. Angefangen hat es an vielen Orten früher.",
    ende: "Die Karte ist nicht fertig. Fehlt dein Ort, deine Gruppe, dein Jahr?",
    endeKnopf: "Sag es uns",
    keinePunkte: "Noch keine Belege",
    ortsnamen: {},
    zeitachse: "Zeitachse 2000 bis 2026",
  },
  generationen: {
    titel: "Dieselben Fragen an alle.",
    text: "An die, die um 2000 angefangen haben, und an die, die heute Wettkämpfe gewinnen. Im Film stehen ihre Antworten nebeneinander. Deine kann eine davon sein.",
  },
  mitmachen: {
    titel: "Mach mit.",
    intro: "Drei Wege. Was du schickst, sehen nur Ramon und Pierre.",
    wege: {
      video: {
        titel: "Video-Statement",
        text: "Nimm dich mit dem Handy auf und beantworte unsere Fragen.",
      },
      material: {
        titel: "Altes Material",
        text: "Videos, Fotos, Flyer, Forenscreens aus den Jahren 2000 bis 2015.",
      },
      hinweis: {
        titel: "Hinweis",
        text: "Wer fehlt? Was stimmt nicht? Wer war zuerst?",
      },
    },
    video: {
      fragenTitel: "Die Fragen",
      fragen: [
        "Wann und wo hast du Parkour zum ersten Mal gesehen? Was genau?",
        "Wo war dein erster Spot? Gibt es ihn noch?",
        "Mit wem hast du angefangen? Wo sind diese Leute heute?",
        "Was ist Parkour für dich, in einem Satz?",
        "Gehört Wettkampf zu Parkour?",
        "Was weisst du über die, die vor dir da waren? Oder: Was denkst du über die, die nach dir kamen?",
        "Was hat dich Parkour gekostet, und was hat es dir gegeben?",
        "Was soll Parkour in der Schweiz in 20 Jahren sein?",
        "Zum Schluss: Zeig uns die Bewegung, die du als erste gelernt hast.",
      ],
      tippsTitel: "So klappt die Aufnahme",
      tipps: [
        "Handy quer halten.",
        "Ruhiger Ort, wenig Wind, kein Verkehr im Hintergrund.",
        "Nah ans Handy. Hör dir eine kurze Probe an, ob der Ton sauber ist.",
        "Sag am Anfang deinen Namen, deinen Ort und seit wann du trainierst.",
        "1 bis 2 Minuten pro Frage. Du musst nicht alle beantworten.",
        "Jede Frage einzeln aufnehmen oder alles am Stück, wie es dir passt.",
      ],
    },
    material: {
      titel: "Was wir suchen",
      text: "Alles aus den Jahren 2000 bis 2015: Videos, auch verwackelt, vom Handy oder von MiniDV. Fotos, Flyer von Jams und Shows, Screenshots aus Foren, alte Websites, Zeitungsausschnitte.",
      offline: "Mein Material liegt noch auf einer alten Festplatte, Kassette oder MiniDV. Meldet euch.",
      offlineHilfe: "Wir holen es ab oder digitalisieren es, und du bekommst alles zurück.",
    },
    hinweis: {
      titel: "Dein Hinweis",
      label: "Dein Hinweis",
      platzhalter: "Wer fehlt? Was stimmt nicht? Wer war zuerst?",
      fragenTitel: "Wenn du magst, red mit. Alles freiwillig.",
      fragen: [
        { schluessel: "wettkampf", frage: "Gehört Wettkampf zu Parkour?" },
        { schluessel: "wer_gebracht", frage: "Wer hat dich zu Parkour gebracht?" },
        { schluessel: "zukunft", frage: "Was soll Parkour in der Schweiz in 20 Jahren sein?" },
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
      material: "Ja, ihr dürft das Material für die Doku und die Werbung dafür nutzen (Trailer, Social Media).",
      punkte: [
        "Ihr nennt mich als Urheberin oder Urheber.",
        "Wer zu sehen ist, ist einverstanden, oder ihr fragt die Person, bevor ihr etwas zeigt.",
        "Das Original bleibt bei mir.",
      ],
      unter18: "Unter 18? Sprich vorher mit deinen Eltern.",
      hinweis: "Ja, ihr dürft meinen Hinweis für die Recherche nutzen. Zitiert werde ich nur nach Rückfrage.",
    },
    senden: "Abschicken",
    sendet: "Wird gesendet …",
    laedt: (n, total) => `Datei ${n} von ${total} wird hochgeladen`,
    danke: {
      titel: "Danke, das ist angekommen.",
      text: "Wir schauen uns alles an und melden uns, wenn wir Fragen haben.",
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
    titel: "Wer die Doku macht",
    ramon:
      "Trainiert Parkour seit Anfang der 2000er-Jahre, in Münsingen. Heute führt er dort Black Panther Athletics.",
    pierre:
      "Trainiert Parkour seit 2006, angefangen hat er im Wallis. Heute führt er Natural Athletics im Wallis.",
    offenlegung:
      "Wir sind beide Teil dieser Geschichte. Genau deshalb wollen wir, dass die ganze Szene zu Wort kommt.",
    fotoFolgt: "Foto folgt",
  },
  teilen: {
    titel: "Weitersagen",
    text: "Kennst du Leute, die früher dabei waren und heute in keinem Chat mehr sind? Schick ihnen den Link. Aus der Romandie und dem Tessin fehlt uns besonders viel.",
    knopf: "Per WhatsApp teilen",
    nachricht:
      "Ramon Siegenthaler und Pierre Biege machen eine Doku über 25 Jahre Parkour in der Schweiz und suchen Geschichten und altes Material: https://laeuft.ch/parkour",
  },
  partner: {
    titel: "Partner und Förderer",
    text: "Die Doku entsteht unabhängig. Gemeinden, Stiftungen und Marken, die sie unterstützen wollen, melden sich bei Pierre. Wer unterstützt, redet beim Inhalt nicht mit.",
  },
  fuss: {
    datenschutz: `Was du hier schickst, liegt in einem privaten Speicher in der EU und ist nur für Ramon und Pierre sichtbar. Wir nutzen es nur für die Doku. Willst du etwas löschen lassen, schreib an ${KONTAKT_MAIL}.`,
    impressum: "Impressum",
    arbeitstitel: "«Wem gehört Parkour?» ist ein Arbeitstitel.",
  },
};

const fr: Texte = {
  htmlLang: "fr-CH",
  pfad: "/parkour/fr",
  andererPfad: "/parkour",
  meta: {
    titel: "À qui appartient le parkour ? 25 ans de parkour en Suisse",
    beschreibung:
      "Ramon Siegenthaler et Pierre Biege préparent un documentaire sur 25 ans de parkour en Suisse, raconté par toute la scène. Raconte ton histoire ou envoie du vieux matériel.",
    ogTitel: "À qui appartient le parkour ?",
    ogZeile: "Un documentaire sur 25 ans de parkour en Suisse. Raconté par la scène. Aussi par toi.",
  },
  nav: { projekt: "Le projet", karte: "Carte", mitmachen: "Participer", wir: "Qui on est" },
  hero: {
    titel: ["À qui appartient", "le parkour ?"],
    arbeitstitel: "Titre de travail d’un documentaire sur 25 ans de parkour en Suisse",
    satz: "Raconté par celles et ceux qui étaient là. Donc aussi par toi.",
    ctaGeschichte: "Raconter ton histoire",
    ctaMaterial: "Envoyer du vieux matériel",
  },
  worum: {
    titel: "Le personnage principal, c’est la scène.",
    regionen: ["Suisse alémanique", "Romandie", "Tessin", "Valais", "Grisons"],
    text1:
      "Tous les groupes qui ont existé ou qui existent. Les grands, les petits et ceux qui ont disparu. Des premiers sauts vers 2000 jusqu’au vote de Swiss Olympic le 20 novembre 2026.",
    text2:
      "Aucune association, aucune école, aucune entreprise n’a le dernier mot. Là où les souvenirs se contredisent, on montre les deux versions.",
  },
  karte: {
    epochen: [
      {
        von: 2000,
        bis: 2004,
        text: "Quelques secondes à la télé, un film venu de France. Des jeunes sautent par-dessus des murs, sans club, sans salle, sans mot pour le dire. De ces années-là, il ne reste presque aucune trace, seulement des souvenirs. C’est exactement ce qu’on cherche.",
      },
      {
        von: 2005,
        bis: 2009,
        text: "Les forums, les premiers sites, YouTube. Les crews se filment entre elles. En 2009, le « First Swiss Jam » a lieu à Bâle.",
      },
      {
        von: 2010,
        bis: 2016,
        text: "Les crews deviennent des associations. Il y a des jams, des shows, des parcs et des salles à soi. Certaines choses marchent, d’autres pas.",
      },
      {
        von: 2017,
        bis: 2022,
        text: "La fédération internationale de gymnastique veut faire du parkour l’une de ses disciplines. En 2018, la scène fonde sa propre fédération. En 2020, la Confédération intègre le parkour à Jeunesse+Sport.",
      },
      {
        von: 2023,
        bis: 2026,
        text: "Une jeune génération de compétiteurs est là, les pionniers ont passé la quarantaine. Le 20 novembre 2026, Swiss Olympic vote sur l’admission de la fédération.",
      },
    ],
    legende:
      "Un point apparaît l’année à partir de laquelle on peut prouver une trace : une vidéo, une association, un article. Dans beaucoup d’endroits, tout a commencé plus tôt.",
    ende: "La carte n’est pas finie. Il manque ta ville, ton groupe, ton année ?",
    endeKnopf: "Dis-le nous",
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
    text: "À celles et ceux qui ont commencé vers 2000, et à celles et ceux qui gagnent des compétitions aujourd’hui. Dans le film, leurs réponses se suivent. La tienne peut en faire partie.",
  },
  mitmachen: {
    titel: "Participe.",
    intro: "Trois façons. Ce que tu envoies, seuls Ramon et Pierre le voient.",
    wege: {
      video: {
        titel: "Témoignage vidéo",
        text: "Filme-toi avec ton natel et réponds à nos questions.",
      },
      material: {
        titel: "Vieux matériel",
        text: "Vidéos, photos, flyers, captures de forums des années 2000 à 2015.",
      },
      hinweis: {
        titel: "Info",
        text: "Qui manque ? Qu’est-ce qui est faux ? Qui était là en premier ?",
      },
    },
    video: {
      fragenTitel: "Les questions",
      fragen: [
        "Quand et où as-tu vu du parkour pour la première fois ? Qu’est-ce que c’était ?",
        "Où était ton premier spot ? Existe-t-il encore ?",
        "Avec qui as-tu commencé ? Où sont ces personnes aujourd’hui ?",
        "Qu’est-ce que le parkour pour toi, en une phrase ?",
        "La compétition fait-elle partie du parkour ?",
        "Que sais-tu de celles et ceux qui étaient là avant toi ? Ou : que penses-tu de celles et ceux qui sont venus après ?",
        "Qu’est-ce que le parkour t’a coûté, et qu’est-ce qu’il t’a donné ?",
        "Que devrait être le parkour en Suisse dans 20 ans ?",
        "Pour finir : montre-nous le premier mouvement que tu as appris.",
      ],
      tippsTitel: "Pour bien filmer",
      tipps: [
        "Tiens ton natel à l’horizontale.",
        "Un endroit calme, peu de vent, pas de trafic derrière toi.",
        "Reste près du natel. Réécoute un court essai pour vérifier le son.",
        "Au début, dis ton nom, ta ville et depuis quand tu t’entraînes.",
        "1 à 2 minutes par question. Pas besoin de répondre à tout.",
        "Une vidéo par question ou tout d’un coup, comme tu préfères.",
      ],
    },
    material: {
      titel: "Ce qu’on cherche",
      text: "Tout ce qui date de 2000 à 2015 : vidéos, même floues, au natel ou en MiniDV. Photos, flyers de jams et de shows, captures d’écran de forums, anciens sites, articles de journaux.",
      offline: "Mon matériel est encore sur un vieux disque dur, une cassette ou une MiniDV. Contactez-moi.",
      offlineHilfe: "On vient le chercher ou on le numérise, et tu récupères tout.",
    },
    hinweis: {
      titel: "Ton info",
      label: "Ton info",
      platzhalter: "Qui manque ? Qu’est-ce qui est faux ? Qui était là en premier ?",
      fragenTitel: "Si tu veux, donne ton avis. Tout est facultatif.",
      fragen: [
        { schluessel: "wettkampf", frage: "La compétition fait-elle partie du parkour ?" },
        { schluessel: "wer_gebracht", frage: "Qui t’a amené au parkour ?" },
        { schluessel: "zukunft", frage: "Que devrait être le parkour en Suisse dans 20 ans ?" },
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
      zuSehen: "Qui apparaît ?",
      zuSehenPlatzhalter: "Noms ou groupe, si tu les connais",
      beschreibungVideo: "Autre chose à ajouter ?",
      beschreibungMaterial: "Qu’est-ce qu’on y voit ?",
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
        "Oui, vous pouvez utiliser ce matériel pour le documentaire et sa promotion (bande-annonce, réseaux sociaux).",
      punkte: [
        "Vous me citez comme auteur ou autrice.",
        "Les personnes visibles sont d’accord, sinon vous leur demandez avant de montrer quoi que ce soit.",
        "L’original reste chez moi.",
      ],
      unter18: "Moins de 18 ans ? Parles-en d’abord à tes parents.",
      hinweis:
        "Oui, vous pouvez utiliser mon info pour la recherche. Vous ne me citez qu’après m’avoir demandé.",
    },
    senden: "Envoyer",
    sendet: "Envoi en cours …",
    laedt: (n, total) => `Envoi du fichier ${n} sur ${total}`,
    danke: {
      titel: "Merci, c’est bien arrivé.",
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
      upload: (name) => `« ${name} » n’a pas pu être envoyé.`,
      zuViele: "Trop d’essais en peu de temps. Réessaie plus tard.",
    },
  },
  wir: {
    titel: "Qui fait le documentaire",
    ramon:
      "S’entraîne au parkour depuis le début des années 2000, à Münsingen. Il y dirige aujourd’hui Black Panther Athletics.",
    pierre:
      "S’entraîne au parkour depuis 2006, il a commencé en Valais. Il dirige aujourd’hui Natural Athletics en Valais.",
    offenlegung:
      "On fait tous les deux partie de cette histoire. C’est justement pour ça qu’on veut que toute la scène ait la parole.",
    fotoFolgt: "Photo à venir",
  },
  teilen: {
    titel: "Fais passer",
    text: "Tu connais des gens qui étaient là à l’époque et qui ne sont plus dans aucun chat ? Envoie-leur le lien. Il nous manque surtout du matériel de Romandie et du Tessin.",
    knopf: "Partager sur WhatsApp",
    nachricht:
      "Ramon Siegenthaler et Pierre Biege préparent un documentaire sur 25 ans de parkour en Suisse et cherchent des histoires et du vieux matériel : https://laeuft.ch/parkour/fr",
  },
  partner: {
    titel: "Partenaires et soutiens",
    text: "Le documentaire est indépendant. Les communes, fondations et marques qui veulent le soutenir écrivent à Pierre. Qui soutient n’a pas son mot à dire sur le contenu.",
  },
  fuss: {
    datenschutz: `Ce que tu envoies ici est stocké dans un espace privé dans l’UE et n’est visible que par Ramon et Pierre. On l’utilise uniquement pour le documentaire. Pour faire supprimer quelque chose, écris à ${KONTAKT_MAIL}.`,
    impressum: "Mentions légales",
    arbeitstitel: "« À qui appartient le parkour ? » est un titre de travail.",
  },
};

export const TEXTE: Record<Sprache, Texte> = { de, fr };

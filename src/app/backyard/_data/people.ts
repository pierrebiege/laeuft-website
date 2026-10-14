// Die Profilseiten (/squad/<slug>). Jede Aussage stammt aus dem, was die
// Läuferinnen und Läufer selbst geschickt haben, oder aus einer belegten
// Quelle – Nachweis in swiss-backyard-insta/FAKTEN.md. Nichts dazudichten.
// Zitate bleiben in der Sprache, in der sie gesagt wurden.
// Familie, Kinder und Gesundheit kommen hier nicht vor.

/** Wo die Profilbilder liegen: <PEOPLE_PHOTOS>/<slug>/<n>.jpg, ab 1. */
export const PEOPLE_PHOTOS = "/backyard/people";

/** Der Instagram-Kanal des Teams. */
export const TEAM_INSTAGRAM = "swissbackyardultra";

export type Profile = {
  /** Kurzer Satz unter dem Namen. */
  lead: string;
  story: string[];
  quote?: string;
  /** Zusatzzeilen für die Zahlentabelle. */
  facts?: [string, string][];
  instagram?: string;
  /** Breite × Höhe je Bild, in der Reihenfolge der Dateien 1.jpg, 2.jpg … */
  photos: [number, number][];
  /** Woher die Bilder stammen, wenn nicht von der Person selbst geschickt. */
  credit?: string;
  /** Anzeigename, wenn er vom Vornamen abweicht. */
  call?: string;
};

export const PROFILES: Record<string, Profile> = {
  javaheri: {
    lead: "Team captain. Two-time Swiss champion, Everesting world record holder, and most of his backyard training happens on the bike.",
    story: [
      "In 2026 Nima won the Witiker Backyard Ultra with 44 loops. His thirteenth backyard since 2021.",
      "At the 2024 team championship he ran 59 loops, more than anyone else in the Swiss team. His favourite ride is once around Lake Zurich. Race food: porridge and baby food.",
    ],
    quote: "I'm not very good at running. Just found a niche I can do.",
    photos: [[1320, 1178], [1067, 1600], [1320, 1284], [1220, 1600], [1320, 1298], [1241, 1600]],
  },
  tenchio: {
    lead: "In August he finished the Ticino 500: 514 km and 40,000 metres of climbing through the mountains of Ticino.",
    story: [
      "At kilometre 456, in Bigorio, he wrote that his feet hurt, but there was plenty of determination and he wanted to reach Roveredo. He did. Race director Aaron Rezzonico was waiting at the finish.",
      "At the 2024 team championship Matteo ran 58 loops, 388.9 km. His club is GP Leventina.",
    ],
    quote: "Dolore ai piedi, ma tanta determinazione e voglia di arrivare a Roveredo.",
    instagram: "matteotenchio",
    credit: "Photos from @matteotenchio",
    photos: [[1061, 1600], [1151, 1576], [1130, 647], [1092, 692], [1032, 1483]],
  },
  roethlisberger: {
    lead: "Civil engineer from Langenthal. Orienteer for many years.",
    story: [
      "In 2020 Ismael discovered the joy of just running. Soon after he was hooked on 200-mile races, the Bigfoot 200 among them.",
      "His best backyard so far: 40 loops at the Witiker Backyard Ultra 2026, 268 km. He would rather be in the mountains.",
    ],
    quote: "Wichtig dabei: immer ein Lachen im Gesicht.",
    photos: [[1066, 1600], [1068, 1600], [1200, 1600], [1200, 1600], [1200, 1600]],
  },
  schneider: {
    lead: "Qualified with 40 loops. His second team championship for Switzerland.",
    story: ["At the 2024 team championship Marc ran 33 loops, 221.3 km."],
    photos: [],
  },
  lehmann: {
    lead: "Mountain endurance athlete from Geneva. Two-time winner of the PTL, three-time winner of the Eiger 250.",
    story: [
      "The PTL goes around Mont Blanc in teams, about 300 km and 25,000 metres of climbing. Nicolas won it in 2017 and in 2023, the second time with Victor Richard after 99 hours and 33 minutes. The Eiger 250 he won in 2023, 2024 and 2025.",
      "In June 2026 he climbed Mont Blanc four times by four different routes on four consecutive days, unsupported: 162.5 km and 17,671 metres of climbing.",
      "At the 2024 team championship he ran 38 loops, 254.8 km.",
    ],
    instagram: "nic_lehmann",
    credit: "Photos from @nic_lehmann",
    photos: [[1320, 1249], [1320, 1365], [1023, 1600], [1140, 1595], [1320, 1438], [1320, 1506], [1320, 1473], [1320, 1586], [1320, 1501]],
  },
  stamm: {
    lead: "Multisport endurance athlete from Zurich. #ohnimotor",
    story: [
      "Felix came to backyard in 2022, at the Easter Backyard Ultra. His Silver Ticket came from the fifth edition: 37 loops, with a Kilimanjaro in between.",
      "When the track bike is hanging on the wall, he is out running. Baar is his second team championship.",
    ],
    quote: "Believe me, it's not about running.",
    instagram: "feligs_ch",
    photos: [[853, 1280], [738, 663], [715, 736], [1280, 960], [1280, 960]],
  },
  winter: {
    lead: "Road runner and track sprinter, part-time ultrarunner, always curious. Lives in Zurich and coaches 70 athletes.",
    story: [
      "Listening to interviews with Phil Gore, Mona thought: that sounds interesting. Last year she ran her first backyard. Since then she has run 186 yards at nine backyard events in 15 months, four of them with 24 yards or more. Her best is 35.",
      "At the German championships she has won two age-group golds, over 24 hours and 100 km, plus an overall silver and a fourth place. She runs for her head and to be outside, best of all with others. Her favourite thing at a backyard: sleeping.",
    ],
    quote: "Kurt Stenzel taught me what it really means to run with your heart and to always keep a smile on your face.",
    instagram: "laufbasis",
    photos: [[1094, 1600], [913, 1600], [1210, 1600], [608, 1080], [1217, 1600], [1212, 1600], [1038, 1600], [1222, 1600], [1205, 1600]],
  },
  dewolf: {
    lead: "Born in The Hague, grew up in Amsterdam, about fifteen years in Switzerland. Swiss at heart.",
    story: [
      "At school he was the laziest in his class and walked the 4 km run in PE. When he started running about eleven years ago, he could not manage 400 metres in one go. His first marathon was Lucerne 2018, in rain and snow, under five hours. Never again, he said.",
      "68 official marathons and ultras later he ran 33 loops at Witikon in 2026 and qualified for the team. He also hosts the Helvetia Backyard Ultra in Oberwil-Lieli, where the winner is called the LOSER: Last One Standing Endurance Runner.",
    ],
    quote: "Backyard ist eine geschützte Werkstatt. Man kommt jede Runde wieder zurück.",
    instagram: "obsessedrunner",
    credit: "Photos from @obsessedrunner",
    photos: [[1026, 1304], [1041, 1290], [1083, 1292], [1055, 1289], [1320, 1143], [1320, 1137], [986, 1274]],
  },
  biege: {
    lead: "From Valais, the boy from the mountains. Loves going up and down them, and somehow ended up at backyard.",
    story: [
      "His first backyard was Varen in 2025, in barefoot sandals and with a broken finger. More cushioning since. At the Last Soul Ultra 2025 he ran 40 loops, his best; he qualified with 33. At Ultimate Run, with obstacles, he lasted 48 hours.",
      "Baar is his fifth backyard in about a year and a half. Pierre runs every day, makes YouTube films, writes code and runs the movement school Natural Athletics in Upper Valais.",
    ],
    quote: "Heute ist ein richtig guter Tag.",
    instagram: "pierrebiege",
    photos: [[1200, 1600], [1066, 1600], [900, 1600], [1600, 1067], [1200, 1600], [1067, 1600], [1200, 1600], [1066, 1600]],
  },
  schneckenburger: {
    lead: "53, running ultras since 2012.",
    story: [
      "His favourite race is the Tortour de Ruhr. Julian came to backyard through 24- and 48-hour races. His best is 33 loops, at the first backyard in Jegenstorf.",
      "At the 2024 team championship he ran 31 loops.",
    ],
    quote: "Da ich nicht schnell kann, ist Backyard genau das Richtige für mich.",
    photos: [[1066, 1600], [900, 1600], [901, 1600], [720, 960]],
  },
  pestoni: {
    lead: "Web and graphic designer with his own agency. Lives in Zurich, from Ticino.",
    story: [
      "Andrea started running to get fit again. Then things escalated. He has run every single street of Zurich and founded the Zurich running community X Uetli. With Nima and Carsten he organises the X Im!possible Backyard Ultra, on a course he designed himself: 6.7 km and about 380 metres of climbing per loop.",
      "His best is 32 yards, 214.6 km, at Witikon 2025. Baar is his first team championship. Snacks: pasta and junk food.",
    ],
    instagram: "apzurich",
    photos: [[960, 1280], [960, 1280], [960, 1280], [960, 1280], [960, 1280]],
  },
  gervaix: {
    lead: "56, about ten backyards.",
    story: [
      "François has never stopped a backyard because of his body or the clock. Always because he had reached his goal. This time the goal is ambitious: Saturday, Sunday, and why not Monday.",
      "It is his first chance to wear the national team shirt.",
    ],
    quote: "Et très certainement la dernière.",
    photos: [[1200, 1600], [1600, 1066], [700, 467], [1066, 1600], [1200, 1600], [1236, 1266]],
  },
  schwitter: {
    lead: "57, from Binningen near Basel. Running for 39 years, more than 100,000 km.",
    story: [
      "His backyard best is 201 km, 30 loops. For him, still modest. He wants to improve on it massively at the world championship.",
      "At the 2024 team championship he ran 30 loops.",
    ],
    quote: "Laufen bedeutet für mich: abschalten, Grenzen sprengen und den Kopf frei bekommen.",
    instagram: "dschwitter",
    photos: [[752, 1395], [869, 1266], [1123, 1600], [853, 1221], [850, 1135]],
  },
  desteffani: {
    call: "Jogi",
    lead: "Lives in Windisch. Not retired yet, but not long now.",
    story: [
      "He heard about the first Witiker Backyard Ultra the day before, on WhatsApp. It was sold out. Carsten gave him a place anyway, and the next morning he was on the start line. He is the only runner who has started every edition in Witikon.",
      "In a proper race he has never run fewer than 25 loops. His most is 34, at the 2022 team championship, as Nima's assist. He has never broken down on the course. It was always the head.",
    ],
    quote: "Immer war ich der Jüngste, bis ich dann plötzlich der Älteste war.",
    photos: [[1212, 1600], [1600, 1200], [1600, 900], [1600, 900], [1600, 900], [1600, 900], [1600, 900]],
  },
  kopp: {
    lead: "His second team championship for Switzerland. Favourite backyard: Witikon.",
    story: [
      "The hardest part of Witikon, says Sebastian: taking public transport home after 30 loops.",
    ],
    quote: "Die meisten schlaflosen Nächte verbrachte ich zwischen Bad Ragaz und Montreux.",
    photos: [[1067, 1600], [1600, 900], [1204, 1600]],
  },
};

/** Die Leute hinter dem Rennen, die selbst nicht laufen. */
export type StaffProfile = Profile & { first: string; name: string; role: string };

export const STAFF_PROFILES: Record<string, StaffProfile> = {
  bruhnsen: {
    first: "Jan",
    name: "Bruhnsen",
    role: "Race Director",
    lead: "He is not running on Saturday. He makes sure fifteen others can.",
    story: [
      "Jan caught the backyard virus in 2020, at the very first backyard in Switzerland, the 1st Witiker Backyard Ultra. Since then he has run ten backyards (five times Witikon, three times Last Lap, Wyländer, X-Impossible) and as many community runs again.",
      "He has been in the crew at every team championship: helper in 2020 and 2024, co-race director in 2022, race director now. Since 2022 he has organised the Easter Backyard Ultra, because he really wanted a backyard on singletrails. These days he pushes his limits on bikepacking tours.",
    ],
    quote: "Mittlerweile nur noch da für die Community. Einfach eine gute Zeit zusammen haben und die Freundschaften geniessen, welche sich über die Jahre entwickelt haben.",
    facts: [
      ["Backyards run", "10"],
      ["Team championship 2020, 2024", "Helper"],
      ["Team championship 2022", "Co-race director"],
      ["Since 2022", "Easter Backyard Ultra"],
    ],
    photos: [[1600, 1066], [900, 1600], [1600, 1066], [1066, 1600], [1596, 1197], [1600, 1600]],
  },
  drilling: {
    first: "Carsten",
    name: "Drilling",
    role: "Team Manager",
    lead: "Born in Germany, in Switzerland since 2000, Swiss since this year. The reason there is backyard in Switzerland at all.",
    story: [
      "In early 2020 Carsten wrote about the backyard format for Fit for Life, then put it on in Witikon with 43 starters. Jogi was one of them. The Witiker Backyard Ultra has run seven times since, and in 2020 and 2022 Carsten also hosted the team championship.",
      "He ran 31 loops at the Bienwald Backyard in 2021, 32 at the 2022 team championship and 25 in 2024. His heart is in ultra trails: Tor des Géants, Swiss Alps, three times the Eiger Ultra 250, Spartathlon, Western States, Spine Race.",
      "He organises the Lake Züri 100, the Bergweg 100 and the Witiker Track Night, and since 2025 co-hosts the lauf.tisch podcast with Chris Gugelmann.",
    ],
    facts: [
      ["Witiker Backyard Ultra", "Founded 2020"],
      ["Team championship 2020, 2022", "Host"],
      ["Team championship 2022, 2024", "32 and 25 loops"],
      ["Since 2025", "Co-host lauf.tisch"],
    ],
    photos: [[1066, 1600], [750, 500], [1066, 1600], [1200, 1600]],
  },
};

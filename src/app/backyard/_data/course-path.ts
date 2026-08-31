// Erzeugt aus Dorons GPX der WM-Strecke – nicht von Hand aendern.
// Neu erzeugen: python3 scripts/course-from-gpx.py <pfad.gpx> > src/data/course-path.ts
// Grundriss und Marken als [x, y, Meter ab Start].

/** Gemessene Laenge von Runde 1 der Aufzeichnung. Offiziell sind es 6706 m. */
export const COURSE_TOTAL_M = 6517;
export const COURSE_TURN: [number, number, number] = [1000.0, 43.0, 3236];
/** Der Grundriss ist auf seine Hauptachse gedreht; `north` ist die Nordrichtung in Grad. */
export const COURSE_VIEW = { w: 1000, h: 253, north: 209 };
export const COURSE_PATH: [number, number, number][] = [[0.0,0.1,0],[44.6,17.8,130],[65.2,40.6,214],[100.5,43.6,313],[139.2,112.6,528],[205.1,144.7,728],[217.8,174.2,816],[247.3,196.3,916],[314.0,215.6,1105],[309.8,229.8,1154],[366.7,249.0,1319],[426.6,239.6,1483],[581.6,182.4,1935],[673.3,160.4,2192],[739.2,128.2,2391],[770.7,130.2,2479],[830.8,100.2,2662],[861.1,64.1,2792],[897.3,42.5,2907],[942.0,71.7,3054],[1000.0,43.0,3236],[992.1,27.5,3284],[946.8,5.5,3422],[857.8,71.6,3725],[830.2,104.3,3842],[780.0,128.3,3993],[743.3,129.9,4098],[450.2,234.0,4951],[359.5,252.9,5203],[312.5,234.4,5341],[314.5,218.9,5399],[248.8,200.3,5586],[217.2,175.9,5694],[201.9,143.2,5793],[142.7,116.5,5970],[99.2,43.0,6204],[65.9,41.0,6301],[43.8,17.7,6389],[0.0,0.0,6517]];
export const COURSE_KMS: [number, number, number][] = [[276.3,206.5,1],[604.6,175.9,2],[924.1,62.2,3],[780.0,128.3,4],[432.3,239.5,5],[135.3,107.5,6]];

/** Hoehe in Meter ue. M., 121 gleich verteilte Stuetzstellen ueber die Runde. */
export const COURSE_PROFILE: number[] = [447.7,447.3,447.3,447.0,446.6,447.0,446.9,446.0,445.8,445.6,445.2,445.0,444.7,444.1,443.7,443.0,442.6,442.1,441.9,441.7,441.6,442.4,442.0,441.1,440.7,440.3,439.9,439.5,439.0,438.8,438.6,438.0,437.7,437.3,437.4,437.7,436.4,435.6,435.2,434.7,434.0,433.5,433.0,432.9,433.1,433.0,432.6,432.0,431.3,430.7,430.3,429.1,428.5,428.5,428.6,429.0,429.2,429.3,429.1,428.9,429.1,429.4,429.0,428.6,428.4,428.6,428.7,428.8,428.9,429.4,430.5,431.2,431.5,432.1,432.5,432.5,432.5,432.7,432.9,433.6,433.9,434.6,434.9,435.3,436.0,437.1,436.3,436.0,436.3,436.7,437.1,437.4,437.9,438.4,438.8,439.2,440.0,440.5,441.1,441.9,441.1,441.2,441.2,441.7,441.9,442.4,443.1,443.7,444.1,444.5,444.5,444.9,445.2,445.2,445.7,445.9,445.6,445.8,446.2,446.3,446.9];

/** Startpunkt der Aufzeichnung – das Vereinshaus. */
export const COURSE_START = { lat: 47.20304, lon: 8.53973 };
/** Kartenausschnitt um die Strecke, als [west, sued, ost, nord]. */
export const COURSE_BBOX: [number, number, number, number] = [8.5046, 47.1908, 8.5427, 47.2056];

export const COURSE_ELE = {
  high: 447.7,
  low: 428.4,
  /** Hoehenunterschied zwischen Start und Wendepunkt. */
  drop: 19,
  /** Summierter Anstieg ueber die ganze Runde, Schwelle 1 m. */
  gain: 19,
};

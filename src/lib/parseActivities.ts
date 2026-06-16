// Client-seitiges Parsen von Athleten-EIGENEN Aktivitätsdaten (Upload).
// Läuft im Browser — die Rohdaten verlassen das Gerät NICHT; an den Server
// gehen nur die fertigen Wochen-Aggregate. Rechtlich sauber: eigene Daten des
// Athleten, nicht über die Strava-API bezogen.
//
// Unterstützt: .gpx, .tcx (deterministisch) und Strava-Bulk-Export
// (activities.csv bzw. .zip mit activities.csv).

export interface OwnActivity {
  date: string // YYYY-MM-DD (Startdatum)
  sport: string
  distance_m: number
  moving_time_s: number
  elevation_m: number
}

export interface WeeklyInsight {
  week_start: string // Montag, YYYY-MM-DD
  week_end: string // Sonntag
  run_count: number
  total_distance_m: number
  total_moving_time_s: number
  total_elevation_m: number
  avg_pace_s: number | null
  longest_run_m: number
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function mondayOf(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  const day = d.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + diff)
  return isoDate(d)
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return isoDate(d)
}

function isRun(sport: string): boolean {
  const s = (sport || '').toLowerCase()
  return s === '' || s.includes('run') || s.includes('lauf')
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const toRad = (x: number) => (x * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

// ---------- GPX ----------
export function parseGpx(text: string): OwnActivity | null {
  const doc = new DOMParser().parseFromString(text, 'application/xml')
  if (doc.querySelector('parsererror')) return null
  const pts = Array.from(doc.getElementsByTagName('trkpt'))
  if (pts.length === 0) return null

  let dist = 0
  let elevGain = 0
  let prevLat: number | null = null
  let prevLon: number | null = null
  let prevEle: number | null = null
  let firstTime: string | null = null
  let lastTime: string | null = null

  for (const p of pts) {
    const lat = parseFloat(p.getAttribute('lat') || '')
    const lon = parseFloat(p.getAttribute('lon') || '')
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue
    if (prevLat != null && prevLon != null) dist += haversine(prevLat, prevLon, lat, lon)
    prevLat = lat
    prevLon = lon
    const eleEl = p.getElementsByTagName('ele')[0]
    if (eleEl) {
      const ele = parseFloat(eleEl.textContent || '')
      if (Number.isFinite(ele)) {
        if (prevEle != null && ele > prevEle) elevGain += ele - prevEle
        prevEle = ele
      }
    }
    const timeEl = p.getElementsByTagName('time')[0]
    if (timeEl?.textContent) {
      if (!firstTime) firstTime = timeEl.textContent
      lastTime = timeEl.textContent
    }
  }

  const typeEl = doc.getElementsByTagName('type')[0]
  const sport = typeEl?.textContent?.trim() || 'Run'
  const time =
    firstTime && lastTime
      ? Math.max(0, Math.round((new Date(lastTime).getTime() - new Date(firstTime).getTime()) / 1000))
      : 0
  const date = firstTime ? firstTime.slice(0, 10) : null
  if (!date || dist === 0) return null
  return { date, sport, distance_m: Math.round(dist), moving_time_s: time, elevation_m: Math.round(elevGain) }
}

// ---------- TCX ----------
export function parseTcx(text: string): OwnActivity[] {
  const doc = new DOMParser().parseFromString(text, 'application/xml')
  if (doc.querySelector('parsererror')) return []
  const acts = Array.from(doc.getElementsByTagName('Activity'))
  const out: OwnActivity[] = []
  for (const act of acts) {
    const sport = act.getAttribute('Sport') || 'Run'
    const idEl = act.getElementsByTagName('Id')[0]
    const date = idEl?.textContent ? idEl.textContent.slice(0, 10) : null
    let dist = 0
    let time = 0
    for (const lap of Array.from(act.getElementsByTagName('Lap'))) {
      const d = parseFloat(lap.getElementsByTagName('DistanceMeters')[0]?.textContent || '')
      const t = parseFloat(lap.getElementsByTagName('TotalTimeSeconds')[0]?.textContent || '')
      if (Number.isFinite(d)) dist += d
      if (Number.isFinite(t)) time += t
    }
    // Höhenmeter aus Trackpoint-Altitude
    let elevGain = 0
    let prevAlt: number | null = null
    for (const tp of Array.from(act.getElementsByTagName('AltitudeMeters'))) {
      const alt = parseFloat(tp.textContent || '')
      if (!Number.isFinite(alt)) continue
      if (prevAlt != null && alt > prevAlt) elevGain += alt - prevAlt
      prevAlt = alt
    }
    if (date && dist > 0) {
      out.push({ date, sport, distance_m: Math.round(dist), moving_time_s: Math.round(time), elevation_m: Math.round(elevGain) })
    }
  }
  return out
}

// ---------- Strava activities.csv ----------
function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (inQ) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++ } else inQ = false
      } else cur += c
    } else if (c === '"') inQ = true
    else if (c === ',') { out.push(cur); cur = '' }
    else cur += c
  }
  out.push(cur)
  return out
}

export function parseStravaCsv(text: string): OwnActivity[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '')
  if (lines.length < 2) return []
  const header = parseCsvLine(lines[0])
  const idxOf = (name: string) => header.findIndex((h) => h.trim().toLowerCase() === name.toLowerCase())
  const iDate = idxOf('Activity Date')
  const iType = idxOf('Activity Type')
  const iMoving = idxOf('Moving Time')
  const iElev = idxOf('Elevation Gain')
  // "Distance": kommt teils doppelt vor (km früh, Meter später). Meter-Variante
  // (zweites Vorkommen) bevorzugen, sonst erste als km interpretieren.
  const distCols = header.map((h, i) => (h.trim().toLowerCase() === 'distance' ? i : -1)).filter((i) => i >= 0)
  const iDistMeters = distCols.length > 1 ? distCols[1] : -1
  const iDistKm = distCols.length > 0 ? distCols[0] : -1

  const out: OwnActivity[] = []
  for (let r = 1; r < lines.length; r++) {
    const cols = parseCsvLine(lines[r])
    const rawDate = iDate >= 0 ? cols[iDate] : ''
    const d = new Date(rawDate)
    if (isNaN(d.getTime())) continue
    const date = isoDate(d)
    const sport = iType >= 0 ? cols[iType] : 'Run'
    let dist = 0
    if (iDistMeters >= 0 && cols[iDistMeters]) dist = parseFloat(cols[iDistMeters].replace(',', '.'))
    else if (iDistKm >= 0 && cols[iDistKm]) dist = parseFloat(cols[iDistKm].replace(',', '.')) * 1000
    const moving = iMoving >= 0 ? parseFloat((cols[iMoving] || '').replace(',', '.')) : 0
    const elev = iElev >= 0 ? parseFloat((cols[iElev] || '').replace(',', '.')) : 0
    if (!Number.isFinite(dist) || dist <= 0) continue
    out.push({
      date,
      sport,
      distance_m: Math.round(dist),
      moving_time_s: Number.isFinite(moving) ? Math.round(moving) : 0,
      elevation_m: Number.isFinite(elev) ? Math.round(elev) : 0,
    })
  }
  return out
}

// ---------- Aggregation ----------
export function aggregateWeeks(activities: OwnActivity[]): WeeklyInsight[] {
  const runs = activities.filter((a) => isRun(a.sport))
  const weeks = new Map<string, WeeklyInsight>()
  for (const a of runs) {
    const ws = mondayOf(a.date)
    const w =
      weeks.get(ws) ||
      ({ week_start: ws, week_end: addDays(ws, 6), run_count: 0, total_distance_m: 0, total_moving_time_s: 0, total_elevation_m: 0, avg_pace_s: null, longest_run_m: 0 } as WeeklyInsight)
    w.run_count += 1
    w.total_distance_m += a.distance_m
    w.total_moving_time_s += a.moving_time_s
    w.total_elevation_m += a.elevation_m
    if (a.distance_m > w.longest_run_m) w.longest_run_m = a.distance_m
    weeks.set(ws, w)
  }
  const list = Array.from(weeks.values())
  for (const w of list) {
    w.avg_pace_s = w.total_distance_m > 0 ? Math.round(w.total_moving_time_s / (w.total_distance_m / 1000)) : null
  }
  return list.sort((a, b) => (a.week_start < b.week_start ? -1 : 1))
}

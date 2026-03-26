import type {
  InstagramMetrics,
  InstagramPost,
  InstagramAudience,
  DashboardConfig,
  DashboardData,
} from './instagram-types'

// Seeded pseudo-random for stable mock data
function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function randomBetween(rng: () => number, min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

export function generateMockMetrics(days: number): InstagramMetrics[] {
  const rng = seededRandom(42)
  const metrics: InstagramMetrics[] = []
  const now = new Date()
  const baseFollowers = 17200

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dayIndex = days - i
    const followerGrowth = Math.floor(dayIndex * 9.5 + randomBetween(rng, -15, 25))
    const followers = baseFollowers + followerGrowth
    const reach = randomBetween(rng, 1800, 9500)
    const impressions = reach + randomBetween(rng, 500, 3000)
    const engaged = randomBetween(rng, 120, 680)
    const engagementRate = parseFloat((engaged / followers * 100).toFixed(2))

    metrics.push({
      id: `mock-metric-${i}`,
      date: formatDate(date),
      followers_count: followers,
      follows_count: randomBetween(rng, 420, 460),
      media_count: 380 + Math.floor(dayIndex / 3),
      impressions,
      reach,
      profile_views: randomBetween(rng, 30, 180),
      website_clicks: randomBetween(rng, 5, 35),
      accounts_engaged: engaged,
      engagement_rate: engagementRate,
    })
  }

  return metrics
}

const MOCK_CAPTIONS = [
  '50km durch die Alpen. Kein GPS, nur Instinkt. 🏔️',
  'Recovery Day heisst nicht faul sein — es heisst klug sein.',
  'Neues Video: Mein Setup für 100-Meiler. Link in Bio.',
  'Morgens um 4 aufstehen ist kein Opfer, wenn der Trail ruft.',
  'Danke @sponser_sport für den Support! Beste Gels auf dem Markt.',
  'Trainingsblock #3 done. 210km diese Woche.',
  'Die Berge lehren dich Demut. Jedes Mal.',
  'Carousel: 5 Dinge, die ich nach meinem ersten DNF gelernt habe.',
  'Feels.like Gear Test — hält das Zeug, was es verspricht?',
  'Reel: So sieht ein 4000hm Tag aus. Spoiler: Schmerzen.',
  'Ruhiger Lauf am Aletschgletscher. Perspective matters.',
  'DRYLL x Pierre — neue Collab. Coming soon.',
  'Was mich antreibt? Die Stille auf 3000m.',
  'Scott Kinabalu 3 Review — mein ehrliches Fazit nach 500km.',
  'Wintertraining im Wallis. -12°C, aber die Sonne scheint.',
  'Community Run Zürich — 80 Leute sind gekommen!',
  'Nächstes Rennen: UTMB CCC. Wer ist dabei?',
  'Ernährungstipps für lange Distanzen. Swipe für Details.',
  'Behind the scenes: So entsteht ein Trail-Video.',
  'Die Schweiz hat die besten Trails der Welt. Change my mind.',
  'Grateful. 18k — danke für den Support. Jeder einzelne zählt.',
  'Mein Schuhrotation 2026. 5 Paare, 5 Zwecke.',
  'Höhentraining in Zermatt. Die Luft wird dünn.',
  'Reel: Sunrise Run Eiger Trail — Gänsehaut garantiert.',
  'Podcast-Folge mit @feelslike_official — Link in Bio.',
  'Rest day essentials: Foam Roller, gutes Essen, Schlaf.',
  'So plane ich meine Saison. Periodisierung einfach erklärt.',
  'Carousel: Vorher/Nachher — wie sich mein Laufstil verändert hat.',
  'Letzter Long Run vor dem Rennen. Tapering beginnt.',
  'Dankbar für jeden Meter auf diesen Trails. Let\'s go.',
]

const MEDIA_TYPES: InstagramPost['media_type'][] = ['IMAGE', 'REEL', 'CAROUSEL_ALBUM', 'IMAGE', 'REEL', 'REEL', 'IMAGE', 'CAROUSEL_ALBUM', 'REEL', 'IMAGE']

export function generateMockPosts(count: number): InstagramPost[] {
  const rng = seededRandom(123)
  const posts: InstagramPost[] = []
  const now = new Date()

  for (let i = 0; i < count; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - Math.floor(i * 2.8))
    const mediaType = MEDIA_TYPES[i % MEDIA_TYPES.length]
    const isReel = mediaType === 'REEL' || mediaType === 'VIDEO'
    const baseReach = isReel ? randomBetween(rng, 4000, 25000) : randomBetween(rng, 1500, 8000)
    const likes = randomBetween(rng, Math.floor(baseReach * 0.04), Math.floor(baseReach * 0.12))
    const comments = randomBetween(rng, Math.floor(likes * 0.02), Math.floor(likes * 0.08))
    const saves = randomBetween(rng, Math.floor(likes * 0.05), Math.floor(likes * 0.2))
    const shares = randomBetween(rng, Math.floor(likes * 0.01), Math.floor(likes * 0.06))
    const totalEngagement = likes + comments + saves + shares

    posts.push({
      id: `mock-post-${i}`,
      ig_media_id: `17${randomBetween(rng, 100000000, 999999999)}`,
      media_type: mediaType,
      media_url: null,
      thumbnail_url: `/dashboard/mock/post-${(i % 8) + 1}.jpg`,
      permalink: `https://instagram.com/p/mock${i}`,
      caption: MOCK_CAPTIONS[i % MOCK_CAPTIONS.length],
      timestamp: date.toISOString(),
      like_count: likes,
      comments_count: comments,
      saves_count: saves,
      shares_count: shares,
      reach: baseReach,
      impressions: baseReach + randomBetween(rng, 200, 2000),
      plays: isReel ? randomBetween(rng, baseReach, baseReach * 3) : null,
      engagement_rate: parseFloat((totalEngagement / baseReach * 100).toFixed(2)),
    })
  }

  return posts
}

export function generateMockAudience(): DashboardData['audience'] {
  const ageGender: InstagramAudience[] = []
  const today = formatDate(new Date())

  const ageGroups = [
    { range: '13-17', m: 80, f: 60 },
    { range: '18-24', m: 2200, f: 1600 },
    { range: '25-34', m: 4100, f: 2800 },
    { range: '35-44', m: 2600, f: 1500 },
    { range: '45-54', m: 1100, f: 600 },
    { range: '55-64', m: 350, f: 180 },
    { range: '65+', m: 120, f: 60 },
  ]

  for (const ag of ageGroups) {
    ageGender.push({
      id: `mock-ag-m-${ag.range}`,
      date: today,
      metric_type: 'age_gender',
      dimension_key: `M.${ag.range}`,
      value: ag.m,
    })
    ageGender.push({
      id: `mock-ag-f-${ag.range}`,
      date: today,
      metric_type: 'age_gender',
      dimension_key: `F.${ag.range}`,
      value: ag.f,
    })
  }

  const countries: InstagramAudience[] = [
    { dimension_key: 'CH', value: 10400 },
    { dimension_key: 'DE', value: 2900 },
    { dimension_key: 'AT', value: 1500 },
    { dimension_key: 'FR', value: 680 },
    { dimension_key: 'IT', value: 520 },
    { dimension_key: 'US', value: 380 },
    { dimension_key: 'UK', value: 240 },
    { dimension_key: 'NL', value: 180 },
  ].map((c, i) => ({
    id: `mock-country-${i}`,
    date: today,
    metric_type: 'country' as const,
    dimension_key: c.dimension_key,
    value: c.value,
  }))

  const cities: InstagramAudience[] = [
    { dimension_key: 'Zürich', value: 2800 },
    { dimension_key: 'Bern', value: 1900 },
    { dimension_key: 'Basel', value: 1200 },
    { dimension_key: 'Lausanne', value: 850 },
    { dimension_key: 'Luzern', value: 720 },
    { dimension_key: 'München', value: 580 },
    { dimension_key: 'Wien', value: 440 },
    { dimension_key: 'Genf', value: 380 },
    { dimension_key: 'St. Gallen', value: 320 },
    { dimension_key: 'Brig', value: 280 },
  ].map((c, i) => ({
    id: `mock-city-${i}`,
    date: today,
    metric_type: 'city' as const,
    dimension_key: c.dimension_key,
    value: c.value,
  }))

  // Online followers heatmap: day-hour combinations
  const rng = seededRandom(789)
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const onlineFollowers: InstagramAudience[] = []

  for (const day of days) {
    for (let hour = 0; hour < 24; hour++) {
      const isWeekend = day === 'Sat' || day === 'Sun'
      const isPeakMorning = hour >= 6 && hour <= 8
      const isPeakEvening = hour >= 18 && hour <= 21
      const isPeakLunch = hour >= 12 && hour <= 13
      const isNight = hour >= 0 && hour <= 5

      let base = 400
      if (isNight) base = 80
      else if (isPeakMorning) base = isWeekend ? 900 : 1200
      else if (isPeakLunch) base = 1000
      else if (isPeakEvening) base = 1500
      else base = 600

      onlineFollowers.push({
        id: `mock-online-${day}-${hour}`,
        date: today,
        metric_type: 'online_followers',
        dimension_key: `${day}-${hour}`,
        value: base + randomBetween(rng, -100, 200),
      })
    }
  }

  return {
    age_gender: ageGender,
    country: countries,
    city: cities,
    online_followers: onlineFollowers,
  }
}

export function generateMockConfig(): DashboardConfig {
  return {
    id: 'mock-config',
    account_name: '@einrichtiggutertag',
    account_bio: 'Ultrarunner & Content Creator aus der Schweiz. Berge, Trails & echte Geschichten.',
    profile_image_url: '/dashboard/mock/profile.jpg',
    hero_headline: 'Pierre Biege',
    hero_subtext: 'Ultrarunner · Content Creator · 18k Community',
    contact_cta_text: 'Interesse an einer Zusammenarbeit?',
    contact_email: 'pierre@laeuft.ch',
    partner_logos: [
      { name: 'SPONSER', url: 'https://sponser.ch', image_url: '/dashboard/logos/sponser.svg' },
      { name: 'feels.like', url: 'https://feelslike.ch', image_url: '/dashboard/logos/feelslike.svg' },
      { name: 'DRYLL', url: 'https://dryll.ch', image_url: '/dashboard/logos/dryll.svg' },
      { name: 'Scott Sports', url: 'https://scott-sports.com', image_url: '/dashboard/logos/scott.svg' },
    ],
    updated_at: new Date().toISOString(),
  }
}

export function getMockDashboardData(days: number = 90): DashboardData {
  const metrics = generateMockMetrics(days)
  const posts = generateMockPosts(30)
  const audience = generateMockAudience()
  const config = generateMockConfig()

  const latest = metrics[metrics.length - 1]
  const oldest = metrics[0]
  const followerGrowth = latest.followers_count - oldest.followers_count
  const followerGrowthPct = parseFloat((followerGrowth / oldest.followers_count * 100).toFixed(2))
  const avgEngagement = parseFloat(
    (metrics.reduce((sum, m) => sum + (m.engagement_rate || 0), 0) / metrics.length).toFixed(2)
  )
  const avgReach = Math.round(
    metrics.reduce((sum, m) => sum + (m.reach || 0), 0) / metrics.length
  )
  const postsInPeriod = posts.filter(p => {
    const postDate = new Date(p.timestamp)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    return postDate >= cutoff
  }).length
  const weeks = days / 7

  return {
    config,
    metrics,
    posts,
    audience,
    summary: {
      current_followers: latest.followers_count,
      follower_growth: followerGrowth,
      follower_growth_pct: followerGrowthPct,
      avg_engagement_rate: avgEngagement,
      avg_reach: avgReach,
      total_posts_period: postsInPeriod,
      posts_per_week: parseFloat((postsInPeriod / weeks).toFixed(1)),
    },
  }
}

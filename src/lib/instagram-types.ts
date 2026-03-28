export interface InstagramMetrics {
  id: string
  date: string
  followers_count: number
  follows_count: number | null
  media_count: number | null
  impressions: number | null
  reach: number | null
  profile_views: number | null
  website_clicks: number | null
  accounts_engaged: number | null
  engagement_rate: number | null
}

export interface InstagramPost {
  id: string
  ig_media_id: string
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'REEL'
  media_url: string | null
  thumbnail_url: string | null
  permalink: string | null
  caption: string | null
  timestamp: string
  like_count: number
  comments_count: number
  saves_count: number
  shares_count: number
  reach: number
  impressions: number
  plays: number | null
  engagement_rate: number | null
}

export interface InstagramAudience {
  id: string
  date: string
  metric_type: 'age_gender' | 'country' | 'city' | 'online_followers'
  dimension_key: string
  value: number
}

export interface DashboardConfig {
  id: string
  account_name: string
  account_bio: string | null
  profile_image_url: string | null
  hero_headline: string | null
  hero_subtext: string | null
  contact_cta_text: string | null
  contact_email: string | null
  partner_logos: PartnerLogo[]
  updated_at: string
}

export interface PartnerLogo {
  name: string
  url: string
  image_url: string
}

export interface DashboardToken {
  id: string
  token: string
  label: string
  is_active: boolean
  expires_at: string | null
  views_count: number
  last_viewed_at: string | null
  created_at: string
}

export type DateRange = 7 | 14 | 30
export type ContentFilter = 'all' | 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'REEL'

export interface DashboardData {
  config: DashboardConfig
  metrics: InstagramMetrics[]
  posts: InstagramPost[]
  audience: {
    age_gender: InstagramAudience[]
    country: InstagramAudience[]
    city: InstagramAudience[]
    online_followers: InstagramAudience[]
  }
  summary: {
    current_followers: number
    follower_growth: number
    follower_growth_pct: number
    avg_engagement_rate: number
    avg_reach: number
    total_views: number
    total_interactions: number
    total_posts_period: number
    posts_per_week: number
    views_follower_pct: number
    views_non_follower_pct: number
    reached_accounts: number
  }
}

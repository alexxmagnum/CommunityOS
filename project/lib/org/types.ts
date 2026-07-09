export interface TenantOrg {
  id: string
  name: string
  slug: string
  logo_url: string | null
  favicon_url?: string | null
  primary_color: string
  secondary_color?: string
  accent_color: string
  font_family?: string
  theme_mode?: 'light' | 'dark' | 'system'
  city?: string
  hero_image_url?: string | null
  hero_tagline?: string | null
  locale?: string
  currency?: string
  custom_domain?: string | null
  modules?: import('./tenant-modules').OrgModules
  branding?: TenantBranding
}

export interface TenantBranding {
  hero_style?: 'standard' | 'cinematic'
  splash_style?: 'none' | 'reveal' | 'golf'
  hero_image_url?: string | null
  hero_tagline?: string | null
  tagline?: string | null
  hero_eyebrow_kicker?: string | null
  hero_eyebrow?: string | null
  hero_title_lines?: string[]
  hero_title_mobile?: string | null
  hero_highlights?: string[]
  hero_stats?: { value: string; label: string }[]
}

export interface TenantEvent {
  id: string
  title: string
  type: string
  starts_at: string
  available_spots: number | null
  price: number
  cover_image_url: string | null
  location_details: string | null
}

export interface TenantFacility {
  id: string
  name: string
  type: string | null
  sport: { display_name: string | null; name: string } | null
  booking_config: { price_per_hour?: number } | null
}

export interface TenantActivity {
  id: string
  title: string | null
  description: string | null
  created_at: string
}

export interface DiscoveryPrompt {
  id: string
  message: string
  subtext?: string
  href: string
  urgency: 'low' | 'medium' | 'high'
  image_url?: string | null
}

export interface TenantHomeData {
  org: TenantOrg
  events: TenantEvent[]
  facilities: TenantFacility[]
  activities: TenantActivity[]
  stats: { events: number; members: number }
  demoMode: boolean
}

export interface TenantRestaurant {
  id: string
  name: string
  description: string | null
}

export interface MenuCategory {
  id: string
  name: string
  sort_order: number
}

export interface MenuDish {
  id: string
  category_id: string | null
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_chef_special: boolean
  is_vegetarian: boolean
  is_vegan: boolean
  is_gluten_free: boolean
  is_available: boolean
}

export interface TenantMenuData {
  restaurant: TenantRestaurant | null
  categories: MenuCategory[]
  dishes: MenuDish[]
  demoMode: boolean
}

-- NO PEGUES APLICAR.md (es documentacion, no SQL)
-- Ejecuta ESTE archivo en Supabase SQL Editor


-- =============================================================================
-- PASO 1: APPLY_ALL.sql
-- Esquema base + seed IKON
-- =============================================================================

/*
# Community OS Foundation Schema

This migration establishes the core multi-tenant architecture for Community OS - 
a SaaS platform that transforms physical venues into living communities.

## Core Architecture
- Multi-tenant: every table includes organization_id for data isolation
- Row Level Security: authenticated users can only access their organization's data
- Role-based access: platform admins, org admins, and members

## Tables Created

### Platform Management
- `organizations` - Tenants/clients (restaurants, clubs, hotels, etc.)
- `organization_settings` - Branding, configuration per org
- `platform_admins` - Super admin users for the platform

### User Management
- `profiles` - Extended user data linked to auth.users
- `organization_members` - User-organization relationships with roles
- `roles` - Role definitions
- `permissions` - Permission definitions
- `role_permissions` - Role-permission mappings

### Location Management
- `venues` - Physical locations belonging to organizations
- `spaces` - Subdivisions within venues (halls, courts, rooms)

### Restaurant Module
- `restaurants` - Restaurant configurations
- `menu_categories` - Food/drink categories
- `dishes` - Menu items
- `dish_images` - Gallery images for dishes

### Sports Module
- `sports` - Sport type definitions (golf, padel, tennis, etc.)
- `facilities` - Sports facilities within venues
- `time_slots` - Bookable time slots for facilities

### Events & Experiences
- `events` - Events, tournaments, experiences
- `event_categories` - Event categorization
- `event_participants` - User participation in events

### Reservations (Universal Engine)
- `reservations` - Universal reservation table for all bookable items
- `reservation_types` - Type definitions (table, court, event, etc.)

### Community
- `activity_feed` - User activity timeline
- `achievements` - Gamification badges
- `user_achievements` - User achievement records

### Media
- `media_library` - Organization media assets

## Security
- RLS enabled on all tables
- Policies enforce organization isolation
- Role-based access within organizations
- Platform admins have cross-org access

## Notes
1. All tables use UUID primary keys with gen_random_uuid()
2. Soft deletes via deleted_at where appropriate
3. Timestamps: created_at, updated_at on all tables
4. Organization foreign keys cascade on delete for cleanup
5. Indexes on frequently queried columns (organization_id, user_id, status)
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PLATFORM ADMINISTRATION
-- ============================================================================

-- Organizations (Tenants)
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  domain text UNIQUE,
  logo_url text,
  favicon_url text,
  primary_color text DEFAULT '#1a1a2e',
  secondary_color text DEFAULT '#16213e',
  accent_color text DEFAULT '#0f3460',
  font_family text DEFAULT 'Inter',
  theme_mode text DEFAULT 'light' CHECK (theme_mode IN ('light', 'dark', 'system')),
  is_active boolean DEFAULT true,
  subscription_tier text DEFAULT 'trial' CHECK (subscription_tier IN ('trial', 'starter', 'professional', 'enterprise')),
  subscription_ends_at timestamptz,
  modules jsonb DEFAULT '{}', -- Enabled modules: { "restaurant": true, "sports": true, ... }
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Organization Settings (Per-tenant configuration)
CREATE TABLE IF NOT EXISTS organization_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  key text NOT NULL,
  value jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, key)
);

-- Platform Admins (Super Admins)
CREATE TABLE IF NOT EXISTS platform_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('owner', 'admin', 'support')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- ============================================================================
-- USER MANAGEMENT
-- ============================================================================

-- Profiles (Extended user data)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  phone text,
  bio text,
  preferences jsonb DEFAULT '{}', -- User preferences
  metadata jsonb DEFAULT '{}', -- Flexible metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Organization Members (User-Org relationships)
CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid, -- Will reference roles table
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
  joined_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Roles
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  display_name text,
  description text,
  is_system boolean DEFAULT false, -- System roles cannot be deleted
  permissions jsonb DEFAULT '[]', -- Array of permission strings
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, name)
);

-- Insert default system roles
INSERT INTO roles (id, organization_id, name, display_name, description, is_system, permissions)
VALUES 
  (gen_random_uuid(), NULL, 'org_owner', 'Organization Owner', 'Full access to organization', true, '["*"]'),
  (gen_random_uuid(), NULL, 'org_admin', 'Organization Admin', 'Administrative access', true, '["manage_users", "manage_settings", "manage_content", "manage_reservations", "manage_events", "view_analytics"]'),
  (gen_random_uuid(), NULL, 'org_member', 'Member', 'Standard member access', true, '["make_reservations", "join_events", "view_content"]')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- LOCATION MANAGEMENT
-- ============================================================================

-- Venues (Physical locations)
CREATE TABLE IF NOT EXISTS venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  type text DEFAULT 'main' CHECK (type IN ('main', 'branch', 'facility')),
  address text,
  city text,
  country text,
  postal_code text,
  latitude numeric,
  longitude numeric,
  cover_image_url text,
  gallery jsonb DEFAULT '[]',
  operating_hours jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Spaces (Subdivisions within venues)
CREATE TABLE IF NOT EXISTS spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  venue_id uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('restaurant', 'terrace', 'private_room', 'court', 'field', 'hall', 'meeting_room', 'event_space', 'other')),
  capacity integer,
  amenities jsonb DEFAULT '[]',
  images jsonb DEFAULT '[]',
  is_bookable boolean DEFAULT true,
  booking_config jsonb DEFAULT '{}', -- Booking rules, durations, etc.
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- RESTAURANT MODULE
-- ============================================================================

-- Restaurants
CREATE TABLE IF NOT EXISTS restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  venue_id uuid REFERENCES venues(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  cuisine_type text,
  cover_image_url text,
  gallery jsonb DEFAULT '[]',
  opening_hours jsonb DEFAULT '{}',
  reservation_config jsonb DEFAULT '{}', -- Min/max guests, time slots, etc.
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Menu Categories
CREATE TABLE IF NOT EXISTS menu_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  icon text,
  image_url text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Dishes (Menu Items)
CREATE TABLE IF NOT EXISTS dishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category_id uuid REFERENCES menu_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  image_url text,
  gallery jsonb DEFAULT '[]',
  ingredients jsonb DEFAULT '[]',
  allergens jsonb DEFAULT '[]',
  nutritional_info jsonb DEFAULT '{}',
  is_chef_special boolean DEFAULT false,
  is_vegetarian boolean DEFAULT false,
  is_vegan boolean DEFAULT false,
  is_gluten_free boolean DEFAULT false,
  is_available boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- SPORTS MODULE
-- ============================================================================

-- Sports Definitions
CREATE TABLE IF NOT EXISTS sports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text,
  description text,
  icon text,
  image_url text,
  default_rules jsonb DEFAULT '{}',
  court_types jsonb DEFAULT '[]', -- e.g. ["indoor", "outdoor"]
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Insert common sports
INSERT INTO sports (id, name, display_name, icon) VALUES
  (gen_random_uuid(), 'golf', 'Golf', 'flag'),
  (gen_random_uuid(), 'padel', 'Padel', 'circle-dot'),
  (gen_random_uuid(), 'tennis', 'Tennis', 'circle'),
  (gen_random_uuid(), 'football', 'Football', 'circle'),
  (gen_random_uuid(), 'billiards', 'Billiards', 'circle'),
  (gen_random_uuid(), 'pickleball', 'Pickleball', 'circle'),
  (gen_random_uuid(), 'pitch_and_putt', 'Pitch & Putt', 'flag')
ON CONFLICT DO NOTHING;

-- Sports Facilities
CREATE TABLE IF NOT EXISTS facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  venue_id uuid REFERENCES venues(id) ON DELETE SET NULL,
  sport_id uuid REFERENCES sports(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  type text, -- e.g. "indoor", "outdoor"
  amenities jsonb DEFAULT '[]',
  images jsonb DEFAULT '[]',
  booking_config jsonb DEFAULT '{}', -- Pricing, duration, availability
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Time Slots
CREATE TABLE IF NOT EXISTS time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  facility_id uuid NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text DEFAULT 'available' CHECK (status IN ('available', 'booked', 'blocked', 'maintenance')),
  price numeric(10,2),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- EVENTS & EXPERIENCES
-- ============================================================================

-- Event Categories
CREATE TABLE IF NOT EXISTS event_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  icon text,
  color text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  venue_id uuid REFERENCES venues(id) ON DELETE SET NULL,
  category_id uuid REFERENCES event_categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'event' CHECK (type IN ('event', 'tournament', 'workshop', 'social', 'competition', 'experience')),
  cover_image_url text,
  gallery jsonb DEFAULT '[]',
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  capacity integer,
  available_spots integer,
  price numeric(10,2) DEFAULT 0,
  currency text DEFAULT 'EUR',
  is_public boolean DEFAULT true,
  registration_required boolean DEFAULT true,
  registration_opens_at timestamptz,
  registration_closes_at timestamptz,
  location_details text,
  tags jsonb DEFAULT '[]',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
  metadata jsonb DEFAULT '{}', -- Tournament format, rules, etc.
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Event Participants
CREATE TABLE IF NOT EXISTS event_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'waitlisted', 'cancelled', 'attended', 'no_show')),
  registered_at timestamptz DEFAULT now(),
  confirmed_at timestamptz,
  checked_in_at timestamptz,
  notes text,
  metadata jsonb DEFAULT '{}',
  UNIQUE(event_id, user_id)
);

-- ============================================================================
-- RESERVATIONS (Universal Engine)
-- ============================================================================

-- Reservations
CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reservation_type text NOT NULL CHECK (reservation_type IN ('restaurant', 'facility', 'event', 'space', 'experience')),
  reference_code text UNIQUE NOT NULL,
  
  -- Polymorphic reference to the bookable item
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE SET NULL,
  facility_id uuid REFERENCES facilities(id) ON DELETE SET NULL,
  space_id uuid REFERENCES spaces(id) ON DELETE SET NULL,
  event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  
  -- Date/Time
  reserved_date date,
  start_time timestamptz,
  end_time timestamptz,
  
  -- Party details
  party_size integer DEFAULT 1,
  guest_name text,
  guest_email text,
  guest_phone text,
  
  -- Status
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  
  -- Pricing
  total_amount numeric(10,2) DEFAULT 0,
  currency text DEFAULT 'EUR',
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'partial')),
  
  -- Additional info
  special_requests text,
  internal_notes text,
  metadata jsonb DEFAULT '{}',
  
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- TOURNAMENT ENGINE
-- ============================================================================

-- Tournaments (extends events)
CREATE TABLE IF NOT EXISTS tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  sport_id uuid REFERENCES sports(id) ON DELETE SET NULL,
  format text NOT NULL CHECK (format IN ('single_elimination', 'double_elimination', 'round_robin', 'league', 'swiss', 'americano', 'groups_playoffs')),
  max_teams integer,
  registration_type text DEFAULT 'individual' CHECK (registration_type IN ('individual', 'team')),
  min_team_size integer DEFAULT 1,
  max_team_size integer DEFAULT 1,
  seeding_method text DEFAULT 'random' CHECK (seeding_method IN ('random', 'ranking', 'manual')),
  rules jsonb DEFAULT '{}',
  prize_pool jsonb DEFAULT '{}',
  status text DEFAULT 'registration' CHECK (status IN ('registration', 'check_in', 'in_progress', 'completed', 'cancelled')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tournament Participants/Teams
CREATE TABLE IF NOT EXISTS tournament_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  team_name text,
  captain_id uuid REFERENCES auth.users(id), -- For team events
  members jsonb DEFAULT '[]', -- Array of user_ids or member info
  seed integer,
  rank integer,
  is_checked_in boolean DEFAULT false,
  checked_in_at timestamptz,
  status text DEFAULT 'registered' CHECK (status IN ('registered', 'checked_in', 'eliminated', 'winner', 'cancelled')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(tournament_id, captain_id)
);

-- Tournament Matches
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round integer NOT NULL,
  match_number integer NOT NULL,
  bracket text DEFAULT 'main' CHECK (bracket IN ('main', 'losers', 'consolation')),
  
  -- Participants
  participant1_id uuid REFERENCES tournament_participants(id) ON DELETE SET NULL,
  participant2_id uuid REFERENCES tournament_participants(id) ON DELETE SET NULL,
  
  -- Scheduling
  facility_id uuid REFERENCES facilities(id) ON DELETE SET NULL,
  scheduled_time timestamptz,
  estimated_duration_minutes integer,
  
  -- Results
  score jsonb DEFAULT '{}', -- e.g. {"sets": [{"p1": 6, "p2": 4}, {"p1": 4, "p2": 6}, {"p1": 7, "p2": 5}]}
  winner_id uuid REFERENCES tournament_participants(id) ON DELETE SET NULL,
  loser_id uuid REFERENCES tournament_participants(id) ON DELETE SET NULL,
  
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'walkover')),
  
  notes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

-- Rankings
CREATE TABLE IF NOT EXISTS rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sport_id uuid REFERENCES sports(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  points integer DEFAULT 0,
  wins integer DEFAULT 0,
  losses integer DEFAULT 0,
  draws integer DEFAULT 0,
  rank integer,
  metadata jsonb DEFAULT '{}',
  period text DEFAULT 'all_time' CHECK (period IN ('weekly', 'monthly', 'yearly', 'all_time')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, sport_id, user_id, period)
);

-- ============================================================================
-- COMMUNITY MODULE
-- ============================================================================

-- Activity Feed
CREATE TABLE IF NOT EXISTS activity_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  activity_type text NOT NULL, -- e.g. 'reservation', 'event_join', 'tournament_win'
  title text,
  description text,
  reference_type text, -- e.g. 'reservation', 'event', 'tournament'
  reference_id uuid,
  metadata jsonb DEFAULT '{}',
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE, -- NULL = platform-wide
  name text NOT NULL,
  display_name text,
  description text,
  icon text,
  image_url text,
  criteria jsonb NOT NULL, -- Conditions to earn achievement
  points integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, name)
);

-- User Achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}',
  UNIQUE(user_id, achievement_id)
);

-- ============================================================================
-- MEDIA LIBRARY
-- ============================================================================

-- Media Library
CREATE TABLE IF NOT EXISTS media_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  filename text NOT NULL,
  original_filename text,
  mime_type text,
  size integer,
  url text NOT NULL,
  thumbnail_url text,
  alt_text text,
  title text,
  tags jsonb DEFAULT '[]',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON organizations(is_active);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_organization_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_status ON organization_members(status);

CREATE INDEX IF NOT EXISTS idx_venues_organization ON venues(organization_id);

CREATE INDEX IF NOT EXISTS idx_spaces_organization ON spaces(organization_id);
CREATE INDEX IF NOT EXISTS idx_spaces_venue ON spaces(venue_id);
CREATE INDEX IF NOT EXISTS idx_spaces_type ON spaces(type);

CREATE INDEX IF NOT EXISTS idx_restaurants_organization ON restaurants(organization_id);

CREATE INDEX IF NOT EXISTS idx_dishes_organization ON dishes(organization_id);
CREATE INDEX IF NOT EXISTS idx_dishes_category ON dishes(category_id);

CREATE INDEX IF NOT EXISTS idx_facilities_organization ON facilities(organization_id);
CREATE INDEX IF NOT EXISTS idx_facilities_sport ON facilities(sport_id);

CREATE INDEX IF NOT EXISTS idx_events_organization ON events(organization_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_starts_at ON events(starts_at);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);

CREATE INDEX IF NOT EXISTS idx_reservations_organization ON reservations(organization_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reserved_date);
CREATE INDEX IF NOT EXISTS idx_reservations_code ON reservations(reference_code);

CREATE INDEX IF NOT EXISTS idx_tournaments_organization ON tournaments(organization_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);

CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);

CREATE INDEX IF NOT EXISTS idx_activity_feed_organization ON activity_feed(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_user ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created ON activity_feed(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rankings_organization ON rankings(organization_id);
CREATE INDEX IF NOT EXISTS idx_rankings_sport ON rankings(sport_id);

CREATE INDEX IF NOT EXISTS idx_media_library_organization ON media_library(organization_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - PLATFORM ADMINS (Cross-org access)
-- ============================================================================

-- Platform admins have full access to all tables
DROP POLICY IF EXISTS "platform_admins_full_access" ON organizations;
CREATE POLICY "platform_admins_full_access" ON organizations FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "platform_admins_settings_full" ON organization_settings;
CREATE POLICY "platform_admins_settings_full" ON organization_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

-- ============================================================================
-- RLS POLICIES - ORGANIZATIONS (Members can read their org)
-- ============================================================================

DROP POLICY IF EXISTS "org_members_read" ON organizations;
CREATE POLICY "org_members_read" ON organizations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members 
      WHERE organization_id = organizations.id 
      AND user_id = auth.uid()
      AND status = 'active'
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "org_members_settings_read" ON organization_settings;
CREATE POLICY "org_members_settings_read" ON organization_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN organizations o ON o.id = om.organization_id
      WHERE om.organization_id = organization_settings.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

-- Organization admins can update settings
DROP POLICY IF EXISTS "org_admins_settings_write" ON organization_settings;
CREATE POLICY "org_admins_settings_write" ON organization_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members 
      WHERE organization_id = organization_settings.organization_id 
      AND user_id = auth.uid()
      AND status = 'active'
      AND role_id IN (SELECT id FROM roles WHERE name IN ('org_owner', 'org_admin'))
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members 
      WHERE organization_id = organization_settings.organization_id 
      AND user_id = auth.uid()
      AND status = 'active'
      AND role_id IN (SELECT id FROM roles WHERE name IN ('org_owner', 'org_admin'))
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

-- ============================================================================
-- RLS POLICIES - PROFILES (Users own their profile)
-- ============================================================================

DROP POLICY IF EXISTS "profiles_read_own" ON profiles;
CREATE POLICY "profiles_read_own" ON profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Platform admins can read all profiles
DROP POLICY IF EXISTS "platform_admins_profiles" ON profiles;
CREATE POLICY "platform_admins_profiles" ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

-- Org members can see other member profiles within their org
DROP POLICY IF EXISTS "org_members_profiles" ON profiles;
CREATE POLICY "org_members_profiles" ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om1
      JOIN organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
      AND om2.user_id = profiles.user_id
      AND om1.status = 'active'
      AND om2.status = 'active'
    )
  );

-- ============================================================================
-- RLS POLICIES - ORGANIZATION MEMBERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_org_admin_of(org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members om
    JOIN roles r ON r.id = om.role_id
    WHERE om.organization_id = org_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
  );
$$;

REVOKE ALL ON FUNCTION public.is_org_admin_of(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_org_admin_of(uuid) TO authenticated;

DROP POLICY IF EXISTS "org_members_read_own_org" ON organization_members;
CREATE POLICY "org_members_read_own_org" ON organization_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
    OR public.is_org_admin_of(organization_id)
  );

-- Org admins can manage members (sin recursión RLS)
DROP POLICY IF EXISTS "org_admins_manage_members" ON organization_members;
CREATE POLICY "org_admins_manage_members" ON organization_members FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
    OR public.is_org_admin_of(organization_id)
    OR user_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
    OR public.is_org_admin_of(organization_id)
    OR user_id = auth.uid()
  );

-- Users can insert themselves when joining
DROP POLICY IF EXISTS "users_join_org" ON organization_members;
CREATE POLICY "users_join_org" ON organization_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own membership
DROP POLICY IF EXISTS "users_update_own_membership" ON organization_members;
CREATE POLICY "users_update_own_membership" ON organization_members FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- RLS POLICIES - VENUES & SPACES
-- ============================================================================

DROP POLICY IF EXISTS "venues_read_org" ON venues;
CREATE POLICY "venues_read_org" ON venues FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "venues_write_org_admin" ON venues;
CREATE POLICY "venues_write_org_admin" ON venues FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = venues.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = venues.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "spaces_read_org" ON spaces;
CREATE POLICY "spaces_read_org" ON spaces FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "spaces_write_org_admin" ON spaces;
CREATE POLICY "spaces_write_org_admin" ON spaces FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = spaces.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = spaces.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

-- ============================================================================
-- RLS POLICIES - RESTAURANTS & MENUS
-- ============================================================================

DROP POLICY IF EXISTS "restaurants_read_org" ON restaurants;
CREATE POLICY "restaurants_read_org" ON restaurants FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "restaurants_write_org_admin" ON restaurants;
CREATE POLICY "restaurants_write_org_admin" ON restaurants FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = restaurants.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = restaurants.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "menu_categories_read_org" ON menu_categories;
CREATE POLICY "menu_categories_read_org" ON menu_categories FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "menu_categories_write_org_admin" ON menu_categories;
CREATE POLICY "menu_categories_write_org_admin" ON menu_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = menu_categories.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = menu_categories.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "dishes_read_org" ON dishes;
CREATE POLICY "dishes_read_org" ON dishes FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "dishes_write_org_admin" ON dishes;
CREATE POLICY "dishes_write_org_admin" ON dishes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = dishes.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = dishes.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

-- ============================================================================
-- RLS POLICIES - SPORTS & FACILITIES
-- ============================================================================

-- Sports are public/read-only
DROP POLICY IF EXISTS "sports_read_all" ON sports;
CREATE POLICY "sports_read_all" ON sports FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "sports_write_admin" ON sports;
CREATE POLICY "sports_write_admin" ON sports FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "facilities_read_org" ON facilities;
CREATE POLICY "facilities_read_org" ON facilities FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "facilities_write_org_admin" ON facilities;
CREATE POLICY "facilities_write_org_admin" ON facilities FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = facilities.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = facilities.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "time_slots_read_org" ON time_slots;
CREATE POLICY "time_slots_read_org" ON time_slots FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "time_slots_write_org_admin" ON time_slots;
CREATE POLICY "time_slots_write_org_admin" ON time_slots FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = time_slots.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = time_slots.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

-- ============================================================================
-- RLS POLICIES - EVENTS
-- ============================================================================

DROP POLICY IF EXISTS "events_read_org" ON events;
CREATE POLICY "events_read_org" ON events FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "events_write_org_admin" ON events;
CREATE POLICY "events_write_org_admin" ON events FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = events.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = events.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "event_participants_read_org" ON event_participants;
CREATE POLICY "event_participants_read_org" ON event_participants FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "event_participants_insert_own" ON event_participants;
CREATE POLICY "event_participants_insert_own" ON event_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = event_participants.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "event_categories_read_org" ON event_categories;
CREATE POLICY "event_categories_read_org" ON event_categories FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "event_categories_write_org_admin" ON event_categories;
CREATE POLICY "event_categories_write_org_admin" ON event_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = event_categories.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = event_categories.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

-- ============================================================================
-- RLS POLICIES - RESERVATIONS
-- ============================================================================

DROP POLICY IF EXISTS "reservations_read_own" ON reservations;
CREATE POLICY "reservations_read_own" ON reservations FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "reservations_insert_own" ON reservations;
CREATE POLICY "reservations_insert_own" ON reservations FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = reservations.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "reservations_update_org_admin" ON reservations;
CREATE POLICY "reservations_update_org_admin" ON reservations FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

-- ============================================================================
-- RLS POLICIES - TOURNAMENTS
-- ============================================================================

DROP POLICY IF EXISTS "tournaments_read_org" ON tournaments;
CREATE POLICY "tournaments_read_org" ON tournaments FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "tournaments_write_org_admin" ON tournaments;
CREATE POLICY "tournaments_write_org_admin" ON tournaments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = tournaments.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = tournaments.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "tournament_participants_read_org" ON tournament_participants;
CREATE POLICY "tournament_participants_read_org" ON tournament_participants FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "tournament_participants_write_org" ON tournament_participants;
CREATE POLICY "tournament_participants_write_org" ON tournament_participants FOR ALL
  TO authenticated
  USING (
    captain_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = tournament_participants.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  )
  WITH CHECK (
    captain_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = tournament_participants.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "matches_read_org" ON matches;
CREATE POLICY "matches_read_org" ON matches FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "matches_write_org_admin" ON matches;
CREATE POLICY "matches_write_org_admin" ON matches FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = matches.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = matches.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "rankings_read_org" ON rankings;
CREATE POLICY "rankings_read_org" ON rankings FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "rankings_write_org_admin" ON rankings;
CREATE POLICY "rankings_write_org_admin" ON rankings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = rankings.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = rankings.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

-- ============================================================================
-- RLS POLICIES - COMMUNITY
-- ============================================================================

DROP POLICY IF EXISTS "activity_feed_read_org" ON activity_feed;
CREATE POLICY "activity_feed_read_org" ON activity_feed FOR SELECT
  TO authenticated
  USING (
    (organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND status = 'active'
    ) AND is_public = true)
    OR user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "activity_feed_insert_own" ON activity_feed;
CREATE POLICY "activity_feed_insert_own" ON activity_feed FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "achievements_read_all" ON achievements;
CREATE POLICY "achievements_read_all" ON achievements FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "achievements_write_admin" ON achievements;
CREATE POLICY "achievements_write_admin" ON achievements FOR ALL
  TO authenticated
  USING (
    organization_id IS NULL AND EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = achievements.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
  )
  WITH CHECK (
    organization_id IS NULL AND EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = achievements.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
  );

DROP POLICY IF EXISTS "user_achievements_read_own" ON user_achievements;
CREATE POLICY "user_achievements_read_own" ON user_achievements FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "user_achievements_insert_system" ON user_achievements;
CREATE POLICY "user_achievements_insert_system" ON user_achievements FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

-- ============================================================================
-- RLS POLICIES - MEDIA LIBRARY
-- ============================================================================

DROP POLICY IF EXISTS "media_library_read_org" ON media_library;
CREATE POLICY "media_library_read_org" ON media_library FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "media_library_write_org" ON media_library;
CREATE POLICY "media_library_write_org" ON media_library FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = TG_TABLE_SCHEMA
      AND table_name = TG_TABLE_NAME
      AND column_name = 'updated_at'
  ) THEN
    NEW.updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
DO $$
DECLARE
  tbl record;
BEGIN
  FOR tbl IN 
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name NOT IN ('platform_admins', 'roles', 'sports', 'activity_feed', 'event_participants', 'tournament_participants', 'matches', 'user_achievements')
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON %s', tbl.table_name, tbl.table_name);
    EXECUTE format('CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', tbl.table_name, tbl.table_name);
  END LOOP;
END $$;

-- Function to generate reservation reference codes
CREATE OR REPLACE FUNCTION generate_reservation_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;
-- Fix critical RLS gaps and auto-create profiles on signup

-- ============================================================================
-- PROFILES: auto-create on signup + allow insert own
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- PLATFORM_ADMINS: allow users to read their own admin record
-- ============================================================================

DROP POLICY IF EXISTS "platform_admins_read_own" ON platform_admins;
CREATE POLICY "platform_admins_read_own" ON platform_admins FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- ROLES: readable by all authenticated users (needed for joins & admin checks)
-- ============================================================================

DROP POLICY IF EXISTS "roles_read_authenticated" ON roles;
CREATE POLICY "roles_read_authenticated" ON roles FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- ORGANIZATIONS: org admins can update their org (branding)
-- ============================================================================

DROP POLICY IF EXISTS "org_admins_update" ON organizations;
CREATE POLICY "org_admins_update" ON organizations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = organizations.id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = organizations.id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

-- ============================================================================
-- ORGANIZATION_MEMBERS: restrict self-join to pending invitations only
-- ============================================================================

DROP POLICY IF EXISTS "users_join_org" ON organization_members;
CREATE POLICY "users_join_org" ON organization_members FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'pending'
  );

-- ============================================================================
-- EVENTS: allow anonymous/public read of published public events
-- ============================================================================

DROP POLICY IF EXISTS "events_public_read" ON events;
CREATE POLICY "events_public_read" ON events FOR SELECT
  TO anon, authenticated
  USING (
    status = 'published'
    AND is_public = true
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "organizations_public_read" ON organizations;
CREATE POLICY "organizations_public_read" ON organizations FOR SELECT
  TO anon, authenticated
  USING (is_active = true);
-- IKON seed data, reservations trigger, activity public read, event registration

-- Reservation reference code on insert
CREATE OR REPLACE FUNCTION public.set_reservation_reference_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reference_code IS NULL OR NEW.reference_code = '' THEN
    NEW.reference_code := generate_reservation_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reservations_set_code ON reservations;
CREATE TRIGGER reservations_set_code
  BEFORE INSERT ON reservations
  FOR EACH ROW EXECUTE FUNCTION public.set_reservation_reference_code();

-- Public activity feed for active orgs
DROP POLICY IF EXISTS "activity_feed_public_read" ON activity_feed;
CREATE POLICY "activity_feed_public_read" ON activity_feed FOR SELECT
  TO anon, authenticated
  USING (is_public = true);

-- Members can register for events
DROP POLICY IF EXISTS "event_participants_update_own" ON event_participants;
CREATE POLICY "event_participants_update_own" ON event_participants FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Members create own reservations
DROP POLICY IF EXISTS "reservations_update_own" ON reservations;
CREATE POLICY "reservations_update_own" ON reservations FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Anon can read facilities for public orgs (availability display)
DROP POLICY IF EXISTS "facilities_public_read" ON facilities;
CREATE POLICY "facilities_public_read" ON facilities FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND organization_id IN (SELECT id FROM organizations WHERE is_active = true)
  );

-- ============================================================================
-- IKON â€” first customer seed
-- ============================================================================

INSERT INTO organizations (
  name, slug, primary_color, secondary_color, accent_color,
  subscription_tier, modules, is_active
) VALUES (
  'IKON',
  'ikon',
  '#1a1a2e',
  '#16213e',
  '#c9a962',
  'professional',
  '{"restaurant": true, "sports": true, "events": true, "tournaments": true}'::jsonb,
  true
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  accent_color = EXCLUDED.accent_color,
  modules = EXCLUDED.modules;

-- Venue
INSERT INTO venues (organization_id, name, description, type, city, country, is_active)
SELECT o.id, 'IKON Main Campus', 'Golf, padel, dining and events', 'main', 'Marbella', 'Spain', true
FROM organizations o WHERE o.slug = 'ikon'
AND NOT EXISTS (
  SELECT 1 FROM venues v WHERE v.organization_id = o.id AND v.name = 'IKON Main Campus'
);

-- Restaurant
INSERT INTO restaurants (organization_id, name, description, cuisine_type, is_active)
SELECT o.id, 'IKON Terrace', 'Gastronomía mediterránea con música en vivo', 'Mediterránea', true
FROM organizations o WHERE o.slug = 'ikon'
AND NOT EXISTS (
  SELECT 1 FROM restaurants r WHERE r.organization_id = o.id AND r.name = 'IKON Terrace'
);

-- Menu categories
INSERT INTO menu_categories (organization_id, restaurant_id, name, sort_order, is_active)
SELECT o.id, r.id, cat.name, cat.sort_order, true
FROM organizations o
JOIN restaurants r ON r.organization_id = o.id AND r.name = 'IKON Terrace'
CROSS JOIN (VALUES ('Entrantes', 1), ('Principales', 2), ('Postres', 3), ('Bebidas', 4)) AS cat(name, sort_order)
WHERE o.slug = 'ikon'
AND NOT EXISTS (
  SELECT 1 FROM menu_categories mc
  WHERE mc.organization_id = o.id AND mc.name = cat.name
);

-- Sample dishes (skip if already seeded)
DO $$
DECLARE
  org_uuid uuid;
  cat_starters uuid;
  cat_mains uuid;
  cat_desserts uuid;
  cat_drinks uuid;
BEGIN
  SELECT id INTO org_uuid FROM organizations WHERE slug = 'ikon';
  IF org_uuid IS NULL THEN RETURN; END IF;

  SELECT id INTO cat_starters FROM menu_categories WHERE organization_id = org_uuid AND name IN ('Entrantes', 'Starters') ORDER BY CASE WHEN name = 'Entrantes' THEN 0 ELSE 1 END LIMIT 1;
  SELECT id INTO cat_mains FROM menu_categories WHERE organization_id = org_uuid AND name IN ('Principales', 'Mains') ORDER BY CASE WHEN name = 'Principales' THEN 0 ELSE 1 END LIMIT 1;
  SELECT id INTO cat_desserts FROM menu_categories WHERE organization_id = org_uuid AND name IN ('Postres', 'Desserts') ORDER BY CASE WHEN name = 'Postres' THEN 0 ELSE 1 END LIMIT 1;
  SELECT id INTO cat_drinks FROM menu_categories WHERE organization_id = org_uuid AND name IN ('Bebidas', 'Drinks') ORDER BY CASE WHEN name = 'Bebidas' THEN 0 ELSE 1 END LIMIT 1;

  IF NOT EXISTS (SELECT 1 FROM dishes WHERE organization_id = org_uuid AND name = 'Gambas al ajillo') THEN
    INSERT INTO dishes (organization_id, category_id, name, description, price, is_available)
    VALUES
      (org_uuid, cat_starters, 'Gambas al ajillo', 'Gambas frescas en aceite de ajo', 14.50, true),
      (org_uuid, cat_starters, 'Ensalada de burrata', 'Tomates heirloom, albahaca y aceite de oliva virgen', 12.00, true),
      (org_uuid, cat_mains, 'Lubina a la brasa', 'Verduras de temporada y emulsión cítrica', 26.00, true),
      (org_uuid, cat_mains, 'Burger IKON', 'Wagyu, mayo de trufa y pan brioche', 22.00, true),
      (org_uuid, cat_desserts, 'Tiramisú', 'Receta clásica de la casa', 9.00, true),
      (org_uuid, cat_drinks, 'Copa de vino de la casa', 'Tinto o blanco', 6.50, true);
  END IF;
END $$;

-- Facilities (sports)
INSERT INTO facilities (organization_id, sport_id, name, description, type, is_active, booking_config)
SELECT o.id, s.id, f.name, f.description, f.type, true,
  jsonb_build_object('duration_minutes', 60, 'price_per_hour', f.price)
FROM organizations o
CROSS JOIN (VALUES
  ('padel', 'Padel Court 1', 'Glass court with LED lighting', 'outdoor', 35),
  ('padel', 'Padel Court 2', 'Premium WPT standard', 'outdoor', 35),
  ('padel', 'Padel Court 3', 'Covered court', 'covered', 40),
  ('golf', 'Golf Course', '18-hole championship course', 'outdoor', 80),
  ('tennis', 'Tennis Court 1', 'Clay surface', 'outdoor', 30)
) AS f(sport, name, description, type, price)
JOIN sports s ON s.name = f.sport
WHERE o.slug = 'ikon'
AND NOT EXISTS (SELECT 1 FROM facilities fa WHERE fa.organization_id = o.id AND fa.name = f.name);

-- Sample published events
INSERT INTO events (
  organization_id, title, description, type, starts_at, ends_at,
  capacity, available_spots, price, status, is_public, location_details
)
SELECT o.id, e.title, e.description, e.type, e.starts_at::timestamptz, e.ends_at::timestamptz,
  e.capacity, e.available_spots, e.price, 'published', true, e.location
FROM organizations o
CROSS JOIN (VALUES
  ('Wine Tasting Evening', 'Exclusive tasting with sommelier', 'experience',
   '2026-07-12 19:00:00+00', '2026-07-12 22:00:00+00', 20, 8, 45, 'Main Terrace'),
  ('Padel Tournament Finals', 'Season finale â€” members welcome', 'tournament',
   '2026-07-14 10:00:00+00', '2026-07-14 18:00:00+00', 32, 0, 0, 'Padel Courts'),
  ('Sunday Brunch', 'Live jazz and Mediterranean buffet', 'event',
   '2026-07-13 11:00:00+00', '2026-07-13 15:00:00+00', 40, 24, 35, 'IKON Terrace'),
  ('Sunset Yoga', 'Outdoor session overlooking the course', 'workshop',
   '2026-07-11 18:30:00+00', '2026-07-11 20:00:00+00', 15, 12, 15, 'Garden Lawn')
) AS e(title, description, type, starts_at, ends_at, capacity, available_spots, price, location)
WHERE o.slug = 'ikon'
AND NOT EXISTS (SELECT 1 FROM events ev WHERE ev.organization_id = o.id AND ev.title = e.title);

DROP POLICY IF EXISTS "platform_admins_members" ON organization_members;
CREATE POLICY "platform_admins_members" ON organization_members FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid()));

-- Platform admins can read all profiles
DROP POLICY IF EXISTS "platform_admins_profiles_all" ON profiles;
CREATE POLICY "platform_admins_profiles_all" ON profiles FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid()));

-- Sample activity feed
INSERT INTO activity_feed (organization_id, activity_type, title, description, is_public)
SELECT o.id, a.type, a.title, a.description, true
FROM organizations o
CROSS JOIN (VALUES
  ('event_join', 'Alex joined Padel Tournament', 'Registered for the season finale'),
  ('reservation', 'Sarah reserved Wine Tasting', 'Party of 2 confirmed'),
  ('tournament_win', 'Mike won Golf Competition', 'Stableford format â€” 38 points'),
  ('reservation', 'Emma booked Terrace table', 'Table for 4 â€” Sunday Brunch')
) AS a(type, title, description)
WHERE o.slug = 'ikon'
AND NOT EXISTS (
  SELECT 1 FROM activity_feed af
  WHERE af.organization_id = o.id AND af.title = a.title
);




-- =============================================================================
-- PASO 2: APPLY_SEED_AND_PHASES.sql
-- Fases 1-4
-- =============================================================================

-- Community OS — Seed IKON + migraciones fase 1 a 4
-- Ejecutar DESPUES de APPLY_ALL.sql (o si ya tienes el esquema base).
-- IKON seed data, reservations trigger, activity public read, event registration

-- Reservation reference code on insert
CREATE OR REPLACE FUNCTION public.set_reservation_reference_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reference_code IS NULL OR NEW.reference_code = '' THEN
    NEW.reference_code := generate_reservation_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reservations_set_code ON reservations;
CREATE TRIGGER reservations_set_code
  BEFORE INSERT ON reservations
  FOR EACH ROW EXECUTE FUNCTION public.set_reservation_reference_code();

-- Public activity feed for active orgs
DROP POLICY IF EXISTS "activity_feed_public_read" ON activity_feed;
CREATE POLICY "activity_feed_public_read" ON activity_feed FOR SELECT
  TO anon, authenticated
  USING (is_public = true);

-- Members can register for events
DROP POLICY IF EXISTS "event_participants_update_own" ON event_participants;
CREATE POLICY "event_participants_update_own" ON event_participants FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Members create own reservations
DROP POLICY IF EXISTS "reservations_update_own" ON reservations;
CREATE POLICY "reservations_update_own" ON reservations FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Anon can read facilities for public orgs (availability display)
DROP POLICY IF EXISTS "facilities_public_read" ON facilities;
CREATE POLICY "facilities_public_read" ON facilities FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND organization_id IN (SELECT id FROM organizations WHERE is_active = true)
  );

-- ============================================================================
-- IKON â€” first customer seed
-- ============================================================================

INSERT INTO organizations (
  name, slug, primary_color, secondary_color, accent_color,
  subscription_tier, modules, is_active
) VALUES (
  'IKON',
  'ikon',
  '#0A0A0A',
  '#141414',
  '#32E4B5',
  'professional',
  '{"restaurant": true, "sports": true, "events": true, "tournaments": true}'::jsonb,
  true
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  accent_color = EXCLUDED.accent_color,
  modules = EXCLUDED.modules;

-- Venue
INSERT INTO venues (organization_id, name, description, type, city, country, is_active)
SELECT o.id, 'IKON Main Campus', 'Golf, padel, dining and events', 'main', 'Marbella', 'Spain', true
FROM organizations o WHERE o.slug = 'ikon'
AND NOT EXISTS (
  SELECT 1 FROM venues v WHERE v.organization_id = o.id AND v.name = 'IKON Main Campus'
);

-- Restaurant
INSERT INTO restaurants (organization_id, name, description, cuisine_type, is_active)
SELECT o.id, 'IKON Terrace', 'Gastronomía mediterránea con música en vivo', 'Mediterránea', true
FROM organizations o WHERE o.slug = 'ikon'
AND NOT EXISTS (
  SELECT 1 FROM restaurants r WHERE r.organization_id = o.id AND r.name = 'IKON Terrace'
);

-- Menu categories
INSERT INTO menu_categories (organization_id, restaurant_id, name, sort_order, is_active)
SELECT o.id, r.id, cat.name, cat.sort_order, true
FROM organizations o
JOIN restaurants r ON r.organization_id = o.id AND r.name = 'IKON Terrace'
CROSS JOIN (VALUES ('Entrantes', 1), ('Principales', 2), ('Postres', 3), ('Bebidas', 4)) AS cat(name, sort_order)
WHERE o.slug = 'ikon'
AND NOT EXISTS (
  SELECT 1 FROM menu_categories mc
  WHERE mc.organization_id = o.id AND mc.name = cat.name
);

-- Sample dishes (skip if already seeded)
DO $$
DECLARE
  org_uuid uuid;
  cat_starters uuid;
  cat_mains uuid;
  cat_desserts uuid;
  cat_drinks uuid;
BEGIN
  SELECT id INTO org_uuid FROM organizations WHERE slug = 'ikon';
  IF org_uuid IS NULL THEN RETURN; END IF;

  SELECT id INTO cat_starters FROM menu_categories WHERE organization_id = org_uuid AND name IN ('Entrantes', 'Starters') ORDER BY CASE WHEN name = 'Entrantes' THEN 0 ELSE 1 END LIMIT 1;
  SELECT id INTO cat_mains FROM menu_categories WHERE organization_id = org_uuid AND name IN ('Principales', 'Mains') ORDER BY CASE WHEN name = 'Principales' THEN 0 ELSE 1 END LIMIT 1;
  SELECT id INTO cat_desserts FROM menu_categories WHERE organization_id = org_uuid AND name IN ('Postres', 'Desserts') ORDER BY CASE WHEN name = 'Postres' THEN 0 ELSE 1 END LIMIT 1;
  SELECT id INTO cat_drinks FROM menu_categories WHERE organization_id = org_uuid AND name IN ('Bebidas', 'Drinks') ORDER BY CASE WHEN name = 'Bebidas' THEN 0 ELSE 1 END LIMIT 1;

  IF NOT EXISTS (SELECT 1 FROM dishes WHERE organization_id = org_uuid AND name = 'Gambas al ajillo') THEN
    INSERT INTO dishes (organization_id, category_id, name, description, price, is_available)
    VALUES
      (org_uuid, cat_starters, 'Gambas al ajillo', 'Gambas frescas en aceite de ajo', 14.50, true),
      (org_uuid, cat_starters, 'Ensalada de burrata', 'Tomates heirloom, albahaca y aceite de oliva virgen', 12.00, true),
      (org_uuid, cat_mains, 'Lubina a la brasa', 'Verduras de temporada y emulsión cítrica', 26.00, true),
      (org_uuid, cat_mains, 'Burger IKON', 'Wagyu, mayo de trufa y pan brioche', 22.00, true),
      (org_uuid, cat_desserts, 'Tiramisú', 'Receta clásica de la casa', 9.00, true),
      (org_uuid, cat_drinks, 'Copa de vino de la casa', 'Tinto o blanco', 6.50, true);
  END IF;
END $$;

-- Facilities (sports)
INSERT INTO facilities (organization_id, sport_id, name, description, type, is_active, booking_config)
SELECT o.id, s.id, f.name, f.description, f.type, true,
  jsonb_build_object('duration_minutes', 60, 'price_per_hour', f.price)
FROM organizations o
CROSS JOIN (VALUES
  ('padel', 'Padel Court 1', 'Glass court with LED lighting', 'outdoor', 35),
  ('padel', 'Padel Court 2', 'Premium WPT standard', 'outdoor', 35),
  ('padel', 'Padel Court 3', 'Covered court', 'covered', 40),
  ('golf', 'Golf Course', '18-hole championship course', 'outdoor', 80),
  ('tennis', 'Tennis Court 1', 'Clay surface', 'outdoor', 30)
) AS f(sport, name, description, type, price)
JOIN sports s ON s.name = f.sport
WHERE o.slug = 'ikon'
AND NOT EXISTS (SELECT 1 FROM facilities fa WHERE fa.organization_id = o.id AND fa.name = f.name);

-- Sample published events
INSERT INTO events (
  organization_id, title, description, type, starts_at, ends_at,
  capacity, available_spots, price, status, is_public, location_details
)
SELECT o.id, e.title, e.description, e.type, e.starts_at::timestamptz, e.ends_at::timestamptz,
  e.capacity, e.available_spots, e.price, 'published', true, e.location
FROM organizations o
CROSS JOIN (VALUES
  ('Wine Tasting Evening', 'Exclusive tasting with sommelier', 'experience',
   '2026-07-12 19:00:00+00', '2026-07-12 22:00:00+00', 20, 8, 45, 'Main Terrace'),
  ('Padel Tournament Finals', 'Season finale â€” members welcome', 'tournament',
   '2026-07-14 10:00:00+00', '2026-07-14 18:00:00+00', 32, 0, 0, 'Padel Courts'),
  ('Sunday Brunch', 'Live jazz and Mediterranean buffet', 'event',
   '2026-07-13 11:00:00+00', '2026-07-13 15:00:00+00', 40, 24, 35, 'IKON Terrace'),
  ('Sunset Yoga', 'Outdoor session overlooking the course', 'workshop',
   '2026-07-11 18:30:00+00', '2026-07-11 20:00:00+00', 15, 12, 15, 'Garden Lawn')
) AS e(title, description, type, starts_at, ends_at, capacity, available_spots, price, location)
WHERE o.slug = 'ikon'
AND NOT EXISTS (SELECT 1 FROM events ev WHERE ev.organization_id = o.id AND ev.title = e.title);

DROP POLICY IF EXISTS "platform_admins_members" ON organization_members;
CREATE POLICY "platform_admins_members" ON organization_members FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid()));

-- Platform admins can read all profiles
DROP POLICY IF EXISTS "platform_admins_profiles_all" ON profiles;
CREATE POLICY "platform_admins_profiles_all" ON profiles FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid()));

-- Sample activity feed
INSERT INTO activity_feed (organization_id, activity_type, title, description, is_public)
SELECT o.id, a.type, a.title, a.description, true
FROM organizations o
CROSS JOIN (VALUES
  ('event_join', 'Alex joined Padel Tournament', 'Registered for the season finale'),
  ('reservation', 'Sarah reserved Wine Tasting', 'Party of 2 confirmed'),
  ('tournament_win', 'Mike won Golf Competition', 'Stableford format â€” 38 points'),
  ('reservation', 'Emma booked Terrace table', 'Table for 4 â€” Sunday Brunch')
) AS a(type, title, description)
WHERE o.slug = 'ikon'
AND NOT EXISTS (
  SELECT 1 FROM activity_feed af
  WHERE af.organization_id = o.id AND af.title = a.title
);
 -- Carta digital: lectura pÃºblica de menÃº para organizaciones activas

DROP POLICY IF EXISTS "menu_categories_public_read" ON menu_categories;
CREATE POLICY "menu_categories_public_read" ON menu_categories FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND organization_id IN (SELECT id FROM organizations WHERE is_active = true)
  );

DROP POLICY IF EXISTS "dishes_public_read" ON dishes;
CREATE POLICY "dishes_public_read" ON dishes FOR SELECT
  TO anon, authenticated
  USING (
    is_available = true
    AND organization_id IN (SELECT id FROM organizations WHERE is_active = true)
  );

DROP POLICY IF EXISTS "restaurants_public_read" ON restaurants;
CREATE POLICY "restaurants_public_read" ON restaurants FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND organization_id IN (SELECT id FROM organizations WHERE is_active = true)
  );
 -- Phase 1: availability engine, notifications, invitations, conflict prevention

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  payload jsonb DEFAULT '{}',
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE read_at IS NULL;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_read_own" ON notifications;
CREATE POLICY "notifications_read_own" ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_insert_system" ON notifications;
CREATE POLICY "notifications_insert_system" ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = notifications.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

-- ============================================================================
-- ORGANIZATION INVITATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS organization_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role_id uuid REFERENCES roles(id) ON DELETE SET NULL,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at timestamptz DEFAULT (now() + interval '14 days'),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_invitations_pending_email
  ON organization_invitations(organization_id, lower(email))
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_invitations_token ON organization_invitations(token);

ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invitations_read_org_admin" ON organization_invitations;
CREATE POLICY "invitations_read_org_admin" ON organization_invitations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = organization_invitations.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
    OR (status = 'pending' AND lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')))
  );

DROP POLICY IF EXISTS "invitations_write_org_admin" ON organization_invitations;
CREATE POLICY "invitations_write_org_admin" ON organization_invitations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = organization_invitations.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = organization_invitations.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "invitations_accept_own" ON organization_invitations;
CREATE POLICY "invitations_accept_own" ON organization_invitations FOR UPDATE
  TO authenticated
  USING (
    status = 'pending'
    AND expires_at > now()
    AND lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  WITH CHECK (
    status IN ('accepted', 'revoked')
    AND lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

-- Public invitation preview (token only, no sensitive data leak)
CREATE OR REPLACE FUNCTION public.get_invitation_public(p_token text)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT jsonb_build_object(
    'email', i.email,
    'status', i.status,
    'organization', jsonb_build_object('name', o.name, 'slug', o.slug)
  )
  FROM organization_invitations i
  JOIN organizations o ON o.id = i.organization_id
  WHERE i.token = p_token
    AND i.status = 'pending'
    AND i.expires_at > now()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_invitation_public(text) TO anon, authenticated;

-- ============================================================================
-- RESERVATION CONFLICT PREVENTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.reservation_duration_minutes(p_start timestamptz, p_end timestamptz)
RETURNS interval AS $$
BEGIN
  RETURN COALESCE(p_end, p_start + interval '60 minutes') - p_start;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.check_reservation_conflict()
RETURNS TRIGGER AS $$
DECLARE
  conflict_exists boolean;
BEGIN
  IF NEW.status NOT IN ('pending', 'confirmed') OR NEW.start_time IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM reservations r
    WHERE r.organization_id = NEW.organization_id
      AND r.id IS DISTINCT FROM NEW.id
      AND r.status IN ('pending', 'confirmed')
      AND r.start_time IS NOT NULL
      AND (
        (NEW.facility_id IS NOT NULL AND r.facility_id = NEW.facility_id)
        OR (NEW.space_id IS NOT NULL AND r.space_id = NEW.space_id)
        OR (
          NEW.restaurant_id IS NOT NULL
          AND r.restaurant_id = NEW.restaurant_id
          AND COALESCE(NEW.space_id, '00000000-0000-0000-0000-000000000000'::uuid)
            = COALESCE(r.space_id, '00000000-0000-0000-0000-000000000000'::uuid)
        )
      )
      AND tstzrange(
        NEW.start_time,
        COALESCE(NEW.end_time, NEW.start_time + interval '60 minutes'),
        '[)'
      ) && tstzrange(
        r.start_time,
        COALESCE(r.end_time, r.start_time + interval '60 minutes'),
        '[)'
      )
  ) INTO conflict_exists;

  IF conflict_exists THEN
    RAISE EXCEPTION 'Este horario ya no está disponible';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_reservation_conflict ON reservations;
CREATE TRIGGER trg_check_reservation_conflict
  BEFORE INSERT OR UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION public.check_reservation_conflict();

-- ============================================================================
-- DEFAULT BOOKING HOURS ON IKON FACILITIES
-- ============================================================================

UPDATE facilities f
SET booking_config = COALESCE(f.booking_config, '{}'::jsonb) || jsonb_build_object(
  'open_hour', 8,
  'close_hour', 22,
  'slot_interval_minutes', 60,
  'max_advance_days', 30
)
FROM organizations o
WHERE f.organization_id = o.id
  AND o.slug = 'ikon'
  AND NOT (f.booking_config ? 'open_hour');

UPDATE restaurants r
SET reservation_config = COALESCE(r.reservation_config, '{}'::jsonb) || jsonb_build_object(
  'open_hour', 12,
  'close_hour', 23,
  'slot_interval_minutes', 30,
  'duration_minutes', 90,
  'max_advance_days', 30
)
FROM organizations o
WHERE r.organization_id = o.id
  AND o.slug = 'ikon'
  AND NOT (r.reservation_config ? 'open_hour');

-- IKON restaurant spaces (terrace / main room)
DO $$
DECLARE
  org_uuid uuid;
  venue_uuid uuid;
BEGIN
  SELECT id INTO org_uuid FROM organizations WHERE slug = 'ikon';
  IF org_uuid IS NULL THEN RETURN; END IF;

  SELECT id INTO venue_uuid FROM venues WHERE organization_id = org_uuid LIMIT 1;

  IF venue_uuid IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM spaces WHERE organization_id = org_uuid AND name = 'Terraza IKON'
  ) THEN
    INSERT INTO spaces (organization_id, venue_id, name, description, type, capacity, is_bookable, booking_config)
    VALUES
      (org_uuid, venue_uuid, 'Terraza IKON', 'Mesas con vistas al campo', 'terrace', 40, true,
        '{"open_hour": 12, "close_hour": 23, "slot_interval_minutes": 30, "duration_minutes": 90}'::jsonb),
      (org_uuid, venue_uuid, 'Sala principal', 'Comedor interior', 'restaurant', 30, true,
        '{"open_hour": 12, "close_hour": 23, "slot_interval_minutes": 30, "duration_minutes": 90}'::jsonb);
  END IF;
END $$;

-- Public read spaces for active orgs (member booking)
DROP POLICY IF EXISTS "spaces_public_read_active_orgs" ON spaces;
CREATE POLICY "spaces_public_read_active_orgs" ON spaces FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND is_bookable = true
    AND organization_id IN (SELECT id FROM organizations WHERE is_active = true)
  );

-- Org admins read all org reservations
DROP POLICY IF EXISTS "reservations_read_org_admin" ON reservations;
CREATE POLICY "reservations_read_org_admin" ON reservations FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
  );

-- ============================================================================
-- STORAGE: media bucket
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "media_public_read" ON storage.objects;
CREATE POLICY "media_public_read" ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'media');

DROP POLICY IF EXISTS "media_org_upload" ON storage.objects;
CREATE POLICY "media_org_upload" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] IN (
      SELECT om.organization_id::text FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
  );

DROP POLICY IF EXISTS "media_org_delete" ON storage.objects;
CREATE POLICY "media_org_delete" ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] IN (
      SELECT om.organization_id::text FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
  );
 -- IKON branding assets in DB (white-label: logo from organizations, not hardcoded)

UPDATE organizations
SET
  logo_url = COALESCE(NULLIF(logo_url, ''), '/brand/ikon-logo.png'),
  favicon_url = COALESCE(NULLIF(favicon_url, ''), '/brand/ikon-logo.png')
WHERE slug = 'ikon';
 -- Phase 2: tournaments public access, event waitlist, check-in tokens, achievements seed

-- ============================================================================
-- EVENT WAITLIST
-- ============================================================================

CREATE TABLE IF NOT EXISTS event_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'waiting' CHECK (status IN ('waiting', 'offered', 'confirmed', 'cancelled')),
  position integer,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_waitlist_event ON event_waitlist(event_id, position);

ALTER TABLE event_waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "waitlist_read_own" ON event_waitlist;
CREATE POLICY "waitlist_read_own" ON event_waitlist FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "waitlist_insert_own" ON event_waitlist;
CREATE POLICY "waitlist_insert_own" ON event_waitlist FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "waitlist_admin" ON event_waitlist;
CREATE POLICY "waitlist_admin" ON event_waitlist FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.user_id = auth.uid() AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
    )
  );

-- ============================================================================
-- CHECK-IN TOKEN ON EVENT PARTICIPANTS
-- ============================================================================

ALTER TABLE event_participants
  ADD COLUMN IF NOT EXISTS check_in_token text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex');

CREATE OR REPLACE FUNCTION public.set_event_participant_check_in_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.check_in_token IS NULL OR NEW.check_in_token = '' THEN
    NEW.check_in_token := encode(gen_random_bytes(16), 'hex');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_event_participant_check_in_token ON event_participants;
CREATE TRIGGER trg_event_participant_check_in_token
  BEFORE INSERT ON event_participants
  FOR EACH ROW EXECUTE FUNCTION public.set_event_participant_check_in_token();

-- ============================================================================
-- PUBLIC TOURNAMENT READ (published events)
-- ============================================================================

DROP POLICY IF EXISTS "tournaments_public_read" ON tournaments;
CREATE POLICY "tournaments_public_read" ON tournaments FOR SELECT
  TO anon, authenticated
  USING (
    organization_id IN (SELECT id FROM organizations WHERE is_active = true)
    AND EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = tournaments.event_id
      AND e.status = 'published'
      AND e.is_public = true
    )
  );

DROP POLICY IF EXISTS "matches_public_read" ON matches;
CREATE POLICY "matches_public_read" ON matches FOR SELECT
  TO anon, authenticated
  USING (
    organization_id IN (SELECT id FROM organizations WHERE is_active = true)
  );

DROP POLICY IF EXISTS "tournament_participants_public_read" ON tournament_participants;
CREATE POLICY "tournament_participants_public_read" ON tournament_participants FOR SELECT
  TO anon, authenticated
  USING (
    organization_id IN (SELECT id FROM organizations WHERE is_active = true)
  );

DROP POLICY IF EXISTS "rankings_public_read" ON rankings;
CREATE POLICY "rankings_public_read" ON rankings FOR SELECT
  TO anon, authenticated
  USING (
    organization_id IN (SELECT id FROM organizations WHERE is_active = true)
  );

-- ============================================================================
-- ACHIEVEMENTS SEED (IKON)
-- ============================================================================

DO $$
DECLARE
  org_uuid uuid;
BEGIN
  SELECT id INTO org_uuid FROM organizations WHERE slug = 'ikon';
  IF org_uuid IS NULL THEN RETURN; END IF;

  INSERT INTO achievements (organization_id, name, display_name, description, icon, criteria, points)
  SELECT org_uuid, a.name, a.display_name, a.description, a.icon, a.criteria::jsonb, a.points
  FROM (VALUES
    ('first_event', 'Primera experiencia', 'Te apuntaste a tu primer evento', 'star', '{"type":"event_join","count":1}', 10),
    ('first_reservation', 'Primera reserva', 'Reservaste instalación o mesa', 'calendar', '{"type":"reservation","count":1}', 10),
    ('tournament_player', 'Competidor', 'Participaste en un torneo', 'trophy', '{"type":"tournament","count":1}', 25),
    ('regular_member', 'Socio activo', '5 participaciones en el club', 'users', '{"type":"participation","count":5}', 50)
  ) AS a(name, display_name, description, icon, criteria, points)
  WHERE NOT EXISTS (
    SELECT 1 FROM achievements ac WHERE ac.organization_id = org_uuid AND ac.name = a.name
  );
END $$;

-- ============================================================================
-- IKON PADEL TOURNAMENT SEED (linked to Padel Tournament Finals event)
-- ============================================================================

DO $$
DECLARE
  org_uuid uuid;
  event_uuid uuid;
  sport_uuid uuid;
  tournament_uuid uuid;
BEGIN
  SELECT id INTO org_uuid FROM organizations WHERE slug = 'ikon';
  IF org_uuid IS NULL THEN RETURN; END IF;

  SELECT id INTO event_uuid FROM events
  WHERE organization_id = org_uuid AND title = 'Padel Tournament Finals' LIMIT 1;

  SELECT id INTO sport_uuid FROM sports WHERE name = 'padel' LIMIT 1;

  IF event_uuid IS NULL THEN RETURN; END IF;

  IF NOT EXISTS (SELECT 1 FROM tournaments WHERE organization_id = org_uuid AND event_id = event_uuid) THEN
    INSERT INTO tournaments (organization_id, event_id, sport_id, format, max_teams, status)
    VALUES (org_uuid, event_uuid, sport_uuid, 'single_elimination', 8, 'in_progress')
    RETURNING id INTO tournament_uuid;
  ELSE
    SELECT id INTO tournament_uuid FROM tournaments WHERE event_id = event_uuid LIMIT 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM tournament_participants WHERE tournament_id = tournament_uuid) THEN
    INSERT INTO tournament_participants (organization_id, tournament_id, team_name, seed, status)
    VALUES
      (org_uuid, tournament_uuid, 'Equipo García', 1, 'registered'),
      (org_uuid, tournament_uuid, 'Equipo López', 2, 'registered'),
      (org_uuid, tournament_uuid, 'Equipo Martín', 3, 'registered'),
      (org_uuid, tournament_uuid, 'Equipo Ruiz', 4, 'registered'),
      (org_uuid, tournament_uuid, 'Equipo Soto', 5, 'registered'),
      (org_uuid, tournament_uuid, 'Equipo Vega', 6, 'registered'),
      (org_uuid, tournament_uuid, 'Equipo Costa', 7, 'registered'),
      (org_uuid, tournament_uuid, 'Equipo Núñez', 8, 'registered');
  END IF;
END $$;
 -- Fase 3: escala SaaS â€” analytics, friendships (future), Ã­ndices dominio

CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name text NOT NULL,
  properties jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_org_created
  ON analytics_events (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_name
  ON analytics_events (event_name, created_at DESC);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_admins_analytics_read" ON analytics_events;
CREATE POLICY "platform_admins_analytics_read" ON analytics_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM platform_admins pa WHERE pa.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "org_admins_analytics_read" ON analytics_events;
CREATE POLICY "org_admins_analytics_read" ON analytics_events
  FOR SELECT USING (
    organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = analytics_events.organization_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
        AND r.name IN ('org_owner', 'org_admin')
    )
  );

DROP POLICY IF EXISTS "authenticated_analytics_insert" ON analytics_events;
CREATE POLICY "authenticated_analytics_insert" ON analytics_events
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Amistades (future-ready, Fase 3.5)
CREATE TABLE IF NOT EXISTS friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, requester_id, addressee_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_org_status
  ON friendships (organization_id, status);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_friendships_own" ON friendships;
CREATE POLICY "members_friendships_own" ON friendships
  FOR ALL USING (
    requester_id = auth.uid() OR addressee_id = auth.uid()
  );

-- Ãndice dominio custom (organizations.domain ya existe)
CREATE INDEX IF NOT EXISTS idx_organizations_domain_active
  ON organizations (domain) WHERE domain IS NOT NULL AND is_active = true;

COMMENT ON TABLE analytics_events IS 'Eventos de producto para analytics por org y plataforma';
COMMENT ON TABLE friendships IS 'Relaciones entre miembros del mismo tenant (future-ready)';
 -- Fase 4: pagos, reglas deportivas documentadas en settings, PWA listo en app

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('reservation', 'event_registration')),
  reference_id uuid NOT NULL,
  amount_cents integer NOT NULL CHECK (amount_cents >= 0),
  currency text NOT NULL DEFAULT 'EUR',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  stripe_session_id text,
  metadata jsonb NOT NULL DEFAULT '{}',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_org_user ON payments (organization_id, user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments (kind, reference_id);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_payments" ON payments;
CREATE POLICY "users_own_payments" ON payments
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "org_admins_payments_read" ON payments;
CREATE POLICY "org_admins_payments_read" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = payments.organization_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
        AND r.name IN ('owner', 'admin', 'org_owner', 'org_admin')
    )
  );

DROP POLICY IF EXISTS "authenticated_payments_insert" ON payments;
CREATE POLICY "authenticated_payments_insert" ON payments
  FOR INSERT WITH CHECK (user_id = auth.uid());

COMMENT ON TABLE payments IS 'Pagos Stripe para reservas y eventos de pago';





-- =============================================================================
-- PASO 3: APPLY_FIXES_FINAL.sql
-- RLS y fixes finales
-- =============================================================================

-- =============================================================================
-- APPLY_FIXES_FINAL.sql â€” Estado final correcto (RLS, aislamiento, funciones)
--
-- Consolida y reemplaza todos los FIX_*.sql sueltos. Es IDEMPOTENTE:
-- puedes ejecutarlo tantas veces como quieras sin romper nada.
--
-- Orden de ejecuciÃ³n en Supabase â†’ SQL Editor:
--   1) APPLY_ALL.sql               (esquema base: migraciones 1-3)
--   2) APPLY_SEED_AND_PHASES.sql   (seed IKON + fases 1-4)
--   3) APPLY_FIXES_FINAL.sql       (este archivo)
--   4) (opcional) secciÃ³n SEED ADMIN del final, cambiando el email
--
-- Si tu base ya estÃ¡ creada, con ejecutar este archivo basta para dejar
-- las polÃ­ticas y funciones en su estado correcto.
-- =============================================================================


-- =============================================================================
-- 1) FUNCIÃ“N ANTI-RECURSIÃ“N PARA ADMIN DE ORGANIZACIÃ“N
--    Evita "infinite recursion detected in policy for organization_members".
-- =============================================================================
CREATE OR REPLACE FUNCTION public.is_org_admin_of(org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members om
    JOIN roles r ON r.id = om.role_id
    WHERE om.organization_id = org_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('org_owner', 'org_admin')
  );
$$;

REVOKE ALL ON FUNCTION public.is_org_admin_of(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_org_admin_of(uuid) TO authenticated;


-- =============================================================================
-- 2) ORGANIZATION_MEMBERS â€” polÃ­ticas sin recursiÃ³n
-- =============================================================================
DROP POLICY IF EXISTS "org_members_read_own_org" ON organization_members;
CREATE POLICY "org_members_read_own_org" ON organization_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
    OR public.is_org_admin_of(organization_id)
  );

DROP POLICY IF EXISTS "org_admins_manage_members" ON organization_members;
CREATE POLICY "org_admins_manage_members" ON organization_members FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
    OR public.is_org_admin_of(organization_id)
    OR user_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
    OR public.is_org_admin_of(organization_id)
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "platform_admins_members" ON organization_members;
CREATE POLICY "platform_admins_members" ON organization_members FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid()));

-- Roles legibles por cualquier autenticado (necesario para joins y checks)
DROP POLICY IF EXISTS "roles_read_authenticated" ON roles;
CREATE POLICY "roles_read_authenticated" ON roles FOR SELECT
  TO authenticated
  USING (true);

-- Cada usuario puede crear/leer su propio perfil
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Cada usuario puede leer su propio registro de admin de plataforma
DROP POLICY IF EXISTS "platform_admins_read_own" ON platform_admins;
CREATE POLICY "platform_admins_read_own" ON platform_admins FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());


-- =============================================================================
-- 3) AISLAMIENTO MULTI-TENANT â€” cada socio solo ve datos de sus clubs
-- =============================================================================

-- RESERVAS: el socio solo ve las suyas dentro de orgs donde es miembro activo
DROP POLICY IF EXISTS "reservations_read_own" ON reservations;
CREATE POLICY "reservations_read_own" ON reservations FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "reservations_read_platform_admin" ON reservations;
CREATE POLICY "reservations_read_platform_admin" ON reservations FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid()));

-- Admin del club sigue viendo TODAS las reservas de su org (polÃ­tica aparte)
DROP POLICY IF EXISTS "reservations_read_org_admin" ON reservations;
CREATE POLICY "reservations_read_org_admin" ON reservations FOR SELECT
  TO authenticated
  USING (public.is_org_admin_of(organization_id));

-- NOTIFICACIONES: solo las del usuario dentro de sus clubs
DROP POLICY IF EXISTS "notifications_read_own" ON notifications;
CREATE POLICY "notifications_read_own" ON notifications FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "notifications_read_platform_admin" ON notifications;
CREATE POLICY "notifications_read_platform_admin" ON notifications FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid()));

-- INSCRIPCIONES A EVENTOS
DROP POLICY IF EXISTS "event_participants_read_own" ON event_participants;
CREATE POLICY "event_participants_read_own" ON event_participants FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "event_participants_read_platform_admin" ON event_participants;
CREATE POLICY "event_participants_read_platform_admin" ON event_participants FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "event_participants_read_org_admin" ON event_participants;
CREATE POLICY "event_participants_read_org_admin" ON event_participants FOR SELECT
  TO authenticated
  USING (public.is_org_admin_of(organization_id));

-- LISTA DE ESPERA
DROP POLICY IF EXISTS "event_waitlist_read_own" ON event_waitlist;
CREATE POLICY "event_waitlist_read_own" ON event_waitlist FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "event_waitlist_read_platform_admin" ON event_waitlist;
CREATE POLICY "event_waitlist_read_platform_admin" ON event_waitlist FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid()));


-- =============================================================================
-- 4) LECTURA PÃšBLICA (anon) â€” acotada a organizaciones activas
-- =============================================================================
DROP POLICY IF EXISTS "activity_feed_public_read" ON activity_feed;
CREATE POLICY "activity_feed_public_read" ON activity_feed FOR SELECT
  TO anon, authenticated
  USING (
    is_public = true
    AND organization_id IN (SELECT id FROM organizations WHERE is_active = true)
  );

DROP POLICY IF EXISTS "events_public_read" ON events;
CREATE POLICY "events_public_read" ON events FOR SELECT
  TO anon, authenticated
  USING (
    status = 'published'
    AND is_public = true
    AND deleted_at IS NULL
    AND organization_id IN (SELECT id FROM organizations WHERE is_active = true)
  );

DROP POLICY IF EXISTS "facilities_public_read" ON facilities;
CREATE POLICY "facilities_public_read" ON facilities FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND organization_id IN (SELECT id FROM organizations WHERE is_active = true)
  );

DROP POLICY IF EXISTS "restaurants_public_read" ON restaurants;
CREATE POLICY "restaurants_public_read" ON restaurants FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND organization_id IN (SELECT id FROM organizations WHERE is_active = true)
  );

DROP POLICY IF EXISTS "menu_categories_public_read" ON menu_categories;
CREATE POLICY "menu_categories_public_read" ON menu_categories FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND organization_id IN (SELECT id FROM organizations WHERE is_active = true)
  );

DROP POLICY IF EXISTS "dishes_public_read" ON dishes;
CREATE POLICY "dishes_public_read" ON dishes FOR SELECT
  TO anon, authenticated
  USING (
    is_available = true
    AND organization_id IN (SELECT id FROM organizations WHERE is_active = true)
  );

DROP POLICY IF EXISTS "spaces_public_read_active_orgs" ON spaces;
CREATE POLICY "spaces_public_read_active_orgs" ON spaces FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND is_bookable = true
    AND organization_id IN (SELECT id FROM organizations WHERE is_active = true)
  );

DROP POLICY IF EXISTS "organizations_public_read" ON organizations;
CREATE POLICY "organizations_public_read" ON organizations FOR SELECT
  TO anon, authenticated
  USING (is_active = true);


-- =============================================================================
-- 5) BUGFIX â€” analytics: admins de club usan rol org_owner/org_admin
-- =============================================================================
DROP POLICY IF EXISTS "org_admins_analytics_read" ON analytics_events;
CREATE POLICY "org_admins_analytics_read" ON analytics_events
  FOR SELECT USING (
    organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = analytics_events.organization_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
        AND r.name IN ('org_owner', 'org_admin')
    )
  );


-- =============================================================================
-- 6) FUNCIONES RPC QUE USA LA APP
-- =============================================================================

-- MembresÃ­as del usuario (evita bloqueos RLS en el login)
CREATE OR REPLACE FUNCTION public.get_my_memberships()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    json_agg(
      json_build_object(
        'id', om.id,
        'organization_id', om.organization_id,
        'role_id', om.role_id,
        'status', om.status,
        'organization', json_build_object(
          'id', o.id,
          'name', o.name,
          'slug', o.slug,
          'logo_url', o.logo_url,
          'primary_color', o.primary_color,
          'secondary_color', o.secondary_color,
          'accent_color', o.accent_color
        ),
        'role', json_build_object(
          'id', r.id,
          'name', r.name,
          'display_name', r.display_name
        )
      )
    ),
    '[]'::json
  )
  FROM organization_members om
  JOIN organizations o ON o.id = om.organization_id
  JOIN roles r ON r.id = om.role_id
  WHERE om.user_id = auth.uid()
    AND om.status = 'active';
$$;

REVOKE ALL ON FUNCTION public.get_my_memberships() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_memberships() TO authenticated;

-- Datos pÃºblicos de un club por slug (para la web pÃºblica del tenant)
CREATE OR REPLACE FUNCTION public.get_tenant_by_slug(p_slug text)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT row_to_json(t)
  FROM (
    SELECT
      id, name, slug, domain, logo_url, favicon_url,
      primary_color, secondary_color, accent_color,
      font_family, theme_mode, modules
    FROM organizations
    WHERE slug = p_slug
      AND is_active = true
    LIMIT 1
  ) t;
$$;

REVOKE ALL ON FUNCTION public.get_tenant_by_slug(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_tenant_by_slug(text) TO anon, authenticated;

-- Lista de organizaciones para el panel de plataforma
CREATE OR REPLACE FUNCTION public.get_platform_organizations()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid()) THEN
      coalesce(
        (
          SELECT json_agg(row_to_json(t) ORDER BY t.created_at DESC)
          FROM (
            SELECT
              o.*,
              (
                SELECT count(*)::int
                FROM organization_members om
                WHERE om.organization_id = o.id
                  AND om.status = 'active'
              ) AS member_count
            FROM organizations o
          ) t
        ),
        '[]'::json
      )
    ELSE '[]'::json
  END;
$$;

REVOKE ALL ON FUNCTION public.get_platform_organizations() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_platform_organizations() TO authenticated;

-- Preview pÃºblico de invitaciÃ³n por token (sin filtrar datos sensibles)
CREATE OR REPLACE FUNCTION public.get_invitation_public(p_token text)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT jsonb_build_object(
    'email', i.email,
    'status', i.status,
    'organization', jsonb_build_object('name', o.name, 'slug', o.slug)
  )
  FROM organization_invitations i
  JOIN organizations o ON o.id = i.organization_id
  WHERE i.token = p_token
    AND i.status = 'pending'
    AND i.expires_at > now()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_invitation_public(text) TO anon, authenticated;


-- =============================================================================
-- 7) (OPCIONAL) SEED ADMIN â€” descomenta y cambia el email para asignar dueÃ±o
--
--    âš ï¸ Cambia 'alexxstazy@gmail.com' por el email real antes de ejecutar.
--    El usuario debe existir ya en Authentication â†’ Users.
-- =============================================================================

-- -- Plataforma (super admin de Community OS)
-- INSERT INTO platform_admins (user_id, role)
-- SELECT u.id, 'owner'
-- FROM auth.users u
-- WHERE lower(u.email) = lower('alexxstazy@gmail.com')
-- ON CONFLICT (user_id) DO UPDATE SET role = 'owner';

-- -- DueÃ±o de IKON
-- INSERT INTO organization_members (organization_id, user_id, role_id, status)
-- SELECT o.id, u.id,
--   (SELECT id FROM roles WHERE name = 'org_owner' AND organization_id IS NULL LIMIT 1),
--   'active'
-- FROM auth.users u
-- CROSS JOIN organizations o
-- WHERE lower(u.email) = lower('alexxstazy@gmail.com')
--   AND o.slug = 'ikon'
-- ON CONFLICT (organization_id, user_id) DO UPDATE
--   SET role_id = EXCLUDED.role_id, status = 'active';

-- =============================================================================
-- FIN
-- =============================================================================




-- =============================================================================
-- PASO 4: migrations\20260710100000_event_checkin_reminders.sql
-- Check-in eventos
-- =============================================================================

-- Check-in por token (admin del club) + lectura de token por admin

ALTER TABLE event_participants
  ADD COLUMN IF NOT EXISTS check_in_token text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex');

CREATE OR REPLACE FUNCTION public.set_event_participant_check_in_token()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.check_in_token IS NULL OR NEW.check_in_token = '' THEN
    NEW.check_in_token := encode(gen_random_bytes(16), 'hex');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_event_participant_check_in_token ON event_participants;
CREATE TRIGGER trg_event_participant_check_in_token
  BEFORE INSERT ON event_participants
  FOR EACH ROW EXECUTE FUNCTION public.set_event_participant_check_in_token();

CREATE OR REPLACE FUNCTION public.check_in_event_participant(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_participant event_participants%ROWTYPE;
  v_event events%ROWTYPE;
  v_profile profiles%ROWTYPE;
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) < 8 THEN
    RAISE EXCEPTION 'TOKEN_INVALID' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_participant
  FROM event_participants
  WHERE check_in_token = trim(p_token)
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'TOKEN_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  IF NOT public.is_org_admin_of(v_participant.organization_id) THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = 'P0001';
  END IF;

  IF v_participant.checked_in_at IS NOT NULL THEN
    RAISE EXCEPTION 'ALREADY_CHECKED_IN' USING ERRCODE = 'P0001';
  END IF;

  UPDATE event_participants
  SET checked_in_at = now(),
      status = 'attended'
  WHERE id = v_participant.id;

  SELECT * INTO v_event FROM events WHERE id = v_participant.event_id;

  IF v_participant.user_id IS NOT NULL THEN
    SELECT * INTO v_profile FROM profiles WHERE user_id = v_participant.user_id;
  END IF;

  RETURN jsonb_build_object(
    'participantId', v_participant.id,
    'eventId', v_participant.event_id,
    'eventTitle', coalesce(v_event.title, 'Evento'),
    'attendeeName', coalesce(v_profile.full_name, 'Participante'),
    'checkedInAt', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_in_event_participant(text) TO authenticated;




-- =============================================================================
-- PASO 5: migrations\20260711100000_ikon_branding_preset.sql
-- Branding IKON
-- =============================================================================

-- Preset de experiencia visual para IKON (cliente demo / primer tenant)
-- Otros clubs configuran esto desde Panel â†’ Marca.

INSERT INTO organization_settings (organization_id, key, value)
SELECT
  o.id,
  'branding_experience',
  jsonb_build_object(
    'hero_style', 'cinematic',
    'splash_style', 'golf',
    'tagline', 'Sports & Lounge · Sant Jordi',
    'hero_eyebrow_kicker', 'Panorámica Golf',
    'hero_eyebrow', 'Golf · Sports · Lounge',
    'hero_title_lines', jsonb_build_array(
      'Un estilo', 'de vida.', 'Una pasión', 'eterna.'
    ),
    'hero_title_mobile', 'Un estilo de vida. Una pasión eterna.'
  )
FROM organizations o
WHERE o.slug = 'ikon'
  AND NOT EXISTS (
    SELECT 1 FROM organization_settings s
    WHERE s.organization_id = o.id AND s.key = 'branding_experience'
  );

INSERT INTO organization_settings (organization_id, key, value)
SELECT
  o.id,
  'branding_hero',
  jsonb_build_object(
    'hero_tagline', 'Descubre un lugar mágico donde el deporte, la naturaleza y la exclusividad crean una experiencia única.',
    'hero_image_url', null
  )
FROM organizations o
WHERE o.slug = 'ikon'
  AND NOT EXISTS (
    SELECT 1 FROM organization_settings s
    WHERE s.organization_id = o.id AND s.key = 'branding_hero'
  );




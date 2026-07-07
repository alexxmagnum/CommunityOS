export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          domain: string | null
          logo_url: string | null
          favicon_url: string | null
          primary_color: string
          secondary_color: string
          accent_color: string
          font_family: string
          theme_mode: 'light' | 'dark' | 'system'
          is_active: boolean
          subscription_tier: 'trial' | 'starter' | 'professional' | 'enterprise'
          subscription_ends_at: string | null
          modules: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          domain?: string | null
          logo_url?: string | null
          favicon_url?: string | null
          primary_color?: string
          secondary_color?: string
          accent_color?: string
          font_family?: string
          theme_mode?: 'light' | 'dark' | 'system'
          is_active?: boolean
          subscription_tier?: 'trial' | 'starter' | 'professional' | 'enterprise'
          subscription_ends_at?: string | null
          modules?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          domain?: string | null
          logo_url?: string | null
          favicon_url?: string | null
          primary_color?: string
          secondary_color?: string
          accent_color?: string
          font_family?: string
          theme_mode?: 'light' | 'dark' | 'system'
          is_active?: boolean
          subscription_tier?: 'trial' | 'starter' | 'professional' | 'enterprise'
          subscription_ends_at?: string | null
          modules?: Json
          created_at?: string
          updated_at?: string
        }
      }
      organization_settings: {
        Row: {
          id: string
          organization_id: string
          key: string
          value: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          key: string
          value?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          key?: string
          value?: Json
          created_at?: string
          updated_at?: string
        }
      }
      platform_admins: {
        Row: {
          id: string
          user_id: string
          role: 'owner' | 'admin' | 'support'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role?: 'owner' | 'admin' | 'support'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'support'
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          bio: string | null
          preferences: Json
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          bio?: string | null
          preferences?: Json
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          bio?: string | null
          preferences?: Json
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      organization_members: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role_id: string | null
          status: 'active' | 'inactive' | 'pending' | 'suspended'
          joined_at: string
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role_id?: string | null
          status?: 'active' | 'inactive' | 'pending' | 'suspended'
          joined_at?: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          role_id?: string | null
          status?: 'active' | 'inactive' | 'pending' | 'suspended'
          joined_at?: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      roles: {
        Row: {
          id: string
          organization_id: string | null
          name: string
          display_name: string | null
          description: string | null
          is_system: boolean
          permissions: Json
          created_at: string
        }
        Insert: {
          id?: string
          organization_id?: string | null
          name: string
          display_name?: string | null
          description?: string | null
          is_system?: boolean
          permissions?: Json
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          name?: string
          display_name?: string | null
          description?: string | null
          is_system?: boolean
          permissions?: Json
          created_at?: string
        }
      }
      venues: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          type: 'main' | 'branch' | 'facility'
          address: string | null
          city: string | null
          country: string | null
          postal_code: string | null
          latitude: number | null
          longitude: number | null
          cover_image_url: string | null
          gallery: Json
          operating_hours: Json
          is_active: boolean
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          type?: 'main' | 'branch' | 'facility'
          address?: string | null
          city?: string | null
          country?: string | null
          postal_code?: string | null
          latitude?: number | null
          longitude?: number | null
          cover_image_url?: string | null
          gallery?: Json
          operating_hours?: Json
          is_active?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string | null
          type?: 'main' | 'branch' | 'facility'
          address?: string | null
          city?: string | null
          country?: string | null
          postal_code?: string | null
          latitude?: number | null
          longitude?: number | null
          cover_image_url?: string | null
          gallery?: Json
          operating_hours?: Json
          is_active?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      spaces: {
        Row: {
          id: string
          organization_id: string
          venue_id: string
          name: string
          description: string | null
          type: 'restaurant' | 'terrace' | 'private_room' | 'court' | 'field' | 'hall' | 'meeting_room' | 'event_space' | 'other'
          capacity: number | null
          amenities: Json
          images: Json
          is_bookable: boolean
          booking_config: Json
          is_active: boolean
          sort_order: number
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          venue_id: string
          name: string
          description?: string | null
          type: 'restaurant' | 'terrace' | 'private_room' | 'court' | 'field' | 'hall' | 'meeting_room' | 'event_space' | 'other'
          capacity?: number | null
          amenities?: Json
          images?: Json
          is_bookable?: boolean
          booking_config?: Json
          is_active?: boolean
          sort_order?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          venue_id?: string
          name?: string
          description?: string | null
          type?: 'restaurant' | 'terrace' | 'private_room' | 'court' | 'field' | 'hall' | 'meeting_room' | 'event_space' | 'other'
          capacity?: number | null
          amenities?: Json
          images?: Json
          is_bookable?: boolean
          booking_config?: Json
          is_active?: boolean
          sort_order?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      restaurants: {
        Row: {
          id: string
          organization_id: string
          venue_id: string | null
          name: string
          description: string | null
          cuisine_type: string | null
          cover_image_url: string | null
          gallery: Json
          opening_hours: Json
          reservation_config: Json
          is_active: boolean
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          venue_id?: string | null
          name: string
          description?: string | null
          cuisine_type?: string | null
          cover_image_url?: string | null
          gallery?: Json
          opening_hours?: Json
          reservation_config?: Json
          is_active?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          venue_id?: string | null
          name?: string
          description?: string | null
          cuisine_type?: string | null
          cover_image_url?: string | null
          gallery?: Json
          opening_hours?: Json
          reservation_config?: Json
          is_active?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      menu_categories: {
        Row: {
          id: string
          organization_id: string
          restaurant_id: string | null
          name: string
          description: string | null
          icon: string | null
          image_url: string | null
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          restaurant_id?: string | null
          name: string
          description?: string | null
          icon?: string | null
          image_url?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          restaurant_id?: string | null
          name?: string
          description?: string | null
          icon?: string | null
          image_url?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      dishes: {
        Row: {
          id: string
          organization_id: string
          category_id: string | null
          name: string
          description: string | null
          price: number
          image_url: string | null
          gallery: Json
          ingredients: Json
          allergens: Json
          nutritional_info: Json
          is_chef_special: boolean
          is_vegetarian: boolean
          is_vegan: boolean
          is_gluten_free: boolean
          is_available: boolean
          sort_order: number
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          category_id?: string | null
          name: string
          description?: string | null
          price: number
          image_url?: string | null
          gallery?: Json
          ingredients?: Json
          allergens?: Json
          nutritional_info?: Json
          is_chef_special?: boolean
          is_vegetarian?: boolean
          is_vegan?: boolean
          is_gluten_free?: boolean
          is_available?: boolean
          sort_order?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          category_id?: string | null
          name?: string
          description?: string | null
          price?: number
          image_url?: string | null
          gallery?: Json
          ingredients?: Json
          allergens?: Json
          nutritional_info?: Json
          is_chef_special?: boolean
          is_vegetarian?: boolean
          is_vegan?: boolean
          is_gluten_free?: boolean
          is_available?: boolean
          sort_order?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      sports: {
        Row: {
          id: string
          name: string
          display_name: string | null
          description: string | null
          icon: string | null
          image_url: string | null
          default_rules: Json
          court_types: Json
          is_active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          display_name?: string | null
          description?: string | null
          icon?: string | null
          image_url?: string | null
          default_rules?: Json
          court_types?: Json
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_name?: string | null
          description?: string | null
          icon?: string | null
          image_url?: string | null
          default_rules?: Json
          court_types?: Json
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
      }
      facilities: {
        Row: {
          id: string
          organization_id: string
          venue_id: string | null
          sport_id: string | null
          name: string
          description: string | null
          type: string | null
          amenities: Json
          images: Json
          booking_config: Json
          is_active: boolean
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          venue_id?: string | null
          sport_id?: string | null
          name: string
          description?: string | null
          type?: string | null
          amenities?: Json
          images?: Json
          booking_config?: Json
          is_active?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          venue_id?: string | null
          sport_id?: string | null
          name?: string
          description?: string | null
          type?: string | null
          amenities?: Json
          images?: Json
          booking_config?: Json
          is_active?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      time_slots: {
        Row: {
          id: string
          organization_id: string
          facility_id: string
          start_time: string
          end_time: string
          status: 'available' | 'booked' | 'blocked' | 'maintenance'
          price: number | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          facility_id: string
          start_time: string
          end_time: string
          status?: 'available' | 'booked' | 'blocked' | 'maintenance'
          price?: number | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          facility_id?: string
          start_time?: string
          end_time?: string
          status?: 'available' | 'booked' | 'blocked' | 'maintenance'
          price?: number | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      event_categories: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          icon: string | null
          color: string | null
          is_active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          icon?: string | null
          color?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string | null
          icon?: string | null
          color?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          organization_id: string
          venue_id: string | null
          category_id: string | null
          title: string
          description: string | null
          type: 'event' | 'tournament' | 'workshop' | 'social' | 'competition' | 'experience'
          cover_image_url: string | null
          gallery: Json
          starts_at: string
          ends_at: string | null
          capacity: number | null
          available_spots: number | null
          price: number
          currency: string
          is_public: boolean
          registration_required: boolean
          registration_opens_at: string | null
          registration_closes_at: string | null
          location_details: string | null
          tags: Json
          status: 'draft' | 'published' | 'cancelled' | 'completed'
          metadata: Json
          created_by: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          venue_id?: string | null
          category_id?: string | null
          title: string
          description?: string | null
          type?: 'event' | 'tournament' | 'workshop' | 'social' | 'competition' | 'experience'
          cover_image_url?: string | null
          gallery?: Json
          starts_at: string
          ends_at?: string | null
          capacity?: number | null
          available_spots?: number | null
          price?: number
          currency?: string
          is_public?: boolean
          registration_required?: boolean
          registration_opens_at?: string | null
          registration_closes_at?: string | null
          location_details?: string | null
          tags?: Json
          status?: 'draft' | 'published' | 'cancelled' | 'completed'
          metadata?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          venue_id?: string | null
          category_id?: string | null
          title?: string
          description?: string | null
          type?: 'event' | 'tournament' | 'workshop' | 'social' | 'competition' | 'experience'
          cover_image_url?: string | null
          gallery?: Json
          starts_at?: string
          ends_at?: string | null
          capacity?: number | null
          available_spots?: number | null
          price?: number
          currency?: string
          is_public?: boolean
          registration_required?: boolean
          registration_opens_at?: string | null
          registration_closes_at?: string | null
          location_details?: string | null
          tags?: Json
          status?: 'draft' | 'published' | 'cancelled' | 'completed'
          metadata?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      event_participants: {
        Row: {
          id: string
          organization_id: string
          event_id: string
          user_id: string | null
          status: 'registered' | 'confirmed' | 'waitlisted' | 'cancelled' | 'attended' | 'no_show'
          registered_at: string
          confirmed_at: string | null
          checked_in_at: string | null
          notes: string | null
          metadata: Json
        }
        Insert: {
          id?: string
          organization_id: string
          event_id: string
          user_id?: string | null
          status?: 'registered' | 'confirmed' | 'waitlisted' | 'cancelled' | 'attended' | 'no_show'
          registered_at?: string
          confirmed_at?: string | null
          checked_in_at?: string | null
          notes?: string | null
          metadata?: Json
        }
        Update: {
          id?: string
          organization_id?: string
          event_id?: string
          user_id?: string | null
          status?: 'registered' | 'confirmed' | 'waitlisted' | 'cancelled' | 'attended' | 'no_show'
          registered_at?: string
          confirmed_at?: string | null
          checked_in_at?: string | null
          notes?: string | null
          metadata?: Json
        }
      }
      reservations: {
        Row: {
          id: string
          organization_id: string
          user_id: string | null
          reservation_type: 'restaurant' | 'facility' | 'event' | 'space' | 'experience'
          reference_code: string
          restaurant_id: string | null
          facility_id: string | null
          space_id: string | null
          event_id: string | null
          reserved_date: string | null
          start_time: string | null
          end_time: string | null
          party_size: number
          guest_name: string | null
          guest_email: string | null
          guest_phone: string | null
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
          total_amount: number
          currency: string
          payment_status: 'pending' | 'paid' | 'refunded' | 'partial'
          special_requests: string | null
          internal_notes: string | null
          metadata: Json
          confirmed_at: string | null
          cancelled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id?: string | null
          reservation_type: 'restaurant' | 'facility' | 'event' | 'space' | 'experience'
          reference_code: string
          restaurant_id?: string | null
          facility_id?: string | null
          space_id?: string | null
          event_id?: string | null
          reserved_date?: string | null
          start_time?: string | null
          end_time?: string | null
          party_size?: number
          guest_name?: string | null
          guest_email?: string | null
          guest_phone?: string | null
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
          total_amount?: number
          currency?: string
          payment_status?: 'pending' | 'paid' | 'refunded' | 'partial'
          special_requests?: string | null
          internal_notes?: string | null
          metadata?: Json
          confirmed_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string | null
          reservation_type?: 'restaurant' | 'facility' | 'event' | 'space' | 'experience'
          reference_code?: string
          restaurant_id?: string | null
          facility_id?: string | null
          space_id?: string | null
          event_id?: string | null
          reserved_date?: string | null
          start_time?: string | null
          end_time?: string | null
          party_size?: number
          guest_name?: string | null
          guest_email?: string | null
          guest_phone?: string | null
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
          total_amount?: number
          currency?: string
          payment_status?: 'pending' | 'paid' | 'refunded' | 'partial'
          special_requests?: string | null
          internal_notes?: string | null
          metadata?: Json
          confirmed_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tournaments: {
        Row: {
          id: string
          organization_id: string
          event_id: string
          sport_id: string | null
          format: 'single_elimination' | 'double_elimination' | 'round_robin' | 'league' | 'swiss' | 'americano' | 'groups_playoffs'
          max_teams: number | null
          registration_type: 'individual' | 'team'
          min_team_size: number
          max_team_size: number
          seeding_method: 'random' | 'ranking' | 'manual'
          rules: Json
          prize_pool: Json
          status: 'registration' | 'check_in' | 'in_progress' | 'completed' | 'cancelled'
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          event_id: string
          sport_id?: string | null
          format: 'single_elimination' | 'double_elimination' | 'round_robin' | 'league' | 'swiss' | 'americano' | 'groups_playoffs'
          max_teams?: number | null
          registration_type?: 'individual' | 'team'
          min_team_size?: number
          max_team_size?: number
          seeding_method?: 'random' | 'ranking' | 'manual'
          rules?: Json
          prize_pool?: Json
          status?: 'registration' | 'check_in' | 'in_progress' | 'completed' | 'cancelled'
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          event_id?: string
          sport_id?: string | null
          format?: 'single_elimination' | 'double_elimination' | 'round_robin' | 'league' | 'swiss' | 'americano' | 'groups_playoffs'
          max_teams?: number | null
          registration_type?: 'individual' | 'team'
          min_team_size?: number
          max_team_size?: number
          seeding_method?: 'random' | 'ranking' | 'manual'
          rules?: Json
          prize_pool?: Json
          status?: 'registration' | 'check_in' | 'in_progress' | 'completed' | 'cancelled'
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      tournament_participants: {
        Row: {
          id: string
          organization_id: string
          tournament_id: string
          team_name: string | null
          captain_id: string | null
          members: Json
          seed: number | null
          rank: number | null
          is_checked_in: boolean
          checked_in_at: string | null
          status: 'registered' | 'checked_in' | 'eliminated' | 'winner' | 'cancelled'
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          tournament_id: string
          team_name?: string | null
          captain_id?: string | null
          members?: Json
          seed?: number | null
          rank?: number | null
          is_checked_in?: boolean
          checked_in_at?: string | null
          status?: 'registered' | 'checked_in' | 'eliminated' | 'winner' | 'cancelled'
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          tournament_id?: string
          team_name?: string | null
          captain_id?: string | null
          members?: Json
          seed?: number | null
          rank?: number | null
          is_checked_in?: boolean
          checked_in_at?: string | null
          status?: 'registered' | 'checked_in' | 'eliminated' | 'winner' | 'cancelled'
          metadata?: Json
          created_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          organization_id: string
          tournament_id: string
          round: number
          match_number: number
          bracket: 'main' | 'losers' | 'consolation'
          participant1_id: string | null
          participant2_id: string | null
          facility_id: string | null
          scheduled_time: string | null
          estimated_duration_minutes: number | null
          score: Json
          winner_id: string | null
          loser_id: string | null
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'walkover'
          notes: string | null
          metadata: Json
          created_at: string
          started_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          tournament_id: string
          round: number
          match_number: number
          bracket?: 'main' | 'losers' | 'consolation'
          participant1_id?: string | null
          participant2_id?: string | null
          facility_id?: string | null
          scheduled_time?: string | null
          estimated_duration_minutes?: number | null
          score?: Json
          winner_id?: string | null
          loser_id?: string | null
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'walkover'
          notes?: string | null
          metadata?: Json
          created_at?: string
          started_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          tournament_id?: string
          round?: number
          match_number?: number
          bracket?: 'main' | 'losers' | 'consolation'
          participant1_id?: string | null
          participant2_id?: string | null
          facility_id?: string | null
          scheduled_time?: string | null
          estimated_duration_minutes?: number | null
          score?: Json
          winner_id?: string | null
          loser_id?: string | null
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'walkover'
          notes?: string | null
          metadata?: Json
          created_at?: string
          started_at?: string | null
          completed_at?: string | null
        }
      }
      rankings: {
        Row: {
          id: string
          organization_id: string
          sport_id: string | null
          user_id: string | null
          points: number
          wins: number
          losses: number
          draws: number
          rank: number | null
          metadata: Json
          period: 'weekly' | 'monthly' | 'yearly' | 'all_time'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          sport_id?: string | null
          user_id?: string | null
          points?: number
          wins?: number
          losses?: number
          draws?: number
          rank?: number | null
          metadata?: Json
          period?: 'weekly' | 'monthly' | 'yearly' | 'all_time'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          sport_id?: string | null
          user_id?: string | null
          points?: number
          wins?: number
          losses?: number
          draws?: number
          rank?: number | null
          metadata?: Json
          period?: 'weekly' | 'monthly' | 'yearly' | 'all_time'
          created_at?: string
          updated_at?: string
        }
      }
      activity_feed: {
        Row: {
          id: string
          organization_id: string
          user_id: string | null
          activity_type: string
          title: string | null
          description: string | null
          reference_type: string | null
          reference_id: string | null
          metadata: Json
          is_public: boolean
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id?: string | null
          activity_type: string
          title?: string | null
          description?: string | null
          reference_type?: string | null
          reference_id?: string | null
          metadata?: Json
          is_public?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string | null
          activity_type?: string
          title?: string | null
          description?: string | null
          reference_type?: string | null
          reference_id?: string | null
          metadata?: Json
          is_public?: boolean
          created_at?: string
        }
      }
      achievements: {
        Row: {
          id: string
          organization_id: string | null
          name: string
          display_name: string | null
          description: string | null
          icon: string | null
          image_url: string | null
          criteria: Json
          points: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          organization_id?: string | null
          name: string
          display_name?: string | null
          description?: string | null
          icon?: string | null
          image_url?: string | null
          criteria: Json
          points?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          name?: string
          display_name?: string | null
          description?: string | null
          icon?: string | null
          image_url?: string | null
          criteria?: Json
          points?: number
          is_active?: boolean
          created_at?: string
        }
      }
      user_achievements: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          achievement_id: string
          earned_at: string
          metadata: Json
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          achievement_id: string
          earned_at?: string
          metadata?: Json
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          achievement_id?: string
          earned_at?: string
          metadata?: Json
        }
      }
      media_library: {
        Row: {
          id: string
          organization_id: string
          uploaded_by: string | null
          filename: string
          original_filename: string | null
          mime_type: string | null
          size: number | null
          url: string
          thumbnail_url: string | null
          alt_text: string | null
          title: string | null
          tags: Json
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          uploaded_by?: string | null
          filename: string
          original_filename?: string | null
          mime_type?: string | null
          size?: number | null
          url: string
          thumbnail_url?: string | null
          alt_text?: string | null
          title?: string | null
          tags?: Json
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          uploaded_by?: string | null
          filename?: string
          original_filename?: string | null
          mime_type?: string | null
          size?: number | null
          url?: string
          thumbnail_url?: string | null
          alt_text?: string | null
          title?: string | null
          tags?: Json
          metadata?: Json
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          organization_id: string | null
          user_id: string
          type: string
          title: string
          body: string | null
          link: string | null
          payload: Json
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id?: string | null
          user_id: string
          type: string
          title: string
          body?: string | null
          link?: string | null
          payload?: Json
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          user_id?: string
          type?: string
          title?: string
          body?: string | null
          link?: string | null
          payload?: Json
          read_at?: string | null
          created_at?: string
        }
      }
      organization_invitations: {
        Row: {
          id: string
          organization_id: string
          email: string
          role_id: string | null
          token: string
          status: 'pending' | 'accepted' | 'expired' | 'revoked'
          invited_by: string | null
          expires_at: string
          accepted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          email: string
          role_id?: string | null
          token?: string
          status?: 'pending' | 'accepted' | 'expired' | 'revoked'
          invited_by?: string | null
          expires_at?: string
          accepted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          email?: string
          role_id?: string | null
          token?: string
          status?: 'pending' | 'accepted' | 'expired' | 'revoked'
          invited_by?: string | null
          expires_at?: string
          accepted_at?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_updated_at_column: () => void
      generate_reservation_code: () => string
      get_invitation_public: { Args: { p_token: string }; Returns: Json }
    }
    Enums: {
      // Enums are derived from text check constraints
    }
  }
}

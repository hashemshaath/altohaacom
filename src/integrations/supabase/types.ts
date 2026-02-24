export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      abandoned_carts: {
        Row: {
          cart_source: string | null
          created_at: string
          currency: string | null
          id: string
          items: Json
          recovered_at: string | null
          recovery_email_sent_at: string | null
          recovery_status: string | null
          session_id: string | null
          total_amount: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cart_source?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          items?: Json
          recovered_at?: string | null
          recovery_email_sent_at?: string | null
          recovery_status?: string | null
          session_id?: string | null
          total_amount?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cart_source?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          items?: Json
          recovered_at?: string | null
          recovery_email_sent_at?: string | null
          recovery_status?: string | null
          session_id?: string | null
          total_amount?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      account_sequences: {
        Row: {
          last_number: number
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          last_number?: number
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          last_number?: number
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      account_statements: {
        Row: {
          closing_balance: number
          created_at: string
          generated_at: string
          generated_by: string | null
          id: string
          opening_balance: number
          period_end: string
          period_start: string
          statement_number: string
          total_credits: number
          total_debits: number
          total_points_earned: number
          total_points_redeemed: number
          transaction_count: number
          wallet_id: string
        }
        Insert: {
          closing_balance?: number
          created_at?: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          opening_balance?: number
          period_end: string
          period_start: string
          statement_number: string
          total_credits?: number
          total_debits?: number
          total_points_earned?: number
          total_points_redeemed?: number
          transaction_count?: number
          wallet_id: string
        }
        Update: {
          closing_balance?: number
          created_at?: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          opening_balance?: number
          period_end?: string
          period_start?: string
          statement_number?: string
          total_credits?: number
          total_debits?: number
          total_points_earned?: number
          total_points_redeemed?: number
          transaction_count?: number
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_statements_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "user_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_campaigns: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          billing_model: string
          budget: number | null
          company_id: string
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          name_ar: string | null
          package_id: string | null
          priority: number | null
          rejection_reason: string | null
          spent: number | null
          start_date: string | null
          status: string
          target_countries: string[] | null
          target_interests: string[] | null
          target_roles: string[] | null
          total_clicks: number | null
          total_impressions: number | null
          total_views: number | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          billing_model?: string
          budget?: number | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          name_ar?: string | null
          package_id?: string | null
          priority?: number | null
          rejection_reason?: string | null
          spent?: number | null
          start_date?: string | null
          status?: string
          target_countries?: string[] | null
          target_interests?: string[] | null
          target_roles?: string[] | null
          total_clicks?: number | null
          total_impressions?: number | null
          total_views?: number | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          billing_model?: string
          budget?: number | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          name_ar?: string | null
          package_id?: string | null
          priority?: number | null
          rejection_reason?: string | null
          spent?: number | null
          start_date?: string | null
          status?: string
          target_countries?: string[] | null
          target_interests?: string[] | null
          target_roles?: string[] | null
          total_clicks?: number | null
          total_impressions?: number | null
          total_views?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_campaigns_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_campaigns_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "ad_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_clicks: {
        Row: {
          browser: string | null
          campaign_id: string
          cost: number | null
          country: string | null
          created_at: string | null
          creative_id: string
          destination_url: string | null
          device_type: string | null
          id: string
          page_url: string | null
          placement_id: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          browser?: string | null
          campaign_id: string
          cost?: number | null
          country?: string | null
          created_at?: string | null
          creative_id: string
          destination_url?: string | null
          device_type?: string | null
          id?: string
          page_url?: string | null
          placement_id: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          browser?: string | null
          campaign_id?: string
          cost?: number | null
          country?: string | null
          created_at?: string | null
          creative_id?: string
          destination_url?: string | null
          device_type?: string | null
          id?: string
          page_url?: string | null
          placement_id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_clicks_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_clicks_creative_id_fkey"
            columns: ["creative_id"]
            isOneToOne: false
            referencedRelation: "ad_creatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_clicks_placement_id_fkey"
            columns: ["placement_id"]
            isOneToOne: false
            referencedRelation: "ad_placements"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_creatives: {
        Row: {
          body_text: string | null
          body_text_ar: string | null
          campaign_id: string
          clicks: number | null
          created_at: string | null
          cta_text: string | null
          cta_text_ar: string | null
          destination_url: string
          format: string
          id: string
          image_url: string | null
          impressions: number | null
          is_active: boolean | null
          placement_id: string
          rejection_reason: string | null
          status: string | null
          title: string | null
          title_ar: string | null
          updated_at: string | null
          video_url: string | null
          views: number | null
        }
        Insert: {
          body_text?: string | null
          body_text_ar?: string | null
          campaign_id: string
          clicks?: number | null
          created_at?: string | null
          cta_text?: string | null
          cta_text_ar?: string | null
          destination_url: string
          format?: string
          id?: string
          image_url?: string | null
          impressions?: number | null
          is_active?: boolean | null
          placement_id: string
          rejection_reason?: string | null
          status?: string | null
          title?: string | null
          title_ar?: string | null
          updated_at?: string | null
          video_url?: string | null
          views?: number | null
        }
        Update: {
          body_text?: string | null
          body_text_ar?: string | null
          campaign_id?: string
          clicks?: number | null
          created_at?: string | null
          cta_text?: string | null
          cta_text_ar?: string | null
          destination_url?: string
          format?: string
          id?: string
          image_url?: string | null
          impressions?: number | null
          is_active?: boolean | null
          placement_id?: string
          rejection_reason?: string | null
          status?: string | null
          title?: string | null
          title_ar?: string | null
          updated_at?: string | null
          video_url?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_creatives_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_creatives_placement_id_fkey"
            columns: ["placement_id"]
            isOneToOne: false
            referencedRelation: "ad_placements"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_impressions: {
        Row: {
          browser: string | null
          campaign_id: string
          cost: number | null
          country: string | null
          created_at: string | null
          creative_id: string
          device_type: string | null
          id: string
          page_url: string | null
          placement_id: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          browser?: string | null
          campaign_id: string
          cost?: number | null
          country?: string | null
          created_at?: string | null
          creative_id: string
          device_type?: string | null
          id?: string
          page_url?: string | null
          placement_id: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          browser?: string | null
          campaign_id?: string
          cost?: number | null
          country?: string | null
          created_at?: string | null
          creative_id?: string
          device_type?: string | null
          id?: string
          page_url?: string | null
          placement_id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_impressions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_impressions_creative_id_fkey"
            columns: ["creative_id"]
            isOneToOne: false
            referencedRelation: "ad_creatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_impressions_placement_id_fkey"
            columns: ["placement_id"]
            isOneToOne: false
            referencedRelation: "ad_placements"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_packages: {
        Row: {
          created_at: string | null
          currency: string | null
          description: string | null
          description_ar: string | null
          duration_days: number | null
          features: Json | null
          id: string
          included_placements: string[] | null
          is_active: boolean | null
          max_campaigns: number | null
          max_clicks: number | null
          max_impressions: number | null
          name: string
          name_ar: string | null
          price: number
          sort_order: number | null
          tier: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          description_ar?: string | null
          duration_days?: number | null
          features?: Json | null
          id?: string
          included_placements?: string[] | null
          is_active?: boolean | null
          max_campaigns?: number | null
          max_clicks?: number | null
          max_impressions?: number | null
          name: string
          name_ar?: string | null
          price?: number
          sort_order?: number | null
          tier?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          description_ar?: string | null
          duration_days?: number | null
          features?: Json | null
          id?: string
          included_placements?: string[] | null
          is_active?: boolean | null
          max_campaigns?: number | null
          max_clicks?: number | null
          max_impressions?: number | null
          name?: string
          name_ar?: string | null
          price?: number
          sort_order?: number | null
          tier?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ad_placements: {
        Row: {
          base_cpc: number | null
          base_cpm: number | null
          base_cpv: number | null
          created_at: string | null
          description: string | null
          description_ar: string | null
          format: string
          height: number | null
          id: string
          is_active: boolean | null
          is_premium: boolean | null
          max_ads: number | null
          name: string
          name_ar: string | null
          page_location: string | null
          placement_type: string
          position: string | null
          slug: string
          sort_order: number | null
          updated_at: string | null
          width: number | null
        }
        Insert: {
          base_cpc?: number | null
          base_cpm?: number | null
          base_cpv?: number | null
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          format?: string
          height?: number | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          max_ads?: number | null
          name: string
          name_ar?: string | null
          page_location?: string | null
          placement_type?: string
          position?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string | null
          width?: number | null
        }
        Update: {
          base_cpc?: number | null
          base_cpm?: number | null
          base_cpv?: number | null
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          format?: string
          height?: number | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          max_ads?: number | null
          name?: string
          name_ar?: string | null
          page_location?: string | null
          placement_type?: string
          position?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
          width?: number | null
        }
        Relationships: []
      }
      ad_requests: {
        Row: {
          admin_notes: string | null
          budget: number | null
          company_id: string
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string | null
          description_ar: string | null
          desired_end_date: string | null
          desired_placements: string[] | null
          desired_start_date: string | null
          id: string
          materials_urls: string[] | null
          package_id: string | null
          request_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          title: string
          title_ar: string | null
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          budget?: number | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          description_ar?: string | null
          desired_end_date?: string | null
          desired_placements?: string[] | null
          desired_start_date?: string | null
          id?: string
          materials_urls?: string[] | null
          package_id?: string | null
          request_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          title: string
          title_ar?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          budget?: number | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          description_ar?: string | null
          desired_end_date?: string | null
          desired_placements?: string[] | null
          desired_start_date?: string | null
          id?: string
          materials_urls?: string[] | null
          package_id?: string | null
          request_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          title?: string
          title_ar?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_requests_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "ad_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_section_sponsorships: {
        Row: {
          campaign_id: string
          company_id: string
          created_at: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          label: string | null
          label_ar: string | null
          logo_url: string | null
          section_id: string | null
          section_type: string
          start_date: string | null
        }
        Insert: {
          campaign_id: string
          company_id: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          label?: string | null
          label_ar?: string | null
          logo_url?: string | null
          section_id?: string | null
          section_type: string
          start_date?: string | null
        }
        Update: {
          campaign_id?: string
          company_id?: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          label?: string | null
          label_ar?: string | null
          logo_url?: string | null
          section_id?: string | null
          section_type?: string
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_section_sponsorships_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_section_sponsorships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_user_behaviors: {
        Row: {
          browser: string | null
          country: string | null
          created_at: string
          device_type: string | null
          duration_seconds: number | null
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          metadata: Json | null
          page_category: string | null
          page_url: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          browser?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          duration_seconds?: number | null
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          page_category?: string | null
          page_url?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          browser?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          duration_seconds?: number | null
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          page_category?: string | null
          page_url?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ad_user_interests: {
        Row: {
          created_at: string
          id: string
          interaction_count: number | null
          interest_category: string
          last_interaction_at: string | null
          score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interaction_count?: number | null
          interest_category: string
          last_interaction_at?: string | null
          score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interaction_count?: number | null
          interest_category?: string
          last_interaction_at?: string | null
          score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_actions: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      ai_analytics_reports: {
        Row: {
          content: string
          created_at: string
          data_snapshot: Json | null
          generated_at: string
          id: string
          language: string
          report_type: string
        }
        Insert: {
          content: string
          created_at?: string
          data_snapshot?: Json | null
          generated_at?: string
          id?: string
          language?: string
          report_type?: string
        }
        Update: {
          content?: string
          created_at?: string
          data_snapshot?: Json | null
          generated_at?: string
          id?: string
          language?: string
          report_type?: string
        }
        Relationships: []
      }
      article_tags: {
        Row: {
          article_id: string
          tag_id: string
        }
        Insert: {
          article_id: string
          tag_id: string
        }
        Update: {
          article_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_tags_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "content_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          author_id: string | null
          category_id: string | null
          content: string
          content_ar: string | null
          created_at: string
          event_end: string | null
          event_location: string | null
          event_location_ar: string | null
          event_start: string | null
          excerpt: string | null
          excerpt_ar: string | null
          featured_image_url: string | null
          gallery_urls: string[] | null
          id: string
          is_featured: boolean | null
          metadata: Json | null
          published_at: string | null
          slug: string
          status: string | null
          title: string
          title_ar: string | null
          type: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          author_id?: string | null
          category_id?: string | null
          content: string
          content_ar?: string | null
          created_at?: string
          event_end?: string | null
          event_location?: string | null
          event_location_ar?: string | null
          event_start?: string | null
          excerpt?: string | null
          excerpt_ar?: string | null
          featured_image_url?: string | null
          gallery_urls?: string[] | null
          id?: string
          is_featured?: boolean | null
          metadata?: Json | null
          published_at?: string | null
          slug: string
          status?: string | null
          title: string
          title_ar?: string | null
          type: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          author_id?: string | null
          category_id?: string | null
          content?: string
          content_ar?: string | null
          created_at?: string
          event_end?: string | null
          event_location?: string | null
          event_location_ar?: string | null
          event_start?: string | null
          excerpt?: string | null
          excerpt_ar?: string | null
          featured_image_url?: string | null
          gallery_urls?: string[] | null
          id?: string
          is_featured?: boolean | null
          metadata?: Json | null
          published_at?: string | null
          slug?: string
          status?: string | null
          title?: string
          title_ar?: string | null
          type?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "content_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      audience_segments: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          description_ar: string | null
          estimated_reach: number | null
          filters: Json
          id: string
          is_active: boolean | null
          last_used_at: string | null
          name: string
          name_ar: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          description_ar?: string | null
          estimated_reach?: number | null
          filters?: Json
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          name: string
          name_ar?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          description_ar?: string | null
          estimated_reach?: number | null
          filters?: Json
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          name?: string
          name_ar?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      automation_runs: {
        Row: {
          action: string
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          results: Json | null
          started_at: string
          status: string
          triggered_by: string | null
        }
        Insert: {
          action: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          results?: Json | null
          started_at?: string
          status?: string
          triggered_by?: string | null
        }
        Update: {
          action?: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          results?: Json | null
          started_at?: string
          status?: string
          triggered_by?: string | null
        }
        Relationships: []
      }
      blind_judging_codes: {
        Row: {
          blind_code: string
          competition_id: string
          created_at: string | null
          id: string
          registration_id: string
          round_id: string | null
        }
        Insert: {
          blind_code: string
          competition_id: string
          created_at?: string | null
          id?: string
          registration_id: string
          round_id?: string | null
        }
        Update: {
          blind_code?: string
          competition_id?: string
          created_at?: string | null
          id?: string
          registration_id?: string
          round_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blind_judging_codes_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blind_judging_codes_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blind_judging_codes_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "competition_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blind_judging_codes_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "competition_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      bonus_campaigns: {
        Row: {
          badge_text: string | null
          badge_text_ar: string | null
          banner_color: string | null
          bonus_points: number | null
          campaign_type: string
          created_at: string | null
          created_by: string | null
          description: string | null
          description_ar: string | null
          ends_at: string
          id: string
          is_active: boolean | null
          multiplier: number | null
          name: string
          name_ar: string | null
          starts_at: string
          target_actions: string[] | null
          updated_at: string | null
        }
        Insert: {
          badge_text?: string | null
          badge_text_ar?: string | null
          banner_color?: string | null
          bonus_points?: number | null
          campaign_type?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          ends_at: string
          id?: string
          is_active?: boolean | null
          multiplier?: number | null
          name: string
          name_ar?: string | null
          starts_at: string
          target_actions?: string[] | null
          updated_at?: string | null
        }
        Update: {
          badge_text?: string | null
          badge_text_ar?: string | null
          banner_color?: string | null
          bonus_points?: number | null
          campaign_type?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          ends_at?: string
          id?: string
          is_active?: boolean | null
          multiplier?: number | null
          name?: string
          name_ar?: string | null
          starts_at?: string
          target_actions?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      bulk_imports: {
        Row: {
          created_at: string
          created_by: string | null
          entity_type: string
          errors: Json | null
          failed_rows: number | null
          file_name: string | null
          id: string
          imported_data: Json | null
          notes: string | null
          processed_rows: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          total_rows: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          entity_type: string
          errors?: Json | null
          failed_rows?: number | null
          file_name?: string | null
          id?: string
          imported_data?: Json | null
          notes?: string | null
          processed_rows?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          total_rows?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          entity_type?: string
          errors?: Json | null
          failed_rows?: number | null
          file_name?: string | null
          id?: string
          imported_data?: Json | null
          notes?: string | null
          processed_rows?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          total_rows?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      certificate_logos: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          is_sponsor: boolean | null
          logo_url: string
          name: string
          name_ar: string | null
          organization: string | null
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_sponsor?: boolean | null
          logo_url: string
          name: string
          name_ar?: string | null
          organization?: string | null
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_sponsor?: boolean | null
          logo_url?: string
          name?: string
          name_ar?: string | null
          organization?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      certificate_signatures: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          name: string
          name_ar: string | null
          organization: string | null
          organization_ar: string | null
          signature_image_url: string | null
          title: string
          title_ar: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_ar?: string | null
          organization?: string | null
          organization_ar?: string | null
          signature_image_url?: string | null
          title: string
          title_ar?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_ar?: string | null
          organization?: string | null
          organization_ar?: string | null
          signature_image_url?: string | null
          title?: string
          title_ar?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      certificate_templates: {
        Row: {
          background_color: string | null
          body_font: string | null
          body_template: string
          body_template_ar: string | null
          border_color: string | null
          border_style: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          description_ar: string | null
          footer_logos: Json | null
          header_logos: Json | null
          id: string
          is_active: boolean | null
          name: string
          name_ar: string | null
          signature_positions: Json | null
          title_font: string | null
          title_text: string
          title_text_ar: string | null
          type: Database["public"]["Enums"]["certificate_type"]
          updated_at: string | null
        }
        Insert: {
          background_color?: string | null
          body_font?: string | null
          body_template: string
          body_template_ar?: string | null
          border_color?: string | null
          border_style?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          footer_logos?: Json | null
          header_logos?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          name_ar?: string | null
          signature_positions?: Json | null
          title_font?: string | null
          title_text?: string
          title_text_ar?: string | null
          type: Database["public"]["Enums"]["certificate_type"]
          updated_at?: string | null
        }
        Update: {
          background_color?: string | null
          body_font?: string | null
          body_template?: string
          body_template_ar?: string | null
          border_color?: string | null
          border_style?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          footer_logos?: Json | null
          header_logos?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_ar?: string | null
          signature_positions?: Json | null
          title_font?: string | null
          title_text?: string
          title_text_ar?: string | null
          type?: Database["public"]["Enums"]["certificate_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      certificate_verifications: {
        Row: {
          certificate_id: string
          id: string
          ip_address: string | null
          user_agent: string | null
          verification_code: string
          verified_at: string | null
        }
        Insert: {
          certificate_id: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          verification_code: string
          verified_at?: string | null
        }
        Update: {
          certificate_id?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          verification_code?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificate_verifications_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "certificates"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          achievement: string | null
          achievement_ar: string | null
          certificate_number: string
          competition_id: string | null
          created_at: string | null
          downloaded_count: number | null
          event_date: string | null
          event_location: string | null
          event_location_ar: string | null
          event_name: string | null
          event_name_ar: string | null
          id: string
          issued_at: string | null
          issued_by: string | null
          last_downloaded_at: string | null
          logos: Json | null
          recipient_email: string | null
          recipient_id: string | null
          recipient_name: string
          recipient_name_ar: string | null
          revoke_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          sent_at: string | null
          sent_to_email: string | null
          signatures: Json | null
          signed_at: string | null
          signed_by: string | null
          status: Database["public"]["Enums"]["certificate_status"] | null
          template_id: string
          type: Database["public"]["Enums"]["certificate_type"]
          updated_at: string | null
          verification_code: string
          visibility: string
        }
        Insert: {
          achievement?: string | null
          achievement_ar?: string | null
          certificate_number?: string
          competition_id?: string | null
          created_at?: string | null
          downloaded_count?: number | null
          event_date?: string | null
          event_location?: string | null
          event_location_ar?: string | null
          event_name?: string | null
          event_name_ar?: string | null
          id?: string
          issued_at?: string | null
          issued_by?: string | null
          last_downloaded_at?: string | null
          logos?: Json | null
          recipient_email?: string | null
          recipient_id?: string | null
          recipient_name: string
          recipient_name_ar?: string | null
          revoke_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          sent_at?: string | null
          sent_to_email?: string | null
          signatures?: Json | null
          signed_at?: string | null
          signed_by?: string | null
          status?: Database["public"]["Enums"]["certificate_status"] | null
          template_id: string
          type: Database["public"]["Enums"]["certificate_type"]
          updated_at?: string | null
          verification_code: string
          visibility?: string
        }
        Update: {
          achievement?: string | null
          achievement_ar?: string | null
          certificate_number?: string
          competition_id?: string | null
          created_at?: string | null
          downloaded_count?: number | null
          event_date?: string | null
          event_location?: string | null
          event_location_ar?: string | null
          event_name?: string | null
          event_name_ar?: string | null
          id?: string
          issued_at?: string | null
          issued_by?: string | null
          last_downloaded_at?: string | null
          logos?: Json | null
          recipient_email?: string | null
          recipient_id?: string | null
          recipient_name?: string
          recipient_name_ar?: string | null
          revoke_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          sent_at?: string | null
          sent_to_email?: string | null
          signatures?: Json | null
          signed_at?: string | null
          signed_by?: string | null
          status?: Database["public"]["Enums"]["certificate_status"] | null
          template_id?: string
          type?: Database["public"]["Enums"]["certificate_type"]
          updated_at?: string | null
          verification_code?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "certificate_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "chat_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_group_messages: {
        Row: {
          attachment_names: string[] | null
          attachment_urls: string[] | null
          content: string
          created_at: string
          group_id: string
          id: string
          message_type: string
          metadata: Json | null
          sender_id: string
        }
        Insert: {
          attachment_names?: string[] | null
          attachment_urls?: string[] | null
          content?: string
          created_at?: string
          group_id: string
          id?: string
          message_type?: string
          metadata?: Json | null
          sender_id: string
        }
        Update: {
          attachment_names?: string[] | null
          attachment_urls?: string[] | null
          content?: string
          created_at?: string
          group_id?: string
          id?: string
          message_type?: string
          metadata?: Json | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "chat_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_groups: {
        Row: {
          avatar_url: string | null
          created_at: string
          created_by: string
          id: string
          name: string
          name_ar: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          created_by: string
          id?: string
          name: string
          name_ar?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          name_ar?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      chat_session_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          message_type: string | null
          sender_id: string
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          message_type?: string | null
          sender_id: string
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          message_type?: string | null
          sender_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_session_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          agent_id: string | null
          created_at: string
          ended_at: string | null
          feedback: string | null
          id: string
          rating: number | null
          started_at: string
          status: string
          subject: string | null
          subject_ar: string | null
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          ended_at?: string | null
          feedback?: string | null
          id?: string
          rating?: number | null
          started_at?: string
          status?: string
          subject?: string | null
          subject_ar?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          ended_at?: string | null
          feedback?: string | null
          id?: string
          rating?: number | null
          started_at?: string
          status?: string
          subject?: string | null
          subject_ar?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chef_cost_profiles: {
        Row: {
          accommodation_currency: string | null
          chef_id: string
          city: string | null
          country_code: string | null
          created_at: string
          created_by: string | null
          daily_allowance: number | null
          estimated_days: number | null
          estimated_total_cost: number | null
          evaluation_fee: number | null
          fee_currency: string | null
          flight_cost_estimate: number | null
          hotel_cost_per_night: number | null
          id: string
          is_active: boolean | null
          local_transport_cost: number | null
          notes: string | null
          notes_ar: string | null
          preferred_hotel: string | null
          preferred_hotel_ar: string | null
          transport_currency: string | null
          transport_notes: string | null
          updated_at: string
          visa_currency: string | null
          visa_fee: number | null
          visa_required: boolean | null
          visa_type: string | null
          visa_valid_until: string | null
        }
        Insert: {
          accommodation_currency?: string | null
          chef_id: string
          city?: string | null
          country_code?: string | null
          created_at?: string
          created_by?: string | null
          daily_allowance?: number | null
          estimated_days?: number | null
          estimated_total_cost?: number | null
          evaluation_fee?: number | null
          fee_currency?: string | null
          flight_cost_estimate?: number | null
          hotel_cost_per_night?: number | null
          id?: string
          is_active?: boolean | null
          local_transport_cost?: number | null
          notes?: string | null
          notes_ar?: string | null
          preferred_hotel?: string | null
          preferred_hotel_ar?: string | null
          transport_currency?: string | null
          transport_notes?: string | null
          updated_at?: string
          visa_currency?: string | null
          visa_fee?: number | null
          visa_required?: boolean | null
          visa_type?: string | null
          visa_valid_until?: string | null
        }
        Update: {
          accommodation_currency?: string | null
          chef_id?: string
          city?: string | null
          country_code?: string | null
          created_at?: string
          created_by?: string | null
          daily_allowance?: number | null
          estimated_days?: number | null
          estimated_total_cost?: number | null
          evaluation_fee?: number | null
          fee_currency?: string | null
          flight_cost_estimate?: number | null
          hotel_cost_per_night?: number | null
          id?: string
          is_active?: boolean | null
          local_transport_cost?: number | null
          notes?: string | null
          notes_ar?: string | null
          preferred_hotel?: string | null
          preferred_hotel_ar?: string | null
          transport_currency?: string | null
          transport_notes?: string | null
          updated_at?: string
          visa_currency?: string | null
          visa_fee?: number | null
          visa_required?: boolean | null
          visa_type?: string | null
          visa_valid_until?: string | null
        }
        Relationships: []
      }
      chef_establishment_associations: {
        Row: {
          association_type: string
          created_at: string
          department: string | null
          department_ar: string | null
          description: string | null
          description_ar: string | null
          end_date: string | null
          establishment_id: string
          id: string
          is_current: boolean | null
          role_title: string | null
          role_title_ar: string | null
          start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          association_type?: string
          created_at?: string
          department?: string | null
          department_ar?: string | null
          description?: string | null
          description_ar?: string | null
          end_date?: string | null
          establishment_id: string
          id?: string
          is_current?: boolean | null
          role_title?: string | null
          role_title_ar?: string | null
          start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          association_type?: string
          created_at?: string
          department?: string | null
          department_ar?: string | null
          description?: string | null
          description_ar?: string | null
          end_date?: string | null
          establishment_id?: string
          id?: string
          is_current?: boolean | null
          role_title?: string | null
          role_title_ar?: string | null
          start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chef_establishment_associations_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      chef_establishment_qualifications: {
        Row: {
          association_id: string
          created_at: string
          credential_id: string | null
          description: string | null
          description_ar: string | null
          expiry_date: string | null
          id: string
          issued_date: string | null
          qualification_name: string
          qualification_name_ar: string | null
          qualification_type: string | null
          user_id: string
        }
        Insert: {
          association_id: string
          created_at?: string
          credential_id?: string | null
          description?: string | null
          description_ar?: string | null
          expiry_date?: string | null
          id?: string
          issued_date?: string | null
          qualification_name: string
          qualification_name_ar?: string | null
          qualification_type?: string | null
          user_id: string
        }
        Update: {
          association_id?: string
          created_at?: string
          credential_id?: string | null
          description?: string | null
          description_ar?: string | null
          expiry_date?: string | null
          id?: string
          issued_date?: string | null
          qualification_name?: string
          qualification_name_ar?: string | null
          qualification_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chef_establishment_qualifications_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "chef_establishment_associations"
            referencedColumns: ["id"]
          },
        ]
      }
      chef_evaluation_registrations: {
        Row: {
          availability_end: string | null
          availability_start: string | null
          chef_id: string
          created_at: string
          experience_years: number | null
          id: string
          matched_at: string | null
          matched_by: string | null
          motivation: string | null
          motivation_ar: string | null
          preferred_city: string | null
          preferred_country_code: string | null
          session_id: string | null
          specialties: string[] | null
          status: string
          updated_at: string
        }
        Insert: {
          availability_end?: string | null
          availability_start?: string | null
          chef_id: string
          created_at?: string
          experience_years?: number | null
          id?: string
          matched_at?: string | null
          matched_by?: string | null
          motivation?: string | null
          motivation_ar?: string | null
          preferred_city?: string | null
          preferred_country_code?: string | null
          session_id?: string | null
          specialties?: string[] | null
          status?: string
          updated_at?: string
        }
        Update: {
          availability_end?: string | null
          availability_start?: string | null
          chef_id?: string
          created_at?: string
          experience_years?: number | null
          id?: string
          matched_at?: string | null
          matched_by?: string | null
          motivation?: string | null
          motivation_ar?: string | null
          preferred_city?: string | null
          preferred_country_code?: string | null
          session_id?: string | null
          specialties?: string[] | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      chef_rankings: {
        Row: {
          average_score: number | null
          bronze_medals: number
          competitions_entered: number
          competitions_won: number
          country_code: string | null
          gold_medals: number
          id: string
          period_value: string | null
          previous_rank: number | null
          rank: number | null
          rank_change: number | null
          ranking_period: string
          silver_medals: number
          specialty: string | null
          total_points: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          average_score?: number | null
          bronze_medals?: number
          competitions_entered?: number
          competitions_won?: number
          country_code?: string | null
          gold_medals?: number
          id?: string
          period_value?: string | null
          previous_rank?: number | null
          rank?: number | null
          rank_change?: number | null
          ranking_period?: string
          silver_medals?: number
          specialty?: string | null
          total_points?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          average_score?: number | null
          bronze_medals?: number
          competitions_entered?: number
          competitions_won?: number
          country_code?: string | null
          gold_medals?: number
          id?: string
          period_value?: string | null
          previous_rank?: number | null
          rank?: number | null
          rank_change?: number | null
          ranking_period?: string
          silver_medals?: number
          specialty?: string | null
          total_points?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chef_schedule_events: {
        Row: {
          all_day: boolean | null
          attachments: string[] | null
          broadcast_type: string | null
          channel_name: string | null
          channel_name_ar: string | null
          chef_id: string
          city: string | null
          color: string | null
          contract_status: string | null
          country_code: string | null
          created_at: string
          created_by: string | null
          description: string | null
          description_ar: string | null
          end_date: string
          event_type: string
          fee_amount: number | null
          fee_currency: string | null
          id: string
          internal_notes: string | null
          is_contracted: boolean | null
          is_recurring: boolean | null
          linked_entity_id: string | null
          linked_entity_type: string | null
          location: string | null
          location_ar: string | null
          media_url: string | null
          notes: string | null
          notes_ar: string | null
          organizer: string | null
          organizer_ar: string | null
          parent_event_id: string | null
          participation_type: string | null
          participation_type_ar: string | null
          priority: string | null
          program_name: string | null
          program_name_ar: string | null
          recurrence_end_date: string | null
          recurrence_rule: string | null
          show_details_publicly: boolean | null
          start_date: string
          status: string
          tags: string[] | null
          timezone: string | null
          title: string
          title_ar: string | null
          updated_at: string
          updated_by: string | null
          venue: string | null
          venue_ar: string | null
          visibility: string
        }
        Insert: {
          all_day?: boolean | null
          attachments?: string[] | null
          broadcast_type?: string | null
          channel_name?: string | null
          channel_name_ar?: string | null
          chef_id: string
          city?: string | null
          color?: string | null
          contract_status?: string | null
          country_code?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          end_date: string
          event_type?: string
          fee_amount?: number | null
          fee_currency?: string | null
          id?: string
          internal_notes?: string | null
          is_contracted?: boolean | null
          is_recurring?: boolean | null
          linked_entity_id?: string | null
          linked_entity_type?: string | null
          location?: string | null
          location_ar?: string | null
          media_url?: string | null
          notes?: string | null
          notes_ar?: string | null
          organizer?: string | null
          organizer_ar?: string | null
          parent_event_id?: string | null
          participation_type?: string | null
          participation_type_ar?: string | null
          priority?: string | null
          program_name?: string | null
          program_name_ar?: string | null
          recurrence_end_date?: string | null
          recurrence_rule?: string | null
          show_details_publicly?: boolean | null
          start_date: string
          status?: string
          tags?: string[] | null
          timezone?: string | null
          title: string
          title_ar?: string | null
          updated_at?: string
          updated_by?: string | null
          venue?: string | null
          venue_ar?: string | null
          visibility?: string
        }
        Update: {
          all_day?: boolean | null
          attachments?: string[] | null
          broadcast_type?: string | null
          channel_name?: string | null
          channel_name_ar?: string | null
          chef_id?: string
          city?: string | null
          color?: string | null
          contract_status?: string | null
          country_code?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          end_date?: string
          event_type?: string
          fee_amount?: number | null
          fee_currency?: string | null
          id?: string
          internal_notes?: string | null
          is_contracted?: boolean | null
          is_recurring?: boolean | null
          linked_entity_id?: string | null
          linked_entity_type?: string | null
          location?: string | null
          location_ar?: string | null
          media_url?: string | null
          notes?: string | null
          notes_ar?: string | null
          organizer?: string | null
          organizer_ar?: string | null
          parent_event_id?: string | null
          participation_type?: string | null
          participation_type_ar?: string | null
          priority?: string | null
          program_name?: string | null
          program_name_ar?: string | null
          recurrence_end_date?: string | null
          recurrence_rule?: string | null
          show_details_publicly?: boolean | null
          start_date?: string
          status?: string
          tags?: string[] | null
          timezone?: string | null
          title?: string
          title_ar?: string | null
          updated_at?: string
          updated_by?: string | null
          venue?: string | null
          venue_ar?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "chef_schedule_events_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "chef_schedule_events"
            referencedColumns: ["id"]
          },
        ]
      }
      chef_schedule_settings: {
        Row: {
          auto_sync_chefs_table: boolean | null
          auto_sync_competitions: boolean | null
          auto_sync_exhibitions: boolean | null
          chef_id: string
          created_at: string
          default_visibility: string | null
          id: string
          share_publicly: boolean | null
          share_with_management: boolean | null
          show_availability_on_profile: boolean | null
          unavailable_message: string | null
          unavailable_message_ar: string | null
          updated_at: string
          working_days: number[] | null
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          auto_sync_chefs_table?: boolean | null
          auto_sync_competitions?: boolean | null
          auto_sync_exhibitions?: boolean | null
          chef_id: string
          created_at?: string
          default_visibility?: string | null
          id?: string
          share_publicly?: boolean | null
          share_with_management?: boolean | null
          show_availability_on_profile?: boolean | null
          unavailable_message?: string | null
          unavailable_message_ar?: string | null
          updated_at?: string
          working_days?: number[] | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          auto_sync_chefs_table?: boolean | null
          auto_sync_competitions?: boolean | null
          auto_sync_exhibitions?: boolean | null
          chef_id?: string
          created_at?: string
          default_visibility?: string | null
          id?: string
          share_publicly?: boolean | null
          share_with_management?: boolean | null
          show_availability_on_profile?: boolean | null
          unavailable_message?: string | null
          unavailable_message_ar?: string | null
          updated_at?: string
          working_days?: number[] | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: []
      }
      chef_travel_records: {
        Row: {
          chef_id: string
          created_at: string
          created_by: string | null
          currency: string | null
          daily_allowance_total: number | null
          destination_city: string | null
          destination_country_code: string | null
          flight_cost: number | null
          hotel_cost: number | null
          hotel_name: string | null
          hotel_nights: number | null
          id: string
          local_transport_cost: number | null
          notes: string | null
          notes_ar: string | null
          other_costs: number | null
          return_date: string | null
          session_id: string | null
          total_cost: number | null
          travel_date: string | null
          updated_at: string
          visa_cost: number | null
          visa_expiry_date: string | null
          visa_issued_date: string | null
          visa_number: string | null
          visa_type: string | null
        }
        Insert: {
          chef_id: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          daily_allowance_total?: number | null
          destination_city?: string | null
          destination_country_code?: string | null
          flight_cost?: number | null
          hotel_cost?: number | null
          hotel_name?: string | null
          hotel_nights?: number | null
          id?: string
          local_transport_cost?: number | null
          notes?: string | null
          notes_ar?: string | null
          other_costs?: number | null
          return_date?: string | null
          session_id?: string | null
          total_cost?: number | null
          travel_date?: string | null
          updated_at?: string
          visa_cost?: number | null
          visa_expiry_date?: string | null
          visa_issued_date?: string | null
          visa_number?: string | null
          visa_type?: string | null
        }
        Update: {
          chef_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          daily_allowance_total?: number | null
          destination_city?: string | null
          destination_country_code?: string | null
          flight_cost?: number | null
          hotel_cost?: number | null
          hotel_name?: string | null
          hotel_nights?: number | null
          id?: string
          local_transport_cost?: number | null
          notes?: string | null
          notes_ar?: string | null
          other_costs?: number | null
          return_date?: string | null
          session_id?: string | null
          total_cost?: number | null
          travel_date?: string | null
          updated_at?: string
          visa_cost?: number | null
          visa_expiry_date?: string | null
          visa_issued_date?: string | null
          visa_number?: string | null
          visa_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chef_travel_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chefs_table_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chefs_table_criteria_presets: {
        Row: {
          created_at: string
          criteria: Json
          id: string
          is_system: boolean | null
          preset_name: string
          preset_name_ar: string | null
          product_category: string
        }
        Insert: {
          created_at?: string
          criteria?: Json
          id?: string
          is_system?: boolean | null
          preset_name: string
          preset_name_ar?: string | null
          product_category?: string
        }
        Update: {
          created_at?: string
          criteria?: Json
          id?: string
          is_system?: boolean | null
          preset_name?: string
          preset_name_ar?: string | null
          product_category?: string
        }
        Relationships: []
      }
      chefs_table_evaluations: {
        Row: {
          allow_publish: boolean | null
          aroma_score: number | null
          chef_id: string
          cons: string | null
          cons_ar: string | null
          cooking_experience: string | null
          cooking_experience_ar: string | null
          created_at: string
          dishes_prepared: string | null
          dishes_prepared_ar: string | null
          endorsement_text: string | null
          endorsement_text_ar: string | null
          id: string
          invitation_id: string
          is_recommended: boolean | null
          overall_score: number | null
          presentation_score: number | null
          pros: string | null
          pros_ar: string | null
          recommendation_level: string | null
          review_text: string | null
          review_text_ar: string | null
          review_title: string | null
          review_title_ar: string | null
          session_id: string
          status: string
          submitted_at: string | null
          taste_score: number | null
          texture_score: number | null
          updated_at: string
          usage_suggestions: string | null
          usage_suggestions_ar: string | null
          value_score: number | null
          versatility_score: number | null
        }
        Insert: {
          allow_publish?: boolean | null
          aroma_score?: number | null
          chef_id: string
          cons?: string | null
          cons_ar?: string | null
          cooking_experience?: string | null
          cooking_experience_ar?: string | null
          created_at?: string
          dishes_prepared?: string | null
          dishes_prepared_ar?: string | null
          endorsement_text?: string | null
          endorsement_text_ar?: string | null
          id?: string
          invitation_id: string
          is_recommended?: boolean | null
          overall_score?: number | null
          presentation_score?: number | null
          pros?: string | null
          pros_ar?: string | null
          recommendation_level?: string | null
          review_text?: string | null
          review_text_ar?: string | null
          review_title?: string | null
          review_title_ar?: string | null
          session_id: string
          status?: string
          submitted_at?: string | null
          taste_score?: number | null
          texture_score?: number | null
          updated_at?: string
          usage_suggestions?: string | null
          usage_suggestions_ar?: string | null
          value_score?: number | null
          versatility_score?: number | null
        }
        Update: {
          allow_publish?: boolean | null
          aroma_score?: number | null
          chef_id?: string
          cons?: string | null
          cons_ar?: string | null
          cooking_experience?: string | null
          cooking_experience_ar?: string | null
          created_at?: string
          dishes_prepared?: string | null
          dishes_prepared_ar?: string | null
          endorsement_text?: string | null
          endorsement_text_ar?: string | null
          id?: string
          invitation_id?: string
          is_recommended?: boolean | null
          overall_score?: number | null
          presentation_score?: number | null
          pros?: string | null
          pros_ar?: string | null
          recommendation_level?: string | null
          review_text?: string | null
          review_text_ar?: string | null
          review_title?: string | null
          review_title_ar?: string | null
          session_id?: string
          status?: string
          submitted_at?: string | null
          taste_score?: number | null
          texture_score?: number | null
          updated_at?: string
          usage_suggestions?: string | null
          usage_suggestions_ar?: string | null
          value_score?: number | null
          versatility_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chefs_table_evaluations_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "chefs_table_invitations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chefs_table_evaluations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chefs_table_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chefs_table_invitations: {
        Row: {
          chef_id: string
          confirmed_at: string | null
          cooking_date: string | null
          cooking_location: string | null
          cooking_location_ar: string | null
          created_at: string
          declined_reason: string | null
          id: string
          invitation_message: string | null
          invitation_message_ar: string | null
          invited_by: string
          responded_at: string | null
          response_message: string | null
          sample_shipped_at: string | null
          sample_tracking_number: string | null
          session_id: string
          status: string
          updated_at: string
        }
        Insert: {
          chef_id: string
          confirmed_at?: string | null
          cooking_date?: string | null
          cooking_location?: string | null
          cooking_location_ar?: string | null
          created_at?: string
          declined_reason?: string | null
          id?: string
          invitation_message?: string | null
          invitation_message_ar?: string | null
          invited_by: string
          responded_at?: string | null
          response_message?: string | null
          sample_shipped_at?: string | null
          sample_tracking_number?: string | null
          session_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          chef_id?: string
          confirmed_at?: string | null
          cooking_date?: string | null
          cooking_location?: string | null
          cooking_location_ar?: string | null
          created_at?: string
          declined_reason?: string | null
          id?: string
          invitation_message?: string | null
          invitation_message_ar?: string | null
          invited_by?: string
          responded_at?: string | null
          response_message?: string | null
          sample_shipped_at?: string | null
          sample_tracking_number?: string | null
          session_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chefs_table_invitations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chefs_table_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chefs_table_media: {
        Row: {
          created_at: string
          description: string | null
          description_ar: string | null
          evaluation_id: string | null
          id: string
          is_featured: boolean | null
          media_type: string
          media_url: string
          session_id: string
          sort_order: number | null
          thumbnail_url: string | null
          title: string | null
          title_ar: string | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          evaluation_id?: string | null
          id?: string
          is_featured?: boolean | null
          media_type?: string
          media_url: string
          session_id: string
          sort_order?: number | null
          thumbnail_url?: string | null
          title?: string | null
          title_ar?: string | null
          uploaded_by: string
        }
        Update: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          evaluation_id?: string | null
          id?: string
          is_featured?: boolean | null
          media_type?: string
          media_url?: string
          session_id?: string
          sort_order?: number | null
          thumbnail_url?: string | null
          title?: string | null
          title_ar?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "chefs_table_media_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "chefs_table_evaluations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chefs_table_media_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chefs_table_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chefs_table_requests: {
        Row: {
          admin_notes: string | null
          budget: number | null
          chef_count: number | null
          company_id: string | null
          created_at: string
          currency: string | null
          description: string | null
          description_ar: string | null
          experience_type: string
          id: string
          preferred_city: string | null
          preferred_country_code: string | null
          preferred_date_end: string | null
          preferred_date_start: string | null
          preferred_venue: string | null
          preferred_venue_ar: string | null
          product_category: string
          product_description: string | null
          product_description_ar: string | null
          product_images: string[] | null
          product_name: string
          product_name_ar: string | null
          rejection_reason: string | null
          request_number: string | null
          requested_by: string
          reviewed_at: string | null
          reviewed_by: string | null
          special_requirements: string | null
          special_requirements_ar: string | null
          status: string
          title: string
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          budget?: number | null
          chef_count?: number | null
          company_id?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          description_ar?: string | null
          experience_type?: string
          id?: string
          preferred_city?: string | null
          preferred_country_code?: string | null
          preferred_date_end?: string | null
          preferred_date_start?: string | null
          preferred_venue?: string | null
          preferred_venue_ar?: string | null
          product_category?: string
          product_description?: string | null
          product_description_ar?: string | null
          product_images?: string[] | null
          product_name: string
          product_name_ar?: string | null
          rejection_reason?: string | null
          request_number?: string | null
          requested_by: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          special_requirements?: string | null
          special_requirements_ar?: string | null
          status?: string
          title: string
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          budget?: number | null
          chef_count?: number | null
          company_id?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          description_ar?: string | null
          experience_type?: string
          id?: string
          preferred_city?: string | null
          preferred_country_code?: string | null
          preferred_date_end?: string | null
          preferred_date_start?: string | null
          preferred_venue?: string | null
          preferred_venue_ar?: string | null
          product_category?: string
          product_description?: string | null
          product_description_ar?: string | null
          product_images?: string[] | null
          product_name?: string
          product_name_ar?: string | null
          rejection_reason?: string | null
          request_number?: string | null
          requested_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          special_requirements?: string | null
          special_requirements_ar?: string | null
          status?: string
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chefs_table_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      chefs_table_sessions: {
        Row: {
          chef_selection_method: string | null
          city: string | null
          company_id: string | null
          country_code: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          description_ar: string | null
          experience_type: string
          id: string
          invoice_id: string | null
          is_published: boolean | null
          max_chefs: number | null
          notes: string | null
          notes_ar: string | null
          organizer_id: string
          pricing_id: string | null
          product_category: string
          product_name: string
          product_name_ar: string | null
          published_at: string | null
          report_published: boolean | null
          report_published_at: string | null
          report_token: string | null
          request_id: string
          sample_delivery_address: string | null
          sample_delivery_notes: string | null
          session_date: string | null
          session_end: string | null
          session_number: string | null
          status: string
          template_id: string | null
          title: string
          title_ar: string | null
          total_cost: number | null
          updated_at: string
          venue: string | null
          venue_ar: string | null
        }
        Insert: {
          chef_selection_method?: string | null
          city?: string | null
          company_id?: string | null
          country_code?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          experience_type?: string
          id?: string
          invoice_id?: string | null
          is_published?: boolean | null
          max_chefs?: number | null
          notes?: string | null
          notes_ar?: string | null
          organizer_id: string
          pricing_id?: string | null
          product_category?: string
          product_name: string
          product_name_ar?: string | null
          published_at?: string | null
          report_published?: boolean | null
          report_published_at?: string | null
          report_token?: string | null
          request_id: string
          sample_delivery_address?: string | null
          sample_delivery_notes?: string | null
          session_date?: string | null
          session_end?: string | null
          session_number?: string | null
          status?: string
          template_id?: string | null
          title: string
          title_ar?: string | null
          total_cost?: number | null
          updated_at?: string
          venue?: string | null
          venue_ar?: string | null
        }
        Update: {
          chef_selection_method?: string | null
          city?: string | null
          company_id?: string | null
          country_code?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          experience_type?: string
          id?: string
          invoice_id?: string | null
          is_published?: boolean | null
          max_chefs?: number | null
          notes?: string | null
          notes_ar?: string | null
          organizer_id?: string
          pricing_id?: string | null
          product_category?: string
          product_name?: string
          product_name_ar?: string | null
          published_at?: string | null
          report_published?: boolean | null
          report_published_at?: string | null
          report_token?: string | null
          request_id?: string
          sample_delivery_address?: string | null
          sample_delivery_notes?: string | null
          session_date?: string | null
          session_end?: string | null
          session_number?: string | null
          status?: string
          template_id?: string | null
          title?: string
          title_ar?: string | null
          total_cost?: number | null
          updated_at?: string
          venue?: string | null
          venue_ar?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chefs_table_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chefs_table_sessions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "chefs_table_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_templates: {
        Row: {
          body: string
          body_ar: string | null
          category: string
          channel: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          name_ar: string | null
          slug: string
          subject: string | null
          subject_ar: string | null
          updated_at: string
          variables: string[] | null
        }
        Insert: {
          body: string
          body_ar?: string | null
          category?: string
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          name_ar?: string | null
          slug: string
          subject?: string | null
          subject_ar?: string | null
          updated_at?: string
          variables?: string[] | null
        }
        Update: {
          body?: string
          body_ar?: string | null
          category?: string
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          name_ar?: string | null
          slug?: string
          subject?: string | null
          subject_ar?: string | null
          updated_at?: string
          variables?: string[] | null
        }
        Relationships: []
      }
      community_events: {
        Row: {
          created_at: string
          description: string | null
          description_ar: string | null
          event_date: string | null
          event_end_date: string | null
          event_type: string
          id: string
          image_url: string | null
          is_virtual: boolean | null
          location: string | null
          location_ar: string | null
          max_attendees: number | null
          organizer_id: string
          status: string | null
          title: string
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          event_date?: string | null
          event_end_date?: string | null
          event_type?: string
          id?: string
          image_url?: string | null
          is_virtual?: boolean | null
          location?: string | null
          location_ar?: string | null
          max_attendees?: number | null
          organizer_id: string
          status?: string | null
          title: string
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          event_date?: string | null
          event_end_date?: string | null
          event_type?: string
          id?: string
          image_url?: string | null
          is_virtual?: boolean | null
          location?: string | null
          location_ar?: string | null
          max_attendees?: number | null
          organizer_id?: string
          status?: string | null
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      community_polls: {
        Row: {
          author_id: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          options: Json
          question: string
          question_ar: string | null
        }
        Insert: {
          author_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          options?: Json
          question: string
          question_ar?: string | null
        }
        Update: {
          author_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          options?: Json
          question?: string
          question_ar?: string | null
        }
        Relationships: []
      }
      community_stories: {
        Row: {
          caption: string | null
          created_at: string
          expires_at: string
          id: string
          media_type: string
          media_url: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string
          media_url: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string
          media_url?: string
          user_id?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          address_ar: string | null
          city: string | null
          classifications: string[] | null
          company_number: string | null
          country: string | null
          country_code: string | null
          cover_image_url: string | null
          created_at: string | null
          created_by: string | null
          credit_limit: number | null
          currency: string | null
          description: string | null
          description_ar: string | null
          district: string | null
          district_ar: string | null
          email: string | null
          fax: string | null
          featured_order: number | null
          founded_year: number | null
          google_maps_url: string | null
          id: string
          import_source: string | null
          is_pro_supplier: boolean | null
          is_verified: boolean | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          name_ar: string | null
          national_address: string | null
          national_address_ar: string | null
          neighborhood: string | null
          neighborhood_ar: string | null
          on_time_delivery_rate: number | null
          operating_countries: string[] | null
          payment_terms: number | null
          phone: string | null
          phone_secondary: string | null
          postal_code: string | null
          rating: number | null
          registration_number: string | null
          response_time_hours: number | null
          social_links: Json | null
          specializations: string[] | null
          status: Database["public"]["Enums"]["company_status"] | null
          street: string | null
          street_ar: string | null
          supplier_category: string | null
          supplier_score: number | null
          tagline: string | null
          tagline_ar: string | null
          tax_number: string | null
          total_orders: number | null
          total_reviews: number | null
          type: Database["public"]["Enums"]["company_type"]
          updated_at: string | null
          verification_level: string | null
          verified_at: string | null
          website: string | null
          working_hours: Json | null
        }
        Insert: {
          address?: string | null
          address_ar?: string | null
          city?: string | null
          classifications?: string[] | null
          company_number?: string | null
          country?: string | null
          country_code?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_limit?: number | null
          currency?: string | null
          description?: string | null
          description_ar?: string | null
          district?: string | null
          district_ar?: string | null
          email?: string | null
          fax?: string | null
          featured_order?: number | null
          founded_year?: number | null
          google_maps_url?: string | null
          id?: string
          import_source?: string | null
          is_pro_supplier?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          name_ar?: string | null
          national_address?: string | null
          national_address_ar?: string | null
          neighborhood?: string | null
          neighborhood_ar?: string | null
          on_time_delivery_rate?: number | null
          operating_countries?: string[] | null
          payment_terms?: number | null
          phone?: string | null
          phone_secondary?: string | null
          postal_code?: string | null
          rating?: number | null
          registration_number?: string | null
          response_time_hours?: number | null
          social_links?: Json | null
          specializations?: string[] | null
          status?: Database["public"]["Enums"]["company_status"] | null
          street?: string | null
          street_ar?: string | null
          supplier_category?: string | null
          supplier_score?: number | null
          tagline?: string | null
          tagline_ar?: string | null
          tax_number?: string | null
          total_orders?: number | null
          total_reviews?: number | null
          type: Database["public"]["Enums"]["company_type"]
          updated_at?: string | null
          verification_level?: string | null
          verified_at?: string | null
          website?: string | null
          working_hours?: Json | null
        }
        Update: {
          address?: string | null
          address_ar?: string | null
          city?: string | null
          classifications?: string[] | null
          company_number?: string | null
          country?: string | null
          country_code?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_limit?: number | null
          currency?: string | null
          description?: string | null
          description_ar?: string | null
          district?: string | null
          district_ar?: string | null
          email?: string | null
          fax?: string | null
          featured_order?: number | null
          founded_year?: number | null
          google_maps_url?: string | null
          id?: string
          import_source?: string | null
          is_pro_supplier?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          name_ar?: string | null
          national_address?: string | null
          national_address_ar?: string | null
          neighborhood?: string | null
          neighborhood_ar?: string | null
          on_time_delivery_rate?: number | null
          operating_countries?: string[] | null
          payment_terms?: number | null
          phone?: string | null
          phone_secondary?: string | null
          postal_code?: string | null
          rating?: number | null
          registration_number?: string | null
          response_time_hours?: number | null
          social_links?: Json | null
          specializations?: string[] | null
          status?: Database["public"]["Enums"]["company_status"] | null
          street?: string | null
          street_ar?: string | null
          supplier_category?: string | null
          supplier_score?: number | null
          tagline?: string | null
          tagline_ar?: string | null
          tax_number?: string | null
          total_orders?: number | null
          total_reviews?: number | null
          type?: Database["public"]["Enums"]["company_type"]
          updated_at?: string | null
          verification_level?: string | null
          verified_at?: string | null
          website?: string | null
          working_hours?: Json | null
        }
        Relationships: []
      }
      company_branches: {
        Row: {
          address: string | null
          address_ar: string | null
          city: string | null
          company_id: string
          coordinates: unknown
          country: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          is_headquarters: boolean | null
          manager_email: string | null
          manager_name: string | null
          manager_phone: string | null
          name: string
          name_ar: string | null
          phone: string | null
          postal_code: string | null
          working_hours: Json | null
        }
        Insert: {
          address?: string | null
          address_ar?: string | null
          city?: string | null
          company_id: string
          coordinates?: unknown
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_headquarters?: boolean | null
          manager_email?: string | null
          manager_name?: string | null
          manager_phone?: string | null
          name: string
          name_ar?: string | null
          phone?: string | null
          postal_code?: string | null
          working_hours?: Json | null
        }
        Update: {
          address?: string | null
          address_ar?: string | null
          city?: string | null
          company_id?: string
          coordinates?: unknown
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_headquarters?: boolean | null
          manager_email?: string | null
          manager_name?: string | null
          manager_phone?: string | null
          name?: string
          name_ar?: string | null
          phone?: string | null
          postal_code?: string | null
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "company_branches_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_catalog: {
        Row: {
          category: string
          company_id: string
          created_at: string | null
          currency: string | null
          description: string | null
          description_ar: string | null
          id: string
          image_url: string | null
          in_stock: boolean | null
          is_active: boolean | null
          name: string
          name_ar: string | null
          quantity_available: number | null
          shop_product_id: string | null
          sku: string | null
          subcategory: string | null
          unit: string | null
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          category: string
          company_id: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          is_active?: boolean | null
          name: string
          name_ar?: string | null
          quantity_available?: number | null
          shop_product_id?: string | null
          sku?: string | null
          subcategory?: string | null
          unit?: string | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          company_id?: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          is_active?: boolean | null
          name?: string
          name_ar?: string | null
          quantity_available?: number | null
          shop_product_id?: string | null
          sku?: string | null
          subcategory?: string | null
          unit?: string | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_catalog_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_catalog_shop_product_id_fkey"
            columns: ["shop_product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
        ]
      }
      company_classifications: {
        Row: {
          color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          name: string
          name_ar: string | null
          sort_order: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name: string
          name_ar?: string | null
          sort_order?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name?: string
          name_ar?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      company_communications: {
        Row: {
          company_id: string
          created_at: string
          direction: string
          id: string
          is_archived: boolean | null
          is_internal_note: boolean | null
          is_starred: boolean | null
          message: string
          parent_id: string | null
          priority: string | null
          response_time_minutes: number | null
          sender_id: string
          status: string
          subject: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          direction?: string
          id?: string
          is_archived?: boolean | null
          is_internal_note?: boolean | null
          is_starred?: boolean | null
          message: string
          parent_id?: string | null
          priority?: string | null
          response_time_minutes?: number | null
          sender_id: string
          status?: string
          subject: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          direction?: string
          id?: string
          is_archived?: boolean | null
          is_internal_note?: boolean | null
          is_starred?: boolean | null
          message?: string
          parent_id?: string | null
          priority?: string | null
          response_time_minutes?: number | null
          sender_id?: string
          status?: string
          subject?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_communications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_communications_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "company_communications"
            referencedColumns: ["id"]
          },
        ]
      }
      company_contacts: {
        Row: {
          accepted_at: string | null
          avatar_url: string | null
          can_login: boolean | null
          company_id: string
          created_at: string | null
          department: string
          email: string | null
          id: string
          invitation_status: string | null
          invitation_token: string | null
          invited_at: string | null
          invited_by: string | null
          is_primary: boolean | null
          mobile: string | null
          name: string
          name_ar: string | null
          phone: string | null
          role: Database["public"]["Enums"]["company_contact_role"] | null
          title: string | null
          title_ar: string | null
          updated_at: string | null
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          accepted_at?: string | null
          avatar_url?: string | null
          can_login?: boolean | null
          company_id: string
          created_at?: string | null
          department: string
          email?: string | null
          id?: string
          invitation_status?: string | null
          invitation_token?: string | null
          invited_at?: string | null
          invited_by?: string | null
          is_primary?: boolean | null
          mobile?: string | null
          name: string
          name_ar?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["company_contact_role"] | null
          title?: string | null
          title_ar?: string | null
          updated_at?: string | null
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          accepted_at?: string | null
          avatar_url?: string | null
          can_login?: boolean | null
          company_id?: string
          created_at?: string | null
          department?: string
          email?: string | null
          id?: string
          invitation_status?: string | null
          invitation_token?: string | null
          invited_at?: string | null
          invited_by?: string | null
          is_primary?: boolean | null
          mobile?: string | null
          name?: string
          name_ar?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["company_contact_role"] | null
          title?: string | null
          title_ar?: string | null
          updated_at?: string | null
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_drivers: {
        Row: {
          branch_id: string | null
          company_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          is_available: boolean | null
          license_number: string | null
          name: string
          name_ar: string | null
          phone: string
          vehicle_plate: string | null
          vehicle_type: string | null
        }
        Insert: {
          branch_id?: string | null
          company_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          license_number?: string | null
          name: string
          name_ar?: string | null
          phone: string
          vehicle_plate?: string | null
          vehicle_type?: string | null
        }
        Update: {
          branch_id?: string | null
          company_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          license_number?: string | null
          name?: string
          name_ar?: string | null
          phone?: string
          vehicle_plate?: string | null
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_drivers_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "company_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_drivers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_employee_invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          company_id: string
          created_at: string | null
          department: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string
          message: string | null
          message_ar: string | null
          role: Database["public"]["Enums"]["company_contact_role"] | null
          status: string
          title: string | null
          title_ar: string | null
          token: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          company_id: string
          created_at?: string | null
          department?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by: string
          message?: string | null
          message_ar?: string | null
          role?: Database["public"]["Enums"]["company_contact_role"] | null
          status?: string
          title?: string | null
          title_ar?: string | null
          token?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          company_id?: string
          created_at?: string | null
          department?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string
          message?: string | null
          message_ar?: string | null
          role?: Database["public"]["Enums"]["company_contact_role"] | null
          status?: string
          title?: string | null
          title_ar?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_employee_invites_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_evaluations: {
        Row: {
          communication_rating: number | null
          company_id: string
          company_response: string | null
          company_response_ar: string | null
          competition_id: string | null
          created_at: string | null
          delivery_rating: number | null
          evaluated_by: string | null
          id: string
          is_public: boolean | null
          order_id: string | null
          overall_rating: number | null
          quality_rating: number | null
          responded_at: string | null
          responded_by: string | null
          review: string | null
          review_ar: string | null
          value_rating: number | null
        }
        Insert: {
          communication_rating?: number | null
          company_id: string
          company_response?: string | null
          company_response_ar?: string | null
          competition_id?: string | null
          created_at?: string | null
          delivery_rating?: number | null
          evaluated_by?: string | null
          id?: string
          is_public?: boolean | null
          order_id?: string | null
          overall_rating?: number | null
          quality_rating?: number | null
          responded_at?: string | null
          responded_by?: string | null
          review?: string | null
          review_ar?: string | null
          value_rating?: number | null
        }
        Update: {
          communication_rating?: number | null
          company_id?: string
          company_response?: string | null
          company_response_ar?: string | null
          competition_id?: string | null
          created_at?: string | null
          delivery_rating?: number | null
          evaluated_by?: string | null
          id?: string
          is_public?: boolean | null
          order_id?: string | null
          overall_rating?: number | null
          quality_rating?: number | null
          responded_at?: string | null
          responded_by?: string | null
          review?: string | null
          review_ar?: string | null
          value_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "company_evaluations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_evaluations_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_evaluations_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_evaluations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "company_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      company_invitations: {
        Row: {
          company_id: string
          competition_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          description_ar: string | null
          event_date: string | null
          expires_at: string | null
          id: string
          invitation_type: string
          responded_at: string | null
          responded_by: string | null
          response_notes: string | null
          status: Database["public"]["Enums"]["invitation_status"] | null
          title: string
          title_ar: string | null
        }
        Insert: {
          company_id: string
          competition_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          event_date?: string | null
          expires_at?: string | null
          id?: string
          invitation_type: string
          responded_at?: string | null
          responded_by?: string | null
          response_notes?: string | null
          status?: Database["public"]["Enums"]["invitation_status"] | null
          title: string
          title_ar?: string | null
        }
        Update: {
          company_id?: string
          competition_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          event_date?: string | null
          expires_at?: string | null
          id?: string
          invitation_type?: string
          responded_at?: string | null
          responded_by?: string | null
          response_notes?: string | null
          status?: Database["public"]["Enums"]["invitation_status"] | null
          title?: string
          title_ar?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_invitations_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_invitations_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions_public"
            referencedColumns: ["id"]
          },
        ]
      }
      company_media: {
        Row: {
          category: string
          company_id: string
          created_at: string | null
          description: string | null
          file_size: number | null
          file_type: string
          file_url: string
          filename: string
          id: string
          is_public: boolean | null
          sort_order: number | null
          title: string | null
          title_ar: string | null
          uploaded_by: string | null
        }
        Insert: {
          category: string
          company_id: string
          created_at?: string | null
          description?: string | null
          file_size?: number | null
          file_type: string
          file_url: string
          filename: string
          id?: string
          is_public?: boolean | null
          sort_order?: number | null
          title?: string | null
          title_ar?: string | null
          uploaded_by?: string | null
        }
        Update: {
          category?: string
          company_id?: string
          created_at?: string | null
          description?: string | null
          file_size?: number | null
          file_type?: string
          file_url?: string
          filename?: string
          id?: string
          is_public?: boolean | null
          sort_order?: number | null
          title?: string | null
          title_ar?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_media_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_orders: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          branch_id: string | null
          category: Database["public"]["Enums"]["order_category"]
          company_id: string
          competition_id: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          delivery_date: string | null
          description: string | null
          description_ar: string | null
          direction: Database["public"]["Enums"]["order_direction"]
          discount_amount: number | null
          driver_id: string | null
          due_date: string | null
          id: string
          internal_notes: string | null
          items: Json | null
          notes: string | null
          order_date: string | null
          order_number: string
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          subtotal: number | null
          tax_amount: number | null
          title: string
          title_ar: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          branch_id?: string | null
          category: Database["public"]["Enums"]["order_category"]
          company_id: string
          competition_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          delivery_date?: string | null
          description?: string | null
          description_ar?: string | null
          direction: Database["public"]["Enums"]["order_direction"]
          discount_amount?: number | null
          driver_id?: string | null
          due_date?: string | null
          id?: string
          internal_notes?: string | null
          items?: Json | null
          notes?: string | null
          order_date?: string | null
          order_number?: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number | null
          tax_amount?: number | null
          title: string
          title_ar?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          branch_id?: string | null
          category?: Database["public"]["Enums"]["order_category"]
          company_id?: string
          competition_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          delivery_date?: string | null
          description?: string | null
          description_ar?: string | null
          direction?: Database["public"]["Enums"]["order_direction"]
          discount_amount?: number | null
          driver_id?: string | null
          due_date?: string | null
          id?: string
          internal_notes?: string | null
          items?: Json | null
          notes?: string | null
          order_date?: string | null
          order_number?: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number | null
          tax_amount?: number | null
          title?: string
          title_ar?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "company_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_orders_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_orders_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_orders_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "company_drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      company_registration_requests: {
        Row: {
          additional_documents: Json | null
          business_license_url: string | null
          company_name: string
          company_name_ar: string | null
          company_type: string
          contact_email: string
          contact_name: string
          contact_name_ar: string | null
          contact_phone: string
          country_code: string
          created_at: string | null
          id: string
          registration_number: string | null
          rejection_reason: string | null
          reviewed_by: string | null
          status: string | null
          submitted_by: string | null
          updated_at: string | null
        }
        Insert: {
          additional_documents?: Json | null
          business_license_url?: string | null
          company_name: string
          company_name_ar?: string | null
          company_type: string
          contact_email: string
          contact_name: string
          contact_name_ar?: string | null
          contact_phone: string
          country_code: string
          created_at?: string | null
          id?: string
          registration_number?: string | null
          rejection_reason?: string | null
          reviewed_by?: string | null
          status?: string | null
          submitted_by?: string | null
          updated_at?: string | null
        }
        Update: {
          additional_documents?: Json | null
          business_license_url?: string | null
          company_name?: string
          company_name_ar?: string | null
          company_type?: string
          contact_email?: string
          contact_name?: string
          contact_name_ar?: string | null
          contact_phone?: string
          country_code?: string
          created_at?: string | null
          id?: string
          registration_number?: string | null
          rejection_reason?: string | null
          reviewed_by?: string | null
          status?: string | null
          submitted_by?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      company_role_assignments: {
        Row: {
          assigned_at: string | null
          company_id: string
          id: string
          is_active: boolean | null
          role: string
        }
        Insert: {
          assigned_at?: string | null
          company_id: string
          id?: string
          is_active?: boolean | null
          role: string
        }
        Update: {
          assigned_at?: string | null
          company_id?: string
          id?: string
          is_active?: boolean | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_role_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_support_messages: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          read_at: string | null
          sender_id: string
          sender_type: string
          subject: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          read_at?: string | null
          sender_id: string
          sender_type?: string
          subject?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          read_at?: string | null
          sender_id?: string
          sender_type?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_support_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_transactions: {
        Row: {
          amount: number
          balance_after: number | null
          balance_before: number | null
          company_id: string
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string | null
          description_ar: string | null
          id: string
          invoice_id: string | null
          is_reconciled: boolean | null
          order_id: string | null
          payment_method: string | null
          payment_reference: string | null
          reconciled_at: string | null
          reconciled_by: string | null
          reference: string | null
          transaction_date: string | null
          transaction_number: string
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          amount: number
          balance_after?: number | null
          balance_before?: number | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          invoice_id?: string | null
          is_reconciled?: boolean | null
          order_id?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          reference?: string | null
          transaction_date?: string | null
          transaction_number?: string
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          amount?: number
          balance_after?: number | null
          balance_before?: number | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          invoice_id?: string | null
          is_reconciled?: boolean | null
          order_id?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          reference?: string | null
          transaction_date?: string | null
          transaction_number?: string
          type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "company_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_transactions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "company_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_categories: {
        Row: {
          competition_id: string
          cover_image_url: string | null
          created_at: string
          description: string | null
          description_ar: string | null
          gender: string | null
          id: string
          max_participants: number | null
          name: string
          name_ar: string | null
          participant_level: string | null
          sort_order: number | null
          status: string | null
        }
        Insert: {
          competition_id: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          gender?: string | null
          id?: string
          max_participants?: number | null
          name: string
          name_ar?: string | null
          participant_level?: string | null
          sort_order?: number | null
          status?: string | null
        }
        Update: {
          competition_id?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          gender?: string | null
          id?: string
          max_participants?: number | null
          name?: string
          name_ar?: string | null
          participant_level?: string | null
          sort_order?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competition_categories_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_categories_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions_public"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_feedback: {
        Row: {
          category: string | null
          comment: string | null
          comment_ar: string | null
          competition_id: string
          created_at: string | null
          id: string
          is_visible: boolean | null
          judge_id: string | null
          registration_id: string
          released_at: string | null
          score_breakdown: Json | null
        }
        Insert: {
          category?: string | null
          comment?: string | null
          comment_ar?: string | null
          competition_id: string
          created_at?: string | null
          id?: string
          is_visible?: boolean | null
          judge_id?: string | null
          registration_id: string
          released_at?: string | null
          score_breakdown?: Json | null
        }
        Update: {
          category?: string | null
          comment?: string | null
          comment_ar?: string | null
          competition_id?: string
          created_at?: string | null
          id?: string
          is_visible?: boolean | null
          judge_id?: string | null
          registration_id?: string
          released_at?: string | null
          score_breakdown?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "competition_feedback_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_feedback_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_feedback_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "competition_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_invitations: {
        Row: {
          category_id: string | null
          checked_in_at: string | null
          competition_id: string
          created_at: string
          id: string
          invitation_channel: string | null
          invited_by: string
          invitee_email: string | null
          invitee_name: string | null
          invitee_name_ar: string | null
          invitee_phone: string | null
          invitee_role: string | null
          message: string | null
          message_ar: string | null
          organization_name: string | null
          organization_name_ar: string | null
          organization_type: string | null
          responded_at: string | null
          sent_at: string | null
          status: string
        }
        Insert: {
          category_id?: string | null
          checked_in_at?: string | null
          competition_id: string
          created_at?: string
          id?: string
          invitation_channel?: string | null
          invited_by: string
          invitee_email?: string | null
          invitee_name?: string | null
          invitee_name_ar?: string | null
          invitee_phone?: string | null
          invitee_role?: string | null
          message?: string | null
          message_ar?: string | null
          organization_name?: string | null
          organization_name_ar?: string | null
          organization_type?: string | null
          responded_at?: string | null
          sent_at?: string | null
          status?: string
        }
        Update: {
          category_id?: string | null
          checked_in_at?: string | null
          competition_id?: string
          created_at?: string
          id?: string
          invitation_channel?: string | null
          invited_by?: string
          invitee_email?: string | null
          invitee_name?: string | null
          invitee_name_ar?: string | null
          invitee_phone?: string | null
          invitee_role?: string | null
          message?: string | null
          message_ar?: string | null
          organization_name?: string | null
          organization_name_ar?: string | null
          organization_type?: string | null
          responded_at?: string | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_invitations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "competition_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_invitations_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_invitations_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions_public"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_judges: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          competition_id: string
          id: string
          judge_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          competition_id: string
          id?: string
          judge_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          competition_id?: string
          id?: string
          judge_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_judges_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_judges_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions_public"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_portfolio_entries: {
        Row: {
          certificate_id: string | null
          competition_id: string
          created_at: string | null
          dish_photos: string[] | null
          final_rank: number | null
          final_score: number | null
          id: string
          is_public: boolean | null
          medal: string | null
          personal_notes: string | null
          personal_notes_ar: string | null
          registration_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          certificate_id?: string | null
          competition_id: string
          created_at?: string | null
          dish_photos?: string[] | null
          final_rank?: number | null
          final_score?: number | null
          id?: string
          is_public?: boolean | null
          medal?: string | null
          personal_notes?: string | null
          personal_notes_ar?: string | null
          registration_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          certificate_id?: string | null
          competition_id?: string
          created_at?: string | null
          dish_photos?: string[] | null
          final_rank?: number | null
          final_score?: number | null
          id?: string
          is_public?: boolean | null
          medal?: string | null
          personal_notes?: string | null
          personal_notes_ar?: string | null
          registration_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_portfolio_entries_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "certificates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_portfolio_entries_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_portfolio_entries_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_portfolio_entries_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "competition_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_registrations: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          category_id: string | null
          competition_id: string
          dish_description: string | null
          dish_image_url: string | null
          dish_name: string | null
          entry_type: string
          id: string
          notes: string | null
          organization_id: string | null
          organization_name: string | null
          organization_name_ar: string | null
          organization_type: string | null
          paid_at: string | null
          participant_id: string
          payment_amount: number | null
          payment_currency: string | null
          payment_reference: string | null
          payment_status: string | null
          registered_at: string
          registration_number: string | null
          status: string
          tax_amount: number | null
          tax_rate: number | null
          team_name: string | null
          team_name_ar: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          category_id?: string | null
          competition_id: string
          dish_description?: string | null
          dish_image_url?: string | null
          dish_name?: string | null
          entry_type?: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          organization_name?: string | null
          organization_name_ar?: string | null
          organization_type?: string | null
          paid_at?: string | null
          participant_id: string
          payment_amount?: number | null
          payment_currency?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          registered_at?: string
          registration_number?: string | null
          status?: string
          tax_amount?: number | null
          tax_rate?: number | null
          team_name?: string | null
          team_name_ar?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          category_id?: string | null
          competition_id?: string
          dish_description?: string | null
          dish_image_url?: string | null
          dish_name?: string | null
          entry_type?: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          organization_name?: string | null
          organization_name_ar?: string | null
          organization_type?: string | null
          paid_at?: string | null
          participant_id?: string
          payment_amount?: number | null
          payment_currency?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          registered_at?: string
          registration_number?: string | null
          status?: string
          tax_amount?: number | null
          tax_rate?: number | null
          team_name?: string | null
          team_name_ar?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competition_registrations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "competition_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_registrations_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_registrations_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_registrations_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "competition_registrations_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["user_id"]
          },
        ]
      }
      competition_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          competition_id: string
          id: string
          notes: string | null
          revoked_at: string | null
          role: string
          status: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          competition_id: string
          id?: string
          notes?: string | null
          revoked_at?: string | null
          role: string
          status?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          competition_id?: string
          id?: string
          notes?: string | null
          revoked_at?: string | null
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_roles_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_roles_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions_public"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_rounds: {
        Row: {
          advancement_count: number | null
          advancement_rule: string | null
          competition_id: string
          created_at: string | null
          end_time: string | null
          format: string
          id: string
          max_participants: number | null
          name: string
          name_ar: string | null
          round_number: number
          round_type: string
          sort_order: number
          start_time: string | null
          status: string
          threshold_score: number | null
          updated_at: string | null
        }
        Insert: {
          advancement_count?: number | null
          advancement_rule?: string | null
          competition_id: string
          created_at?: string | null
          end_time?: string | null
          format?: string
          id?: string
          max_participants?: number | null
          name: string
          name_ar?: string | null
          round_number?: number
          round_type?: string
          sort_order?: number
          start_time?: string | null
          status?: string
          threshold_score?: number | null
          updated_at?: string | null
        }
        Update: {
          advancement_count?: number | null
          advancement_rule?: string | null
          competition_id?: string
          created_at?: string | null
          end_time?: string | null
          format?: string
          id?: string
          max_participants?: number | null
          name?: string
          name_ar?: string | null
          round_number?: number
          round_type?: string
          sort_order?: number
          start_time?: string | null
          status?: string
          threshold_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competition_rounds_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_rounds_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions_public"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_schedule_slots: {
        Row: {
          category_id: string | null
          competition_id: string
          created_at: string | null
          end_time: string
          id: string
          location: string | null
          location_ar: string | null
          notes: string | null
          round_id: string | null
          slot_type: string | null
          sort_order: number | null
          start_time: string
          station_number: string | null
          title: string
          title_ar: string | null
        }
        Insert: {
          category_id?: string | null
          competition_id: string
          created_at?: string | null
          end_time: string
          id?: string
          location?: string | null
          location_ar?: string | null
          notes?: string | null
          round_id?: string | null
          slot_type?: string | null
          sort_order?: number | null
          start_time: string
          station_number?: string | null
          title: string
          title_ar?: string | null
        }
        Update: {
          category_id?: string | null
          competition_id?: string
          created_at?: string | null
          end_time?: string
          id?: string
          location?: string | null
          location_ar?: string | null
          notes?: string | null
          round_id?: string | null
          slot_type?: string | null
          sort_order?: number | null
          start_time?: string
          station_number?: string | null
          title?: string
          title_ar?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competition_schedule_slots_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "competition_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_schedule_slots_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_schedule_slots_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_schedule_slots_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "competition_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_scores: {
        Row: {
          criteria_id: string
          detailed_feedback: string | null
          flag_reason: string | null
          flag_status: string | null
          id: string
          judge_id: string
          notes: string | null
          registration_id: string
          score: number
          scored_at: string
        }
        Insert: {
          criteria_id: string
          detailed_feedback?: string | null
          flag_reason?: string | null
          flag_status?: string | null
          id?: string
          judge_id: string
          notes?: string | null
          registration_id: string
          score: number
          scored_at?: string
        }
        Update: {
          criteria_id?: string
          detailed_feedback?: string | null
          flag_reason?: string | null
          flag_status?: string | null
          id?: string
          judge_id?: string
          notes?: string | null
          registration_id?: string
          score?: number
          scored_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_scores_criteria_id_fkey"
            columns: ["criteria_id"]
            isOneToOne: false
            referencedRelation: "judging_criteria"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_scores_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "competition_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_series: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          description_ar: string | null
          id: string
          logo_url: string | null
          name: string
          name_ar: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          logo_url?: string | null
          name: string
          name_ar?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          name_ar?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      competition_sponsors: {
        Row: {
          amount_paid: number | null
          company_id: string
          competition_id: string
          created_at: string | null
          created_by: string | null
          custom_benefits: Json | null
          id: string
          logo_url: string | null
          notes: string | null
          package_id: string | null
          status: string | null
          tier: Database["public"]["Enums"]["sponsorship_tier"]
          updated_at: string | null
        }
        Insert: {
          amount_paid?: number | null
          company_id: string
          competition_id: string
          created_at?: string | null
          created_by?: string | null
          custom_benefits?: Json | null
          id?: string
          logo_url?: string | null
          notes?: string | null
          package_id?: string | null
          status?: string | null
          tier?: Database["public"]["Enums"]["sponsorship_tier"]
          updated_at?: string | null
        }
        Update: {
          amount_paid?: number | null
          company_id?: string
          competition_id?: string
          created_at?: string | null
          created_by?: string | null
          custom_benefits?: Json | null
          id?: string
          logo_url?: string | null
          notes?: string | null
          package_id?: string | null
          status?: string | null
          tier?: Database["public"]["Enums"]["sponsorship_tier"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competition_sponsors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_sponsors_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_sponsors_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_sponsors_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "sponsorship_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_supervising_bodies: {
        Row: {
          competition_id: string
          created_at: string | null
          entity_id: string
          id: string
          role: string
        }
        Insert: {
          competition_id: string
          created_at?: string | null
          entity_id: string
          id?: string
          role?: string
        }
        Update: {
          competition_id?: string
          created_at?: string | null
          entity_id?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_supervising_bodies_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_supervising_bodies_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_supervising_bodies_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "culinary_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_team_members: {
        Row: {
          checked_in_at: string | null
          competition_id: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          is_checked_in: boolean | null
          name: string
          name_ar: string | null
          notes: string | null
          phone: string | null
          photo_url: string | null
          role: string
          title: string | null
          title_ar: string | null
          user_id: string | null
        }
        Insert: {
          checked_in_at?: string | null
          competition_id: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_checked_in?: boolean | null
          name: string
          name_ar?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          role: string
          title?: string | null
          title_ar?: string | null
          user_id?: string | null
        }
        Update: {
          checked_in_at?: string | null
          competition_id?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_checked_in?: boolean | null
          name?: string
          name_ar?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          role?: string
          title?: string | null
          title_ar?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competition_team_members_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_team_members_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions_public"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_type_assignments: {
        Row: {
          competition_id: string
          created_at: string | null
          id: string
          type_id: string
        }
        Insert: {
          competition_id: string
          created_at?: string | null
          id?: string
          type_id: string
        }
        Update: {
          competition_id?: string
          created_at?: string | null
          id?: string
          type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_type_assignments_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_type_assignments_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_type_assignments_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "competition_types"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_types: {
        Row: {
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          description_ar: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          name_ar: string | null
          sort_order: number | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_ar?: string | null
          sort_order?: number | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_ar?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      competition_updates: {
        Row: {
          author_id: string
          competition_id: string
          content: string | null
          content_ar: string | null
          created_at: string
          id: string
          is_pinned: boolean | null
          title: string
          title_ar: string | null
          update_type: string
        }
        Insert: {
          author_id: string
          competition_id: string
          content?: string | null
          content_ar?: string | null
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          title: string
          title_ar?: string | null
          update_type?: string
        }
        Update: {
          author_id?: string
          competition_id?: string
          content?: string | null
          content_ar?: string | null
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          title?: string
          title_ar?: string | null
          update_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_updates_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_updates_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions_public"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          allowed_entry_types: string[] | null
          blind_code_prefix: string | null
          blind_judging_enabled: boolean | null
          city: string | null
          competition_end: string
          competition_number: string | null
          competition_start: string
          country: string | null
          country_code: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          description_ar: string | null
          edition_year: number | null
          exhibition_id: string | null
          id: string
          import_source: string | null
          is_virtual: boolean | null
          link_type: string | null
          linked_chef_id: string | null
          linked_entity_id: string | null
          linked_tasting_id: string | null
          max_participants: number | null
          max_team_size: number | null
          min_team_size: number | null
          organizer_id: string
          registration_currency: string | null
          registration_end: string | null
          registration_fee: number | null
          registration_fee_type: string | null
          registration_start: string | null
          registration_tax_name: string | null
          registration_tax_name_ar: string | null
          registration_tax_rate: number | null
          rules_summary: string | null
          rules_summary_ar: string | null
          scoring_notes: string | null
          scoring_notes_ar: string | null
          series_id: string | null
          status: Database["public"]["Enums"]["competition_status"]
          title: string
          title_ar: string | null
          updated_at: string
          venue: string | null
          venue_ar: string | null
        }
        Insert: {
          allowed_entry_types?: string[] | null
          blind_code_prefix?: string | null
          blind_judging_enabled?: boolean | null
          city?: string | null
          competition_end: string
          competition_number?: string | null
          competition_start: string
          country?: string | null
          country_code?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          edition_year?: number | null
          exhibition_id?: string | null
          id?: string
          import_source?: string | null
          is_virtual?: boolean | null
          link_type?: string | null
          linked_chef_id?: string | null
          linked_entity_id?: string | null
          linked_tasting_id?: string | null
          max_participants?: number | null
          max_team_size?: number | null
          min_team_size?: number | null
          organizer_id: string
          registration_currency?: string | null
          registration_end?: string | null
          registration_fee?: number | null
          registration_fee_type?: string | null
          registration_start?: string | null
          registration_tax_name?: string | null
          registration_tax_name_ar?: string | null
          registration_tax_rate?: number | null
          rules_summary?: string | null
          rules_summary_ar?: string | null
          scoring_notes?: string | null
          scoring_notes_ar?: string | null
          series_id?: string | null
          status?: Database["public"]["Enums"]["competition_status"]
          title: string
          title_ar?: string | null
          updated_at?: string
          venue?: string | null
          venue_ar?: string | null
        }
        Update: {
          allowed_entry_types?: string[] | null
          blind_code_prefix?: string | null
          blind_judging_enabled?: boolean | null
          city?: string | null
          competition_end?: string
          competition_number?: string | null
          competition_start?: string
          country?: string | null
          country_code?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          edition_year?: number | null
          exhibition_id?: string | null
          id?: string
          import_source?: string | null
          is_virtual?: boolean | null
          link_type?: string | null
          linked_chef_id?: string | null
          linked_entity_id?: string | null
          linked_tasting_id?: string | null
          max_participants?: number | null
          max_team_size?: number | null
          min_team_size?: number | null
          organizer_id?: string
          registration_currency?: string | null
          registration_end?: string | null
          registration_fee?: number | null
          registration_fee_type?: string | null
          registration_start?: string | null
          registration_tax_name?: string | null
          registration_tax_name_ar?: string | null
          registration_tax_rate?: number | null
          rules_summary?: string | null
          rules_summary_ar?: string | null
          scoring_notes?: string | null
          scoring_notes_ar?: string | null
          series_id?: string | null
          status?: Database["public"]["Enums"]["competition_status"]
          title?: string
          title_ar?: string | null
          updated_at?: string
          venue?: string | null
          venue_ar?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitions_exhibition_id_fkey"
            columns: ["exhibition_id"]
            isOneToOne: false
            referencedRelation: "exhibitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitions_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "competition_series"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      content_audit_log: {
        Row: {
          action_type: string
          author_id: string | null
          content_snapshot: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          image_urls: string[] | null
          metadata: Json | null
          reason: string | null
          reason_ar: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          author_id?: string | null
          content_snapshot?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          image_urls?: string[] | null
          metadata?: Json | null
          reason?: string | null
          reason_ar?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          author_id?: string | null
          content_snapshot?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          image_urls?: string[] | null
          metadata?: Json | null
          reason?: string | null
          reason_ar?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      content_categories: {
        Row: {
          created_at: string
          description: string | null
          description_ar: string | null
          id: string
          name: string
          name_ar: string | null
          parent_id: string | null
          slug: string
          sort_order: number | null
          type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          name: string
          name_ar?: string | null
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          name?: string
          name_ar?: string | null
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "content_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      content_moderation_log: {
        Row: {
          ai_categories: string[] | null
          ai_confidence: number | null
          ai_decision: string
          ai_explanation: string | null
          ai_explanation_ar: string | null
          content_text: string | null
          created_at: string
          entity_id: string
          entity_type: string
          final_decision: string | null
          id: string
          image_urls: string[] | null
          reviewed_at: string | null
          reviewed_by: string | null
          user_id: string | null
        }
        Insert: {
          ai_categories?: string[] | null
          ai_confidence?: number | null
          ai_decision?: string
          ai_explanation?: string | null
          ai_explanation_ar?: string | null
          content_text?: string | null
          created_at?: string
          entity_id: string
          entity_type?: string
          final_decision?: string | null
          id?: string
          image_urls?: string[] | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          user_id?: string | null
        }
        Update: {
          ai_categories?: string[] | null
          ai_confidence?: number | null
          ai_decision?: string
          ai_explanation?: string | null
          ai_explanation_ar?: string | null
          content_text?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          final_decision?: string | null
          id?: string
          image_urls?: string[] | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      content_reports: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          id: string
          reason: string
          reporter_id: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          reason: string
          reporter_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Relationships: []
      }
      content_tags: {
        Row: {
          created_at: string
          id: string
          name: string
          name_ar: string | null
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          name_ar?: string | null
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          name_ar?: string | null
          slug?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          participant_1: string
          participant_2: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          participant_1: string
          participant_2: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          participant_1?: string
          participant_2?: string
        }
        Relationships: []
      }
      conversion_events: {
        Row: {
          campaign: string | null
          created_at: string
          currency: string | null
          event_category: string | null
          event_name: string
          event_value: number | null
          id: string
          medium: string | null
          metadata: Json | null
          session_id: string | null
          source: string | null
          user_id: string | null
        }
        Insert: {
          campaign?: string | null
          created_at?: string
          currency?: string | null
          event_category?: string | null
          event_name: string
          event_value?: number | null
          id?: string
          medium?: string | null
          metadata?: Json | null
          session_id?: string | null
          source?: string | null
          user_id?: string | null
        }
        Update: {
          campaign?: string | null
          created_at?: string
          currency?: string | null
          event_category?: string | null
          event_name?: string
          event_value?: number | null
          id?: string
          medium?: string | null
          metadata?: Json | null
          session_id?: string | null
          source?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      cost_approval_log: {
        Row: {
          action: string
          comments: string | null
          comments_ar: string | null
          created_at: string
          estimate_id: string
          id: string
          new_status: string | null
          performed_by: string
          previous_status: string | null
        }
        Insert: {
          action: string
          comments?: string | null
          comments_ar?: string | null
          created_at?: string
          estimate_id: string
          id?: string
          new_status?: string | null
          performed_by: string
          previous_status?: string | null
        }
        Update: {
          action?: string
          comments?: string | null
          comments_ar?: string | null
          created_at?: string
          estimate_id?: string
          id?: string
          new_status?: string | null
          performed_by?: string
          previous_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cost_approval_log_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "cost_estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_estimate_items: {
        Row: {
          category: Database["public"]["Enums"]["cost_item_category"]
          cost_profile_id: string | null
          created_at: string
          description: string | null
          description_ar: string | null
          estimate_id: string
          id: string
          notes: string | null
          person_id: string | null
          person_role: string | null
          quantity: number
          sort_order: number
          title: string
          title_ar: string | null
          total_price: number
          unit: string | null
          unit_ar: string | null
          unit_price: number
        }
        Insert: {
          category?: Database["public"]["Enums"]["cost_item_category"]
          cost_profile_id?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          estimate_id: string
          id?: string
          notes?: string | null
          person_id?: string | null
          person_role?: string | null
          quantity?: number
          sort_order?: number
          title: string
          title_ar?: string | null
          total_price?: number
          unit?: string | null
          unit_ar?: string | null
          unit_price?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["cost_item_category"]
          cost_profile_id?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          estimate_id?: string
          id?: string
          notes?: string | null
          person_id?: string | null
          person_role?: string | null
          quantity?: number
          sort_order?: number
          title?: string
          title_ar?: string | null
          total_price?: number
          unit?: string | null
          unit_ar?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "cost_estimate_items_cost_profile_id_fkey"
            columns: ["cost_profile_id"]
            isOneToOne: false
            referencedRelation: "chef_cost_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_estimate_items_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "cost_estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_estimates: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_id: string | null
          created_at: string
          currency: string
          description: string | null
          description_ar: string | null
          discount_amount: number
          estimate_number: string
          id: string
          internal_notes: string | null
          invoice_id: string | null
          module_id: string | null
          module_title: string | null
          module_title_ar: string | null
          module_type: Database["public"]["Enums"]["cost_module_type"]
          notes: string | null
          notes_ar: string | null
          parent_estimate_id: string | null
          prepared_by: string | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["cost_estimate_status"]
          subtotal: number
          tags: string[] | null
          tax_amount: number
          tax_rate: number
          title: string
          title_ar: string | null
          total_amount: number
          updated_at: string
          valid_until: string | null
          version: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          description_ar?: string | null
          discount_amount?: number
          estimate_number?: string
          id?: string
          internal_notes?: string | null
          invoice_id?: string | null
          module_id?: string | null
          module_title?: string | null
          module_title_ar?: string | null
          module_type: Database["public"]["Enums"]["cost_module_type"]
          notes?: string | null
          notes_ar?: string | null
          parent_estimate_id?: string | null
          prepared_by?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["cost_estimate_status"]
          subtotal?: number
          tags?: string[] | null
          tax_amount?: number
          tax_rate?: number
          title: string
          title_ar?: string | null
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
          version?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          description_ar?: string | null
          discount_amount?: number
          estimate_number?: string
          id?: string
          internal_notes?: string | null
          invoice_id?: string | null
          module_id?: string | null
          module_title?: string | null
          module_title_ar?: string | null
          module_type?: Database["public"]["Enums"]["cost_module_type"]
          notes?: string | null
          notes_ar?: string | null
          parent_estimate_id?: string | null
          prepared_by?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["cost_estimate_status"]
          subtotal?: number
          tags?: string[] | null
          tax_amount?: number
          tax_rate?: number
          title?: string
          title_ar?: string | null
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "cost_estimates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_estimates_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_estimates_parent_estimate_id_fkey"
            columns: ["parent_estimate_id"]
            isOneToOne: false
            referencedRelation: "cost_estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          description_ar: string | null
          id: string
          is_active: boolean
          items: Json
          module_type: Database["public"]["Enums"]["cost_module_type"]
          name: string
          name_ar: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          is_active?: boolean
          items?: Json
          module_type: Database["public"]["Enums"]["cost_module_type"]
          name: string
          name_ar?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          is_active?: boolean
          items?: Json
          module_type?: Database["public"]["Enums"]["cost_module_type"]
          name?: string
          name_ar?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      countries: {
        Row: {
          code: string
          code_alpha3: string | null
          continent: string | null
          created_at: string
          currency_code: string
          currency_name: string | null
          currency_name_ar: string | null
          currency_symbol: string
          data_residency_notes: string | null
          date_format: string | null
          default_language: string
          features: Json
          flag_emoji: string | null
          id: string
          is_active: boolean
          is_featured: boolean | null
          launch_date: string | null
          local_office_address: string | null
          local_office_address_ar: string | null
          metadata: Json | null
          name: string
          name_ar: string | null
          name_local: string | null
          phone_code: string | null
          phone_format: string | null
          region: string | null
          requires_tax_number: boolean | null
          sort_order: number | null
          support_email: string | null
          support_phone: string | null
          supported_languages: string[]
          tax_name: string | null
          tax_name_ar: string | null
          tax_rate: number | null
          timezone: string
          updated_at: string
        }
        Insert: {
          code: string
          code_alpha3?: string | null
          continent?: string | null
          created_at?: string
          currency_code?: string
          currency_name?: string | null
          currency_name_ar?: string | null
          currency_symbol?: string
          data_residency_notes?: string | null
          date_format?: string | null
          default_language?: string
          features?: Json
          flag_emoji?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean | null
          launch_date?: string | null
          local_office_address?: string | null
          local_office_address_ar?: string | null
          metadata?: Json | null
          name: string
          name_ar?: string | null
          name_local?: string | null
          phone_code?: string | null
          phone_format?: string | null
          region?: string | null
          requires_tax_number?: boolean | null
          sort_order?: number | null
          support_email?: string | null
          support_phone?: string | null
          supported_languages?: string[]
          tax_name?: string | null
          tax_name_ar?: string | null
          tax_rate?: number | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          code?: string
          code_alpha3?: string | null
          continent?: string | null
          created_at?: string
          currency_code?: string
          currency_name?: string | null
          currency_name_ar?: string | null
          currency_symbol?: string
          data_residency_notes?: string | null
          date_format?: string | null
          default_language?: string
          features?: Json
          flag_emoji?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean | null
          launch_date?: string | null
          local_office_address?: string | null
          local_office_address_ar?: string | null
          metadata?: Json | null
          name?: string
          name_ar?: string | null
          name_local?: string | null
          phone_code?: string | null
          phone_format?: string | null
          region?: string | null
          requires_tax_number?: boolean | null
          sort_order?: number | null
          support_email?: string | null
          support_phone?: string | null
          supported_languages?: string[]
          tax_name?: string | null
          tax_name_ar?: string | null
          tax_rate?: number | null
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      country_audit_log: {
        Row: {
          action: string
          changed_by: string | null
          changes: Json | null
          country_code: string
          created_at: string
          id: string
          summary: string | null
          summary_ar: string | null
        }
        Insert: {
          action: string
          changed_by?: string | null
          changes?: Json | null
          country_code: string
          created_at?: string
          id?: string
          summary?: string | null
          summary_ar?: string | null
        }
        Update: {
          action?: string
          changed_by?: string | null
          changes?: Json | null
          country_code?: string
          created_at?: string
          id?: string
          summary?: string | null
          summary_ar?: string | null
        }
        Relationships: []
      }
      country_services: {
        Row: {
          country_id: string
          created_at: string
          id: string
          is_active: boolean
          metadata: Json | null
          name: string
          name_ar: string | null
          service_key: string
          service_type: string
          sort_order: number | null
        }
        Insert: {
          country_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name: string
          name_ar?: string | null
          service_key: string
          service_type: string
          sort_order?: number | null
        }
        Update: {
          country_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name?: string
          name_ar?: string | null
          service_key?: string
          service_type?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "country_services_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_activities: {
        Row: {
          activity_type: string
          created_at: string
          description: string | null
          description_ar: string | null
          id: string
          lead_id: string
          metadata: Json | null
          title: string
          title_ar: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          lead_id: string
          metadata?: Json | null
          title: string
          title_ar?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          lead_id?: string
          metadata?: Json | null
          title?: string
          title_ar?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      culinary_entities: {
        Row: {
          abbreviation: string | null
          abbreviation_ar: string | null
          account_manager_id: string | null
          address: string | null
          address_ar: string | null
          affiliated_organizations: string[] | null
          city: string | null
          country: string | null
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          description_ar: string | null
          email: string | null
          entity_number: string
          fax: string | null
          founded_year: number | null
          gallery_urls: string[] | null
          id: string
          internal_notes: string | null
          is_verified: boolean | null
          is_visible: boolean
          latitude: number | null
          license_expires_at: string | null
          license_number: string | null
          logo_url: string | null
          longitude: number | null
          member_count: number | null
          mission: string | null
          mission_ar: string | null
          name: string
          name_ar: string | null
          phone: string | null
          postal_code: string | null
          president_name: string | null
          president_name_ar: string | null
          registered_at: string | null
          registration_number: string | null
          scope: Database["public"]["Enums"]["entity_scope"]
          secretary_name: string | null
          secretary_name_ar: string | null
          services: string[] | null
          slug: string
          social_links: Json | null
          specializations: string[] | null
          status: Database["public"]["Enums"]["entity_status"]
          tags: string[] | null
          type: Database["public"]["Enums"]["entity_type"]
          updated_at: string
          username: string | null
          verification_level: string | null
          verified_at: string | null
          view_count: number | null
          website: string | null
        }
        Insert: {
          abbreviation?: string | null
          abbreviation_ar?: string | null
          account_manager_id?: string | null
          address?: string | null
          address_ar?: string | null
          affiliated_organizations?: string[] | null
          city?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          email?: string | null
          entity_number: string
          fax?: string | null
          founded_year?: number | null
          gallery_urls?: string[] | null
          id?: string
          internal_notes?: string | null
          is_verified?: boolean | null
          is_visible?: boolean
          latitude?: number | null
          license_expires_at?: string | null
          license_number?: string | null
          logo_url?: string | null
          longitude?: number | null
          member_count?: number | null
          mission?: string | null
          mission_ar?: string | null
          name: string
          name_ar?: string | null
          phone?: string | null
          postal_code?: string | null
          president_name?: string | null
          president_name_ar?: string | null
          registered_at?: string | null
          registration_number?: string | null
          scope?: Database["public"]["Enums"]["entity_scope"]
          secretary_name?: string | null
          secretary_name_ar?: string | null
          services?: string[] | null
          slug: string
          social_links?: Json | null
          specializations?: string[] | null
          status?: Database["public"]["Enums"]["entity_status"]
          tags?: string[] | null
          type: Database["public"]["Enums"]["entity_type"]
          updated_at?: string
          username?: string | null
          verification_level?: string | null
          verified_at?: string | null
          view_count?: number | null
          website?: string | null
        }
        Update: {
          abbreviation?: string | null
          abbreviation_ar?: string | null
          account_manager_id?: string | null
          address?: string | null
          address_ar?: string | null
          affiliated_organizations?: string[] | null
          city?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          email?: string | null
          entity_number?: string
          fax?: string | null
          founded_year?: number | null
          gallery_urls?: string[] | null
          id?: string
          internal_notes?: string | null
          is_verified?: boolean | null
          is_visible?: boolean
          latitude?: number | null
          license_expires_at?: string | null
          license_number?: string | null
          logo_url?: string | null
          longitude?: number | null
          member_count?: number | null
          mission?: string | null
          mission_ar?: string | null
          name?: string
          name_ar?: string | null
          phone?: string | null
          postal_code?: string | null
          president_name?: string | null
          president_name_ar?: string | null
          registered_at?: string | null
          registration_number?: string | null
          scope?: Database["public"]["Enums"]["entity_scope"]
          secretary_name?: string | null
          secretary_name_ar?: string | null
          services?: string[] | null
          slug?: string
          social_links?: Json | null
          specializations?: string[] | null
          status?: Database["public"]["Enums"]["entity_status"]
          tags?: string[] | null
          type?: Database["public"]["Enums"]["entity_type"]
          updated_at?: string
          username?: string | null
          verification_level?: string | null
          verified_at?: string | null
          view_count?: number | null
          website?: string | null
        }
        Relationships: []
      }
      customer_custom_fields: {
        Row: {
          created_at: string
          field_name: string
          field_type: string | null
          field_value: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          field_name: string
          field_type?: string | null
          field_value?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          field_name?: string
          field_type?: string | null
          field_value?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      customer_group_members: {
        Row: {
          added_by: string | null
          created_at: string
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "customer_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_groups: {
        Row: {
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          description_ar: string | null
          id: string
          is_active: boolean | null
          name: string
          name_ar: string | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_ar?: string | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_ar?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      customer_loyalty_points: {
        Row: {
          created_at: string
          description: string | null
          description_ar: string | null
          expires_at: string | null
          id: string
          points: number
          reference_id: string | null
          reference_type: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          expires_at?: string | null
          id?: string
          points?: number
          reference_id?: string | null
          reference_type?: string | null
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          expires_at?: string | null
          id?: string
          points?: number
          reference_id?: string | null
          reference_type?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      customer_wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          created_by: string | null
          description: string | null
          description_ar: string | null
          id: string
          reference_id: string | null
          reference_type: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount?: number
          balance_after?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      customer_wishlist: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_image_url: string | null
          item_name: string | null
          item_name_ar: string | null
          item_price: number | null
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_image_url?: string | null
          item_name?: string | null
          item_name_ar?: string | null
          item_price?: number | null
          item_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_image_url?: string | null
          item_name?: string | null
          item_name_ar?: string | null
          item_price?: number | null
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      deliberation_messages: {
        Row: {
          created_at: string | null
          deliberation_id: string
          id: string
          message: string
          message_ar: string | null
          sender_id: string
        }
        Insert: {
          created_at?: string | null
          deliberation_id: string
          id?: string
          message: string
          message_ar?: string | null
          sender_id: string
        }
        Update: {
          created_at?: string | null
          deliberation_id?: string
          id?: string
          message?: string
          message_ar?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliberation_messages_deliberation_id_fkey"
            columns: ["deliberation_id"]
            isOneToOne: false
            referencedRelation: "judge_deliberations"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_badges: {
        Row: {
          badge_type: Database["public"]["Enums"]["badge_type"]
          color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          description_ar: string | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          name: string
          name_ar: string | null
        }
        Insert: {
          badge_type: Database["public"]["Enums"]["badge_type"]
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_ar?: string | null
        }
        Update: {
          badge_type?: Database["public"]["Enums"]["badge_type"]
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_ar?: string | null
        }
        Relationships: []
      }
      email_verifications: {
        Row: {
          attempts: number | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          locked_until: string | null
          max_attempts: number | null
          updated_at: string | null
          user_id: string | null
          verification_code: string
          verified_at: string | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          email: string
          expires_at?: string
          id?: string
          locked_until?: string | null
          max_attempts?: number | null
          updated_at?: string | null
          user_id?: string | null
          verification_code: string
          verified_at?: string | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          locked_until?: string | null
          max_attempts?: number | null
          updated_at?: string | null
          user_id?: string | null
          verification_code?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      entity_competition_participations: {
        Row: {
          competition_id: string
          created_at: string
          entity_id: string
          id: string
          notes: string | null
          participation_type: string
          status: string
          student_count: number | null
        }
        Insert: {
          competition_id: string
          created_at?: string
          entity_id: string
          id?: string
          notes?: string | null
          participation_type?: string
          status?: string
          student_count?: number | null
        }
        Update: {
          competition_id?: string
          created_at?: string
          entity_id?: string
          id?: string
          notes?: string | null
          participation_type?: string
          status?: string
          student_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_competition_participations_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_competition_participations_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_competition_participations_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "culinary_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_degrees: {
        Row: {
          certificate_number: string | null
          created_at: string
          degree_name: string
          degree_name_ar: string | null
          degree_type: string
          document_url: string | null
          entity_id: string
          field_of_study: string | null
          field_of_study_ar: string | null
          gpa: string | null
          graduation_date: string | null
          honors: string | null
          id: string
          is_public: boolean | null
          is_verified: boolean | null
          issue_date: string | null
          program_id: string | null
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          certificate_number?: string | null
          created_at?: string
          degree_name: string
          degree_name_ar?: string | null
          degree_type: string
          document_url?: string | null
          entity_id: string
          field_of_study?: string | null
          field_of_study_ar?: string | null
          gpa?: string | null
          graduation_date?: string | null
          honors?: string | null
          id?: string
          is_public?: boolean | null
          is_verified?: boolean | null
          issue_date?: string | null
          program_id?: string | null
          updated_at?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          certificate_number?: string | null
          created_at?: string
          degree_name?: string
          degree_name_ar?: string | null
          degree_type?: string
          document_url?: string | null
          entity_id?: string
          field_of_study?: string | null
          field_of_study_ar?: string | null
          gpa?: string | null
          graduation_date?: string | null
          honors?: string | null
          id?: string
          is_public?: boolean | null
          is_verified?: boolean | null
          issue_date?: string | null
          program_id?: string | null
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_degrees_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "culinary_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_degrees_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "entity_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_event_attendees: {
        Row: {
          attended_at: string | null
          event_id: string
          id: string
          registered_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          attended_at?: string | null
          event_id: string
          id?: string
          registered_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          attended_at?: string | null
          event_id?: string
          id?: string
          registered_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "entity_events"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_events: {
        Row: {
          competition_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          description_ar: string | null
          end_date: string | null
          entity_id: string
          event_type: string
          id: string
          image_url: string | null
          is_public: boolean | null
          is_virtual: boolean | null
          location: string | null
          location_ar: string | null
          max_attendees: number | null
          meeting_url: string | null
          start_date: string | null
          status: string
          title: string
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          competition_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          end_date?: string | null
          entity_id: string
          event_type?: string
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          is_virtual?: boolean | null
          location?: string | null
          location_ar?: string | null
          max_attendees?: number | null
          meeting_url?: string | null
          start_date?: string | null
          status?: string
          title: string
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          competition_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          end_date?: string | null
          entity_id?: string
          event_type?: string
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          is_virtual?: boolean | null
          location?: string | null
          location_ar?: string | null
          max_attendees?: number | null
          meeting_url?: string | null
          start_date?: string | null
          status?: string
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_events_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_events_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_events_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "culinary_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_followers: {
        Row: {
          created_at: string
          entity_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_followers_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "culinary_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_memberships: {
        Row: {
          created_at: string
          department: string | null
          department_ar: string | null
          enrollment_date: string | null
          entity_id: string
          graduation_date: string | null
          id: string
          is_public: boolean | null
          membership_type: string
          notes: string | null
          status: string
          student_id: string | null
          title: string | null
          title_ar: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          department_ar?: string | null
          enrollment_date?: string | null
          entity_id: string
          graduation_date?: string | null
          id?: string
          is_public?: boolean | null
          membership_type?: string
          notes?: string | null
          status?: string
          student_id?: string | null
          title?: string | null
          title_ar?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string | null
          department_ar?: string | null
          enrollment_date?: string | null
          entity_id?: string
          graduation_date?: string | null
          id?: string
          is_public?: boolean | null
          membership_type?: string
          notes?: string | null
          status?: string
          student_id?: string | null
          title?: string | null
          title_ar?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_memberships_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "culinary_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_positions: {
        Row: {
          created_at: string
          end_date: string | null
          entity_id: string
          id: string
          is_active: boolean | null
          notes: string | null
          position_title: string | null
          position_title_ar: string | null
          position_type: string
          sort_order: number | null
          start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          entity_id: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          position_title?: string | null
          position_title_ar?: string | null
          position_type?: string
          sort_order?: number | null
          start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          entity_id?: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          position_title?: string | null
          position_title_ar?: string | null
          position_type?: string
          sort_order?: number | null
          start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_positions_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "culinary_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_positions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "entity_positions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["user_id"]
          },
        ]
      }
      entity_program_enrollments: {
        Row: {
          completed_at: string | null
          created_at: string
          enrolled_at: string | null
          grade: string | null
          id: string
          notes: string | null
          program_id: string
          progress_percent: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          enrolled_at?: string | null
          grade?: string | null
          id?: string
          notes?: string | null
          program_id: string
          progress_percent?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          enrolled_at?: string | null
          grade?: string | null
          id?: string
          notes?: string | null
          program_id?: string
          progress_percent?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_program_enrollments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "entity_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_programs: {
        Row: {
          created_at: string
          created_by: string | null
          credits: number | null
          currency: string | null
          description: string | null
          description_ar: string | null
          duration_months: number | null
          end_date: string | null
          enrollment_deadline: string | null
          entity_id: string
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          language: string | null
          level: string | null
          max_students: number | null
          name: string
          name_ar: string | null
          prerequisites: string | null
          prerequisites_ar: string | null
          program_type: string
          schedule: Json | null
          start_date: string | null
          status: string
          syllabus: Json | null
          tuition_fee: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          credits?: number | null
          currency?: string | null
          description?: string | null
          description_ar?: string | null
          duration_months?: number | null
          end_date?: string | null
          enrollment_deadline?: string | null
          entity_id: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          language?: string | null
          level?: string | null
          max_students?: number | null
          name: string
          name_ar?: string | null
          prerequisites?: string | null
          prerequisites_ar?: string | null
          program_type?: string
          schedule?: Json | null
          start_date?: string | null
          status?: string
          syllabus?: Json | null
          tuition_fee?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          credits?: number | null
          currency?: string | null
          description?: string | null
          description_ar?: string | null
          duration_months?: number | null
          end_date?: string | null
          enrollment_deadline?: string | null
          entity_id?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          language?: string | null
          level?: string | null
          max_students?: number | null
          name?: string
          name_ar?: string | null
          prerequisites?: string | null
          prerequisites_ar?: string | null
          program_type?: string
          schedule?: Json | null
          start_date?: string | null
          status?: string
          syllabus?: Json | null
          tuition_fee?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_programs_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "culinary_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      establishments: {
        Row: {
          address: string | null
          address_ar: string | null
          city: string | null
          city_ar: string | null
          country_code: string | null
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          cuisine_type: string | null
          cuisine_type_ar: string | null
          description: string | null
          description_ar: string | null
          email: string | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          logo_url: string | null
          name: string
          name_ar: string | null
          phone: string | null
          star_rating: number | null
          type: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          address_ar?: string | null
          city?: string | null
          city_ar?: string | null
          country_code?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          cuisine_type?: string | null
          cuisine_type_ar?: string | null
          description?: string | null
          description_ar?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          name: string
          name_ar?: string | null
          phone?: string | null
          star_rating?: number | null
          type?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          address_ar?: string | null
          city?: string | null
          city_ar?: string | null
          country_code?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          cuisine_type?: string | null
          cuisine_type_ar?: string | null
          description?: string | null
          description_ar?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          name?: string
          name_ar?: string | null
          phone?: string | null
          star_rating?: number | null
          type?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      evaluation_criteria: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          description_ar: string | null
          id: string
          is_active: boolean | null
          is_required: boolean | null
          max_score: number
          name: string
          name_ar: string | null
          scoring_guide: Json | null
          scoring_guide_ar: Json | null
          sort_order: number | null
          updated_at: string
          weight: number
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          max_score?: number
          name: string
          name_ar?: string | null
          scoring_guide?: Json | null
          scoring_guide_ar?: Json | null
          sort_order?: number | null
          updated_at?: string
          weight?: number
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          max_score?: number
          name?: string
          name_ar?: string | null
          scoring_guide?: Json | null
          scoring_guide_ar?: Json | null
          sort_order?: number | null
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_criteria_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "evaluation_criteria_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_criteria_categories: {
        Row: {
          created_at: string
          description: string | null
          description_ar: string | null
          domain_id: string
          id: string
          is_active: boolean | null
          name: string
          name_ar: string | null
          product_category: string | null
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          domain_id: string
          id?: string
          is_active?: boolean | null
          name: string
          name_ar?: string | null
          product_category?: string | null
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          domain_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
          name_ar?: string | null
          product_category?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_criteria_categories_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "evaluation_domains"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_domains: {
        Row: {
          created_at: string
          description: string | null
          description_ar: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          name_ar: string | null
          slug: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_ar?: string | null
          slug: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_ar?: string | null
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      evaluation_invitations: {
        Row: {
          chef_id: string
          created_at: string
          currency: string | null
          decline_reason: string | null
          domain_slug: string
          evaluation_date: string | null
          evaluation_location: string | null
          evaluation_location_ar: string | null
          expected_duration_minutes: number | null
          id: string
          invited_by: string | null
          notes: string | null
          notes_ar: string | null
          offered_amount: number | null
          product_description: string | null
          product_description_ar: string | null
          product_images: string[] | null
          product_name: string | null
          product_name_ar: string | null
          responded_at: string | null
          response_deadline: string | null
          session_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          chef_id: string
          created_at?: string
          currency?: string | null
          decline_reason?: string | null
          domain_slug?: string
          evaluation_date?: string | null
          evaluation_location?: string | null
          evaluation_location_ar?: string | null
          expected_duration_minutes?: number | null
          id?: string
          invited_by?: string | null
          notes?: string | null
          notes_ar?: string | null
          offered_amount?: number | null
          product_description?: string | null
          product_description_ar?: string | null
          product_images?: string[] | null
          product_name?: string | null
          product_name_ar?: string | null
          responded_at?: string | null
          response_deadline?: string | null
          session_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          chef_id?: string
          created_at?: string
          currency?: string | null
          decline_reason?: string | null
          domain_slug?: string
          evaluation_date?: string | null
          evaluation_location?: string | null
          evaluation_location_ar?: string | null
          expected_duration_minutes?: number | null
          id?: string
          invited_by?: string | null
          notes?: string | null
          notes_ar?: string | null
          offered_amount?: number | null
          product_description?: string | null
          product_description_ar?: string | null
          product_images?: string[] | null
          product_name?: string | null
          product_name_ar?: string | null
          responded_at?: string | null
          response_deadline?: string | null
          session_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      evaluation_pricing: {
        Row: {
          base_fee: number
          created_at: string
          currency: string
          description: string | null
          description_ar: string | null
          id: string
          is_active: boolean | null
          name: string
          name_ar: string | null
          per_chef_fee: number
          product_category: string | null
          updated_at: string
        }
        Insert: {
          base_fee?: number
          created_at?: string
          currency?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_ar?: string | null
          per_chef_fee?: number
          product_category?: string | null
          updated_at?: string
        }
        Update: {
          base_fee?: number
          created_at?: string
          currency?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_ar?: string | null
          per_chef_fee?: number
          product_category?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      evaluation_reports: {
        Row: {
          category_scores: Json | null
          created_at: string
          criteria_count: number | null
          domain_slug: string
          entity_id: string
          evaluator_count: number | null
          generated_at: string | null
          generated_by: string | null
          id: string
          images: string[] | null
          overall_score: number | null
          recommendations: Json | null
          report_number: string | null
          status: string
          strengths: Json | null
          summary: string | null
          summary_ar: string | null
          title: string
          title_ar: string | null
          updated_at: string
          weaknesses: Json | null
        }
        Insert: {
          category_scores?: Json | null
          created_at?: string
          criteria_count?: number | null
          domain_slug: string
          entity_id: string
          evaluator_count?: number | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          images?: string[] | null
          overall_score?: number | null
          recommendations?: Json | null
          report_number?: string | null
          status?: string
          strengths?: Json | null
          summary?: string | null
          summary_ar?: string | null
          title: string
          title_ar?: string | null
          updated_at?: string
          weaknesses?: Json | null
        }
        Update: {
          category_scores?: Json | null
          created_at?: string
          criteria_count?: number | null
          domain_slug?: string
          entity_id?: string
          evaluator_count?: number | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          images?: string[] | null
          overall_score?: number | null
          recommendations?: Json | null
          report_number?: string | null
          status?: string
          strengths?: Json | null
          summary?: string | null
          summary_ar?: string | null
          title?: string
          title_ar?: string | null
          updated_at?: string
          weaknesses?: Json | null
        }
        Relationships: []
      }
      evaluation_scores: {
        Row: {
          created_at: string
          criterion_id: string
          domain_slug: string
          entity_id: string
          evaluator_id: string
          evidence_urls: string[] | null
          id: string
          notes: string | null
          notes_ar: string | null
          score: number
          subject_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          criterion_id: string
          domain_slug: string
          entity_id: string
          evaluator_id: string
          evidence_urls?: string[] | null
          id?: string
          notes?: string | null
          notes_ar?: string | null
          score: number
          subject_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          criterion_id?: string
          domain_slug?: string
          entity_id?: string
          evaluator_id?: string
          evidence_urls?: string[] | null
          id?: string
          notes?: string | null
          notes_ar?: string | null
          score?: number
          subject_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_scores_criterion_id_fkey"
            columns: ["criterion_id"]
            isOneToOne: false
            referencedRelation: "evaluation_criteria"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_stages: {
        Row: {
          competition_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          name_ar: string | null
          sort_order: number | null
          stage_type: string
          weight_percentage: number | null
        }
        Insert: {
          competition_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_ar?: string | null
          sort_order?: number | null
          stage_type?: string
          weight_percentage?: number | null
        }
        Update: {
          competition_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_ar?: string | null
          sort_order?: number | null
          stage_type?: string
          weight_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_stages_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_stages_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions_public"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_templates: {
        Row: {
          created_at: string
          created_by: string | null
          criteria_snapshot: Json
          description: string | null
          description_ar: string | null
          domain_id: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          name_ar: string | null
          product_category: string | null
          template_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          criteria_snapshot?: Json
          description?: string | null
          description_ar?: string | null
          domain_id: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          name_ar?: string | null
          product_category?: string | null
          template_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          criteria_snapshot?: Json
          description?: string | null
          description_ar?: string | null
          domain_id?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          name_ar?: string | null
          product_category?: string | null
          template_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_templates_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "evaluation_domains"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attendees: {
        Row: {
          event_id: string
          id: string
          registered_at: string
          status: string | null
          user_id: string
        }
        Insert: {
          event_id: string
          id?: string
          registered_at?: string
          status?: string | null
          user_id: string
        }
        Update: {
          event_id?: string
          id?: string
          registered_at?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "community_events"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibition_agenda_favorites: {
        Row: {
          agenda_item_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          agenda_item_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          agenda_item_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exhibition_agenda_favorites_agenda_item_id_fkey"
            columns: ["agenda_item_id"]
            isOneToOne: false
            referencedRelation: "exhibition_agenda_items"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibition_agenda_items: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          day_date: string
          description: string | null
          description_ar: string | null
          end_time: string | null
          exhibition_id: string
          id: string
          is_highlighted: boolean | null
          location: string | null
          location_ar: string | null
          sort_order: number | null
          speaker_image_url: string | null
          speaker_name: string | null
          speaker_name_ar: string | null
          start_time: string
          title: string
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          day_date: string
          description?: string | null
          description_ar?: string | null
          end_time?: string | null
          exhibition_id: string
          id?: string
          is_highlighted?: boolean | null
          location?: string | null
          location_ar?: string | null
          sort_order?: number | null
          speaker_image_url?: string | null
          speaker_name?: string | null
          speaker_name_ar?: string | null
          start_time: string
          title: string
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          day_date?: string
          description?: string | null
          description_ar?: string | null
          end_time?: string | null
          exhibition_id?: string
          id?: string
          is_highlighted?: boolean | null
          location?: string | null
          location_ar?: string | null
          sort_order?: number | null
          speaker_image_url?: string | null
          speaker_name?: string | null
          speaker_name_ar?: string | null
          start_time?: string
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exhibition_agenda_items_exhibition_id_fkey"
            columns: ["exhibition_id"]
            isOneToOne: false
            referencedRelation: "exhibitions"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibition_analytics_events: {
        Row: {
          country: string | null
          created_at: string
          device_type: string | null
          event_data: Json | null
          event_type: string
          exhibition_id: string
          id: string
          source: string | null
          user_id: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_data?: Json | null
          event_type?: string
          exhibition_id: string
          id?: string
          source?: string | null
          user_id?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_data?: Json | null
          event_type?: string
          exhibition_id?: string
          id?: string
          source?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exhibition_analytics_events_exhibition_id_fkey"
            columns: ["exhibition_id"]
            isOneToOne: false
            referencedRelation: "exhibitions"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibition_auction_bids: {
        Row: {
          amount: number
          auction_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          amount: number
          auction_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          amount?: number
          auction_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exhibition_auction_bids_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "exhibition_auctions"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibition_auctions: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string | null
          current_price: number
          description: string | null
          description_ar: string | null
          ends_at: string
          exhibition_id: string
          id: string
          image_url: string | null
          min_increment: number
          starting_price: number
          starts_at: string
          status: string
          title: string
          title_ar: string | null
          updated_at: string
          winner_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string | null
          current_price?: number
          description?: string | null
          description_ar?: string | null
          ends_at: string
          exhibition_id: string
          id?: string
          image_url?: string | null
          min_increment?: number
          starting_price?: number
          starts_at: string
          status?: string
          title: string
          title_ar?: string | null
          updated_at?: string
          winner_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string | null
          current_price?: number
          description?: string | null
          description_ar?: string | null
          ends_at?: string
          exhibition_id?: string
          id?: string
          image_url?: string | null
          min_increment?: number
          starting_price?: number
          starts_at?: string
          status?: string
          title?: string
          title_ar?: string | null
          updated_at?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exhibition_auctions_exhibition_id_fkey"
            columns: ["exhibition_id"]
            isOneToOne: false
            referencedRelation: "exhibitions"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibition_booth_requests: {
        Row: {
          admin_notes: string | null
          booth_id: string | null
          company_name: string
          company_name_ar: string | null
          contact_email: string
          contact_name: string
          contact_phone: string | null
          created_at: string
          description: string | null
          description_ar: string | null
          exhibition_id: string
          id: string
          logo_url: string | null
          preferred_category: string | null
          preferred_hall: string | null
          preferred_size: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          special_requirements: string | null
          status: string | null
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          admin_notes?: string | null
          booth_id?: string | null
          company_name: string
          company_name_ar?: string | null
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          exhibition_id: string
          id?: string
          logo_url?: string | null
          preferred_category?: string | null
          preferred_hall?: string | null
          preferred_size?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          special_requirements?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          admin_notes?: string | null
          booth_id?: string | null
          company_name?: string
          company_name_ar?: string | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          exhibition_id?: string
          id?: string
          logo_url?: string | null
          preferred_category?: string | null
          preferred_hall?: string | null
          preferred_size?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          special_requirements?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exhibition_booth_requests_booth_id_fkey"
            columns: ["booth_id"]
            isOneToOne: false
            referencedRelation: "exhibition_booths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exhibition_booth_requests_exhibition_id_fkey"
            columns: ["exhibition_id"]
            isOneToOne: false
            referencedRelation: "exhibitions"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibition_booths: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          booth_number: string
          category: string | null
          color_hex: string | null
          company_id: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          currency: string | null
          description: string | null
          description_ar: string | null
          exhibition_id: string
          floor_level: string | null
          hall: string | null
          hall_ar: string | null
          id: string
          is_featured: boolean | null
          location_x: number | null
          location_y: number | null
          logo_url: string | null
          name: string
          name_ar: string | null
          price: number | null
          size: string | null
          status: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          booth_number: string
          category?: string | null
          color_hex?: string | null
          company_id?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          description_ar?: string | null
          exhibition_id: string
          floor_level?: string | null
          hall?: string | null
          hall_ar?: string | null
          id?: string
          is_featured?: boolean | null
          location_x?: number | null
          location_y?: number | null
          logo_url?: string | null
          name: string
          name_ar?: string | null
          price?: number | null
          size?: string | null
          status?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          booth_number?: string
          category?: string | null
          color_hex?: string | null
          company_id?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          description_ar?: string | null
          exhibition_id?: string
          floor_level?: string | null
          hall?: string | null
          hall_ar?: string | null
          id?: string
          is_featured?: boolean | null
          location_x?: number | null
          location_y?: number | null
          logo_url?: string | null
          name?: string
          name_ar?: string | null
          price?: number | null
          size?: string | null
          status?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exhibition_booths_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exhibition_booths_exhibition_id_fkey"
            columns: ["exhibition_id"]
            isOneToOne: false
            referencedRelation: "exhibitions"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibition_cooking_sessions: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          booth_id: string | null
          chef_id: string
          created_at: string
          created_by: string | null
          cuisine_type: string | null
          description: string | null
          description_ar: string | null
          difficulty: string | null
          equipment: string[] | null
          exhibition_id: string
          id: string
          ingredients: string[] | null
          is_featured: boolean | null
          max_audience: number | null
          scheduled_end: string
          scheduled_start: string
          status: string | null
          stream_url: string | null
          thumbnail_url: string | null
          title: string
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          booth_id?: string | null
          chef_id: string
          created_at?: string
          created_by?: string | null
          cuisine_type?: string | null
          description?: string | null
          description_ar?: string | null
          difficulty?: string | null
          equipment?: string[] | null
          exhibition_id: string
          id?: string
          ingredients?: string[] | null
          is_featured?: boolean | null
          max_audience?: number | null
          scheduled_end: string
          scheduled_start: string
          status?: string | null
          stream_url?: string | null
          thumbnail_url?: string | null
          title: string
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          booth_id?: string | null
          chef_id?: string
          created_at?: string
          created_by?: string | null
          cuisine_type?: string | null
          description?: string | null
          description_ar?: string | null
          difficulty?: string | null
          equipment?: string[] | null
          exhibition_id?: string
          id?: string
          ingredients?: string[] | null
          is_featured?: boolean | null
          max_audience?: number | null
          scheduled_end?: string
          scheduled_start?: string
          status?: string | null
          stream_url?: string | null
          thumbnail_url?: string | null
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exhibition_cooking_sessions_booth_id_fkey"
            columns: ["booth_id"]
            isOneToOne: false
            referencedRelation: "exhibition_booths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exhibition_cooking_sessions_exhibition_id_fkey"
            columns: ["exhibition_id"]
            isOneToOne: false
            referencedRelation: "exhibitions"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibition_discount_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          discount_type: string
          discount_value: number
          exhibition_id: string
          id: string
          is_active: boolean
          max_uses: number | null
          updated_at: string
          used_count: number
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          discount_type?: string
          discount_value?: number
          exhibition_id: string
          id?: string
          is_active?: boolean
          max_uses?: number | null
          updated_at?: string
          used_count?: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          discount_type?: string
          discount_value?: number
          exhibition_id?: string
          id?: string
          is_active?: boolean
          max_uses?: number | null
          updated_at?: string
          used_count?: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exhibition_discount_codes_exhibition_id_fkey"
            columns: ["exhibition_id"]
            isOneToOne: false
            referencedRelation: "exhibitions"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibition_documents: {
        Row: {
          category: string
          created_at: string
          description: string | null
          description_ar: string | null
          exhibition_id: string
          feed_to_ai: boolean | null
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          is_public: boolean | null
          title: string
          title_ar: string | null
          uploaded_by: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          exhibition_id: string
          feed_to_ai?: boolean | null
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          is_public?: boolean | null
          title: string
          title_ar?: string | null
          uploaded_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          exhibition_id?: string
          feed_to_ai?: boolean | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          is_public?: boolean | null
          title?: string
          title_ar?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exhibition_documents_exhibition_id_fkey"
            columns: ["exhibition_id"]
            isOneToOne: false
            referencedRelation: "exhibitions"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibition_followers: {
        Row: {
          created_at: string
          exhibition_id: string
          id: string
          notify_schedule: boolean | null
          notify_updates: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string
          exhibition_id: string
          id?: string
          notify_schedule?: boolean | null
          notify_updates?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string
          exhibition_id?: string
          id?: string
          notify_schedule?: boolean | null
          notify_updates?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exhibition_followers_exhibition_id_fkey"
            columns: ["exhibition_id"]
            isOneToOne: false
            referencedRelation: "exhibitions"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibition_invites: {
        Row: {
          code: string
          created_at: string
          created_by: string
          exhibition_id: string
          expires_at: string | null
          id: string
          is_active: boolean
          label: string | null
          max_uses: number | null
          use_count: number
        }
        Insert: {
          code?: string
          created_at?: string
          created_by: string
          exhibition_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          label?: string | null
          max_uses?: number | null
          use_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          exhibition_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          label?: string | null
          max_uses?: number | null
          use_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "exhibition_invites_exhibition_id_fkey"
            columns: ["exhibition_id"]
            isOneToOne: false
            referencedRelation: "exhibitions"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibition_loyalty_actions: {
        Row: {
          action_type: string
          created_at: string
          exhibition_id: string
          id: string
          metadata: Json | null
          points_earned: number
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          exhibition_id: string
          id?: string
          metadata?: Json | null
          points_earned?: number
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          exhibition_id?: string
          id?: string
          metadata?: Json | null
          points_earned?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exhibition_loyalty_actions_exhibition_id_fkey"
            columns: ["exhibition_id"]
            isOneToOne: false
            referencedRelation: "exhibitions"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibition_map_waypoints: {
        Row: {
          booth_id: string | null
          created_at: string
          description: string | null
          description_ar: string | null
          exhibition_id: string
          floor_number: number | null
          icon: string | null
          id: string
          is_accessible: boolean | null
          name: string
          name_ar: string | null
          sort_order: number | null
          waypoint_type: string
          x_position: number
          y_position: number
        }
        Insert: {
          booth_id?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          exhibition_id: string
          floor_number?: number | null
          icon?: string | null
          id?: string
          is_accessible?: boolean | null
          name: string
          name_ar?: string | null
          sort_order?: number | null
          waypoint_type?: string
          x_position?: number
          y_position?: number
        }
        Update: {
          booth_id?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          exhibition_id?: string
          floor_number?: number | null
          icon?: string | null
          id?: string
          is_accessible?: boolean | null
          name?: string
          name_ar?: string | null
          sort_order?: number | null
          waypoint_type?: string
          x_position?: number
          y_position?: number
        }
        Relationships: [
          {
            foreignKeyName: "exhibition_map_waypoints_booth_id_fkey"
            columns: ["booth_id"]
            isOneToOne: false
            referencedRelation: "exhibition_booths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exhibition_map_waypoints_exhibition_id_fkey"
            columns: ["exhibition_id"]
            isOneToOne: false
            referencedRelation: "exhibitions"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibition_media: {
        Row: {
          category: string
          created_at: string
          exhibition_id: string
          file_type: string | null
          file_url: string
          id: string
          sort_order: number | null
          title: string | null
          title_ar: string | null
          uploaded_by: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          exhibition_id: string
          file_type?: string | null
          file_url: string
          id?: string
          sort_order?: number | null
          title?: string | null
          title_ar?: string | null
          uploaded_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          exhibition_id?: string
          file_type?: string | null
          file_url?: string
          id?: string
          sort_order?: number | null
          title?: string | null
          title_ar?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exhibition_media_exhibition_id_fkey"
            columns: ["exhibition_id"]
            isOneToOne: false
            referencedRelation: "exhibitions"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibition_offers: {
        Row: {
          booth_id: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          description: string | null
          description_ar: string | null
          discount_percent: number | null
          ends_at: string
          exhibition_id: string
          id: string
          image_url: string | null
          is_active: boolean | null
          offer_price: number
          original_price: number | null
          quantity_available: number | null
          quantity_claimed: number | null
          starts_at: string
          title: string
          title_ar: string | null
        }
        Insert: {
          booth_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          description_ar?: string | null
          discount_percent?: number | null
          ends_at: string
          exhibition_id: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          offer_price: number
          original_price?: number | null
          quantity_available?: number | null
          quantity_claimed?: number | null
          starts_at?: string
          title: string
          title_ar?: string | null
        }
        Update: {
          booth_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          description_ar?: string | null
          discount_percent?: number | null
          ends_at?: string
          exhibition_id?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          offer_price?: number
          original_price?: number | null
          quantity_available?: number | null
          quantity_claimed?: number | null
          starts_at?: string
          title?: string
          title_ar?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exhibition_offers_booth_id_fkey"
            columns: ["booth_id"]
            isOneToOne: false
            referencedRelation: "exhibition_booths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exhibition_offers_exhibition_id_fkey"
            columns: ["exhibition_id"]
            isOneToOne: false
            referencedRelation: "exhibitions"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibition_officials: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          exhibition_id: string
          full_name: string
          full_name_ar: string | null
          id: string
          phone: string | null
          role_title: string
          role_title_ar: string | null
          sort_order: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          exhibition_id: string
          full_name: string
          full_name_ar?: string | null
          id?: string
          phone?: string | null
          role_title: string
          role_title_ar?: string | null
          sort_order?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          exhibition_id?: string
          full_name?: string
          full_name_ar?: string | null
          id?: string
          phone?: string | null
          role_title?: string
          role_title_ar?: string | null
          sort_order?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exhibition_officials_exhibition_id_fkey"
            columns: ["exhibition_id"]
            isOneToOne: false
            referencedRelation: "exhibitions"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibition_review_replies: {
        Row: {
          content: string
          created_at: string
          id: string
          review_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          review_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exhibition_review_replies_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "exhibition_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibition_review_reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          review_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          review_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          review_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exhibition_review_reports_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "exhibition_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibition_review_votes: {
        Row: {
          created_at: string
          id: string
          review_id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          review_id: string
          user_id: string
          vote_type?: string
        }
        Update: {
          created_at?: string
          id?: string
          review_id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "exhibition_review_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "exhibition_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibition_reviews: {
        Row: {
          content: string | null
          content_ar: string | null
          created_at: string
          exhibition_id: string
          helpful_count: number | null
          id: string
          is_published: boolean | null
          is_verified_attendee: boolean | null
          organizer_response: string | null
          organizer_response_at: string | null
          organizer_response_by: string | null
          photo_urls: string[] | null
          rating: number
          reviewer_type: string | null
          title: string | null
          title_ar: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          content_ar?: string | null
          created_at?: string
          exhibition_id: string
          helpful_count?: number | null
          id?: string
          is_published?: boolean | null
          is_verified_attendee?: boolean | null
          organizer_response?: string | null
          organizer_response_at?: string | null
          organizer_response_by?: string | null
          photo_urls?: string[] | null
          rating: number
          reviewer_type?: string | null
          title?: string | null
          title_ar?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          content_ar?: string | null
          created_at?: string
          exhibition_id?: string
          helpful_count?: number | null
          id?: string
          is_published?: boolean | null
          is_verified_attendee?: boolean | null
          organizer_response?: string | null
          organizer_response_at?: string | null
          organizer_response_by?: string | null
          photo_urls?: string[] | null
          rating?: number
          reviewer_type?: string | null
          title?: string | null
          title_ar?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exhibition_reviews_exhibition_id_fkey"
            columns: ["exhibition_id"]
            isOneToOne: false
            referencedRelation: "exhibitions"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibition_schedule_items: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          description_ar: string | null
          end_time: string
          exhibition_id: string
          id: string
          is_featured: boolean | null
          location: string | null
          location_ar: string | null
          max_attendees: number | null
          sort_order: number | null
          speaker_image_url: string | null
          speaker_name: string | null
          speaker_name_ar: string | null
          start_time: string
          title: string
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          end_time: string
          exhibition_id: string
          id?: string
          is_featured?: boolean | null
          location?: string | null
          location_ar?: string | null
          max_attendees?: number | null
          sort_order?: number | null
          speaker_image_url?: string | null
          speaker_name?: string | null
          speaker_name_ar?: string | null
          start_time: string
          title: string
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          end_time?: string
          exhibition_id?: string
          id?: string
          is_featured?: boolean | null
          location?: string | null
          location_ar?: string | null
          max_attendees?: number | null
          sort_order?: number | null
          speaker_image_url?: string | null
          speaker_name?: string | null
          speaker_name_ar?: string | null
          start_time?: string
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exhibition_schedule_items_exhibition_id_fkey"
            columns: ["exhibition_id"]
            isOneToOne: false
            referencedRelation: "exhibitions"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibition_schedule_registrations: {
        Row: {
          created_at: string
          id: string
          schedule_item_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          schedule_item_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          schedule_item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exhibition_schedule_registrations_schedule_item_id_fkey"
            columns: ["schedule_item_id"]
            isOneToOne: false
            referencedRelation: "exhibition_schedule_items"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibition_session_interactions: {
        Row: {
          content: string | null
          created_at: string
          emoji: string | null
          id: string
          is_answered: boolean | null
          is_pinned: boolean | null
          session_id: string
          type: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          emoji?: string | null
          id?: string
          is_answered?: boolean | null
          is_pinned?: boolean | null
          session_id: string
          type?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          emoji?: string | null
          id?: string
          is_answered?: boolean | null
          is_pinned?: boolean | null
          session_id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exhibition_session_interactions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "exhibition_cooking_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibition_session_registrations: {
        Row: {
          attended: boolean | null
          id: string
          registered_at: string
          session_id: string
          user_id: string
        }
        Insert: {
          attended?: boolean | null
          id?: string
          registered_at?: string
          session_id: string
          user_id: string
        }
        Update: {
          attended?: boolean | null
          id?: string
          registered_at?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exhibition_session_registrations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "exhibition_cooking_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibition_social_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exhibition_social_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "exhibition_social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibition_social_posts: {
        Row: {
          content: string
          created_at: string
          exhibition_id: string
          hashtags: string[] | null
          id: string
          image_url: string | null
          is_approved: boolean | null
          is_pinned: boolean | null
          likes_count: number | null
          platform: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          exhibition_id: string
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          is_approved?: boolean | null
          is_pinned?: boolean | null
          likes_count?: number | null
          platform?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          exhibition_id?: string
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          is_approved?: boolean | null
          is_pinned?: boolean | null
          likes_count?: number | null
          platform?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exhibition_social_posts_exhibition_id_fkey"
            columns: ["exhibition_id"]
            isOneToOne: false
            referencedRelation: "exhibitions"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibition_survey_questions: {
        Row: {
          created_at: string
          id: string
          is_required: boolean
          options: Json | null
          question: string
          question_ar: string | null
          question_type: string
          sort_order: number
          survey_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_required?: boolean
          options?: Json | null
          question: string
          question_ar?: string | null
          question_type?: string
          sort_order?: number
          survey_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_required?: boolean
          options?: Json | null
          question?: string
          question_ar?: string | null
          question_type?: string
          sort_order?: number
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exhibition_survey_questions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "exhibition_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibition_survey_responses: {
        Row: {
          answers: Json
          id: string
          submitted_at: string
          survey_id: string
          user_id: string
        }
        Insert: {
          answers?: Json
          id?: string
          submitted_at?: string
          survey_id: string
          user_id: string
        }
        Update: {
          answers?: Json
          id?: string
          submitted_at?: string
          survey_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exhibition_survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "exhibition_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibition_surveys: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          description_ar: string | null
          exhibition_id: string
          id: string
          is_active: boolean
          survey_type: string
          title: string
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          exhibition_id: string
          id?: string
          is_active?: boolean
          survey_type?: string
          title: string
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          exhibition_id?: string
          id?: string
          is_active?: boolean
          survey_type?: string
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exhibition_surveys_exhibition_id_fkey"
            columns: ["exhibition_id"]
            isOneToOne: false
            referencedRelation: "exhibitions"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibition_ticket_types: {
        Row: {
          benefits: Json | null
          color: string | null
          created_at: string
          currency: string
          description: string | null
          description_ar: string | null
          exhibition_id: string
          id: string
          is_active: boolean
          max_quantity: number | null
          name: string
          name_ar: string | null
          price: number
          sold_count: number
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          benefits?: Json | null
          color?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          description_ar?: string | null
          exhibition_id: string
          id?: string
          is_active?: boolean
          max_quantity?: number | null
          name: string
          name_ar?: string | null
          price?: number
          sold_count?: number
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          benefits?: Json | null
          color?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          description_ar?: string | null
          exhibition_id?: string
          id?: string
          is_active?: boolean
          max_quantity?: number | null
          name?: string
          name_ar?: string | null
          price?: number
          sold_count?: number
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exhibition_ticket_types_exhibition_id_fkey"
            columns: ["exhibition_id"]
            isOneToOne: false
            referencedRelation: "exhibitions"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibition_tickets: {
        Row: {
          attendee_email: string | null
          attendee_name: string | null
          attendee_name_ar: string | null
          attendee_phone: string | null
          booking_date: string
          check_in_notes: string | null
          checked_in_at: string | null
          checked_in_by: string | null
          created_at: string
          currency: string | null
          discount_amount: number | null
          discount_code_id: string | null
          exhibition_id: string
          id: string
          notes: string | null
          price_paid: number | null
          qr_code: string | null
          status: string
          ticket_number: string
          ticket_type: string
          ticket_type_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attendee_email?: string | null
          attendee_name?: string | null
          attendee_name_ar?: string | null
          attendee_phone?: string | null
          booking_date?: string
          check_in_notes?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          currency?: string | null
          discount_amount?: number | null
          discount_code_id?: string | null
          exhibition_id: string
          id?: string
          notes?: string | null
          price_paid?: number | null
          qr_code?: string | null
          status?: string
          ticket_number?: string
          ticket_type?: string
          ticket_type_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attendee_email?: string | null
          attendee_name?: string | null
          attendee_name_ar?: string | null
          attendee_phone?: string | null
          booking_date?: string
          check_in_notes?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          currency?: string | null
          discount_amount?: number | null
          discount_code_id?: string | null
          exhibition_id?: string
          id?: string
          notes?: string | null
          price_paid?: number | null
          qr_code?: string | null
          status?: string
          ticket_number?: string
          ticket_type?: string
          ticket_type_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exhibition_tickets_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "exhibition_discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exhibition_tickets_exhibition_id_fkey"
            columns: ["exhibition_id"]
            isOneToOne: false
            referencedRelation: "exhibitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exhibition_tickets_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "exhibition_ticket_types"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibition_volunteer_tasks: {
        Row: {
          assigned_by: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          description_ar: string | null
          due_date: string | null
          exhibition_id: string
          id: string
          priority: string | null
          status: string | null
          title: string
          title_ar: string | null
          updated_at: string
          volunteer_id: string
        }
        Insert: {
          assigned_by?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          due_date?: string | null
          exhibition_id: string
          id?: string
          priority?: string | null
          status?: string | null
          title: string
          title_ar?: string | null
          updated_at?: string
          volunteer_id: string
        }
        Update: {
          assigned_by?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          due_date?: string | null
          exhibition_id?: string
          id?: string
          priority?: string | null
          status?: string | null
          title?: string
          title_ar?: string | null
          updated_at?: string
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exhibition_volunteer_tasks_exhibition_id_fkey"
            columns: ["exhibition_id"]
            isOneToOne: false
            referencedRelation: "exhibitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exhibition_volunteer_tasks_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "exhibition_volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibition_volunteers: {
        Row: {
          availability_end: string | null
          availability_start: string | null
          checked_in_at: string | null
          checked_out_at: string | null
          created_at: string
          exhibition_id: string
          id: string
          notes: string | null
          notes_ar: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          role_title: string | null
          role_title_ar: string | null
          skills: string[] | null
          status: string
          total_hours: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          availability_end?: string | null
          availability_start?: string | null
          checked_in_at?: string | null
          checked_out_at?: string | null
          created_at?: string
          exhibition_id: string
          id?: string
          notes?: string | null
          notes_ar?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role_title?: string | null
          role_title_ar?: string | null
          skills?: string[] | null
          status?: string
          total_hours?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          availability_end?: string | null
          availability_start?: string | null
          checked_in_at?: string | null
          checked_out_at?: string | null
          created_at?: string
          exhibition_id?: string
          id?: string
          notes?: string | null
          notes_ar?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role_title?: string | null
          role_title_ar?: string | null
          skills?: string[] | null
          status?: string
          total_hours?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exhibition_volunteers_exhibition_id_fkey"
            columns: ["exhibition_id"]
            isOneToOne: false
            referencedRelation: "exhibitions"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibitions: {
        Row: {
          address: string | null
          address_ar: string | null
          city: string | null
          country: string | null
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          description: string | null
          description_ar: string | null
          documents: Json | null
          early_bird_deadline: string | null
          end_date: string
          gallery_urls: string[] | null
          id: string
          import_source: string | null
          includes_competitions: boolean | null
          includes_seminars: boolean | null
          includes_training: boolean | null
          is_featured: boolean | null
          is_free: boolean | null
          is_virtual: boolean | null
          logo_url: string | null
          map_url: string | null
          max_attendees: number | null
          organizer_company_id: string | null
          organizer_email: string | null
          organizer_entity_id: string | null
          organizer_logo_url: string | null
          organizer_name: string | null
          organizer_name_ar: string | null
          organizer_phone: string | null
          organizer_type: string | null
          organizer_user_id: string | null
          organizer_website: string | null
          registration_deadline: string | null
          registration_url: string | null
          schedule: Json | null
          sections: Json | null
          slug: string
          social_links: Json | null
          speakers: Json | null
          sponsors_info: Json | null
          start_date: string
          status: Database["public"]["Enums"]["exhibition_status"]
          tags: string[] | null
          target_audience: string[] | null
          ticket_price: string | null
          ticket_price_ar: string | null
          title: string
          title_ar: string | null
          type: Database["public"]["Enums"]["exhibition_type"]
          updated_at: string
          venue: string | null
          venue_ar: string | null
          view_count: number | null
          virtual_link: string | null
          website_url: string | null
        }
        Insert: {
          address?: string | null
          address_ar?: string | null
          city?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          description_ar?: string | null
          documents?: Json | null
          early_bird_deadline?: string | null
          end_date: string
          gallery_urls?: string[] | null
          id?: string
          import_source?: string | null
          includes_competitions?: boolean | null
          includes_seminars?: boolean | null
          includes_training?: boolean | null
          is_featured?: boolean | null
          is_free?: boolean | null
          is_virtual?: boolean | null
          logo_url?: string | null
          map_url?: string | null
          max_attendees?: number | null
          organizer_company_id?: string | null
          organizer_email?: string | null
          organizer_entity_id?: string | null
          organizer_logo_url?: string | null
          organizer_name?: string | null
          organizer_name_ar?: string | null
          organizer_phone?: string | null
          organizer_type?: string | null
          organizer_user_id?: string | null
          organizer_website?: string | null
          registration_deadline?: string | null
          registration_url?: string | null
          schedule?: Json | null
          sections?: Json | null
          slug: string
          social_links?: Json | null
          speakers?: Json | null
          sponsors_info?: Json | null
          start_date: string
          status?: Database["public"]["Enums"]["exhibition_status"]
          tags?: string[] | null
          target_audience?: string[] | null
          ticket_price?: string | null
          ticket_price_ar?: string | null
          title: string
          title_ar?: string | null
          type?: Database["public"]["Enums"]["exhibition_type"]
          updated_at?: string
          venue?: string | null
          venue_ar?: string | null
          view_count?: number | null
          virtual_link?: string | null
          website_url?: string | null
        }
        Update: {
          address?: string | null
          address_ar?: string | null
          city?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          description_ar?: string | null
          documents?: Json | null
          early_bird_deadline?: string | null
          end_date?: string
          gallery_urls?: string[] | null
          id?: string
          import_source?: string | null
          includes_competitions?: boolean | null
          includes_seminars?: boolean | null
          includes_training?: boolean | null
          is_featured?: boolean | null
          is_free?: boolean | null
          is_virtual?: boolean | null
          logo_url?: string | null
          map_url?: string | null
          max_attendees?: number | null
          organizer_company_id?: string | null
          organizer_email?: string | null
          organizer_entity_id?: string | null
          organizer_logo_url?: string | null
          organizer_name?: string | null
          organizer_name_ar?: string | null
          organizer_phone?: string | null
          organizer_type?: string | null
          organizer_user_id?: string | null
          organizer_website?: string | null
          registration_deadline?: string | null
          registration_url?: string | null
          schedule?: Json | null
          sections?: Json | null
          slug?: string
          social_links?: Json | null
          speakers?: Json | null
          sponsors_info?: Json | null
          start_date?: string
          status?: Database["public"]["Enums"]["exhibition_status"]
          tags?: string[] | null
          target_audience?: string[] | null
          ticket_price?: string | null
          ticket_price_ar?: string | null
          title?: string
          title_ar?: string | null
          type?: Database["public"]["Enums"]["exhibition_type"]
          updated_at?: string
          venue?: string | null
          venue_ar?: string | null
          view_count?: number | null
          virtual_link?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exhibitions_organizer_company_id_fkey"
            columns: ["organizer_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exhibitions_organizer_entity_id_fkey"
            columns: ["organizer_entity_id"]
            isOneToOne: false
            referencedRelation: "culinary_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string
          answer_ar: string | null
          category: string
          created_at: string
          id: string
          is_featured: boolean | null
          question: string
          question_ar: string | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          answer: string
          answer_ar?: string | null
          category: string
          created_at?: string
          id?: string
          is_featured?: boolean | null
          question: string
          question_ar?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          answer?: string
          answer_ar?: string | null
          category?: string
          created_at?: string
          id?: string
          is_featured?: boolean | null
          question?: string
          question_ar?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      follow_requests: {
        Row: {
          created_at: string
          id: string
          requester_id: string
          responded_at: string | null
          status: string
          target_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          requester_id: string
          responded_at?: string | null
          status?: string
          target_id: string
        }
        Update: {
          created_at?: string
          id?: string
          requester_id?: string
          responded_at?: string | null
          status?: string
          target_id?: string
        }
        Relationships: []
      }
      global_awards_system: {
        Row: {
          award_type: string
          category: string | null
          created_at: string | null
          description: string | null
          description_ar: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          name_ar: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          award_type?: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          name_ar?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          award_type?: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          name_ar?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      global_events: {
        Row: {
          all_day: boolean
          city: string | null
          color: string | null
          country_code: string | null
          created_at: string
          created_by: string | null
          description: string | null
          description_ar: string | null
          end_date: string | null
          end_time: string | null
          id: string
          image_url: string | null
          is_international: boolean | null
          is_recurring: boolean | null
          link: string | null
          organizer: string | null
          organizer_ar: string | null
          priority: number | null
          recurrence_rule: string | null
          start_date: string
          start_time: string | null
          status: string
          tags: string[] | null
          target_audience: string[] | null
          timezone: string | null
          title: string
          title_ar: string | null
          type: string
          updated_at: string
          venue: string | null
          venue_ar: string | null
        }
        Insert: {
          all_day?: boolean
          city?: string | null
          color?: string | null
          country_code?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          end_date?: string | null
          end_time?: string | null
          id?: string
          image_url?: string | null
          is_international?: boolean | null
          is_recurring?: boolean | null
          link?: string | null
          organizer?: string | null
          organizer_ar?: string | null
          priority?: number | null
          recurrence_rule?: string | null
          start_date: string
          start_time?: string | null
          status?: string
          tags?: string[] | null
          target_audience?: string[] | null
          timezone?: string | null
          title: string
          title_ar?: string | null
          type?: string
          updated_at?: string
          venue?: string | null
          venue_ar?: string | null
        }
        Update: {
          all_day?: boolean
          city?: string | null
          color?: string | null
          country_code?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          end_date?: string | null
          end_time?: string | null
          id?: string
          image_url?: string | null
          is_international?: boolean | null
          is_recurring?: boolean | null
          link?: string | null
          organizer?: string | null
          organizer_ar?: string | null
          priority?: number | null
          recurrence_rule?: string | null
          start_date?: string
          start_time?: string | null
          status?: string
          tags?: string[] | null
          target_audience?: string[] | null
          timezone?: string | null
          title?: string
          title_ar?: string | null
          type?: string
          updated_at?: string
          venue?: string | null
          venue_ar?: string | null
        }
        Relationships: []
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string | null
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          category: string | null
          cover_image_url: string | null
          created_at: string
          created_by: string
          description: string | null
          description_ar: string | null
          id: string
          is_private: boolean | null
          name: string
          name_ar: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          description_ar?: string | null
          id?: string
          is_private?: boolean | null
          name: string
          name_ar?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          is_private?: boolean | null
          name?: string
          name_ar?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      hero_slides: {
        Row: {
          accent_color: string
          animation_effect: string
          autoplay_interval: number
          badge_text: string | null
          badge_text_ar: string | null
          created_at: string
          created_by: string | null
          cta_secondary_label: string | null
          cta_secondary_label_ar: string | null
          cta_secondary_url: string | null
          custom_height: number | null
          gradient_direction: string
          height_preset: string
          id: string
          image_url: string
          is_active: boolean
          link_label: string | null
          link_label_ar: string | null
          link_url: string | null
          object_fit: string
          object_position: string
          overlay_color: string
          overlay_opacity: number
          sort_order: number
          subtitle: string | null
          subtitle_ar: string | null
          template: string
          text_color: string
          text_position: string
          title: string
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string
          animation_effect?: string
          autoplay_interval?: number
          badge_text?: string | null
          badge_text_ar?: string | null
          created_at?: string
          created_by?: string | null
          cta_secondary_label?: string | null
          cta_secondary_label_ar?: string | null
          cta_secondary_url?: string | null
          custom_height?: number | null
          gradient_direction?: string
          height_preset?: string
          id?: string
          image_url: string
          is_active?: boolean
          link_label?: string | null
          link_label_ar?: string | null
          link_url?: string | null
          object_fit?: string
          object_position?: string
          overlay_color?: string
          overlay_opacity?: number
          sort_order?: number
          subtitle?: string | null
          subtitle_ar?: string | null
          template?: string
          text_color?: string
          text_position?: string
          title: string
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string
          animation_effect?: string
          autoplay_interval?: number
          badge_text?: string | null
          badge_text_ar?: string | null
          created_at?: string
          created_by?: string | null
          cta_secondary_label?: string | null
          cta_secondary_label_ar?: string | null
          cta_secondary_url?: string | null
          custom_height?: number | null
          gradient_direction?: string
          height_preset?: string
          id?: string
          image_url?: string
          is_active?: boolean
          link_label?: string | null
          link_label_ar?: string | null
          link_url?: string | null
          object_fit?: string
          object_position?: string
          overlay_color?: string
          overlay_opacity?: number
          sort_order?: number
          subtitle?: string | null
          subtitle_ar?: string | null
          template?: string
          text_color?: string
          text_position?: string
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      homepage_sections: {
        Row: {
          animation: string
          bg_color: string | null
          container_width: string
          cover_height: number | null
          cover_image_url: string | null
          cover_overlay_opacity: number | null
          cover_type: string | null
          css_class: string | null
          custom_config: Json | null
          description_ar: string | null
          description_en: string | null
          id: string
          is_visible: boolean
          item_count: number | null
          item_size: string | null
          items_per_row: number | null
          max_items_mobile: number
          section_key: string
          show_filters: boolean | null
          show_view_all: boolean | null
          sort_order: number
          spacing: string
          subtitle_ar: string | null
          subtitle_en: string | null
          title_ar: string
          title_en: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          animation?: string
          bg_color?: string | null
          container_width?: string
          cover_height?: number | null
          cover_image_url?: string | null
          cover_overlay_opacity?: number | null
          cover_type?: string | null
          css_class?: string | null
          custom_config?: Json | null
          description_ar?: string | null
          description_en?: string | null
          id?: string
          is_visible?: boolean
          item_count?: number | null
          item_size?: string | null
          items_per_row?: number | null
          max_items_mobile?: number
          section_key: string
          show_filters?: boolean | null
          show_view_all?: boolean | null
          sort_order?: number
          spacing?: string
          subtitle_ar?: string | null
          subtitle_en?: string | null
          title_ar?: string
          title_en?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          animation?: string
          bg_color?: string | null
          container_width?: string
          cover_height?: number | null
          cover_image_url?: string | null
          cover_overlay_opacity?: number | null
          cover_type?: string | null
          css_class?: string | null
          custom_config?: Json | null
          description_ar?: string | null
          description_en?: string | null
          id?: string
          is_visible?: boolean
          item_count?: number | null
          item_size?: string | null
          items_per_row?: number | null
          max_items_mobile?: number
          section_key?: string
          show_filters?: boolean | null
          show_view_all?: boolean | null
          sort_order?: number
          spacing?: string
          subtitle_ar?: string | null
          subtitle_en?: string | null
          title_ar?: string
          title_en?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      homepage_sponsors: {
        Row: {
          company_id: string | null
          created_at: string | null
          ends_at: string | null
          id: string
          is_active: boolean | null
          logo_url: string
          name: string
          name_ar: string | null
          sort_order: number | null
          starts_at: string | null
          tier: string | null
          website_url: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url: string
          name: string
          name_ar?: string | null
          sort_order?: number | null
          starts_at?: string | null
          tier?: string | null
          website_url?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string
          name?: string
          name_ar?: string | null
          sort_order?: number | null
          starts_at?: string | null
          tier?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homepage_sponsors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_settings: {
        Row: {
          config: Json | null
          created_at: string
          created_by: string | null
          id: string
          integration_type: string
          is_active: boolean | null
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          integration_type: string
          is_active?: boolean | null
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          integration_type?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      invoice_sequences: {
        Row: {
          last_number: number
          year: number
        }
        Insert: {
          last_number?: number
          year: number
        }
        Update: {
          last_number?: number
          year?: number
        }
        Relationships: []
      }
      invoice_settings: {
        Row: {
          auto_send_invoice: boolean | null
          auto_send_statuses: string[] | null
          company_id: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          invoice_title: string | null
          invoice_title_ar: string | null
          issue_english_copy: boolean | null
          logo_position: string | null
          logo_size: number | null
          logo_url: string | null
          main_font_weight: string | null
          primary_color: string | null
          return_policy_text: string | null
          return_policy_text_ar: string | null
          show_contact_info: boolean | null
          show_gtin_code: boolean | null
          show_invoice_acknowledgment: boolean | null
          show_invoice_barcode: boolean | null
          show_mpn_code: boolean | null
          show_order_note: boolean | null
          show_product_barcode: boolean | null
          show_product_description: boolean | null
          show_product_image: boolean | null
          show_product_stock_number: boolean | null
          show_product_weight: boolean | null
          show_return_policy: boolean | null
          show_store_address: boolean | null
          stamp_opacity: number | null
          stamp_position: string | null
          stamp_url: string | null
          store_address: string | null
          store_address_ar: string | null
          store_name_prefix: string | null
          store_name_prefix_ar: string | null
          sub_font_weight: string | null
          title_style: string | null
          updated_at: string | null
          watermark_opacity: number | null
          watermark_url: string | null
        }
        Insert: {
          auto_send_invoice?: boolean | null
          auto_send_statuses?: string[] | null
          company_id?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          invoice_title?: string | null
          invoice_title_ar?: string | null
          issue_english_copy?: boolean | null
          logo_position?: string | null
          logo_size?: number | null
          logo_url?: string | null
          main_font_weight?: string | null
          primary_color?: string | null
          return_policy_text?: string | null
          return_policy_text_ar?: string | null
          show_contact_info?: boolean | null
          show_gtin_code?: boolean | null
          show_invoice_acknowledgment?: boolean | null
          show_invoice_barcode?: boolean | null
          show_mpn_code?: boolean | null
          show_order_note?: boolean | null
          show_product_barcode?: boolean | null
          show_product_description?: boolean | null
          show_product_image?: boolean | null
          show_product_stock_number?: boolean | null
          show_product_weight?: boolean | null
          show_return_policy?: boolean | null
          show_store_address?: boolean | null
          stamp_opacity?: number | null
          stamp_position?: string | null
          stamp_url?: string | null
          store_address?: string | null
          store_address_ar?: string | null
          store_name_prefix?: string | null
          store_name_prefix_ar?: string | null
          sub_font_weight?: string | null
          title_style?: string | null
          updated_at?: string | null
          watermark_opacity?: number | null
          watermark_url?: string | null
        }
        Update: {
          auto_send_invoice?: boolean | null
          auto_send_statuses?: string[] | null
          company_id?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          invoice_title?: string | null
          invoice_title_ar?: string | null
          issue_english_copy?: boolean | null
          logo_position?: string | null
          logo_size?: number | null
          logo_url?: string | null
          main_font_weight?: string | null
          primary_color?: string | null
          return_policy_text?: string | null
          return_policy_text_ar?: string | null
          show_contact_info?: boolean | null
          show_gtin_code?: boolean | null
          show_invoice_acknowledgment?: boolean | null
          show_invoice_barcode?: boolean | null
          show_mpn_code?: boolean | null
          show_order_note?: boolean | null
          show_product_barcode?: boolean | null
          show_product_description?: boolean | null
          show_product_image?: boolean | null
          show_product_stock_number?: boolean | null
          show_product_weight?: boolean | null
          show_return_policy?: boolean | null
          show_store_address?: boolean | null
          stamp_opacity?: number | null
          stamp_position?: string | null
          stamp_url?: string | null
          store_address?: string | null
          store_address_ar?: string | null
          store_name_prefix?: string | null
          store_name_prefix_ar?: string | null
          sub_font_weight?: string | null
          title_style?: string | null
          updated_at?: string | null
          watermark_opacity?: number | null
          watermark_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          company_id: string | null
          competition_id: string | null
          created_at: string
          currency: string | null
          description: string | null
          description_ar: string | null
          discount_amount: number | null
          due_date: string | null
          id: string
          invoice_number: string
          issued_by: string | null
          items: Json | null
          notes: string | null
          notes_ar: string | null
          order_id: string | null
          paid_at: string | null
          payment_method: string | null
          payment_reference: string | null
          session_id: string | null
          status: string | null
          subtotal: number | null
          tax_amount: number | null
          tax_rate: number | null
          title: string | null
          title_ar: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          company_id?: string | null
          competition_id?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          description_ar?: string | null
          discount_amount?: number | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          issued_by?: string | null
          items?: Json | null
          notes?: string | null
          notes_ar?: string | null
          order_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          session_id?: string | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          title?: string | null
          title_ar?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          company_id?: string | null
          competition_id?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          description_ar?: string | null
          discount_amount?: number | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          issued_by?: string | null
          items?: Json | null
          notes?: string | null
          notes_ar?: string | null
          order_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          session_id?: string | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          title?: string | null
          title_ar?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "company_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      judge_ai_conversations: {
        Row: {
          competition_id: string | null
          context_summary: string | null
          created_at: string
          id: string
          judge_id: string
          messages: Json
          updated_at: string
        }
        Insert: {
          competition_id?: string | null
          context_summary?: string | null
          created_at?: string
          id?: string
          judge_id: string
          messages?: Json
          updated_at?: string
        }
        Update: {
          competition_id?: string | null
          context_summary?: string | null
          created_at?: string
          id?: string
          judge_id?: string
          messages?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "judge_ai_conversations_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "judge_ai_conversations_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions_public"
            referencedColumns: ["id"]
          },
        ]
      }
      judge_analytics: {
        Row: {
          avg_score_given: number | null
          avg_scoring_time_seconds: number | null
          bias_indicator: number | null
          competition_id: string
          completion_rate: number | null
          computed_at: string | null
          consistency_score: number | null
          id: string
          judge_id: string
          score_std_deviation: number | null
          scores_count: number | null
        }
        Insert: {
          avg_score_given?: number | null
          avg_scoring_time_seconds?: number | null
          bias_indicator?: number | null
          competition_id: string
          completion_rate?: number | null
          computed_at?: string | null
          consistency_score?: number | null
          id?: string
          judge_id: string
          score_std_deviation?: number | null
          scores_count?: number | null
        }
        Update: {
          avg_score_given?: number | null
          avg_scoring_time_seconds?: number | null
          bias_indicator?: number | null
          competition_id?: string
          completion_rate?: number | null
          computed_at?: string | null
          consistency_score?: number | null
          id?: string
          judge_id?: string
          score_std_deviation?: number | null
          scores_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "judge_analytics_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "judge_analytics_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions_public"
            referencedColumns: ["id"]
          },
        ]
      }
      judge_deliberations: {
        Row: {
          competition_id: string
          created_at: string | null
          created_by: string
          id: string
          resolved_at: string | null
          round_id: string | null
          status: string | null
          topic: string
          topic_ar: string | null
        }
        Insert: {
          competition_id: string
          created_at?: string | null
          created_by: string
          id?: string
          resolved_at?: string | null
          round_id?: string | null
          status?: string | null
          topic: string
          topic_ar?: string | null
        }
        Update: {
          competition_id?: string
          created_at?: string | null
          created_by?: string
          id?: string
          resolved_at?: string | null
          round_id?: string | null
          status?: string | null
          topic?: string
          topic_ar?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "judge_deliberations_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "judge_deliberations_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "judge_deliberations_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "competition_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      judge_documents: {
        Row: {
          created_at: string
          document_type: string
          expiry_date: string | null
          file_name: string | null
          file_size: number | null
          file_url: string
          id: string
          is_verified: boolean | null
          notes: string | null
          title: string
          title_ar: string | null
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          document_type: string
          expiry_date?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url: string
          id?: string
          is_verified?: boolean | null
          notes?: string | null
          title: string
          title_ar?: string | null
          updated_at?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          expiry_date?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string
          id?: string
          is_verified?: boolean | null
          notes?: string | null
          title?: string
          title_ar?: string | null
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      judge_memberships: {
        Row: {
          created_at: string
          expiry_date: string | null
          id: string
          is_active: boolean | null
          joined_date: string | null
          membership_number: string | null
          membership_type: string | null
          notes: string | null
          organization_name: string
          organization_name_ar: string | null
          role_in_organization: string | null
          role_in_organization_ar: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          joined_date?: string | null
          membership_number?: string | null
          membership_type?: string | null
          notes?: string | null
          organization_name: string
          organization_name_ar?: string | null
          role_in_organization?: string | null
          role_in_organization_ar?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          joined_date?: string | null
          membership_number?: string | null
          membership_type?: string | null
          notes?: string | null
          organization_name?: string
          organization_name_ar?: string | null
          role_in_organization?: string | null
          role_in_organization_ar?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      judge_profiles: {
        Row: {
          allergies: string | null
          blood_type: string | null
          certifications: string[] | null
          country_of_residence: string | null
          created_at: string
          culinary_specialties: string[] | null
          current_employer: string | null
          current_position: string | null
          date_of_birth: string | null
          dietary_restrictions: string | null
          education: string | null
          education_ar: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          frequent_flyer_number: string | null
          full_name_ar: string | null
          gender: string | null
          id: string
          internal_notes: string | null
          judge_category: string | null
          judge_level: string | null
          judge_title: string | null
          judge_title_ar: string | null
          languages_spoken: string[] | null
          marital_status: string | null
          medical_notes: string | null
          national_id: string | null
          nationality: string | null
          notes: string | null
          passport_country: string | null
          passport_expiry_date: string | null
          passport_issue_date: string | null
          passport_number: string | null
          preferred_airline: string | null
          profile_photo_url: string | null
          resume_url: string | null
          second_nationality: string | null
          shirt_size: string | null
          spouse_name: string | null
          spouse_name_ar: string | null
          spouse_phone: string | null
          travel_notes: string | null
          updated_at: string
          user_id: string
          years_of_experience: number | null
        }
        Insert: {
          allergies?: string | null
          blood_type?: string | null
          certifications?: string[] | null
          country_of_residence?: string | null
          created_at?: string
          culinary_specialties?: string[] | null
          current_employer?: string | null
          current_position?: string | null
          date_of_birth?: string | null
          dietary_restrictions?: string | null
          education?: string | null
          education_ar?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          frequent_flyer_number?: string | null
          full_name_ar?: string | null
          gender?: string | null
          id?: string
          internal_notes?: string | null
          judge_category?: string | null
          judge_level?: string | null
          judge_title?: string | null
          judge_title_ar?: string | null
          languages_spoken?: string[] | null
          marital_status?: string | null
          medical_notes?: string | null
          national_id?: string | null
          nationality?: string | null
          notes?: string | null
          passport_country?: string | null
          passport_expiry_date?: string | null
          passport_issue_date?: string | null
          passport_number?: string | null
          preferred_airline?: string | null
          profile_photo_url?: string | null
          resume_url?: string | null
          second_nationality?: string | null
          shirt_size?: string | null
          spouse_name?: string | null
          spouse_name_ar?: string | null
          spouse_phone?: string | null
          travel_notes?: string | null
          updated_at?: string
          user_id: string
          years_of_experience?: number | null
        }
        Update: {
          allergies?: string | null
          blood_type?: string | null
          certifications?: string[] | null
          country_of_residence?: string | null
          created_at?: string
          culinary_specialties?: string[] | null
          current_employer?: string | null
          current_position?: string | null
          date_of_birth?: string | null
          dietary_restrictions?: string | null
          education?: string | null
          education_ar?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          frequent_flyer_number?: string | null
          full_name_ar?: string | null
          gender?: string | null
          id?: string
          internal_notes?: string | null
          judge_category?: string | null
          judge_level?: string | null
          judge_title?: string | null
          judge_title_ar?: string | null
          languages_spoken?: string[] | null
          marital_status?: string | null
          medical_notes?: string | null
          national_id?: string | null
          nationality?: string | null
          notes?: string | null
          passport_country?: string | null
          passport_expiry_date?: string | null
          passport_issue_date?: string | null
          passport_number?: string | null
          preferred_airline?: string | null
          profile_photo_url?: string | null
          resume_url?: string | null
          second_nationality?: string | null
          shirt_size?: string | null
          spouse_name?: string | null
          spouse_name_ar?: string | null
          spouse_phone?: string | null
          travel_notes?: string | null
          updated_at?: string
          user_id?: string
          years_of_experience?: number | null
        }
        Relationships: []
      }
      judge_visit_logs: {
        Row: {
          achievements: string | null
          competition_id: string | null
          country: string | null
          created_at: string
          created_by: string | null
          end_date: string | null
          event_name: string
          event_name_ar: string | null
          event_type: string
          id: string
          location: string | null
          notes: string | null
          role_played: string | null
          start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          achievements?: string | null
          competition_id?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          event_name: string
          event_name_ar?: string | null
          event_type: string
          id?: string
          location?: string | null
          notes?: string | null
          role_played?: string | null
          start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          achievements?: string | null
          competition_id?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          event_name?: string
          event_name_ar?: string | null
          event_type?: string
          id?: string
          location?: string | null
          notes?: string | null
          role_played?: string | null
          start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "judge_visit_logs_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "judge_visit_logs_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions_public"
            referencedColumns: ["id"]
          },
        ]
      }
      judging_criteria: {
        Row: {
          competition_id: string
          created_at: string
          description: string | null
          description_ar: string | null
          id: string
          max_score: number
          name: string
          name_ar: string | null
          sort_order: number | null
          weight: number
        }
        Insert: {
          competition_id: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          max_score?: number
          name: string
          name_ar?: string | null
          sort_order?: number | null
          weight?: number
        }
        Update: {
          competition_id?: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          max_score?: number
          name?: string
          name_ar?: string | null
          sort_order?: number | null
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "judging_criteria_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "judging_criteria_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions_public"
            referencedColumns: ["id"]
          },
        ]
      }
      judging_rubric_templates: {
        Row: {
          category_type: string | null
          competition_type: string | null
          created_at: string
          created_by: string | null
          criteria: Json
          description: string | null
          description_ar: string | null
          id: string
          is_active: boolean | null
          name: string
          name_ar: string | null
          updated_at: string
        }
        Insert: {
          category_type?: string | null
          competition_type?: string | null
          created_at?: string
          created_by?: string | null
          criteria?: Json
          description?: string | null
          description_ar?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_ar?: string | null
          updated_at?: string
        }
        Update: {
          category_type?: string | null
          competition_type?: string | null
          created_at?: string
          created_by?: string | null
          criteria?: Json
          description?: string | null
          description_ar?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_ar?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      kitchen_stations: {
        Row: {
          assigned_registration_id: string | null
          assigned_slot_id: string | null
          competition_id: string
          created_at: string | null
          equipment_list: Json | null
          id: string
          station_name: string | null
          station_name_ar: string | null
          station_number: string
          status: string | null
        }
        Insert: {
          assigned_registration_id?: string | null
          assigned_slot_id?: string | null
          competition_id: string
          created_at?: string | null
          equipment_list?: Json | null
          id?: string
          station_name?: string | null
          station_name_ar?: string | null
          station_number: string
          status?: string | null
        }
        Update: {
          assigned_registration_id?: string | null
          assigned_slot_id?: string | null
          competition_id?: string
          created_at?: string | null
          equipment_list?: Json | null
          id?: string
          station_name?: string | null
          station_name_ar?: string | null
          station_number?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kitchen_stations_assigned_registration_id_fkey"
            columns: ["assigned_registration_id"]
            isOneToOne: false
            referencedRelation: "competition_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kitchen_stations_assigned_slot_id_fkey"
            columns: ["assigned_slot_id"]
            isOneToOne: false
            referencedRelation: "competition_schedule_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kitchen_stations_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kitchen_stations_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions_public"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_articles: {
        Row: {
          author_id: string | null
          category: string
          content: string
          content_ar: string | null
          created_at: string
          helpful_count: number | null
          id: string
          status: string | null
          tags: string[] | null
          title: string
          title_ar: string | null
          updated_at: string
          view_count: number | null
        }
        Insert: {
          author_id?: string | null
          category: string
          content: string
          content_ar?: string | null
          created_at?: string
          helpful_count?: number | null
          id?: string
          status?: string | null
          tags?: string[] | null
          title: string
          title_ar?: string | null
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          author_id?: string | null
          category?: string
          content?: string
          content_ar?: string | null
          created_at?: string
          helpful_count?: number | null
          id?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          title_ar?: string | null
          updated_at?: string
          view_count?: number | null
        }
        Relationships: []
      }
      knowledge_categories: {
        Row: {
          created_at: string
          description: string | null
          description_ar: string | null
          icon: string | null
          id: string
          name: string
          name_ar: string | null
          parent_id: string | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          icon?: string | null
          id?: string
          name: string
          name_ar?: string | null
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          icon?: string | null
          id?: string
          name?: string
          name_ar?: string | null
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "knowledge_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_resources: {
        Row: {
          added_by: string | null
          category_id: string | null
          competition_id: string | null
          created_at: string
          description: string | null
          description_ar: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          is_judge_resource: boolean | null
          is_published: boolean | null
          resource_type: string
          scraped_content: string | null
          scraped_content_ar: string | null
          tags: string[] | null
          title: string
          title_ar: string | null
          updated_at: string
          url: string | null
          view_count: number | null
        }
        Insert: {
          added_by?: string | null
          category_id?: string | null
          competition_id?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_judge_resource?: boolean | null
          is_published?: boolean | null
          resource_type: string
          scraped_content?: string | null
          scraped_content_ar?: string | null
          tags?: string[] | null
          title: string
          title_ar?: string | null
          updated_at?: string
          url?: string | null
          view_count?: number | null
        }
        Update: {
          added_by?: string | null
          category_id?: string | null
          competition_id?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_judge_resource?: boolean | null
          is_published?: boolean | null
          resource_type?: string
          scraped_content?: string | null
          scraped_content_ar?: string | null
          tags?: string[] | null
          title?: string
          title_ar?: string | null
          updated_at?: string
          url?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_resources_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "knowledge_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_resources_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_resources_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions_public"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          company_name: string | null
          contact_name: string
          created_at: string
          email: string
          id: string
          message: string | null
          metadata: Json | null
          notes: string | null
          phone: string | null
          source: string | null
          status: string | null
          type: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          company_name?: string | null
          contact_name: string
          created_at?: string
          email: string
          id?: string
          message?: string | null
          metadata?: Json | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          company_name?: string | null
          contact_name?: string
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      lifecycle_triggers: {
        Row: {
          action_type: string
          channels: string[] | null
          conditions: Json | null
          created_at: string
          created_by: string | null
          delay_minutes: number | null
          id: string
          is_active: boolean | null
          name: string
          name_ar: string | null
          template_slug: string | null
          trigger_event: string
          updated_at: string
        }
        Insert: {
          action_type?: string
          channels?: string[] | null
          conditions?: Json | null
          created_at?: string
          created_by?: string | null
          delay_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          name_ar?: string | null
          template_slug?: string | null
          trigger_event: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          channels?: string[] | null
          conditions?: Json | null
          created_at?: string
          created_by?: string | null
          delay_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_ar?: string | null
          template_slug?: string | null
          trigger_event?: string
          updated_at?: string
        }
        Relationships: []
      }
      live_session_attendees: {
        Row: {
          id: string
          registered_at: string
          session_id: string
          user_id: string
        }
        Insert: {
          id?: string
          registered_at?: string
          session_id: string
          user_id: string
        }
        Update: {
          id?: string
          registered_at?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_session_attendees_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_sessions: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          description_ar: string | null
          duration_minutes: number | null
          host_id: string
          id: string
          max_attendees: number | null
          scheduled_at: string
          status: string
          stream_url: string | null
          tags: string[] | null
          title: string
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          duration_minutes?: number | null
          host_id: string
          id?: string
          max_attendees?: number | null
          scheduled_at: string
          status?: string
          stream_url?: string | null
          tags?: string[] | null
          title: string
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          duration_minutes?: number | null
          host_id?: string
          id?: string
          max_attendees?: number | null
          scheduled_at?: string
          status?: string
          stream_url?: string | null
          tags?: string[] | null
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      marketing_tracking_config: {
        Row: {
          config: Json | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          platform: string
          tracking_id: string | null
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          platform: string
          tracking_id?: string | null
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          platform?: string
          tracking_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      masterclass_enrollments: {
        Row: {
          certificate_issued: boolean | null
          completed_at: string | null
          enrolled_at: string
          id: string
          masterclass_id: string
          progress_percent: number | null
          status: string
          user_id: string
        }
        Insert: {
          certificate_issued?: boolean | null
          completed_at?: string | null
          enrolled_at?: string
          id?: string
          masterclass_id: string
          progress_percent?: number | null
          status?: string
          user_id: string
        }
        Update: {
          certificate_issued?: boolean | null
          completed_at?: string | null
          enrolled_at?: string
          id?: string
          masterclass_id?: string
          progress_percent?: number | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "masterclass_enrollments_masterclass_id_fkey"
            columns: ["masterclass_id"]
            isOneToOne: false
            referencedRelation: "masterclasses"
            referencedColumns: ["id"]
          },
        ]
      }
      masterclass_lesson_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string
          enrollment_id: string
          id: string
          last_position_seconds: number | null
          lesson_id: string
          updated_at: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          enrollment_id: string
          id?: string
          last_position_seconds?: number | null
          lesson_id: string
          updated_at?: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          enrollment_id?: string
          id?: string
          last_position_seconds?: number | null
          lesson_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "masterclass_lesson_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "masterclass_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "masterclass_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "masterclass_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      masterclass_lessons: {
        Row: {
          content: string | null
          content_ar: string | null
          content_type: string
          created_at: string
          duration_minutes: number | null
          id: string
          module_id: string
          resources: Json | null
          sort_order: number | null
          title: string
          title_ar: string | null
          video_url: string | null
        }
        Insert: {
          content?: string | null
          content_ar?: string | null
          content_type?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          module_id: string
          resources?: Json | null
          sort_order?: number | null
          title: string
          title_ar?: string | null
          video_url?: string | null
        }
        Update: {
          content?: string | null
          content_ar?: string | null
          content_type?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          module_id?: string
          resources?: Json | null
          sort_order?: number | null
          title?: string
          title_ar?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "masterclass_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "masterclass_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      masterclass_modules: {
        Row: {
          created_at: string
          description: string | null
          description_ar: string | null
          id: string
          is_free_preview: boolean | null
          masterclass_id: string
          sort_order: number | null
          title: string
          title_ar: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          is_free_preview?: boolean | null
          masterclass_id: string
          sort_order?: number | null
          title: string
          title_ar?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          is_free_preview?: boolean | null
          masterclass_id?: string
          sort_order?: number | null
          title?: string
          title_ar?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "masterclass_modules_masterclass_id_fkey"
            columns: ["masterclass_id"]
            isOneToOne: false
            referencedRelation: "masterclasses"
            referencedColumns: ["id"]
          },
        ]
      }
      masterclass_reviews: {
        Row: {
          created_at: string
          id: string
          masterclass_id: string
          rating: number
          review: string | null
          review_ar: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          masterclass_id: string
          rating: number
          review?: string | null
          review_ar?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          masterclass_id?: string
          rating?: number
          review?: string | null
          review_ar?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "masterclass_reviews_masterclass_id_fkey"
            columns: ["masterclass_id"]
            isOneToOne: false
            referencedRelation: "masterclasses"
            referencedColumns: ["id"]
          },
        ]
      }
      masterclasses: {
        Row: {
          category: string
          country_code: string | null
          cover_image_url: string | null
          created_at: string
          currency: string | null
          description: string | null
          description_ar: string | null
          duration_hours: number | null
          end_date: string | null
          id: string
          instructor_id: string
          is_free: boolean | null
          is_self_paced: boolean | null
          level: string
          max_enrollments: number | null
          prerequisites: string | null
          prerequisites_ar: string | null
          price: number | null
          start_date: string | null
          status: string
          tags: string[] | null
          title: string
          title_ar: string | null
          updated_at: string
          what_you_learn: string[] | null
          what_you_learn_ar: string[] | null
        }
        Insert: {
          category?: string
          country_code?: string | null
          cover_image_url?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          description_ar?: string | null
          duration_hours?: number | null
          end_date?: string | null
          id?: string
          instructor_id: string
          is_free?: boolean | null
          is_self_paced?: boolean | null
          level?: string
          max_enrollments?: number | null
          prerequisites?: string | null
          prerequisites_ar?: string | null
          price?: number | null
          start_date?: string | null
          status?: string
          tags?: string[] | null
          title: string
          title_ar?: string | null
          updated_at?: string
          what_you_learn?: string[] | null
          what_you_learn_ar?: string[] | null
        }
        Update: {
          category?: string
          country_code?: string | null
          cover_image_url?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          description_ar?: string | null
          duration_hours?: number | null
          end_date?: string | null
          id?: string
          instructor_id?: string
          is_free?: boolean | null
          is_self_paced?: boolean | null
          level?: string
          max_enrollments?: number | null
          prerequisites?: string | null
          prerequisites_ar?: string | null
          price?: number | null
          start_date?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          title_ar?: string | null
          updated_at?: string
          what_you_learn?: string[] | null
          what_you_learn_ar?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "masterclasses_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
        ]
      }
      media_library: {
        Row: {
          alt_text: string | null
          alt_text_ar: string | null
          created_at: string
          file_size: number | null
          file_type: string
          file_url: string
          filename: string
          folder: string | null
          id: string
          original_filename: string
          uploaded_by: string | null
        }
        Insert: {
          alt_text?: string | null
          alt_text_ar?: string | null
          created_at?: string
          file_size?: number | null
          file_type: string
          file_url: string
          filename: string
          folder?: string | null
          id?: string
          original_filename: string
          uploaded_by?: string | null
        }
        Update: {
          alt_text?: string | null
          alt_text_ar?: string | null
          created_at?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          filename?: string
          folder?: string | null
          id?: string
          original_filename?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      membership_cancellation_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          current_tier: string
          feedback: string | null
          id: string
          reason: string | null
          reason_ar: string | null
          retention_offer: string | null
          retention_offer_ar: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          current_tier: string
          feedback?: string | null
          id?: string
          reason?: string | null
          reason_ar?: string | null
          retention_offer?: string | null
          retention_offer_ar?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          current_tier?: string
          feedback?: string | null
          id?: string
          reason?: string | null
          reason_ar?: string | null
          retention_offer?: string | null
          retention_offer_ar?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      membership_cards: {
        Row: {
          card_orientation: string
          card_status: string
          created_at: string
          expires_at: string
          id: string
          is_trial: boolean
          issued_at: string
          membership_number: string
          renewed_at: string | null
          suspended_at: string | null
          suspended_reason: string | null
          trial_ends_at: string | null
          updated_at: string
          user_id: string
          verification_code: string
        }
        Insert: {
          card_orientation?: string
          card_status?: string
          created_at?: string
          expires_at?: string
          id?: string
          is_trial?: boolean
          issued_at?: string
          membership_number: string
          renewed_at?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
          verification_code: string
        }
        Update: {
          card_orientation?: string
          card_status?: string
          created_at?: string
          expires_at?: string
          id?: string
          is_trial?: boolean
          issued_at?: string
          membership_number?: string
          renewed_at?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
          verification_code?: string
        }
        Relationships: []
      }
      membership_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          new_tier: Database["public"]["Enums"]["membership_tier"]
          previous_tier: Database["public"]["Enums"]["membership_tier"] | null
          reason: string | null
          user_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_tier: Database["public"]["Enums"]["membership_tier"]
          previous_tier?: Database["public"]["Enums"]["membership_tier"] | null
          reason?: string | null
          user_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_tier?: Database["public"]["Enums"]["membership_tier"]
          previous_tier?: Database["public"]["Enums"]["membership_tier"] | null
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mentee_enrollments: {
        Row: {
          created_at: string
          experience_level: string | null
          goals_description: string | null
          id: string
          preferred_language: string | null
          program_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          experience_level?: string | null
          goals_description?: string | null
          id?: string
          preferred_language?: string | null
          program_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          experience_level?: string | null
          goals_description?: string | null
          id?: string
          preferred_language?: string | null
          program_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentee_enrollments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "mentorship_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_applications: {
        Row: {
          bio: string | null
          bio_ar: string | null
          created_at: string
          expertise: string[] | null
          id: string
          program_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          bio_ar?: string | null
          created_at?: string
          expertise?: string[] | null
          id?: string
          program_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          bio_ar?: string | null
          created_at?: string
          expertise?: string[] | null
          id?: string
          program_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mentor_applications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "mentorship_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      mentorship_goals: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          description_ar: string | null
          id: string
          match_id: string
          progress: number | null
          status: string
          target_date: string | null
          title: string
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          match_id: string
          progress?: number | null
          status?: string
          target_date?: string | null
          title: string
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          match_id?: string
          progress?: number | null
          status?: string
          target_date?: string | null
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentorship_goals_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "mentorship_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      mentorship_matches: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          matched_at: string | null
          mentee_id: string
          mentee_notes: string | null
          mentor_id: string
          mentor_notes: string | null
          program_id: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          matched_at?: string | null
          mentee_id: string
          mentee_notes?: string | null
          mentor_id: string
          mentor_notes?: string | null
          program_id: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          matched_at?: string | null
          mentee_id?: string
          mentee_notes?: string | null
          mentor_id?: string
          mentor_notes?: string | null
          program_id?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentorship_matches_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "mentorship_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      mentorship_programs: {
        Row: {
          category: string
          country_code: string | null
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          description_ar: string | null
          duration_weeks: number | null
          id: string
          max_matches: number | null
          requirements: string | null
          requirements_ar: string | null
          status: string
          title: string
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          country_code?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          duration_weeks?: number | null
          id?: string
          max_matches?: number | null
          requirements?: string | null
          requirements_ar?: string | null
          status?: string
          title: string
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          country_code?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          duration_weeks?: number | null
          id?: string
          max_matches?: number | null
          requirements?: string | null
          requirements_ar?: string | null
          status?: string
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      mentorship_sessions: {
        Row: {
          created_at: string
          description: string | null
          description_ar: string | null
          duration_minutes: number | null
          id: string
          match_id: string
          meeting_url: string | null
          mentee_feedback: string | null
          mentee_rating: number | null
          mentor_feedback: string | null
          mentor_rating: number | null
          scheduled_at: string
          status: string
          title: string
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          duration_minutes?: number | null
          id?: string
          match_id: string
          meeting_url?: string | null
          mentee_feedback?: string | null
          mentee_rating?: number | null
          mentor_feedback?: string | null
          mentor_rating?: number | null
          scheduled_at: string
          status?: string
          title: string
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          duration_minutes?: number | null
          id?: string
          match_id?: string
          meeting_url?: string | null
          mentee_feedback?: string | null
          mentee_rating?: number | null
          mentor_feedback?: string | null
          mentor_rating?: number | null
          scheduled_at?: string
          status?: string
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentorship_sessions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "mentorship_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_names: string[] | null
          attachment_urls: string[] | null
          category: string
          content: string
          created_at: string
          id: string
          is_archived: boolean
          is_read: boolean
          is_starred: boolean
          message_type: string
          metadata: Json | null
          read_at: string | null
          receiver_id: string
          reply_to_id: string | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          attachment_names?: string[] | null
          attachment_urls?: string[] | null
          category?: string
          content: string
          created_at?: string
          id?: string
          is_archived?: boolean
          is_read?: boolean
          is_starred?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id: string
          reply_to_id?: string | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          attachment_names?: string[] | null
          attachment_urls?: string[] | null
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_archived?: boolean
          is_read?: boolean
          is_starred?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id?: string
          reply_to_id?: string | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_actions: {
        Row: {
          action: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          performed_by: string
          reason: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id: string
          entity_type?: string
          id?: string
          performed_by: string
          reason?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          performed_by?: string
          reason?: string | null
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          is_active: boolean
          name: string | null
          source: string | null
          subscribed_at: string
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean
          name?: string | null
          source?: string | null
          subscribed_at?: string
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean
          name?: string | null
          source?: string | null
          subscribed_at?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          channel: Database["public"]["Enums"]["notification_channel"]
          enabled: boolean | null
          id: string
          user_id: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["notification_channel"]
          enabled?: boolean | null
          id?: string
          user_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["notification_channel"]
          enabled?: boolean | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_queue: {
        Row: {
          attempts: number | null
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          error_message: string | null
          id: string
          last_attempt_at: string | null
          payload: Json
          scheduled_for: string | null
          status: Database["public"]["Enums"]["notification_status"] | null
          template_id: string | null
          user_id: string
        }
        Insert: {
          attempts?: number | null
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          payload?: Json
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["notification_status"] | null
          template_id?: string | null
          user_id: string
        }
        Update: {
          attempts?: number | null
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          payload?: Json
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["notification_status"] | null
          template_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_queue_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          body: string
          body_ar: string | null
          channels: Database["public"]["Enums"]["notification_channel"][] | null
          created_at: string
          id: string
          name: string
          title: string
          title_ar: string | null
          updated_at: string
          variables: string[] | null
        }
        Insert: {
          body: string
          body_ar?: string | null
          channels?:
            | Database["public"]["Enums"]["notification_channel"][]
            | null
          created_at?: string
          id?: string
          name: string
          title: string
          title_ar?: string | null
          updated_at?: string
          variables?: string[] | null
        }
        Update: {
          body?: string
          body_ar?: string | null
          channels?:
            | Database["public"]["Enums"]["notification_channel"][]
            | null
          created_at?: string
          id?: string
          name?: string
          title?: string
          title_ar?: string | null
          updated_at?: string
          variables?: string[] | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          body_ar: string | null
          channel: Database["public"]["Enums"]["notification_channel"] | null
          created_at: string
          id: string
          is_read: boolean | null
          link: string | null
          metadata: Json | null
          read_at: string | null
          status: Database["public"]["Enums"]["notification_status"] | null
          title: string
          title_ar: string | null
          type: string | null
          user_id: string
        }
        Insert: {
          body: string
          body_ar?: string | null
          channel?: Database["public"]["Enums"]["notification_channel"] | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          metadata?: Json | null
          read_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"] | null
          title: string
          title_ar?: string | null
          type?: string | null
          user_id: string
        }
        Update: {
          body?: string
          body_ar?: string | null
          channel?: Database["public"]["Enums"]["notification_channel"] | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          metadata?: Json | null
          read_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"] | null
          title?: string
          title_ar?: string | null
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      order_activity_log: {
        Row: {
          action_type: string
          competition_id: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          user_id: string
        }
        Insert: {
          action_type: string
          competition_id: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          user_id: string
        }
        Update: {
          action_type?: string
          competition_id?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_activity_log_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_activity_log_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions_public"
            referencedColumns: ["id"]
          },
        ]
      }
      order_communications: {
        Row: {
          attachments: Json | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          message_ar: string | null
          order_id: string
          read_at: string | null
          sender_id: string | null
          sender_type: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          message_ar?: string | null
          order_id: string
          read_at?: string | null
          sender_id?: string | null
          sender_type: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          message_ar?: string | null
          order_id?: string
          read_at?: string | null
          sender_id?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_communications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "company_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_item_requests: {
        Row: {
          admin_notes: string | null
          assigned_vendor: string | null
          assigned_vendor_ar: string | null
          category: string
          competition_id: string | null
          created_at: string
          delivered_at: string | null
          delivered_by: string | null
          delivery_deadline: string | null
          delivery_notes: string | null
          delivery_status: string | null
          dish_template_id: string | null
          fulfilled_at: string | null
          fulfilled_by: string | null
          id: string
          item_name: string
          item_name_ar: string | null
          list_id: string | null
          notes: string | null
          notes_ar: string | null
          priority: string
          quantity: number
          rejection_reason: string | null
          requester_id: string
          requester_role: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          tracking_number: string | null
          unit: string
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          assigned_vendor?: string | null
          assigned_vendor_ar?: string | null
          category?: string
          competition_id?: string | null
          created_at?: string
          delivered_at?: string | null
          delivered_by?: string | null
          delivery_deadline?: string | null
          delivery_notes?: string | null
          delivery_status?: string | null
          dish_template_id?: string | null
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          id?: string
          item_name: string
          item_name_ar?: string | null
          list_id?: string | null
          notes?: string | null
          notes_ar?: string | null
          priority?: string
          quantity?: number
          rejection_reason?: string | null
          requester_id: string
          requester_role?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tracking_number?: string | null
          unit?: string
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          assigned_vendor?: string | null
          assigned_vendor_ar?: string | null
          category?: string
          competition_id?: string | null
          created_at?: string
          delivered_at?: string | null
          delivered_by?: string | null
          delivery_deadline?: string | null
          delivery_notes?: string | null
          delivery_status?: string | null
          dish_template_id?: string | null
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          id?: string
          item_name?: string
          item_name_ar?: string | null
          list_id?: string | null
          notes?: string | null
          notes_ar?: string | null
          priority?: string
          quantity?: number
          rejection_reason?: string | null
          requester_id?: string
          requester_role?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tracking_number?: string | null
          unit?: string
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_item_requests_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_item_requests_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_item_requests_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "requirement_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_item_requests_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_logos: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean
          logo_url: string
          name: string
          name_ar: string | null
          sort_order: number
          website_url: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url: string
          name: string
          name_ar?: string | null
          sort_order?: number
          website_url?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string
          name?: string
          name_ar?: string | null
          sort_order?: number
          website_url?: string | null
        }
        Relationships: []
      }
      password_recovery_tokens: {
        Row: {
          contact_value: string
          created_at: string | null
          expires_at: string
          id: string
          recovery_method: string
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          contact_value: string
          created_at?: string | null
          expires_at?: string
          id?: string
          recovery_method: string
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          contact_value?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          recovery_method?: string
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          category: string
          code: string
          created_at: string
          description: string | null
          description_ar: string | null
          id: string
          name: string
          name_ar: string | null
        }
        Insert: {
          category?: string
          code: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          name: string
          name_ar?: string | null
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          name?: string
          name_ar?: string | null
        }
        Relationships: []
      }
      phone_verifications: {
        Row: {
          attempts: number | null
          created_at: string | null
          expires_at: string
          id: string
          locked_until: string | null
          max_attempts: number | null
          otp_code: string
          phone_number: string
          updated_at: string | null
          user_id: string | null
          verified_at: string | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          expires_at?: string
          id?: string
          locked_until?: string | null
          max_attempts?: number | null
          otp_code: string
          phone_number: string
          updated_at?: string | null
          user_id?: string | null
          verified_at?: string | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          expires_at?: string
          id?: string
          locked_until?: string | null
          max_attempts?: number | null
          otp_code?: string
          phone_number?: string
          updated_at?: string | null
          user_id?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      platform_languages: {
        Row: {
          code: string
          created_at: string
          flag_emoji: string | null
          id: string
          is_default: boolean
          is_enabled: boolean
          is_rtl: boolean
          name: string
          native_name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          flag_emoji?: string | null
          id?: string
          is_default?: boolean
          is_enabled?: boolean
          is_rtl?: boolean
          name: string
          native_name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          flag_emoji?: string | null
          id?: string
          is_default?: boolean
          is_enabled?: boolean
          is_rtl?: boolean
          name?: string
          native_name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      points_earning_rules: {
        Row: {
          action_label: string
          action_label_ar: string | null
          action_type: string
          created_at: string
          id: string
          is_active: boolean
          max_per_day: number | null
          max_per_user: number | null
          points: number
        }
        Insert: {
          action_label: string
          action_label_ar?: string | null
          action_type: string
          created_at?: string
          id?: string
          is_active?: boolean
          max_per_day?: number | null
          max_per_user?: number | null
          points: number
        }
        Update: {
          action_label?: string
          action_label_ar?: string | null
          action_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          max_per_day?: number | null
          max_per_user?: number | null
          points?: number
        }
        Relationships: []
      }
      points_ledger: {
        Row: {
          action_type: string
          balance_after: number
          created_at: string
          description: string | null
          description_ar: string | null
          id: string
          metadata: Json | null
          points: number
          reference_id: string | null
          reference_type: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          balance_after?: number
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          metadata?: Json | null
          points: number
          reference_id?: string | null
          reference_type?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          balance_after?: number
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          metadata?: Json | null
          points?: number
          reference_id?: string | null
          reference_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      points_redemptions: {
        Row: {
          created_at: string
          fulfilled_at: string | null
          id: string
          metadata: Json | null
          points_spent: number
          redemption_code: string | null
          reward_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          fulfilled_at?: string | null
          id?: string
          metadata?: Json | null
          points_spent: number
          redemption_code?: string | null
          reward_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          fulfilled_at?: string | null
          id?: string
          metadata?: Json | null
          points_spent?: number
          redemption_code?: string | null
          reward_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "points_rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      points_rewards: {
        Row: {
          category: string
          created_at: string
          description: string | null
          description_ar: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          name_ar: string | null
          points_cost: number
          reward_type: string
          reward_value: Json
          sort_order: number
          stock: number | null
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          name_ar?: string | null
          points_cost: number
          reward_type?: string
          reward_value?: Json
          sort_order?: number
          stock?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          name_ar?: string | null
          points_cost?: number
          reward_type?: string
          reward_value?: Json
          sort_order?: number
          stock?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      poll_votes: {
        Row: {
          id: string
          option_index: number
          poll_id: string
          user_id: string
          voted_at: string
        }
        Insert: {
          id?: string
          option_index: number
          poll_id: string
          user_id: string
          voted_at?: string
        }
        Update: {
          id?: string
          option_index?: number
          poll_id?: string
          user_id?: string
          voted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "community_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      post_bookmarks: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          parent_comment_id: string | null
          post_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_edits: {
        Row: {
          edited_at: string
          edited_by: string
          id: string
          post_id: string
          previous_content: string
        }
        Insert: {
          edited_at?: string
          edited_by: string
          id?: string
          post_id: string
          previous_content: string
        }
        Update: {
          edited_at?: string
          edited_by?: string
          id?: string
          post_id?: string
          previous_content?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_edits_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_poll_options: {
        Row: {
          created_at: string
          id: string
          option_text: string
          poll_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          option_text: string
          poll_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          option_text?: string
          poll_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "post_poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "post_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      post_poll_votes: {
        Row: {
          created_at: string
          id: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "post_poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "post_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      post_polls: {
        Row: {
          allows_multiple: boolean | null
          created_at: string
          ends_at: string | null
          id: string
          post_id: string
          question: string | null
        }
        Insert: {
          allows_multiple?: boolean | null
          created_at?: string
          ends_at?: string | null
          id?: string
          post_id: string
          question?: string | null
        }
        Update: {
          allows_multiple?: boolean | null
          created_at?: string
          ends_at?: string | null
          id?: string
          post_id?: string
          question?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_polls_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reports: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reason: string
          reason_detail: string | null
          reporter_id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reason: string
          reason_detail?: string | null
          reporter_id: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reason?: string
          reason_detail?: string | null
          reporter_id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reposts: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reposts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          edited_at: string | null
          group_id: string | null
          id: string
          image_url: string | null
          image_urls: string[] | null
          is_pinned: boolean
          is_scheduled: boolean | null
          link_preview: Json | null
          link_url: string | null
          moderated_at: string | null
          moderated_by: string | null
          moderation_reason: string | null
          moderation_status: string
          replies_count: number
          reply_to_post_id: string | null
          reposts_count: number
          scheduled_at: string | null
          updated_at: string
          video_url: string | null
          visibility: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          edited_at?: string | null
          group_id?: string | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          is_pinned?: boolean
          is_scheduled?: boolean | null
          link_preview?: Json | null
          link_url?: string | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_reason?: string | null
          moderation_status?: string
          replies_count?: number
          reply_to_post_id?: string | null
          reposts_count?: number
          scheduled_at?: string | null
          updated_at?: string
          video_url?: string | null
          visibility?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          edited_at?: string | null
          group_id?: string | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          is_pinned?: boolean
          is_scheduled?: boolean | null
          link_preview?: Json | null
          link_url?: string | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_reason?: string | null
          moderation_status?: string
          replies_count?: number
          reply_to_post_id?: string | null
          reposts_count?: number
          scheduled_at?: string | null
          updated_at?: string
          video_url?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_reply_to_post_id_fkey"
            columns: ["reply_to_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      predefined_categories: {
        Row: {
          created_at: string | null
          default_max_participants: number | null
          description: string | null
          description_ar: string | null
          gender: string | null
          id: string
          is_active: boolean | null
          name: string
          name_ar: string | null
          participant_level: string | null
          sort_order: number | null
          type_id: string | null
        }
        Insert: {
          created_at?: string | null
          default_max_participants?: number | null
          description?: string | null
          description_ar?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_ar?: string | null
          participant_level?: string | null
          sort_order?: number | null
          type_id?: string | null
        }
        Update: {
          created_at?: string | null
          default_max_participants?: number | null
          description?: string | null
          description_ar?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_ar?: string | null
          participant_level?: string | null
          sort_order?: number | null
          type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "predefined_categories_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "competition_types"
            referencedColumns: ["id"]
          },
        ]
      }
      preparation_checklists: {
        Row: {
          competition_id: string
          created_at: string | null
          id: string
          items: Json
          progress_percentage: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          competition_id: string
          created_at?: string | null
          id?: string
          items?: Json
          progress_percentage?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          competition_id?: string
          created_at?: string | null
          id?: string
          items?: Json
          progress_percentage?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "preparation_checklists_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preparation_checklists_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_views: {
        Row: {
          browser: string | null
          company_id: string | null
          country: string | null
          created_at: string
          device_type: string | null
          gender: string | null
          id: string
          profile_user_id: string
          referrer: string | null
          viewer_ip: string | null
          viewer_type: string | null
          viewer_user_agent: string | null
          viewer_user_id: string | null
        }
        Insert: {
          browser?: string | null
          company_id?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          gender?: string | null
          id?: string
          profile_user_id: string
          referrer?: string | null
          viewer_ip?: string | null
          viewer_type?: string | null
          viewer_user_agent?: string | null
          viewer_user_id?: string | null
        }
        Update: {
          browser?: string | null
          company_id?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          gender?: string | null
          id?: string
          profile_user_id?: string
          referrer?: string | null
          viewer_ip?: string | null
          viewer_type?: string | null
          viewer_user_agent?: string | null
          viewer_user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_number: string | null
          account_status: Database["public"]["Enums"]["account_status"] | null
          avatar_url: string | null
          bio: string | null
          bio_ar: string | null
          city: string | null
          company_id: string | null
          company_role: string | null
          country_code: string | null
          cover_image_url: string | null
          created_at: string
          date_of_birth: string | null
          display_name: string | null
          display_name_ar: string | null
          education_entity_id: string | null
          education_institution: string | null
          education_level: string | null
          email: string | null
          email_verified: boolean | null
          experience_level:
            | Database["public"]["Enums"]["experience_level"]
            | null
          facebook: string | null
          follow_privacy: string
          full_name: string | null
          full_name_ar: string | null
          gender: string | null
          global_awards: Json | null
          id: string
          instagram: string | null
          is_verified: boolean | null
          job_title: string | null
          job_title_ar: string | null
          last_login_at: string | null
          linkedin: string | null
          location: string | null
          login_method: string | null
          loyalty_points: number | null
          membership_expires_at: string | null
          membership_status:
            | Database["public"]["Enums"]["membership_status"]
            | null
          membership_tier: Database["public"]["Enums"]["membership_tier"] | null
          nationality: string | null
          offers_services: boolean | null
          password_last_changed: string | null
          phone: string | null
          phone_verified: boolean | null
          preferred_language: string | null
          profile_completed: boolean | null
          profile_visibility: string
          second_nationality: string | null
          secondary_email: string | null
          section_visibility: Json | null
          services_description: string | null
          services_description_ar: string | null
          show_nationality: boolean | null
          snapchat: string | null
          specialization: string | null
          specialization_ar: string | null
          suspended_at: string | null
          suspended_reason: string | null
          tiktok: string | null
          twitter: string | null
          updated_at: string
          user_id: string
          username: string | null
          verification_badge: string | null
          verification_level: string | null
          verified_at: string | null
          view_count: number | null
          wallet_balance: number | null
          website: string | null
          years_of_experience: number | null
          youtube: string | null
        }
        Insert: {
          account_number?: string | null
          account_status?: Database["public"]["Enums"]["account_status"] | null
          avatar_url?: string | null
          bio?: string | null
          bio_ar?: string | null
          city?: string | null
          company_id?: string | null
          company_role?: string | null
          country_code?: string | null
          cover_image_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          display_name_ar?: string | null
          education_entity_id?: string | null
          education_institution?: string | null
          education_level?: string | null
          email?: string | null
          email_verified?: boolean | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          facebook?: string | null
          follow_privacy?: string
          full_name?: string | null
          full_name_ar?: string | null
          gender?: string | null
          global_awards?: Json | null
          id?: string
          instagram?: string | null
          is_verified?: boolean | null
          job_title?: string | null
          job_title_ar?: string | null
          last_login_at?: string | null
          linkedin?: string | null
          location?: string | null
          login_method?: string | null
          loyalty_points?: number | null
          membership_expires_at?: string | null
          membership_status?:
            | Database["public"]["Enums"]["membership_status"]
            | null
          membership_tier?:
            | Database["public"]["Enums"]["membership_tier"]
            | null
          nationality?: string | null
          offers_services?: boolean | null
          password_last_changed?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          preferred_language?: string | null
          profile_completed?: boolean | null
          profile_visibility?: string
          second_nationality?: string | null
          secondary_email?: string | null
          section_visibility?: Json | null
          services_description?: string | null
          services_description_ar?: string | null
          show_nationality?: boolean | null
          snapchat?: string | null
          specialization?: string | null
          specialization_ar?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
          tiktok?: string | null
          twitter?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
          verification_badge?: string | null
          verification_level?: string | null
          verified_at?: string | null
          view_count?: number | null
          wallet_balance?: number | null
          website?: string | null
          years_of_experience?: number | null
          youtube?: string | null
        }
        Update: {
          account_number?: string | null
          account_status?: Database["public"]["Enums"]["account_status"] | null
          avatar_url?: string | null
          bio?: string | null
          bio_ar?: string | null
          city?: string | null
          company_id?: string | null
          company_role?: string | null
          country_code?: string | null
          cover_image_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          display_name_ar?: string | null
          education_entity_id?: string | null
          education_institution?: string | null
          education_level?: string | null
          email?: string | null
          email_verified?: boolean | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          facebook?: string | null
          follow_privacy?: string
          full_name?: string | null
          full_name_ar?: string | null
          gender?: string | null
          global_awards?: Json | null
          id?: string
          instagram?: string | null
          is_verified?: boolean | null
          job_title?: string | null
          job_title_ar?: string | null
          last_login_at?: string | null
          linkedin?: string | null
          location?: string | null
          login_method?: string | null
          loyalty_points?: number | null
          membership_expires_at?: string | null
          membership_status?:
            | Database["public"]["Enums"]["membership_status"]
            | null
          membership_tier?:
            | Database["public"]["Enums"]["membership_tier"]
            | null
          nationality?: string | null
          offers_services?: boolean | null
          password_last_changed?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          preferred_language?: string | null
          profile_completed?: boolean | null
          profile_visibility?: string
          second_nationality?: string | null
          secondary_email?: string | null
          section_visibility?: Json | null
          services_description?: string | null
          services_description_ar?: string | null
          show_nationality?: boolean | null
          snapchat?: string | null
          specialization?: string | null
          specialization_ar?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
          tiktok?: string | null
          twitter?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
          verification_badge?: string | null
          verification_level?: string | null
          verified_at?: string | null
          view_count?: number | null
          wallet_balance?: number | null
          website?: string | null
          years_of_experience?: number | null
          youtube?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_education_entity_id_fkey"
            columns: ["education_entity_id"]
            isOneToOne: false
            referencedRelation: "culinary_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      qr_codes: {
        Row: {
          category: string
          code: string
          created_at: string
          created_by: string | null
          entity_id: string
          entity_type: string
          id: string
          is_active: boolean
          last_scanned_at: string | null
          metadata: Json | null
          scan_count: number
          updated_at: string
        }
        Insert: {
          category?: string
          code: string
          created_at?: string
          created_by?: string | null
          entity_id: string
          entity_type: string
          id?: string
          is_active?: boolean
          last_scanned_at?: string | null
          metadata?: Json | null
          scan_count?: number
          updated_at?: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_active?: boolean
          last_scanned_at?: string | null
          metadata?: Json | null
          scan_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      qr_scan_logs: {
        Row: {
          code: string
          id: string
          ip_address: string | null
          qr_code_id: string
          scanned_at: string
          scanned_by: string | null
          user_agent: string | null
        }
        Insert: {
          code: string
          id?: string
          ip_address?: string | null
          qr_code_id: string
          scanned_at?: string
          scanned_by?: string | null
          user_agent?: string | null
        }
        Update: {
          code?: string
          id?: string
          ip_address?: string | null
          qr_code_id?: string
          scanned_at?: string
          scanned_by?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qr_scan_logs_qr_code_id_fkey"
            columns: ["qr_code_id"]
            isOneToOne: false
            referencedRelation: "qr_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      ranking_points_log: {
        Row: {
          awarded_at: string | null
          competition_id: string | null
          competition_name: string | null
          competition_name_ar: string | null
          id: string
          points: number
          reason: string
          reason_ar: string | null
          user_id: string
        }
        Insert: {
          awarded_at?: string | null
          competition_id?: string | null
          competition_name?: string | null
          competition_name_ar?: string | null
          id?: string
          points: number
          reason: string
          reason_ar?: string | null
          user_id: string
        }
        Update: {
          awarded_at?: string | null
          competition_id?: string | null
          competition_name?: string | null
          competition_name_ar?: string | null
          id?: string
          points?: number
          reason?: string
          reason_ar?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ranking_points_log_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ranking_points_log_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions_public"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_ratings: {
        Row: {
          created_at: string
          id: string
          rating: number
          recipe_id: string
          review: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rating: number
          recipe_id: string
          review?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rating?: number
          recipe_id?: string
          review?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ratings_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          author_id: string
          calories: number | null
          carbs_g: number | null
          category: string | null
          cook_time_minutes: number | null
          country_code: string | null
          created_at: string
          cuisine: string | null
          description: string | null
          description_ar: string | null
          difficulty: string | null
          fat_g: number | null
          fiber_g: number | null
          gallery_urls: string[] | null
          id: string
          image_url: string | null
          ingredients: Json
          is_published: boolean | null
          prep_time_minutes: number | null
          protein_g: number | null
          servings: number | null
          slug: string | null
          source_url: string | null
          steps: Json
          tags: string[] | null
          title: string
          title_ar: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          author_id: string
          calories?: number | null
          carbs_g?: number | null
          category?: string | null
          cook_time_minutes?: number | null
          country_code?: string | null
          created_at?: string
          cuisine?: string | null
          description?: string | null
          description_ar?: string | null
          difficulty?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          gallery_urls?: string[] | null
          id?: string
          image_url?: string | null
          ingredients?: Json
          is_published?: boolean | null
          prep_time_minutes?: number | null
          protein_g?: number | null
          servings?: number | null
          slug?: string | null
          source_url?: string | null
          steps?: Json
          tags?: string[] | null
          title: string
          title_ar?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          author_id?: string
          calories?: number | null
          carbs_g?: number | null
          category?: string | null
          cook_time_minutes?: number | null
          country_code?: string | null
          created_at?: string
          cuisine?: string | null
          description?: string | null
          description_ar?: string | null
          difficulty?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          gallery_urls?: string[] | null
          id?: string
          image_url?: string | null
          ingredients?: Json
          is_published?: boolean | null
          prep_time_minutes?: number | null
          protein_g?: number | null
          servings?: number | null
          slug?: string | null
          source_url?: string | null
          steps?: Json
          tags?: string[] | null
          title?: string
          title_ar?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      reference_gallery: {
        Row: {
          added_by: string | null
          category: string | null
          category_id: string | null
          competition_category: string | null
          created_at: string
          description: string | null
          description_ar: string | null
          id: string
          image_url: string
          is_active: boolean | null
          rating: string | null
          score_range_max: number | null
          score_range_min: number | null
          sort_order: number | null
          tags: string[] | null
          title: string
          title_ar: string | null
          uploaded_by_name: string | null
        }
        Insert: {
          added_by?: string | null
          category?: string | null
          category_id?: string | null
          competition_category?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          rating?: string | null
          score_range_max?: number | null
          score_range_min?: number | null
          sort_order?: number | null
          tags?: string[] | null
          title: string
          title_ar?: string | null
          uploaded_by_name?: string | null
        }
        Update: {
          added_by?: string | null
          category?: string | null
          category_id?: string | null
          competition_category?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          rating?: string | null
          score_range_max?: number | null
          score_range_min?: number | null
          sort_order?: number | null
          tags?: string[] | null
          title?: string
          title_ar?: string | null
          uploaded_by_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reference_gallery_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "knowledge_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_clicks: {
        Row: {
          clicked_at: string
          country: string | null
          device_type: string | null
          id: string
          ip_address: string | null
          platform: string | null
          referer_url: string | null
          referral_code_id: string
          user_agent: string | null
        }
        Insert: {
          clicked_at?: string
          country?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          platform?: string | null
          referer_url?: string | null
          referral_code_id: string
          user_agent?: string | null
        }
        Update: {
          clicked_at?: string
          country?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          platform?: string | null
          referer_url?: string | null
          referral_code_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_clicks_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          custom_slug: string | null
          id: string
          is_active: boolean
          total_clicks: number
          total_conversions: number
          total_invites_sent: number
          total_points_earned: number
          updated_at: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          custom_slug?: string | null
          id?: string
          is_active?: boolean
          total_clicks?: number
          total_conversions?: number
          total_invites_sent?: number
          total_points_earned?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          custom_slug?: string | null
          id?: string
          is_active?: boolean
          total_clicks?: number
          total_conversions?: number
          total_invites_sent?: number
          total_points_earned?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_conversions: {
        Row: {
          conversion_type: string
          converted_at: string
          id: string
          invitation_id: string | null
          metadata: Json | null
          points_awarded_referred: number
          points_awarded_referrer: number
          referral_code_id: string
          referred_user_id: string
          referrer_id: string
        }
        Insert: {
          conversion_type?: string
          converted_at?: string
          id?: string
          invitation_id?: string | null
          metadata?: Json | null
          points_awarded_referred?: number
          points_awarded_referrer?: number
          referral_code_id: string
          referred_user_id: string
          referrer_id: string
        }
        Update: {
          conversion_type?: string
          converted_at?: string
          id?: string
          invitation_id?: string | null
          metadata?: Json | null
          points_awarded_referred?: number
          points_awarded_referrer?: number
          referral_code_id?: string
          referred_user_id?: string
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_conversions_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "referral_invitations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_conversions_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_invitations: {
        Row: {
          channel: string
          clicked_at: string | null
          created_at: string
          id: string
          invitee_email: string | null
          invitee_phone: string | null
          metadata: Json | null
          platform: string | null
          referral_code_id: string
          referrer_id: string
          registered_at: string | null
          reminder_count: number
          reminder_sent_at: string | null
          sent_at: string
          status: string
        }
        Insert: {
          channel?: string
          clicked_at?: string | null
          created_at?: string
          id?: string
          invitee_email?: string | null
          invitee_phone?: string | null
          metadata?: Json | null
          platform?: string | null
          referral_code_id: string
          referrer_id: string
          registered_at?: string | null
          reminder_count?: number
          reminder_sent_at?: string | null
          sent_at?: string
          status?: string
        }
        Update: {
          channel?: string
          clicked_at?: string | null
          created_at?: string
          id?: string
          invitee_email?: string | null
          invitee_phone?: string | null
          metadata?: Json | null
          platform?: string | null
          referral_code_id?: string
          referrer_id?: string
          registered_at?: string | null
          reminder_count?: number
          reminder_sent_at?: string | null
          sent_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_invitations_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_milestones: {
        Row: {
          badge_icon: string | null
          created_at: string
          description: string | null
          description_ar: string | null
          id: string
          is_active: boolean
          name: string
          name_ar: string | null
          required_referrals: number
          reward_description: string | null
          reward_description_ar: string | null
          reward_type: string
          reward_value: number
          sort_order: number
        }
        Insert: {
          badge_icon?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          is_active?: boolean
          name: string
          name_ar?: string | null
          required_referrals: number
          reward_description?: string | null
          reward_description_ar?: string | null
          reward_type?: string
          reward_value?: number
          sort_order?: number
        }
        Update: {
          badge_icon?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          is_active?: boolean
          name?: string
          name_ar?: string | null
          required_referrals?: number
          reward_description?: string | null
          reward_description_ar?: string | null
          reward_type?: string
          reward_value?: number
          sort_order?: number
        }
        Relationships: []
      }
      referral_tier_bonuses: {
        Row: {
          bonus_points: number
          created_at: string | null
          id: string
          label: string
          label_ar: string | null
          max_referrals: number | null
          min_referrals: number
        }
        Insert: {
          bonus_points?: number
          created_at?: string | null
          id?: string
          label: string
          label_ar?: string | null
          max_referrals?: number | null
          min_referrals: number
        }
        Update: {
          bonus_points?: number
          created_at?: string | null
          id?: string
          label?: string
          label_ar?: string | null
          max_referrals?: number | null
          min_referrals?: number
        }
        Relationships: []
      }
      registration_team_members: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          is_captain: boolean | null
          job_title: string | null
          job_title_ar: string | null
          member_name: string
          member_name_ar: string | null
          phone: string | null
          registration_id: string
          role_in_team: string | null
          sort_order: number | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_captain?: boolean | null
          job_title?: string | null
          job_title_ar?: string | null
          member_name: string
          member_name_ar?: string | null
          phone?: string | null
          registration_id: string
          role_in_team?: string | null
          sort_order?: number | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_captain?: boolean | null
          job_title?: string | null
          job_title_ar?: string | null
          member_name?: string
          member_name_ar?: string | null
          phone?: string | null
          registration_id?: string
          role_in_team?: string | null
          sort_order?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registration_team_members_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "competition_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      requirement_delivery_logs: {
        Row: {
          action: string
          action_by: string
          created_at: string | null
          id: string
          list_item_id: string
          notes: string | null
          notes_ar: string | null
          quantity_delivered: number | null
        }
        Insert: {
          action: string
          action_by: string
          created_at?: string | null
          id?: string
          list_item_id: string
          notes?: string | null
          notes_ar?: string | null
          quantity_delivered?: number | null
        }
        Update: {
          action?: string
          action_by?: string
          created_at?: string | null
          id?: string
          list_item_id?: string
          notes?: string | null
          notes_ar?: string | null
          quantity_delivered?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "requirement_delivery_logs_list_item_id_fkey"
            columns: ["list_item_id"]
            isOneToOne: false
            referencedRelation: "requirement_list_items"
            referencedColumns: ["id"]
          },
        ]
      }
      requirement_items: {
        Row: {
          alternatives: string[] | null
          brand: string | null
          brand_ar: string | null
          category: string
          created_at: string | null
          created_by: string | null
          currency: string | null
          default_quantity: number | null
          description: string | null
          description_ar: string | null
          estimated_cost: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          material: string | null
          material_ar: string | null
          name: string
          name_ar: string | null
          size: string | null
          size_ar: string | null
          specifications: Json | null
          subcategory: string | null
          supplier_notes: string | null
          supplier_notes_ar: string | null
          tags: string[] | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          alternatives?: string[] | null
          brand?: string | null
          brand_ar?: string | null
          category: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          default_quantity?: number | null
          description?: string | null
          description_ar?: string | null
          estimated_cost?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          material?: string | null
          material_ar?: string | null
          name: string
          name_ar?: string | null
          size?: string | null
          size_ar?: string | null
          specifications?: Json | null
          subcategory?: string | null
          supplier_notes?: string | null
          supplier_notes_ar?: string | null
          tags?: string[] | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          alternatives?: string[] | null
          brand?: string | null
          brand_ar?: string | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          default_quantity?: number | null
          description?: string | null
          description_ar?: string | null
          estimated_cost?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          material?: string | null
          material_ar?: string | null
          name?: string
          name_ar?: string | null
          size?: string | null
          size_ar?: string | null
          specifications?: Json | null
          subcategory?: string | null
          supplier_notes?: string | null
          supplier_notes_ar?: string | null
          tags?: string[] | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      requirement_list_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string
          can_edit: boolean | null
          id: string
          list_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by: string
          can_edit?: boolean | null
          id?: string
          list_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string
          can_edit?: boolean | null
          id?: string
          list_id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "requirement_list_assignments_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "requirement_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      requirement_list_items: {
        Row: {
          added_by: string | null
          alternative_item_id: string | null
          alternative_notes: string | null
          alternative_notes_ar: string | null
          assigned_at: string | null
          assigned_by: string | null
          assigned_to: string | null
          assigned_vendor_id: string | null
          category: string | null
          checked: boolean | null
          checked_at: string | null
          checked_by: string | null
          created_at: string | null
          currency: string | null
          custom_name: string | null
          custom_name_ar: string | null
          deadline: string | null
          delivered_at: string | null
          delivered_by: string | null
          estimated_cost: number | null
          id: string
          importance: string | null
          item_id: string | null
          last_edited_at: string | null
          last_edited_by: string | null
          list_id: string
          notes: string | null
          notes_ar: string | null
          priority: string | null
          quantity: number
          sort_order: number | null
          sponsor_id: string | null
          status: string | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          added_by?: string | null
          alternative_item_id?: string | null
          alternative_notes?: string | null
          alternative_notes_ar?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          assigned_vendor_id?: string | null
          category?: string | null
          checked?: boolean | null
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string | null
          currency?: string | null
          custom_name?: string | null
          custom_name_ar?: string | null
          deadline?: string | null
          delivered_at?: string | null
          delivered_by?: string | null
          estimated_cost?: number | null
          id?: string
          importance?: string | null
          item_id?: string | null
          last_edited_at?: string | null
          last_edited_by?: string | null
          list_id: string
          notes?: string | null
          notes_ar?: string | null
          priority?: string | null
          quantity?: number
          sort_order?: number | null
          sponsor_id?: string | null
          status?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          added_by?: string | null
          alternative_item_id?: string | null
          alternative_notes?: string | null
          alternative_notes_ar?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          assigned_vendor_id?: string | null
          category?: string | null
          checked?: boolean | null
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string | null
          currency?: string | null
          custom_name?: string | null
          custom_name_ar?: string | null
          deadline?: string | null
          delivered_at?: string | null
          delivered_by?: string | null
          estimated_cost?: number | null
          id?: string
          importance?: string | null
          item_id?: string | null
          last_edited_at?: string | null
          last_edited_by?: string | null
          list_id?: string
          notes?: string | null
          notes_ar?: string | null
          priority?: string | null
          quantity?: number
          sort_order?: number | null
          sponsor_id?: string | null
          status?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requirement_list_items_alternative_item_id_fkey"
            columns: ["alternative_item_id"]
            isOneToOne: false
            referencedRelation: "requirement_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requirement_list_items_assigned_vendor_id_fkey"
            columns: ["assigned_vendor_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requirement_list_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "requirement_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requirement_list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "requirement_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requirement_list_items_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      requirement_list_shares: {
        Row: {
          id: string
          list_id: string
          permission: string | null
          shared_at: string | null
          shared_by: string
          shared_with_user_id: string | null
        }
        Insert: {
          id?: string
          list_id: string
          permission?: string | null
          shared_at?: string | null
          shared_by: string
          shared_with_user_id?: string | null
        }
        Update: {
          id?: string
          list_id?: string
          permission?: string | null
          shared_at?: string | null
          shared_by?: string
          shared_with_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requirement_list_shares_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "requirement_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      requirement_lists: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          category: string
          competition_id: string | null
          created_at: string | null
          created_by: string
          description: string | null
          description_ar: string | null
          id: string
          notes: string | null
          status: string
          title: string
          title_ar: string | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          competition_id?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          description_ar?: string | null
          id?: string
          notes?: string | null
          status?: string
          title: string
          title_ar?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          competition_id?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          notes?: string | null
          status?: string
          title?: string
          title_ar?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requirement_lists_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requirement_lists_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions_public"
            referencedColumns: ["id"]
          },
        ]
      }
      requirement_sponsorship_requests: {
        Row: {
          competition_id: string
          created_at: string | null
          currency: string | null
          deadline: string | null
          description: string | null
          description_ar: string | null
          id: string
          items: Json | null
          list_id: string
          request_type: string
          requested_by: string
          responded_at: string | null
          responded_by: string | null
          response_notes: string | null
          sent_at: string | null
          sponsor_company_id: string
          status: string
          title: string
          title_ar: string | null
          total_estimated_cost: number | null
          updated_at: string | null
        }
        Insert: {
          competition_id: string
          created_at?: string | null
          currency?: string | null
          deadline?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          items?: Json | null
          list_id: string
          request_type?: string
          requested_by: string
          responded_at?: string | null
          responded_by?: string | null
          response_notes?: string | null
          sent_at?: string | null
          sponsor_company_id: string
          status?: string
          title: string
          title_ar?: string | null
          total_estimated_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          competition_id?: string
          created_at?: string | null
          currency?: string | null
          deadline?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          items?: Json | null
          list_id?: string
          request_type?: string
          requested_by?: string
          responded_at?: string | null
          responded_by?: string | null
          response_notes?: string | null
          sent_at?: string | null
          sponsor_company_id?: string
          status?: string
          title?: string
          title_ar?: string | null
          total_estimated_cost?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requirement_sponsorship_requests_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requirement_sponsorship_requests_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requirement_sponsorship_requests_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "requirement_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requirement_sponsorship_requests_sponsor_company_id_fkey"
            columns: ["sponsor_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      requirement_suggestions: {
        Row: {
          category: string
          competition_id: string
          created_at: string | null
          currency: string | null
          description: string | null
          description_ar: string | null
          estimated_cost: number | null
          id: string
          image_url: string | null
          item_name: string
          item_name_ar: string | null
          list_id: string | null
          priority: string | null
          quantity: number | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          subcategory: string | null
          suggested_by: string
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string
          competition_id: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          description_ar?: string | null
          estimated_cost?: number | null
          id?: string
          image_url?: string | null
          item_name: string
          item_name_ar?: string | null
          list_id?: string | null
          priority?: string | null
          quantity?: number | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          subcategory?: string | null
          suggested_by: string
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          competition_id?: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          description_ar?: string | null
          estimated_cost?: number | null
          id?: string
          image_url?: string | null
          item_name?: string
          item_name_ar?: string | null
          list_id?: string | null
          priority?: string | null
          quantity?: number | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          subcategory?: string | null
          suggested_by?: string
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requirement_suggestions_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requirement_suggestions_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requirement_suggestions_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "requirement_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      requirement_templates: {
        Row: {
          category: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_public: boolean
          items: Json
          name: string
          name_ar: string | null
          updated_at: string
          usage_count: number
        }
        Insert: {
          category?: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_public?: boolean
          items?: Json
          name: string
          name_ar?: string | null
          updated_at?: string
          usage_count?: number
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_public?: boolean
          items?: Json
          name?: string
          name_ar?: string | null
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      round_participants: {
        Row: {
          advanced_to_round_id: string | null
          created_at: string | null
          id: string
          rank: number | null
          registration_id: string
          round_id: string
          seed_position: number | null
          status: string
          total_score: number | null
        }
        Insert: {
          advanced_to_round_id?: string | null
          created_at?: string | null
          id?: string
          rank?: number | null
          registration_id: string
          round_id: string
          seed_position?: number | null
          status?: string
          total_score?: number | null
        }
        Update: {
          advanced_to_round_id?: string | null
          created_at?: string | null
          id?: string
          rank?: number | null
          registration_id?: string
          round_id?: string
          seed_position?: number | null
          status?: string
          total_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "round_participants_advanced_to_round_id_fkey"
            columns: ["advanced_to_round_id"]
            isOneToOne: false
            referencedRelation: "competition_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "round_participants_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "competition_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "round_participants_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "competition_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_ai_models: {
        Row: {
          capabilities: string[] | null
          created_at: string
          created_by: string | null
          description: string | null
          description_ar: string | null
          display_name: string
          display_name_ar: string | null
          id: string
          is_active: boolean
          is_default: boolean
          max_tokens: number | null
          model_id: string
          provider: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          capabilities?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          display_name: string
          display_name_ar?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          max_tokens?: number | null
          model_id: string
          provider?: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          capabilities?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          display_name?: string
          display_name_ar?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          max_tokens?: number | null
          model_id?: string
          provider?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      seo_content_sources: {
        Row: {
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          description_ar: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          name_ar: string
          sort_order: number | null
          source_key: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          name_ar: string
          sort_order?: number | null
          source_key: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          name_ar?: string
          sort_order?: number | null
          source_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      seo_rules: {
        Row: {
          created_at: string
          created_by: string | null
          field_scope: string
          id: string
          is_enabled: boolean
          rule_text: string
          rule_text_ar: string
          severity: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          field_scope?: string
          id?: string
          is_enabled?: boolean
          rule_text: string
          rule_text_ar: string
          severity?: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          field_scope?: string
          id?: string
          is_enabled?: boolean
          rule_text?: string
          rule_text_ar?: string
          severity?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      seo_translatable_fields: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          description_ar: string | null
          field_name: string
          field_name_ar: string
          field_type: string
          id: string
          is_active: boolean
          is_required: boolean
          label: string
          label_ar: string
          max_length: number
          seo_optimize: boolean
          sort_order: number | null
          table_name: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          field_name: string
          field_name_ar: string
          field_type?: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          label: string
          label_ar: string
          max_length?: number
          seo_optimize?: boolean
          sort_order?: number | null
          table_name: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          field_name?: string
          field_name_ar?: string
          field_type?: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          label?: string
          label_ar?: string
          max_length?: number
          seo_optimize?: boolean
          sort_order?: number | null
          table_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      shop_categories: {
        Row: {
          created_at: string | null
          description: string | null
          description_ar: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          name_ar: string | null
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_ar?: string | null
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_ar?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      shop_discount_codes: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_order_amount: number | null
          used_count: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      shop_order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          product_snapshot: Json | null
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          product_snapshot?: Json | null
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          product_snapshot?: Json | null
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "shop_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "shop_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_orders: {
        Row: {
          buyer_email: string | null
          buyer_id: string
          buyer_name: string | null
          created_at: string
          currency: string
          discount_amount: number | null
          id: string
          notes: string | null
          order_number: string
          payment_intent_id: string | null
          payment_method: string | null
          payment_status: string | null
          shipping_address: Json | null
          status: Database["public"]["Enums"]["shop_order_status"]
          subtotal: number | null
          tax_amount: number | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          buyer_email?: string | null
          buyer_id: string
          buyer_name?: string | null
          created_at?: string
          currency?: string
          discount_amount?: number | null
          id?: string
          notes?: string | null
          order_number: string
          payment_intent_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          shipping_address?: Json | null
          status?: Database["public"]["Enums"]["shop_order_status"]
          subtotal?: number | null
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          buyer_email?: string | null
          buyer_id?: string
          buyer_name?: string | null
          created_at?: string
          currency?: string
          discount_amount?: number | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_intent_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          shipping_address?: Json | null
          status?: Database["public"]["Enums"]["shop_order_status"]
          subtotal?: number | null
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      shop_products: {
        Row: {
          brand: string | null
          brand_ar: string | null
          category: string
          compare_at_price: number | null
          created_at: string
          currency: string
          description: string | null
          description_ar: string | null
          discount_percent: number | null
          gallery_urls: string[] | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          metadata: Json | null
          price: number
          product_type: Database["public"]["Enums"]["shop_product_type"]
          seller_id: string
          sku: string | null
          stock_quantity: number | null
          tags: string[] | null
          tax_inclusive: boolean | null
          tax_rate: number | null
          title: string
          title_ar: string | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          brand?: string | null
          brand_ar?: string | null
          category?: string
          compare_at_price?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          description_ar?: string | null
          discount_percent?: number | null
          gallery_urls?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          metadata?: Json | null
          price?: number
          product_type?: Database["public"]["Enums"]["shop_product_type"]
          seller_id: string
          sku?: string | null
          stock_quantity?: number | null
          tags?: string[] | null
          tax_inclusive?: boolean | null
          tax_rate?: number | null
          title: string
          title_ar?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          brand?: string | null
          brand_ar?: string | null
          category?: string
          compare_at_price?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          description_ar?: string | null
          discount_percent?: number | null
          gallery_urls?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          metadata?: Json | null
          price?: number
          product_type?: Database["public"]["Enums"]["shop_product_type"]
          seller_id?: string
          sku?: string | null
          stock_quantity?: number | null
          tags?: string[] | null
          tax_inclusive?: boolean | null
          tax_rate?: number | null
          title?: string
          title_ar?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          category: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          category?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          category?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      smart_import_logs: {
        Row: {
          action: string
          created_at: string
          entity_name: string | null
          entity_name_ar: string | null
          entity_type: string | null
          error_message: string | null
          extracted_fields_count: number | null
          id: string
          imported_by: string
          imported_data: Json | null
          source_location: string | null
          source_query: string | null
          source_url: string | null
          sources_used: Json | null
          status: string
          target_record_id: string | null
          target_table: string
        }
        Insert: {
          action?: string
          created_at?: string
          entity_name?: string | null
          entity_name_ar?: string | null
          entity_type?: string | null
          error_message?: string | null
          extracted_fields_count?: number | null
          id?: string
          imported_by: string
          imported_data?: Json | null
          source_location?: string | null
          source_query?: string | null
          source_url?: string | null
          sources_used?: Json | null
          status?: string
          target_record_id?: string | null
          target_table: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_name?: string | null
          entity_name_ar?: string | null
          entity_type?: string | null
          error_message?: string | null
          extracted_fields_count?: number | null
          id?: string
          imported_by?: string
          imported_data?: Json | null
          source_location?: string | null
          source_query?: string | null
          source_url?: string | null
          sources_used?: Json | null
          status?: string
          target_record_id?: string | null
          target_table?: string
        }
        Relationships: []
      }
      specialties: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          description_ar: string | null
          id: string
          is_active: boolean | null
          is_approved: boolean | null
          name: string
          name_ar: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          is_active?: boolean | null
          is_approved?: boolean | null
          name: string
          name_ar?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          is_active?: boolean | null
          is_approved?: boolean | null
          name?: string
          name_ar?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      sponsorship_packages: {
        Row: {
          benefits: Json | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string | null
          description_ar: string | null
          id: string
          is_active: boolean | null
          logo_on_certificates: boolean | null
          logo_placement: string | null
          max_sponsors: number | null
          name: string
          name_ar: string | null
          price: number | null
          sort_order: number | null
          tier: Database["public"]["Enums"]["sponsorship_tier"]
          updated_at: string | null
        }
        Insert: {
          benefits?: Json | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          is_active?: boolean | null
          logo_on_certificates?: boolean | null
          logo_placement?: string | null
          max_sponsors?: number | null
          name: string
          name_ar?: string | null
          price?: number | null
          sort_order?: number | null
          tier: Database["public"]["Enums"]["sponsorship_tier"]
          updated_at?: string | null
        }
        Update: {
          benefits?: Json | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          is_active?: boolean | null
          logo_on_certificates?: boolean | null
          logo_placement?: string | null
          max_sponsors?: number | null
          name?: string
          name_ar?: string | null
          price?: number | null
          sort_order?: number | null
          tier?: Database["public"]["Enums"]["sponsorship_tier"]
          updated_at?: string | null
        }
        Relationships: []
      }
      stage_scores: {
        Row: {
          evidence_urls: string[] | null
          id: string
          judge_id: string
          max_score: number
          notes: string | null
          notes_ar: string | null
          registration_id: string
          score: number
          scored_at: string | null
          stage_id: string
        }
        Insert: {
          evidence_urls?: string[] | null
          id?: string
          judge_id: string
          max_score?: number
          notes?: string | null
          notes_ar?: string | null
          registration_id: string
          score?: number
          scored_at?: string | null
          stage_id: string
        }
        Update: {
          evidence_urls?: string[] | null
          id?: string
          judge_id?: string
          max_score?: number
          notes?: string | null
          notes_ar?: string | null
          registration_id?: string
          score?: number
          scored_at?: string | null
          stage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stage_scores_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "competition_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stage_scores_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "evaluation_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      story_views: {
        Row: {
          id: string
          story_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          id?: string
          story_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          id?: string
          story_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "community_stories"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_profile_views: {
        Row: {
          company_id: string
          id: string
          referrer: string | null
          session_id: string | null
          viewed_at: string
          viewer_id: string | null
        }
        Insert: {
          company_id: string
          id?: string
          referrer?: string | null
          session_id?: string | null
          viewed_at?: string
          viewer_id?: string | null
        }
        Update: {
          company_id?: string
          id?: string
          referrer?: string | null
          session_id?: string | null
          viewed_at?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_profile_views_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_reviews: {
        Row: {
          comment: string | null
          company_id: string
          created_at: string
          id: string
          is_verified_purchase: boolean | null
          rating: number
          status: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          company_id: string
          created_at?: string
          id?: string
          is_verified_purchase?: boolean | null
          rating: number
          status?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          company_id?: string
          created_at?: string
          id?: string
          is_verified_purchase?: boolean | null
          rating?: number
          status?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_wishlists: {
        Row: {
          company_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_wishlists_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_messages: {
        Row: {
          attachments: string[] | null
          created_at: string
          id: string
          is_internal_note: boolean | null
          message: string
          message_ar: string | null
          sender_id: string
          ticket_id: string
        }
        Insert: {
          attachments?: string[] | null
          created_at?: string
          id?: string
          is_internal_note?: boolean | null
          message: string
          message_ar?: string | null
          sender_id: string
          ticket_id: string
        }
        Update: {
          attachments?: string[] | null
          created_at?: string
          id?: string
          is_internal_note?: boolean | null
          message?: string
          message_ar?: string | null
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          closed_at: string | null
          created_at: string
          description: string
          description_ar: string | null
          id: string
          priority: string
          resolved_at: string | null
          status: string
          subject: string
          subject_ar: string | null
          tags: string[] | null
          ticket_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          closed_at?: string | null
          created_at?: string
          description: string
          description_ar?: string | null
          id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject: string
          subject_ar?: string | null
          tags?: string[] | null
          ticket_number?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          closed_at?: string | null
          created_at?: string
          description?: string
          description_ar?: string | null
          id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          subject_ar?: string | null
          tags?: string[] | null
          ticket_number?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasting_criteria: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          description_ar: string | null
          eval_scale: string | null
          guidelines: string | null
          guidelines_ar: string | null
          id: string
          is_required: boolean | null
          max_score: number | null
          name: string
          name_ar: string | null
          reference_images: string[] | null
          session_id: string
          sort_order: number | null
          stage: string | null
          weight: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          eval_scale?: string | null
          guidelines?: string | null
          guidelines_ar?: string | null
          id?: string
          is_required?: boolean | null
          max_score?: number | null
          name: string
          name_ar?: string | null
          reference_images?: string[] | null
          session_id: string
          sort_order?: number | null
          stage?: string | null
          weight?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          eval_scale?: string | null
          guidelines?: string | null
          guidelines_ar?: string | null
          id?: string
          is_required?: boolean | null
          max_score?: number | null
          name?: string
          name_ar?: string | null
          reference_images?: string[] | null
          session_id?: string
          sort_order?: number | null
          stage?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tasting_criteria_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "tasting_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      tasting_criteria_presets: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          criteria: Json
          id: string
          is_system: boolean | null
          preset_name: string
          preset_name_ar: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          criteria?: Json
          id?: string
          is_system?: boolean | null
          preset_name: string
          preset_name_ar?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          criteria?: Json
          id?: string
          is_system?: boolean | null
          preset_name?: string
          preset_name_ar?: string | null
        }
        Relationships: []
      }
      tasting_entries: {
        Row: {
          category: string | null
          chef_id: string | null
          chef_name: string | null
          chef_name_ar: string | null
          created_at: string
          description: string | null
          description_ar: string | null
          dish_name: string
          dish_name_ar: string | null
          entry_number: number
          id: string
          images: string[] | null
          is_active: boolean | null
          photo_url: string | null
          session_id: string
          sort_order: number | null
          stage: string | null
        }
        Insert: {
          category?: string | null
          chef_id?: string | null
          chef_name?: string | null
          chef_name_ar?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          dish_name: string
          dish_name_ar?: string | null
          entry_number: number
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          photo_url?: string | null
          session_id: string
          sort_order?: number | null
          stage?: string | null
        }
        Update: {
          category?: string | null
          chef_id?: string | null
          chef_name?: string | null
          chef_name_ar?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          dish_name?: string
          dish_name_ar?: string | null
          entry_number?: number
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          photo_url?: string | null
          session_id?: string
          sort_order?: number | null
          stage?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasting_entries_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "tasting_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      tasting_judges: {
        Row: {
          assigned_at: string
          completed_at: string | null
          has_completed: boolean | null
          id: string
          judge_id: string
          session_id: string
        }
        Insert: {
          assigned_at?: string
          completed_at?: string | null
          has_completed?: boolean | null
          id?: string
          judge_id: string
          session_id: string
        }
        Update: {
          assigned_at?: string
          completed_at?: string | null
          has_completed?: boolean | null
          id?: string
          judge_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasting_judges_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "tasting_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      tasting_score_images: {
        Row: {
          caption: string | null
          caption_ar: string | null
          created_at: string
          id: string
          image_url: string
          score_id: string
          sort_order: number | null
          stage: string | null
        }
        Insert: {
          caption?: string | null
          caption_ar?: string | null
          created_at?: string
          id?: string
          image_url: string
          score_id: string
          sort_order?: number | null
          stage?: string | null
        }
        Update: {
          caption?: string | null
          caption_ar?: string | null
          created_at?: string
          id?: string
          image_url?: string
          score_id?: string
          sort_order?: number | null
          stage?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasting_score_images_score_id_fkey"
            columns: ["score_id"]
            isOneToOne: false
            referencedRelation: "tasting_scores"
            referencedColumns: ["id"]
          },
        ]
      }
      tasting_scores: {
        Row: {
          created_at: string
          criterion_id: string
          entry_id: string
          id: string
          image_url: string | null
          judge_id: string
          note: string | null
          note_ar: string | null
          passed: boolean | null
          score: number | null
          session_id: string
          stars: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          criterion_id: string
          entry_id: string
          id?: string
          image_url?: string | null
          judge_id: string
          note?: string | null
          note_ar?: string | null
          passed?: boolean | null
          score?: number | null
          session_id: string
          stars?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          criterion_id?: string
          entry_id?: string
          id?: string
          image_url?: string | null
          judge_id?: string
          note?: string | null
          note_ar?: string | null
          passed?: boolean | null
          score?: number | null
          session_id?: string
          stars?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasting_scores_criterion_id_fkey"
            columns: ["criterion_id"]
            isOneToOne: false
            referencedRelation: "tasting_criteria"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasting_scores_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "tasting_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasting_scores_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "tasting_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      tasting_sessions: {
        Row: {
          allow_notes: boolean | null
          city: string | null
          competition_id: string | null
          country: string | null
          country_code: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          description_ar: string | null
          eval_method: Database["public"]["Enums"]["tasting_eval_method"]
          evaluation_category: string | null
          evaluation_type: string | null
          id: string
          is_blind_tasting: boolean | null
          max_score: number | null
          notes: string | null
          organizer_id: string
          round: string | null
          session_date: string | null
          session_end: string | null
          status: Database["public"]["Enums"]["tasting_session_status"]
          title: string
          title_ar: string | null
          updated_at: string
          venue: string | null
          venue_ar: string | null
        }
        Insert: {
          allow_notes?: boolean | null
          city?: string | null
          competition_id?: string | null
          country?: string | null
          country_code?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          eval_method?: Database["public"]["Enums"]["tasting_eval_method"]
          evaluation_category?: string | null
          evaluation_type?: string | null
          id?: string
          is_blind_tasting?: boolean | null
          max_score?: number | null
          notes?: string | null
          organizer_id: string
          round?: string | null
          session_date?: string | null
          session_end?: string | null
          status?: Database["public"]["Enums"]["tasting_session_status"]
          title: string
          title_ar?: string | null
          updated_at?: string
          venue?: string | null
          venue_ar?: string | null
        }
        Update: {
          allow_notes?: boolean | null
          city?: string | null
          competition_id?: string | null
          country?: string | null
          country_code?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          eval_method?: Database["public"]["Enums"]["tasting_eval_method"]
          evaluation_category?: string | null
          evaluation_type?: string | null
          id?: string
          is_blind_tasting?: boolean | null
          max_score?: number | null
          notes?: string | null
          organizer_id?: string
          round?: string | null
          session_date?: string | null
          session_end?: string | null
          status?: Database["public"]["Enums"]["tasting_session_status"]
          title?: string
          title_ar?: string | null
          updated_at?: string
          venue?: string | null
          venue_ar?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasting_sessions_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasting_sessions_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions_public"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_reports: {
        Row: {
          company_id: string | null
          created_at: string
          currency: string
          data_snapshot: Json | null
          generated_by: string | null
          id: string
          notes: string | null
          notes_ar: string | null
          period_end: string
          period_start: string
          report_type: string
          status: string
          tax_amount: number
          tax_rate: number
          taxable_amount: number
          total_expenses: number
          total_revenue: number
          updated_at: string
          user_id: string | null
          zakat_amount: number | null
          zakat_base: number | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          currency?: string
          data_snapshot?: Json | null
          generated_by?: string | null
          id?: string
          notes?: string | null
          notes_ar?: string | null
          period_end: string
          period_start: string
          report_type: string
          status?: string
          tax_amount?: number
          tax_rate?: number
          taxable_amount?: number
          total_expenses?: number
          total_revenue?: number
          updated_at?: string
          user_id?: string | null
          zakat_amount?: number | null
          zakat_base?: number | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          currency?: string
          data_snapshot?: Json | null
          generated_by?: string | null
          id?: string
          notes?: string | null
          notes_ar?: string | null
          period_end?: string
          period_start?: string
          report_type?: string
          status?: string
          tax_amount?: number
          tax_rate?: number
          taxable_amount?: number
          total_expenses?: number
          total_revenue?: number
          updated_at?: string
          user_id?: string | null
          zakat_amount?: number | null
          zakat_base?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      team_workspaces: {
        Row: {
          competition_id: string
          created_at: string | null
          id: string
          name: string
          name_ar: string | null
          practice_schedule: Json | null
          recipe_plan: Json | null
          registration_id: string
          task_board: Json | null
          updated_at: string | null
        }
        Insert: {
          competition_id: string
          created_at?: string | null
          id?: string
          name: string
          name_ar?: string | null
          practice_schedule?: Json | null
          recipe_plan?: Json | null
          registration_id: string
          task_board?: Json | null
          updated_at?: string | null
        }
        Update: {
          competition_id?: string
          created_at?: string | null
          id?: string
          name?: string
          name_ar?: string | null
          practice_schedule?: Json | null
          recipe_plan?: Json | null
          registration_id?: string
          task_board?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_workspaces_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_workspaces_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_workspaces_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "competition_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      translation_keys: {
        Row: {
          ar: string
          auto_translated: boolean
          context: string | null
          created_at: string
          en: string
          id: string
          is_verified: boolean
          key: string
          namespace: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          ar?: string
          auto_translated?: boolean
          context?: string | null
          created_at?: string
          en?: string
          id?: string
          is_verified?: boolean
          key: string
          namespace?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          ar?: string
          auto_translated?: boolean
          context?: string | null
          created_at?: string
          en?: string
          id?: string
          is_verified?: boolean
          key?: string
          namespace?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      user_affiliations: {
        Row: {
          affiliation_type: string
          company_id: string | null
          created_at: string
          department: string | null
          department_ar: string | null
          end_date: string | null
          establishment_id: string | null
          id: string
          is_current: boolean | null
          is_verified: boolean | null
          role_in_org: string | null
          role_in_org_ar: string | null
          start_date: string | null
          updated_at: string
          user_id: string
          verified_by: string | null
        }
        Insert: {
          affiliation_type: string
          company_id?: string | null
          created_at?: string
          department?: string | null
          department_ar?: string | null
          end_date?: string | null
          establishment_id?: string | null
          id?: string
          is_current?: boolean | null
          is_verified?: boolean | null
          role_in_org?: string | null
          role_in_org_ar?: string | null
          start_date?: string | null
          updated_at?: string
          user_id: string
          verified_by?: string | null
        }
        Update: {
          affiliation_type?: string
          company_id?: string | null
          created_at?: string
          department?: string | null
          department_ar?: string | null
          end_date?: string | null
          establishment_id?: string | null
          id?: string
          is_current?: boolean | null
          is_verified?: boolean | null
          role_in_org?: string | null
          role_in_org_ar?: string | null
          start_date?: string | null
          updated_at?: string
          user_id?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_affiliations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_affiliations_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          certificate_id: string | null
          competition_id: string | null
          earned_at: string | null
          id: string
          is_public: boolean | null
          share_token: string | null
          user_id: string
        }
        Insert: {
          badge_id: string
          certificate_id?: string | null
          competition_id?: string | null
          earned_at?: string | null
          id?: string
          is_public?: boolean | null
          share_token?: string | null
          user_id: string
        }
        Update: {
          badge_id?: string
          certificate_id?: string | null
          competition_id?: string | null
          earned_at?: string | null
          id?: string
          is_public?: boolean | null
          share_token?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "digital_badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "certificates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_career_records: {
        Row: {
          created_at: string
          department: string | null
          department_ar: string | null
          description: string | null
          description_ar: string | null
          education_level: string | null
          employment_type: string | null
          end_date: string | null
          entity_id: string | null
          entity_name: string | null
          field_of_study: string | null
          field_of_study_ar: string | null
          grade: string | null
          id: string
          is_current: boolean
          location: string | null
          record_type: string
          sort_order: number | null
          start_date: string | null
          title: string
          title_ar: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          department_ar?: string | null
          description?: string | null
          description_ar?: string | null
          education_level?: string | null
          employment_type?: string | null
          end_date?: string | null
          entity_id?: string | null
          entity_name?: string | null
          field_of_study?: string | null
          field_of_study_ar?: string | null
          grade?: string | null
          id?: string
          is_current?: boolean
          location?: string | null
          record_type: string
          sort_order?: number | null
          start_date?: string | null
          title: string
          title_ar?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string | null
          department_ar?: string | null
          description?: string | null
          description_ar?: string | null
          education_level?: string | null
          employment_type?: string | null
          end_date?: string | null
          entity_id?: string | null
          entity_name?: string | null
          field_of_study?: string | null
          field_of_study_ar?: string | null
          grade?: string | null
          id?: string
          is_current?: boolean
          location?: string | null
          record_type?: string
          sort_order?: number | null
          start_date?: string | null
          title?: string
          title_ar?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_career_records_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "culinary_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_engagement_scores: {
        Row: {
          activity_score: number | null
          calculated_at: string | null
          churn_risk: string | null
          content_score: number | null
          created_at: string
          engagement_score: number | null
          engagement_tier: string | null
          id: string
          last_active_at: string | null
          purchase_score: number | null
          social_score: number | null
          total_actions: number | null
          total_page_views: number | null
          total_sessions: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_score?: number | null
          calculated_at?: string | null
          churn_risk?: string | null
          content_score?: number | null
          created_at?: string
          engagement_score?: number | null
          engagement_tier?: string | null
          id?: string
          last_active_at?: string | null
          purchase_score?: number | null
          social_score?: number | null
          total_actions?: number | null
          total_page_views?: number | null
          total_sessions?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_score?: number | null
          calculated_at?: string | null
          churn_risk?: string | null
          content_score?: number | null
          created_at?: string
          engagement_score?: number | null
          engagement_tier?: string | null
          id?: string
          last_active_at?: string | null
          purchase_score?: number | null
          social_score?: number | null
          total_actions?: number | null
          total_page_views?: number | null
          total_sessions?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_global_awards: {
        Row: {
          award_id: string
          created_at: string | null
          id: string
          is_public: boolean | null
          level: string | null
          user_id: string
          year_awarded: number | null
        }
        Insert: {
          award_id: string
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          level?: string | null
          user_id: string
          year_awarded?: number | null
        }
        Update: {
          award_id?: string
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          level?: string | null
          user_id?: string
          year_awarded?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_global_awards_award_id_fkey"
            columns: ["award_id"]
            isOneToOne: false
            referencedRelation: "global_awards_system"
            referencedColumns: ["id"]
          },
        ]
      }
      user_milestone_achievements: {
        Row: {
          achieved_at: string
          id: string
          milestone_id: string
          reward_claimed: boolean
          reward_claimed_at: string | null
          user_id: string
        }
        Insert: {
          achieved_at?: string
          id?: string
          milestone_id: string
          reward_claimed?: boolean
          reward_claimed_at?: string | null
          user_id: string
        }
        Update: {
          achieved_at?: string
          id?: string
          milestone_id?: string
          reward_claimed?: boolean
          reward_claimed_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_milestone_achievements_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "referral_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permission_overrides: {
        Row: {
          created_at: string
          expires_at: string | null
          granted: boolean
          granted_by: string | null
          id: string
          permission_id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          granted?: boolean
          granted_by?: string | null
          id?: string
          permission_id: string
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          granted?: boolean
          granted_by?: string | null
          id?: string
          permission_id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permission_overrides_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_specialties: {
        Row: {
          created_at: string
          id: string
          specialty_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          specialty_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          specialty_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_specialties_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      user_titles: {
        Row: {
          created_at: string
          establishment_id: string | null
          expiry_date: string | null
          id: string
          is_verified: boolean | null
          issued_date: string | null
          issuing_body: string | null
          issuing_body_ar: string | null
          sort_order: number | null
          title: string
          title_ar: string | null
          title_type: string
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          establishment_id?: string | null
          expiry_date?: string | null
          id?: string
          is_verified?: boolean | null
          issued_date?: string | null
          issuing_body?: string | null
          issuing_body_ar?: string | null
          sort_order?: number | null
          title: string
          title_ar?: string | null
          title_type: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          establishment_id?: string | null
          expiry_date?: string | null
          id?: string
          is_verified?: boolean | null
          issued_date?: string | null
          issuing_body?: string | null
          issuing_body_ar?: string | null
          sort_order?: number | null
          title?: string
          title_ar?: string | null
          title_type?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_titles_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_wallets: {
        Row: {
          balance: number
          company_id: string | null
          created_at: string
          currency: string
          id: string
          points_balance: number
          status: string
          updated_at: string
          user_id: string | null
          wallet_number: string
        }
        Insert: {
          balance?: number
          company_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          points_balance?: number
          status?: string
          updated_at?: string
          user_id?: string | null
          wallet_number: string
        }
        Update: {
          balance?: number
          company_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          points_balance?: number
          status?: string
          updated_at?: string
          user_id?: string | null
          wallet_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_wallets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_audit_log: {
        Row: {
          action: string
          action_by: string | null
          action_by_system: boolean | null
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          request_id: string
        }
        Insert: {
          action: string
          action_by?: string | null
          action_by_system?: boolean | null
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          request_id: string
        }
        Update: {
          action?: string
          action_by?: string | null
          action_by_system?: boolean | null
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_audit_log_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "verification_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_documents: {
        Row: {
          ai_confidence: number | null
          ai_document_type_match: boolean | null
          ai_document_valid: boolean | null
          ai_extracted_data: Json | null
          ai_flags: string[] | null
          document_type: string
          file_name: string | null
          file_size: number | null
          file_url: string
          id: string
          manually_verified: boolean | null
          mime_type: string | null
          request_id: string
          uploaded_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          ai_confidence?: number | null
          ai_document_type_match?: boolean | null
          ai_document_valid?: boolean | null
          ai_extracted_data?: Json | null
          ai_flags?: string[] | null
          document_type: string
          file_name?: string | null
          file_size?: number | null
          file_url: string
          id?: string
          manually_verified?: boolean | null
          mime_type?: string | null
          request_id: string
          uploaded_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          ai_confidence?: number | null
          ai_document_type_match?: boolean | null
          ai_document_valid?: boolean | null
          ai_extracted_data?: Json | null
          ai_flags?: string[] | null
          document_type?: string
          file_name?: string | null
          file_size?: number | null
          file_url?: string
          id?: string
          manually_verified?: boolean | null
          mime_type?: string | null
          request_id?: string
          uploaded_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_documents_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "verification_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_requests: {
        Row: {
          ai_analysis: Json | null
          ai_flags: string[] | null
          ai_reviewed_at: string | null
          ai_risk_score: number | null
          applicant_name: string
          applicant_name_ar: string | null
          applicant_position: string | null
          applicant_position_ar: string | null
          applicant_role: string | null
          company_id: string | null
          created_at: string
          culinary_entity_id: string | null
          documents: Json | null
          entity_type: string
          expires_at: string | null
          id: string
          ip_address: string | null
          rejection_reason: string | null
          rejection_reason_ar: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          reviewer_notes_ar: string | null
          revoked_at: string | null
          revoked_by: string | null
          revoked_reason: string | null
          status: string
          submission_metadata: Json | null
          updated_at: string
          user_agent: string | null
          user_id: string | null
          verification_level: string
        }
        Insert: {
          ai_analysis?: Json | null
          ai_flags?: string[] | null
          ai_reviewed_at?: string | null
          ai_risk_score?: number | null
          applicant_name: string
          applicant_name_ar?: string | null
          applicant_position?: string | null
          applicant_position_ar?: string | null
          applicant_role?: string | null
          company_id?: string | null
          created_at?: string
          culinary_entity_id?: string | null
          documents?: Json | null
          entity_type: string
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          rejection_reason?: string | null
          rejection_reason_ar?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          reviewer_notes_ar?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          revoked_reason?: string | null
          status?: string
          submission_metadata?: Json | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
          verification_level?: string
        }
        Update: {
          ai_analysis?: Json | null
          ai_flags?: string[] | null
          ai_reviewed_at?: string | null
          ai_risk_score?: number | null
          applicant_name?: string
          applicant_name_ar?: string | null
          applicant_position?: string | null
          applicant_position_ar?: string | null
          applicant_role?: string | null
          company_id?: string | null
          created_at?: string
          culinary_entity_id?: string | null
          documents?: Json | null
          entity_type?: string
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          rejection_reason?: string | null
          rejection_reason_ar?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          reviewer_notes_ar?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          revoked_reason?: string | null
          status?: string
          submission_metadata?: Json | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
          verification_level?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_requests_culinary_entity_id_fkey"
            columns: ["culinary_entity_id"]
            isOneToOne: false
            referencedRelation: "culinary_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          description_ar: string | null
          id: string
          payment_method: string | null
          payment_reference: string | null
          points: number | null
          reference_id: string | null
          reference_type: string | null
          status: string
          transaction_number: string
          type: string
          wallet_id: string
        }
        Insert: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          payment_method?: string | null
          payment_reference?: string | null
          points?: number | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          transaction_number: string
          type: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          payment_method?: string | null
          payment_reference?: string | null
          points?: number | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          transaction_number?: string
          type?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "user_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      competitions_public: {
        Row: {
          city: string | null
          competition_end: string | null
          competition_number: string | null
          competition_start: string | null
          country_code: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          description_ar: string | null
          edition_year: number | null
          exhibition_id: string | null
          id: string | null
          is_virtual: boolean | null
          max_participants: number | null
          registration_end: string | null
          registration_start: string | null
          series_id: string | null
          status: Database["public"]["Enums"]["competition_status"] | null
          title: string | null
          title_ar: string | null
          updated_at: string | null
          venue: string | null
          venue_ar: string | null
        }
        Insert: {
          city?: string | null
          competition_end?: string | null
          competition_number?: string | null
          competition_start?: string | null
          country_code?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          edition_year?: number | null
          exhibition_id?: string | null
          id?: string | null
          is_virtual?: boolean | null
          max_participants?: number | null
          registration_end?: string | null
          registration_start?: string | null
          series_id?: string | null
          status?: Database["public"]["Enums"]["competition_status"] | null
          title?: string | null
          title_ar?: string | null
          updated_at?: string | null
          venue?: string | null
          venue_ar?: string | null
        }
        Update: {
          city?: string | null
          competition_end?: string | null
          competition_number?: string | null
          competition_start?: string | null
          country_code?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          edition_year?: number | null
          exhibition_id?: string | null
          id?: string | null
          is_virtual?: boolean | null
          max_participants?: number | null
          registration_end?: string | null
          registration_start?: string | null
          series_id?: string | null
          status?: Database["public"]["Enums"]["competition_status"] | null
          title?: string | null
          title_ar?: string | null
          updated_at?: string | null
          venue?: string | null
          venue_ar?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitions_exhibition_id_fkey"
            columns: ["exhibition_id"]
            isOneToOne: false
            referencedRelation: "exhibitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitions_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "competition_series"
            referencedColumns: ["id"]
          },
        ]
      }
      judge_profiles_public: {
        Row: {
          certifications: string[] | null
          country_of_residence: string | null
          created_at: string | null
          culinary_specialties: string[] | null
          current_employer: string | null
          current_position: string | null
          education: string | null
          education_ar: string | null
          id: string | null
          judge_category: string | null
          judge_level: string | null
          judge_title: string | null
          judge_title_ar: string | null
          languages_spoken: string[] | null
          nationality: string | null
          profile_photo_url: string | null
          user_id: string | null
          years_of_experience: number | null
        }
        Insert: {
          certifications?: string[] | null
          country_of_residence?: string | null
          created_at?: string | null
          culinary_specialties?: string[] | null
          current_employer?: string | null
          current_position?: string | null
          education?: string | null
          education_ar?: string | null
          id?: string | null
          judge_category?: string | null
          judge_level?: string | null
          judge_title?: string | null
          judge_title_ar?: string | null
          languages_spoken?: string[] | null
          nationality?: string | null
          profile_photo_url?: string | null
          user_id?: string | null
          years_of_experience?: number | null
        }
        Update: {
          certifications?: string[] | null
          country_of_residence?: string | null
          created_at?: string | null
          culinary_specialties?: string[] | null
          current_employer?: string | null
          current_position?: string | null
          education?: string | null
          education_ar?: string | null
          id?: string | null
          judge_category?: string | null
          judge_level?: string | null
          judge_title?: string | null
          judge_title_ar?: string | null
          languages_spoken?: string[] | null
          nationality?: string | null
          profile_photo_url?: string | null
          user_id?: string | null
          years_of_experience?: number | null
        }
        Relationships: []
      }
      profiles_public: {
        Row: {
          account_number: string | null
          account_status: Database["public"]["Enums"]["account_status"] | null
          avatar_url: string | null
          bio: string | null
          bio_ar: string | null
          city: string | null
          company_id: string | null
          company_role: string | null
          country_code: string | null
          cover_image_url: string | null
          created_at: string | null
          display_name: string | null
          display_name_ar: string | null
          education_entity_id: string | null
          education_institution: string | null
          education_level: string | null
          experience_level:
            | Database["public"]["Enums"]["experience_level"]
            | null
          facebook: string | null
          follow_privacy: string | null
          full_name: string | null
          full_name_ar: string | null
          gender: string | null
          global_awards: Json | null
          id: string | null
          instagram: string | null
          is_verified: boolean | null
          job_title: string | null
          job_title_ar: string | null
          linkedin: string | null
          location: string | null
          membership_expires_at: string | null
          membership_status:
            | Database["public"]["Enums"]["membership_status"]
            | null
          membership_tier: Database["public"]["Enums"]["membership_tier"] | null
          nationality: string | null
          offers_services: boolean | null
          preferred_language: string | null
          profile_completed: boolean | null
          profile_visibility: string | null
          second_nationality: string | null
          section_visibility: Json | null
          services_description: string | null
          services_description_ar: string | null
          show_nationality: boolean | null
          snapchat: string | null
          specialization: string | null
          specialization_ar: string | null
          tiktok: string | null
          twitter: string | null
          updated_at: string | null
          user_id: string | null
          username: string | null
          verification_badge: string | null
          verification_level: string | null
          verified_at: string | null
          view_count: number | null
          website: string | null
          years_of_experience: number | null
          youtube: string | null
        }
        Insert: {
          account_number?: string | null
          account_status?: Database["public"]["Enums"]["account_status"] | null
          avatar_url?: string | null
          bio?: string | null
          bio_ar?: string | null
          city?: string | null
          company_id?: string | null
          company_role?: string | null
          country_code?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          display_name?: string | null
          display_name_ar?: string | null
          education_entity_id?: string | null
          education_institution?: string | null
          education_level?: string | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          facebook?: string | null
          follow_privacy?: string | null
          full_name?: string | null
          full_name_ar?: string | null
          gender?: string | null
          global_awards?: Json | null
          id?: string | null
          instagram?: string | null
          is_verified?: boolean | null
          job_title?: string | null
          job_title_ar?: string | null
          linkedin?: string | null
          location?: string | null
          membership_expires_at?: string | null
          membership_status?:
            | Database["public"]["Enums"]["membership_status"]
            | null
          membership_tier?:
            | Database["public"]["Enums"]["membership_tier"]
            | null
          nationality?: string | null
          offers_services?: boolean | null
          preferred_language?: string | null
          profile_completed?: boolean | null
          profile_visibility?: string | null
          second_nationality?: string | null
          section_visibility?: Json | null
          services_description?: string | null
          services_description_ar?: string | null
          show_nationality?: boolean | null
          snapchat?: string | null
          specialization?: string | null
          specialization_ar?: string | null
          tiktok?: string | null
          twitter?: string | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
          verification_badge?: string | null
          verification_level?: string | null
          verified_at?: string | null
          view_count?: number | null
          website?: string | null
          years_of_experience?: number | null
          youtube?: string | null
        }
        Update: {
          account_number?: string | null
          account_status?: Database["public"]["Enums"]["account_status"] | null
          avatar_url?: string | null
          bio?: string | null
          bio_ar?: string | null
          city?: string | null
          company_id?: string | null
          company_role?: string | null
          country_code?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          display_name?: string | null
          display_name_ar?: string | null
          education_entity_id?: string | null
          education_institution?: string | null
          education_level?: string | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          facebook?: string | null
          follow_privacy?: string | null
          full_name?: string | null
          full_name_ar?: string | null
          gender?: string | null
          global_awards?: Json | null
          id?: string | null
          instagram?: string | null
          is_verified?: boolean | null
          job_title?: string | null
          job_title_ar?: string | null
          linkedin?: string | null
          location?: string | null
          membership_expires_at?: string | null
          membership_status?:
            | Database["public"]["Enums"]["membership_status"]
            | null
          membership_tier?:
            | Database["public"]["Enums"]["membership_tier"]
            | null
          nationality?: string | null
          offers_services?: boolean | null
          preferred_language?: string | null
          profile_completed?: boolean | null
          profile_visibility?: string | null
          second_nationality?: string | null
          section_visibility?: Json | null
          services_description?: string | null
          services_description_ar?: string | null
          show_nationality?: boolean | null
          snapchat?: string | null
          specialization?: string | null
          specialization_ar?: string | null
          tiktok?: string | null
          twitter?: string | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
          verification_badge?: string | null
          verification_level?: string | null
          verified_at?: string | null
          view_count?: number | null
          website?: string | null
          years_of_experience?: number | null
          youtube?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_education_entity_id_fkey"
            columns: ["education_entity_id"]
            isOneToOne: false
            referencedRelation: "culinary_entities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      approve_chefs_table_request: {
        Args: { p_admin_notes?: string; p_request_id: string }
        Returns: string
      }
      award_points: {
        Args: {
          p_action_type: string
          p_description?: string
          p_description_ar?: string
          p_points: number
          p_reference_id?: string
          p_reference_type?: string
          p_user_id: string
        }
        Returns: number
      }
      check_email_exists: { Args: { p_email: string }; Returns: boolean }
      check_phone_exists: { Args: { p_phone: string }; Returns: boolean }
      generate_account_number: {
        Args: { p_role: Database["public"]["Enums"]["app_role"] }
        Returns: string
      }
      generate_certificate_number: { Args: never; Returns: string }
      generate_company_number: {
        Args: {
          p_company_type: Database["public"]["Enums"]["company_type"]
          p_country_code: string
        }
        Returns: string
      }
      generate_competition_number: {
        Args: { p_country_code: string; p_year: number }
        Returns: string
      }
      generate_cost_estimate_number: { Args: never; Returns: string }
      generate_entity_number: { Args: never; Returns: string }
      generate_exhibition_ticket_number: { Args: never; Returns: string }
      generate_invoice_number: { Args: never; Returns: string }
      generate_membership_number: { Args: never; Returns: string }
      generate_membership_verification: { Args: never; Returns: string }
      generate_order_number: { Args: never; Returns: string }
      generate_qr_code: { Args: { p_prefix?: string }; Returns: string }
      generate_referral_code: { Args: never; Returns: string }
      generate_registration_number: { Args: never; Returns: string }
      generate_report_token: { Args: never; Returns: string }
      generate_shop_order_number: { Args: never; Returns: string }
      generate_statement_number: { Args: never; Returns: string }
      generate_ticket_number: { Args: never; Returns: string }
      generate_transaction_number: { Args: never; Returns: string }
      generate_verification_code: { Args: never; Returns: string }
      generate_wallet_number: { Args: never; Returns: string }
      generate_wallet_txn_number: { Args: never; Returns: string }
      get_company_balance: { Args: { p_company_id: string }; Returns: number }
      get_profile_safe: { Args: { p_profile_user_id: string }; Returns: Json }
      get_user_by_phone: {
        Args: { p_phone: string }
        Returns: {
          email: string
          user_id: string
        }[]
      }
      get_user_chat_group_ids: {
        Args: { p_user_id: string }
        Returns: string[]
      }
      get_user_company_id: { Args: { p_user_id: string }; Returns: string[] }
      get_user_competition_role: {
        Args: { p_competition_id: string; p_user_id: string }
        Returns: string[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { p_user_id: string }; Returns: boolean }
      is_admin_user: { Args: never; Returns: boolean }
      is_free_preview: { Args: { p_module_id: string }; Returns: boolean }
      notify_upcoming_exhibitions: { Args: never; Returns: undefined }
      reject_chefs_table_request: {
        Args: { p_rejection_reason: string; p_request_id: string }
        Returns: undefined
      }
      user_has_permission: {
        Args: { p_permission_code: string; p_user_id: string }
        Returns: boolean
      }
      validate_username: { Args: { p_username: string }; Returns: boolean }
      verify_certificate: {
        Args: { p_code: string }
        Returns: {
          achievement: string
          achievement_ar: string
          certificate_number: string
          event_date: string
          event_location: string
          event_location_ar: string
          event_name: string
          event_name_ar: string
          id: string
          issued_at: string
          logos: Json
          recipient_name: string
          recipient_name_ar: string
          signatures: Json
          status: string
          type: string
          verification_code: string
        }[]
      }
      verify_qr_code: {
        Args: { p_code: string }
        Returns: {
          category: string
          code: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          is_active: boolean
          metadata: Json
          scan_count: number
        }[]
      }
    }
    Enums: {
      account_status: "pending" | "active" | "suspended" | "banned"
      app_role:
        | "chef"
        | "judge"
        | "student"
        | "organizer"
        | "volunteer"
        | "sponsor"
        | "assistant"
        | "supervisor"
      badge_type:
        | "gold_winner"
        | "silver_winner"
        | "bronze_winner"
        | "participant"
        | "judge"
        | "organizer"
        | "volunteer"
        | "sponsor"
        | "special"
      certificate_status:
        | "draft"
        | "pending_signature"
        | "signed"
        | "issued"
        | "revoked"
      certificate_type:
        | "participation"
        | "winner_gold"
        | "winner_silver"
        | "winner_bronze"
        | "appreciation"
        | "organizer"
        | "judge"
        | "sponsor"
        | "volunteer"
      company_contact_role: "owner" | "admin" | "manager" | "editor" | "viewer"
      company_status: "active" | "inactive" | "pending" | "suspended"
      company_type: "sponsor" | "supplier" | "partner" | "vendor"
      competition_status:
        | "pending"
        | "draft"
        | "upcoming"
        | "registration_open"
        | "registration_closed"
        | "in_progress"
        | "judging"
        | "completed"
        | "cancelled"
      cost_estimate_status:
        | "draft"
        | "pending_approval"
        | "approved"
        | "rejected"
        | "invoiced"
        | "cancelled"
      cost_item_category:
        | "personnel"
        | "equipment"
        | "venue"
        | "travel"
        | "accommodation"
        | "catering"
        | "materials"
        | "logistics"
        | "marketing"
        | "insurance"
        | "permits"
        | "miscellaneous"
      cost_module_type:
        | "competition"
        | "chefs_table"
        | "exhibition"
        | "event"
        | "project"
        | "other"
      entity_scope: "local" | "national" | "regional" | "international"
      entity_status: "pending" | "active" | "suspended" | "archived"
      entity_type:
        | "culinary_association"
        | "government_entity"
        | "private_association"
        | "culinary_academy"
        | "industry_body"
        | "university"
        | "college"
        | "training_center"
      exhibition_status:
        | "pending"
        | "draft"
        | "upcoming"
        | "active"
        | "completed"
        | "cancelled"
      exhibition_type:
        | "exhibition"
        | "conference"
        | "summit"
        | "workshop"
        | "food_festival"
        | "trade_show"
        | "competition_event"
      experience_level: "beginner" | "amateur" | "professional"
      invitation_status: "pending" | "accepted" | "declined" | "expired"
      membership_status: "active" | "expired" | "suspended" | "cancelled"
      membership_tier: "basic" | "professional" | "enterprise"
      notification_channel: "in_app" | "email" | "sms" | "whatsapp" | "push"
      notification_status: "pending" | "sent" | "delivered" | "failed" | "read"
      order_category:
        | "promotional"
        | "equipment"
        | "materials"
        | "services"
        | "catering"
        | "venue"
        | "transport"
        | "other"
      order_direction: "outgoing" | "incoming"
      order_status:
        | "draft"
        | "pending"
        | "approved"
        | "rejected"
        | "in_progress"
        | "completed"
        | "cancelled"
      shop_order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
      shop_product_type: "physical" | "digital" | "service"
      sponsorship_tier: "platinum" | "gold" | "silver" | "bronze" | "custom"
      tasting_eval_method: "numeric" | "stars" | "pass_fail"
      tasting_session_status:
        | "draft"
        | "open"
        | "in_progress"
        | "completed"
        | "cancelled"
      transaction_type:
        | "invoice"
        | "payment"
        | "credit"
        | "debit"
        | "refund"
        | "adjustment"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_status: ["pending", "active", "suspended", "banned"],
      app_role: [
        "chef",
        "judge",
        "student",
        "organizer",
        "volunteer",
        "sponsor",
        "assistant",
        "supervisor",
      ],
      badge_type: [
        "gold_winner",
        "silver_winner",
        "bronze_winner",
        "participant",
        "judge",
        "organizer",
        "volunteer",
        "sponsor",
        "special",
      ],
      certificate_status: [
        "draft",
        "pending_signature",
        "signed",
        "issued",
        "revoked",
      ],
      certificate_type: [
        "participation",
        "winner_gold",
        "winner_silver",
        "winner_bronze",
        "appreciation",
        "organizer",
        "judge",
        "sponsor",
        "volunteer",
      ],
      company_contact_role: ["owner", "admin", "manager", "editor", "viewer"],
      company_status: ["active", "inactive", "pending", "suspended"],
      company_type: ["sponsor", "supplier", "partner", "vendor"],
      competition_status: [
        "pending",
        "draft",
        "upcoming",
        "registration_open",
        "registration_closed",
        "in_progress",
        "judging",
        "completed",
        "cancelled",
      ],
      cost_estimate_status: [
        "draft",
        "pending_approval",
        "approved",
        "rejected",
        "invoiced",
        "cancelled",
      ],
      cost_item_category: [
        "personnel",
        "equipment",
        "venue",
        "travel",
        "accommodation",
        "catering",
        "materials",
        "logistics",
        "marketing",
        "insurance",
        "permits",
        "miscellaneous",
      ],
      cost_module_type: [
        "competition",
        "chefs_table",
        "exhibition",
        "event",
        "project",
        "other",
      ],
      entity_scope: ["local", "national", "regional", "international"],
      entity_status: ["pending", "active", "suspended", "archived"],
      entity_type: [
        "culinary_association",
        "government_entity",
        "private_association",
        "culinary_academy",
        "industry_body",
        "university",
        "college",
        "training_center",
      ],
      exhibition_status: [
        "pending",
        "draft",
        "upcoming",
        "active",
        "completed",
        "cancelled",
      ],
      exhibition_type: [
        "exhibition",
        "conference",
        "summit",
        "workshop",
        "food_festival",
        "trade_show",
        "competition_event",
      ],
      experience_level: ["beginner", "amateur", "professional"],
      invitation_status: ["pending", "accepted", "declined", "expired"],
      membership_status: ["active", "expired", "suspended", "cancelled"],
      membership_tier: ["basic", "professional", "enterprise"],
      notification_channel: ["in_app", "email", "sms", "whatsapp", "push"],
      notification_status: ["pending", "sent", "delivered", "failed", "read"],
      order_category: [
        "promotional",
        "equipment",
        "materials",
        "services",
        "catering",
        "venue",
        "transport",
        "other",
      ],
      order_direction: ["outgoing", "incoming"],
      order_status: [
        "draft",
        "pending",
        "approved",
        "rejected",
        "in_progress",
        "completed",
        "cancelled",
      ],
      shop_order_status: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      shop_product_type: ["physical", "digital", "service"],
      sponsorship_tier: ["platinum", "gold", "silver", "bronze", "custom"],
      tasting_eval_method: ["numeric", "stars", "pass_fail"],
      tasting_session_status: [
        "draft",
        "open",
        "in_progress",
        "completed",
        "cancelled",
      ],
      transaction_type: [
        "invoice",
        "payment",
        "credit",
        "debit",
        "refund",
        "adjustment",
      ],
    },
  },
} as const

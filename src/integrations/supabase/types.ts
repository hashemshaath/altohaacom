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
            foreignKeyName: "certificates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "certificate_templates"
            referencedColumns: ["id"]
          },
        ]
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
          email: string | null
          id: string
          logo_url: string | null
          name: string
          name_ar: string | null
          payment_terms: number | null
          phone: string | null
          postal_code: string | null
          registration_number: string | null
          status: Database["public"]["Enums"]["company_status"] | null
          tax_number: string | null
          type: Database["public"]["Enums"]["company_type"]
          updated_at: string | null
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
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          name_ar?: string | null
          payment_terms?: number | null
          phone?: string | null
          postal_code?: string | null
          registration_number?: string | null
          status?: Database["public"]["Enums"]["company_status"] | null
          tax_number?: string | null
          type: Database["public"]["Enums"]["company_type"]
          updated_at?: string | null
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
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          name_ar?: string | null
          payment_terms?: number | null
          phone?: string | null
          postal_code?: string | null
          registration_number?: string | null
          status?: Database["public"]["Enums"]["company_status"] | null
          tax_number?: string | null
          type?: Database["public"]["Enums"]["company_type"]
          updated_at?: string | null
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
        ]
      }
      company_contacts: {
        Row: {
          can_login: boolean | null
          company_id: string
          created_at: string | null
          department: string
          email: string | null
          id: string
          is_primary: boolean | null
          mobile: string | null
          name: string
          name_ar: string | null
          phone: string | null
          title: string | null
          title_ar: string | null
          updated_at: string | null
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          can_login?: boolean | null
          company_id: string
          created_at?: string | null
          department: string
          email?: string | null
          id?: string
          is_primary?: boolean | null
          mobile?: string | null
          name: string
          name_ar?: string | null
          phone?: string | null
          title?: string | null
          title_ar?: string | null
          updated_at?: string | null
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          can_login?: boolean | null
          company_id?: string
          created_at?: string | null
          department?: string
          email?: string | null
          id?: string
          is_primary?: boolean | null
          mobile?: string | null
          name?: string
          name_ar?: string | null
          phone?: string | null
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
      company_evaluations: {
        Row: {
          communication_rating: number | null
          company_id: string
          competition_id: string | null
          created_at: string | null
          delivery_rating: number | null
          evaluated_by: string | null
          id: string
          is_public: boolean | null
          order_id: string | null
          overall_rating: number | null
          quality_rating: number | null
          review: string | null
          review_ar: string | null
          value_rating: number | null
        }
        Insert: {
          communication_rating?: number | null
          company_id: string
          competition_id?: string | null
          created_at?: string | null
          delivery_rating?: number | null
          evaluated_by?: string | null
          id?: string
          is_public?: boolean | null
          order_id?: string | null
          overall_rating?: number | null
          quality_rating?: number | null
          review?: string | null
          review_ar?: string | null
          value_rating?: number | null
        }
        Update: {
          communication_rating?: number | null
          company_id?: string
          competition_id?: string | null
          created_at?: string | null
          delivery_rating?: number | null
          evaluated_by?: string | null
          id?: string
          is_public?: boolean | null
          order_id?: string | null
          overall_rating?: number | null
          quality_rating?: number | null
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
            foreignKeyName: "company_orders_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "company_drivers"
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
        ]
      }
      competition_invitations: {
        Row: {
          competition_id: string
          created_at: string
          id: string
          invited_by: string
          invitee_email: string | null
          invitee_name: string | null
          invitee_name_ar: string | null
          message: string | null
          message_ar: string | null
          organization_name: string | null
          organization_name_ar: string | null
          organization_type: string | null
          responded_at: string | null
          status: string
        }
        Insert: {
          competition_id: string
          created_at?: string
          id?: string
          invited_by: string
          invitee_email?: string | null
          invitee_name?: string | null
          invitee_name_ar?: string | null
          message?: string | null
          message_ar?: string | null
          organization_name?: string | null
          organization_name_ar?: string | null
          organization_type?: string | null
          responded_at?: string | null
          status?: string
        }
        Update: {
          competition_id?: string
          created_at?: string
          id?: string
          invited_by?: string
          invitee_email?: string | null
          invitee_name?: string | null
          invitee_name_ar?: string | null
          message?: string | null
          message_ar?: string | null
          organization_name?: string | null
          organization_name_ar?: string | null
          organization_type?: string | null
          responded_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_invitations_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
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
          id: string
          participant_id: string
          registered_at: string
          registration_number: string | null
          status: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          category_id?: string | null
          competition_id: string
          dish_description?: string | null
          dish_image_url?: string | null
          dish_name?: string | null
          id?: string
          participant_id: string
          registered_at?: string
          registration_number?: string | null
          status?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          category_id?: string | null
          competition_id?: string
          dish_description?: string | null
          dish_image_url?: string | null
          dish_name?: string | null
          id?: string
          participant_id?: string
          registered_at?: string
          registration_number?: string | null
          status?: string
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
            foreignKeyName: "competition_registrations_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
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
            foreignKeyName: "competition_sponsors_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "sponsorship_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_team_members: {
        Row: {
          competition_id: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          name_ar: string | null
          notes: string | null
          phone: string | null
          role: string
          user_id: string | null
        }
        Insert: {
          competition_id: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_ar?: string | null
          notes?: string | null
          phone?: string | null
          role: string
          user_id?: string | null
        }
        Update: {
          competition_id?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_ar?: string | null
          notes?: string | null
          phone?: string | null
          role?: string
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
        ]
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
        ]
      }
      competitions: {
        Row: {
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
          is_virtual: boolean | null
          max_participants: number | null
          organizer_id: string
          registration_end: string | null
          registration_start: string | null
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
          is_virtual?: boolean | null
          max_participants?: number | null
          organizer_id: string
          registration_end?: string | null
          registration_start?: string | null
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
          is_virtual?: boolean | null
          max_participants?: number | null
          organizer_id?: string
          registration_end?: string | null
          registration_start?: string | null
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
          license_expires_at: string | null
          license_number: string | null
          logo_url: string | null
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
          license_expires_at?: string | null
          license_number?: string | null
          logo_url?: string | null
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
          license_expires_at?: string | null
          license_number?: string | null
          logo_url?: string | null
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
          view_count?: number | null
          website?: string | null
        }
        Relationships: []
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
      exhibitions: {
        Row: {
          address: string | null
          address_ar: string | null
          city: string | null
          country: string | null
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          description_ar: string | null
          early_bird_deadline: string | null
          end_date: string
          gallery_urls: string[] | null
          id: string
          is_featured: boolean | null
          is_free: boolean | null
          is_virtual: boolean | null
          logo_url: string | null
          map_url: string | null
          max_attendees: number | null
          organizer_email: string | null
          organizer_name: string | null
          organizer_name_ar: string | null
          organizer_phone: string | null
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
          description?: string | null
          description_ar?: string | null
          early_bird_deadline?: string | null
          end_date: string
          gallery_urls?: string[] | null
          id?: string
          is_featured?: boolean | null
          is_free?: boolean | null
          is_virtual?: boolean | null
          logo_url?: string | null
          map_url?: string | null
          max_attendees?: number | null
          organizer_email?: string | null
          organizer_name?: string | null
          organizer_name_ar?: string | null
          organizer_phone?: string | null
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
          description?: string | null
          description_ar?: string | null
          early_bird_deadline?: string | null
          end_date?: string
          gallery_urls?: string[] | null
          id?: string
          is_featured?: boolean | null
          is_free?: boolean | null
          is_virtual?: boolean | null
          logo_url?: string | null
          map_url?: string | null
          max_attendees?: number | null
          organizer_email?: string | null
          organizer_name?: string | null
          organizer_name_ar?: string | null
          organizer_phone?: string | null
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
        Relationships: []
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
      invoices: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          description: string | null
          due_date: string | null
          id: string
          invoice_number: string
          paid_at: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          paid_at?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          paid_at?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
        Relationships: []
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
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          read_at: string | null
          receiver_id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          read_at?: string | null
          receiver_id: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
          updated_at?: string
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
      posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          group_id: string | null
          id: string
          image_url: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          group_id?: string | null
          id?: string
          image_url?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          group_id?: string | null
          id?: string
          image_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_number: string | null
          account_status: Database["public"]["Enums"]["account_status"] | null
          avatar_url: string | null
          bio: string | null
          company_id: string | null
          company_role: string | null
          created_at: string
          experience_level:
            | Database["public"]["Enums"]["experience_level"]
            | null
          facebook: string | null
          full_name: string | null
          id: string
          instagram: string | null
          is_verified: boolean | null
          last_login_at: string | null
          linkedin: string | null
          location: string | null
          membership_expires_at: string | null
          membership_status:
            | Database["public"]["Enums"]["membership_status"]
            | null
          membership_tier: Database["public"]["Enums"]["membership_tier"] | null
          phone: string | null
          preferred_language: string | null
          profile_completed: boolean | null
          specialization: string | null
          suspended_at: string | null
          suspended_reason: string | null
          twitter: string | null
          updated_at: string
          user_id: string
          username: string | null
          verified_at: string | null
          website: string | null
          youtube: string | null
        }
        Insert: {
          account_number?: string | null
          account_status?: Database["public"]["Enums"]["account_status"] | null
          avatar_url?: string | null
          bio?: string | null
          company_id?: string | null
          company_role?: string | null
          created_at?: string
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          facebook?: string | null
          full_name?: string | null
          id?: string
          instagram?: string | null
          is_verified?: boolean | null
          last_login_at?: string | null
          linkedin?: string | null
          location?: string | null
          membership_expires_at?: string | null
          membership_status?:
            | Database["public"]["Enums"]["membership_status"]
            | null
          membership_tier?:
            | Database["public"]["Enums"]["membership_tier"]
            | null
          phone?: string | null
          preferred_language?: string | null
          profile_completed?: boolean | null
          specialization?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
          twitter?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
          verified_at?: string | null
          website?: string | null
          youtube?: string | null
        }
        Update: {
          account_number?: string | null
          account_status?: Database["public"]["Enums"]["account_status"] | null
          avatar_url?: string | null
          bio?: string | null
          company_id?: string | null
          company_role?: string | null
          created_at?: string
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          facebook?: string | null
          full_name?: string | null
          id?: string
          instagram?: string | null
          is_verified?: boolean | null
          last_login_at?: string | null
          linkedin?: string | null
          location?: string | null
          membership_expires_at?: string | null
          membership_status?:
            | Database["public"]["Enums"]["membership_status"]
            | null
          membership_tier?:
            | Database["public"]["Enums"]["membership_tier"]
            | null
          phone?: string | null
          preferred_language?: string | null
          profile_completed?: boolean | null
          specialization?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
          twitter?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
          verified_at?: string | null
          website?: string | null
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
          cook_time_minutes: number | null
          created_at: string
          cuisine: string | null
          description: string | null
          description_ar: string | null
          difficulty: string | null
          gallery_urls: string[] | null
          id: string
          image_url: string | null
          ingredients: Json
          is_published: boolean | null
          prep_time_minutes: number | null
          servings: number | null
          steps: Json
          title: string
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          cook_time_minutes?: number | null
          created_at?: string
          cuisine?: string | null
          description?: string | null
          description_ar?: string | null
          difficulty?: string | null
          gallery_urls?: string[] | null
          id?: string
          image_url?: string | null
          ingredients?: Json
          is_published?: boolean | null
          prep_time_minutes?: number | null
          servings?: number | null
          steps?: Json
          title: string
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          cook_time_minutes?: number | null
          created_at?: string
          cuisine?: string | null
          description?: string | null
          description_ar?: string | null
          difficulty?: string | null
          gallery_urls?: string[] | null
          id?: string
          image_url?: string | null
          ingredients?: Json
          is_published?: boolean | null
          prep_time_minutes?: number | null
          servings?: number | null
          steps?: Json
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reference_gallery: {
        Row: {
          added_by: string | null
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
        }
        Insert: {
          added_by?: string | null
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
        }
        Update: {
          added_by?: string | null
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
      requirement_items: {
        Row: {
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
          name: string
          name_ar: string | null
          subcategory: string | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
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
          name: string
          name_ar?: string | null
          subcategory?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
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
          name?: string
          name_ar?: string | null
          subcategory?: string | null
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
          created_at: string | null
          currency: string | null
          custom_name: string | null
          custom_name_ar: string | null
          estimated_cost: number | null
          id: string
          item_id: string | null
          list_id: string
          notes: string | null
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
          created_at?: string | null
          currency?: string | null
          custom_name?: string | null
          custom_name_ar?: string | null
          estimated_cost?: number | null
          id?: string
          item_id?: string | null
          list_id: string
          notes?: string | null
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
          created_at?: string | null
          currency?: string | null
          custom_name?: string | null
          custom_name_ar?: string | null
          estimated_cost?: number | null
          id?: string
          item_id?: string | null
          list_id?: string
          notes?: string | null
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
          competition_id: string
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
          competition_id: string
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
          competition_id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
      generate_invoice_number: { Args: never; Returns: string }
      generate_order_number: { Args: never; Returns: string }
      generate_registration_number: { Args: never; Returns: string }
      generate_transaction_number: { Args: never; Returns: string }
      generate_verification_code: { Args: never; Returns: string }
      get_company_balance: { Args: { p_company_id: string }; Returns: number }
      get_user_company_id: { Args: { p_user_id: string }; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { p_user_id: string }; Returns: boolean }
      is_free_preview: { Args: { p_module_id: string }; Returns: boolean }
      validate_username: { Args: { p_username: string }; Returns: boolean }
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
      company_status: "active" | "inactive" | "pending" | "suspended"
      company_type: "sponsor" | "supplier" | "partner" | "vendor"
      competition_status:
        | "draft"
        | "upcoming"
        | "registration_open"
        | "registration_closed"
        | "in_progress"
        | "judging"
        | "completed"
        | "cancelled"
      entity_scope: "local" | "national" | "regional" | "international"
      entity_status: "pending" | "active" | "suspended" | "archived"
      entity_type:
        | "culinary_association"
        | "government_entity"
        | "private_association"
        | "culinary_academy"
        | "industry_body"
      exhibition_status:
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
      sponsorship_tier: "platinum" | "gold" | "silver" | "bronze" | "custom"
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
      company_status: ["active", "inactive", "pending", "suspended"],
      company_type: ["sponsor", "supplier", "partner", "vendor"],
      competition_status: [
        "draft",
        "upcoming",
        "registration_open",
        "registration_closed",
        "in_progress",
        "judging",
        "completed",
        "cancelled",
      ],
      entity_scope: ["local", "national", "regional", "international"],
      entity_status: ["pending", "active", "suspended", "archived"],
      entity_type: [
        "culinary_association",
        "government_entity",
        "private_association",
        "culinary_academy",
        "industry_body",
      ],
      exhibition_status: [
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
      sponsorship_tier: ["platinum", "gold", "silver", "bronze", "custom"],
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

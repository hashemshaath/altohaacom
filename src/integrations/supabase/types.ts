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
      competition_categories: {
        Row: {
          competition_id: string
          created_at: string
          description: string | null
          description_ar: string | null
          id: string
          max_participants: number | null
          name: string
          name_ar: string | null
          sort_order: number | null
        }
        Insert: {
          competition_id: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          max_participants?: number | null
          name: string
          name_ar?: string | null
          sort_order?: number | null
        }
        Update: {
          competition_id?: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          max_participants?: number | null
          name?: string
          name_ar?: string | null
          sort_order?: number | null
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
        ]
      }
      competition_scores: {
        Row: {
          criteria_id: string
          id: string
          judge_id: string
          notes: string | null
          registration_id: string
          score: number
          scored_at: string
        }
        Insert: {
          criteria_id: string
          id?: string
          judge_id: string
          notes?: string | null
          registration_id: string
          score: number
          scored_at?: string
        }
        Update: {
          criteria_id?: string
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
      competitions: {
        Row: {
          city: string | null
          competition_end: string
          competition_start: string
          country: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          description_ar: string | null
          id: string
          is_virtual: boolean | null
          max_participants: number | null
          organizer_id: string
          registration_end: string | null
          registration_start: string | null
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
          competition_start: string
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          is_virtual?: boolean | null
          max_participants?: number | null
          organizer_id: string
          registration_end?: string | null
          registration_start?: string | null
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
          competition_start?: string
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          is_virtual?: boolean | null
          max_participants?: number | null
          organizer_id?: string
          registration_end?: string | null
          registration_start?: string | null
          status?: Database["public"]["Enums"]["competition_status"]
          title?: string
          title_ar?: string | null
          updated_at?: string
          venue?: string | null
          venue_ar?: string | null
        }
        Relationships: []
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
          invoice_number: string
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
      post_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
        }
        Relationships: [
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
        Relationships: []
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
      generate_invoice_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { p_user_id: string }; Returns: boolean }
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
      competition_status:
        | "draft"
        | "upcoming"
        | "registration_open"
        | "registration_closed"
        | "in_progress"
        | "judging"
        | "completed"
        | "cancelled"
      experience_level: "beginner" | "amateur" | "professional"
      membership_status: "active" | "expired" | "suspended" | "cancelled"
      membership_tier: "basic" | "professional" | "enterprise"
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
      experience_level: ["beginner", "amateur", "professional"],
      membership_status: ["active", "expired", "suspended", "cancelled"],
      membership_tier: ["basic", "professional", "enterprise"],
    },
  },
} as const

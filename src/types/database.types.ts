[?25l[?2004h
                                                                                                 
  >  1. gqalsczfephexbserzqp [name: CroosWordVocab, org: yygpmcztahaflwgvlvdn, region: eu-west-1]
                                                                                                 
                                                                                                 
    ↑/k up • ↓/j down • / filter • q quit • ? more                                               
                                                                                                 [6A [J[2K[?2004l[?25h[?1002l[?1003l[?1006lexport type Json =
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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      daily_completions: {
        Row: {
          completion_date: string
          created_at: string | null
          due_words_count: number
          freeze_used: boolean | null
          id: string
          puzzles_completed: number
          streak_maintained: boolean | null
          updated_at: string | null
          user_id: string
          words_completed: number
        }
        Insert: {
          completion_date: string
          created_at?: string | null
          due_words_count?: number
          freeze_used?: boolean | null
          id?: string
          puzzles_completed?: number
          streak_maintained?: boolean | null
          updated_at?: string | null
          user_id: string
          words_completed?: number
        }
        Update: {
          completion_date?: string
          created_at?: string | null
          due_words_count?: number
          freeze_used?: boolean | null
          id?: string
          puzzles_completed?: number
          streak_maintained?: boolean | null
          updated_at?: string | null
          user_id?: string
          words_completed?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      list_collaborators: {
        Row: {
          cached_score: number | null
          id: string
          joined_at: string | null
          leaderboard_opted_in: boolean | null
          role: string | null
          score_updated_at: string | null
          shared_list_id: string
          user_id: string
        }
        Insert: {
          cached_score?: number | null
          id?: string
          joined_at?: string | null
          leaderboard_opted_in?: boolean | null
          role?: string | null
          score_updated_at?: string | null
          shared_list_id: string
          user_id: string
        }
        Update: {
          cached_score?: number | null
          id?: string
          joined_at?: string | null
          leaderboard_opted_in?: boolean | null
          role?: string | null
          score_updated_at?: string | null
          shared_list_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_collaborators_shared_list_id_fkey"
            columns: ["shared_list_id"]
            isOneToOne: false
            referencedRelation: "shared_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      puzzle_cache: {
        Row: {
          generated_at: string | null
          id: string
          puzzle_data: Json
          user_id: string
          valid_until: string | null
          word_ids: string[]
        }
        Insert: {
          generated_at?: string | null
          id?: string
          puzzle_data: Json
          user_id: string
          valid_until?: string | null
          word_ids: string[]
        }
        Update: {
          generated_at?: string | null
          id?: string
          puzzle_data?: Json
          user_id?: string
          valid_until?: string | null
          word_ids?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "puzzle_cache_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      puzzle_sessions: {
        Row: {
          completed_at: string | null
          correct_words: number | null
          id: string
          list_id: string | null
          puzzle_data: Json
          started_at: string | null
          total_words: number
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          correct_words?: number | null
          id?: string
          list_id?: string | null
          puzzle_data: Json
          started_at?: string | null
          total_words: number
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          correct_words?: number | null
          id?: string
          list_id?: string | null
          puzzle_data?: Json
          started_at?: string | null
          total_words?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "puzzle_sessions_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "word_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "puzzle_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_lists: {
        Row: {
          access_count: number | null
          created_at: string | null
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          last_accessed_at: string | null
          original_list_id: string
          share_mode: string
          share_token: string
        }
        Insert: {
          access_count?: number | null
          created_at?: string | null
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          original_list_id: string
          share_mode: string
          share_token: string
        }
        Update: {
          access_count?: number | null
          created_at?: string | null
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          original_list_id?: string
          share_mode?: string
          share_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_lists_original_list_id_fkey"
            columns: ["original_list_id"]
            isOneToOne: false
            referencedRelation: "word_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_webhook_events: {
        Row: {
          created_at: string | null
          customer_id: string | null
          event_id: string
          event_type: string
          id: string
          processed_at: string | null
          subscription_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          event_id: string
          event_type: string
          id?: string
          processed_at?: string | null
          subscription_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          event_id?: string
          event_type?: string
          id?: string
          processed_at?: string | null
          subscription_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stripe_webhook_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_streaks: {
        Row: {
          created_at: string | null
          current_streak: number
          id: string
          last_streak_update: string | null
          longest_streak: number
          streak_freezes_available: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number
          id?: string
          last_streak_update?: string | null
          longest_streak?: number
          streak_freezes_available?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number
          id?: string
          last_streak_update?: string | null
          longest_streak?: number
          streak_freezes_available?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          stripe_customer_id: string | null
          subscription_end_date: string | null
          subscription_status: string | null
          trial_end_date: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name?: string
          stripe_customer_id?: string | null
          subscription_end_date?: string | null
          subscription_status?: string | null
          trial_end_date?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          stripe_customer_id?: string | null
          subscription_end_date?: string | null
          subscription_status?: string | null
          trial_end_date?: string | null
        }
        Relationships: []
      }
      word_lists: {
        Row: {
          created_at: string | null
          id: string
          is_shared: boolean | null
          name: string
          shared_at: string | null
          source_language: string
          target_language: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_shared?: boolean | null
          name: string
          shared_at?: string | null
          source_language: string
          target_language: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_shared?: boolean | null
          name?: string
          shared_at?: string | null
          source_language?: string
          target_language?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "word_lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      word_progress: {
        Row: {
          correct_reviews: number | null
          current_streak: number | null
          ease_factor: number | null
          id: string
          incorrect_reviews: number | null
          interval_days: number | null
          last_reviewed_at: string | null
          next_review_date: string | null
          repetition_level: number | null
          stage: number | null
          total_reviews: number | null
          updated_at: string | null
          user_id: string | null
          word_id: string | null
        }
        Insert: {
          correct_reviews?: number | null
          current_streak?: number | null
          ease_factor?: number | null
          id?: string
          incorrect_reviews?: number | null
          interval_days?: number | null
          last_reviewed_at?: string | null
          next_review_date?: string | null
          repetition_level?: number | null
          stage?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string | null
          word_id?: string | null
        }
        Update: {
          correct_reviews?: number | null
          current_streak?: number | null
          ease_factor?: number | null
          id?: string
          incorrect_reviews?: number | null
          interval_days?: number | null
          last_reviewed_at?: string | null
          next_review_date?: string | null
          repetition_level?: number | null
          stage?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string | null
          word_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "word_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "word_progress_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "words"
            referencedColumns: ["id"]
          },
        ]
      }
      word_reviews: {
        Row: {
          hints_used: number | null
          id: string
          review_type: string
          reviewed_at: string | null
          session_id: string | null
          time_to_solve: number | null
          user_id: string | null
          word_id: string | null
        }
        Insert: {
          hints_used?: number | null
          id?: string
          review_type: string
          reviewed_at?: string | null
          session_id?: string | null
          time_to_solve?: number | null
          user_id?: string | null
          word_id?: string | null
        }
        Update: {
          hints_used?: number | null
          id?: string
          review_type?: string
          reviewed_at?: string | null
          session_id?: string | null
          time_to_solve?: number | null
          user_id?: string | null
          word_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "word_reviews_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "puzzle_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "word_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "word_reviews_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "words"
            referencedColumns: ["id"]
          },
        ]
      }
      words: {
        Row: {
          created_at: string | null
          definition: string | null
          example_sentence: string | null
          id: string
          list_id: string | null
          term: string
          translation: string
        }
        Insert: {
          created_at?: string | null
          definition?: string | null
          example_sentence?: string | null
          id?: string
          list_id?: string | null
          term: string
          translation: string
        }
        Update: {
          created_at?: string | null
          definition?: string | null
          example_sentence?: string | null
          id?: string
          list_id?: string | null
          term?: string
          translation?: string
        }
        Relationships: [
          {
            foreignKeyName: "words_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "word_lists"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_leaderboard_score: {
        Args: { p_shared_list_id: string; p_user_id: string }
        Returns: number
      }
      calculate_srs_progress: {
        Args: {
          user_id_param: string
          was_correct_param: boolean
          word_id_param: string
        }
        Returns: {
          new_ease_factor: number
          new_interval_days: number
          new_next_review_date: string
          new_stage: number
        }[]
      }
      cleanup_expired_puzzle_cache: { Args: never; Returns: undefined }
      create_shared_list: {
        Args: { p_list_id: string; p_share_mode: string }
        Returns: {
          id: string
          share_token: string
        }[]
      }
      generate_share_token: { Args: never; Returns: string }
      get_collaborative_leaderboard: {
        Args: { p_shared_list_id: string }
        Returns: {
          cached_score: number
          rank: number
          score_updated_at: string
          user_email: string
          user_id: string
          user_name: string
        }[]
      }
      get_due_words_count: { Args: { user_id_param: string }; Returns: number }
      import_shared_list_copy: {
        Args: { p_share_token: string }
        Returns: string
      }
      join_collaborative_list: {
        Args: { p_share_token: string }
        Returns: string
      }
      leave_collaborative_list_delete: {
        Args: { p_shared_list_id: string }
        Returns: boolean
      }
      leave_collaborative_list_keep_copy: {
        Args: { p_shared_list_id: string }
        Returns: string
      }
      process_daily_streak_maintenance: { Args: never; Returns: number }
      record_daily_completion: {
        Args: {
          due_words_count_param?: number
          puzzles_completed_param?: number
          user_id_param: string
          words_completed_param?: number
        }
        Returns: {
          current_streak: number
          freeze_used: boolean
          longest_streak: number
          streak_maintained: boolean
        }[]
      }
      refill_streak_freezes: { Args: never; Returns: number }
      toggle_leaderboard_opt_in: {
        Args: { p_opt_in: boolean; p_shared_list_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          subscription_status: string
          subscription_end_date: string | null
          trial_end_date: string
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
          subscription_status?: string
          subscription_end_date?: string | null
          trial_end_date?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          subscription_status?: string
          subscription_end_date?: string | null
          trial_end_date?: string
        }
      }
      word_lists: {
        Row: {
          id: string
          user_id: string
          name: string
          source_language: string
          target_language: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          source_language: string
          target_language: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          source_language?: string
          target_language?: string
          created_at?: string
          updated_at?: string
        }
      }
      words: {
        Row: {
          id: string
          list_id: string
          term: string
          translation: string
          definition: string | null
          example_sentence: string | null
          created_at: string
        }
        Insert: {
          id?: string
          list_id: string
          term: string
          translation: string
          definition?: string | null
          example_sentence?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          list_id?: string
          term?: string
          translation?: string
          definition?: string | null
          example_sentence?: string | null
          created_at?: string
        }
      }
      word_progress: {
        Row: {
          id: string
          user_id: string
          word_id: string
          stage: number
          ease_factor: number
          interval_days: number
          next_review_date: string
          last_reviewed_at: string | null
          total_reviews: number
          correct_reviews: number
          incorrect_reviews: number
          current_streak: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          word_id: string
          stage?: number
          ease_factor?: number
          interval_days?: number
          next_review_date?: string
          last_reviewed_at?: string | null
          total_reviews?: number
          correct_reviews?: number
          incorrect_reviews?: number
          current_streak?: number
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          word_id?: string
          stage?: number
          ease_factor?: number
          interval_days?: number
          next_review_date?: string
          last_reviewed_at?: string | null
          total_reviews?: number
          correct_reviews?: number
          incorrect_reviews?: number
          current_streak?: number
          updated_at?: string
        }
      }
      puzzle_sessions: {
        Row: {
          id: string
          user_id: string
          list_id: string | null
          started_at: string
          completed_at: string | null
          puzzle_data: Json
          total_words: number
          correct_words: number
        }
        Insert: {
          id?: string
          user_id: string
          list_id?: string | null
          started_at?: string
          completed_at?: string | null
          puzzle_data: Json
          total_words: number
          correct_words?: number
        }
        Update: {
          id?: string
          user_id?: string
          list_id?: string | null
          started_at?: string
          completed_at?: string | null
          puzzle_data?: Json
          total_words?: number
          correct_words?: number
        }
      }
      word_reviews: {
        Row: {
          id: string
          session_id: string
          word_id: string | null
          user_id: string | null
          review_type: string
          time_to_solve: number | null
          hints_used: number
          reviewed_at: string
        }
        Insert: {
          id?: string
          session_id: string
          word_id?: string | null
          user_id?: string | null
          review_type: string
          time_to_solve?: number | null
          hints_used?: number
          reviewed_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          word_id?: string | null
          user_id?: string | null
          review_type?: string
          time_to_solve?: number | null
          hints_used?: number
          reviewed_at?: string
        }
      }
    }
  }
}

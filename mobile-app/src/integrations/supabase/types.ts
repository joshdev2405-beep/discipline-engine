export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgresVersion: "14.4"
  }
  public: {
    Tables: {
      daily_logins: {
        Row: {
          created_at: string
          id: string
          login_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          login_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          login_date?: string
          user_id?: string
        }
      }
      mood_logs: {
        Row: {
          created_at: string
          date: string
          id: string
          mood_score: number
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          mood_score: number
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          mood_score?: number
          notes?: string | null
          user_id?: string
        }
      }
      profiles: {
        Row: {
          avatar_url: string | null
          continent: string | null
          created_at: string
          current_streak: number
          id: string
          last_login_date: string | null
          longest_streak: number
          total_xp: number
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          continent?: string | null
          created_at?: string
          current_streak?: number
          id?: string
          last_login_date?: string | null
          longest_streak?: number
          total_xp?: number
          updated_at?: string
          user_id: string
          username?: string
        }
        Update: {
          avatar_url?: string | null
          continent?: string | null
          created_at?: string
          current_streak?: number
          id?: string
          last_login_date?: string | null
          longest_streak?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
          username?: string
        }
      }
      trades: {
        Row: {
          created_at: string
          entry_date: string
          entry_price: number
          exit_date: string
          exit_price: number
          id: string
          pnl: number
          pnl_percent: number
          quantity: number
          screenshots: string[]
          symbol: string
          tags: string[]
          trade_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_date: string
          entry_price: number
          exit_date: string
          exit_price: number
          id?: string
          pnl: number
          pnl_percent: number
          quantity: number
          screenshots?: string[]
          symbol: string
          tags?: string[]
          trade_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          entry_date?: string
          entry_price?: number
          exit_date?: string
          exit_price?: number
          id?: string
          pnl?: number
          pnl_percent?: number
          quantity?: number
          screenshots?: string[]
          symbol?: string
          tags?: string[]
          trade_type?: string
          user_id?: string
        }
      }
      xp_events: {
        Row: {
          created_at: string
          id: string
          multiplier: number
          reason: string
          user_id: string
          xp_amount: number
        }
        Insert: {
          created_at?: string
          id?: string
          multiplier: number
          reason: string
          user_id: string
          xp_amount: number
        }
        Update: {
          created_at?: string
          id?: string
          multiplier?: number
          reason?: string
          user_id?: string
          xp_amount?: number
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}

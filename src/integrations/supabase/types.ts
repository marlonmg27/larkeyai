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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      message_packs: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          messages: number
          name: string
          price_mxn: number
          stripe_price_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          messages: number
          name: string
          price_mxn: number
          stripe_price_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          messages?: number
          name?: string
          price_mxn?: number
          stripe_price_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          active: boolean
          billing_interval: string
          created_at: string
          id: string
          messages_included: number
          name: string
          price: number
          stripe_price_id: string | null
          tier: string | null
          trial_days: number
          trial_message_cap: number
          trial_requires_payment_method: boolean
        }
        Insert: {
          active?: boolean
          billing_interval?: string
          created_at?: string
          id?: string
          messages_included: number
          name: string
          price: number
          stripe_price_id?: string | null
          tier?: string | null
          trial_days?: number
          trial_message_cap?: number
          trial_requires_payment_method?: boolean
        }
        Update: {
          active?: boolean
          billing_interval?: string
          created_at?: string
          id?: string
          messages_included?: number
          name?: string
          price?: number
          stripe_price_id?: string | null
          tier?: string | null
          trial_days?: number
          trial_message_cap?: number
          trial_requires_payment_method?: boolean
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount: number
          created_at: string
          id: string
          messages_purchased: number
          pack_id: string | null
          package: string
          stripe_payment_id: string | null
          stripe_session_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          messages_purchased: number
          pack_id?: string | null
          package: string
          stripe_payment_id?: string | null
          stripe_session_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          messages_purchased?: number
          pack_id?: string | null
          package?: string
          stripe_payment_id?: string | null
          stripe_session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "message_packs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_events: {
        Row: {
          id: string
          payload: Json
          processed_at: string
          type: string
        }
        Insert: {
          id: string
          payload: Json
          processed_at?: string
          type: string
        }
        Update: {
          id?: string
          payload?: Json
          processed_at?: string
          type?: string
        }
        Relationships: []
      }
      usage_balance: {
        Row: {
          messages_remaining: number
          messages_used_period: number
          period_end: string
          period_start: string
          user_id: string
        }
        Insert: {
          messages_remaining?: number
          messages_used_period?: number
          period_end?: string
          period_start?: string
          user_id: string
        }
        Update: {
          messages_remaining?: number
          messages_used_period?: number
          period_end?: string
          period_start?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_balance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          email: string | null
          id: string
          phone: string | null
          plan_id: string | null
          stripe_customer_id: string | null
          subscription_id: string | null
          subscription_status: string
          trial_ends_at: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          email?: string | null
          id: string
          phone?: string | null
          plan_id?: string | null
          stripe_customer_id?: string | null
          subscription_id?: string | null
          subscription_status?: string
          trial_ends_at?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          plan_id?: string | null
          stripe_customer_id?: string | null
          subscription_id?: string | null
          subscription_status?: string
          trial_ends_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_client: {
        Args: { p_phone: string; p_plan_id: string; p_user_id: string }
        Returns: undefined
      }
      add_purchased_messages: {
        Args: {
          p_amount: number
          p_messages: number
          p_package: string
          p_stripe_payment_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      apply_subscription_event: {
        Args: {
          p_action: string
          p_cancel_at_period_end?: boolean
          p_current_period_end?: string
          p_plan_id?: string
          p_stripe_customer_id?: string
          p_subscription_id?: string
          p_trial_ends_at?: string
          p_user_id: string
        }
        Returns: undefined
      }
      can_buy_pack: { Args: { p_user_id: string }; Returns: boolean }
      can_send_message: { Args: { p_user_id: string }; Returns: boolean }
      decrement_messages: {
        Args: { p_count: number; p_user_id: string }
        Returns: undefined
      }
      reset_expired_usage_balances: { Args: never; Returns: undefined }
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

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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          erpnext_api_key_encrypted: string | null
          erpnext_api_secret_encrypted: string | null
          erpnext_default_company: string | null
          erpnext_pallet_template_item: string | null
          erpnext_url: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          erpnext_api_key_encrypted?: string | null
          erpnext_api_secret_encrypted?: string | null
          erpnext_default_company?: string | null
          erpnext_pallet_template_item?: string | null
          erpnext_url?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          erpnext_api_key_encrypted?: string | null
          erpnext_api_secret_encrypted?: string | null
          erpnext_default_company?: string | null
          erpnext_pallet_template_item?: string | null
          erpnext_url?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          is_trial_active: boolean
          payment_exempt: boolean
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_trial_active?: boolean
          payment_exempt?: boolean
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_trial_active?: boolean
          payment_exempt?: boolean
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          created_at: string
          expires_at: string | null
          granted_at: string
          granted_by: string | null
          id: string
          is_active: boolean
          permission: Database["public"]["Enums"]["permission_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          permission: Database["public"]["Enums"]["permission_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          permission?: Database["public"]["Enums"]["permission_type"]
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
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
      admin_can_view_subscription: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      can_access_subscription: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      current_user_has_permission: {
        Args: { p_permission: Database["public"]["Enums"]["permission_type"] }
        Returns: boolean
      }
      decrypt_secret: {
        Args: { encrypted_data: string; key_id?: string }
        Returns: string
      }
      encrypt_secret: {
        Args: { key_id?: string; secret: string }
        Returns: string
      }
      get_safe_profile: {
        Args: { profile_id?: string }
        Returns: {
          created_at: string
          email: string
          erpnext_default_company: string
          erpnext_pallet_template_item: string
          erpnext_url: string
          full_name: string
          has_api_credentials: boolean
          id: string
          updated_at: string
        }[]
      }
      get_user_erpnext_credentials: {
        Args: Record<PropertyKey, never>
        Returns: {
          erpnext_api_key: string
          erpnext_api_secret: string
          erpnext_default_company: string
          erpnext_pallet_template_item: string
          erpnext_url: string
        }[]
      }
      get_user_subscription_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          has_access: boolean
          is_trial_active: boolean
          payment_exempt: boolean
          subscribed: boolean
          subscription_end: string
          trial_days_left: number
        }[]
      }
      grant_user_permission: {
        Args: {
          p_expires_at?: string
          p_permission: Database["public"]["Enums"]["permission_type"]
          p_user_id: string
        }
        Returns: undefined
      }
      has_permission: {
        Args: {
          p_permission: Database["public"]["Enums"]["permission_type"]
          p_user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: { _user_id?: string }
        Returns: boolean
      }
      log_security_event: {
        Args: { details?: Json; event_type: string }
        Returns: undefined
      }
      log_sensitive_operation: {
        Args: {
          p_action: string
          p_new_values?: Json
          p_old_values?: Json
          p_resource_id?: string
          p_resource_type: string
          p_user_id: string
        }
        Returns: undefined
      }
      revoke_user_permission: {
        Args: {
          p_permission: Database["public"]["Enums"]["permission_type"]
          p_user_id: string
        }
        Returns: undefined
      }
      update_user_erpnext_credentials: {
        Args: {
          p_erpnext_api_key?: string
          p_erpnext_api_secret?: string
          p_erpnext_default_company?: string
          p_erpnext_pallet_template_item?: string
          p_erpnext_url?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      permission_type:
        | "view_valuations"
        | "view_sensitive_data"
        | "admin_access"
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
      app_role: ["admin", "moderator", "user"],
      permission_type: [
        "view_valuations",
        "view_sensitive_data",
        "admin_access",
      ],
    },
  },
} as const

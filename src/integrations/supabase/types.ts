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
      cart_items: {
        Row: {
          created_at: string
          id: string
          price: number
          product_name: string
          product_type: string
          quantity: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          price: number
          product_name: string
          product_type: string
          quantity?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          price?: number
          product_name?: string
          product_type?: string
          quantity?: number
          user_id?: string
        }
        Relationships: []
      }
      nfc_guest_orders: {
        Row: {
          account_holder_name: string | null
          admin_notes: string | null
          bank_name: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          payment_method: string
          payment_screenshot_url: string | null
          phone: string
          price: number
          product_name: string
          product_type: string
          quantity: number
          sender_number: string | null
          shipping_address: string
          shipping_city: string
          status: string | null
          total_amount: number
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          account_holder_name?: string | null
          admin_notes?: string | null
          bank_name?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          payment_method: string
          payment_screenshot_url?: string | null
          phone: string
          price: number
          product_name: string
          product_type: string
          quantity?: number
          sender_number?: string | null
          shipping_address: string
          shipping_city: string
          status?: string | null
          total_amount: number
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          account_holder_name?: string | null
          admin_notes?: string | null
          bank_name?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          payment_method?: string
          payment_screenshot_url?: string | null
          phone?: string
          price?: number
          product_name?: string
          product_type?: string
          quantity?: number
          sender_number?: string | null
          shipping_address?: string
          shipping_city?: string
          status?: string | null
          total_amount?: number
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price: number
          product_name: string
          product_type: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price: number
          product_name: string
          product_type: string
          quantity: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price?: number
          product_name?: string
          product_type?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          id: string
          payment_method: string | null
          shipping_address: string
          shipping_city: string
          shipping_name: string
          shipping_phone: string
          status: string | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payment_method?: string | null
          shipping_address: string
          shipping_city: string
          shipping_name: string
          shipping_phone: string
          status?: string | null
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payment_method?: string | null
          shipping_address?: string
          shipping_city?: string
          shipping_name?: string
          shipping_phone?: string
          status?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      packages: {
        Row: {
          created_at: string
          description: string | null
          duration_days: number
          features: Json | null
          id: string
          is_active: boolean | null
          name: string
          price: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_days?: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_days?: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          account_holder_name: string | null
          admin_notes: string | null
          amount: number
          bank_name: string | null
          created_at: string
          expires_at: string | null
          id: string
          package_id: string | null
          payment_date: string | null
          payment_method: string
          payment_screenshot_url: string | null
          sender_number: string | null
          status: string | null
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_holder_name?: string | null
          admin_notes?: string | null
          amount: number
          bank_name?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          package_id?: string | null
          payment_date?: string | null
          payment_method: string
          payment_screenshot_url?: string | null
          sender_number?: string | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_holder_name?: string | null
          admin_notes?: string | null
          amount?: number
          bank_name?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          package_id?: string | null
          payment_date?: string | null
          payment_method?: string
          payment_screenshot_url?: string | null
          sender_number?: string | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vcard_analytics: {
        Row: {
          created_at: string
          event_type: string
          id: string
          link_name: string | null
          referrer: string | null
          user_agent: string | null
          vcard_id: string
          visitor_ip: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          link_name?: string | null
          referrer?: string | null
          user_agent?: string | null
          vcard_id: string
          visitor_ip?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          link_name?: string | null
          referrer?: string | null
          user_agent?: string | null
          vcard_id?: string
          visitor_ip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vcard_analytics_vcard_id_fkey"
            columns: ["vcard_id"]
            isOneToOne: false
            referencedRelation: "vcards"
            referencedColumns: ["id"]
          },
        ]
      }
      vcards: {
        Row: {
          address: string | null
          bio: string | null
          company: string | null
          created_at: string
          email: string | null
          facebook_url: string | null
          github_url: string | null
          id: string
          instagram_url: string | null
          is_active: boolean | null
          job_title: string | null
          linkedin_url: string | null
          name: string
          notification_email: string | null
          notify_on_click: boolean | null
          notify_on_view: boolean | null
          phone: string | null
          photo_url: string | null
          qr_background_color: string | null
          qr_foreground_color: string | null
          qr_logo_url: string | null
          slug: string | null
          template: string | null
          twitter_url: string | null
          updated_at: string
          user_id: string
          website: string | null
          youtube_url: string | null
        }
        Insert: {
          address?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          facebook_url?: string | null
          github_url?: string | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          job_title?: string | null
          linkedin_url?: string | null
          name: string
          notification_email?: string | null
          notify_on_click?: boolean | null
          notify_on_view?: boolean | null
          phone?: string | null
          photo_url?: string | null
          qr_background_color?: string | null
          qr_foreground_color?: string | null
          qr_logo_url?: string | null
          slug?: string | null
          template?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
          youtube_url?: string | null
        }
        Update: {
          address?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          facebook_url?: string | null
          github_url?: string | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          job_title?: string | null
          linkedin_url?: string | null
          name?: string
          notification_email?: string | null
          notify_on_click?: boolean | null
          notify_on_view?: boolean | null
          phone?: string | null
          photo_url?: string | null
          qr_background_color?: string | null
          qr_foreground_color?: string | null
          qr_logo_url?: string | null
          slug?: string | null
          template?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    },
  },
} as const

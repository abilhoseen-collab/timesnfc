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
      coupon_redemptions: {
        Row: {
          coupon_id: string
          created_at: string
          discount_amount: number
          final_amount: number
          id: string
          original_amount: number
          upgrade_request_id: string | null
          user_id: string
        }
        Insert: {
          coupon_id: string
          created_at?: string
          discount_amount: number
          final_amount: number
          id?: string
          original_amount: number
          upgrade_request_id?: string | null
          user_id: string
        }
        Update: {
          coupon_id?: string
          created_at?: string
          discount_amount?: number
          final_amount?: number
          id?: string
          original_amount?: number
          upgrade_request_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          applicable_packages: string[] | null
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_discount: number | null
          min_amount: number
          per_user_limit: number
          updated_at: string
          usage_count: number
          usage_limit: number | null
        }
        Insert: {
          applicable_packages?: string[] | null
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_amount?: number
          per_user_limit?: number
          updated_at?: string
          usage_count?: number
          usage_limit?: number | null
        }
        Update: {
          applicable_packages?: string[] | null
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_amount?: number
          per_user_limit?: number
          updated_at?: string
          usage_count?: number
          usage_limit?: number | null
        }
        Relationships: []
      }
      domain_verifications: {
        Row: {
          a_record: string | null
          created_at: string
          domain: string
          id: string
          landing_page_id: string
          last_check_at: string | null
          status: string | null
          txt_record: string | null
          verification_token: string
          verified_at: string | null
        }
        Insert: {
          a_record?: string | null
          created_at?: string
          domain: string
          id?: string
          landing_page_id: string
          last_check_at?: string | null
          status?: string | null
          txt_record?: string | null
          verification_token: string
          verified_at?: string | null
        }
        Update: {
          a_record?: string | null
          created_at?: string
          domain?: string
          id?: string
          landing_page_id?: string
          last_check_at?: string | null
          status?: string | null
          txt_record?: string | null
          verification_token?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "domain_verifications_landing_page_id_fkey"
            columns: ["landing_page_id"]
            isOneToOne: false
            referencedRelation: "landing_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      home_page_content: {
        Row: {
          content: Json | null
          created_at: string
          id: string
          is_visible: boolean | null
          section_key: string
          sort_order: number | null
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          id?: string
          is_visible?: boolean | null
          section_key: string
          sort_order?: number | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          id?: string
          is_visible?: boolean | null
          section_key?: string
          sort_order?: number | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      landing_page_analytics: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          event_type: string
          id: string
          is_unique: boolean | null
          landing_page_id: string
          referrer: string | null
          section_id: string | null
          section_type: string | null
          session_id: string | null
          time_on_page: number | null
          user_agent: string | null
          visitor_id: string | null
          visitor_ip: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          event_type: string
          id?: string
          is_unique?: boolean | null
          landing_page_id: string
          referrer?: string | null
          section_id?: string | null
          section_type?: string | null
          session_id?: string | null
          time_on_page?: number | null
          user_agent?: string | null
          visitor_id?: string | null
          visitor_ip?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          event_type?: string
          id?: string
          is_unique?: boolean | null
          landing_page_id?: string
          referrer?: string | null
          section_id?: string | null
          section_type?: string | null
          session_id?: string | null
          time_on_page?: number | null
          user_agent?: string | null
          visitor_id?: string | null
          visitor_ip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "landing_page_analytics_landing_page_id_fkey"
            columns: ["landing_page_id"]
            isOneToOne: false
            referencedRelation: "landing_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_page_sections: {
        Row: {
          content: Json | null
          created_at: string
          id: string
          is_visible: boolean | null
          landing_page_id: string
          section_type: string
          settings: Json | null
          sort_order: number | null
          title: string | null
          updated_at: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          id?: string
          is_visible?: boolean | null
          landing_page_id: string
          section_type: string
          settings?: Json | null
          sort_order?: number | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          id?: string
          is_visible?: boolean | null
          landing_page_id?: string
          section_type?: string
          settings?: Json | null
          sort_order?: number | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "landing_page_sections_landing_page_id_fkey"
            columns: ["landing_page_id"]
            isOneToOne: false
            referencedRelation: "landing_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_pages: {
        Row: {
          background_color: string | null
          created_at: string
          custom_domain: string | null
          domain_verified: boolean | null
          favicon_url: string | null
          font_family: string | null
          footer_additional_links: Json | null
          footer_background_color: string | null
          footer_copyright_text: string | null
          footer_show_powered_by: boolean | null
          footer_social_links: Json | null
          header_cta_link: string | null
          header_cta_text: string | null
          header_logo_url: string | null
          header_nav_items: Json | null
          header_show_cta: boolean | null
          header_sticky: boolean | null
          header_title: string | null
          id: string
          is_active: boolean | null
          is_published: boolean | null
          meta_description: string | null
          meta_title: string | null
          name: string
          og_image_url: string | null
          slug: string
          ssl_status: string | null
          text_color: string | null
          theme_color: string | null
          total_views: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          background_color?: string | null
          created_at?: string
          custom_domain?: string | null
          domain_verified?: boolean | null
          favicon_url?: string | null
          font_family?: string | null
          footer_additional_links?: Json | null
          footer_background_color?: string | null
          footer_copyright_text?: string | null
          footer_show_powered_by?: boolean | null
          footer_social_links?: Json | null
          header_cta_link?: string | null
          header_cta_text?: string | null
          header_logo_url?: string | null
          header_nav_items?: Json | null
          header_show_cta?: boolean | null
          header_sticky?: boolean | null
          header_title?: string | null
          id?: string
          is_active?: boolean | null
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          og_image_url?: string | null
          slug: string
          ssl_status?: string | null
          text_color?: string | null
          theme_color?: string | null
          total_views?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          background_color?: string | null
          created_at?: string
          custom_domain?: string | null
          domain_verified?: boolean | null
          favicon_url?: string | null
          font_family?: string | null
          footer_additional_links?: Json | null
          footer_background_color?: string | null
          footer_copyright_text?: string | null
          footer_show_powered_by?: boolean | null
          footer_social_links?: Json | null
          header_cta_link?: string | null
          header_cta_text?: string | null
          header_logo_url?: string | null
          header_nav_items?: Json | null
          header_show_cta?: boolean | null
          header_sticky?: boolean | null
          header_title?: string | null
          id?: string
          is_active?: boolean | null
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          og_image_url?: string | null
          slug?: string
          ssl_status?: string | null
          text_color?: string | null
          theme_color?: string | null
          total_views?: number | null
          updated_at?: string
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
          shipping_status: string | null
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
          shipping_status?: string | null
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
          shipping_status?: string | null
          status?: string | null
          total_amount?: number
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_new_lead: boolean
          push_new_lead: boolean
          updated_at: string
          user_id: string
          weekly_digest: boolean
        }
        Insert: {
          created_at?: string
          email_new_lead?: boolean
          push_new_lead?: boolean
          updated_at?: string
          user_id: string
          weekly_digest?: boolean
        }
        Update: {
          created_at?: string
          email_new_lead?: boolean
          push_new_lead?: boolean
          updated_at?: string
          user_id?: string
          weekly_digest?: boolean
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
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
          shipping_status: string | null
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
          shipping_status?: string | null
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
          shipping_status?: string | null
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
          landing_page_limit: number
          name: string
          price: number
          vcard_limit: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_days?: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          landing_page_limit?: number
          name: string
          price: number
          vcard_limit?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_days?: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          landing_page_limit?: number
          name?: string
          price?: number
          vcard_limit?: number
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
          onboarding_completed: boolean
          phone: string | null
          referral_code: string | null
          referred_by: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          onboarding_completed?: boolean
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          last_used_at: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          last_used_at?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_used_at?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referral_code: string
          referred_user_id: string
          referrer_id: string
          reward_days: number
          rewarded_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code: string
          referred_user_id: string
          referrer_id: string
          reward_days?: number
          rewarded_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          referral_code?: string
          referred_user_id?: string
          referrer_id?: string
          reward_days?: number
          rewarded_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
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
      support_tickets: {
        Row: {
          admin_reply: string | null
          category: string
          created_at: string
          id: string
          message: string
          priority: string
          replied_at: string | null
          replied_by: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_reply?: string | null
          category?: string
          created_at?: string
          id?: string
          message: string
          priority?: string
          replied_at?: string | null
          replied_by?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_reply?: string | null
          category?: string
          created_at?: string
          id?: string
          message?: string
          priority?: string
          replied_at?: string | null
          replied_by?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      upgrade_requests: {
        Row: {
          account_holder_name: string | null
          admin_notes: string | null
          amount: number
          bank_name: string | null
          created_at: string
          current_subscription_id: string | null
          id: string
          payment_method: string
          payment_screenshot_url: string | null
          sender_number: string | null
          status: string | null
          target_package_id: string | null
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
          current_subscription_id?: string | null
          id?: string
          payment_method: string
          payment_screenshot_url?: string | null
          sender_number?: string | null
          status?: string | null
          target_package_id?: string | null
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
          current_subscription_id?: string | null
          id?: string
          payment_method?: string
          payment_screenshot_url?: string | null
          sender_number?: string | null
          status?: string | null
          target_package_id?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "upgrade_requests_current_subscription_id_fkey"
            columns: ["current_subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upgrade_requests_target_package_id_fkey"
            columns: ["target_package_id"]
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
          city: string | null
          country: string | null
          created_at: string
          event_type: string
          id: string
          is_unique: boolean | null
          link_name: string | null
          referrer: string | null
          session_id: string | null
          time_on_page: number | null
          user_agent: string | null
          vcard_id: string
          visitor_id: string | null
          visitor_ip: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          event_type: string
          id?: string
          is_unique?: boolean | null
          link_name?: string | null
          referrer?: string | null
          session_id?: string | null
          time_on_page?: number | null
          user_agent?: string | null
          vcard_id: string
          visitor_id?: string | null
          visitor_ip?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          event_type?: string
          id?: string
          is_unique?: boolean | null
          link_name?: string | null
          referrer?: string | null
          session_id?: string | null
          time_on_page?: number | null
          user_agent?: string | null
          vcard_id?: string
          visitor_id?: string | null
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
      vcard_appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          created_at: string
          id: string
          notes: string | null
          status: string | null
          updated_at: string
          vcard_id: string
          visitor_email: string
          visitor_name: string
          visitor_phone: string | null
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string
          vcard_id: string
          visitor_email: string
          visitor_name: string
          visitor_phone?: string | null
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string
          vcard_id?: string
          visitor_email?: string
          visitor_name?: string
          visitor_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vcard_appointments_vcard_id_fkey"
            columns: ["vcard_id"]
            isOneToOne: false
            referencedRelation: "vcards"
            referencedColumns: ["id"]
          },
        ]
      }
      vcard_custom_sections: {
        Row: {
          content: Json
          created_at: string
          id: string
          is_visible: boolean
          section_type: string
          sort_order: number
          title: string | null
          updated_at: string
          vcard_id: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          is_visible?: boolean
          section_type: string
          sort_order?: number
          title?: string | null
          updated_at?: string
          vcard_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          is_visible?: boolean
          section_type?: string
          sort_order?: number
          title?: string | null
          updated_at?: string
          vcard_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vcard_custom_sections_vcard_id_fkey"
            columns: ["vcard_id"]
            isOneToOne: false
            referencedRelation: "vcards"
            referencedColumns: ["id"]
          },
        ]
      }
      vcard_leads: {
        Row: {
          created_at: string
          id: string
          message: string | null
          metadata: Json | null
          notes: string | null
          source: string
          status: string
          tags: string[]
          updated_at: string
          user_id: string
          vcard_id: string
          visitor_email: string | null
          visitor_name: string
          visitor_phone: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          notes?: string | null
          source?: string
          status?: string
          tags?: string[]
          updated_at?: string
          user_id: string
          vcard_id: string
          visitor_email?: string | null
          visitor_name: string
          visitor_phone?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          notes?: string | null
          source?: string
          status?: string
          tags?: string[]
          updated_at?: string
          user_id?: string
          vcard_id?: string
          visitor_email?: string | null
          visitor_name?: string
          visitor_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vcard_leads_vcard_id_fkey"
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
          appointment_available_days: Json | null
          appointment_description: string | null
          appointment_duration_minutes: number | null
          appointment_email: string | null
          appointment_enabled: boolean | null
          appointment_end_time: string | null
          appointment_start_time: string | null
          appointment_title: string | null
          bio: string | null
          chat_enabled: boolean | null
          company: string | null
          cover_image_url: string | null
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
          payment_bank_details: string | null
          payment_bkash: string | null
          payment_button_text: string | null
          payment_enabled: boolean | null
          payment_nagad: string | null
          payment_rocket: string | null
          phone: string | null
          photo_url: string | null
          qr_background_color: string | null
          qr_foreground_color: string | null
          qr_logo_url: string | null
          slug: string | null
          telegram_username: string | null
          template: string | null
          twitter_url: string | null
          updated_at: string
          user_id: string
          website: string | null
          whatsapp_number: string | null
          youtube_url: string | null
        }
        Insert: {
          address?: string | null
          appointment_available_days?: Json | null
          appointment_description?: string | null
          appointment_duration_minutes?: number | null
          appointment_email?: string | null
          appointment_enabled?: boolean | null
          appointment_end_time?: string | null
          appointment_start_time?: string | null
          appointment_title?: string | null
          bio?: string | null
          chat_enabled?: boolean | null
          company?: string | null
          cover_image_url?: string | null
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
          payment_bank_details?: string | null
          payment_bkash?: string | null
          payment_button_text?: string | null
          payment_enabled?: boolean | null
          payment_nagad?: string | null
          payment_rocket?: string | null
          phone?: string | null
          photo_url?: string | null
          qr_background_color?: string | null
          qr_foreground_color?: string | null
          qr_logo_url?: string | null
          slug?: string | null
          telegram_username?: string | null
          template?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
          whatsapp_number?: string | null
          youtube_url?: string | null
        }
        Update: {
          address?: string | null
          appointment_available_days?: Json | null
          appointment_description?: string | null
          appointment_duration_minutes?: number | null
          appointment_email?: string | null
          appointment_enabled?: boolean | null
          appointment_end_time?: string | null
          appointment_start_time?: string | null
          appointment_title?: string | null
          bio?: string | null
          chat_enabled?: boolean | null
          company?: string | null
          cover_image_url?: string | null
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
          payment_bank_details?: string | null
          payment_bkash?: string | null
          payment_button_text?: string | null
          payment_enabled?: boolean | null
          payment_nagad?: string | null
          payment_rocket?: string | null
          phone?: string | null
          photo_url?: string | null
          qr_background_color?: string | null
          qr_foreground_color?: string | null
          qr_logo_url?: string | null
          slug?: string | null
          telegram_username?: string | null
          template?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
          whatsapp_number?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_referral_code: { Args: never; Returns: string }
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

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      admins: {
        Row: {
          id: string;
          auth_user_id: string;
          full_name: string | null;
          display_name: string | null;
          email: string;
          role: "owner" | "manager" | "order_staff" | "viewer";
          is_active: boolean;
          invited_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["admins"]["Row"]> & {
          auth_user_id: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["admins"]["Row"]>;
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name_ar: string;
          name_en: string | null;
          slug: string;
          description_ar: string | null;
          description_en: string | null;
          image_url: string | null;
          sort_order: number;
          is_active: boolean;
          is_featured: boolean;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["categories"]["Row"]> & {
          name_ar: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Row"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          category_id: string;
          name_ar: string;
          name_en: string | null;
          slug: string;
          short_description_ar: string | null;
          short_description_en: string | null;
          description_ar: string | null;
          description_en: string | null;
          price_omr: number;
          compare_at_price_omr: number | null;
          sku: string | null;
          stock_quantity: number;
          low_stock_threshold: number;
          track_stock: boolean;
          is_active: boolean;
          is_featured: boolean;
          is_best_seller: boolean;
          is_new_arrival: boolean;
          scent_family: string | null;
          intensity: string | null;
          size_label: string | null;
          origin_label: string | null;
          usage_ar: string | null;
          usage_en: string | null;
          occasion_ar: string | null;
          occasion_en: string | null;
          meta_title_ar: string | null;
          meta_title_en: string | null;
          meta_description_ar: string | null;
          meta_description_en: string | null;
          search_keywords_ar: string | null;
          search_keywords_en: string | null;
          weight_grams: number | null;
          volume_ml: number | null;
          burn_time: string | null;
          sort_order: number;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["products"]["Row"]> & {
          category_id: string;
          name_ar: string;
          slug: string;
          price_omr: number;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          storage_path: string;
          image_url: string | null;
          public_url: string | null;
          alt_text_ar: string | null;
          alt_text_en: string | null;
          sort_order: number;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["product_images"]["Row"]> & {
          product_id: string;
          storage_path: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_images"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      customers: {
        Row: {
          id: string;
          auth_user_id: string | null;
          full_name: string;
          phone: string;
          email: string | null;
          whatsapp_number: string | null;
          governorate: string | null;
          wilayat: string | null;
          area: string | null;
          detailed_address: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["customers"]["Row"]> & {
          full_name: string;
          phone: string;
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Row"]>;
        Relationships: [];
      };
      addresses: {
        Row: {
          id: string;
          customer_id: string;
          full_name: string | null;
          phone: string | null;
          country: string;
          governorate: string;
          wilayat: string;
          city: string | null;
          area: string | null;
          address_line_1: string;
          address_line_2: string | null;
          postal_code: string | null;
          delivery_notes: string | null;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["addresses"]["Row"]> & {
          customer_id: string;
          governorate: string;
          wilayat: string;
          address_line_1: string;
        };
        Update: Partial<Database["public"]["Tables"]["addresses"]["Row"]>;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_id: string;
          address_id: string;
          status: Database["public"]["Enums"]["order_status"];
          payment_method: Database["public"]["Enums"]["payment_method"];
          payment_status: Database["public"]["Enums"]["payment_status"];
          subtotal_omr: number;
          delivery_fee_omr: number;
          discount_omr: number;
          tax_omr: number;
          total_omr: number;
          coupon_code: string | null;
          shipping_zone_id: string | null;
          shipping_area: string | null;
          shipping_fee_omr: number;
          delivery_method: "pickup_office" | "home_delivery" | null;
          customer_name_snapshot: string;
          customer_phone_snapshot: string;
          delivery_address_snapshot: Json;
          customer_notes: string | null;
          admin_notes: string | null;
          stock_deducted_at: string | null;
          confirmed_at: string | null;
          completed_at: string | null;
          cancelled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["orders"]["Row"]> & {
          order_number: string;
          customer_id: string;
          address_id: string;
          payment_method: Database["public"]["Enums"]["payment_method"];
          customer_name_snapshot: string;
          customer_phone_snapshot: string;
          delivery_address_snapshot: Json;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Row"]>;
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          product_name_ar_snapshot: string;
          product_name_en_snapshot: string | null;
          sku_snapshot: string | null;
          unit_price_omr: number;
          quantity: number;
          line_total_omr: number;
          product_image_url_snapshot: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["order_items"]["Row"]> & {
          order_id: string;
          product_name_ar_snapshot: string;
          unit_price_omr: number;
          quantity: number;
          line_total_omr: number;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Row"]>;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          method: Database["public"]["Enums"]["payment_method"];
          status: Database["public"]["Enums"]["payment_status"];
          amount_omr: number;
          provider: string | null;
          provider_payment_id: string | null;
          provider_reference: string | null;
          provider_response: Json | null;
          paid_at: string | null;
          failed_at: string | null;
          refunded_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["payments"]["Row"]> & {
          order_id: string;
          method: Database["public"]["Enums"]["payment_method"];
          amount_omr: number;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Row"]>;
        Relationships: [];
      };
      coupons: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          discount_type: "percentage" | "fixed";
          discount_value: number;
          minimum_order_amount: number;
          maximum_discount_amount: number | null;
          usage_limit: number | null;
          used_count: number;
          starts_at: string | null;
          expires_at: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["coupons"]["Row"]> & {
          code: string;
          name: string;
          discount_type: "percentage" | "fixed";
          discount_value: number;
        };
        Update: Partial<Database["public"]["Tables"]["coupons"]["Row"]>;
        Relationships: [];
      };
      shipping_zones: {
        Row: {
          id: string;
          name: string;
          city: string;
          area: string;
          delivery_fee_omr: number;
          free_shipping_minimum_omr: number | null;
          estimated_delivery_time: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["shipping_zones"]["Row"]> & {
          name: string;
          city: string;
          area: string;
        };
        Update: Partial<Database["public"]["Tables"]["shipping_zones"]["Row"]>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          type: string;
          title: string;
          message: string;
          entity_type: string | null;
          entity_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["notifications"]["Row"]> & {
          type: string;
          title: string;
          message: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
        Relationships: [];
      };
      inventory_movements: {
        Row: {
          id: string;
          product_id: string;
          order_id: string | null;
          admin_id: string | null;
          movement_type: string;
          quantity_change: number;
          stock_before: number;
          stock_after: number;
          reason: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["inventory_movements"]["Row"]> & {
          product_id: string;
          movement_type: string;
          quantity_change: number;
          stock_before: number;
          stock_after: number;
        };
        Update: Partial<Database["public"]["Tables"]["inventory_movements"]["Row"]>;
        Relationships: [];
      };
      banners: {
        Row: {
          id: string;
          title_ar: string;
          title_en: string | null;
          subtitle_ar: string | null;
          subtitle_en: string | null;
          image_url: string;
          mobile_image_url: string | null;
          link_url: string | null;
          button_label_ar: string | null;
          button_label_en: string | null;
          placement: string;
          sort_order: number;
          is_active: boolean;
          starts_at: string | null;
          ends_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["banners"]["Row"]> & {
          title_ar: string;
          image_url: string;
          placement: string;
        };
        Update: Partial<Database["public"]["Tables"]["banners"]["Row"]>;
        Relationships: [];
      };
      store_settings: {
        Row: {
          id: string;
          store_name: string | null;
          store_description: string | null;
          store_email: string | null;
          store_phone: string | null;
          store_name_ar: string;
          store_name_en: string | null;
          contact_phone: string | null;
          whatsapp_number: string | null;
          support_email: string | null;
          instagram_url: string | null;
          tiktok_url: string | null;
          logo_url: string | null;
          favicon_url: string | null;
          snapchat_url: string | null;
          x_url: string | null;
          facebook_url: string | null;
          business_address_ar: string | null;
          business_address_en: string | null;
          delivery_fee_omr: number;
          free_delivery_threshold_omr: number | null;
          default_currency: string;
          currency_code: string;
          currency_symbol: string;
          tax_rate: number;
          is_tax_enabled: boolean;
          is_store_open: boolean;
          maintenance_message: string | null;
          order_prefix: string;
          minimum_order_amount: number;
          maintenance_message_ar: string | null;
          maintenance_message_en: string | null;
          brand_story_ar: string | null;
          brand_story_en: string | null;
          delivery_policy_ar: string | null;
          delivery_policy_en: string | null;
          returns_policy_ar: string | null;
          returns_policy_en: string | null;
          privacy_policy_ar: string | null;
          privacy_policy_en: string | null;
          terms_ar: string | null;
          terms_en: string | null;
          default_meta_title_ar: string | null;
          default_meta_title_en: string | null;
          default_meta_description_ar: string | null;
          default_meta_description_en: string | null;
          singleton_key: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["store_settings"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["store_settings"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      order_status:
        | "pending"
        | "confirmed"
        | "preparing"
        | "out_for_delivery"
        | "completed"
        | "cancelled";
      payment_method:
        | "cash_on_delivery"
        | "bank_transfer"
        | "manual_confirmation"
        | "tap_payments";
      payment_status: "pending" | "paid" | "failed" | "refunded" | "cancelled";
    };
    CompositeTypes: Record<string, never>;
  };
};

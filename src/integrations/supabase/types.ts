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
      messages: {
        Row: {
          body: string
          created_at: string
          email: string
          id: string
          lang: string
          name: string
          phone: string | null
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          email: string
          id?: string
          lang?: string
          name: string
          phone?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          email?: string
          id?: string
          lang?: string
          name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          name: string
          order_id: string
          product_id: string | null
          product_slug: string | null
          qty: number
          unit_price_cad: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          order_id: string
          product_id?: string | null
          product_slug?: string | null
          qty?: number
          unit_price_cad?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          order_id?: string
          product_id?: string | null
          product_slug?: string | null
          qty?: number
          unit_price_cad?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          code: string
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          id: string
          lang: string
          notes: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_cad: number
          updated_at: string
        }
        Insert: {
          code?: string
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          id?: string
          lang?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_cad?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          id?: string
          lang?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_cad?: number
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          cat: string
          created_at: string
          desc_en: string | null
          desc_es: string | null
          desc_fr: string | null
          dimensions: string | null
          id: string
          image_key: string | null
          image_url: string | null
          lead: string
          material_en: string | null
          material_es: string | null
          material_fr: string | null
          name_en: string
          name_es: string | null
          name_fr: string | null
          popular: boolean
          price_cad: number
          published: boolean
          rating: number
          review_count: number
          slug: string
          sort_order: number
          stock: number | null
          tag_en: string | null
          tag_es: string | null
          tag_fr: string | null
          updated_at: string
        }
        Insert: {
          cat: string
          created_at?: string
          desc_en?: string | null
          desc_es?: string | null
          desc_fr?: string | null
          dimensions?: string | null
          id?: string
          image_key?: string | null
          image_url?: string | null
          lead?: string
          material_en?: string | null
          material_es?: string | null
          material_fr?: string | null
          name_en: string
          name_es?: string | null
          name_fr?: string | null
          popular?: boolean
          price_cad?: number
          published?: boolean
          rating?: number
          review_count?: number
          slug: string
          sort_order?: number
          stock?: number | null
          tag_en?: string | null
          tag_es?: string | null
          tag_fr?: string | null
          updated_at?: string
        }
        Update: {
          cat?: string
          created_at?: string
          desc_en?: string | null
          desc_es?: string | null
          desc_fr?: string | null
          dimensions?: string | null
          id?: string
          image_key?: string | null
          image_url?: string | null
          lead?: string
          material_en?: string | null
          material_es?: string | null
          material_fr?: string | null
          name_en?: string
          name_es?: string | null
          name_fr?: string | null
          popular?: boolean
          price_cad?: number
          published?: boolean
          rating?: number
          review_count?: number
          slug?: string
          sort_order?: number
          stock?: number | null
          tag_en?: string | null
          tag_es?: string | null
          tag_fr?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          color: string | null
          created_at: string
          customer_email: string | null
          customer_name: string | null
          estimate_cad: number | null
          file_name: string | null
          id: string
          infill: string | null
          material: string | null
          notes: string | null
          qty: number
          quality: string | null
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
          volume_cm3: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          estimate_cad?: number | null
          file_name?: string | null
          id?: string
          infill?: string | null
          material?: string | null
          notes?: string | null
          qty?: number
          quality?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          volume_cm3?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          estimate_cad?: number | null
          file_name?: string | null
          id?: string
          infill?: string | null
          material?: string | null
          notes?: string | null
          qty?: number
          quality?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          volume_cm3?: number | null
        }
        Relationships: []
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
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "staff"
      order_status:
        | "nuevo"
        | "confirmado"
        | "produccion"
        | "listo"
        | "entregado"
        | "cancelado"
      request_status: "nuevo" | "en_proceso" | "cerrado"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "staff"],
      order_status: [
        "nuevo",
        "confirmado",
        "produccion",
        "listo",
        "entregado",
        "cancelado",
      ],
      request_status: ["nuevo", "en_proceso", "cerrado"],
    },
  },
} as const

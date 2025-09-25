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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      equipments: {
        Row: {
          acquisition_date: string | null
          card_height: number | null
          card_width: number | null
          code: string
          created_at: string | null
          description: string | null
          id: string
          location: string | null
          manufacturer: string | null
          name: string
          parent_id: string | null
          position_x: number | null
          position_y: number | null
          updated_at: string | null
        }
        Insert: {
          acquisition_date?: string | null
          card_height?: number | null
          card_width?: number | null
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          manufacturer?: string | null
          name: string
          parent_id?: string | null
          position_x?: number | null
          position_y?: number | null
          updated_at?: string | null
        }
        Update: {
          acquisition_date?: string | null
          card_height?: number | null
          card_width?: number | null
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          manufacturer?: string | null
          name?: string
          parent_id?: string | null
          position_x?: number | null
          position_y?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "equipments"
            referencedColumns: ["id"]
          },
        ]
      }
      maintainers: {
        Row: {
          active: boolean | null
          certifications: string[] | null
          contact: string | null
          created_at: string | null
          id: string
          name: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          certifications?: string[] | null
          contact?: string | null
          created_at?: string | null
          id?: string
          name: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          certifications?: string[] | null
          contact?: string | null
          created_at?: string | null
          id?: string
          name?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      maintenance_requests: {
        Row: {
          created_at: string
          description: string
          equipment_id: string
          id: string
          priority: string | null
          rejection_reason: string | null
          requested_at: string
          requested_by: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          updated_at: string
          work_order_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          equipment_id: string
          id?: string
          priority?: string | null
          rejection_reason?: string | null
          requested_at?: string
          requested_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string
          work_order_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          equipment_id?: string
          id?: string
          priority?: string | null
          rejection_reason?: string | null
          requested_at?: string
          requested_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_requests_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      parts: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          equipment_id: string | null
          id: string
          minimum_stock: number | null
          name: string
          stock_quantity: number | null
          supplier: string | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          equipment_id?: string | null
          id?: string
          minimum_stock?: number | null
          name: string
          stock_quantity?: number | null
          supplier?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          equipment_id?: string | null
          id?: string
          minimum_stock?: number | null
          name?: string
          stock_quantity?: number | null
          supplier?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parts_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipments"
            referencedColumns: ["id"]
          },
        ]
      }
      parts_reminders: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          equipment_usage: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          equipment_usage: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          equipment_usage?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string
          role: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          role?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      purchase_requests: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          equipment_id: string | null
          id: string
          request_number: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          equipment_id?: string | null
          id?: string
          request_number: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          equipment_id?: string | null
          id?: string
          request_number?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_purchase_requests_equipment"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipments"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_maintainers: {
        Row: {
          id: string
          maintainer_id: string
          work_order_id: string
        }
        Insert: {
          id?: string
          maintainer_id: string
          work_order_id: string
        }
        Update: {
          id?: string
          maintainer_id?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_maintainers_maintainer_id_fkey"
            columns: ["maintainer_id"]
            isOneToOne: false
            referencedRelation: "maintainers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_maintainers_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_parts: {
        Row: {
          id: string
          part_id: string
          quantity_used: number
          work_order_id: string
        }
        Insert: {
          id?: string
          part_id: string
          quantity_used?: number
          work_order_id: string
        }
        Update: {
          id?: string
          part_id?: string
          quantity_used?: number
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_parts_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          code: string
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          equipment_id: string
          id: string
          machine_down: boolean | null
          priority: string | null
          scheduled_date: string
          started_at: string | null
          status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          code: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          equipment_id: string
          id?: string
          machine_down?: boolean | null
          priority?: string | null
          scheduled_date: string
          started_at?: string | null
          status?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          equipment_id?: string
          id?: string
          machine_down?: boolean | null
          priority?: string | null
          scheduled_date?: string
          started_at?: string | null
          status?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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

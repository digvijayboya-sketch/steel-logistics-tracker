// Auto-generated from Supabase schema – regenerate with the Supabase MCP
// generate_typescript_types tool (or `npx supabase gen types typescript --project-id <id>`).
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
      audit_log: {
        Row: {
          changed_at: string
          changed_by: string
          entity: string
          entity_id: string
          field: string
          id: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          changed_at?: string
          changed_by: string
          entity: string
          entity_id: string
          field: string
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string
          entity?: string
          entity_id?: string
          field?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          city: string
          id: string
          name: string
        }
        Insert: {
          city?: string
          id?: string
          name: string
        }
        Update: {
          city?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          authorised_by_office: boolean
          change_reason: string | null
          created_at: string
          created_by: string
          customer_name: string
          delivered_at: string
          delivery_address: string
          delivery_status: Database["public"]["Enums"]["delivery_status"]
          destination_changed: boolean
          final_lat: number | null
          final_lng: number | null
          id: string
          job_id: string
          new_destination: string | null
          old_destination: string | null
          partial_reason: string | null
          unloaded_photo_url: string | null
          vehicle_number: string
        }
        Insert: {
          authorised_by_office?: boolean
          change_reason?: string | null
          created_at?: string
          created_by: string
          customer_name: string
          delivered_at?: string
          delivery_address: string
          delivery_status?: Database["public"]["Enums"]["delivery_status"]
          destination_changed?: boolean
          final_lat?: number | null
          final_lng?: number | null
          id?: string
          job_id: string
          new_destination?: string | null
          old_destination?: string | null
          partial_reason?: string | null
          unloaded_photo_url?: string | null
          vehicle_number: string
        }
        Update: {
          authorised_by_office?: boolean
          change_reason?: string | null
          created_at?: string
          created_by?: string
          customer_name?: string
          delivered_at?: string
          delivery_address?: string
          delivery_status?: Database["public"]["Enums"]["delivery_status"]
          destination_changed?: boolean
          final_lat?: number | null
          final_lng?: number | null
          id?: string
          job_id?: string
          new_destination?: string | null
          old_destination?: string | null
          partial_reason?: string | null
          unloaded_photo_url?: string | null
          vehicle_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_orders: {
        Row: {
          created_at: string
          created_by: string
          do_number: string
          document_url: string | null
          expected_collection_date: string
          id: string
          source_service_centre_id: string
          status: Database["public"]["Enums"]["do_status"]
          supplier_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          do_number: string
          document_url?: string | null
          expected_collection_date: string
          id?: string
          source_service_centre_id: string
          status?: Database["public"]["Enums"]["do_status"]
          supplier_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          do_number?: string
          document_url?: string | null
          expected_collection_date?: string
          id?: string
          source_service_centre_id?: string
          status?: Database["public"]["Enums"]["do_status"]
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_orders_source_service_centre_id_fkey"
            columns: ["source_service_centre_id"]
            isOneToOne: false
            referencedRelation: "service_centres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      do_items: {
        Row: {
          coil_grade: string
          do_id: string
          id: string
          quantity: number
          thickness_mm: number
          weight_mt: number
          width_mm: number
        }
        Insert: {
          coil_grade: string
          do_id: string
          id?: string
          quantity?: number
          thickness_mm: number
          weight_mt: number
          width_mm: number
        }
        Update: {
          coil_grade?: string
          do_id?: string
          id?: string
          quantity?: number
          thickness_mm?: number
          weight_mt?: number
          width_mm?: number
        }
        Relationships: [
          {
            foreignKeyName: "do_items_do_id_fkey"
            columns: ["do_id"]
            isOneToOne: false
            referencedRelation: "delivery_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount_inr: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          gps_lat: number | null
          gps_lng: number | null
          id: string
          job_id: string
          logged_by: string
          payee_description: string
          photo_url: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          settlement_method: Database["public"]["Enums"]["settlement_method"]
          status: Database["public"]["Enums"]["expense_status"]
        }
        Insert: {
          amount_inr: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          job_id: string
          logged_by: string
          payee_description: string
          photo_url?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          settlement_method: Database["public"]["Enums"]["settlement_method"]
          status?: Database["public"]["Enums"]["expense_status"]
        }
        Update: {
          amount_inr?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          job_id?: string
          logged_by?: string
          payee_description?: string
          photo_url?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          settlement_method?: Database["public"]["Enums"]["settlement_method"]
          status?: Database["public"]["Enums"]["expense_status"]
        }
        Relationships: [
          {
            foreignKeyName: "expenses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_logged_by_fkey"
            columns: ["logged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          assigned_agent_id: string | null
          created_at: string
          created_by: string
          customer_id: string
          delivery_destination: string
          do_id: string
          id: string
          job_number: string
          packing_type: string | null
          planned_delivery_date: string | null
          processing_instructions: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string
        }
        Insert: {
          assigned_agent_id?: string | null
          created_at?: string
          created_by: string
          customer_id: string
          delivery_destination: string
          do_id: string
          id?: string
          job_number: string
          packing_type?: string | null
          planned_delivery_date?: string | null
          processing_instructions?: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
        }
        Update: {
          assigned_agent_id?: string | null
          created_at?: string
          created_by?: string
          customer_id?: string
          delivery_destination?: string
          do_id?: string
          id?: string
          job_number?: string
          packing_type?: string | null
          planned_delivery_date?: string | null
          processing_instructions?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_do_id_fkey"
            columns: ["do_id"]
            isOneToOne: false
            referencedRelation: "delivery_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      queue_updates: {
        Row: {
          checkin_time: string
          created_at: string
          estimated_processing_minutes: number | null
          gps_lat: number | null
          gps_lng: number | null
          id: string
          job_id: string
          logged_by: string
          notes: string | null
          processing_completed_at: string | null
          processing_started_at: string | null
          queue_number: string | null
          service_centre_id: string
          service_type: Database["public"]["Enums"]["service_type"]
        }
        Insert: {
          checkin_time?: string
          created_at?: string
          estimated_processing_minutes?: number | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          job_id: string
          logged_by: string
          notes?: string | null
          processing_completed_at?: string | null
          processing_started_at?: string | null
          queue_number?: string | null
          service_centre_id: string
          service_type: Database["public"]["Enums"]["service_type"]
        }
        Update: {
          checkin_time?: string
          created_at?: string
          estimated_processing_minutes?: number | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          job_id?: string
          logged_by?: string
          notes?: string | null
          processing_completed_at?: string | null
          processing_started_at?: string | null
          queue_number?: string | null
          service_centre_id?: string
          service_type?: Database["public"]["Enums"]["service_type"]
        }
        Relationships: [
          {
            foreignKeyName: "queue_updates_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_updates_logged_by_fkey"
            columns: ["logged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_updates_service_centre_id_fkey"
            columns: ["service_centre_id"]
            isOneToOne: false
            referencedRelation: "service_centres"
            referencedColumns: ["id"]
          },
        ]
      }
      service_centres: {
        Row: {
          city: string
          id: string
          name: string
        }
        Insert: {
          city?: string
          id?: string
          name: string
        }
        Update: {
          city?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_role: { Args: Record<PropertyKey, never>; Returns: string }
      my_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      delivery_status: "planned" | "partial" | "delivered" | "redirected"
      do_status:
        | "draft"
        | "active"
        | "partially_dispatched"
        | "fully_dispatched"
        | "closed"
        | "cancelled"
      expense_category:
        | "packing_materials"
        | "worker_incentive"
        | "sc_extra_charge"
        | "miscellaneous"
        | "fuel"
        | "toll"
        | "lodging"
        | "labour"
        | "repair"
      expense_status: "pending" | "approved" | "rejected"
      job_status:
        | "assigned"
        | "acknowledged"
        | "at_service_centre"
        | "processing"
        | "processing_done"
        | "in_transit_to_customer"
        | "delivered"
        | "cancelled"
      service_type: "ctl" | "slitting" | "packing_only" | "coil_to_coil"
      settlement_method:
        | "agent_reimbursable"
        | "add_to_sc_invoice"
        | "add_to_supplier_bill"
      user_role: "admin" | "planner" | "purchase" | "agent"
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
      delivery_status: ["planned", "partial", "delivered", "redirected"],
      do_status: [
        "draft",
        "active",
        "partially_dispatched",
        "fully_dispatched",
        "closed",
        "cancelled",
      ],
      expense_category: [
        "packing_materials",
        "worker_incentive",
        "sc_extra_charge",
        "miscellaneous",
        "fuel",
        "toll",
        "lodging",
        "labour",
        "repair",
      ],
      expense_status: ["pending", "approved", "rejected"],
      job_status: [
        "assigned",
        "acknowledged",
        "at_service_centre",
        "processing",
        "processing_done",
        "in_transit_to_customer",
        "delivered",
        "cancelled",
      ],
      service_type: ["ctl", "slitting", "packing_only", "coil_to_coil"],
      settlement_method: [
        "agent_reimbursable",
        "add_to_sc_invoice",
        "add_to_supplier_bill",
      ],
      user_role: ["admin", "planner", "purchase", "agent"],
    },
  },
} as const

// Flat aliases kept for callers that import specific status/enum types directly
// (e.g. src/lib/api.ts) instead of going through Database["public"]["Enums"].
export type UserRole = Enums<"user_role">
export type DOStatus = Enums<"do_status">
export type JobStatus = Enums<"job_status">
export type ServiceTypeDB = Enums<"service_type">
export type ExpenseCategory = Enums<"expense_category">
export type SettlementMethod = Enums<"settlement_method">
export type ExpenseStatus = Enums<"expense_status">
export type DeliveryStatus = Enums<"delivery_status">

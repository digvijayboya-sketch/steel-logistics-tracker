// Auto-generated from Supabase schema – regenerate with:
// npx supabase gen types typescript --project-id <project-id> > src/lib/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type UserRole         = 'admin' | 'planner' | 'purchase' | 'agent'
export type DOStatus         = 'draft' | 'active' | 'partially_dispatched' | 'fully_dispatched' | 'closed'
export type JobStatus        = 'assigned' | 'acknowledged' | 'at_service_centre' | 'processing' | 'processing_done' | 'in_transit_to_customer' | 'delivered' | 'cancelled'
export type ServiceTypeDB    = 'ctl' | 'slitting' | 'packing_only' | 'coil_to_coil'
export type ExpenseCategory  = 'packing_materials' | 'worker_incentive' | 'sc_extra_charge' | 'miscellaneous'
export type SettlementMethod = 'agent_reimbursable' | 'add_to_sc_invoice' | 'add_to_supplier_bill'
export type ExpenseStatus    = 'pending' | 'approved' | 'rejected'
export type DeliveryStatus   = 'planned' | 'partial' | 'delivered' | 'redirected'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; full_name: string; role: UserRole; phone: string | null; created_at: string }
        Insert: { id: string; full_name: string; role?: UserRole; phone?: string | null }
        Update: { full_name?: string; role?: UserRole; phone?: string | null }
      }
      suppliers: {
        Row: { id: string; name: string }
        Insert: { id?: string; name: string }
        Update: { name?: string }
      }
      service_centres: {
        Row: { id: string; name: string; city: string }
        Insert: { id?: string; name: string; city: string }
        Update: { name?: string; city?: string }
      }
      customers: {
        Row: { id: string; name: string; city: string }
        Insert: { id?: string; name: string; city: string }
        Update: { name?: string; city?: string }
      }
      delivery_orders: {
        Row: {
          id: string; do_number: string; supplier_id: string
          source_service_centre_id: string; expected_collection_date: string
          status: DOStatus; document_url: string | null
          created_by: string; created_at: string; updated_at: string
        }
        Insert: {
          id?: string; do_number: string; supplier_id: string
          source_service_centre_id: string; expected_collection_date: string
          status?: DOStatus; document_url?: string | null; created_by: string
        }
        Update: { status?: DOStatus; document_url?: string | null; updated_at?: string }
      }
      do_items: {
        Row: { id: string; do_id: string; coil_grade: string; thickness_mm: number; width_mm: number; quantity: number; weight_mt: number }
        Insert: { id?: string; do_id: string; coil_grade: string; thickness_mm: number; width_mm: number; quantity: number; weight_mt: number }
        Update: { coil_grade?: string; thickness_mm?: number; width_mm?: number; quantity?: number; weight_mt?: number }
      }
      jobs: {
        Row: {
          id: string; job_number: string; do_id: string; customer_id: string
          delivery_destination: string; processing_instructions: string | null
          service_type: ServiceTypeDB; packing_type: string | null
          assigned_agent_id: string | null; planned_delivery_date: string | null
          status: JobStatus; created_by: string; created_at: string; updated_at: string
        }
        Insert: {
          id?: string; job_number: string; do_id: string; customer_id: string
          delivery_destination: string; processing_instructions?: string | null
          service_type: ServiceTypeDB; packing_type?: string | null
          assigned_agent_id?: string | null; planned_delivery_date?: string | null
          status?: JobStatus; created_by: string
        }
        Update: {
          delivery_destination?: string; processing_instructions?: string | null
          packing_type?: string | null; assigned_agent_id?: string | null
          planned_delivery_date?: string | null; status?: JobStatus; updated_at?: string
        }
      }
      queue_updates: {
        Row: {
          id: string; job_id: string; service_centre_id: string; service_type: ServiceTypeDB
          queue_number: string | null; checkin_time: string
          estimated_processing_minutes: number | null
          processing_started_at: string | null; processing_completed_at: string | null
          notes: string | null; gps_lat: number | null; gps_lng: number | null
          logged_by: string; created_at: string
        }
        Insert: {
          id?: string; job_id: string; service_centre_id: string; service_type: ServiceTypeDB
          queue_number?: string | null; checkin_time?: string
          estimated_processing_minutes?: number | null
          processing_started_at?: string | null; processing_completed_at?: string | null
          notes?: string | null; gps_lat?: number | null; gps_lng?: number | null
          logged_by: string
        }
        Update: {
          queue_number?: string | null; estimated_processing_minutes?: number | null
          processing_started_at?: string | null; processing_completed_at?: string | null
          notes?: string | null
        }
      }
      expenses: {
        Row: {
          id: string; job_id: string; category: ExpenseCategory; amount_inr: number
          payee_description: string; settlement_method: SettlementMethod
          status: ExpenseStatus; photo_url: string | null
          gps_lat: number | null; gps_lng: number | null
          review_notes: string | null; logged_by: string
          reviewed_by: string | null; reviewed_at: string | null; created_at: string
        }
        Insert: {
          id?: string; job_id: string; category: ExpenseCategory; amount_inr: number
          payee_description: string; settlement_method: SettlementMethod
          status?: ExpenseStatus; photo_url?: string | null
          gps_lat?: number | null; gps_lng?: number | null; logged_by: string
        }
        Update: {
          status?: ExpenseStatus; review_notes?: string | null
          reviewed_by?: string | null; reviewed_at?: string | null
        }
      }
      deliveries: {
        Row: {
          id: string; job_id: string; customer_name: string; delivery_address: string
          vehicle_number: string; delivered_at: string; delivery_status: DeliveryStatus
          unloaded_photo_url: string | null; final_lat: number | null; final_lng: number | null
          destination_changed: boolean; old_destination: string | null
          new_destination: string | null; change_reason: string | null
          authorised_by_office: boolean; created_by: string; created_at: string
        }
        Insert: {
          id?: string; job_id: string; customer_name: string; delivery_address: string
          vehicle_number: string; delivered_at: string; delivery_status?: DeliveryStatus
          unloaded_photo_url?: string | null; final_lat?: number | null; final_lng?: number | null
          destination_changed?: boolean; old_destination?: string | null
          new_destination?: string | null; change_reason?: string | null
          authorised_by_office?: boolean; created_by: string
        }
        Update: { delivery_status?: DeliveryStatus; unloaded_photo_url?: string | null }
      }
      audit_log: {
        Row: { id: string; entity: string; entity_id: string; field: string; old_value: string | null; new_value: string | null; changed_by: string; changed_at: string }
        Insert: { id?: string; entity: string; entity_id: string; field: string; old_value?: string | null; new_value?: string | null; changed_by: string }
        Update: never
      }
    }
    Views: {}
    Functions: {
      my_role: { Args: {}; Returns: UserRole }
    }
    Enums: {
      user_role: UserRole; do_status: DOStatus; job_status: JobStatus
      service_type: ServiceTypeDB; expense_category: ExpenseCategory
      settlement_method: SettlementMethod; expense_status: ExpenseStatus
      delivery_status: DeliveryStatus
    }
  }
}

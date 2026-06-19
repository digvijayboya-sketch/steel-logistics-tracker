export type UserRole = 'admin' | 'planner' | 'purchase' | 'agent'
export type DOStatus = 'draft' | 'active' | 'partially_dispatched' | 'fully_dispatched' | 'closed'
export type JobStatus = 'assigned' | 'acknowledged' | 'at_service_centre' | 'processing' | 'processing_done' | 'in_transit_to_customer' | 'delivered' | 'cancelled'
export type ServiceType = 'ctl' | 'slitting' | 'packing_only' | 'coil_to_coil'
export type ExpenseCategory = 'packing_materials' | 'worker_incentive' | 'sc_extra_charge' | 'miscellaneous'
export type SettlementMethod = 'agent_reimbursable' | 'add_to_sc_invoice' | 'add_to_supplier_bill'
export type ExpenseStatus = 'pending' | 'approved' | 'rejected'
export type DeliveryStatus = 'planned' | 'partial' | 'delivered' | 'redirected'

export interface Supplier { id:string; name:string }
export interface ServiceCentre { id:string; name:string; city:string }
export interface Customer { id:string; name:string; city:string }
export interface Profile { id:string; full_name:string; role:UserRole; phone?:string }

export interface DeliveryOrderItem {
  id:string
  coil_grade:string
  thickness_mm:number
  width_mm:number
  quantity:number
  weight_mt:number
}

export interface DeliveryOrder {
  id:string
  do_number:string
  supplier_id:string
  source_service_centre_id:string
  expected_collection_date:string
  status:DOStatus
  items:DeliveryOrderItem[]
  document_url?:string
  created_at:string
  supplier?:Supplier
  source_service_centre?:ServiceCentre
}

export interface Job {
  id:string
  job_number:string
  do_id:string
  customer_id:string
  customer_name?:string
  delivery_destination:string
  processing_instructions:string
  service_type:ServiceType
  packing_type:string
  assigned_agent_id?:string
  planned_delivery_date?:string
  status:JobStatus
  created_at:string
  do?:DeliveryOrder
  customer?:Customer
  assigned_agent?:Profile
  queue_updates?:QueueUpdate[]
  expenses?:Expense[]
  deliveries?:Delivery[]
}

export interface QueueUpdate {
  id:string
  job_id:string
  service_centre_id:string
  service_type:ServiceType
  queue_number?:string
  checkin_time:string
  estimated_processing_minutes?:number
  processing_started_at?:string
  processing_completed_at?:string
  notes?:string
  logged_by:string
  created_at:string
  service_centre?:ServiceCentre
}

export interface Expense {
  id:string
  job_id:string
  category:ExpenseCategory
  amount_inr:number
  payee_description:string
  settlement_method:SettlementMethod
  status:ExpenseStatus
  photo_url?:string
  gps_lat?:number
  gps_lng?:number
  review_notes?:string
  logged_by:string
  reviewed_by?:string
  reviewed_at?:string
  created_at:string
  logged_by_profile?:Profile
}

export interface Delivery {
  id:string
  job_id:string
  customer_name:string
  delivery_address:string
  vehicle_number:string
  delivered_at:string
  delivery_status:DeliveryStatus
  unloaded_photo_url?:string
  final_lat?:number
  final_lng?:number
  destination_changed?:boolean
  old_destination?:string
  new_destination?:string
  change_reason?:string
  authorised_by_office?:boolean
  created_by:string
  created_at:string
}

export const DO_STATUS_LABELS: Record<DOStatus, string> = {
  draft: 'Draft', active: 'Active', partially_dispatched: 'Partially Dispatched', fully_dispatched: 'Fully Dispatched', closed: 'Closed'
}
export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  assigned: 'Assigned', acknowledged: 'Acknowledged', at_service_centre: 'At Service Centre', processing: 'Processing', processing_done: 'Processing Done', in_transit_to_customer: 'In Transit', delivered: 'Delivered', cancelled: 'Cancelled'
}
export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  ctl: 'Cut-to-Length', slitting: 'Slitting', packing_only: 'Packing Only', coil_to_coil: 'Coil-to-Coil'
}
export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  packing_materials: 'Packing Materials', worker_incentive: 'Worker Incentive', sc_extra_charge: 'SC Extra Charge', miscellaneous: 'Miscellaneous'
}
export const SETTLEMENT_LABELS: Record<SettlementMethod, string> = {
  agent_reimbursable: 'Paid by Agent', add_to_sc_invoice: 'Added to SC Invoice', add_to_supplier_bill: 'Added to Supplier Bill'
}

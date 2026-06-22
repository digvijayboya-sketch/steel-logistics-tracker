import type { Supplier, ServiceCentre, Customer, Profile, DeliveryOrder, Job, Expense, QueueUpdate, Delivery } from '@/types'

export const DEMO_SUPPLIERS: Supplier[] = [
  { id:'s1', name:'JSW Steel Ltd.' },
  { id:'s2', name:'Tata Steel Processing & Distribution Ltd.' },
]

export const DEMO_SERVICE_CENTRES: ServiceCentre[] = [
  { id:'sc1', name:'Omkar CTL Centre', city:'Bhosari' },
  { id:'sc2', name:'Sai Slitting Works', city:'Talegaon' },
  { id:'sc3', name:'Shree Packing Hub', city:'Chakan' },
]

export const DEMO_CUSTOMERS: Customer[] = [
  { id:'c1', name:'AutoFab Components Pvt Ltd', city:'Chakan' },
  { id:'c2', name:'Precision Equipments', city:'Pimpri' },
]

export const DEMO_PROFILES: Profile[] = [
  { id:'u1', full_name:'Amit Kulkarni', role:'admin', phone:'9876543210' },
  { id:'u2', full_name:'Priya Shah', role:'purchase', phone:'9876500001' },
  { id:'u3', full_name:'Rohan Jagtap', role:'planner', phone:'9876500002' },
  { id:'u4', full_name:'Mahesh Patil', role:'agent', phone:'9876500003' },
  { id:'u5', full_name:'Sandeep More', role:'agent', phone:'9876500004' },
]

// Alias used by DODetailPage plan form
export const DEMO_AGENTS: Profile[] = DEMO_PROFILES.filter(p => p.role === 'agent')

export const DEMO_DOS: DeliveryOrder[] = [
  {
    id:'do1', do_number:'DO-2026-001', supplier_id:'s1', source_service_centre_id:'sc1',
    expected_collection_date:'2026-06-18', status:'partially_dispatched',
    document_url:'https://example.com/do1.pdf', created_at:'2026-06-17T09:00:00Z',
    supplier:DEMO_SUPPLIERS[0], source_service_centre:DEMO_SERVICE_CENTRES[0],
    items:[
      { id:'doi1', coil_grade:'CRCA IS513 D', thickness_mm:1.2, width_mm:1250, quantity:2, weight_mt:10.5 },
      { id:'doi2', coil_grade:'HRPO SAE1008', thickness_mm:2.0, width_mm:1500, quantity:1, weight_mt:8.2 },
    ]
  },
  {
    id:'do2', do_number:'DO-2026-002', supplier_id:'s2', source_service_centre_id:'sc2',
    expected_collection_date:'2026-06-17', status:'active', created_at:'2026-06-16T11:00:00Z',
    supplier:DEMO_SUPPLIERS[1], source_service_centre:DEMO_SERVICE_CENTRES[1],
    items:[
      { id:'doi3', coil_grade:'GP Zero Spangle', thickness_mm:0.8, width_mm:1219, quantity:3, weight_mt:12.0 },
    ]
  },
]

export const DEMO_EXPENSES: Expense[] = [
  { id:'e1', job_id:'j1', category:'packing_materials', amount_inr:2400, payee_description:'Wooden pallets – 4 nos @ ₹600', settlement_method:'agent_reimbursable', status:'pending', logged_by:'u4', created_at:'2026-06-18T11:30:00Z', logged_by_profile:DEMO_PROFILES[3] },
  { id:'e2', job_id:'j1', category:'worker_incentive', amount_inr:500, payee_description:'SC loading workers tip – 2 nos', settlement_method:'agent_reimbursable', status:'pending', logged_by:'u4', created_at:'2026-06-18T13:00:00Z', logged_by_profile:DEMO_PROFILES[3] },
  { id:'e3', job_id:'j2', category:'sc_extra_charge', amount_inr:1800, payee_description:'Slitting extra pass charge – Omkar SC', settlement_method:'add_to_sc_invoice', status:'approved', logged_by:'u5', reviewed_by:'u1', reviewed_at:'2026-06-17T16:00:00Z', created_at:'2026-06-17T14:00:00Z', logged_by_profile:DEMO_PROFILES[4] },
  { id:'e4', job_id:'j2', category:'packing_materials', amount_inr:960, payee_description:'Strapping strips – 3 bundles', settlement_method:'agent_reimbursable', status:'rejected', review_notes:'Strapping should be from company stock – do not purchase externally', logged_by:'u5', reviewed_by:'u1', reviewed_at:'2026-06-17T16:30:00Z', created_at:'2026-06-17T14:30:00Z', logged_by_profile:DEMO_PROFILES[4] },
]

export const DEMO_QUEUE: QueueUpdate[] = [
  { id:'q1', job_id:'j1', service_centre_id:'sc1', service_type:'ctl', queue_number:'Q-14', checkin_time:'2026-06-18T08:30:00Z', estimated_processing_minutes:120, processing_started_at:'2026-06-18T10:45:00Z', processing_completed_at:'2026-06-18T12:30:00Z', notes:'Had to wait – 2 jobs ahead', logged_by:'u4', created_at:'2026-06-18T08:30:00Z', service_centre:DEMO_SERVICE_CENTRES[0] },
  { id:'q2', job_id:'j1', service_centre_id:'sc3', service_type:'packing_only', queue_number:'Q-03', checkin_time:'2026-06-18T13:00:00Z', estimated_processing_minutes:45, processing_started_at:'2026-06-18T13:20:00Z', logged_by:'u4', created_at:'2026-06-18T13:00:00Z', service_centre:DEMO_SERVICE_CENTRES[2] },
  { id:'q3', job_id:'j2', service_centre_id:'sc2', service_type:'slitting', queue_number:'S-07', checkin_time:'2026-06-17T09:10:00Z', estimated_processing_minutes:180, logged_by:'u5', created_at:'2026-06-17T09:10:00Z', service_centre:DEMO_SERVICE_CENTRES[1] },
]

// Alias used by QueuePage
export const DEMO_QUEUE_UPDATES: QueueUpdate[] = DEMO_QUEUE

export const DEMO_DELIVERIES: Delivery[] = [
  { id:'d1', job_id:'j1', customer_name:'AutoFab Components Pvt Ltd', delivery_address:'Gate 3, MIDC Chakan Phase II, Pune', vehicle_number:'MH12AB1234', delivered_at:'2026-06-18T17:45:00Z', delivery_status:'partial', destination_changed:true, old_destination:'AutoFab Components, Chakan', new_destination:'AutoFab Components – Gate 3 Receiving Bay', change_reason:'Truck height restriction at original unloading point', authorised_by_office:true, created_by:'u4', created_at:'2026-06-18T17:50:00Z', final_lat:18.7601, final_lng:73.8467 },
]

export const DEMO_JOBS: Job[] = [
  {
    id:'j1', job_number:'JOB-001', do_id:'do1', customer_id:'c1',
    delivery_destination:'AutoFab Components, Chakan',
    processing_instructions:'2 coils CTL into 1250 x 2500; packing on wooden pallets; edge protectors needed.',
    service_type:'ctl', packing_type:'Pallet + Strips',
    assigned_agent_id:'u4', planned_delivery_date:'2026-06-18',
    status:'in_transit_to_customer', created_at:'2026-06-17T12:30:00Z',
    do:DEMO_DOS[0], customer:DEMO_CUSTOMERS[0], assigned_agent:DEMO_PROFILES[3],
    queue_updates:DEMO_QUEUE.filter(q=>q.job_id==='j1'),
    expenses:DEMO_EXPENSES.filter(e=>e.job_id==='j1'),
    deliveries:DEMO_DELIVERIES.filter(d=>d.job_id==='j1')
  },
  {
    id:'j2', job_number:'JOB-002', do_id:'do2', customer_id:'c2',
    delivery_destination:'Precision Equipments, Pimpri',
    processing_instructions:'Slit 1219 coil to 4 widths of 300 mm; brown paper wrap mandatory.',
    service_type:'slitting', packing_type:'Paper Wrap',
    assigned_agent_id:'u5', planned_delivery_date:'2026-06-19',
    status:'at_service_centre', created_at:'2026-06-16T14:00:00Z',
    do:DEMO_DOS[1], customer:DEMO_CUSTOMERS[1], assigned_agent:DEMO_PROFILES[4],
    queue_updates:DEMO_QUEUE.filter(q=>q.job_id==='j2'),
    expenses:DEMO_EXPENSES.filter(e=>e.job_id==='j2'),
    deliveries:[]
  },
]

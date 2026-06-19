-- ============================================================
-- Steel Logistics & Dispatch Tracker – Initial Schema
-- Run this in Supabase SQL Editor or via supabase db push
-- ============================================================

-- ── Extensions ────────────────────────────────────────────────
extension if not exists "uuid-ossp";

-- ── Enums ─────────────────────────────────────────────────────
create type user_role         as enum ('admin','planner','purchase','agent');
create type do_status         as enum ('draft','active','partially_dispatched','fully_dispatched','closed');
create type job_status        as enum ('assigned','acknowledged','at_service_centre','processing','processing_done','in_transit_to_customer','delivered','cancelled');
create type service_type      as enum ('ctl','slitting','packing_only','coil_to_coil');
create type expense_category  as enum ('packing_materials','worker_incentive','sc_extra_charge','miscellaneous');
create type settlement_method as enum ('agent_reimbursable','add_to_sc_invoice','add_to_supplier_bill');
create type expense_status    as enum ('pending','approved','rejected');
create type delivery_status   as enum ('planned','partial','delivered','redirected');

-- ── Lookup tables ─────────────────────────────────────────────
create table suppliers (
  id   uuid primary key default uuid_generate_v4(),
  name text not null
);

create table service_centres (
  id   uuid primary key default uuid_generate_v4(),
  name text not null,
  city text not null
);

create table customers (
  id   uuid primary key default uuid_generate_v4(),
  name text not null,
  city text not null
);

-- ── Profiles (extends auth.users) ─────────────────────────────
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text        not null,
  role       user_role   not null default 'agent',
  phone      text,
  created_at timestamptz not null default now()
);

-- Auto-create profile row when a user signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles(id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), 'agent');
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ── Delivery Orders ───────────────────────────────────────────
create table delivery_orders (
  id                       uuid primary key default uuid_generate_v4(),
  do_number                text        not null unique,
  supplier_id              uuid        not null references suppliers(id),
  source_service_centre_id uuid        not null references service_centres(id),
  expected_collection_date date        not null,
  status                   do_status   not null default 'draft',
  document_url             text,
  created_by               uuid        not null references profiles(id),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create table do_items (
  id           uuid    primary key default uuid_generate_v4(),
  do_id        uuid    not null references delivery_orders(id) on delete cascade,
  coil_grade   text    not null,
  thickness_mm numeric(6,2) not null,
  width_mm     numeric(8,2) not null,
  quantity     int     not null,
  weight_mt    numeric(10,3) not null
);

-- ── Jobs ──────────────────────────────────────────────────────
create table jobs (
  id                       uuid        primary key default uuid_generate_v4(),
  job_number               text        not null unique,
  do_id                    uuid        not null references delivery_orders(id),
  customer_id              uuid        not null references customers(id),
  delivery_destination     text        not null,
  processing_instructions  text,
  service_type             service_type not null,
  packing_type             text,
  assigned_agent_id        uuid        references profiles(id),
  planned_delivery_date    date,
  status                   job_status  not null default 'assigned',
  created_by               uuid        not null references profiles(id),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- ── Queue Updates ─────────────────────────────────────────────
create table queue_updates (
  id                           uuid        primary key default uuid_generate_v4(),
  job_id                       uuid        not null references jobs(id) on delete cascade,
  service_centre_id            uuid        not null references service_centres(id),
  service_type                 service_type not null,
  queue_number                 text,
  checkin_time                 timestamptz not null default now(),
  estimated_processing_minutes int,
  processing_started_at        timestamptz,
  processing_completed_at      timestamptz,
  notes                        text,
  gps_lat                      numeric(10,6),
  gps_lng                      numeric(10,6),
  logged_by                    uuid        not null references profiles(id),
  created_at                   timestamptz not null default now()
);

-- ── Expenses ──────────────────────────────────────────────────
create table expenses (
  id                 uuid              primary key default uuid_generate_v4(),
  job_id             uuid              not null references jobs(id) on delete cascade,
  category           expense_category  not null,
  amount_inr         numeric(12,2)     not null,
  payee_description  text              not null,
  settlement_method  settlement_method not null,
  status             expense_status    not null default 'pending',
  photo_url          text,
  gps_lat            numeric(10,6),
  gps_lng            numeric(10,6),
  review_notes       text,
  logged_by          uuid              not null references profiles(id),
  reviewed_by        uuid              references profiles(id),
  reviewed_at        timestamptz,
  created_at         timestamptz       not null default now()
);

-- ── Deliveries ────────────────────────────────────────────────
create table deliveries (
  id                   uuid            primary key default uuid_generate_v4(),
  job_id               uuid            not null references jobs(id) on delete cascade,
  customer_name        text            not null,
  delivery_address     text            not null,
  vehicle_number       text            not null,
  delivered_at         timestamptz     not null,
  delivery_status      delivery_status not null default 'planned',
  unloaded_photo_url   text,
  final_lat            numeric(10,6),
  final_lng            numeric(10,6),
  destination_changed  boolean         not null default false,
  old_destination      text,
  new_destination      text,
  change_reason        text,
  authorised_by_office boolean         not null default false,
  created_by           uuid            not null references profiles(id),
  created_at           timestamptz     not null default now()
);

-- ── Audit Log ─────────────────────────────────────────────────
create table audit_log (
  id         uuid        primary key default uuid_generate_v4(),
  entity     text        not null,
  entity_id  uuid        not null,
  field      text        not null,
  old_value  text,
  new_value  text,
  changed_by uuid        not null references profiles(id),
  changed_at timestamptz not null default now()
);
create index audit_log_entity_idx on audit_log(entity, entity_id);
create index audit_log_changed_by_idx on audit_log(changed_by);

-- ── updated_at triggers ───────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger delivery_orders_updated_at before update on delivery_orders for each row execute procedure set_updated_at();
create trigger jobs_updated_at            before update on jobs            for each row execute procedure set_updated_at();

-- ── Storage bucket (run separately in Dashboard or CLI) ───────
-- insert into storage.buckets(id,name,public) values ('expense-photos','expense-photos',false);
-- insert into storage.buckets(id,name,public) values ('do-documents','do-documents',false);

-- ── Row-Level Security ────────────────────────────────────────
alter table profiles          enable row level security;
alter table delivery_orders   enable row level security;
alter table do_items          enable row level security;
alter table jobs              enable row level security;
alter table queue_updates     enable row level security;
alter table expenses          enable row level security;
alter table deliveries        enable row level security;
alter table audit_log         enable row level security;
alter table suppliers         enable row level security;
alter table service_centres   enable row level security;
alter table customers         enable row level security;

-- Helper: get current user's role
create or replace function my_role()
returns user_role language sql security definer stable as $$
  select role from profiles where id = auth.uid();
$$;

-- Profiles: everyone reads their own; admin reads all
create policy "profiles_read_own"   on profiles for select using (id = auth.uid() or my_role() = 'admin');
create policy "profiles_read_agents" on profiles for select using (my_role() in ('admin','planner'));
create policy "profiles_insert"     on profiles for insert with check (id = auth.uid());
create policy "profiles_update_own" on profiles for update using (id = auth.uid());

-- Lookup tables: all authenticated users can read
create policy "suppliers_read"       on suppliers       for select using (auth.uid() is not null);
create policy "service_centres_read" on service_centres for select using (auth.uid() is not null);
create policy "customers_read"       on customers       for select using (auth.uid() is not null);
-- Only admin/purchase/planner can insert/update lookup tables
create policy "suppliers_write"       on suppliers       for all using (my_role() in ('admin','purchase'));
create policy "service_centres_write" on service_centres for all using (my_role() in ('admin','purchase','planner'));
create policy "customers_write"       on customers       for all using (my_role() in ('admin','planner'));

-- Delivery Orders: all authenticated users can read; purchase/admin can write
create policy "do_read"   on delivery_orders for select using (auth.uid() is not null);
create policy "do_write"  on delivery_orders for all   using (my_role() in ('admin','purchase'));
create policy "do_items_read"  on do_items for select using (auth.uid() is not null);
create policy "do_items_write" on do_items for all    using (my_role() in ('admin','purchase'));

-- Jobs: all read; planner/admin write; agent can update their own
create policy "jobs_read"         on jobs for select using (auth.uid() is not null);
create policy "jobs_write"        on jobs for insert using (my_role() in ('admin','planner'));
create policy "jobs_update_all"   on jobs for update using (my_role() in ('admin','planner'));
create policy "jobs_update_agent" on jobs for update using (assigned_agent_id = auth.uid());

-- Queue: agents log, everyone reads
create policy "queue_read"  on queue_updates for select using (auth.uid() is not null);
create policy "queue_write" on queue_updates for insert with check (logged_by = auth.uid());
create policy "queue_update" on queue_updates for update using (logged_by = auth.uid() or my_role() in ('admin','planner'));

-- Expenses: agents log their own, admin/planner approve all
create policy "expense_read_own"   on expenses for select using (logged_by = auth.uid() or my_role() in ('admin','planner'));
create policy "expense_insert"     on expenses for insert with check (logged_by = auth.uid());
create policy "expense_approve"    on expenses for update using (my_role() in ('admin','planner'));

-- Deliveries: agents write their own, all read
create policy "delivery_read"   on deliveries for select using (auth.uid() is not null);
create policy "delivery_insert" on deliveries for insert with check (created_by = auth.uid());
create policy "delivery_update" on deliveries for update using (created_by = auth.uid() or my_role() in ('admin','planner'));

-- Audit log: admin reads all, insert from server-side only (via service role)
create policy "audit_read"   on audit_log for select using (my_role() = 'admin');
create policy "audit_insert" on audit_log for insert with check (changed_by = auth.uid());

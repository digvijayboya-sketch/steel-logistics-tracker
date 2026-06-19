-- ============================================================
-- Seed data for local development / demo
-- Run AFTER the migration. Adjust IDs if needed.
-- ============================================================

insert into suppliers (id, name) values
  ('11111111-0000-0000-0000-000000000001', 'JSW Steel Ltd'),
  ('11111111-0000-0000-0000-000000000002', 'Tata Steel Ltd'),
  ('11111111-0000-0000-0000-000000000003', 'Shyam Metalics');

insert into service_centres (id, name, city) values
  ('22222222-0000-0000-0000-000000000001', 'Bhosari CTL Centre', 'Pune'),
  ('22222222-0000-0000-0000-000000000002', 'Talegaon Slitting Works', 'Pune'),
  ('22222222-0000-0000-0000-000000000003', 'Chakan Packing House', 'Pune');

insert into customers (id, name, city) values
  ('33333333-0000-0000-0000-000000000001', 'Godrej Industries', 'Mumbai'),
  ('33333333-0000-0000-0000-000000000002', 'Kirloskar Brothers', 'Pune'),
  ('33333333-0000-0000-0000-000000000003', 'Bajaj Auto Ltd', 'Pune');

-- Note: Profiles are auto-created via trigger when auth users sign up.
-- To seed demo users, create them via Supabase Auth Dashboard or CLI:
-- supabase auth admin create-user --email admin@steelco.in --password admin123 --user-metadata '{"full_name":"Amit Kulkarni"}'
-- Then UPDATE profiles SET role = 'admin' WHERE id = '<user-id>';

-- Phase 5: CreateDOPage's UI gate allows admin/purchase/planner to create a DO,
-- but no INSERT policy on delivery_orders or do_items allowed 'planner' —
-- a planner would fill out the whole form and get an RLS error on submit.
--
-- NOTE: there are two redundant, overlapping policy sets on these tables
-- (do_insert_purchase/dos_insert, do_items_insert/do_items_write_purchase)
-- from the undocumented rls_policies_triggers_v2 / fix_rls_admin_write_all_masters
-- migrations mentioned in 002's header comment. Both sets are patched here for
-- consistency rather than consolidated, to keep this a minimal, low-risk fix.

alter policy "do_insert_purchase" on delivery_orders
  with check (current_user_role() = any (array['admin','purchase','planner']));

alter policy "dos_insert" on delivery_orders
  with check (my_role() = any (array['admin','purchase','planner']::user_role[]));

alter policy "do_items_insert" on do_items
  with check (my_role() = any (array['admin','purchase','planner']::user_role[]));

alter policy "do_items_write_purchase" on do_items
  using (current_user_role() = any (array['admin','purchase','planner']));

-- Phase 3 (Agent Mobile Flows): field-relevant expense categories + delivery proof photos
--
-- NOTE: three migrations were applied directly to the live project between 001_initial_schema.sql
-- and this file (rls_policies_triggers_v2, fix_rls_admin_write_all_masters,
-- create_storage_buckets_and_policies — visible via `supabase migrations list` against the linked
-- project) but were never committed here. This file only captures the new Phase 3 changes; the
-- historical gap is a pre-existing repo/DB drift, not reconstructed retroactively.

-- Add field-relevant expense categories (additive; existing rows/values untouched)
alter type expense_category add value if not exists 'fuel';
alter type expense_category add value if not exists 'toll';
alter type expense_category add value if not exists 'lodging';
alter type expense_category add value if not exists 'labour';
alter type expense_category add value if not exists 'repair';

-- New storage bucket for delivery unload-proof photos (mirrors expense-photos: public, auth-gated writes)
insert into storage.buckets (id, name, public)
values ('delivery-proofs', 'delivery-proofs', true)
on conflict (id) do nothing;

create policy "delivery_proofs_insert" on storage.objects for insert
  with check (bucket_id = 'delivery-proofs' and auth.uid() is not null);
create policy "delivery_proofs_select" on storage.objects for select
  using (bucket_id = 'delivery-proofs' and auth.uid() is not null);
create policy "delivery_proofs_update" on storage.objects for update
  using (bucket_id = 'delivery-proofs' and auth.uid() is not null);

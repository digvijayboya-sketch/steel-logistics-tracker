-- Fix 1: 'cancelled' was never added to the do_status enum, but DODetailPage's
-- Cancel DO handler has always tried to set status='cancelled' (force-cast past
-- TypeScript with `as any`). This threw a real Postgres error on every attempt,
-- and only AFTER already cancelling the linked jobs as a side effect — leaving
-- inconsistent state (jobs cancelled, DO not).
alter type do_status add value if not exists 'cancelled';

-- Fix 2: there was no DELETE policy on delivery_orders at all, so the Delete
-- button's DB call silently affected 0 rows (Postgres RLS does not error on a
-- DELETE blocked entirely by policy) while the UI still navigated away as if
-- it succeeded. Restrict to admin, draft-only, matching the existing UI gate
-- (canDelete = isAdmin && isDraft).
create policy "dos_delete" on delivery_orders for delete
  using (my_role() = 'admin' and status = 'draft');

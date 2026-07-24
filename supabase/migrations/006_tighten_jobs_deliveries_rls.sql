-- The RLS audit found leftover blanket policies from the undocumented migrations
-- that let ANY authenticated user read/update ANY job, and read ANY delivery —
-- bypassing the PRD's explicit rule ("Agent: Own assigned Jobs only... Cannot see
-- other agents' jobs"). The app's UI already filters client-side, but that isn't
-- real security — a direct API call could bypass it. Traced every legitimate app
-- flow that touches these tables (queue check-in, delivery logging, admin
-- "logging on behalf of", job cancel cascade) and confirmed each is already
-- covered by the narrower ownership/role policies that remain, since
-- assigned_agent_id / created_by are always set to the true logical owner
-- (even when an admin submits on an agent's behalf) rather than relying on the
-- submitter's own auth.uid().
drop policy "jobs_read_all" on jobs;
drop policy "jobs_update_any" on jobs;
drop policy "deliveries_read_all" on deliveries;

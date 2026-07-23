-- Phase 3: required reason field for partial deliveries
alter table deliveries add column if not exists partial_reason text;

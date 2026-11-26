-- ============================================================
-- Migration 007: Allow 'lifetime' period in goals table
-- ============================================================
-- Run this migration in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/tjpestjbnpaocmpmggjv/sql/new
-- ============================================================

ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_period_check;
ALTER TABLE goals ADD CONSTRAINT goals_period_check
  CHECK (period IN ('weekly', 'monthly', 'yearly', 'lifetime'));

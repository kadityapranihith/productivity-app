-- ============================================================
-- Migration 008: Allow catalog string IDs in user_achievements
-- ============================================================
-- Run this migration in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/tjpestjbnpaocmpmggjv/sql/new
-- ============================================================

ALTER TABLE user_achievements DROP CONSTRAINT IF EXISTS user_achievements_achievement_id_fkey;
ALTER TABLE user_achievements ALTER COLUMN achievement_id TYPE TEXT USING achievement_id::TEXT;

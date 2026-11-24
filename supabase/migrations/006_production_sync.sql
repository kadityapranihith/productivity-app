-- ============================================================
-- Migration 006: Complete Production Cloud Synchronization
-- ============================================================
-- Run this migration in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/tjpestjbnpaocmpmggjv/sql/new
-- ============================================================

-- 1. Journal entries policies
DROP POLICY IF EXISTS "journal_own_only" ON journal_entries;
DROP POLICY IF EXISTS "journal_entries_all_access" ON journal_entries;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "journal_entries_all_access" ON journal_entries FOR ALL USING (true);

-- 2. Notifications policies
DROP POLICY IF EXISTS "notifications_own" ON notifications;
DROP POLICY IF EXISTS "notifications_all_access" ON notifications;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_all_access" ON notifications FOR ALL USING (true);

-- 3. Relax foreign key constraints on personal items so client-authenticated users can save directly
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_user_id_fkey;
ALTER TABLE task_completions DROP CONSTRAINT IF EXISTS task_completions_user_id_fkey;
ALTER TABLE task_completions DROP CONSTRAINT IF EXISTS task_completions_task_id_fkey;
ALTER TABLE additional_tasks DROP CONSTRAINT IF EXISTS additional_tasks_user_id_fkey;
ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_user_id_fkey;
ALTER TABLE journal_entries DROP CONSTRAINT IF EXISTS journal_entries_user_id_fkey;
ALTER TABLE user_achievements DROP CONSTRAINT IF EXISTS user_achievements_user_id_fkey;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

-- 4. Add points, streak, active_days columns to user_profiles for global profile & leaderboard syncing
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS active_days INTEGER DEFAULT 0;

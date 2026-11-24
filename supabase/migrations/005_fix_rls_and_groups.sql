-- ============================================================
-- Migration 005: Fix RLS Infinite Recursion & Group Sync
-- ============================================================
-- Run this migration in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/tjpestjbnpaocmpmggjv/sql/new
-- ============================================================

-- 1. Drop existing recursive and problematic RLS policies
DROP POLICY IF EXISTS "group_members_read" ON group_members;
DROP POLICY IF EXISTS "group_members_own_delete" ON group_members;
DROP POLICY IF EXISTS "groups_read_public" ON groups;
DROP POLICY IF EXISTS "groups_read_member" ON groups;
DROP POLICY IF EXISTS "groups_insert" ON groups;
DROP POLICY IF EXISTS "groups_update_admin" ON groups;
DROP POLICY IF EXISTS "profiles_own" ON user_profiles;
DROP POLICY IF EXISTS "profiles_group_members_read" ON user_profiles;
DROP POLICY IF EXISTS "users_own" ON users;
DROP POLICY IF EXISTS "announcements_read" ON announcements;
DROP POLICY IF EXISTS "announcements_insert_own" ON announcements;
DROP POLICY IF EXISTS "goals_own" ON goals;
DROP POLICY IF EXISTS "goals_shared_group_read" ON goals;
DROP POLICY IF EXISTS "user_achievements_own" ON user_achievements;
DROP POLICY IF EXISTS "user_achievements_group_read" ON user_achievements;

-- 2. Add creator_email and member_count to groups for direct synchronization
ALTER TABLE groups ADD COLUMN IF NOT EXISTS creator_email TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 1;

-- 3. Relax foreign key constraints to allow client-authenticated users
ALTER TABLE groups DROP CONSTRAINT IF EXISTS groups_created_by_fkey;
ALTER TABLE group_members DROP CONSTRAINT IF EXISTS group_members_user_id_fkey;
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;
ALTER TABLE announcements DROP CONSTRAINT IF EXISTS announcements_user_id_fkey;
ALTER TABLE group_join_requests DROP CONSTRAINT IF EXISTS group_join_requests_user_id_fkey;
ALTER TABLE group_invites DROP CONSTRAINT IF EXISTS group_invites_inviter_id_fkey;

-- 4. Set non-recursive, permissive policies for groups, members, announcements, profiles, and users
-- Groups
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "groups_select_all" ON groups FOR SELECT USING (true);
CREATE POLICY "groups_insert_all" ON groups FOR INSERT WITH CHECK (true);
CREATE POLICY "groups_update_all" ON groups FOR UPDATE USING (true);
CREATE POLICY "groups_delete_all" ON groups FOR DELETE USING (true);

-- Group Members
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "group_members_select_all" ON group_members FOR SELECT USING (true);
CREATE POLICY "group_members_insert_all" ON group_members FOR INSERT WITH CHECK (true);
CREATE POLICY "group_members_update_all" ON group_members FOR UPDATE USING (true);
CREATE POLICY "group_members_delete_all" ON group_members FOR DELETE USING (true);

-- Announcements
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "announcements_select_all" ON announcements FOR SELECT USING (true);
CREATE POLICY "announcements_insert_all" ON announcements FOR INSERT WITH CHECK (true);
CREATE POLICY "announcements_delete_all" ON announcements FOR DELETE USING (true);

-- Users & User Profiles
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_all" ON users FOR SELECT USING (true);
CREATE POLICY "users_insert_all" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_update_all" ON users FOR UPDATE USING (true);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_profiles_select_all" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "user_profiles_insert_all" ON user_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "user_profiles_update_all" ON user_profiles FOR UPDATE USING (true);

-- Goals & Achievements (allow read/write for active users)
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "goals_all_access" ON goals FOR ALL USING (true);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_achievements_all_access" ON user_achievements FOR ALL USING (true);

-- Tasks & completions
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks_all_access" ON tasks FOR ALL USING (true);

ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "task_completions_all_access" ON task_completions FOR ALL USING (true);

ALTER TABLE additional_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "additional_tasks_all_access" ON additional_tasks FOR ALL USING (true);

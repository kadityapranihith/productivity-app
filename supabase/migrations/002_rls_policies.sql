-- ============================================================
-- Migration 002: Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE additional_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper: get current user's internal UUID from Firebase JWT
-- ============================================================

CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
  SELECT id FROM users WHERE firebase_uid = auth.uid()::TEXT LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- users
-- ============================================================

CREATE POLICY "users_own" ON users
  FOR ALL USING (firebase_uid = auth.uid()::TEXT);

-- ============================================================
-- user_profiles — own full access; group members can read limited info
-- ============================================================

CREATE POLICY "profiles_own" ON user_profiles
  FOR ALL USING (user_id = current_user_id());

CREATE POLICY "profiles_group_members_read" ON user_profiles
  FOR SELECT USING (
    -- Viewer must be in at least one common group with profile owner
    EXISTS (
      SELECT 1 FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = current_user_id()
        AND gm2.user_id = user_profiles.user_id
    )
  );

-- ============================================================
-- tasks — strictly private
-- ============================================================

CREATE POLICY "tasks_own" ON tasks
  FOR ALL USING (user_id = current_user_id());

-- ============================================================
-- task_completions — strictly private
-- ============================================================

CREATE POLICY "completions_own" ON task_completions
  FOR ALL USING (user_id = current_user_id());

-- ============================================================
-- additional_tasks — strictly private
-- ============================================================

CREATE POLICY "additional_tasks_own" ON additional_tasks
  FOR ALL USING (user_id = current_user_id());

-- ============================================================
-- point_transactions — own read; aggregates visible via functions
-- ============================================================

CREATE POLICY "points_own" ON point_transactions
  FOR ALL USING (user_id = current_user_id());

-- ============================================================
-- achievements — readable by all authenticated users (catalog)
-- ============================================================

CREATE POLICY "achievements_read" ON achievements
  FOR SELECT USING (TRUE);

-- ============================================================
-- user_achievements — own full access; group members see earned badges
-- ============================================================

CREATE POLICY "user_achievements_own" ON user_achievements
  FOR ALL USING (user_id = current_user_id());

CREATE POLICY "user_achievements_group_read" ON user_achievements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = current_user_id()
        AND gm2.user_id = user_achievements.user_id
    )
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = user_achievements.user_id AND show_badges = TRUE
    )
  );

-- ============================================================
-- goals — private by default; shared goals visible to group members
-- ============================================================

CREATE POLICY "goals_own" ON goals
  FOR ALL USING (user_id = current_user_id());

CREATE POLICY "goals_shared_group_read" ON goals
  FOR SELECT USING (
    is_shared = TRUE
    AND EXISTS (
      SELECT 1 FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = current_user_id()
        AND gm2.user_id = goals.user_id
    )
  );

-- ============================================================
-- groups
-- ============================================================

CREATE POLICY "groups_read_public" ON groups
  FOR SELECT USING (visibility = 'public');

CREATE POLICY "groups_read_member" ON groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = groups.id AND user_id = current_user_id()
    )
  );

CREATE POLICY "groups_insert" ON groups
  FOR INSERT WITH CHECK (created_by = current_user_id());

CREATE POLICY "groups_update_admin" ON groups
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = groups.id AND user_id = current_user_id() AND role = 'admin'
    )
  );

-- ============================================================
-- group_members
-- ============================================================

CREATE POLICY "group_members_read" ON group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id AND gm.user_id = current_user_id()
    )
  );

CREATE POLICY "group_members_own_delete" ON group_members
  FOR DELETE USING (user_id = current_user_id());

-- ============================================================
-- group_join_requests
-- ============================================================

CREATE POLICY "join_requests_own" ON group_join_requests
  FOR ALL USING (user_id = current_user_id());

CREATE POLICY "join_requests_admin_read" ON group_join_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = group_join_requests.group_id
        AND user_id = current_user_id()
        AND role = 'admin'
    )
  );

-- ============================================================
-- journal_entries — STRICTLY PRIVATE, NO EXCEPTIONS
-- ============================================================

CREATE POLICY "journal_own_only" ON journal_entries
  FOR ALL USING (user_id = current_user_id());

-- ============================================================
-- announcements — readable by group members
-- ============================================================

CREATE POLICY "announcements_read" ON announcements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = announcements.group_id AND user_id = current_user_id()
    )
  );

CREATE POLICY "announcements_insert_own" ON announcements
  FOR INSERT WITH CHECK (
    user_id = current_user_id()
    AND EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = announcements.group_id AND user_id = current_user_id()
    )
  );

-- ============================================================
-- notifications
-- ============================================================

CREATE POLICY "notifications_own" ON notifications
  FOR ALL USING (user_id = current_user_id());

CREATE POLICY "notification_prefs_own" ON notification_preferences
  FOR ALL USING (user_id = current_user_id());

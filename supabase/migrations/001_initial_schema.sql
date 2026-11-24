-- ============================================================
-- Barely Productive — Supabase Database Schema
-- Migration: 001_initial_schema.sql
-- ============================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for text search

-- ============================================================
-- USERS & PROFILES
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid TEXT UNIQUE NOT NULL,
  email        TEXT UNIQUE NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name          TEXT NOT NULL,
  avatar_url            TEXT,
  bio                   TEXT,
  interests             TEXT[] DEFAULT '{}',
  -- Privacy settings
  show_heatmap          BOOLEAN DEFAULT TRUE,
  show_badges           BOOLEAN DEFAULT TRUE,
  show_streak           BOOLEAN DEFAULT TRUE,
  show_points           BOOLEAN DEFAULT TRUE,
  show_goals            BOOLEAN DEFAULT FALSE,
  announce_achievements BOOLEAN DEFAULT TRUE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TASKS
-- ============================================================

CREATE TABLE IF NOT EXISTS tasks (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title                  TEXT NOT NULL,
  description            TEXT,
  category               TEXT NOT NULL DEFAULT 'custom',
  normal_target          TEXT NOT NULL,
  normal_points          INTEGER NOT NULL DEFAULT 5 CHECK (normal_points >= 1 AND normal_points <= 20),
  min_target             TEXT NOT NULL,
  min_points             INTEGER NOT NULL DEFAULT 2 CHECK (min_points >= 1 AND min_points < normal_points),
  is_recurring           BOOLEAN DEFAULT TRUE,
  recurring_days         INTEGER[] DEFAULT '{1,2,3,4,5}', -- 0=Sun .. 6=Sat
  scheduled_date         DATE,
  counts_for_consistency BOOLEAN DEFAULT TRUE,
  is_active              BOOLEAN DEFAULT TRUE,
  sort_order             INTEGER DEFAULT 0,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_active ON tasks(user_id, is_active);

-- ============================================================
-- TASK COMPLETIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS task_completions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id        UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date           DATE NOT NULL,
  status         TEXT NOT NULL CHECK (status IN ('bare_minimum', 'normal')),
  points_awarded INTEGER NOT NULL,
  notes          TEXT,
  completed_at   TIMESTAMPTZ DEFAULT NOW(),
  -- Prevent double completion per task per day
  UNIQUE (task_id, date)
);

CREATE INDEX IF NOT EXISTS idx_task_completions_user_date ON task_completions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_task_completions_task_id ON task_completions(task_id);

-- ============================================================
-- ADDITIONAL TASKS
-- ============================================================

CREATE TABLE IF NOT EXISTS additional_tasks (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  title      TEXT NOT NULL,
  category   TEXT NOT NULL DEFAULT 'custom',
  points     INTEGER NOT NULL DEFAULT 1 CHECK (points >= 1 AND points <= 5),
  completed  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_additional_tasks_user_date ON additional_tasks(user_id, date);

-- ============================================================
-- POINT TRANSACTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS point_transactions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points         INTEGER NOT NULL,
  reason         TEXT NOT NULL,
  task_id        UUID REFERENCES tasks(id),
  achievement_id UUID,
  date           DATE NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_point_transactions_user ON point_transactions(user_id, date);

-- ============================================================
-- ACHIEVEMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS achievements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type        TEXT NOT NULL,
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  icon        TEXT NOT NULL,
  year        INTEGER,
  month       INTEGER CHECK (month IS NULL OR (month >= 1 AND month <= 12)),
  threshold   INTEGER,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id),
  earned_at      TIMESTAMPTZ DEFAULT NOW(),
  year           INTEGER,
  month          INTEGER,
  UNIQUE (user_id, achievement_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);

-- ============================================================
-- GOALS
-- ============================================================

CREATE TABLE IF NOT EXISTS goals (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  category      TEXT NOT NULL DEFAULT 'custom',
  period        TEXT NOT NULL CHECK (period IN ('weekly', 'monthly', 'yearly')),
  target_value  NUMERIC NOT NULL,
  current_value NUMERIC NOT NULL DEFAULT 0,
  unit          TEXT NOT NULL,
  deadline      DATE,
  is_shared     BOOLEAN DEFAULT FALSE,
  is_completed  BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);

-- ============================================================
-- GROUPS
-- ============================================================

CREATE TABLE IF NOT EXISTS groups (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  avatar_url  TEXT,
  visibility  TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('public', 'restricted', 'private')),
  invite_code TEXT UNIQUE,
  created_by  UUID NOT NULL REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_groups_visibility ON groups(visibility);
CREATE INDEX IF NOT EXISTS idx_groups_invite_code ON groups(invite_code);

CREATE TABLE IF NOT EXISTS group_members (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id  UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role      TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);

CREATE TABLE IF NOT EXISTS group_join_requests (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id   UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS group_invites (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id   UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES users(id),
  invitee_email TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- JOURNAL
-- ============================================================

CREATE TABLE IF NOT EXISTS journal_entries (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  title      TEXT,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journal_user_date ON journal_entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_journal_search ON journal_entries USING gin(to_tsvector('english', content));

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS announcements (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id   UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  type       TEXT NOT NULL DEFAULT 'achievement' CHECK (type IN ('achievement', 'milestone', 'general')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_group ON announcements(group_id, created_at DESC);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  read       BOOLEAN DEFAULT FALSE,
  data       JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read, created_at DESC);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_unlocked BOOLEAN DEFAULT TRUE,
  group_announcement   BOOLEAN DEFAULT TRUE,
  daily_reminder       BOOLEAN DEFAULT FALSE,
  weekly_summary       BOOLEAN DEFAULT FALSE,
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','user_profiles','tasks','goals','journal_entries']
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trig_updated_at ON %I;
      CREATE TRIGGER trig_updated_at
      BEFORE UPDATE ON %I
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    ', t, t);
  END LOOP;
END;
$$;

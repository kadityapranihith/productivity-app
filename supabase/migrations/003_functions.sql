-- ============================================================
-- Migration 003: PostgreSQL Functions (Business Logic)
-- ============================================================

-- ============================================================
-- complete_task: validate and award points for a task completion
-- Called by frontend via RPC. Never trust frontend points.
-- ============================================================

CREATE OR REPLACE FUNCTION complete_task(
  p_task_id UUID,
  p_date    DATE,
  p_level   TEXT -- 'normal' or 'bare_minimum'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := current_user_id();
  v_task    tasks%ROWTYPE;
  v_existing task_completions%ROWTYPE;
  v_points  INTEGER;
  v_completion_id UUID;
BEGIN
  -- Validate input
  IF p_level NOT IN ('normal', 'bare_minimum') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid completion level');
  END IF;

  -- Fetch task and verify ownership
  SELECT * INTO v_task FROM tasks
  WHERE id = p_task_id AND user_id = v_user_id AND is_active = TRUE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Task not found or not owned by user');
  END IF;

  -- Determine points (server-side, never trust client)
  v_points := CASE p_level
    WHEN 'normal'       THEN v_task.normal_points
    WHEN 'bare_minimum' THEN v_task.min_points
  END;

  -- Check if completion already exists
  SELECT * INTO v_existing FROM task_completions
  WHERE task_id = p_task_id AND date = p_date;

  IF FOUND THEN
    IF v_existing.status = 'normal' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Task already fully completed for this date');
    END IF;

    IF p_level = 'normal' AND v_existing.status = 'bare_minimum' THEN
      -- Upgrade: award only the difference
      DECLARE
        v_extra INTEGER := v_task.normal_points - v_task.min_points;
      BEGIN
        UPDATE task_completions
        SET status = 'normal', points_awarded = v_task.normal_points
        WHERE task_id = p_task_id AND date = p_date;

        INSERT INTO point_transactions (user_id, points, reason, task_id, date)
        VALUES (v_user_id, v_extra, 'Task upgrade: ' || v_task.title || ' (bare→normal)', p_task_id, p_date);

        RETURN jsonb_build_object('success', true, 'points', v_extra, 'upgraded', true);
      END;
    END IF;

    RETURN jsonb_build_object('success', false, 'error', 'Completion already exists');
  END IF;

  -- Insert completion
  INSERT INTO task_completions (task_id, user_id, date, status, points_awarded)
  VALUES (p_task_id, v_user_id, p_date, p_level, v_points)
  RETURNING id INTO v_completion_id;

  -- Record point transaction
  INSERT INTO point_transactions (user_id, points, reason, task_id, date)
  VALUES (v_user_id, v_points, 'Task completed: ' || v_task.title || ' (' || p_level || ')', p_task_id, p_date);

  -- Check achievements (async-compatible: just call the function)
  PERFORM check_and_award_achievements(v_user_id, p_date);

  RETURN jsonb_build_object(
    'success', true,
    'completion_id', v_completion_id,
    'points', v_points,
    'level', p_level
  );
END;
$$;

-- ============================================================
-- get_daily_summary: compute day status for a user
-- ============================================================

CREATE OR REPLACE FUNCTION get_daily_summary(
  p_user_id UUID,
  p_date    DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_day_of_week   INTEGER := EXTRACT(DOW FROM p_date);
  v_total_tasks   INTEGER := 0;
  v_normal_done   INTEGER := 0;
  v_bare_done     INTEGER := 0;
  v_points_earned INTEGER := 0;
  v_qualifies     BOOLEAN := FALSE;
  v_status        TEXT    := 'none';
  v_consistency_tasks INTEGER := 0;
  v_consistency_met   INTEGER := 0;
BEGIN
  -- Count scheduled tasks for this day
  SELECT COUNT(*) INTO v_total_tasks
  FROM tasks
  WHERE user_id = p_user_id
    AND is_active = TRUE
    AND (
      (is_recurring = TRUE AND v_day_of_week = ANY(recurring_days))
      OR (is_recurring = FALSE AND scheduled_date = p_date)
    );

  -- Count completions
  SELECT
    COUNT(*) FILTER (WHERE tc.status = 'normal'),
    COUNT(*) FILTER (WHERE tc.status = 'bare_minimum')
  INTO v_normal_done, v_bare_done
  FROM task_completions tc
  JOIN tasks t ON tc.task_id = t.id
  WHERE tc.user_id = p_user_id AND tc.date = p_date;

  -- Points
  SELECT COALESCE(SUM(points), 0) INTO v_points_earned
  FROM point_transactions
  WHERE user_id = p_user_id AND date = p_date;

  -- Determine overall status
  IF v_total_tasks = 0 THEN
    v_status := 'none';
  ELSIF (v_normal_done + v_bare_done) = 0 THEN
    v_status := 'none';
  ELSIF v_normal_done = v_total_tasks THEN
    v_status := 'normal';
  ELSIF (v_normal_done + v_bare_done) >= v_total_tasks THEN
    v_status := 'bare_minimum';
  ELSE
    v_status := 'none'; -- partial, doesn't qualify
  END IF;

  -- Consistency tasks check (only tasks with counts_for_consistency=TRUE)
  SELECT
    COUNT(*) FILTER (WHERE t.counts_for_consistency = TRUE),
    COUNT(*) FILTER (WHERE t.counts_for_consistency = TRUE AND tc.id IS NOT NULL)
  INTO v_consistency_tasks, v_consistency_met
  FROM tasks t
  LEFT JOIN task_completions tc ON tc.task_id = t.id AND tc.date = p_date
  WHERE t.user_id = p_user_id
    AND t.is_active = TRUE
    AND (
      (t.is_recurring = TRUE AND v_day_of_week = ANY(t.recurring_days))
      OR (t.is_recurring = FALSE AND t.scheduled_date = p_date)
    );

  v_qualifies := (v_consistency_tasks > 0 AND v_consistency_met >= v_consistency_tasks);

  RETURN jsonb_build_object(
    'date', p_date,
    'status', v_status,
    'normal_completed', v_normal_done,
    'bare_completed', v_bare_done,
    'total_tasks', v_total_tasks,
    'points_earned', v_points_earned,
    'qualifies_for_consistency', v_qualifies
  );
END;
$$;

-- ============================================================
-- get_user_streak: calculate current and longest streaks
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_streak(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_current_streak INTEGER := 0;
  v_longest_streak INTEGER := 0;
  v_streak_running INTEGER := 0;
  v_check_date     DATE := CURRENT_DATE;
  v_summary        JSONB;
BEGIN
  -- Walk backwards from today counting qualifying days
  LOOP
    v_summary := get_daily_summary(p_user_id, v_check_date);

    IF (v_summary->>'qualifies_for_consistency')::BOOLEAN THEN
      v_streak_running := v_streak_running + 1;
      IF v_streak_running > v_longest_streak THEN
        v_longest_streak := v_streak_running;
      END IF;
    ELSE
      -- Stop current streak
      IF v_check_date = CURRENT_DATE THEN
        v_current_streak := 0;
      ELSE
        EXIT; -- streak broken
      END IF;
      v_streak_running := 0;
    END IF;

    v_current_streak := v_streak_running;
    v_check_date := v_check_date - INTERVAL '1 day';

    EXIT WHEN v_check_date < (CURRENT_DATE - INTERVAL '400 days');
  END LOOP;

  RETURN jsonb_build_object(
    'current_streak', v_current_streak,
    'longest_streak', v_longest_streak
  );
END;
$$;

-- ============================================================
-- check_and_award_achievements
-- ============================================================

CREATE OR REPLACE FUNCTION check_and_award_achievements(
  p_user_id UUID,
  p_date    DATE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_year          INTEGER := EXTRACT(YEAR FROM p_date);
  v_month         INTEGER := EXTRACT(MONTH FROM p_date);
  v_active_days   INTEGER;
  v_month_complete BOOLEAN;
  v_milestone     INTEGER;
  v_ach_id        UUID;
BEGIN
  -- Count active days this year
  SELECT COUNT(*) INTO v_active_days
  FROM (
    SELECT DISTINCT date
    FROM task_completions tc
    JOIN tasks t ON tc.task_id = t.id
    WHERE tc.user_id = p_user_id
      AND EXTRACT(YEAR FROM tc.date) = v_year
      AND t.counts_for_consistency = TRUE
  ) sub;

  -- Check milestones: 50, 100, 200, 300
  FOREACH v_milestone IN ARRAY ARRAY[50, 100, 200, 300]
  LOOP
    IF v_active_days >= v_milestone THEN
      SELECT id INTO v_ach_id FROM achievements
      WHERE type = 'active_days_' || v_milestone::TEXT LIMIT 1;

      IF v_ach_id IS NOT NULL THEN
        INSERT INTO user_achievements (user_id, achievement_id, year)
        VALUES (p_user_id, v_ach_id, v_year)
        ON CONFLICT (user_id, achievement_id, year, month) DO NOTHING;
      END IF;
    END IF;
  END LOOP;

  -- Check monthly consistency: did user meet commitments every scheduled day this month?
  -- (Simplified: check if any day in month was missed among scheduled days)
  -- TODO: implement full monthly check in production
END;
$$;

-- ============================================================
-- get_group_leaderboard: aggregate points per group member
-- ============================================================

CREATE OR REPLACE FUNCTION get_group_leaderboard(
  p_group_id UUID,
  p_period   TEXT DEFAULT 'monthly' -- 'daily', 'weekly', 'monthly', 'alltime'
)
RETURNS TABLE(
  user_id      UUID,
  display_name TEXT,
  avatar_url   TEXT,
  points       BIGINT,
  rank         BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_start_date DATE;
BEGIN
  -- Verify caller is a member
  IF NOT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id AND user_id = current_user_id()
  ) THEN
    RAISE EXCEPTION 'Access denied: not a group member';
  END IF;

  v_start_date := CASE p_period
    WHEN 'daily'   THEN CURRENT_DATE
    WHEN 'weekly'  THEN DATE_TRUNC('week', CURRENT_DATE)::DATE
    WHEN 'monthly' THEN DATE_TRUNC('month', CURRENT_DATE)::DATE
    ELSE '2000-01-01'::DATE
  END;

  RETURN QUERY
  SELECT
    gm.user_id,
    up.display_name,
    up.avatar_url,
    COALESCE(SUM(pt.points), 0)::BIGINT AS points,
    RANK() OVER (ORDER BY COALESCE(SUM(pt.points), 0) DESC)::BIGINT AS rank
  FROM group_members gm
  JOIN user_profiles up ON up.user_id = gm.user_id
  LEFT JOIN point_transactions pt ON pt.user_id = gm.user_id AND pt.date >= v_start_date
  WHERE gm.group_id = p_group_id
    AND up.show_points = TRUE
  GROUP BY gm.user_id, up.display_name, up.avatar_url
  ORDER BY points DESC;
END;
$$;

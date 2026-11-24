-- ============================================================
-- Migration 004: Seed Data (Default Achievements & Milestone Catalog)
-- ============================================================

INSERT INTO achievements (type, name, description, icon, year, month, threshold)
VALUES
  -- 1. Yearly Active Day Milestones (independent of consecutive streak)
  ('active_days_50',  '50 Active Days',  'Completed your defined daily commitment on 50 different days in the calendar year.',  '🌱', NULL, NULL, 50),
  ('active_days_100', '100 Active Days', 'Completed your defined daily commitment on 100 different days in the calendar year.', '🌿', NULL, NULL, 100),
  ('active_days_200', '200 Active Days', 'Completed your defined daily commitment on 200 different days in the calendar year.', '🌳', NULL, NULL, 200),
  ('active_days_300', '300 Active Days', 'Completed your defined daily commitment on 300 different days in the calendar year.', '🏔️', NULL, NULL, 300),

  -- 2. Monthly Consistency Badges (12 calendar months for current & next year)
  ('monthly_consistency', 'January Consistency',   'Met your defined minimum daily commitment on every scheduled active day in January.',   '❄️', 2026, 1,  NULL),
  ('monthly_consistency', 'February Consistency',  'Met your defined minimum daily commitment on every scheduled active day in February.',  '💝', 2026, 2,  NULL),
  ('monthly_consistency', 'March Consistency',     'Met your defined minimum daily commitment on every scheduled active day in March.',     '🌸', 2026, 3,  NULL),
  ('monthly_consistency', 'April Consistency',     'Met your defined minimum daily commitment on every scheduled active day in April.',     '🌺', 2026, 4,  NULL),
  ('monthly_consistency', 'May Consistency',       'Met your defined minimum daily commitment on every scheduled active day in May.',       '🌻', 2026, 5,  NULL),
  ('monthly_consistency', 'June Consistency',      'Met your defined minimum daily commitment on every scheduled active day in June.',      '☀️', 2026, 6,  NULL),
  ('monthly_consistency', 'July Consistency',      'Met your defined minimum daily commitment on every scheduled active day in July.',      '🌊', 2026, 7,  NULL),
  ('monthly_consistency', 'August Consistency',    'Met your defined minimum daily commitment on every scheduled active day in August.',    '🌙', 2026, 8,  NULL),
  ('monthly_consistency', 'September Consistency', 'Met your defined minimum daily commitment on every scheduled active day in September.', '🍂', 2026, 9,  NULL),
  ('monthly_consistency', 'October Consistency',   'Met your defined minimum daily commitment on every scheduled active day in October.',   '🍁', 2026, 10, NULL),
  ('monthly_consistency', 'November Consistency',  'Met your defined minimum daily commitment on every scheduled active day in November.',  '🌨️', 2026, 11, NULL),
  ('monthly_consistency', 'December Consistency',  'Met your defined minimum daily commitment on every scheduled active day in December.',  '⭐', 2026, 12, NULL),

  -- 3. Full-Year Prestigious Annual Consistency Badge
  ('full_year_consistency', '2026 Full-Year Consistency', 'Met your defined minimum commitments on every scheduled active day throughout all of 2026.', '👑', 2026, NULL, NULL),
  ('full_year_consistency', '2027 Full-Year Consistency', 'Met your defined minimum commitments on every scheduled active day throughout all of 2027.', '👑', 2027, NULL, NULL)
ON CONFLICT DO NOTHING;

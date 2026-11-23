-- Separate pilot DB: no changes to main Panda Go lessons or student data.
CREATE TABLE IF NOT EXISTS course_entitlements (
  user_id TEXT PRIMARY KEY,
  purchased_at TEXT NOT NULL,
  source TEXT NOT NULL CHECK(source IN ('test', 'payment')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS ai_daily_usage (
  user_id TEXT NOT NULL,
  day_utc TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0 CHECK(used >= 0),
  PRIMARY KEY(user_id, day_utc)
);

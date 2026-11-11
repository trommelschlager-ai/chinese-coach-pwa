-- Run once: npx wrangler d1 execute panda-ai-quota --remote --file=./schema.sql
-- Atomic quota rows are kept only as daily/minute counters; no chat text stored.
CREATE TABLE IF NOT EXISTS panda_ai_quota (
 scope TEXT NOT NULL,
 bucket TEXT NOT NULL,
 hits INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(scope,bucket)
);
-- Periodically purge old buckets; preserve at least two days for debugging limits.

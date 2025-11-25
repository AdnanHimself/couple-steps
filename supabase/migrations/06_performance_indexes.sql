-- Performance Indexes Migration
-- Date: 2025-11-25
-- Purpose: Add missing indexes for query optimization

-- Index 1: Daily steps lookup by user and date
-- Used in: DashboardScreen streak calculations, StepService queries
CREATE INDEX IF NOT EXISTS idx_daily_steps_user_date 
  ON daily_steps(user_id, date);

-- Index 2: User challenges filtered by status  
-- Used in: ChallengeService active challenge queries
CREATE INDEX IF NOT EXISTS idx_user_challenges_user_status 
  ON user_challenges(user_id, status);

-- Index 3: Couple challenges lookup
-- Used in: ChallengeService couple challenge queries
CREATE INDEX IF NOT EXISTS idx_couple_challenges_couple_id 
  ON couple_challenges(couple_id);

-- Note: Nudges indexes already exist from migration 03_nudge_system_update.sql
-- - idx_nudges_receiver_read
-- - idx_nudges_created_at

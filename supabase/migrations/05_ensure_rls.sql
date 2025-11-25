-- Migration: Ensure RLS on nudges table
-- Date: 2025-11-24

-- 1. Enable RLS
ALTER TABLE nudges ENABLE ROW LEVEL SECURITY;

-- 2. Policies

-- Users can insert nudges if they are the sender
CREATE POLICY "Users can insert their own nudges"
ON nudges FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Users can view nudges sent by them or received by them
CREATE POLICY "Users can view their own nudges"
ON nudges FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can update (mark as read) nudges received by them
CREATE POLICY "Users can update received nudges"
ON nudges FOR UPDATE
USING (auth.uid() = receiver_id);

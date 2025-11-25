-- Migration: Add feedback table
-- Date: 2025-11-24

-- 1. Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- 3. Policies
-- Users can insert their own feedback
CREATE POLICY "Users can insert their own feedback" 
ON feedback FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can view their own feedback (optional, but good for history if we add it later)
CREATE POLICY "Users can view their own feedback" 
ON feedback FOR SELECT 
USING (auth.uid() = user_id);

-- Only admins/service role can update/delete (implicit by default deny, but good to be explicit if needed)

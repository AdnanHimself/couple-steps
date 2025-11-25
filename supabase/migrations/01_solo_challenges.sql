-- 1. Add 'type' column to challenges table
ALTER TABLE challenges ADD COLUMN type TEXT DEFAULT 'couple';

-- 2. Create user_challenges table for Solo Challenges
CREATE TABLE user_challenges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active', -- 'active', 'completed', 'paused'
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    progress INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add RLS policies for user_challenges
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own challenges"
    ON user_challenges FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own challenges"
    ON user_challenges FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenges"
    ON user_challenges FOR UPDATE
    USING (auth.uid() = user_id);

-- 4. Update existing challenges to be 'couple' type (optional, as default handles it)
UPDATE challenges SET type = 'couple' WHERE type IS NULL;

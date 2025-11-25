-- 1. Standardize Schema: Rename 'name' to 'title' if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'challenges' AND column_name = 'name') THEN
        ALTER TABLE challenges RENAME COLUMN name TO title;
    END IF;
END $$;

-- 2. Standardize Schema: Rename 'total_steps' to 'goal' if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'challenges' AND column_name = 'total_steps') THEN
        ALTER TABLE challenges RENAME COLUMN total_steps TO goal;
    END IF;
END $$;

-- 3. Add 'type' column to 'challenges' table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'challenges' AND column_name = 'type') THEN
        ALTER TABLE challenges ADD COLUMN type TEXT DEFAULT 'couple';
    END IF;
END $$;

-- 4. Create 'user_challenges' table for tracking active solo challenges
CREATE TABLE IF NOT EXISTS user_challenges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    challenge_id UUID REFERENCES challenges(id) NOT NULL,
    status TEXT DEFAULT 'active', -- 'active', 'completed', 'paused'
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    progress INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enable Row Level Security (RLS) for user_challenges
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies for user_challenges
-- Allow users to view their own challenges
DROP POLICY IF EXISTS "Users can view their own challenges" ON user_challenges;
CREATE POLICY "Users can view their own challenges"
    ON user_challenges FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to insert their own challenges
DROP POLICY IF EXISTS "Users can insert their own challenges" ON user_challenges;
CREATE POLICY "Users can insert their own challenges"
    ON user_challenges FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own challenges
DROP POLICY IF EXISTS "Users can update their own challenges" ON user_challenges;
CREATE POLICY "Users can update their own challenges"
    ON user_challenges FOR UPDATE
    USING (auth.uid() = user_id);

-- 7. Insert seed data for solo challenges
-- We use explicit column names to ensure it works after renaming
INSERT INTO challenges (title, description, goal, duration_days, type, image_url)
SELECT 'Morning Jog', 'A quick 5k run to start the day right.', 6000, 1, 'solo', 'https://images.unsplash.com/photo-1538805060512-e2c964ea02ed?w=800&q=80'
WHERE NOT EXISTS (SELECT 1 FROM challenges WHERE title = 'Morning Jog');

INSERT INTO challenges (title, description, goal, duration_days, type, image_url)
SELECT 'Urban Explorer', 'Discover your city. 15,000 steps of urban adventure.', 15000, 1, 'solo', 'https://images.unsplash.com/photo-1449824913929-2b3a3e36f0c1?w=800&q=80'
WHERE NOT EXISTS (SELECT 1 FROM challenges WHERE title = 'Urban Explorer');

INSERT INTO challenges (title, description, goal, duration_days, type, image_url)
SELECT 'Beginner''s Step', 'Start small. Walk 3,000 steps today to get the ball rolling.', 3000, 1, 'solo', 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&q=80'
WHERE NOT EXISTS (SELECT 1 FROM challenges WHERE title = 'Beginner''s Step');

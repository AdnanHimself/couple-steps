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

-- 3. Standardize Schema: Add 'type' column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'challenges' AND column_name = 'type') THEN
        ALTER TABLE challenges ADD COLUMN type TEXT DEFAULT 'couple';
    END IF;
END $$;

-- 4. Create 'user_challenges' table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_challenges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    challenge_id UUID REFERENCES challenges(id) NOT NULL,
    status TEXT DEFAULT 'active',
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    progress INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enable RLS for user_challenges
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies (drop first to avoid errors)
DROP POLICY IF EXISTS "Users can view their own challenges" ON user_challenges;
CREATE POLICY "Users can view their own challenges" ON user_challenges FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own challenges" ON user_challenges;
CREATE POLICY "Users can insert their own challenges" ON user_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own challenges" ON user_challenges;
CREATE POLICY "Users can update their own challenges" ON user_challenges FOR UPDATE USING (auth.uid() = user_id);

-- Seed Solo Challenges
INSERT INTO public.challenges (id, title, description, goal, type, duration_days, image_url) VALUES
('10000000-0000-0000-0000-000000000001', 'Beginner''s Step', 'Start your walking journey with 3,000 steps.', 3000, 'solo', 1, 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&q=80'),
('10000000-0000-0000-0000-000000000002', 'Morning Jog', 'A healthy 5k steps to start the day.', 5000, 'solo', 1, 'https://images.unsplash.com/photo-1538805060512-e2c964ea02ed?w=800&q=80'),
('10000000-0000-0000-0000-000000000003', 'Daily Walker', 'Hit the standard 8k daily goal.', 8000, 'solo', 1, 'https://images.unsplash.com/photo-1483721310020-03333e577078?w=800&q=80'),
('10000000-0000-0000-0000-000000000004', '10k Club', 'Join the 10k steps club today!', 10000, 'solo', 1, 'https://images.unsplash.com/photo-1552674605-5d28c4a190b0?w=800&q=80'),
('10000000-0000-0000-0000-000000000005', 'Lunch Break Walk', 'Get moving during your lunch break.', 4000, 'solo', 1, 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80'),
('10000000-0000-0000-0000-000000000006', 'Evening Stroll', 'Wind down with a 6k evening walk.', 6000, 'solo', 1, 'https://images.unsplash.com/photo-1513326738677-b964603b136d?w=800&q=80'),
('10000000-0000-0000-0000-000000000007', 'Power Walker', 'Push yourself to 12,000 steps.', 12000, 'solo', 1, 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=800&q=80'),
('10000000-0000-0000-0000-000000000008', 'Weekend Hike', 'A big 15k day for the weekend.', 15000, 'solo', 1, 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800&q=80'),
('10000000-0000-0000-0000-000000000009', 'Marathon Training', 'Serious steps for serious walkers.', 20000, 'solo', 1, 'https://images.unsplash.com/photo-1552674605-5d28c4a190b0?w=800&q=80'),
('10000000-0000-0000-0000-000000000010', 'Rest Day Activity', 'Keep moving even on rest days.', 2000, 'solo', 1, 'https://images.unsplash.com/photo-1535743686920-55e4145369b9?w=800&q=80')
ON CONFLICT (id) DO NOTHING;

-- Seed Couple Challenges
INSERT INTO public.challenges (id, title, description, goal, type, duration_days, image_url) VALUES
('20000000-0000-0000-0000-000000000001', 'Beginner Couple', 'Walk together, reach 5,000 combined steps.', 5000, 'couple', 1, 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800&q=80'),
('20000000-0000-0000-0000-000000000002', 'Sunset Stroll', 'Romantic 8k steps together at sunset.', 8000, 'couple', 1, 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&q=80'),
('20000000-0000-0000-0000-000000000003', 'Weekend Warriors', 'Conquer 15,000 steps together this weekend!', 15000, 'couple', 2, 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&q=80'),
('20000000-0000-0000-0000-000000000004', 'Park Date', 'A lovely 6k walk in the park.', 6000, 'couple', 1, 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800&q=80'),
('20000000-0000-0000-0000-000000000005', 'Coffee Run', 'Walk to your favorite coffee spot.', 4000, 'couple', 1, 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800&q=80'),
('20000000-0000-0000-0000-000000000006', 'City Explorers', 'Explore the city with 12k steps.', 12000, 'couple', 1, 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?w=800&q=80'),
('20000000-0000-0000-0000-000000000007', 'Hiking Buddies', 'A serious 20k hike together.', 20000, 'couple', 1, 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800&q=80'),
('20000000-0000-0000-0000-000000000008', 'Fitness Goals', 'Push your limits with 25k combined.', 25000, 'couple', 1, 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&q=80'),
('20000000-0000-0000-0000-000000000009', 'Morning Routine', 'Start the day with 7k steps together.', 7000, 'couple', 1, 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80'),
('20000000-0000-0000-0000-000000000010', 'Step Challenge', 'Ultimate 30k step challenge!', 30000, 'couple', 1, 'https://images.unsplash.com/photo-1552674605-5d28c4a190b0?w=800&q=80')
ON CONFLICT (id) DO NOTHING;

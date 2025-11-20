import { supabase } from '../lib/supabase';

export const SeedService = {
    seedChallenges: async () => {
        try {
            console.log('Seeding challenges...');

            // 1. Define Real Challenges
            const realChallenges = [
                {
                    title: 'Weekend Warrior',
                    description: 'Walk 15,000 steps this weekend. Perfect for a city stroll or a short hike.',
                    goal: 15000,
                    duration_days: 2,
                    category: 'weekend',
                    image_url: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&q=80' // Nature/Hike
                },
                {
                    title: 'Couch to 5k Steps',
                    description: 'A gentle start. Walk 5,000 steps every day for a week.',
                    goal: 35000, // 5k * 7
                    duration_days: 7,
                    category: 'weekly',
                    image_url: 'https://images.unsplash.com/photo-1486218119243-13883505764c?w=800&q=80' // Running shoes/walking
                },
                {
                    title: 'Marathon Month',
                    description: 'The ultimate test. 300,000 steps in 30 days. That\'s 10k a day!',
                    goal: 300000,
                    duration_days: 30,
                    category: 'monthly',
                    image_url: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=800&q=80' // Runner
                },
                {
                    title: 'Date Night Stroll',
                    description: 'Walk 6,000 steps together in one evening.',
                    goal: 6000,
                    duration_days: 1,
                    category: 'daily',
                    image_url: 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?w=800&q=80' // Couple walking
                },
                {
                    title: 'Urban Explorer',
                    description: 'Discover your city. 20,000 steps in a single day.',
                    goal: 20000,
                    duration_days: 1,
                    category: 'daily',
                    image_url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80' // City
                }
            ];

            // 2. Delete existing (optional, might fail if FK constraints)
            // We'll try to delete "Mock" challenges if we can identify them, or just all.
            const { error: deleteError } = await supabase
                .from('challenges')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all UUIDs

            if (deleteError) {
                console.log('Could not clear challenges (likely in use), appending new ones instead.', deleteError);
            }

            // 3. Insert New
            const { error: insertError } = await supabase
                .from('challenges')
                .insert(realChallenges);

            if (insertError) throw insertError;

            console.log('Seeding complete!');
            return true;
        } catch (e) {
            console.error('Seeding failed:', e);
            return false;
        }
    }
};

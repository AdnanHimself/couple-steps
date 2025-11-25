import { supabase } from '../lib/supabase';
import { Logger } from '../utils/Logger';

export const SeedService = {
    seedChallenges: async () => {
        try {
            Logger.info('Seeding challenges...');

            // 1. Define Challenges
            const realChallenges = [
                // Beginner Challenge (Only 1)
                {
                    title: 'Beginner\'s Step',
                    description: 'Start small. Walk 3,000 steps today to get the ball rolling.',
                    goal: 3000,
                    duration_days: 1,
                    category: 'beginner',
                    type: 'solo',
                    image_url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&q=80' // Walking shoes
                },
                // Solo Challenges
                {
                    title: 'Morning Jog',
                    description: 'A quick 5k run to start the day right.',
                    goal: 6000,
                    duration_days: 1,
                    category: 'fitness',
                    type: 'solo',
                    image_url: 'https://images.unsplash.com/photo-1538805060512-e2c964ea02ed?w=800&q=80' // Jogging
                },
                {
                    title: 'Urban Explorer',
                    description: 'Discover your city. 15,000 steps of urban adventure.',
                    goal: 15000,
                    duration_days: 1,
                    category: 'adventure',
                    type: 'solo',
                    image_url: 'https://images.unsplash.com/photo-1449824913929-2b3a3e36f0c1?w=800&q=80' // City
                },
                // Epic Journeys (Couple)
                {
                    title: 'The Great Wall',
                    description: 'A legendary journey along the Great Wall of China. 20,000 steps to conquer the dragon.',
                    goal: 20000,
                    duration_days: 2,
                    category: 'epic',
                    type: 'couple',
                    image_url: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800&q=80' // Great Wall
                },
                {
                    title: 'Camino de Santiago',
                    description: 'Walk the pilgrim\'s path. 50,000 steps of reflection and endurance.',
                    goal: 50000,
                    duration_days: 5,
                    category: 'epic',
                    type: 'couple',
                    image_url: 'https://images.unsplash.com/photo-1566230463389-7667c2427216?w=800&q=80' // Camino
                },
                {
                    title: 'Route 66',
                    description: 'Get your kicks on Route 66. A massive 100,000 step road trip on foot.',
                    goal: 100000,
                    duration_days: 14,
                    category: 'epic',
                    type: 'couple',
                    image_url: 'https://images.unsplash.com/photo-1525351326368-efbb5cb68ee4?w=800&q=80' // Route 66
                },
                {
                    title: 'New Zealand Traverse',
                    description: 'From North to South. The ultimate 200,000 step adventure through Middle Earth.',
                    goal: 200000,
                    duration_days: 30,
                    category: 'epic',
                    type: 'couple',
                    image_url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80' // NZ
                }
            ];

            // 2. Delete existing (optional, might fail if FK constraints)
            // We'll try to delete "Mock" challenges if we can identify them, or just all.
            const { error: deleteError } = await supabase
                .from('challenges')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all UUIDs

            if (deleteError) {
                Logger.info('Could not clear challenges (likely in use), appending new ones instead.', deleteError);
            }

            // 3. Insert New
            const { error: insertError } = await supabase
                .from('challenges')
                .insert(realChallenges);

            if (insertError) throw insertError;

            Logger.info('Seeding complete!');
            return true;
        } catch (e) {
            Logger.error('Seeding failed:', e);
            return false;
        }
    }
};

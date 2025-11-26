import { supabase } from '../lib/supabase';
import { Challenge, DBChallenge } from '../types';

/**
 * ChallengeService
 * Handles all interactions with the Supabase database regarding challenges.
 * This includes fetching available challenges, managing active/completed states,
 * and checking for completion based on step goals.
 */
import { Logger } from '../utils/Logger';

export const ChallengeService = {
    /**
     * Fetches all available challenges from the database.
     * @returns Promise<Challenge[]> List of all challenges sorted by goal.
     */
    async getChallenges(): Promise<Challenge[]> {
        const { data, error } = await supabase
            .from('challenges')
            .select('*')
            .order('goal', { ascending: true });

        if (error) {
            Logger.error('Error fetching challenges:', error);
            return [];
        }

        return data.map((c: DBChallenge) => ({
            id: c.id,
            title: c.title || c.name || '',
            description: c.description,
            goal: c.goal,
            imageUrl: c.image_url,
            durationDays: c.duration_days || 7,
            milestones: c.milestones || [],
            type: c.type || 'couple'
        }));
    },

    /**
     * Fetches the currently active challenge for a specific couple.
     * @param coupleId - The UUID of the couple.
     * @returns Promise<Challenge | null> The active challenge object or null if none exists.
     */
    async getActiveChallenge(coupleId: string): Promise<Challenge | null> {
        const { data, error } = await supabase
            .from('couple_challenges')
            .select(`
                *,
                challenge:challenges(*)
            `)
            .eq('couple_id', coupleId)
            .eq('status', 'active')
            .single();

        if (error) {
            if (error.code !== 'PGRST116') { // Not found
                Logger.error('Error fetching active challenge:', error);
            }
            return null;
        }

        if (!data || !data.challenge) return null;

        const c = data.challenge;
        return {
            id: c.id,
            title: c.title || c.name,
            description: c.description,
            goal: c.goal,
            imageUrl: c.image_url,
            durationDays: c.duration_days || 7,
            milestones: c.milestones || [],
            type: c.type || 'couple'
        };
    },

    /**
     * Fetches the currently active solo challenge for a specific user.
     * @param userId - The UUID of the user.
     * @returns Promise<Challenge | null> The active solo challenge object or null if none exists.
     */
    async getActiveSoloChallenge(userId: string): Promise<Challenge | null> {
        const { data, error } = await supabase
            .from('user_challenges')
            .select(`
                *,
                challenge:challenges(*)
            `)
            .eq('user_id', userId)
            .eq('status', 'active')
            .single();

        if (error) {
            if (error.code !== 'PGRST116') { // Not found
                Logger.error('Error fetching active solo challenge:', error);
            }
            // Silently ignore if user_challenges table doesn't exist (migration not run)
            return null;
        }

        if (!data || !data.challenge) return null;

        const c = data.challenge;
        return {
            id: c.id,
            title: c.title || c.name,
            description: c.description,
            goal: c.goal,
            imageUrl: c.image_url,
            durationDays: c.duration_days || 7,
            milestones: c.milestones || [],
            type: c.type || 'solo'
        };
    },

    /**
     * Sets a new active challenge for a couple.
     * Automatically pauses any currently active challenge before starting the new one.
     * @param coupleId - The UUID of the couple.
     * @param challengeId - The UUID of the challenge to start.
     * @returns Promise<boolean> True if successful, false otherwise.
     */
    async setActiveChallenge(coupleId: string, challengeId: string): Promise<boolean> {
        // 1. Deactivate current active challenge
        const { error: deactivateError } = await supabase
            .from('couple_challenges')
            .update({ status: 'paused' })
            .eq('couple_id', coupleId)
            .eq('status', 'active');

        if (deactivateError) {
            Logger.error('Error deactivating challenge:', deactivateError);
            return false;
        }

        // 2. Set new active challenge
        const { error: insertError } = await supabase
            .from('couple_challenges')
            .insert([
                {
                    couple_id: coupleId,
                    challenge_id: challengeId,
                    status: 'active',
                    start_date: new Date().toISOString()
                }
            ]);

        if (insertError) {
            Logger.error('Error setting active challenge:', insertError);
            return false;
        }

        return true;
    },

    /**
     * Sets a new active solo challenge for a user.
     * Automatically pauses any currently active solo challenge before starting the new one.
     * @param userId - The UUID of the user.
     * @param challengeId - The UUID of the challenge to start.
     * @returns Promise<boolean> True if successful, false otherwise.
     */
    async setActiveSoloChallenge(userId: string, challengeId: string): Promise<boolean> {
        // 1. Deactivate current active solo challenge
        const { error: deactivateError } = await supabase
            .from('user_challenges')
            .update({ status: 'paused' })
            .eq('user_id', userId)
            .eq('status', 'active');

        if (deactivateError) {
            Logger.error('Error deactivating solo challenge:', deactivateError);
            return false;
        }

        // 2. Set new active solo challenge
        const { error: insertError } = await supabase
            .from('user_challenges')
            .insert([
                {
                    user_id: userId,
                    challenge_id: challengeId,
                    status: 'active',
                    start_date: new Date().toISOString()
                }
            ]);

        if (insertError) {
            Logger.error('Error setting active solo challenge:', insertError);
            return false;
        }

        return true;
    },

    /**
     * Retrieves a history of completed challenges for a couple.
     * @param coupleId - The UUID of the couple.
     * @returns Promise<Challenge[]> List of completed challenges, sorted by completion date (newest first).
     */
    async getCompletedChallenges(coupleId: string): Promise<Challenge[]> {
        const { data, error } = await supabase
            .from('couple_challenges')
            .select(`
                *,
                challenge:challenges(*)
            `)
            .eq('couple_id', coupleId)
            .eq('status', 'completed')
            .order('created_at', { ascending: false });

        if (error) {
            Logger.error('Error fetching completed challenges:', error);
            return [];
        }

        return data.map((item: any) => {
            const c = item.challenge;
            return {
                id: c.id,
                title: c.title || c.name,
                description: c.description,
                goal: c.goal,
                imageUrl: c.image_url,
                durationDays: c.duration_days || 7,
                milestones: c.milestones || [],
                completedDate: item.end_date,
                type: c.type || 'couple'
            };
        });
    },

    /**
     * Retrieves a history of completed solo challenges for a user.
     * @param userId - The UUID of the user.
     * @returns Promise<Challenge[]> List of completed solo challenges, sorted by completion date (newest first).
     */
    async getCompletedSoloChallenges(userId: string): Promise<Challenge[]> {
        const { data, error } = await supabase
            .from('user_challenges')
            .select(`
                *,
                challenge:challenges(*)
            `)
            .eq('user_id', userId)
            .eq('status', 'completed')
            .order('end_date', { ascending: false });

        if (error) {
            // Silently return empty if user_challenges table doesn't exist (migration not run)
            if (error.code === 'PGRST205' || error.message?.includes('user_challenges')) {
                return [];
            }
            Logger.error('Error fetching completed solo challenges:', error);
            return [];
        }

        return data.map((item: any) => {
            const c = item.challenge;
            return {
                id: c.id,
                title: c.title || c.name,
                description: c.description,
                goal: c.goal,
                imageUrl: c.image_url,
                durationDays: c.duration_days || 7,
                milestones: c.milestones || [],
                completedDate: item.end_date,
                type: c.type || 'solo'
            };
        });
    },

    /**
     * Checks if the current active couple challenge has been completed based on total steps.
     * If the goal is met, it updates the challenge status to 'completed' in the database.
     * @param coupleId - The UUID of the couple.
     * @param totalSteps - The current total combined steps of the couple.
     * @returns Promise<boolean> True if the challenge was just completed, false otherwise.
     */
    async checkCompletion(coupleId: string, totalSteps: number): Promise<boolean> {
        // 1. Get active challenge
        const active = await this.getActiveChallenge(coupleId);
        if (!active) return false;

        // 2. Check if goal reached
        if (totalSteps >= active.goal) {
            Logger.info(`Challenge '${active.title}' completed! Steps: ${totalSteps}/${active.goal}`);

            // 3. Mark as completed
            const { error } = await supabase
                .from('couple_challenges')
                .update({
                    status: 'completed',
                    // end_date: new Date().toISOString() // Removed as column doesn't exist
                })
                .eq('couple_id', coupleId)
                .eq('status', 'active');

            if (error) {
                Logger.error('Error marking challenge as completed:', error);
                return false;
            }

            return true;
        }

        return false;
    },

    /**
     * Checks if the current active solo challenge has been completed based on total steps.
     * If the goal is met, it updates the challenge status to 'completed' in the database.
     * @param userId - The UUID of the user.
     * @param totalSteps - The current total steps of the user.
     * @returns Promise<boolean> True if the challenge was just completed, false otherwise.
     */
    async checkSoloCompletion(userId: string, totalSteps: number): Promise<boolean> {
        // 1. Get active solo challenge
        const active = await this.getActiveSoloChallenge(userId);
        if (!active) return false;

        // 2. Check if goal reached
        if (totalSteps >= active.goal) {
            Logger.info(`Solo Challenge '${active.title}' completed! Steps: ${totalSteps}/${active.goal}`);

            // 3. Mark as completed
            const { error } = await supabase
                .from('user_challenges')
                .update({
                    status: 'completed',
                    end_date: new Date().toISOString()
                })
                .eq('user_id', userId)
                .eq('status', 'active');

            if (error) {
                Logger.error('Error marking solo challenge as completed:', error);
                return false;
            }

            return true;
        }

        return false;
    },
    /**
     * Resets the challenges table with a new set of fun, distance-based challenges.
     * WARNING: This deletes all existing challenges!
     */
    async resetChallenges(): Promise<boolean> {
        // 1. Delete all existing challenges
        // Note: This might fail if there are foreign key constraints (active challenges).
        // ideally we should cascade or clear those first, but for now let's try.
        const { error: deleteError } = await supabase
            .from('challenges')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

        if (deleteError) {
            Logger.error('Error deleting challenges:', deleteError);
            // If we can't delete, we might just append? No, user wants to replace.
            // Let's assume for this "dev" task we can clear.
            return false;
        }

        // 2. Insert new challenges
        const newChallenges = [
            // --- SOLO CHALLENGES ---
            {
                title: "Central Park Stroll",
                description: "A relaxing walk through NYC's green heart. Perfect for a weekend.",
                goal: 13000,
                type: 'solo',
                image_url: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
                duration_days: 1
            },
            {
                title: "Eiffel Tower Climb",
                description: "Equivalent to climbing the Iron Lady 10 times!",
                goal: 16500,
                type: 'solo',
                image_url: "https://images.unsplash.com/photo-1511739001486-6bfe10ce7859?w=800&q=80",
                duration_days: 2
            },
            {
                title: "Golden Gate Crossing",
                description: "Walk the iconic bridge there and back again.",
                goal: 7100,
                type: 'solo',
                image_url: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80",
                duration_days: 3
            },
            {
                title: "Marathon Runner",
                description: "Complete the classic 42km distance at your own pace.",
                goal: 55000,
                type: 'solo',
                image_url: "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=800&q=80",
                duration_days: 5
            },
            {
                title: "Grand Canyon Rim",
                description: "A breathtaking journey along the edge of the world.",
                goal: 50000,
                type: 'solo',
                image_url: "https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=800&q=80",
                duration_days: 7
            },
            {
                title: "Hadrian's Wall",
                description: "Patrol the ancient Roman frontier in Northern England.",
                goal: 153000,
                type: 'solo',
                image_url: "https://images.unsplash.com/photo-1564858852033-255d65418b48?w=800&q=80",
                duration_days: 14
            },
            {
                title: "Mount Fuji Ascent",
                description: "The sacred climb to the summit of Japan.",
                goal: 30000,
                type: 'solo',
                image_url: "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=800&q=80",
                duration_days: 20
            },
            {
                title: "Inca Trail",
                description: "The legendary path to the lost city of Machu Picchu.",
                goal: 70000,
                type: 'solo',
                image_url: "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&q=80",
                duration_days: 30
            },
            {
                title: "Iceland Ring Road",
                description: "A complete tour of fire and ice.",
                goal: 1750000,
                type: 'solo',
                image_url: "https://images.unsplash.com/photo-1476610182048-b716b8518aae?w=800&q=80",
                duration_days: 45
            },
            {
                title: "Walk to the ISS",
                description: "The distance from Earth to the Space Station's orbit!",
                goal: 535000,
                type: 'solo',
                image_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80",
                duration_days: 90
            },

            // --- COUPLE CHALLENGES ---
            {
                title: "Romantic Paris Stroll",
                description: "Explore the City of Lights together, hand in hand.",
                goal: 26000,
                type: 'couple',
                image_url: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80",
                duration_days: 5
            },
            {
                title: "Venice Canals",
                description: "Get lost in the winding streets and bridges of Venice.",
                goal: 20000,
                type: 'couple',
                image_url: "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=800&q=80",
                duration_days: 10
            },
            {
                title: "Aloha Hawaii",
                description: "An island hopping adventure through paradise.",
                goal: 236000,
                type: 'couple',
                image_url: "https://images.unsplash.com/photo-1542259649-4d969828c57b?w=800&q=80",
                duration_days: 21
            },
            {
                title: "Paris to London",
                description: "Connecting two great capitals across the channel.",
                goal: 450000,
                type: 'couple',
                image_url: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80",
                duration_days: 30
            },
            {
                title: "Great Wall Section",
                description: "Conquer a 100km section of the dragon of stone.",
                goal: 130000,
                type: 'couple',
                image_url: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800&q=80",
                duration_days: 60
            },
            {
                title: "Berlin to Rome",
                description: "A grand European tour crossing the Alps.",
                goal: 1968000,
                type: 'couple',
                image_url: "https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800&q=80",
                duration_days: 90
            },
            {
                title: "Sahara Crossing",
                description: "Survive the endless sands as a team.",
                goal: 2100000,
                type: 'couple',
                image_url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&q=80",
                duration_days: 120
            },
            {
                title: "Route 66",
                description: "The ultimate American road trip.",
                goal: 5170000,
                type: 'couple',
                image_url: "https://images.unsplash.com/photo-1525016281788-29984955700d?w=800&q=80",
                duration_days: 180
            },
            {
                title: "Amazon Expedition",
                description: "A journey through the heart of the jungle.",
                goal: 8400000,
                type: 'couple',
                image_url: "https://images.unsplash.com/photo-1572252821143-066749960dd8?w=800&q=80",
                duration_days: 240
            },
            {
                title: "Around the Moon",
                description: "A giant leap for your relationship.",
                goal: 14300000,
                type: 'couple',
                image_url: "https://images.unsplash.com/photo-1522030299830-16b8d3d049fe?w=800&q=80",
                duration_days: 365
            }
        ];

        const { error: insertError } = await supabase
            .from('challenges')
            .insert(newChallenges);

        if (insertError) {
            Logger.error('Error inserting new challenges:', insertError);
            return false;
        }

        Logger.info('Challenges reset successfully!');
        return true;
    }
};

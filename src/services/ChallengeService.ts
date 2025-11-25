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
            .order('end_date', { ascending: false });

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
                    end_date: new Date().toISOString()
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
    }
};

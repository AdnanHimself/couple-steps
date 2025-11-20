import { supabase } from '../lib/supabase';
import { Challenge } from '../types';

export const ChallengeService = {
    async getChallenges(): Promise<Challenge[]> {
        const { data, error } = await supabase
            .from('challenges')
            .select('*')
            .order('total_steps', { ascending: true });

        if (error) {
            console.error('Error fetching challenges:', error);
            return [];
        }

        return data.map((c: any) => ({
            id: c.id,
            title: c.title || c.name,
            description: c.description,
            goal: c.goal || c.total_steps,
            imageUrl: c.image_url,
            durationDays: c.duration_days || 7,
            milestones: c.milestones || []
        }));
    },

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
                console.error('Error fetching active challenge:', error);
            }
            return null;
        }

        if (!data || !data.challenge) return null;

        const c = data.challenge;
        return {
            id: c.id,
            title: c.title || c.name,
            description: c.description,
            goal: c.goal || c.total_steps,
            imageUrl: c.image_url,
            durationDays: c.duration_days || 7,
            milestones: c.milestones || []
        };
    },

    async setActiveChallenge(coupleId: string, challengeId: string): Promise<boolean> {
        // 1. Deactivate current active challenge
        const { error: deactivateError } = await supabase
            .from('couple_challenges')
            .update({ status: 'paused' })
            .eq('couple_id', coupleId)
            .eq('status', 'active');

        if (deactivateError) {
            console.error('Error deactivating challenge:', deactivateError);
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
            console.error('Error setting active challenge:', insertError);
            return false;
        }

        return true;
    },

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
            console.error('Error fetching completed challenges:', error);
            return [];
        }

        return data.map((item: any) => {
            const c = item.challenge;
            return {
                id: c.id,
                title: c.title || c.name,
                description: c.description,
                goal: c.goal || c.total_steps,
                imageUrl: c.image_url,
                durationDays: c.duration_days || 7,
                milestones: c.milestones || [],
                completedDate: item.end_date // Optional: add this to Challenge type if needed
            };
        });
    },

    async checkCompletion(coupleId: string, totalSteps: number): Promise<boolean> {
        // 1. Get active challenge
        const active = await this.getActiveChallenge(coupleId);
        if (!active) return false;

        // 2. Check if goal reached
        if (totalSteps >= active.goal) {
            console.log(`Challenge '${active.title}' completed! Steps: ${totalSteps}/${active.goal}`);

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
                console.error('Error marking challenge as completed:', error);
                return false;
            }

            return true;
        }

        return false;
    }
};

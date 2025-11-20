import { supabase } from '../lib/supabase';

export const StepService = {
    // Upload my steps for today
    syncDailySteps: async (userId: string, count: number) => {
        try {
            const today = new Date().toISOString().split('T')[0];

            const { error } = await supabase
                .from('daily_steps')
                .upsert({
                    user_id: userId,
                    date: today,
                    count: count,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id, date' });

            if (error) throw error;
            console.log('Steps synced:', count);
        } catch (e) {
            console.error('Step Sync Error:', e);
        }
    },

    // Get partner's steps for today
    getPartnerSteps: async (partnerId: string): Promise<number> => {
        try {
            const today = new Date().toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('daily_steps')
                .select('count')
                .eq('user_id', partnerId)
                .eq('date', today)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // Ignore 'Row not found'
            return data?.count || 0;
        } catch (e) {
            console.error('Get Partner Steps Error:', e);
            return 0;
        }
    },

    // Get history for stats (last 7 days)
    getHistory: async (userId: string, partnerId: string) => {
        try {
            const { data } = await supabase
                .from('daily_steps')
                .select('*')
                .or(`user_id.eq.${userId},user_id.eq.${partnerId}`)
                .order('date', { ascending: true })
                .limit(14); // Last 7 days for 2 users

            return data || [];
        } catch (e) {
            console.error('Get History Error:', e);
            return [];
        }
    }
};

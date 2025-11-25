import { supabase } from '../lib/supabase';
import { User } from '../types';
import { Colors } from '../constants/Colors';
import { Logger } from '../utils/Logger';

export const CouplingService = {
    // Link two users as a couple
    linkPartners: async (userId: string, partnerId: string): Promise<{ success: boolean; error?: string }> => {
        try {
            // Check if already linked
            const { data: existing } = await supabase
                .from('couples')
                .select('*')
                .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
                .single();

            if (existing) {
                Logger.info('User already has a partner');
                return { success: false, error: 'You already have a partner' };
            }

            // Create the link
            const { error } = await supabase
                .from('couples')
                .insert({
                    user1_id: userId,
                    user2_id: partnerId
                });

            if (error) throw error;
            return { success: true };
        } catch (e) {
            Logger.error('Coupling Error:', e);
            return { success: false, error: 'Network error. Please try again.' };
        }
    },

    // Get my partner's profile
    getPartner: async (userId: string): Promise<User | null> => {
        try {
            // Find the couple record
            const { data: couple } = await supabase
                .from('couples')
                .select('*')
                .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
                .single();

            if (!couple) return null;

            // Determine which ID is the partner
            const partnerId = couple.user1_id === userId ? couple.user2_id : couple.user1_id;

            // Fetch partner's profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', partnerId)
                .single();

            return {
                id: partnerId,
                username: profile?.username || profile?.full_name || 'Partner',
                avatarUrl: profile?.avatar_url || 'https://i.pravatar.cc/150?u=' + partnerId,
                color: Colors.secondary
            };
        } catch (e) {
            Logger.error('Get Partner Error:', e);
            return null;
        }
    },

    disconnectPartner: async (userId: string): Promise<boolean> => {
        try {
            // 1. First, find the couple_id to cleanup challenges
            const { data: couple } = await supabase
                .from('couples')
                .select('id')
                .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
                .single();

            // 2. Delete active couple challenges (prevents orphaned challenges)
            if (couple) {
                await supabase
                    .from('couple_challenges')
                    .delete()
                    .eq('couple_id', couple.id);
            }

            // 3. Delete the couple relationship
            const { error } = await supabase
                .from('couples')
                .delete()
                .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

            if (error) throw error;
            return true;
        } catch (e) {
            Logger.error('Disconnect Error:', e);
            return false;
        }
    }
};

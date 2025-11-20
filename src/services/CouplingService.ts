import { supabase } from '../lib/supabase';
import { User } from '../types';
import { Colors } from '../constants/Colors';

export const CouplingService = {
    // Link two users as a couple
    linkPartners: async (userId: string, partnerId: string): Promise<boolean> => {
        try {
            // Check if already linked
            const { data: existing } = await supabase
                .from('couples')
                .select('*')
                .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
                .single();

            if (existing) {
                console.log('User already has a partner');
                return false;
            }

            // Create the link
            const { error } = await supabase
                .from('couples')
                .insert({
                    user1_id: userId,
                    user2_id: partnerId
                });

            if (error) throw error;
            return true;
        } catch (e) {
            console.error('Coupling Error:', e);
            return false;
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
                username: profile?.full_name || 'Partner',
                avatarUrl: profile?.avatar_url || 'https://i.pravatar.cc/150?u=' + partnerId,
                color: Colors.secondary
            };
        } catch (e) {
            console.error('Get Partner Error:', e);
            return null;
        }
    },

    disconnectPartner: async (userId: string): Promise<boolean> => {
        try {
            // We need to find the couple entry where this user is either user_1 or user_2
            // And effectively delete the row or nullify. 
            // Since our schema is 'couples' table with user_1 and user_2.
            // Deleting the row is the cleanest way to "uncouple".

            const { error } = await supabase
                .from('couples')
                .delete()
                .or(`user_1.eq.${userId},user_2.eq.${userId}`);

            if (error) throw error;
            return true;
        } catch (e) {
            console.error('Disconnect Error:', e);
            return false;
        }
    }
};

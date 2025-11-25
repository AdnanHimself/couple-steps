import { supabase } from '../lib/supabase';
import { Logger } from '../utils/Logger';

export const UserService = {
    async updateProfile(userId: string, updates: { username?: string; avatarUrl?: string }): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    username: updates.username,
                    avatar_url: updates.avatarUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (error) {
                Logger.error('Error updating profile:', error);
                return false;
            }

            // Also update auth metadata if username changed (optional, but good for consistency)
            if (updates.username) {
                const { error: authError } = await supabase.auth.updateUser({
                    data: { username: updates.username }
                });
                if (authError) console.warn('Failed to update auth metadata:', authError);
            }

            return true;
        } catch (e) {
            Logger.error('UserService Update Error:', e);
            return false;
        }
    },

    async checkUsernameAvailability(username: string): Promise<boolean> {
        try {
            const { count, error } = await supabase
                .from('profiles')
                .select('id', { count: 'exact', head: true })
                .eq('username', username);

            if (error) throw error;
            return count === 0;
        } catch (e) {
            Logger.error('Error checking username:', e);
            // Return false on error to be conservative and prevent duplicates
            return false;
        }
    }
};

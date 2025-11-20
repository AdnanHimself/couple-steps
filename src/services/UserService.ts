import { supabase } from '../lib/supabase';

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
                console.error('Error updating profile:', error);
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
            console.error('UserService Update Error:', e);
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
            console.error('Error checking username:', e);
            // If we can't check, assume available to avoid blocking (or handle differently)
            return true;
        }
    }
};

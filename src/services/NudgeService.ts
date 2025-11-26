import { supabase } from '../lib/supabase';
import { Logger } from '../utils/Logger';

export type NudgeType = 'poke' | 'heart' | 'wave' | 'motivate' | 'challenge' | 'cheer';

export interface Nudge {
    id: string;
    sender_id: string;
    receiver_id: string;
    message: string;
    type: NudgeType;
    read: boolean;
    created_at: string;
}

export const NudgeService = {
    sendNudge: async (senderId: string, receiverId: string, message: string, type: NudgeType = 'poke') => {
        try {
            const { error } = await supabase
                .from('nudges')
                .insert({
                    sender_id: senderId,
                    receiver_id: receiverId,
                    message: message,
                    type: type
                });

            if (error) {
                Logger.error('Error sending nudge:', error);
                throw error;
            }
            return true;
        } catch (e) {
            Logger.error('NudgeService Error:', e);
            return false;
        }
    },

    getNudges: async (userId: string): Promise<Nudge[]> => {
        try {
            const { data, error } = await supabase
                .from('nudges')
                .select('*')
                .eq('receiver_id', userId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            return (data || []) as Nudge[];
        } catch (e) {
            Logger.error('Error fetching nudges:', e);
            return [];
        }
    },

    getUnreadCount: async (userId: string): Promise<number> => {
        try {
            // 'read' column missing in DB, so we just return 0 for now
            return 0;
        } catch (e) {
            Logger.error('Error fetching unread count:', e);
            return 0;
        }
    },

    markAsRead: async (nudgeId: string): Promise<void> => {
        try {
            // No-op since read column is missing
        } catch (e) {
            Logger.error('Error marking nudge as read:', e);
        }
    }
};

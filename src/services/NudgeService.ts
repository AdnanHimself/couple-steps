import { supabase } from '../lib/supabase';

export const NudgeService = {
    sendNudge: async (senderId: string, receiverId: string, message: string, type: 'poke' | 'heart' | 'wave' = 'poke') => {
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
                console.error('Error sending nudge:', error);
                throw error;
            }
            return true;
        } catch (e) {
            console.error('NudgeService Error:', e);
            return false;
        }
    }
};

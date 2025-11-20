import { supabase } from '../lib/supabase';
import { Message } from '../types';

export const ChatService = {
    // Send a message
    sendMessage: async (senderId: string, receiverId: string, text: string): Promise<Message | null> => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    sender_id: senderId,
                    receiver_id: receiverId,
                    text: text
                })
                .select()
                .single();

            if (error) throw error;

            return {
                id: data.id,
                senderId: data.sender_id,
                text: data.text,
                timestamp: new Date(data.created_at).getTime()
            };
        } catch (e) {
            console.error('Send Message Error:', e);
            return null;
        }
    },

    // Get recent messages
    getMessages: async (userId: string, partnerId: string): Promise<Message[]> => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
                .order('created_at', { ascending: true })
                .limit(50);

            if (error) throw error;

            return data.map((m: any) => ({
                id: m.id,
                senderId: m.sender_id,
                text: m.text,
                timestamp: new Date(m.created_at).getTime()
            }));
        } catch (e) {
            console.error('Get Messages Error:', e);
            return [];
        }
    }
};

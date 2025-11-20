import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// @ts-ignore
import { Send, MessageCircle } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { Colors, Layout } from '../constants/Colors';
import { Button } from '../components/ui/Button';
import { useNavigation } from '@react-navigation/native';

export const ChatScreen = () => {
    const { currentUser, partner, isSolo } = useApp();
    const [messages, setMessages] = useState<any[]>([]);
    const [text, setText] = useState('');
    const navigation = useNavigation<any>();

    useEffect(() => {
        if (!currentUser || !partner) return;

        // Fetch initial messages
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('chat_messages')
                .select('*')
                .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
                .order('timestamp', { ascending: false })
                .limit(50);

            if (data) setMessages(data);
        };

        fetchMessages();

        // Subscribe to new messages
        const subscription = supabase
            .channel('chat')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, payload => {
                const newMessage = payload.new;
                if (
                    (newMessage.sender_id === currentUser.id && newMessage.receiver_id === partner.id) ||
                    (newMessage.sender_id === partner.id && newMessage.receiver_id === currentUser.id)
                ) {
                    setMessages(prev => [newMessage, ...prev]);
                }
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [currentUser, partner]);

    const sendMessage = async () => {
        if (!text.trim() || !currentUser || !partner) return;

        const messageText = text.trim();
        setText('');

        const { error } = await supabase.from('chat_messages').insert({
            sender_id: currentUser.id,
            receiver_id: partner.id,
            text: messageText,
            timestamp: new Date().toISOString(),
        });

        if (error) {
            console.error('Error sending message:', error);
        }
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
                <MessageCircle size={64} color={Colors.textSecondary} />
            </View>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtitle}>
                {isSolo
                    ? "Connect with a partner to start chatting!"
                    : `Start a conversation with ${partner?.username?.split(' ')[0]}!`}
            </Text>
            {isSolo && (
                <Button
                    title="Find Partner"
                    onPress={() => navigation.navigate('Coupling')}
                    style={{ marginTop: 20 }}
                />
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.partnerInfo}>
                    {partner ? (
                        <>
                            <Image source={{ uri: partner.avatarUrl }} style={styles.avatar} />
                            <View>
                                <Text style={styles.partnerName}>{partner.username}</Text>
                                <Text style={styles.statusText}>Online</Text>
                            </View>
                        </>
                    ) : (
                        <View>
                            <Text style={styles.title}>Chat</Text>
                            <Text style={styles.subtitle}>Stacked Steps</Text>
                        </View>
                    )}
                </View>
            </View>

            {messages.length === 0 && !isSolo ? (
                renderEmptyState()
            ) : isSolo ? (
                renderEmptyState()
            ) : (
                <FlatList
                    data={messages}
                    inverted
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => {
                        const isMe = item.sender_id === currentUser?.id;
                        return (
                            <View style={[styles.bubbleContainer, isMe ? styles.myContainer : styles.theirContainer]}>
                                <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
                                    <Text style={isMe ? styles.myText : styles.theirText}>{item.text}</Text>
                                </View>
                                <Text style={styles.timestamp}>
                                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </View>
                        );
                    }}
                />
            )}

            {!isSolo && (
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                >
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            value={text}
                            onChangeText={setText}
                            placeholder="Type a message..."
                            placeholderTextColor={Colors.textSecondary}
                            multiline
                            maxLength={500}
                        />
                        <TouchableOpacity
                            style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]}
                            onPress={sendMessage}
                            disabled={!text.trim()}
                            activeOpacity={0.7}
                        >
                            <Send size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        height: Layout.headerHeight,
        paddingTop: Layout.headerPaddingTop,
        paddingHorizontal: Layout.headerPaddingHorizontal,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        backgroundColor: Colors.background,
        justifyContent: 'center',
    },
    partnerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.card,
    },
    partnerName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    statusText: {
        fontSize: 12,
        color: Colors.success,
    },
    title: {
        fontSize: Layout.headerFontSize,
        fontWeight: 'bold',
        color: Colors.text,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    listContent: {
        padding: Layout.padding,
        paddingBottom: 20,
    },
    bubbleContainer: {
        marginBottom: 12,
        maxWidth: '80%',
    },
    myContainer: {
        alignSelf: 'flex-end',
        alignItems: 'flex-end',
    },
    theirContainer: {
        alignSelf: 'flex-start',
        alignItems: 'flex-start',
    },
    bubble: {
        padding: 12,
        borderRadius: 16,
        marginBottom: 4,
    },
    myBubble: {
        backgroundColor: Colors.primary,
        borderBottomRightRadius: 4,
    },
    theirBubble: {
        backgroundColor: Colors.card,
        borderBottomLeftRadius: 4,
    },
    myText: {
        color: '#FFF',
        fontSize: 16,
    },
    theirText: {
        color: Colors.text,
        fontSize: 16,
    },
    timestamp: {
        fontSize: 10,
        color: Colors.textSecondary,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: Layout.padding,
        paddingTop: 10,
        paddingBottom: Platform.OS === 'android' ? 10 : 20,
        alignItems: 'flex-end',
        gap: 12,
        backgroundColor: Colors.background,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    input: {
        flex: 1,
        backgroundColor: Colors.card,
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 12,
        color: Colors.text,
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        maxHeight: 100,
    },
    sendButton: {
        backgroundColor: Colors.primary,
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: Colors.card,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 10,
    },
    emptySubtitle: {
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
});

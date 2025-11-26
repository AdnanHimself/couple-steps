import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TouchableWithoutFeedback, Animated, PanResponder, Dimensions } from 'react-native';
// @ts-ignore
import { X, Send, Heart, Footprints } from 'lucide-react-native';
import { Colors, Layout } from '../constants/Colors';
import { useApp } from '../context/AppContext';
import { Nudge } from '../services/NudgeService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface NudgeHistorySheetProps {
    visible: boolean;
    onClose: () => void;
    onSendNudge: () => void;
}

export const NudgeHistorySheet: React.FC<NudgeHistorySheetProps> = ({ visible, onClose, onSendNudge }) => {
    const { nudges, currentUser } = useApp();
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    React.useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                damping: 20,
                stiffness: 90,
            }).start();
        }
    }, [visible]);

    const close = () => {
        Animated.timing(slideAnim, {
            toValue: SCREEN_HEIGHT,
            duration: 250,
            useNativeDriver: true,
        }).start(() => onClose());
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return gestureState.dy > 5;
            },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    slideAnim.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 100) {
                    close();
                } else {
                    Animated.spring(slideAnim, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    // Sort nudges chronologically (newest first)
    const sortedNudges = [...(nudges || [])].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const formatTime = (date: string) => {
        const d = new Date(date);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return d.toLocaleDateString();
    };

    const NudgeTypeIcon = ({ type }: { type: string }) => {
        switch (type) {
            case 'heart':
            case 'cheer':
                return <Heart size={16} color={Colors.danger} fill={Colors.danger} />;
            case 'one_k':
                return <Footprints size={16} color={Colors.primary} />;
            default:
                return <Send size={16} color={Colors.primary} />;
        }
    };

    const renderNudgeItem = (nudge: Nudge) => {
        const isSent = nudge.sender_id === currentUser?.id;

        return (
            <View key={nudge.id} style={[
                styles.nudgeItem,
                isSent ? styles.nudgeSent : styles.nudgeReceived
            ]}>
                <View style={styles.nudgeHeader}>
                    <View style={styles.nudgeTypeContainer}>
                        <NudgeTypeIcon type={nudge.type} />
                        <Text style={[
                            styles.nudgeType,
                            isSent ? styles.textSent : styles.textReceived
                        ]}>
                            {isSent ? 'Sent' : 'Received'}
                        </Text>
                    </View>
                    <Text style={styles.nudgeTime}>{formatTime(nudge.created_at)}</Text>
                </View>
                <Text style={[
                    styles.nudgeMessage,
                    isSent ? styles.textSent : styles.textReceived
                ]}>
                    {nudge.message}
                </Text>
            </View>
        );
    };

    return (
        <Modal visible={visible} animationType="none" transparent onRequestClose={close}>
            <View style={styles.overlay}>
                <TouchableWithoutFeedback onPress={close}>
                    <View style={styles.backdrop} />
                </TouchableWithoutFeedback>
                <Animated.View
                    style={[
                        styles.sheet,
                        { transform: [{ translateY: slideAnim }] }
                    ]}
                    {...panResponder.panHandlers}
                >
                    <View style={styles.handle} />
                    <TouchableOpacity style={styles.closeButton} onPress={close}>
                        <X color={Colors.black} size={24} />
                    </TouchableOpacity>

                    <View style={styles.headerRow}>
                        <Text style={styles.title}>Nudge History</Text>
                        <TouchableOpacity
                            style={styles.sendButton}
                            onPress={() => {
                                onClose();
                                setTimeout(onSendNudge, 300);
                            }}
                        >
                            <Send size={18} color={Colors.white} />
                            <Text style={styles.sendButtonText}>Send</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {sortedNudges.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Send size={48} color={Colors.borderDashed} />
                                <Text style={styles.emptyText}>No nudges yet</Text>
                                <Text style={styles.emptySubtext}>
                                    Send your first nudge to your partner!
                                </Text>
                            </View>
                        ) : (
                            sortedNudges.map(renderNudgeItem)
                        )}
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheet: {
        backgroundColor: Colors.background,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        height: '75%',
        padding: Layout.padding,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: Colors.black,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: Colors.black,
        borderRadius: 0,
        alignSelf: 'center',
        marginBottom: 20,
        marginTop: 10,
    },
    closeButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 20,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    sendButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.black,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 0,
    },
    sendButtonText: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    content: {
        flex: 1,
    },
    nudgeItem: {
        padding: 16,
        borderRadius: 0,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.black,
    },
    nudgeSent: {
        backgroundColor: Colors.primary,
    },
    nudgeReceived: {
        backgroundColor: Colors.white,
    },
    nudgeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    nudgeTypeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    nudgeType: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    textSent: {
        color: Colors.white,
    },
    textReceived: {
        color: Colors.black,
    },
    nudgeTime: {
        fontSize: 12,
        color: Colors.black,
        opacity: 0.6,
    },
    nudgeMessage: {
        fontSize: 14,
        lineHeight: 20,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text,
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: Colors.black,
        marginTop: 8,
        textAlign: 'center',
    },
});

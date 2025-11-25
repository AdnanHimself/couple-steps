import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { Colors, Layout } from '../constants/Colors';
import { Nudge, NudgeType } from '../services/NudgeService';
// @ts-ignore
import { X, Heart, Zap, PartyPopper } from 'lucide-react-native';

interface NudgeInboxSheetProps {
    visible: boolean;
    nudges: Nudge[];
    partnerName: string;
    unreadCount: number;
    onClose: () => void;
    onMarkAsRead: (nudgeId: string) => void;
}

const { width } = Dimensions.get('window');

const NUDGE_CONFIG: Record<NudgeType, { icon: any; color: string; emoji: string }> = {
    poke: { icon: Zap, color: '#3b82f6', emoji: '👉' },
    heart: { icon: Heart, color: '#ef4444', emoji: '❤️' },
    wave: { icon: PartyPopper, color: '#f59e0b', emoji: '👋' },
    motivate: { icon: Heart, color: '#ef4444', emoji: '💪' },
    challenge: { icon: Zap, color: '#f59e0b', emoji: '🔥' },
    cheer: { icon: PartyPopper, color: '#22c55e', emoji: '🎉' },
};

export const NudgeInboxSheet: React.FC<NudgeInboxSheetProps> = ({
    visible,
    nudges,
    partnerName,
    unreadCount,
    onClose,
    onMarkAsRead,
}) => {
    const unreadNudges = nudges.filter(n => !n.read);
    const readNudges = nudges.filter(n => n.read);

    const getTimeAgo = (timestamp: string) => {
        const now = new Date();
        const past = new Date(timestamp);
        const diffMs = now.getTime() - past.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    const renderNudge = ({ item }: { item: Nudge }) => {
        const config = NUDGE_CONFIG[item.type];
        const Icon = config.icon;

        return (
            <View style={[styles.nudgeItem, !item.read && styles.unreadNudge]}>
                <View style={[styles.iconContainer, { backgroundColor: `${config.color}20` }]}>
                    <Icon size={20} color={config.color} />
                </View>
                <View style={styles.nudgeContent}>
                    <View style={styles.nudgeHeader}>
                        <Text style={styles.nudgeTitle}>
                            {config.emoji} {item.type.charAt(0).toUpperCase() + item.type.slice(1)} from {partnerName}
                        </Text>
                        <Text style={styles.timeAgo}>{getTimeAgo(item.created_at)}</Text>
                    </View>
                    <Text style={styles.nudgeMessage}>{item.message}</Text>
                    {!item.read && (
                        <TouchableOpacity
                            style={styles.markReadButton}
                            onPress={() => onMarkAsRead(item.id)}
                        >
                            <Text style={styles.markReadText}>Mark as read</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySubtitle}>Your partner's nudges will appear here</Text>
        </View>
    );

    return (
        <Modal
            transparent
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
                <View style={styles.sheet}>
                    {/* Handle */}
                    <View style={styles.handle} />

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <Text style={styles.title}>Nudges</Text>
                            {unreadCount > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{unreadCount}</Text>
                                </View>
                            )}
                        </View>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <X color={Colors.black} size={24} />
                        </TouchableOpacity>
                    </View>

                    {/* Nudge List */}
                    <FlatList
                        data={nudges}
                        renderItem={renderNudge}
                        keyExtractor={item => item.id}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={renderEmptyState}
                        contentContainerStyle={nudges.length === 0 ? styles.emptyListContent : undefined}
                    />
                </View>
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
        borderTopWidth: 3,
        borderLeftWidth: 3,
        borderRightWidth: 3,
        borderColor: Colors.black,
        maxHeight: '80%',
        padding: Layout.padding,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: Colors.black,
        borderRadius: 0,
        alignSelf: 'center',
        marginBottom: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.text,
    },
    badge: {
        backgroundColor: '#ef4444',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 0,
        minWidth: 24,
        alignItems: 'center',
    },
    badgeText: {
        color: Colors.white,
        fontSize: 12,
        fontWeight: '800',
    },
    closeButton: {
        padding: 4,
    },
    nudgeItem: {
        flexDirection: 'row',
        gap: 12,
        padding: 16,
        backgroundColor: Colors.white,
        borderWidth: 2,
        borderColor: Colors.border,
        borderRadius: 0,
        marginBottom: 12,
    },
    unreadNudge: {
        borderColor: Colors.black,
        borderWidth: 3,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 0,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: Colors.black,
    },
    nudgeContent: {
        flex: 1,
    },
    nudgeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 6,
    },
    nudgeTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text,
        flex: 1,
    },
    timeAgo: {
        fontSize: 12,
        color: Colors.black,
        opacity: 0.7,
    },
    nudgeMessage: {
        fontSize: 14,
        color: Colors.black,
        lineHeight: 20,
        marginBottom: 8,
    },
    markReadButton: {
        alignSelf: 'flex-start',
        paddingVertical: 4,
        paddingHorizontal: 8,
        backgroundColor: Colors.background,
        borderRadius: 0,
        borderWidth: 1,
        borderColor: Colors.black,
    },
    markReadText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.black,
        textTransform: 'uppercase',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: Colors.black,
        opacity: 0.7,
    },
    emptyListContent: {
        flex: 1,
    },
});

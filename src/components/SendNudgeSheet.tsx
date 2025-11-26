import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Colors, Layout } from '../constants/Colors';
import { NudgeType } from '../services/NudgeService';
// @ts-ignore
import { X, Heart, Zap, PartyPopper, Footprints } from 'lucide-react-native';

interface SendNudgeSheetProps {
    visible: boolean;
    onClose: () => void;
    onSend: (type: NudgeType) => void;
}

const { width } = Dimensions.get('window');

const NUDGE_TYPES: Array<{
    type: NudgeType;
    icon: any;
    color: string;
    emoji: string;
    title: string;
    message: string;
}> = [
        {
            type: 'motivate',
            icon: Heart,
            color: '#ef4444',
            emoji: '💪',
            title: 'Motivate',
            message: "You've got this! Keep moving forward.",
        },
        {
            type: 'challenge',
            icon: Zap,
            color: '#f59e0b',
            emoji: '🔥',
            title: 'Challenge',
            message: "Think you can beat my 10k steps today?",
        },
        {
            type: 'cheer',
            icon: PartyPopper,
            color: '#22c55e',
            emoji: '❤️',
            title: 'Cheer',
            message: "You're absolutely crushing it today!",
        },
        {
            type: 'one_k',
            icon: Footprints,
            color: '#8b5cf6',
            emoji: '😏',
            title: 'Push',
            message: "Come on, just 1k more steps today 😏",
        },
    ];

export const SendNudgeSheet: React.FC<SendNudgeSheetProps> = ({
    visible,
    onClose,
    onSend,
}) => {
    const handleSend = (type: NudgeType) => {
        onSend(type);
        onClose();
    };

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
                        <Text style={styles.title}>Send Nudge</Text>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <X color={Colors.black} size={24} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.subtitle}>Choose the type of nudge to send</Text>

                    {/* Nudge Type Buttons */}
                    <View style={styles.nudgeList}>
                        {NUDGE_TYPES.map((nudge) => {
                            const Icon = nudge.icon;
                            return (
                                <TouchableOpacity
                                    key={nudge.type}
                                    style={[styles.nudgeButton, { borderColor: nudge.color }]}
                                    onPress={() => handleSend(nudge.type)}
                                    activeOpacity={0.8}
                                >
                                    <View style={[styles.nudgeIconContainer, { backgroundColor: `${nudge.color}20` }]}>
                                        <Icon size={32} color={nudge.color} />
                                    </View>
                                    <View style={styles.nudgeContent}>
                                        <Text style={styles.nudgeTitle}>
                                            {nudge.emoji} {nudge.title}
                                        </Text>
                                        <Text style={styles.nudgeMessage}>{nudge.message}</Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
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
        padding: Layout.padding,
        paddingBottom: 40,
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
        marginBottom: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.text,
    },
    closeButton: {
        padding: 4,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.black,
        marginBottom: 24,
        opacity: 0.7,
    },
    nudgeList: {
        gap: 16,
    },
    nudgeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        padding: 20,
        backgroundColor: Colors.white,
        borderWidth: 3,
        borderRadius: 0,
    },
    nudgeIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 0,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: Colors.black,
    },
    nudgeContent: {
        flex: 1,
    },
    nudgeTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 4,
    },
    nudgeMessage: {
        fontSize: 14,
        color: Colors.black,
        lineHeight: 20,
        opacity: 0.8,
    },
});

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { Colors } from '../constants/Colors';
import { NudgeType } from '../services/NudgeService';
// @ts-ignore
import { Heart, Zap, PartyPopper, Footprints } from 'lucide-react-native';

interface NudgeSnackbarProps {
    visible: boolean;
    senderName: string;
    message: string;
    type: NudgeType;
    onPress: () => void;
    onDismiss: () => void;
}

const { width } = Dimensions.get('window');

const NUDGE_CONFIG: Record<NudgeType, { icon: any; color: string; emoji: string }> = {
    poke: { icon: Zap, color: '#3b82f6', emoji: '👉' },
    heart: { icon: Heart, color: '#ef4444', emoji: '❤️' },
    wave: { icon: PartyPopper, color: '#f59e0b', emoji: '👋' },
    motivate: { icon: Heart, color: '#ef4444', emoji: '💪' },
    challenge: { icon: Zap, color: '#f59e0b', emoji: '🔥' },
    cheer: { icon: PartyPopper, color: '#22c55e', emoji: '🎉' },
    one_k: { icon: Footprints, color: '#8b5cf6', emoji: '😏' },
};

export const NudgeSnackbar: React.FC<NudgeSnackbarProps> = ({
    visible,
    senderName,
    message,
    type,
    onPress,
    onDismiss,
}) => {
    const translateY = useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        if (visible) {
            // Slide in from top
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                damping: 15,
                stiffness: 100,
            }).start();

            // Auto-dismiss after 4 seconds
            const timer = setTimeout(() => {
                dismissSnackbar();
            }, 4000);

            return () => clearTimeout(timer);
        } else {
            // Slide out
            Animated.timing(translateY, {
                toValue: -100,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    const dismissSnackbar = () => {
        Animated.timing(translateY, {
            toValue: -100,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            onDismiss();
        });
    };

    if (!visible) return null;

    const config = NUDGE_CONFIG[type];
    const Icon = config.icon;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateY }],
                    borderColor: config.color,
                },
            ]}
        >
            <TouchableOpacity
                style={styles.touchable}
                onPress={onPress}
                activeOpacity={0.9}
            >
                <View style={[styles.iconContainer, { backgroundColor: `${config.color}20` }]}>
                    <Icon size={20} color={config.color} />
                </View>
                <View style={styles.content}>
                    <Text style={styles.title}>
                        {config.emoji} New nudge from {senderName}
                    </Text>
                    <Text style={styles.message} numberOfLines={1}>
                        {message}
                    </Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 60, // Below status bar
        left: 16,
        right: 16,
        backgroundColor: Colors.white,
        borderWidth: 3,
        borderRadius: 0,
        zIndex: 9999,
    },
    touchable: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
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
    content: {
        flex: 1,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 2,
    },
    message: {
        fontSize: 13,
        color: Colors.black,
        opacity: 0.8,
    },
});

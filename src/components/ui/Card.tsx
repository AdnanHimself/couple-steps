import React from 'react';
import { StyleSheet, ViewStyle, StyleProp, TouchableOpacity, View, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Layout } from '../../constants/Colors';

interface CardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    onPress?: () => void;
    variant?: 'default' | 'primary' | 'outlined';
}

export const Card: React.FC<CardProps> = ({ children, style, onPress, variant = 'default' }) => {
    const scaleValue = React.useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        if (onPress) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Animated.spring(scaleValue, {
                toValue: 0.98,
                useNativeDriver: true,
            }).start();
        }
    };

    const handlePressOut = () => {
        if (onPress) {
            Animated.spring(scaleValue, {
                toValue: 1,
                useNativeDriver: true,
            }).start();
        }
    };

    const getGradientColors = () => {
        switch (variant) {
            case 'primary':
                return Colors.gradients.primary;
            case 'default':
            default:
                return Colors.gradients.card;
        }
    };

    if (variant === 'outlined') {
        if (onPress) {
            return (
                <Animated.View style={{ transform: [{ scale: scaleValue }], width: '100%' }}>
                    <TouchableOpacity
                        style={[styles.card, styles.outlined, style]}
                        activeOpacity={0.9}
                        onPress={onPress}
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                    >
                        {children}
                    </TouchableOpacity>
                </Animated.View>
            );
        }
        return (
            // @ts-ignore
            <View style={[styles.card, styles.outlined, style]}>
                {children}
            </View>
        );
    }

    if (onPress) {
        return (
            <Animated.View style={{ transform: [{ scale: scaleValue }], width: '100%' }}>
                <TouchableOpacity
                    style={[styles.container, style]}
                    activeOpacity={0.9}
                    onPress={onPress}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                >
                    <LinearGradient
                        colors={getGradientColors() as any}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.card}
                    >
                        {children}
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        );
    }

    return (
        // @ts-ignore
        <View style={[styles.container, style]}>
            <LinearGradient
                colors={getGradientColors() as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}
            >
                {children}
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: Layout.borderRadius,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 4,
    },
    card: {
        borderRadius: Layout.borderRadius,
        padding: 20,
        width: '100%',
    },
    outlined: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.border,
    }
});

import React from 'react';
import { StyleSheet, ViewStyle, StyleProp, TouchableOpacity, View, Animated } from 'react-native';
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
                    style={[styles.card, style]}
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
        <View style={[styles.card, style]}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.card,
        borderRadius: Layout.borderRadius,
        padding: 20,
        width: '100%',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    outlined: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.border,
    }
});

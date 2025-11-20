import React from 'react';
import { Text, StyleSheet, TouchableOpacity, ActivityIndicator, ViewStyle, TextStyle, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Layout } from '../../constants/Colors';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    loading?: boolean;
    disabled?: boolean;
    icon?: React.ReactNode;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    loading = false,
    disabled = false,
    icon,
    style,
    textStyle
}) => {
    const scaleValue = React.useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.spring(scaleValue, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleValue, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    const getGradientColors = () => {
        if (disabled) return [Colors.surfaceLight, Colors.surfaceLight];
        switch (variant) {
            case 'primary':
                return Colors.gradients.primary;
            case 'secondary':
                return Colors.gradients.secondary;
            default:
                return Colors.gradients.card;
        }
    };

    const getTextColor = () => {
        if (disabled) return Colors.textSecondary;
        if (variant === 'outline' || variant === 'ghost') return Colors.primary;
        return Colors.white;
    };

    const content = (
        <>
            {loading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <>
                    {icon && icon}
                    <Text style={[
                        styles.text,
                        { color: getTextColor(), marginLeft: icon ? 8 : 0 },
                        textStyle
                    ]}>
                        {title}
                    </Text>
                </>
            )}
        </>
    );

    if (variant === 'outline' || variant === 'ghost') {
        return (
            <Animated.View style={{ transform: [{ scale: scaleValue }], width: style?.width }}>
                <TouchableOpacity
                    onPress={onPress}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    disabled={disabled || loading}
                    style={[
                        styles.button,
                        variant === 'outline' && styles.outline,
                        disabled && styles.disabled,
                        style
                    ]}
                >
                    {content}
                </TouchableOpacity>
            </Animated.View>
        );
    }

    return (
        <Animated.View style={{ transform: [{ scale: scaleValue }], width: style?.width }}>
            <TouchableOpacity
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled || loading}
                activeOpacity={0.9}
                style={[styles.container, style]}
            >
                <LinearGradient
                    colors={getGradientColors() as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.button, disabled && styles.disabled]}
                >
                    {content}
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 25,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 25,
        minHeight: 56,
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    disabled: {
        opacity: 0.7,
        shadowOpacity: 0,
    },
    text: {
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
});

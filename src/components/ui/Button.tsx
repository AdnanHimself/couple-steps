import React from 'react';
import { Text, StyleSheet, TouchableOpacity, ActivityIndicator, ViewStyle, TextStyle, Animated } from 'react-native';
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

    const getBackgroundColor = () => {
        if (disabled) return Colors.white;
        if (variant === 'outline' || variant === 'ghost') return 'transparent';
        return Colors.black; // Primary and secondary both use black
    };

    const getTextColor = () => {
        if (disabled) return Colors.black;
        if (variant === 'outline' || variant === 'ghost') return Colors.black;
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

    return (
        <Animated.View style={{ transform: [{ scale: scaleValue }], width: style?.width }}>
            <TouchableOpacity
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled || loading}
                activeOpacity={0.9}
                style={[
                    styles.button,
                    { backgroundColor: getBackgroundColor() },
                    variant === 'outline' && styles.outline,
                    disabled && styles.disabled,
                    style
                ]}
            >
                {content}
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 0, // Squared
        minHeight: 56,
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.black,
    },
    disabled: {
        opacity: 0.5,
    },
    text: {
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../../constants/Colors';

interface CircularProgressProps {
    size?: number;
    strokeWidth?: number;
    progress: number; // 0 to 1
    color?: string;
    backgroundColor?: string;
    children?: React.ReactNode;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
    size = 100,
    strokeWidth = 10,
    progress,
    color = Colors.primary,
    backgroundColor = Colors.border,
    children
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - progress * circumference;

    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={size} height={size} style={styles.svg}>
                <Circle
                    stroke={backgroundColor}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />
                <Circle
                    stroke={color}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    rotation="-90"
                    origin={`${size / 2}, ${size / 2}`}
                />
            </Svg>
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    svg: {
        position: 'absolute',
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    }
});

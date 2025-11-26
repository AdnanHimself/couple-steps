import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { Colors } from '../../constants/Colors';
// @ts-ignore
import { Flame } from 'lucide-react-native';

interface StreakInfoCardProps {
    streak: number;
    highestStreak: number;
}

export const StreakInfoCard: React.FC<StreakInfoCardProps> = ({ streak, highestStreak }) => {
    return (
        <Card style={styles.container}>
            <View style={styles.streaksRow}>
                {/* Current Streak */}
                <View style={styles.streakSection}>
                    <Flame size={24} color={Colors.black} />
                    <Text style={styles.streakCount}>{streak}</Text>
                    <Text style={styles.streakLabel}>Current Streak</Text>
                </View>

                {/* Vertical Divider */}
                <View style={styles.verticalDivider} />

                {/* Highest Streak */}
                <View style={styles.streakSection}>
                    <Flame size={24} color={Colors.black} fill={Colors.black} />
                    <Text style={styles.streakCount}>{highestStreak}</Text>
                    <Text style={styles.streakLabel}>Highest Streak</Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.bottomSection}>
                <Text style={styles.infoText}>
                    <Text style={styles.highlight}>5,000 steps</Text> per day keeps your streak alive!
                </Text>
            </View>
        </Card>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    streaksRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    streakSection: {
        flex: 1,
        alignItems: 'center',
        gap: 8,
    },
    verticalDivider: {
        width: 2,
        height: 60,
        backgroundColor: Colors.black,
    },
    streakCount: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.text,
    },
    streakLabel: {
        fontSize: 12,
        color: Colors.black,
        textAlign: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: 12,
    },
    bottomSection: {
        alignItems: 'center',
    },
    infoText: {
        fontSize: 14,
        color: Colors.black,
        lineHeight: 20,
        textAlign: 'center',
    },
    highlight: {
        color: Colors.black,
        fontWeight: 'bold',
    },
});

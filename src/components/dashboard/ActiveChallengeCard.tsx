import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { Colors, Layout } from '../../constants/Colors';
// @ts-ignore
import { Trophy, Users, User } from 'lucide-react-native';

interface ActiveChallengeCardProps {
    title: string;
    currentSteps: number;
    goal: number;
    type: 'solo' | 'couple';
    onPress?: () => void;
    state?: 'active' | 'empty' | 'no-partner';
    imageUrl?: string;
}

export const ActiveChallengeCard: React.FC<ActiveChallengeCardProps> = ({
    title,
    currentSteps,
    goal,
    type,
    onPress,
    state = 'active',
    imageUrl
}) => {
    const safeCurrent = currentSteps || 0;
    const safeGoal = goal || 1; // Prevent division by zero
    const progress = Math.min(safeCurrent / safeGoal, 1);
    const percentage = isNaN(progress) ? 0 : Math.round(progress * 100);

    const Icon = type === 'solo' ? User : Users;

    if (state === 'no-partner') {
        return (
            <Card style={[styles.container, styles.placeholderCard]} onPress={onPress}>
                <View style={styles.placeholderContent}>
                    <Users size={24} color={Colors.borderDashed} />
                    <Text style={styles.placeholderText}>No Partner Added</Text>
                </View>
            </Card>
        );
    }

    if (state === 'empty') {
        return (
            <Card style={[styles.container, styles.placeholderCard]} onPress={onPress}>
                <View style={styles.placeholderContent}>
                    <Trophy size={24} color={Colors.borderDashed} />
                    <Text style={styles.placeholderText}>No Challenge Selected</Text>
                </View>
            </Card>
        );
    }

    return (
        <Card style={styles.container} onPress={onPress}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.titleRow}>
                        <Icon size={14} color={Colors.black} style={{ marginRight: 6 }} />
                        <Text style={styles.typeText}>{type === 'solo' ? 'Solo' : 'Couple'}</Text>
                    </View>
                    <Text style={styles.percentage}>{percentage}%</Text>
                </View>

                <Text style={styles.title} numberOfLines={1}>{title}</Text>

                <View style={styles.progressContainer}>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${percentage}%` }]} />
                    </View>
                    <Text style={styles.stepsText}>
                        {currentSteps.toLocaleString()} / {goal.toLocaleString()} steps
                    </Text>
                </View>
            </View>
        </Card>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginBottom: 16,
        minHeight: 100,
    },
    placeholderCard: {
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: Colors.borderDashed,
        borderRadius: Layout.borderRadius,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 100,
    },
    placeholderContent: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 16,
    },
    placeholderText: {
        fontSize: 14,
        color: Colors.black,
        marginTop: 8,
        textAlign: 'center',
    },
    content: {
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    typeText: {
        fontSize: 11,
        color: Colors.black,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: '600',
    },
    percentage: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.text,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 12,
    },
    progressContainer: {
        marginTop: 12,
    },
    progressBarBg: {
        height: 12,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.black,
        borderRadius: Layout.borderRadius,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: Colors.black,
    },
    stepsText: {
        fontSize: 12,
        color: Colors.black,
        textAlign: 'right',
        marginTop: 4,
    },
});

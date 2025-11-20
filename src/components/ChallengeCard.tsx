import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Colors, Layout } from '../constants/Colors';
// @ts-ignore
import { Activity } from 'lucide-react-native';
import { Challenge } from '../types';

interface ChallengeCardProps {
    challenge: Challenge;
    progress: number;
    totalSteps: number;
    isActive: boolean;
    onSelect: (challenge: Challenge) => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - (Layout.padding * 2);

export const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge, progress, totalSteps, isActive, onSelect }) => {
    return (
        <TouchableOpacity
            style={[styles.card, isActive && styles.activeCard]}
            onPress={() => onSelect(challenge)}
            activeOpacity={0.9}
        >
            <View style={styles.cardHeader}>
                <Activity color={isActive ? Colors.warning : Colors.textSecondary} size={24} />
                <Text style={[styles.cardTitle, isActive && styles.activeText]}>{challenge.title}</Text>
                {isActive && <View style={styles.badge}><Text style={styles.badgeText}>Active</Text></View>}
            </View>
            <Text style={styles.cardDescription}>{challenge.description}</Text>

            <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: isActive ? Colors.primary : Colors.textSecondary }]} />
            </View>
            <View style={styles.progressLabels}>
                <Text style={styles.progressText}>{isActive ? totalSteps.toLocaleString() : 0} steps</Text>
                <Text style={styles.progressText}>{challenge.goal.toLocaleString()} goal</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.card,
        borderRadius: Layout.borderRadius,
        padding: 20,
        marginBottom: 20,
        width: CARD_WIDTH,
        marginRight: 16,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    activeCard: {
        borderColor: Colors.primary,
        backgroundColor: '#1A1A1A',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 10,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.textSecondary,
        flex: 1,
    },
    activeText: {
        color: Colors.text,
    },
    cardDescription: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 20,
    },
    progressContainer: {
        height: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressBar: {
        height: '100%',
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    progressText: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    badge: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
});

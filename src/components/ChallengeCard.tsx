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
                <Activity color={isActive ? Colors.warning : Colors.black} size={24} />
                <Text style={[styles.cardTitle, isActive && styles.activeText]}>{challenge.title}</Text>
                {isActive && <View style={styles.badge}><Text style={styles.badgeText}>Active</Text></View>}
            </View>
            <Text style={[styles.cardDescription, isActive && styles.activeDescription]}>{challenge.description}</Text>

            <View style={[styles.progressContainer, isActive && styles.activeProgressContainer]}>
                <View style={[styles.progressBar, { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: isActive ? Colors.white : Colors.black }]} />
            </View>
            <View style={styles.progressLabels}>
                <Text style={[styles.progressText, isActive && styles.activeProgressText]}>{isActive ? totalSteps.toLocaleString() : 0} steps</Text>
                <Text style={[styles.progressText, isActive && styles.activeProgressText]}>{challenge.goal.toLocaleString()} goal</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.card,
        borderRadius: Layout.borderRadius,
        padding: 16,
        marginBottom: 16,
        width: CARD_WIDTH,
        marginRight: 16,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    activeCard: {
        borderColor: Colors.primary,
        backgroundColor: Colors.black,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 10,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.black,
        flex: 1,
    },
    activeText: {
        color: Colors.white,
    },
    cardDescription: {
        fontSize: 13,
        color: Colors.black,
        marginBottom: 12,
    },
    activeDescription: {
        color: Colors.white,
    },
    progressContainer: {
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 0,
        overflow: 'hidden',
        marginBottom: 6,
        borderWidth: 1,
        borderColor: Colors.black,
    },
    activeProgressContainer: {
        borderColor: Colors.white,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    progressBar: {
        height: '100%',
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    progressText: {
        fontSize: 11,
        color: Colors.black,
    },
    activeProgressText: {
        color: Colors.white,
    },
    badge: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 0,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
});

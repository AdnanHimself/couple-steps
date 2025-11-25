import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { Colors, Layout } from '../constants/Colors';
// @ts-ignore
import { X, Footprints, Flame, Trophy } from 'lucide-react-native';

interface PartnerProfileSheetProps {
    visible: boolean;
    partner: {
        username: string;
        id: string;
    };
    todaySteps: number;
    highestStreak: number;
    completedChallenges: number;
    isActive: boolean; // Partner walked >10 steps in last minute
    onClose: () => void;
}

const { width } = Dimensions.get('window');

export const PartnerProfileSheet: React.FC<PartnerProfileSheetProps> = ({
    visible,
    partner,
    todaySteps,
    highestStreak,
    completedChallenges,
    isActive,
    onClose,
}) => {
    return (
        <Modal
            transparent
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
                <View style={styles.sheet}>
                    {/* Handle */}
                    <View style={styles.handle} />

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Partner Profile</Text>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <X color={Colors.black} size={24} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Partner Name + Active Status */}
                        <View style={styles.nameContainer}>
                            <Text style={styles.partnerName}>{partner.username}</Text>
                            {isActive && (
                                <View style={styles.activeBadge}>
                                    <View style={styles.activeDot} />
                                    <Text style={styles.activeText}>Active now</Text>
                                </View>
                            )}
                        </View>

                        {/* Stats Grid */}
                        <View style={styles.statsGrid}>
                            {/* Today's Steps */}
                            <View style={styles.statCard}>
                                <Footprints size={24} color={Colors.black} />
                                <Text style={styles.statValue}>{todaySteps.toLocaleString()}</Text>
                                <Text style={styles.statLabel}>steps today</Text>
                            </View>

                            {/* Highest Streak */}
                            <View style={styles.statCard}>
                                <Flame size={24} color={Colors.black} />
                                <Text style={styles.statValue}>{highestStreak}</Text>
                                <Text style={styles.statLabel}>best streak</Text>
                            </View>
                        </View>

                        {/* Completed Challenges */}
                        <View style={[styles.statCard, styles.fullWidthCard]}>
                            <Trophy size={28} color={Colors.black} />
                            <Text style={styles.statValue}>{completedChallenges}</Text>
                            <Text style={styles.statLabel}>solo challenges completed</Text>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheet: {
        backgroundColor: Colors.background,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        borderTopWidth: 3,
        borderLeftWidth: 3,
        borderRightWidth: 3,
        borderColor: Colors.black,
        maxHeight: '75%',
        padding: Layout.padding,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: Colors.black,
        borderRadius: 0,
        alignSelf: 'center',
        marginBottom: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.text,
    },
    closeButton: {
        padding: 4,
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        gap: 12,
    },
    partnerName: {
        fontSize: 28,
        fontWeight: '700',
        color: Colors.text,
    },
    activeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.white,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 0,
        borderWidth: 2,
        borderColor: '#22c55e',
    },
    activeDot: {
        width: 8,
        height: 8,
        borderRadius: 0,
        backgroundColor: '#22c55e',
    },
    activeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#22c55e',
        textTransform: 'uppercase',
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        backgroundColor: Colors.white,
        padding: 20,
        alignItems: 'center',
        gap: 8,
        borderWidth: 3,
        borderColor: Colors.black,
        borderRadius: 0,
    },
    fullWidthCard: {
        width: '100%',
    },
    statValue: {
        fontSize: 32,
        fontWeight: '800',
        color: Colors.text,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.black,
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Colors, Layout } from '../../constants/Colors';
import { useApp } from '../../context/AppContext';
import { CircularProgress } from '../ui/CircularProgress';
import { Card } from '../ui/Card';
import { LinearGradient } from 'expo-linear-gradient';
// @ts-ignore
import { Footprints, Flame, Plus } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const RING_SIZE = width * 0.28; // Reduced from 0.35

export const TodaysActivity = () => {
    const navigation = useNavigation<any>();
    // ... (rest of component logic remains the same until styles)

    // ...


    const { currentUser, partner, steps, stepHistory, isSolo } = useApp();

    const getTodaySteps = (userId: string) => {
        const today = new Date().toISOString().split('T')[0];
        return stepHistory.find(s => s.userId === userId && s.date === today)?.count || 0;
    };

    const userSteps = currentUser ? getTodaySteps(currentUser.id) : 0;
    const partnerSteps = partner ? getTodaySteps(partner.id) : 0;
    const dailyGoal = 10000; // Default goal

    // Calculate percentages
    const userProgress = Math.min(userSteps / dailyGoal, 1);
    const partnerProgress = Math.min(partnerSteps / dailyGoal, 1);
    const totalSteps = userSteps + partnerSteps;
    const totalGoal = isSolo ? dailyGoal : dailyGoal * 2;
    const totalProgress = Math.min(totalSteps / totalGoal, 1);

    // Estimates
    const totalKm = (totalSteps * 0.000762).toFixed(1); // Approx 76cm per step
    const totalKcal = Math.round(totalSteps * 0.04); // Approx 0.04 kcal per step

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Footprints size={20} color={Colors.primary} fill={Colors.primary} />
                    <Text style={styles.title}>Today's Activity</Text>
                </View>
                <View style={styles.goalBadge}>
                    <Text style={styles.goalText}>Goal: {isSolo ? '10k' : '20k'}</Text>
                </View>
            </View>

            <Card style={styles.mainCard} variant="default">
                <LinearGradient
                    colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}
                    style={styles.gradientBg}
                />

                <View style={styles.ringsContainer}>
                    {/* User Ring */}
                    <View style={styles.ringWrapper}>
                        <CircularProgress
                            size={RING_SIZE}
                            progress={userProgress}
                            strokeWidth={12}
                            color={Colors.primary}
                            backgroundColor="rgba(255,255,255,0.1)"
                        >
                            <View style={styles.ringContent}>
                                <Text style={styles.ringValue}>{userSteps.toLocaleString()}</Text>
                                <Text style={styles.ringLabel}>You</Text>
                            </View>
                        </CircularProgress>
                    </View>

                    {/* Divider / VS / Plus */}
                    <View style={styles.centerDivider}>
                        {isSolo ? (
                            <View style={styles.verticalLine} />
                        ) : (
                            <View style={styles.vsBadge}>
                                <Text style={styles.vsText}>&</Text>
                            </View>
                        )}
                    </View>

                    {/* Partner Ring */}
                    <View style={styles.ringWrapper}>
                        {isSolo ? (
                            <TouchableOpacity
                                style={[styles.addPartnerCircle, { width: RING_SIZE, height: RING_SIZE }]}
                                onPress={() => navigation.navigate('Coupling')}
                            >
                                <Plus size={32} color={Colors.black} />
                                <Text style={styles.addPartnerText}>Add Partner</Text>
                            </TouchableOpacity>
                        ) : (
                            <CircularProgress
                                size={RING_SIZE}
                                progress={partnerProgress}
                                strokeWidth={12}
                                color={Colors.secondary}
                                backgroundColor="rgba(255,255,255,0.1)"
                            >
                                <View style={styles.ringContent}>
                                    <Text style={[styles.ringValue, { color: Colors.secondary }]}>
                                        {partnerSteps.toLocaleString()}
                                    </Text>
                                    <Text style={styles.ringLabel}>
                                        {partner?.username?.split(' ')[0] || 'Partner'}
                                    </Text>
                                </View>
                            </CircularProgress>
                        )}
                    </View>
                </View>

                {/* Stats Footer */}
                <View style={styles.statsFooter}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{totalKm} km</Text>
                        <Text style={styles.statLabel}>Distance</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{totalKcal}</Text>
                        <Text style={styles.statLabel}>Calories</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: Colors.warning }]}>
                            {Math.round(totalProgress * 100)}%
                        </Text>
                        <Text style={styles.statLabel}>Completed</Text>
                    </View>
                </View>
            </Card>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 30,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingHorizontal: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
    },
    goalBadge: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 0,
    },
    goalText: {
        color: Colors.black,
        fontSize: 12,
        fontWeight: '600',
    },
    mainCard: {
        padding: 0, // Reset padding for custom internal layout
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    gradientBg: {
        ...StyleSheet.absoluteFillObject,
    },
    ringsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        paddingVertical: 25,
        paddingHorizontal: 10,
    },
    ringWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    ringContent: {
        alignItems: 'center',
    },
    ringValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    ringLabel: {
        fontSize: 12,
        color: Colors.black,
        marginTop: 2,
    },
    centerDivider: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    verticalLine: {
        width: 1,
        height: 60,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    vsBadge: {
        width: 30,
        height: 30,
        borderRadius: 0,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    vsText: {
        color: 'rgba(255,255,255,0.5)',
        fontWeight: 'bold',
        fontSize: 12,
    },
    addPartnerCircle: {
        borderRadius: 0,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.02)',
    },
    addPartnerText: {
        color: Colors.black,
        fontSize: 12,
        marginTop: 4,
    },
    statsFooter: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 15,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.black,
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: '60%',
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignSelf: 'center',
    },
});

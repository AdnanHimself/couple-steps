import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { useApp } from '../context/AppContext';
import { Colors, Layout } from '../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
// @ts-ignore
import { Footprints, Zap } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Card } from '../components/ui/Card';
import { CircularProgress } from '../components/ui/CircularProgress';
import { Button } from '../components/ui/Button';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export const DashboardScreen = () => {
    const navigation = useNavigation<any>();
    const { currentUser, partner, activeChallenge, steps, addSteps, sendNudge, isSolo } = useApp();

    const handleNudge = async () => {
        if (isSolo) {
            Alert.alert('Solo Mode', 'Connect with a partner to send nudges!');
            return;
        }
        if (partner) {
            const success = await sendNudge(partner.id, "Let's go for a walk! 🚶");
            if (success) {
                Alert.alert('Sent!', `Nudged ${partner.username}`);
            }
        }
    };

    const getTodaySteps = (userId: string) => {
        const today = new Date().toISOString().split('T')[0];
        return steps.find(s => s.userId === userId && s.date === today)?.count || 0;
    };

    const userSteps = currentUser ? getTodaySteps(currentUser.id) : 0;
    const partnerSteps = partner ? getTodaySteps(partner.id) : 0;
    const dailyGoal = 10000; // default goal

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={Colors.gradients.dark as any}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Hello, {currentUser?.username?.split(' ')[0] ?? 'Guest'}</Text>
                        <Text style={styles.subtitle}>
                            {isSolo ? 'Walking solo today' : `Walking with ${partner?.username?.split(' ')[0] ?? 'Partner'}`}
                        </Text>
                    </View>
                    {isSolo && (
                        <Button
                            title="Connect"
                            onPress={() => navigation.navigate('Coupling')}
                            variant="outline"
                            style={{ height: 40, minHeight: 40, paddingVertical: 0, paddingHorizontal: 16 }}
                            textStyle={{ fontSize: 14 }}
                        />
                    )}
                </View>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Active Challenge Hero */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Zap size={20} color={Colors.warning} fill={Colors.warning} />
                            <Text style={styles.sectionTitle}>Active Challenge</Text>
                        </View>
                        <View style={styles.sectionDivider} />
                        {activeChallenge ? (
                            <Card variant="primary" onPress={() => navigation.navigate('ChallengeSelection')}>
                                <View style={styles.activeChallengeContent}>
                                    <Text style={styles.activeChallengeTitle}>{activeChallenge.title}</Text>
                                    <Text style={styles.activeChallengeSubtitle}>{activeChallenge.description}</Text>
                                    <View style={styles.progressBarContainer}>
                                        <View
                                            style={[
                                                styles.progressBar,
                                                { width: `${Math.min((userSteps + partnerSteps) / activeChallenge.goal * 100, 100)}%` },
                                            ]}
                                        />
                                    </View>
                                    <Text style={styles.progressText}>
                                        {(userSteps + partnerSteps).toLocaleString()} / {activeChallenge.goal.toLocaleString()} steps
                                    </Text>
                                </View>
                            </Card>
                        ) : (
                            <Card variant="outlined" onPress={() => navigation.navigate('ChallengeSelection')}>
                                <View style={{ alignItems: 'center', padding: 20 }}>
                                    <Text style={{ color: Colors.textSecondary, marginBottom: 10 }}>No active challenge</Text>
                                    <Button title="Start a Challenge" onPress={() => navigation.navigate('ChallengeSelection')} variant="secondary" />
                                </View>
                            </Card>
                        )}
                    </View>

                    {/* Today's Activity redesign */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Today's Activity</Text>
                        </View>
                        <View style={styles.sectionDivider} />
                        <View style={styles.activitySection}>
                            {/* User Card */}
                            <View style={styles.cardWrapper}>
                                <Card style={styles.activityCard}>
                                    <CircularProgress
                                        progress={Math.min(userSteps / dailyGoal, 1)}
                                        size={width * 0.25}
                                        color={Colors.primary}
                                    >
                                        <View style={{ alignItems: 'center' }}>
                                            <Text style={styles.activityValue}>{userSteps.toLocaleString()}</Text>
                                            <Text style={styles.activityLabel}>You</Text>
                                        </View>
                                    </CircularProgress>
                                </Card>
                            </View>

                            {/* Spacer */}
                            <View style={{ width: 16 }} />

                            {/* Partner Card */}
                            <View style={styles.cardWrapper}>
                                <Card style={styles.activityCard} onPress={isSolo ? () => navigation.navigate('Coupling') : undefined}>
                                    {isSolo ? (
                                        <View style={{ alignItems: 'center', justifyContent: 'center', height: width * 0.25 }}>
                                            <View style={styles.addPartnerIcon}>
                                                <Text style={{ fontSize: 24, color: Colors.textSecondary }}>+</Text>
                                            </View>
                                            <Text style={[styles.activityLabel, { marginTop: 10 }]}>Add Partner</Text>
                                        </View>
                                    ) : (
                                        <CircularProgress
                                            progress={Math.min(partnerSteps / dailyGoal, 1)}
                                            size={width * 0.25}
                                            color={Colors.secondary}
                                        >
                                            <View style={{ alignItems: 'center' }}>
                                                <Text style={styles.activityValue}>{partnerSteps.toLocaleString()}</Text>
                                                <Text style={styles.activityLabel}>{partner?.username?.split(' ')[0] ?? 'Partner'}</Text>
                                            </View>
                                        </CircularProgress>
                                    )}
                                </Card>
                            </View>
                        </View>
                        {/* Combined Progress Bar */}
                        <View style={styles.totalProgressBar}>
                            <View
                                style={[
                                    styles.totalProgressFill,
                                    { width: `${Math.min((userSteps + partnerSteps) / dailyGoal, 1) * 100}%` },
                                ]}
                            />
                        </View>
                    </View>

                    {/* Actions */}
                    {!isSolo && (
                        <Button
                            title="Nudge Partner"
                            onPress={handleNudge}
                            icon={<Footprints color={Colors.white} size={20} />}
                            variant="secondary"
                            style={{ marginBottom: 20 }}
                        />
                    )}

                    {/* Debug */}
                    <TouchableOpacity
                        style={{ alignSelf: 'center', padding: 10, opacity: 0.5 }}
                        onPress={() => addSteps(500)}
                    >
                        <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>+500 Steps (Debug)</Text>
                    </TouchableOpacity>

                    <View style={{ height: 100 }} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    safeArea: { flex: 1 },
    scrollContent: { padding: Layout.padding },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: Layout.headerHeight,
        paddingTop: Layout.headerPaddingTop,
        paddingHorizontal: Layout.headerPaddingHorizontal,
    },
    greeting: { fontSize: Layout.headerFontSize, fontWeight: 'bold', color: Colors.text },
    subtitle: { fontSize: 16, color: Colors.textSecondary, marginTop: 4 },
    section: { marginBottom: 30 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    sectionDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 15 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
    activeChallengeContent: { gap: 10 },
    activeChallengeTitle: { fontSize: 22, fontWeight: 'bold', color: Colors.white },
    activeChallengeSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
    progressBarContainer: { height: 6, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 3, marginTop: 10, overflow: 'hidden' },
    progressBar: { height: '100%', backgroundColor: Colors.white, borderRadius: 3 },
    progressText: { fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
    activitySection: { flexDirection: 'row', alignItems: 'center' },
    cardWrapper: { flex: 1, minWidth: 0 },
    activityCard: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', paddingVertical: 15, paddingHorizontal: 0 },
    activityValue: { fontSize: 24, fontWeight: 'bold', color: Colors.text },
    activityLabel: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
    addPartnerIcon: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: Colors.textSecondary, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
    totalProgressBar: { height: 8, backgroundColor: Colors.surface, borderRadius: 4, overflow: 'hidden', marginTop: 20 },
    totalProgressFill: { height: '100%', backgroundColor: Colors.primary },
});

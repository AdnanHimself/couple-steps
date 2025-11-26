import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, AppState } from 'react-native';
import { useApp } from '../context/AppContext';
import { Colors, Layout } from '../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActiveChallengeCard } from '../components/dashboard/ActiveChallengeCard';
import { StreakInfoCard } from '../components/dashboard/StreakInfoCard';
import { Button } from '../components/ui/Button';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { NudgeService, Nudge, NudgeType } from '../services/NudgeService';
import { NudgeInboxSheet } from '../components/NudgeInboxSheet';
import { SendNudgeSheet } from '../components/SendNudgeSheet';
import { NudgeSnackbar } from '../components/NudgeSnackbar';
import { supabase } from '../lib/supabase';
// @ts-ignore
import { Bell, Terminal } from 'lucide-react-native';
import { DebugBottomSheet } from '../components/DebugBottomSheet';
import { NudgeHistorySheet } from '../components/NudgeHistorySheet';

type DashboardScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;
};

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
    const { currentUser, partner, activeChallenge, activeSoloChallenge, steps, stepHistory, isSolo, challenges, isPartnerActive } = useApp();

    // Nudge State
    const [nudges, setNudges] = useState<Nudge[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNudgeInbox, setShowNudgeInbox] = useState(false);
    const [showSendNudge, setShowSendNudge] = useState(false);
    const [incomingNudge, setIncomingNudge] = useState<Nudge | null>(null);
    const [showSnackbar, setShowSnackbar] = useState(false);
    const [showDebug, setShowDebug] = useState(false);
    const [showNudgeHistory, setShowNudgeHistory] = useState(false);

    const userSteps = useMemo(() => {
        if (!currentUser) return 0;
        const today = new Date().toISOString().split('T')[0];
        return stepHistory.find(s => s.userId === currentUser.id && s.date === today)?.count || 0;
    }, [stepHistory, currentUser]);

    const partnerSteps = useMemo(() => {
        if (!partner) return 0;
        const today = new Date().toISOString().split('T')[0];
        return stepHistory.find(s => s.userId === partner.id && s.date === today)?.count || 0;
    }, [stepHistory, partner]);

    const currentStreak = useMemo(() => {
        if (!currentUser) return 0;
        let streak = 0;
        const today = new Date();
        const checkDate = new Date(today);

        // Simple streak calculation (checking past 30 days)
        for (let i = 0; i < 30; i++) {
            const dateStr = checkDate.toISOString().split('T')[0];
            const daySteps = stepHistory.find(s => s.userId === currentUser.id && s.date === dateStr);
            const hasGoalSteps = daySteps && daySteps.count >= 5000;

            if (hasGoalSteps) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                if (i === 0) {
                    // If today hasn't reached 5k yet, don't break streak, just check yesterday
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    break;
                }
            }
        }
        return streak;
    }, [stepHistory, currentUser]);

    const highestStreak = useMemo(() => {
        if (!currentUser) return 0;
        let maxStreak = 0;
        let currentTempStreak = 0;
        const today = new Date();

        // Check last 30 days for the highest streak
        for (let i = 0; i < 30; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(checkDate.getDate() - i);
            const dateStr = checkDate.toISOString().split('T')[0];
            const daySteps = stepHistory.find(s => s.userId === currentUser.id && s.date === dateStr);
            const hasGoalSteps = daySteps && daySteps.count >= 5000;

            if (hasGoalSteps) {
                currentTempStreak++;
                maxStreak = Math.max(maxStreak, currentTempStreak);
            } else {
                currentTempStreak = 0;
            }
        }
        return maxStreak;
    }, [stepHistory, currentUser]);

    // Load nudges on mount
    useEffect(() => {
        if (!currentUser) return;
        loadNudges();
    }, [currentUser]);

    // Real-time subscription for new nudges
    useEffect(() => {
        if (!currentUser) return;

        const subscription = supabase
            .channel('nudges_channel')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'nudges',
                filter: `receiver_id=eq.${currentUser.id}`,
            }, (payload) => {
                const newNudge = payload.new as Nudge;
                setNudges(prev => [newNudge, ...prev]);
                setUnreadCount(prev => prev + 1);

                // Show snackbar
                setIncomingNudge(newNudge);
                setShowSnackbar(true);
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [currentUser]);



    const loadNudges = async () => {
        if (!currentUser) return;
        const fetchedNudges = await NudgeService.getNudges(currentUser.id);
        setNudges(fetchedNudges);
        const count = await NudgeService.getUnreadCount(currentUser.id);
        setUnreadCount(count);
    };

    const handleMarkAsRead = async (nudgeId: string) => {
        await NudgeService.markAsRead(nudgeId);
        setNudges(prev => prev.map(n => n.id === nudgeId ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleSendNudge = async (type: NudgeType) => {
        if (!currentUser || !partner) return;

        // Generate appropriate message based on type
        const messages: Record<NudgeType, string> = {
            motivate: "You've got this! Keep moving forward.",
            challenge: "Think you can beat my 10k steps today?",
            cheer: "You're absolutely crushing it today!",
            poke: "Hey! Let's get those steps in!",
            heart: "Sending you love and motivation!",
            wave: "Hey there! How's your day going?"
        };

        await NudgeService.sendNudge(currentUser.id, partner.id, messages[type], type);
    };

    const handleSnackbarPress = () => {
        setShowSnackbar(false);
        setShowNudgeInbox(true);
    };

    // Determine Active Solo Challenge (or default to first available)
    const displaySoloChallenge = activeSoloChallenge || challenges.find(c => c.type === 'solo') || {
        id: 'default-solo',
        title: 'Start a Solo Challenge',
        goal: 5000,
        type: 'solo' as const,
        imageUrl: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&q=80',
        description: 'Select a challenge to start tracking!',
        durationDays: 1,
        milestones: []
    };

    // Determine Active Couple Challenge (or default to first available)
    const displayCoupleChallenge = activeChallenge || challenges.find(c => c.type === 'couple') || {
        id: 'default-couple',
        title: 'Start a Couple Challenge',
        goal: 10000,
        type: 'couple' as const,
        imageUrl: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800&q=80',
        description: 'Select a challenge to do with your partner!',
        durationDays: 1,
        milestones: []
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Hello, {currentUser?.username?.split(' ')[0] ?? 'Guest'}</Text>
                        <View style={styles.subtitleContainer}>
                            <Text style={styles.subtitle}>
                                {isSolo ? 'Walking solo today' : `Walking with ${partner?.username?.split(' ')[0] ?? 'Partner'}`}
                            </Text>
                            {isPartnerActive && !isSolo && (
                                <View style={styles.activeBadge}>
                                    <View style={styles.activeDot} />
                                    <Text style={styles.activeText}>Active</Text>
                                </View>
                            )}
                        </View>
                    </View>
                    {isSolo ? (
                        <Button
                            title="Connect"
                            onPress={() => navigation.navigate('Coupling')}
                            variant="outline"
                            style={{ height: 40, minHeight: 40, paddingVertical: 0, paddingHorizontal: 16 }}
                            textStyle={{ fontSize: 14 }}
                        />
                    ) : (
                        <Button
                            title="Nudge History"
                            onPress={() => setShowNudgeHistory(true)}
                            variant="outline"
                            style={{ height: 40, minHeight: 40, paddingVertical: 0, paddingHorizontal: 16 }}
                            textStyle={{ fontSize: 14 }}
                        />
                    )}
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Solo Challenge Section */}
                    <Text style={styles.sectionTitle}>Solo Challenge</Text>
                    <ActiveChallengeCard
                        title={displaySoloChallenge.title}
                        currentSteps={userSteps}
                        goal={displaySoloChallenge.goal}
                        type="solo"
                        imageUrl={displaySoloChallenge.imageUrl}
                        state={activeSoloChallenge ? 'active' : 'empty'}
                        onPress={() => navigation.navigate('ChallengeSelection')}
                    />

                    {/* Couple Challenge Section */}
                    <Text style={styles.sectionTitle}>Couple Challenge</Text>
                    <ActiveChallengeCard
                        title={displayCoupleChallenge.title}
                        currentSteps={userSteps + partnerSteps}
                        goal={displayCoupleChallenge.goal}
                        type="couple"
                        imageUrl={displayCoupleChallenge.imageUrl}
                        state={isSolo ? 'no-partner' : (activeChallenge ? 'active' : 'empty')}
                        onPress={isSolo ? () => navigation.navigate('Coupling') : () => navigation.navigate('ChallengeSelection')}
                    />

                    {/* Streaks */}
                    <StreakInfoCard streak={currentStreak} highestStreak={highestStreak} />

                    <View style={{ height: 100 }} />
                </ScrollView>
            </SafeAreaView>

            {/* Nudge Components */}
            {partner && (
                <>
                    <NudgeInboxSheet
                        visible={showNudgeInbox}
                        nudges={nudges}
                        partnerName={partner.username || 'Partner'}
                        unreadCount={unreadCount}
                        onClose={() => setShowNudgeInbox(false)}
                        onMarkAsRead={handleMarkAsRead}
                    />
                    <SendNudgeSheet
                        visible={showSendNudge}
                        onClose={() => setShowSendNudge(false)}
                        onSend={handleSendNudge}
                    />
                    <NudgeSnackbar
                        visible={showSnackbar}
                        senderName={partner.username || 'Partner'}
                        message={incomingNudge?.message || ''}
                        type={incomingNudge?.type || 'cheer'}
                        onPress={handleSnackbarPress}
                        onDismiss={() => setShowSnackbar(false)}
                    />
                </>
            )}

            <DebugBottomSheet
                visible={showDebug}
                onClose={() => setShowDebug(false)}
            />

            <NudgeHistorySheet
                visible={showNudgeHistory}
                onClose={() => setShowNudgeHistory(false)}
                onSendNudge={() => setShowSendNudge(true)}
            />
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
        marginBottom: 10,
    },
    greeting: { fontSize: Layout.headerFontSize, fontWeight: 'bold', color: Colors.text },
    subtitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    subtitle: { fontSize: 16, color: Colors.black },
    activeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#dcfce7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 0,
    },
    activeDot: {
        width: 6,
        height: 6,
        borderRadius: 0,
        backgroundColor: '#22c55e',
    },
    activeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#166534',
        textTransform: 'uppercase',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.black,
        marginBottom: 12,
        marginTop: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    sendNudgeButton: {
        backgroundColor: Colors.black,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 0,
    },
    sendNudgeText: {
        color: Colors.white,
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    bellButton: {
        padding: 8,
        position: 'relative',
    },
    bellBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#ef4444',
        minWidth: 16,
        height: 16,
        borderRadius: 0,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.white,
    },
    bellBadgeText: {
        color: Colors.white,
        fontSize: 10,
        fontWeight: 'bold',
    },
});

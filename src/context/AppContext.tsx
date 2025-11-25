import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User, StepLog, Challenge, DBStepLog } from '../types';
import { StepService } from '../services/StepService';
import { ChallengeService } from '../services/ChallengeService';
import { NudgeService, NudgeType, Nudge } from '../services/NudgeService';
import { Colors } from '../constants/Colors';
import { Logger } from '../utils/Logger';
import { Pedometer } from 'expo-sensors';
import {
    initialize,
    requestPermission,
    readRecords,
    getSdkStatus,
    SdkAvailabilityStatus,
    getGrantedPermissions,
} from 'react-native-health-connect';
import { Platform, AppState } from 'react-native';

interface AppContextType {
    currentUser: User | null;
    partner: User | null;
    steps: number;
    partnerSteps: number;
    activeChallenge: Challenge | null;
    loading: boolean;
    refreshData: () => Promise<void>;
    updateSteps: (count: number) => void;
    isSolo: boolean;
    sendNudge: (receiverId: string, message: string, type: NudgeType) => Promise<boolean>;
    selectChallenge: (challenge: Challenge) => Promise<void>;
    unreadNudges: number;
    markNudgeAsRead: (nudgeId: string) => Promise<void>;
    nudges: Nudge[];
    stepHistory: StepLog[];
    activeSoloChallenge: Challenge | null;
    challenges: Challenge[];
    isPartnerActive: boolean;
    setActiveChallenge: (challenge: Challenge) => Promise<void>;
    setActiveSoloChallenge: (challenge: Challenge) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [partner, setPartner] = useState<User | null>(null);
    const [steps, setSteps] = useState<number>(0);
    const [partnerSteps, setPartnerSteps] = useState<number>(0);
    const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [stepHistory, setStepHistory] = useState<StepLog[]>([]);
    const [unreadNudges, setUnreadNudges] = useState<number>(0);
    const [nudges, setNudges] = useState<Nudge[]>([]);
    const [activeSoloChallenge, setActiveSoloChallenge] = useState<Challenge | null>(null);
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [isPartnerActive, setIsPartnerActive] = useState<boolean>(false);

    // Hybrid Tracking: Native Sensor (Foreground) + Health Service (Background)
    let pollingInterval: ReturnType<typeof setInterval> | null = null;
    const initHybridTracking = async () => {
        if (Platform.OS !== 'android') return;

        try {
            // 1. Initialize Health Connect (Background)
            const status = await getSdkStatus();
            if (status === SdkAvailabilityStatus.SDK_AVAILABLE) {
                const initialized = await initialize();
                if (initialized) {
                    const permissionsRequested = [
                        { accessType: 'read' as const, recordType: 'Steps' as const },
                        { accessType: 'write' as const, recordType: 'Steps' as const }
                    ];

                    await requestPermission(permissionsRequested);

                    // Verify permissions were granted
                    const grantedPermissions = await getGrantedPermissions();
                    const hasReadPermission = grantedPermissions.some(
                        p => p.recordType === 'Steps' && p.accessType === 'read'
                    );

                    if (!hasReadPermission) {
                        Logger.error('Health Connect permissions not granted');
                        return;
                    }

                    Logger.info('Health Connect initialized with permissions');
                }
            }

            // 2. Start Pedometer (Foreground/Real-time)
            const isAvailable = await Pedometer.isAvailableAsync();
            if (isAvailable) {
                // Watch for live updates
                Pedometer.watchStepCount(result => {
                    // We only use this for "live" UI feedback, but rely on Health Connect for the source of truth
                    // Or we can accumulate. For now, let's just log it.
                    // console.log('Live Pedometer Step:', result.steps);
                    // In a real hybrid implementation, we would merge this with the base count.
                });
            }

            // 3. Polling Mechanism (Sync every 1 min)
            // This pulls from Health Connect (which aggregates all sources including system pedometer)
            const syncSteps = async () => {
                if (!currentUser) return;

                const now = new Date();
                const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

                try {
                    const records = await readRecords('Steps', {
                        timeRangeFilter: {
                            operator: 'between',
                            startTime: startOfDay.toISOString(),
                            endTime: now.toISOString(),
                        },
                    });

                    const totalSteps = records.records.reduce((acc: number, record: any) => acc + record.count, 0);
                    if (totalSteps > steps) {
                        updateSteps(totalSteps);
                    }
                } catch (e) {
                    Logger.error('Health Connect Sync Error:', e);
                }
            };

            // Initial Sync
            syncSteps();
            // Poll
            pollingInterval = setInterval(syncSteps, 60000);

        } catch (e) {
            Logger.error('Hybrid Tracking Init Error:', e);
        }
    };

    const loadData = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                setCurrentUser(null);
                setLoading(false);
                return;
            }

            // 1. Fetch Current User Profile
            let userProfile = null;
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (error) throw error;
                userProfile = {
                    ...data,
                    avatarUrl: data.avatar_url, // Map snake_case to camelCase
                    color: Colors.primary // Default color since not in DB
                };
                setCurrentUser(userProfile);
            } catch (e) {
                Logger.error('Error fetching user profile:', e);
                // Fallback or critical error handling
            }

            if (!userProfile) {
                setLoading(false);
                return;
            }

            // 2. Fetch Partner (if exists)
            let partnerProfile = null;
            try {
                const { data: coupleData, error: coupleError } = await supabase
                    .from('couples')
                    .select('user1_id, user2_id')
                    .or(`user1_id.eq.${userProfile.id},user2_id.eq.${userProfile.id}`)
                    .single();

                if (coupleData) {
                    const partnerId = coupleData.user1_id === userProfile.id ? coupleData.user2_id : coupleData.user1_id;
                    if (partnerId) {
                        const { data: pData, error: pError } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('id', partnerId)
                            .single();
                        if (pData) {
                            const partnerUser = {
                                ...pData,
                                avatarUrl: pData.avatar_url,
                                color: Colors.secondary // Default color for partner
                            };
                            partnerProfile = partnerUser;
                            setPartner(partnerUser);
                        }
                    }
                }
            } catch (e) {
                Logger.error('Error fetching partner:', e);
            }

            // 3. Fetch Steps (My Steps & Partner Steps)
            try {
                // My Steps (from DB for persistence check, but local sensor will override)
                const history = await StepService.getHistory(userProfile.id, partnerProfile ? partnerProfile.id : 'none');
                const realSteps: StepLog[] = history.map((h: DBStepLog) => ({
                    userId: h.user_id,
                    date: h.date,
                    count: h.count
                }));
                setStepHistory(realSteps);

                // Set today's steps from history if available
                const today = new Date().toISOString().split('T')[0];
                const todayLog = realSteps.find(s => s.date === today && s.userId === userProfile.id);
                if (todayLog) {
                    setSteps(todayLog.count);
                }

                // Partner Steps
                if (partnerProfile) {
                    const pSteps = await StepService.getPartnerSteps(partnerProfile.id);
                    setPartnerSteps(pSteps);
                }
            } catch (e) {
                Logger.error('Error fetching steps:', e);
            }

            // 4. Fetch Active Challenge
            try {
                if (partnerProfile) {
                    // Couple Challenge
                    const { data: coupleData } = await supabase
                        .from('couples')
                        .select('id')
                        .or(`user1_id.eq.${userProfile.id},user2_id.eq.${userProfile.id}`)
                        .single();

                    if (coupleData) {
                        const active = await ChallengeService.getActiveChallenge(coupleData.id);
                        setActiveChallenge(active);
                    }
                } else {
                    // Solo Challenge
                    const active = await ChallengeService.getActiveSoloChallenge(userProfile.id);
                    setActiveChallenge(active);
                    setActiveSoloChallenge(active);
                }

                // Always try to fetch active solo challenge even if coupled (for solo view)
                const solo = await ChallengeService.getActiveSoloChallenge(userProfile.id);
                setActiveSoloChallenge(solo);
            } catch (e) {
                Logger.error('Error fetching active challenge:', e);
            }

            // 5. Fetch Nudges & Unread Count
            try {
                const count = await NudgeService.getUnreadCount(userProfile.id);
                setUnreadNudges(count);

                const nudgeList = await NudgeService.getNudges(userProfile.id);
                setNudges(nudgeList);
            } catch (e) {
                Logger.error('Error fetching nudges:', e);
            }

            // 6. Fetch Challenges List
            try {
                const allChallenges = await ChallengeService.getChallenges();
                setChallenges(allChallenges);
            } catch (e) {
                Logger.error('Error fetching challenges:', e);
            }

            // 7. Determine Partner Activity
            if (partnerProfile) {
                // Simple check: if partner has steps today > 0
                const pSteps = await StepService.getPartnerSteps(partnerProfile.id);
                setIsPartnerActive(pSteps > 0);
            }

            // Initialize step tracking after user is loaded
            if (Platform.OS === 'android') {
                initHybridTracking();
            }

        } catch (e) {
            Logger.error('Global Load Data Error:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();

        // Listen for Auth Changes
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') loadData();
            if (event === 'SIGNED_OUT') {
                setCurrentUser(null);
                setPartner(null);
                setSteps(0);
            }
        });

        // Realtime Subscriptions
        const channel = supabase.channel('app_updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'nudges' }, (payload) => {
                if (currentUser && payload.new && (payload.new as Nudge).receiver_id === currentUser.id) {
                    // Refresh nudges
                    NudgeService.getUnreadCount(currentUser.id).then(setUnreadNudges);
                    NudgeService.getNudges(currentUser.id).then(setNudges);
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_steps' }, (payload) => {
                // If partner updated steps
                if (partner && payload.new && (payload.new as DBStepLog).user_id === partner.id) {
                    const newSteps = (payload.new as DBStepLog).count;
                    setPartnerSteps(newSteps);
                }
            })
            .subscribe();

        return () => {
            authListener.subscription.unsubscribe();
            supabase.removeChannel(channel);
            if (pollingInterval) clearInterval(pollingInterval);
        };
    }, []);

    const refreshData = async () => {
        await loadData();
    };

    const updateSteps = (newCount: number) => {
        setSteps(newCount);
        // Optimistic update for history
        const today = new Date().toISOString().split('T')[0];
        setStepHistory(prev => {
            const existing = prev.find(h => h.date === today && h.userId === currentUser?.id);

            // Sync to DB
            if (currentUser) {
                StepService.syncDailySteps(currentUser.id, newCount);
            }

            if (existing) {
                return prev.map(s => s === existing ? { ...s, count: newCount } : s);
            } else {
                return [...prev, { date: today, userId: currentUser?.id || '', count: newCount }];
            }
        });
    };

    const isSolo = !partner;

    const sendNudge = async (receiverId: string, message: string, type: NudgeType = 'motivate') => {
        if (!currentUser || !partner) return false;
        return await NudgeService.sendNudge(currentUser.id, receiverId, message, type);
    };

    const selectChallenge = async (challenge: Challenge) => {
        if (!currentUser) return;

        // Get couple ID
        const { data: coupleData } = await supabase
            .from('couples')
            .select('id')
            .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`)
            .single();

        if (coupleData) {
            const success = await ChallengeService.setActiveChallenge(coupleData.id, challenge.id);
            if (success) {
                setActiveChallenge(challenge);
            }
        } else {
            // Solo
            const success = await ChallengeService.setActiveSoloChallenge(currentUser.id, challenge.id);
            if (success) {
                setActiveChallenge(challenge);
            }
        }
    };

    const markNudgeAsRead = async (nudgeId: string) => {
        await NudgeService.markAsRead(nudgeId);
        setNudges(prev => prev.map(n => n.id === nudgeId ? { ...n, read: true } : n));
        setUnreadNudges(prev => Math.max(0, prev - 1));
    };

    return (
        <AppContext.Provider value={{
            currentUser,
            partner,
            steps,
            partnerSteps,
            activeChallenge,
            loading,
            refreshData,
            updateSteps,
            isSolo,
            sendNudge,
            selectChallenge,
            unreadNudges,
            markNudgeAsRead,
            nudges,
            stepHistory,
            activeSoloChallenge,
            challenges,
            isPartnerActive,
            setActiveSoloChallenge: async (c) => {
                if (!currentUser) return;
                await ChallengeService.setActiveSoloChallenge(currentUser.id, c.id);
                setActiveSoloChallenge(c);
            },
            setActiveChallenge: async (c) => {
                if (!currentUser) return;
                await selectChallenge(c);
            }
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};

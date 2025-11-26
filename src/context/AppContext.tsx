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

/**
 * AppContextType defines the shape of the global application state.
 * It includes user data, step counts, challenges, and helper functions.
 */
interface AppContextType {
    currentUser: User | null;
    partner: User | null;
    steps: number; // Current user's steps for today
    partnerSteps: number; // Partner's steps for today
    activeChallenge: Challenge | null; // Currently active couple or solo challenge
    loading: boolean; // Global loading state
    refreshData: () => Promise<void>; // Function to manually refresh all data
    updateSteps: (count: number) => void; // Function to update local step count
    isSolo: boolean; // True if user has no partner
    sendNudge: (receiverId: string, message: string, type: NudgeType) => Promise<boolean>;
    selectChallenge: (challenge: Challenge) => Promise<void>;
    unreadNudges: number;
    markNudgeAsRead: (nudgeId: string) => Promise<void>;
    nudges: Nudge[];
    stepHistory: StepLog[]; // History of user's steps
    activeSoloChallenge: Challenge | null;
    challenges: Challenge[]; // List of available challenges
    isPartnerActive: boolean; // True if partner has activity today
    setActiveChallenge: (challenge: Challenge) => Promise<void>;
    setActiveSoloChallenge: (challenge: Challenge) => Promise<void>;
    requestPermissions: () => Promise<void>; // Manually request Health Connect permissions
    setCurrentUser: (user: User | null) => void;
    isReady: boolean; // True when initial data load is complete
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * AppProvider component that wraps the application and provides global state.
 * Handles:
 * - Authentication state monitoring
 * - Data fetching (User, Partner, Steps, Challenges, Nudges)
 * - Hybrid Step Tracking (Health Connect + Pedometer)
 * - Realtime updates via Supabase
 */
export const AppProvider = ({ children }: { children: ReactNode }) => {
    // --- State Definitions ---
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [partner, setPartner] = useState<User | null>(null);
    const [steps, setSteps] = useState<number>(0);
    const [partnerSteps, setPartnerSteps] = useState<number>(0);
    const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [isReady, setIsReady] = useState<boolean>(false);
    const [stepHistory, setStepHistory] = useState<StepLog[]>([]);
    const [unreadNudges, setUnreadNudges] = useState<number>(0);
    const [nudges, setNudges] = useState<Nudge[]>([]);
    const [activeSoloChallenge, setActiveSoloChallenge] = useState<Challenge | null>(null);
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [isPartnerActive, setIsPartnerActive] = useState<boolean>(false);

    /**
     * Initializes hybrid step tracking.
     * 1. Checks and requests Health Connect permissions (Android).
     * 2. Sets up Pedometer for live foreground updates (optional/visual).
     */
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

                    try {
                        await requestPermission(permissionsRequested);

                        // Verify permissions were granted
                        const grantedPermissions = await getGrantedPermissions();
                        const hasReadPermission = grantedPermissions.some(
                            p => p.recordType === 'Steps' && p.accessType === 'read'
                        );

                        if (!hasReadPermission) {
                            Logger.info('Health Connect permissions not granted by user');
                            return;
                        }

                        Logger.info('Health Connect initialized with permissions');
                    } catch (permError) {
                        Logger.error('Health Connect permission error - continuing without it:', permError);
                        return;
                    }
                }
            }

            // 2. Start Pedometer (Foreground/Real-time)
            try {
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
            } catch (pedometerError) {
                Logger.error('Pedometer error - continuing without it:', pedometerError);
            }

        } catch (e) {
            Logger.error('Hybrid Tracking Init Error:', e);
        }
    };

    /**
     * Syncs steps from Health Connect.
     * Reads step records for the current day and updates the state if the count is higher.
     * This is the source of truth for step data on Android.
     */
    const syncSteps = async () => {
        if (!currentUser || Platform.OS !== 'android') return;

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        try {
            Logger.info(`Syncing steps from ${startOfDay.toISOString()} to ${now.toISOString()}`);

            const records = await readRecords('Steps', {
                timeRangeFilter: {
                    operator: 'between',
                    startTime: startOfDay.toISOString(),
                    endTime: now.toISOString(),
                },
            });

            const totalSteps = records.records.reduce((acc: number, record: any) => acc + record.count, 0);
            Logger.info(`Health Connect: Found ${records.records.length} records, Total Steps: ${totalSteps}`);

            if (totalSteps > steps) {
                updateSteps(totalSteps);
            }
        } catch (e) {
            Logger.error('Health Connect Sync Error:', e);
        }
    };
    /**
     * Main data fetching function.
     * Loads: User Profile, Partner Profile, Step History, Active Challenges, Nudges.
     * Also initializes background step tracking on Android.
     */
    const loadData = async () => {
        // Only set loading true if we don't have a user yet (initial load)
        if (!currentUser) setLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                setCurrentUser(null);
                setLoading(false);
                setIsReady(true);
                return;
            }

            // 1. Fetch Current User Profile (Blocking)
            let userProfile: User | null = null;
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (error) throw error;
                userProfile = {
                    ...data,
                    avatarUrl: data.avatar_url,
                    color: Colors.primary,
                    email: session.user.email
                };
                setCurrentUser(userProfile);
            } catch (e) {
                Logger.error('Error fetching user profile:', e);
            }

            if (!userProfile) {
                setLoading(false);
                setIsReady(true);
                return;
            }

            // 2. Parallel Data Fetching
            const promises = [];

            // A. Fetch Partner
            const fetchPartner = async () => {
                try {
                    const { data: coupleData } = await supabase
                        .from('couples')
                        .select('user1_id, user2_id')
                        .or(`user1_id.eq.${userProfile!.id},user2_id.eq.${userProfile!.id}`)
                        .single();

                    if (coupleData) {
                        const partnerId = coupleData.user1_id === userProfile!.id ? coupleData.user2_id : coupleData.user1_id;
                        if (partnerId) {
                            const { data: pData } = await supabase
                                .from('profiles')
                                .select('*')
                                .eq('id', partnerId)
                                .single();
                            if (pData) {
                                const partnerUser = {
                                    ...pData,
                                    avatarUrl: pData.avatar_url,
                                    color: Colors.secondary
                                };
                                setPartner(partnerUser);
                                return partnerUser;
                            }
                        }
                    }
                    setPartner(null);
                    return null;
                } catch (e) {
                    Logger.error('Error fetching partner:', e);
                    setPartner(null);
                    return null;
                }
            };

            // B. Fetch Challenges (List)
            const fetchChallenges = async () => {
                try {
                    const allChallenges = await ChallengeService.getChallenges();
                    setChallenges(allChallenges);
                } catch (e) {
                    Logger.error('Error fetching challenges:', e);
                }
            };

            // C. Fetch Nudges
            const fetchNudges = async () => {
                try {
                    const [count, nudgeList] = await Promise.all([
                        NudgeService.getUnreadCount(userProfile!.id),
                        NudgeService.getNudges(userProfile!.id)
                    ]);
                    setUnreadNudges(count);
                    setNudges(nudgeList);
                } catch (e) {
                    Logger.error('Error fetching nudges:', e);
                }
            };

            // Execute independent fetches
            const [partnerResult] = await Promise.all([
                fetchPartner(),
                fetchChallenges(),
                fetchNudges()
            ]);

            // D. Dependent Fetches (Need Partner or Challenges)
            const fetchStepsAndActiveChallenge = async () => {
                try {
                    // My Steps
                    const history = await StepService.getHistory(userProfile!.id, partnerResult ? partnerResult.id : 'none');
                    const realSteps: StepLog[] = history.map((h: DBStepLog) => ({
                        userId: h.user_id,
                        date: h.date,
                        count: h.count
                    }));
                    setStepHistory(realSteps);

                    const today = new Date().toISOString().split('T')[0];
                    const todayLog = realSteps.find(s => s.date === today && s.userId === userProfile?.id);
                    if (todayLog) setSteps(todayLog.count);

                    // Partner Steps
                    if (partnerResult) {
                        const pSteps = await StepService.getPartnerSteps(partnerResult.id);
                        setPartnerSteps(pSteps);
                        setIsPartnerActive(pSteps > 0);
                    }

                    // Active Challenge
                    if (partnerResult) {
                        // Couple Challenge
                        const { data: coupleData } = await supabase
                            .from('couples')
                            .select('id')
                            .or(`user1_id.eq.${userProfile!.id},user2_id.eq.${userProfile!.id}`)
                            .single();

                        if (coupleData) {
                            const active = await ChallengeService.getActiveChallenge(coupleData.id);
                            setActiveChallenge(active);
                        }
                    } else {
                        // Solo Challenge
                        let solo = await ChallengeService.getActiveSoloChallenge(userProfile!.id);

                        // Default to first solo challenge if none selected
                        if (!solo) {
                            const allChallenges = await ChallengeService.getChallenges();
                            if (allChallenges && allChallenges.length > 0) {
                                const firstChallenge = allChallenges[0];
                                await ChallengeService.setActiveSoloChallenge(userProfile!.id, firstChallenge.id);
                                solo = firstChallenge;
                            }
                        }
                        setActiveChallenge(solo);
                        setActiveSoloChallenge(solo);
                    }
                } catch (e) {
                    Logger.error('Error fetching dependent data:', e);
                }
            };

            await fetchStepsAndActiveChallenge();

            // Initialize step tracking after user is loaded
            if (Platform.OS === 'android') {
                initHybridTracking().catch(e => Logger.error('Init tracking failed:', e));
                syncSteps();
            }

        } catch (e) {
            Logger.error('Global Load Data Error:', e);
        } finally {
            setLoading(false);
            setIsReady(true);
        }
    };

    // Polling for steps (every 3 seconds)
    useEffect(() => {
        if (currentUser && Platform.OS === 'android') {
            const interval = setInterval(syncSteps, 3000); // Poll every 3 seconds
            return () => clearInterval(interval);
        }
    }, [currentUser]);

    // Initial Load & Realtime Subscriptions
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
                if (currentUser && payload.new) {
                    const nudge = payload.new as Nudge;
                    if (nudge.receiver_id === currentUser.id || nudge.sender_id === currentUser.id) {
                        // Refresh nudges
                        NudgeService.getUnreadCount(currentUser.id).then(setUnreadNudges);
                        NudgeService.getNudges(currentUser.id).then(setNudges);
                    }
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
        };
    }, []);

    const refreshData = async () => {
        await loadData();
        await syncSteps(); // Force sync on pull-to-refresh
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
            },
            requestPermissions: initHybridTracking,
            setCurrentUser,
            isReady
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

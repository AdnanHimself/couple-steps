import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { User, Challenge, StepLog, Message } from '../types';
import { MockService } from '../services/MockData';
import { supabase } from '../lib/supabase';
import { Colors } from '../constants/Colors';
import { PedometerService } from '../services/PedometerService';
import { NudgeService } from '../services/NudgeService';
import { CouplingService } from '../services/CouplingService';
import { StepService } from '../services/StepService';
import { ChatService } from '../services/ChatService';
import { ChallengeService } from '../services/ChallengeService';
import { NudgeModal } from '../components/NudgeModal';

interface AppContextType {
    currentUser: User | null;
    partner: User | null;
    activeChallenge: Challenge | null;
    steps: StepLog[];
    messages: Message[];
    loading: boolean;
    addSteps: (count: number) => void;
    sendMessage: (text: string) => void;
    setCurrentUser: (user: User | null) => void;
    setActiveChallenge: (challenge: Challenge) => void;
    sendNudge: (receiverId: string, message: string) => Promise<boolean>;
    challenges: Challenge[];
    isSolo: boolean;
}

const AppContext = createContext<AppContextType>({} as AppContextType);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [partner, setPartner] = useState<User | null>(null);
    const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
    const [steps, setSteps] = useState<StepLog[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [nudgeModalVisible, setNudgeModalVisible] = useState(false);
    const [nudgeData, setNudgeData] = useState<{ message: string; senderName: string } | null>(null);
    const [coupleId, setCoupleId] = useState<string | null>(null);
    const lastSyncTime = React.useRef<number>(0);

    // 1. Auth & Connection Check (Runs ONCE)
    useEffect(() => {
        const checkSupabase = async () => {
            try {
                const { data, error } = await supabase.from('test_connection').select('*').limit(1);
                if (error && error.code !== 'PGRST116') {
                    console.log('Supabase Connection Test: Connected but table missing (Expected for new project)');
                } else {
                    console.log('Supabase Connection Test: SUCCESS');
                }
            } catch (e) {
                console.error('Supabase Connection Failed:', e);
            }
        };

        checkSupabase();

        // Listen for Auth Changes
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`Supabase Auth Event: ${event}`);
            if (session?.user) {
                const user: User = {
                    id: session.user.id,
                    username: session.user.user_metadata.username || session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'User',
                    avatarUrl: session.user.user_metadata.avatar_url || 'https://i.pravatar.cc/150',
                    color: Colors.primary
                };
                // Only update if ID changed to prevent unnecessary re-renders
                setCurrentUser(prev => prev?.id === user.id ? prev : user);
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    // 2. Data & Subscriptions (Runs when currentUser changes)
    useEffect(() => {
        if (!currentUser) return;

        const loadData = async () => {
            try {
                // Fetch Partner
                const myPartner = await CouplingService.getPartner(currentUser.id);
                setPartner(myPartner);

                // Load Challenges
                const allChallenges = await ChallengeService.getChallenges();
                setChallenges(allChallenges);

                // Load Active Challenge
                const { data: coupleData } = await supabase
                    .from('couples')
                    .select('id')
                    .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`)
                    .single();

                if (coupleData) {
                    setCoupleId(coupleData.id);
                    const active = await ChallengeService.getActiveChallenge(coupleData.id);
                    if (active) {
                        setActiveChallenge(active);
                    } else if (allChallenges.length > 0) {
                        if (allChallenges.length > 0) setActiveChallenge(allChallenges[0]);
                    }
                } else {
                    if (allChallenges.length > 0) setActiveChallenge(allChallenges[0]);
                }

                // Load Real Steps History
                const history = await StepService.getHistory(currentUser.id, myPartner ? myPartner.id : 'none');
                const realSteps: StepLog[] = history.map((h: any) => ({
                    userId: h.user_id,
                    date: h.date,
                    count: h.count,
                    id: h.id
                }));
                setSteps(realSteps);

                // Load Messages
                if (myPartner) {
                    const chatHistory = await ChatService.getMessages(currentUser.id, myPartner.id);
                    setMessages(chatHistory);
                }
            } catch (e) {
                console.error(e);
            }
        };
        loadData();

        // Health Connect Integration (Polling-based)
        let pollingInterval: any;
        const initHealthConnect = async () => {
            const isAvailable = await PedometerService.isAvailable();

            if (!isAvailable) {
                console.warn('[AppContext] Health Connect not available on this device');
                return;
            }

            // Initialize Health Connect SDK
            await PedometerService.initialize();

            // Request permissions
            const hasPermissions = await PedometerService.requestPermissions();
            if (!hasPermissions) {
                console.warn('[AppContext] Health Connect permissions denied');
                return;
            }

            // Fetch initial steps
            const fetchSteps = async () => {
                try {
                    const todaySteps = await PedometerService.getTodaySteps();
                    console.log('[AppContext] Fetched steps from Health Connect:', todaySteps);

                    setSteps(prev => {
                        const today = new Date().toISOString().split('T')[0];
                        const existing = prev.find(s => s.date === today && s.userId === currentUser.id);

                        // Throttled Sync (every 60s)
                        const now = Date.now();
                        if (now - lastSyncTime.current > 60000) {
                            console.log('[AppContext] Syncing steps to DB:', todaySteps);
                            StepService.syncDailySteps(currentUser.id, todaySteps);
                            lastSyncTime.current = now;
                        }

                        if (existing) {
                            return prev.map(s => s === existing ? { ...s, count: todaySteps } : s);
                        } else {
                            return [...prev, { date: today, userId: currentUser.id, count: todaySteps }];
                        }
                    });
                } catch (e) {
                    console.error('[AppContext] Error fetching steps:', e);
                }
            };

            // Initial fetch
            await fetchSteps();

            // Poll every 60 seconds
            pollingInterval = setInterval(fetchSteps, 60000);
            console.log('[AppContext] Health Connect polling started (60s interval)');
        };
        initHealthConnect();

        // Realtime Subscription (Nudges & Chat)
        const channel = supabase
            .channel('public:app_events')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'nudges' },
                (payload) => {
                    const newNudge = payload.new;
                    if (newNudge.receiver_id === currentUser.id) {
                        setNudgeData({
                            message: newNudge.message || 'Thinking of you!',
                            senderName: partner?.username || 'Partner' // We might need to fetch partner name if not loaded, but partner state should be there
                        });
                        setNudgeModalVisible(true);
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    const msg = payload.new;
                    if (msg.receiver_id === currentUser.id || msg.sender_id === currentUser.id) {
                        const newMessage: Message = {
                            id: msg.id,
                            senderId: msg.sender_id,
                            text: msg.text,
                            timestamp: new Date(msg.created_at).getTime()
                        };
                        // Avoid duplicates if we sent it
                        setMessages(prev => {
                            if (prev.some(m => m.id === newMessage.id)) return prev;
                            return [...prev, newMessage];
                        });
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'daily_steps' },
                (payload) => {
                    const newStepLog = payload.new as any;
                    // If it's my partner's steps, update local state
                    if (partner && newStepLog.user_id === partner.id) {
                        setSteps(prev => {
                            const existing = prev.find(s => s.userId === partner.id && s.date === newStepLog.date);
                            if (existing) {
                                return prev.map(s => s === existing ? { ...s, count: newStepLog.count } : s);
                            } else {
                                return [...prev, {
                                    id: 'partner-live',
                                    userId: partner.id,
                                    count: newStepLog.count,
                                    date: newStepLog.date
                                }];
                            }
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            if (pollingInterval) clearInterval(pollingInterval);
            supabase.removeChannel(channel);
        };
    }, [currentUser?.id, partner?.id]);

    // 3. Check for Challenge Completion
    useEffect(() => {
        if (!activeChallenge || !coupleId || !currentUser) return;

        const checkCompletion = async () => {
            const today = new Date().toISOString().split('T')[0];
            const userSteps = steps.find(s => s.userId === currentUser.id && s.date === today)?.count || 0;
            const partnerSteps = partner ? (steps.find(s => s.userId === partner.id && s.date === today)?.count || 0) : 0;
            const total = userSteps + partnerSteps;

            if (total >= activeChallenge.goal) {
                const success = await ChallengeService.checkCompletion(coupleId, total);
                if (success) {
                    Alert.alert(
                        'Challenge Completed! 🎉',
                        `You've completed the "${activeChallenge.title}" challenge!`,
                        [{ text: 'Awesome!', onPress: () => setActiveChallenge(null) }]
                    );
                    // Refresh challenges list to show it in history
                    const allChallenges = await ChallengeService.getChallenges();
                    setChallenges(allChallenges);
                }
            }
        };

        checkCompletion();
    }, [steps, activeChallenge, coupleId, currentUser, partner]);

    const addSteps = (count: number) => {
        if (!currentUser) return;
        const today = new Date().toISOString().split('T')[0];

        setSteps(prev => {
            const existing = prev.find(s => s.date === today && s.userId === currentUser.id);
            const newCount = (existing?.count || 0) + count;

            // Sync to DB
            StepService.syncDailySteps(currentUser.id, newCount);

            if (existing) {
                return prev.map(s => s === existing ? { ...s, count: newCount } : s);
            } else {
                return [...prev, { date: today, userId: currentUser.id, count: newCount }];
            }
        });
    };

    const isSolo = !partner;

    const sendMessage = async (text: string) => {
        if (!currentUser || !partner) {
            Alert.alert('Solo Mode', 'Connect with a partner to start chatting!');
            return;
        }
        // Optimistic update
        const tempId = Date.now().toString();
        const optimisticMsg: Message = {
            id: tempId,
            senderId: currentUser.id,
            text,
            timestamp: Date.now(),
        };
        setMessages(prev => [...prev, optimisticMsg]);

        const sentMsg = await ChatService.sendMessage(currentUser.id, partner.id, text);

        if (sentMsg) {
            // Replace optimistic message with real one
            setMessages(prev => prev.map(m => m.id === tempId ? sentMsg : m));
        } else {
            // Remove if failed
            setMessages(prev => prev.filter(m => m.id !== tempId));
            Alert.alert('Error', 'Failed to send message');
        }
    };

    const sendNudge = async (receiverId: string, message: string) => {
        if (!currentUser || !partner) return false;
        return await NudgeService.sendNudge(currentUser.id, receiverId, message);
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
            // Solo mode challenge selection (local state only or future implementation)
            setActiveChallenge(challenge);
        }
    };

    const handleNudgeReply = async () => {
        if (partner) {
            await sendNudge(partner.id, "Nudged you back! 💖");
            setNudgeModalVisible(false);
        }
    };

    return (
        <AppContext.Provider value={{
            currentUser,
            partner,
            activeChallenge,
            setActiveChallenge: selectChallenge,
            steps,
            addSteps,
            messages,
            sendMessage,
            sendNudge,
            setCurrentUser,
            loading,
            challenges,
            isSolo
        }}>
            {children}
            {nudgeData && (
                <NudgeModal
                    visible={nudgeModalVisible}
                    message={nudgeData.message}
                    senderName={nudgeData.senderName}
                    onClose={() => setNudgeModalVisible(false)}
                    onReply={handleNudgeReply}
                />
            )}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);

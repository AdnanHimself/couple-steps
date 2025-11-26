import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
// @ts-ignore
import { LogOut, User, ChevronRight, Activity, Unplug, Bug, Trash2, MessageSquare } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { CouplingService } from '../services/CouplingService';
import { Colors, Layout } from '../constants/Colors';
import { DebugStatusSheet } from '../components/DebugStatusSheet';
import { PartnerProfileSheet } from '../components/PartnerProfileSheet';
import { FeedbackSheet } from '../components/FeedbackSheet';

export const AccountScreen = () => {
    const { currentUser, partner, steps, stepHistory, isPartnerActive } = useApp();
    const [userEmail, setUserEmail] = useState<string>('');
    const [debugSheetVisible, setDebugSheetVisible] = useState(false);

    // Partner Profile State
    const [showPartnerSheet, setShowPartnerSheet] = useState(false);
    const [partnerCompletedChallenges, setPartnerCompletedChallenges] = useState(0);

    // Feedback State
    const [showFeedbackSheet, setShowFeedbackSheet] = useState(false);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data.user?.email) setUserEmail(data.user.email);
        });
    }, []);



    // Fetch partner completed challenges count
    useEffect(() => {
        if (!partner) return;
        const fetchCompleted = async () => {
            const { count } = await supabase
                .from('user_challenges')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', partner.id)
                .eq('status', 'completed');
            setPartnerCompletedChallenges(count || 0);
        };
        fetchCompleted();
    }, [partner]);

    const partnerSteps = useMemo(() => {
        if (!partner) return 0;
        const today = new Date().toISOString().split('T')[0];
        return stepHistory.find(s => s.userId === partner.id && s.date === today)?.count || 0;
    }, [stepHistory, partner]);

    const partnerHighestStreak = useMemo(() => {
        if (!partner) return 0;
        let maxStreak = 0;
        let currentTempStreak = 0;
        const today = new Date();

        for (let i = 0; i < 30; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(checkDate.getDate() - i);
            const dateStr = checkDate.toISOString().split('T')[0];
            const hasSteps = stepHistory.some(s => s.userId === partner.id && s.date === dateStr && s.count > 0);

            if (hasSteps) {
                currentTempStreak++;
                maxStreak = Math.max(maxStreak, currentTempStreak);
            } else {
                currentTempStreak = 0;
            }
        }
        return maxStreak;
    }, [stepHistory, partner]);

    const handleSignOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) Alert.alert('Error', error.message);
    };

    const handleDisconnect = () => {
        Alert.alert(
            'Disconnect Partner?',
            'Are you sure you want to unlink from your partner? You will stop seeing their steps.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Disconnect',
                    style: 'destructive',
                    onPress: async () => {
                        if (currentUser) {
                            const success = await CouplingService.disconnectPartner(currentUser.id);
                            if (success) {
                                Alert.alert('Disconnected', 'You have been unlinked from your partner.');
                            } else {
                                Alert.alert('Error', 'Failed to disconnect.');
                            }
                        }
                    }
                }
            ]
        );
    };

    const renderListItem = (icon: React.ReactNode, title: string, subtitle?: string, onPress?: () => void, showChevron = true, isDestructive = false) => (
        <TouchableOpacity
            style={styles.listItem}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.listItemContent}>
                <View style={styles.iconContainer}>
                    {icon}
                </View>
                <View style={styles.textContainer}>
                    <Text style={[styles.itemTitle, isDestructive && styles.destructiveText]}>{title}</Text>
                    {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
                </View>
                {showChevron && <ChevronRight size={20} color={Colors.black} />}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Account</Text>
                <Text style={styles.subtitle}>Manage Your Profile</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Profile Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>PROFILE</Text>
                    <View style={styles.profileCard}>
                        <View style={styles.avatarPlaceholder}>
                            <User size={32} color={Colors.white} />
                        </View>
                        <View>
                            <Text style={styles.profileName}>{currentUser?.username || 'User'}</Text>
                            <Text style={styles.profileEmail}>{userEmail}</Text>
                        </View>
                    </View>
                </View>

                {/* Partner Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>PARTNER</Text>
                    {partner ? (
                        <TouchableOpacity
                            style={styles.partnerCard}
                            onPress={() => setShowPartnerSheet(true)}
                            activeOpacity={0.9}
                        >
                            <View style={styles.partnerInfo}>
                                <View style={styles.partnerLabelRow}>
                                    <Text style={styles.partnerLabel}>Connected with</Text>
                                    {isPartnerActive && (
                                        <View style={styles.activeDot} />
                                    )}
                                </View>
                                <Text style={styles.partnerName}>{partner.username}</Text>
                            </View>
                            <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
                                <Unplug size={20} color={Colors.white} />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.emptyPartner}>
                            <Text style={styles.emptyPartnerText}>No partner connected</Text>
                        </View>
                    )}
                </View>

                {/* Settings List */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>SETTINGS</Text>
                    <View style={styles.listContainer}>
                        {renderListItem(
                            <Bug size={20} color={Colors.black} />,
                            'Debug Menu',
                            'View logs and system status',
                            () => setDebugSheetVisible(true)
                        )}
                        {renderListItem(
                            <MessageSquare size={20} color={Colors.black} />,
                            'Send Feedback',
                            'Report bugs or suggest features',
                            () => setShowFeedbackSheet(true)
                        )}
                    </View>
                </View>

                {/* Danger Zone */}
                <View style={styles.section}>
                    <View style={styles.listContainer}>
                        {renderListItem(
                            <LogOut size={20} color={Colors.black} />,
                            'Sign Out',
                            undefined,
                            handleSignOut,
                            false,
                            true
                        )}
                    </View>
                </View>

                <Text style={styles.versionText}>Version 1.0.0 (Build 14)</Text>
            </ScrollView>

            <DebugStatusSheet visible={debugSheetVisible} onClose={() => setDebugSheetVisible(false)} />

            {partner && (
                <PartnerProfileSheet
                    visible={showPartnerSheet}
                    partner={partner}
                    todaySteps={partnerSteps}
                    highestStreak={partnerHighestStreak}
                    completedChallenges={partnerCompletedChallenges}
                    isActive={isPartnerActive}
                    onClose={() => setShowPartnerSheet(false)}
                />
            )}

            {currentUser && (
                <FeedbackSheet
                    visible={showFeedbackSheet}
                    onClose={() => setShowFeedbackSheet(false)}
                    userId={currentUser.id}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        height: Layout.headerHeight,
        paddingTop: Layout.headerPaddingTop,
        paddingHorizontal: Layout.headerPaddingHorizontal,
        justifyContent: 'center',
    },
    title: {
        fontSize: Layout.headerFontSize,
        fontWeight: 'bold',
        color: Colors.text,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.black,
        marginTop: 4,
    },
    content: {
        padding: Layout.padding,
    },
    section: {
        marginBottom: 30,
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.black,
        marginBottom: 10,
        letterSpacing: 1,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: Colors.black,
        borderWidth: 1,
        borderColor: Colors.black,
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        borderWidth: 1,
        borderColor: Colors.white,
    },
    profileName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.white,
    },
    profileEmail: {
        fontSize: 14,
        color: '#CCC',
    },
    partnerCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.black,
        backgroundColor: Colors.white,
    },
    partnerInfo: {
        flex: 1,
    },
    partnerLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    partnerLabel: {
        fontSize: 12,
        color: Colors.black,
    },
    activeDot: {
        width: 8,
        height: 8,
        borderRadius: 0,
        backgroundColor: '#22c55e',
    },
    partnerName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.black,
    },
    disconnectButton: {
        padding: 10,
        backgroundColor: Colors.black,
    },
    emptyPartner: {
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.black,
        borderStyle: 'dashed',
        alignItems: 'center',
    },
    emptyPartnerText: {
        color: Colors.black,
    },
    listContainer: {
        borderWidth: 1,
        borderColor: Colors.black,
    },
    listItem: {
        padding: 16,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.black,
    },
    listItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.black,
    },
    itemSubtitle: {
        fontSize: 12,
        color: Colors.black,
        marginTop: 2,
        opacity: 0.7,
    },
    destructiveText: {
        color: Colors.black,
        fontWeight: '900',
        textDecorationLine: 'underline',
    },
    versionText: {
        textAlign: 'center',
        color: Colors.black,
        opacity: 0.5,
        fontSize: 12,
        marginTop: 20,
    },
});

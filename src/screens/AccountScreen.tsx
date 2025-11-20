import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
// @ts-ignore
import { LogOut, Smile as UserIcon, CircleUser, Database, ChevronRight } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { CouplingService } from '../services/CouplingService';
import { Colors, Layout } from '../constants/Colors';
import { EditProfileModal } from '../components/EditProfileModal';

export const AccountScreen = () => {
    const { currentUser, partner } = useApp();
    const navigation = useNavigation<any>();
    const [userEmail, setUserEmail] = useState<string>('');
    const [editProfileVisible, setEditProfileVisible] = useState(false);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data.user?.email) setUserEmail(data.user.email);
        });
    }, []);

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

    const handleSeed = async () => {
        try {
            const { SeedService } = require('../services/SeedService');
            const success = await SeedService.seedChallenges();
            if (success) {
                Alert.alert('Success', 'Real challenges have been seeded! Pull to refresh or restart the app.');
            } else {
                Alert.alert('Error', 'Failed to seed challenges.');
            }
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to seed challenges.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Account</Text>
                <Text style={styles.subtitle}>Stacked Steps</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Profile Section */}
                <View style={styles.card}>
                    <View style={styles.profileHeader}>
                        {currentUser?.avatarUrl ? (
                            <Image source={{ uri: currentUser.avatarUrl }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center' }]}>
                                <CircleUser size={32} color="#FFF" />
                            </View>
                        )}
                        <View>
                            <Text style={styles.name}>{currentUser?.username || 'User'}</Text>
                            <Text style={styles.email}>{userEmail}</Text>
                        </View>
                    </View>
                    {/* TODO: Add Edit Profile Button here when ready */}
                    {/* <TouchableOpacity onPress={() => setEditProfileVisible(true)}><Text>Edit</Text></TouchableOpacity> */}
                </View>

                {/* Partner Section */}
                <Text style={styles.sectionTitle}>Partner Connection</Text>
                <View style={styles.card}>
                    {partner ? (
                        <View style={styles.partnerRow}>
                            <View style={styles.partnerInfo}>
                                <Image source={{ uri: partner.avatarUrl }} style={styles.partnerAvatar} />
                                <View>
                                    <Text style={styles.partnerName}>{partner.username}</Text>
                                    <Text style={styles.partnerStatus}>Connected ❤️</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
                                <Text style={{ color: Colors.danger }}>Disconnect</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.noPartnerState}>
                            <Text style={styles.noPartnerText}>No partner connected yet.</Text>
                            <TouchableOpacity
                                style={styles.connectButton}
                                onPress={() => navigation.navigate('Coupling')}
                            >
                                <UserIcon size={20} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={styles.connectButtonText}>Connect Partner</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Developer Tools */}
                <Text style={styles.sectionTitle}>Developer Tools</Text>
                <View style={styles.card}>
                    <TouchableOpacity style={styles.actionRow} onPress={handleSeed} activeOpacity={0.7}>
                        <View style={[styles.actionIcon, { backgroundColor: Colors.primary }]}>
                            <Database size={20} color="#FFF" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.actionText}>Seed Real Challenges</Text>
                            <Text style={styles.actionSubtext}>Reset and populate database</Text>
                        </View>
                        <ChevronRight size={20} color={Colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Settings / Actions */}
                <Text style={styles.sectionTitle}>Settings</Text>
                <View style={styles.card}>
                    <TouchableOpacity style={styles.actionRow} onPress={handleSignOut} activeOpacity={0.7}>
                        <View style={styles.actionIcon}>
                            <LogOut size={20} color={Colors.danger} />
                        </View>
                        <Text style={[styles.actionText, { color: Colors.danger }]}>Sign Out</Text>
                    </TouchableOpacity>
                </View>

                {/* Version Info */}
                <Text style={styles.versionText}>Version 1.0.0</Text>
            </ScrollView>
            <EditProfileModal visible={editProfileVisible} onClose={() => setEditProfileVisible(false)} />
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
        color: Colors.textSecondary,
        marginTop: 4,
    },
    content: {
        padding: Layout.padding,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: Colors.card,
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.primary,
    },
    name: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
    },
    email: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginBottom: 12,
        marginLeft: 4,
    },
    partnerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    partnerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    partnerAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.secondary,
    },
    partnerName: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text,
    },
    partnerStatus: {
        fontSize: 12,
        color: Colors.success,
    },
    disconnectButton: {
        padding: 8,
    },
    noPartnerState: {
        alignItems: 'flex-start',
        gap: 16,
    },
    noPartnerText: {
        color: Colors.textSecondary,
        fontSize: 16,
    },
    connectButton: {
        flexDirection: 'row',
        backgroundColor: Colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 24,
        alignItems: 'center',
    },
    connectButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
    },
    actionIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    actionText: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.text,
    },
    actionSubtext: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    versionText: {
        textAlign: 'center',
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 24,
        marginBottom: 16,
    },
});

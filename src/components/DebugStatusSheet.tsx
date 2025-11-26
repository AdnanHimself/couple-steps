import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, RefreshControl, Alert } from 'react-native';
// @ts-ignore
import { X, CheckCircle, XCircle, AlertCircle, Activity } from 'lucide-react-native';
import { Colors, Layout } from '../constants/Colors';
import { PedometerService } from '../services/PedometerService';
import { getLatestNativeSteps } from '../services/NativePedometerService';
import { useApp } from '../context/AppContext';
import { getSdkStatus, SdkAvailabilityStatus, getGrantedPermissions } from 'react-native-health-connect';
import { ChallengeService } from '../services/ChallengeService';

import { Logger } from '../utils/Logger';

interface DebugStatusSheetProps {
    visible: boolean;
    onClose: () => void;
}

interface DebugStatus {
    trackingMethod: 'Native Sensor' | 'Health Connect' | 'None';
    sdkAvailable: boolean;
    permissionsGranted: boolean | null;
    lastError: string | null;
    rawStepCount: number;
    nativeStepCount: number;
    uiStepCount: number;
}

export const DebugStatusSheet: React.FC<DebugStatusSheetProps> = ({ visible, onClose }) => {
    const { currentUser, steps } = useApp();
    const [debugStatus, setDebugStatus] = useState<DebugStatus>({
        trackingMethod: 'None',
        sdkAvailable: false,
        permissionsGranted: null,
        lastError: null,
        rawStepCount: 0,
        nativeStepCount: 0,
        uiStepCount: 0,
    });
    const [refreshing, setRefreshing] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    const fetchDebugStatus = async () => {
        try {
            console.log('[DEBUG] Fetching status...');
            setLogs(Logger.getLogs());

            // Check SDK availability
            const isAvailable = await PedometerService.isAvailable();

            // Get native step count
            const nativeSteps = getLatestNativeSteps();

            // Get Health Connect step count
            let rawSteps = 0;
            let lastError = null;
            let permGranted = null;

            if (isAvailable) {
                try {
                    // Check if permissions are actually granted
                    const sdkStatus = await getSdkStatus();
                    if (sdkStatus === SdkAvailabilityStatus.SDK_AVAILABLE) {
                        const grantedPerms = await getGrantedPermissions();
                        const hasReadPermission = grantedPerms.some(
                            p => p.recordType === 'Steps' && p.accessType === 'read'
                        );
                        permGranted = hasReadPermission;

                        if (hasReadPermission) {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const now = new Date();
                            rawSteps = await PedometerService.getStepsBetween(today, now);
                        }
                    } else {
                        permGranted = false;
                    }
                } catch (e: any) {
                    lastError = e.message || String(e);
                    permGranted = false;
                }
            }

            // Determine tracking method
            let trackingMethod: 'Native Sensor' | 'Health Connect' | 'None' = 'None';
            if (rawSteps > 0) {
                trackingMethod = 'Health Connect';
            } else if (nativeSteps > 0) {
                trackingMethod = 'Native Sensor';
            }

            // Get UI step count
            const uiSteps = steps || 0;

            setDebugStatus({
                trackingMethod,
                sdkAvailable: isAvailable,
                permissionsGranted: permGranted,
                lastError,
                rawStepCount: rawSteps,
                nativeStepCount: nativeSteps,
                uiStepCount: uiSteps,
            });

            console.log('[DEBUG] Status fetched:', {
                trackingMethod,
                nativeSteps,
                rawSteps,
                uiSteps
            });
        } catch (e) {
            console.error('[DEBUG] Error fetching status:', e);
        }
    };

    useEffect(() => {
        if (visible) {
            fetchDebugStatus();
        }
    }, [visible]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchDebugStatus();
        setRefreshing(false);
    };

    const StatusRow = ({ label, value, status }: { label: string; value: string; status: 'success' | 'error' | 'warning' | 'info' }) => {
        const getIcon = () => {
            switch (status) {
                case 'success': return <CheckCircle size={20} color={Colors.success} />;
                case 'error': return <XCircle size={20} color={Colors.danger} />;
                case 'warning': return <AlertCircle size={20} color={Colors.warning} />;
                default: return <Activity size={20} color={Colors.black} />;
            }
        };

        return (
            <View style={styles.statusRow}>
                {getIcon()}
                <View style={styles.statusContent}>
                    <Text style={styles.label}>{label}</Text>
                    <Text style={styles.value}>{value}</Text>
                </View>
            </View>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.container}>
                <View style={styles.sheet}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Step Counter Debug</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color={Colors.black} />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <ScrollView
                        style={styles.content}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
                        }
                    >
                        {/* Tracking Method */}
                        <Text style={styles.sectionTitle}>Active Tracking Method</Text>
                        <View style={styles.card}>
                            <StatusRow
                                label="Currently Using"
                                value={debugStatus.trackingMethod}
                                status={debugStatus.trackingMethod !== 'None' ? 'success' : 'error'}
                            />
                        </View>

                        {/* Step Data */}
                        <Text style={styles.sectionTitle}>Step Counts</Text>
                        <View style={styles.card}>
                            <StatusRow
                                label="Native Sensor (expo-sensors)"
                                value={debugStatus.nativeStepCount.toLocaleString()}
                                status={debugStatus.nativeStepCount > 0 ? 'success' : 'warning'}
                            />
                            <StatusRow
                                label="Health Connect"
                                value={debugStatus.rawStepCount.toLocaleString()}
                                status={debugStatus.rawStepCount > 0 ? 'success' : 'warning'}
                            />
                            <StatusRow
                                label="UI Display (App State)"
                                value={debugStatus.uiStepCount.toLocaleString()}
                                status={debugStatus.uiStepCount > 0 ? 'success' : 'warning'}
                            />
                        </View>

                        {/* Permissions */}
                        <Text style={styles.sectionTitle}>System Status</Text>
                        <View style={styles.card}>
                            <StatusRow
                                label="Health Connect Available"
                                value={debugStatus.sdkAvailable ? 'Yes ✅' : 'No ❌'}
                                status={debugStatus.sdkAvailable ? 'success' : 'info'}
                            />
                            <StatusRow
                                label="Permissions Granted"
                                value={
                                    debugStatus.permissionsGranted === null
                                        ? 'Unknown'
                                        : debugStatus.permissionsGranted
                                            ? 'Yes ✅'
                                            : 'No ❌'
                                }
                                status={
                                    debugStatus.permissionsGranted === null
                                        ? 'warning'
                                        : debugStatus.permissionsGranted
                                            ? 'success'
                                            : 'error'
                                }
                            />
                        </View>

                        {/* Errors */}
                        {debugStatus.lastError && (
                            <>
                                <Text style={styles.sectionTitle}>Last Error</Text>
                                <View style={[styles.card, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
                                    <Text style={styles.errorText}>{debugStatus.lastError}</Text>
                                </View>
                            </>
                        )}

                        {/* Recommendations */}
                        <Text style={styles.sectionTitle}>Troubleshooting</Text>
                        <View style={styles.card}>
                            <Text style={styles.infoText}>
                                {debugStatus.trackingMethod === 'None' && '⚠️ No steps detected. Walk around and pull to refresh.\n\n'}
                                {debugStatus.trackingMethod === 'Native Sensor' && '✅ Using device sensor. Steps count in real-time!\n\n'}
                                {debugStatus.trackingMethod === 'Health Connect' && '✅ Using Health Connect. Make sure Google Fit or Samsung Health is running.\n\n'}
                                {debugStatus.permissionsGranted === false && '⚠️ Permissions denied. Go to Settings → Apps → Couple Steps → Permissions.\n\n'}
                                ℹ️ Steps track while app is open. Native sensor provides real-time updates!
                            </Text>
                        </View>

                        {/* Logs */}
                        <Text style={styles.sectionTitle}>System Logs</Text>
                        <View style={[styles.card, { maxHeight: 200 }]}>
                            <ScrollView nestedScrollEnabled>
                                {logs.map((log, i) => (
                                    <Text key={i} style={styles.logText}>{log}</Text>
                                ))}
                                {logs.length === 0 && <Text style={styles.logText}>No logs yet.</Text>}
                            </ScrollView>
                        </View>

                        {/* Actions */}
                        <Text style={styles.sectionTitle}>Admin Actions</Text>
                        <View style={styles.card}>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => {
                                    Alert.alert(
                                        'Reset Challenges?',
                                        'This will DELETE all existing challenges and replace them with the new list. This cannot be undone.',
                                        [
                                            { text: 'Cancel', style: 'cancel' },
                                            {
                                                text: 'Reset',
                                                style: 'destructive',
                                                onPress: async () => {
                                                    const success = await ChallengeService.resetChallenges();
                                                    if (success) {
                                                        Alert.alert('Success', 'Challenges have been reset.');
                                                    } else {
                                                        Alert.alert('Error', 'Failed to reset challenges. Check logs.');
                                                    }
                                                }
                                            }
                                        ]
                                    );
                                }}
                            >
                                <Text style={styles.actionButtonText}>Reset Challenges DB</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 0, // Squared
        borderTopRightRadius: 0, // Squared
        padding: Layout.padding,
        maxHeight: '80%',
        borderTopWidth: 1,
        borderTopColor: Colors.black,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: Colors.black,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.black,
    },
    closeButton: {
        padding: 5,
    },
    content: {
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.black,
        marginBottom: 12,
        marginTop: 8,
    },
    card: {
        backgroundColor: Colors.white,
        borderRadius: 0, // Squared
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: Colors.black,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    statusContent: {
        flex: 1,
    },
    label: {
        fontSize: 14,
        color: Colors.black,
    },
    value: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.black,
    },
    errorText: {
        fontSize: 14,
        color: Colors.danger,
        fontFamily: 'monospace',
    },
    infoText: {
        fontSize: 14,
        color: Colors.text,
        lineHeight: 20,
    },
    logText: {
        fontSize: 10,
        color: Colors.black,
        fontFamily: 'monospace',
        marginBottom: 4,
    },
    actionButton: {
        backgroundColor: Colors.black,
        padding: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    actionButtonText: {
        color: Colors.white,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        fontSize: 12,
    },
});

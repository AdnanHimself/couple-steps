import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { Colors, Layout } from '../constants/Colors';
import { Logger } from '../utils/Logger';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';

interface DebugBottomSheetProps {
    visible: boolean;
    onClose: () => void;
}

export const DebugBottomSheet: React.FC<DebugBottomSheetProps> = ({ visible, onClose }) => {
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        if (visible) {
            refreshLogs();
        }
    }, [visible]);

    const refreshLogs = () => {
        try {
            const currentLogs = Logger.getLogs();
            setLogs(currentLogs || []);
        } catch (e) {
            console.error('Failed to refresh logs:', e);
            setLogs(['Error loading logs']);
        }
    };

    const clearLogs = async () => {
        try {
            await Logger.clearLogs();
            refreshLogs();
        } catch (e) {
            console.error('Failed to clear logs:', e);
        }
    };

    const copyLogs = async () => {
        try {
            await Clipboard.setStringAsync(logs.join('\n'));
            Alert.alert('Copied', 'Logs copied to clipboard');
        } catch (e) {
            console.error('Failed to copy logs:', e);
            Alert.alert('Error', 'Failed to copy logs');
        }
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Debug Console</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.toolbar}>
                    <TouchableOpacity style={styles.toolButton} onPress={refreshLogs}>
                        <Text style={styles.toolText}>Refresh</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.toolButton} onPress={copyLogs}>
                        <Text style={styles.toolText}>Copy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.toolButton, styles.dangerButton]} onPress={clearLogs}>
                        <Text style={styles.toolText}>Clear</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.logContainer}>
                    {logs.length === 0 ? (
                        <Text style={styles.emptyText}>No logs recorded.</Text>
                    ) : (
                        logs.map((log, index) => (
                            <View key={index} style={styles.logItem}>
                                <Text style={styles.logText}>{log}</Text>
                            </View>
                        ))
                    )}
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Layout.padding,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
    },
    closeButton: {
        padding: 8,
    },
    closeButtonText: {
        color: Colors.primary,
        fontWeight: '600',
        fontSize: 16,
    },
    toolbar: {
        flexDirection: 'row',
        padding: Layout.padding,
        gap: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    toolButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.black,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    dangerButton: {
        backgroundColor: '#ef4444',
    },
    toolText: {
        color: Colors.white,
        fontWeight: '600',
        fontSize: 14,
    },
    logContainer: {
        flex: 1,
        padding: Layout.padding,
    },
    logItem: {
        marginBottom: 8,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    logText: {
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontSize: 11,
        color: Colors.text,
    },
    emptyText: {
        textAlign: 'center',
        color: Colors.text,
        marginTop: 20,
    },
});

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, TouchableWithoutFeedback, Animated, PanResponder, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, CameraView } from 'expo-camera';
import QRCode from 'react-native-qrcode-svg';
// @ts-ignore
import { X, Scan, QrCode } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { CouplingService } from '../services/CouplingService';
import { Colors, Layout } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BarcodeScanningResult } from 'expo-camera';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type CouplingScreenProps = {
    navigation: NativeStackNavigationProp<any>;
};

export const CouplingScreen = ({ navigation }: CouplingScreenProps) => {
    const [mode, setMode] = useState<'select' | 'generate' | 'scan'>('select');
    const { currentUser, refreshData } = useApp();
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);

    // Animation
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    useEffect(() => {
        Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            damping: 20,
            stiffness: 90,
        }).start();
    }, []);

    const close = () => {
        Animated.timing(slideAnim, {
            toValue: SCREEN_HEIGHT,
            duration: 250,
            useNativeDriver: true,
        }).start(() => navigation.goBack());
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return gestureState.dy > 5; // Only capture downward movement
            },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    slideAnim.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 100) {
                    close();
                } else {
                    Animated.spring(slideAnim, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    useEffect(() => {
        const getPermissions = async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        };
        getPermissions();
    }, []);

    const handleBarCodeScanned = async ({ type, data }: BarcodeScanningResult) => {
        setScanned(true);
        try {
            const partnerId = data;

            // Prevent self-scanning
            if (!partnerId || partnerId === currentUser?.id) {
                Alert.alert('Invalid Code', "You can't link with yourself! 😅");
                setScanned(false);
                return;
            }

            Alert.alert(
                'Partner Found!',
                `Do you want to link with this user?`,
                [
                    { text: 'Cancel', onPress: () => setScanned(false), style: 'cancel' },
                    {
                        text: 'Link',
                        onPress: async () => {
                            if (currentUser) {
                                const result = await CouplingService.linkPartners(currentUser.id, partnerId);
                                if (result.success) {
                                    // Refresh data to load the new partner
                                    await refreshData();
                                    Alert.alert('Success', 'You are now linked! 🎉', [
                                        {
                                            text: 'OK',
                                            onPress: () => navigation.replace('Main')
                                        }
                                    ]);
                                } else {
                                    Alert.alert('Error', result.error || 'Could not link partners.');
                                    setScanned(false);
                                }
                            }
                        }
                    }
                ]
            );
        } catch (e) {
            Alert.alert('Error', 'Invalid QR Code');
            setScanned(false);
        }
    };

    const renderContent = () => {
        if (mode === 'scan') {
            if (hasPermission === null) return <Text style={{ color: Colors.text }}>Requesting camera permission</Text>;
            if (hasPermission === false) return <Text style={{ color: Colors.text }}>No access to camera</Text>;

            return (
                <View style={styles.scanContainer}>
                    <CameraView
                        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                        barcodeScannerSettings={{
                            barcodeTypes: ["qr"],
                        }}
                        style={StyleSheet.absoluteFillObject}
                    />
                    <View style={styles.scanOverlay}>
                        <View style={styles.scanFrame} />
                        <Text style={styles.scanText}>Scan partner's QR code</Text>
                        <TouchableOpacity style={styles.backButtonOverlay} onPress={() => setMode('select')}>
                            <Text style={styles.backText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        if (mode === 'generate') {
            return (
                <View style={styles.centerContent}>
                    <Text style={styles.title}>Your Code</Text>
                    <View style={styles.qrContainer}>
                        {currentUser ? (
                            <QRCode
                                value={currentUser.id}
                                size={200}
                                color="black"
                                backgroundColor="white"
                            />
                        ) : (
                            <Text style={{ color: 'white' }}>Loading User ID...</Text>
                        )}
                    </View>
                    <Text style={styles.instruction}>Ask your partner to scan this code.</Text>
                    <TouchableOpacity style={styles.textButton} onPress={() => setMode('select')}>
                        <Text style={styles.textButtonLabel}>Back</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View style={styles.centerContent}>
                <Text style={styles.title}>Connect Partner</Text>
                <Text style={styles.subtitle}>Choose a connection method</Text>

                <TouchableOpacity style={styles.optionCard} onPress={() => setMode('generate')}>
                    <QrCode size={32} color={Colors.primary} />
                    <View style={styles.optionTextContainer}>
                        <Text style={styles.optionTitle}>Show My Code</Text>
                        <Text style={styles.optionDesc}>Let your partner scan your QR code</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionCard} onPress={() => setMode('scan')}>
                    <Scan size={32} color={Colors.secondary} />
                    <View style={styles.optionTextContainer}>
                        <Text style={styles.optionTitle}>Scan Partner's Code</Text>
                        <Text style={styles.optionDesc}>Scan your partner's QR code</Text>
                    </View>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.overlay}>
            <TouchableWithoutFeedback onPress={close}>
                <View style={styles.backdrop} />
            </TouchableWithoutFeedback>
            <Animated.View
                style={[
                    styles.sheet,
                    { transform: [{ translateY: slideAnim }] }
                ]}
                {...panResponder.panHandlers}
            >
                <View style={styles.handle} />
                <TouchableOpacity style={styles.closeButton} onPress={close}>
                    <X color={Colors.black} size={24} />
                </TouchableOpacity>
                {renderContent()}
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheet: {
        backgroundColor: Colors.background,
        borderTopLeftRadius: 0, // Squared
        borderTopRightRadius: 0, // Squared
        height: '85%',
        padding: Layout.padding,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: Colors.black,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: Colors.black,
        borderRadius: 0, // Squared
        alignSelf: 'center',
        marginBottom: 20,
        marginTop: 10,
    },
    closeButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 10,
    },
    centerContent: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.black,
        marginBottom: 30,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.card,
        padding: 20,
        borderRadius: 0, // Squared
        width: '100%',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.black,
    },
    optionTextContainer: {
        marginLeft: 16,
        flex: 1,
    },
    optionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 4,
    },
    optionDesc: {
        fontSize: 14,
        color: Colors.black,
    },
    qrContainer: {
        padding: 20,
        backgroundColor: '#FFF',
        borderRadius: 0, // Squared
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Colors.black,
    },
    instruction: {
        color: Colors.black,
        fontSize: 16,
        marginBottom: 30,
    },
    textButton: {
        padding: 10,
    },
    textButtonLabel: {
        color: Colors.black,
        fontSize: 16,
    },
    scanContainer: {
        flex: 1,
        borderRadius: 0, // Squared
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.black,
        marginTop: 10,
    },
    scanOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    scanFrame: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: Colors.primary,
        borderRadius: 0,
        backgroundColor: 'transparent',
    },
    scanText: {
        color: '#FFF',
        marginTop: 20,
        fontSize: 16,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 0,
        overflow: 'hidden',
    },
    backButtonOverlay: {
        position: 'absolute',
        bottom: 40,
        padding: 15,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 0,
    },
    backText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
});

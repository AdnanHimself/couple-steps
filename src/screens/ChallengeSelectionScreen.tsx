import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TouchableWithoutFeedback, Animated, PanResponder, Dimensions } from 'react-native';
import { useApp } from '../context/AppContext';
import { Colors, Layout } from '../constants/Colors';
import { Challenge } from '../types';
// @ts-ignore
import { Footprints, Zap, X } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Card } from '../components/ui/Card';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const ChallengeSelectionScreen = () => {
    const { challenges, activeChallenge, activeSoloChallenge, setActiveChallenge, setActiveSoloChallenge, isSolo } = useApp();
    const navigation = useNavigation();
    const [mode, setMode] = React.useState<'couple' | 'solo'>(isSolo ? 'solo' : 'couple');

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
            onStartShouldSetPanResponder: () => false,
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

    const handleSelect = (challenge: Challenge) => {
        const currentActive = mode === 'couple' ? activeChallenge : activeSoloChallenge;
        if (currentActive?.id === challenge.id) return;

        Alert.alert(
            'Start Challenge',
            `Do you want to start the "${challenge.title}" challenge?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Start',
                    style: 'default',
                    onPress: async () => {
                        if (mode === 'couple') {
                            if (isSolo) {
                                Alert.alert('Partner Required', 'You need a partner to start a couple challenge!');
                                return;
                            }
                            await setActiveChallenge(challenge);
                        } else {
                            await setActiveSoloChallenge(challenge);
                        }
                        close();
                    }
                }
            ]
        );
    };

    const filteredChallenges = challenges.filter(c => c.type === mode);

    const renderItem = ({ item }: { item: Challenge }) => {
        const currentActive = mode === 'couple' ? activeChallenge : activeSoloChallenge;
        const isActive = currentActive?.id === item.id;

        return (
            <Card
                onPress={() => handleSelect(item)}
                style={[styles.card, isActive && styles.activeCard]}
            >
                <View style={styles.cardHeader}>
                    <Zap
                        size={24}
                        color={isActive ? Colors.warning : Colors.black}
                        fill={isActive ? Colors.warning : 'transparent'}
                    />
                    <Text style={[styles.title, isActive && styles.activeTitle]}>{item.title}</Text>
                    {isActive && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>Active</Text>
                        </View>
                    )}
                </View>

                <View style={styles.divider} />

                <Text style={[styles.description, isActive && styles.activeDescription]}>
                    {item.description}
                </Text>

                <View style={styles.footer}>
                    <Footprints color={isActive ? Colors.white : Colors.black} size={18} />
                    <Text style={[styles.steps, isActive && styles.activeSteps]}>
                        {item.goal.toLocaleString()} steps
                    </Text>
                    <Text style={[styles.duration, isActive && styles.activeDuration]}>
                        • {item.durationDays} days
                    </Text>
                </View>
            </Card>
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
                <View style={styles.header}>
                    <Text style={styles.screenTitle}>Select Challenge</Text>
                    <TouchableOpacity style={styles.closeButton} onPress={close}>
                        <X color={Colors.black} size={24} />
                    </TouchableOpacity>
                </View>

                {/* Tabs */}
                <View style={styles.tabs}>
                    <TouchableOpacity
                        style={[styles.tab, mode === 'couple' && styles.activeTab]}
                        onPress={() => setMode('couple')}
                    >
                        <Text style={[styles.tabText, mode === 'couple' && styles.activeTabText]}>Couple</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, mode === 'solo' && styles.activeTab]}
                        onPress={() => setMode('solo')}
                    >
                        <Text style={[styles.tabText, mode === 'solo' && styles.activeTabText]}>Solo</Text>
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={filteredChallenges}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
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
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        height: '85%',
        paddingTop: 10,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 0,
        alignSelf: 'center',
        marginBottom: 10,
        marginTop: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Layout.padding,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    screenTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text,
    },
    closeButton: {
        padding: 4,
    },
    list: {
        padding: Layout.padding,
        paddingBottom: 40,
    },
    card: {
        marginBottom: 20,
        backgroundColor: Colors.white,
        borderRadius: 0,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.black,
    },
    activeCard: {
        backgroundColor: Colors.black,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
        flex: 1,
    },
    activeTitle: {
        color: Colors.white,
    },
    badge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 0,
    },
    badgeText: {
        color: Colors.white,
        fontSize: 12,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginBottom: 12,
    },
    description: {
        color: Colors.black,
        fontSize: 15,
        marginBottom: 12,
        lineHeight: 22,
    },
    activeDescription: {
        color: 'rgba(255,255,255,0.9)',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    steps: {
        color: Colors.black,
        fontWeight: '600',
        fontSize: 14,
    },
    activeSteps: {
        color: Colors.white,
    },
    duration: {
        color: Colors.black,
        fontSize: 14,
    },
    activeDuration: {
        color: 'rgba(255,255,255,0.8)',
    },
    tabs: {
        flexDirection: 'row',
        paddingHorizontal: Layout.padding,
        paddingBottom: 10,
        gap: 10,
        marginTop: 10,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 0, // Squared
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.black,
    },
    activeTab: {
        backgroundColor: Colors.black,
    },
    tabText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.black,
    },
    activeTabText: {
        color: Colors.white,
    },
});

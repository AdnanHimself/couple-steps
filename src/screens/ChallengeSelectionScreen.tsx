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
    const { challenges, activeChallenge, setActiveChallenge } = useApp();
    const navigation = useNavigation();

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

    const handleSelect = (challenge: Challenge) => {
        if (activeChallenge?.id === challenge.id) return;

        Alert.alert(
            'Start Challenge',
            `Do you want to start the "${challenge.title}" challenge?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Start',
                    style: 'default',
                    onPress: async () => {
                        await setActiveChallenge(challenge);
                        close();
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: Challenge }) => {
        const isActive = activeChallenge?.id === item.id;

        return (
            <Card
                variant={isActive ? "primary" : "default"}
                onPress={() => handleSelect(item)}
                style={styles.card}
            >
                <View style={styles.cardHeader}>
                    <Zap
                        size={24}
                        color={isActive ? Colors.warning : Colors.textSecondary}
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
                    <Footprints color={isActive ? Colors.white : Colors.textSecondary} size={18} />
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
                        <X color={Colors.textSecondary} size={24} />
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={challenges}
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
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '85%',
        paddingTop: 10,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 2,
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
        borderRadius: 12,
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
        color: Colors.textSecondary,
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
        color: Colors.textSecondary,
        fontWeight: '600',
        fontSize: 14,
    },
    activeSteps: {
        color: Colors.white,
    },
    duration: {
        color: Colors.textSecondary,
        fontSize: 14,
    },
    activeDuration: {
        color: 'rgba(255,255,255,0.8)',
    },
});

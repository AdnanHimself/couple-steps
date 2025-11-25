import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import PagerView from 'react-native-pager-view';
import { Colors, Layout } from '../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, Footprints, MessageCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
    Auth: undefined;
};

type WelcomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Auth'>;

const { width } = Dimensions.get('window');

const ONBOARDING_DATA = [
    {
        id: '1',
        title: 'Walk Together',
        subtitle: 'Sync your steps with your partner and stay connected, no matter the distance.',
        icon: Heart,
    },
    {
        id: '2',
        title: 'Track Progress',
        subtitle: 'Visualize your daily activity and complete fun walking challenges together.',
        icon: Footprints,
    },
    {
        id: '3',
        title: 'Stay Connected',
        subtitle: 'Send nudges, chat in real-time, and motivate each other to keep moving.',
        icon: MessageCircle,
    },
];

export const WelcomeScreen = () => {
    const navigation = useNavigation<WelcomeScreenNavigationProp>();
    const pagerRef = useRef<PagerView>(null);
    const [currentPage, setCurrentPage] = useState(0);

    const handleNext = () => {
        if (currentPage < ONBOARDING_DATA.length - 1) {
            pagerRef.current?.setPage(currentPage + 1);
        } else {
            navigation.navigate('Auth');
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <PagerView
                style={styles.pagerView}
                initialPage={0}
                ref={pagerRef}
                onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
            >
                {ONBOARDING_DATA.map((item, index) => (
                    <View key={item.id} style={styles.page}>
                        <SafeAreaView style={styles.content}>
                            <Text style={styles.appTitle}>Couple Steps 👣</Text>
                            <View style={styles.card}>
                                <View style={styles.iconContainer}>
                                    <item.icon color={Colors.black} size={64} />
                                </View>
                                <Text style={styles.title}>{item.title}</Text>
                                <Text style={styles.subtitle}>{item.subtitle}</Text>
                            </View>
                        </SafeAreaView>
                    </View>
                ))}
            </PagerView>

            {/* Footer Controls */}
            <View style={styles.footerContainer}>
                {/* Pagination Dots */}
                <View style={styles.pagination}>
                    {ONBOARDING_DATA.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                currentPage === index && styles.activeDot,
                            ]}
                        />
                    ))}
                </View>

                {/* Button */}
                <TouchableOpacity
                    style={styles.button}
                    onPress={handleNext}
                    activeOpacity={0.9}
                >
                    <Text style={styles.buttonText}>
                        {currentPage === ONBOARDING_DATA.length - 1 ? 'Get Started' : 'Next'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    pagerView: {
        flex: 1,
    },
    page: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: Layout.padding,
        paddingTop: 60,
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    card: {
        backgroundColor: Colors.white,
        borderWidth: 3,
        borderColor: Colors.black,
        borderRadius: 0,
        padding: 48,
        alignItems: 'center',
        width: '100%',
        maxWidth: 400,
    },
    iconContainer: {
        marginBottom: 32,
        padding: 24,
        backgroundColor: Colors.white,
        borderWidth: 3,
        borderColor: Colors.black,
        borderRadius: 0,
    },
    appTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: Colors.black,
        marginBottom: 40,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: Colors.black,
        marginBottom: 16,
        textAlign: 'center',
        letterSpacing: -0.3,
    },
    subtitle: {
        fontSize: 17,
        color: Colors.black,
        textAlign: 'center',
        lineHeight: 26,
        paddingHorizontal: 8,
    },
    footerContainer: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        paddingHorizontal: Layout.padding,
        alignItems: 'center',
    },
    pagination: {
        flexDirection: 'row',
        marginBottom: 24,
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 0,
        backgroundColor: Colors.white,
        borderWidth: 2,
        borderColor: Colors.black,
    },
    activeDot: {
        backgroundColor: Colors.black,
        width: 24,
    },
    button: {
        backgroundColor: Colors.black,
        paddingVertical: 18,
        width: '100%',
        borderRadius: 0,
        borderWidth: 3,
        borderColor: Colors.black,
        alignItems: 'center',
    },
    buttonText: {
        color: Colors.white,
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
});

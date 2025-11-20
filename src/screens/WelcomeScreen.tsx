import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, StatusBar, Dimensions } from 'react-native';
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
        image: 'https://images.unsplash.com/photo-1485217988980-11786ced9454?auto=format&fit=crop&w=800&q=80',
        icon: Heart,
    },
    {
        id: '2',
        title: 'Track Progress',
        subtitle: 'Visualize your daily activity and complete fun walking challenges together.',
        image: 'https://images.unsplash.com/photo-1502904550040-7534597429ae?auto=format&fit=crop&w=800&q=80',
        icon: Footprints,
    },
    {
        id: '3',
        title: 'Stay Connected',
        subtitle: 'Send nudges, chat in real-time, and motivate each other to keep moving.',
        image: 'https://images.unsplash.com/photo-1516726817505-f5ed825624d8?auto=format&fit=crop&w=800&q=80',
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
            <StatusBar barStyle="light-content" />
            <PagerView
                style={styles.pagerView}
                initialPage={0}
                ref={pagerRef}
                onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
            >
                {ONBOARDING_DATA.map((item, index) => (
                    <View key={item.id} style={styles.page}>
                        <ImageBackground
                            source={{ uri: item.image }}
                            style={styles.background}
                            resizeMode="cover"
                        >
                            <View style={styles.overlay} />
                            <SafeAreaView style={styles.content}>
                                <View style={styles.header}>
                                    <View style={styles.iconContainer}>
                                        <item.icon color={Colors.secondary} size={48} fill={Colors.secondary} />
                                    </View>
                                    <Text style={styles.title}>{item.title}</Text>
                                    <Text style={styles.subtitle}>{item.subtitle}</Text>
                                </View>
                            </SafeAreaView>
                        </ImageBackground>
                    </View>
                ))}
            </PagerView>

            {/* Footer Controls (Overlay) */}
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
        backgroundColor: Colors.background,
    },
    pagerView: {
        flex: 1,
    },
    page: {
        flex: 1,
    },
    background: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(15, 23, 42, 0.7)', // Slightly lighter overlay
    },
    content: {
        flex: 1,
        padding: Layout.padding,
        alignItems: 'center',
        justifyContent: 'flex-start', // Push content to top
        paddingTop: 100,
    },
    header: {
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: 30,
        shadowColor: Colors.secondary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
        elevation: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 20,
        borderRadius: 50,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: Colors.white,
        marginBottom: 16,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        lineHeight: 26,
        paddingHorizontal: 20,
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
        marginBottom: 30,
        gap: 10,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    activeDot: {
        backgroundColor: Colors.primary,
        width: 20, // Elongated active dot
    },
    button: {
        backgroundColor: Colors.primary,
        paddingVertical: 18,
        width: '100%',
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonText: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
});

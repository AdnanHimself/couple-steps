import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardScreen } from '../screens/DashboardScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { AccountScreen } from '../screens/AccountScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { CouplingScreen } from '../screens/CouplingScreen';
import { ChallengeSelectionScreen } from '../screens/ChallengeSelectionScreen';
import { Colors, Layout } from '../constants/Colors';
import { LayoutDashboard, BarChart3, MessageCircle, User as UserIcon } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { LinearGradient } from 'expo-linear-gradient';

const Tab = createMaterialTopTabNavigator();
const Stack = createNativeStackNavigator();

const CustomTabBar = ({ state, descriptors, navigation }: any) => {
    return (
        <View style={styles.tabBarContainer}>
            <LinearGradient
                colors={Colors.gradients.card as any}
                style={styles.tabBar}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {state.routes.map((route: any, index: number) => {
                    const { options } = descriptors[route.key];
                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }

                        // Haptic Feedback
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    };

                    const Icon = options.tabBarIcon;

                    return (
                        <TouchableOpacity
                            key={index}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel}
                            testID={options.tabBarTestID}
                            onPress={onPress}
                            style={styles.tabItem}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.iconContainer, isFocused && styles.activeIconContainer]}>
                                {Icon && <Icon color={isFocused ? Colors.white : Colors.textSecondary} size={24} />}
                                {isFocused && <View style={styles.activeDot} />}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </LinearGradient>
        </View>
    );
};

const MainTabs = () => {
    return (
        <Tab.Navigator
            tabBar={props => <CustomTabBar {...props} />}
            tabBarPosition="bottom"
            initialLayout={{ width: Dimensions.get('window').width }}
            screenOptions={{
                swipeEnabled: true,
                tabBarShowLabel: false,
                tabBarStyle: { backgroundColor: 'transparent' },
                tabBarIndicatorStyle: { opacity: 0 }, // Hide default indicator
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={24} />,
                }}
            />
            <Tab.Screen
                name="Stats"
                component={StatsScreen}
                options={{
                    tabBarIcon: ({ color }) => <BarChart3 color={color} size={24} />,
                }}
            />
            <Tab.Screen
                name="Chat"
                component={ChatScreen}
                options={{
                    tabBarIcon: ({ color }) => <MessageCircle color={color} size={24} />,
                }}
            />
            <Tab.Screen
                name="Account"
                component={AccountScreen}
                options={{
                    tabBarIcon: ({ color }) => <UserIcon color={color} size={24} />,
                }}
            />
        </Tab.Navigator>
    );
};

export const AppNavigator = () => {
    const { currentUser, loading } = useApp();

    if (loading) {
        return null;
    }

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'fade',
                contentStyle: { backgroundColor: Colors.background }
            }}
        >
            {currentUser ? (
                <>
                    <Stack.Screen name="Main" component={MainTabs} />
                    <Stack.Screen
                        name="Coupling"
                        component={CouplingScreen}
                        options={{
                            presentation: 'transparentModal',
                            animation: 'fade',
                            headerShown: false,
                        }}
                    />
                    <Stack.Screen
                        name="ChallengeSelection"
                        component={ChallengeSelectionScreen}
                        options={{
                            presentation: 'transparentModal',
                            animation: 'fade',
                            headerShown: false,
                        }}
                    />
                </>
            ) : (
                <>
                    <Stack.Screen name="Welcome" component={WelcomeScreen} />
                    <Stack.Screen name="Auth" component={AuthScreen} />
                </>
            )}
        </Stack.Navigator>
    );
};

const styles = StyleSheet.create({
    tabBarContainer: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 30 : 20,
        left: 20,
        right: 20,
        alignItems: 'center',
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: 'rgba(30, 30, 30, 0.8)',
        borderRadius: 35,
        height: 70,
        width: '100%',
        justifyContent: 'space-around',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'transparent',
    },
    activeIconContainer: {
        backgroundColor: 'rgba(220, 38, 38, 0.2)',
        borderWidth: 2,
        borderColor: Colors.primary,
        borderRadius: 28,
        transform: [{ scale: 1.05 }],
    },
    activeDot: {
        position: 'absolute',
        bottom: -8,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.white,
        display: 'none',
    }
});


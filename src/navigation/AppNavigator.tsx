import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Dimensions, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardScreen } from '../screens/DashboardScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { AccountScreen } from '../screens/AccountScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { CouplingScreen } from '../screens/CouplingScreen';
import { ChallengeSelectionScreen } from '../screens/ChallengeSelectionScreen';
import { Colors, Layout } from '../constants/Colors';
import { LayoutDashboard, BarChart3, User as UserIcon } from 'lucide-react-native';
import { useApp } from '../context/AppContext';

export type RootStackParamList = {
    Main: undefined;
    Coupling: undefined;
    ChallengeSelection: undefined;
    Auth: undefined;
    MainTabs: undefined;
};

const Tab = createMaterialTopTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

import { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';

const CustomTabBar = ({ state, descriptors, navigation }: MaterialTopTabBarProps) => {
    return (
        <View style={styles.tabBarContainer}>
            <View style={styles.tabBar}>
                {state.routes.map((route, index) => {
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
                    const label = options.tabBarLabel;

                    return (
                        <TouchableOpacity
                            key={index}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel}
                            onPress={onPress}
                            style={styles.tabItem}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.iconContainer, isFocused && styles.activeIconContainer]}>
                                {Icon && <Icon focused={isFocused} color={isFocused ? Colors.black : 'rgba(255,255,255,0.4)'} />}
                            </View>
                            <Text style={{
                                color: isFocused ? Colors.white : 'rgba(255, 255, 255, 0.4)',
                                fontSize: 10,
                                fontWeight: isFocused ? 'bold' : 'normal',
                                marginBottom: 10, // Raise title
                                marginTop: 4,
                            }}>
                                {typeof label === 'string' ? label : route.name}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
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
                    tabBarLabel: "Dashboard",
                    tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={24} />,
                }}
            />
            <Tab.Screen
                name="Stats"
                component={StatsScreen}
                options={{
                    tabBarLabel: "Our Team",
                    tabBarIcon: ({ color }) => <BarChart3 color={color} size={24} />,
                }}
            />
            <Tab.Screen
                name="Account"
                component={AccountScreen}
                options={{
                    tabBarLabel: "Account",
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
                            contentStyle: { backgroundColor: 'transparent' }
                        }}
                    />
                    <Stack.Screen
                        name="ChallengeSelection"
                        component={ChallengeSelectionScreen}
                        options={{
                            presentation: 'transparentModal',
                            animation: 'fade',
                            headerShown: false,
                            contentStyle: { backgroundColor: 'transparent' }
                        }}
                    />
                </>
            ) : (
                <>
                    <Stack.Screen name="Auth" component={AuthScreen} />
                </>
            )}
        </Stack.Navigator>
    );
};

const styles = StyleSheet.create({
    tabBarContainer: {
        position: 'absolute',
        bottom: 0, // Moved to bottom 0 for squared design usually, but user asked for specific style. Keeping it absolute but maybe adjusting bottom if needed. 
        // Actually, for a squared bar that looks like a standard tab bar, bottom 0 is better.
        // But previous design had it floating. User asked for squared corners.
        // Let's stick to the previous positioning but remove radius.
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: Colors.black,
        borderRadius: 0, // Squared
        height: 110, // Increased height for more icon spacing
        width: '100%',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingBottom: 30, // More padding for better spacing from bottom
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
        width: 40,
        height: 40,
    },
    activeIconContainer: {
        backgroundColor: Colors.white, // White square background
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        // borderRadius: 0 is default for View, so it's a square
    },
});

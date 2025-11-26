import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { Colors, Layout } from '../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { StepService } from '../services/StepService';
import { ChallengeService } from '../services/ChallengeService';
import { supabase } from '../lib/supabase';
// @ts-ignore
import { CheckCircle, User, Users } from 'lucide-react-native';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';

import { StepLog, Challenge } from '../types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_HEIGHT = 300;
const PADDING = 20;
const BAR_WIDTH = 20;

export const StatsScreen = () => {
    const { currentUser, partner } = useApp();
    const [history, setHistory] = useState<StepLog[]>([]);
    const [hourlyData, setHourlyData] = useState<number[]>(new Array(24).fill(0));
    const [completedChallenges, setCompletedChallenges] = useState<Challenge[]>([]);
    const [filter, setFilter] = useState<'all' | 'solo' | 'couple'>('all');
    const [viewMode, setViewMode] = useState<'day' | 'week'>('week');

    useEffect(() => {
        if (currentUser) {
            // Load step history (including partner if they exist)
            StepService.getHistory(currentUser.id, partner?.id || 'none').then(data => {
                const mappedHistory: StepLog[] = data.map((h: any) => ({
                    userId: h.user_id,
                    date: h.date,
                    count: h.count,
                    id: h.id
                }));
                setHistory(mappedHistory);
            });

            // Load hourly data for today (Day View)
            StepService.getHourlyHistory(currentUser.id, new Date()).then(data => {
                setHourlyData(data);
            });

            // Fetch completed challenges (both solo and couple)
            const fetchCompleted = async () => {
                let allCompleted: Challenge[] = [];

                // Fetch solo challenges
                const soloCompleted = await ChallengeService.getCompletedSoloChallenges(currentUser.id);
                allCompleted = [...soloCompleted];

                // Fetch couple challenges if partner exists
                if (partner) {
                    const { data: coupleData } = await supabase
                        .from('couples')
                        .select('id')
                        .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`)
                        .single();

                    if (coupleData) {
                        const coupleCompleted = await ChallengeService.getCompletedChallenges(coupleData.id);
                        allCompleted = [...allCompleted, ...coupleCompleted];
                    }
                }

                // Sort by completion date (most recent first)
                allCompleted.sort((a, b) => {
                    const dateA = a.completedDate ? new Date(a.completedDate).getTime() : 0;
                    const dateB = b.completedDate ? new Date(b.completedDate).getTime() : 0;
                    return dateB - dateA;
                });
                setCompletedChallenges(allCompleted);
            };
            fetchCompleted();
        }
    }, [currentUser, partner]);

    // Process data for the last 7 days (Week View)
    const getLast7Days = () => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });

            const mySteps = history.find(h => h.userId === currentUser?.id && h.date === dateStr)?.count || 0;
            const partnerSteps = history.find(h => h.userId === partner?.id && h.date === dateStr)?.count || 0;

            days.push({ label: dayLabel, mySteps, partnerSteps });
        }
        return days;
    };

    // Process data for today (Day View)
    const getTodayHourly = () => {
        return hourlyData.map((steps, hour) => ({
            label: hour % 6 === 0 ? `${hour}h` : '', // Label every 6 hours
            mySteps: steps,
            partnerSteps: 0 // No hourly data for partner
        }));
    };

    const chartData = viewMode === 'week' ? getLast7Days() : getTodayHourly();

    // Dynamic Max Steps & Ticks
    let maxSteps = 10000;
    let ticks = [0, 0.25, 0.5, 0.75, 1];

    if (viewMode === 'week') {
        const dataMax = Math.max(...chartData.map(d => d.mySteps + d.partnerSteps));
        maxSteps = Math.max(dataMax, 25000); // Ensure at least 25k for scale
        // Fixed markers for week: 5k, 10k, 15k, 25k (approximate distribution)
        // We'll just use linear scale for simplicity but user asked for specific markers.
        // If we want specific markers, we should just render lines at those values relative to maxSteps.
        // Let's stick to a linear scale that covers the max, but maybe set max to 25000 if data is lower.
    } else {
        const dataMax = Math.max(...chartData.map(d => d.mySteps));
        maxSteps = Math.max(dataMax, 1500); // Ensure at least 1500 for scale
    }

    // Account for content padding (Layout.padding) and card internal padding (15)
    const chartWidth = SCREEN_WIDTH - (Layout.padding * 2) - (15 * 2);
    // Adjust bar width based on data points
    const barWidth = viewMode === 'week' ? 20 : 8;
    const spacing = (chartWidth - chartData.length * barWidth) / (chartData.length + 1);

    const filteredChallenges = completedChallenges.filter(c => {
        if (filter === 'all') return true;
        return c.type === filter;
    });

    // Custom Ticks based on User Request
    const getTickValues = () => {
        if (viewMode === 'week') return [5000, 10000, 15000, 25000];
        return [500, 1000, 1500];
    };
    const tickValues = getTickValues();
    // Update maxSteps to be at least the highest tick
    maxSteps = Math.max(maxSteps, tickValues[tickValues.length - 1]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Our Team</Text>
                <Text style={styles.subtitle}>Your Progress</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* View Mode Toggle */}
                <View style={styles.toggleContainer}>
                    <TouchableOpacity
                        style={[styles.toggleButton, viewMode === 'day' && styles.toggleButtonActive]}
                        onPress={() => setViewMode('day')}
                    >
                        <Text style={[styles.toggleText, viewMode === 'day' && styles.toggleTextActive]}>Day</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleButton, viewMode === 'week' && styles.toggleButtonActive]}
                        onPress={() => setViewMode('week')}
                    >
                        <Text style={[styles.toggleText, viewMode === 'week' && styles.toggleTextActive]}>Week</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.chartCard}>
                    <View style={{ marginBottom: 10 }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: Colors.black }}>
                            {viewMode === 'week' ? 'Last 7 Days' : 'Today (Hourly)'}
                        </Text>
                    </View>

                    <Svg height={CHART_HEIGHT} width={chartWidth}>
                        {/* Grid Lines (Custom Ticks) */}
                        {tickValues.map((val, i) => {
                            const y = CHART_HEIGHT - 30 - (val / maxSteps) * (CHART_HEIGHT - 50);
                            return (
                                <React.Fragment key={i}>
                                    <Line
                                        x1="0"
                                        y1={y}
                                        x2={chartWidth}
                                        y2={y}
                                        stroke={Colors.border}
                                        strokeDasharray="5, 5"
                                        strokeWidth="1"
                                    />
                                    <SvgText
                                        x="0"
                                        y={y - 5}
                                        fontSize="10"
                                        fill={Colors.black}
                                    >
                                        {val >= 1000 ? `${val / 1000}k` : val}
                                    </SvgText>
                                </React.Fragment>
                            );
                        })}

                        {/* Bars */}
                        {/* Bars */}
                        {chartData.map((d, i) => {
                            const x = spacing + i * (barWidth + spacing);
                            const myHeight = (d.mySteps / maxSteps) * (CHART_HEIGHT - 50);
                            const partnerHeight = (d.partnerSteps / maxSteps) * (CHART_HEIGHT - 50);

                            return (
                                <React.Fragment key={i}>
                                    {/* Partner Bar (Bottom) - Only show if > 0 */}
                                    {d.partnerSteps > 0 && (
                                        <Rect
                                            x={x}
                                            y={CHART_HEIGHT - 30 - partnerHeight}
                                            width={barWidth}
                                            height={partnerHeight}
                                            fill="#ef4444"
                                            rx={barWidth / 2}
                                        />
                                    )}
                                    {/* My Bar (Top - Stacked) */}
                                    <Rect
                                        x={x}
                                        y={CHART_HEIGHT - 30 - partnerHeight - myHeight}
                                        width={barWidth}
                                        height={myHeight}
                                        fill="#22c55e"
                                        rx={barWidth / 2}
                                    />
                                    {/* Label */}
                                    <SvgText
                                        x={x + barWidth / 2}
                                        y={CHART_HEIGHT - 10}
                                        fontSize="10"
                                        fill={Colors.black}
                                        textAnchor="middle"
                                    >
                                        {d.label}
                                    </SvgText>
                                </React.Fragment>
                            );
                        })}
                    </Svg>

                    <View style={styles.legend}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
                            <Text style={styles.legendText}>You</Text>
                        </View>
                        {partner && viewMode === 'week' && (
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
                                <Text style={styles.legendText}>{partner.username}</Text>
                            </View>
                        )}
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Challenge History</Text>

                {/* Filter Toggle */}
                <View style={styles.filterContainer}>
                    {(['all', 'solo', 'couple'] as const).map((option) => (
                        <TouchableOpacity
                            key={option}
                            style={[
                                styles.filterButton,
                                filter === option && styles.filterButtonActive
                            ]}
                            onPress={() => setFilter(option)}
                        >
                            <Text style={[
                                styles.filterText,
                                filter === option && styles.filterTextActive
                            ]}>
                                {option.charAt(0).toUpperCase() + option.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {filteredChallenges.length > 0 ? (
                    filteredChallenges.map((challenge, index) => (
                        <View key={index} style={styles.historyCard}>
                            <View style={styles.iconContainer}>
                                <CheckCircle size={24} color={Colors.success} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: Colors.text, marginRight: 8 }}>
                                        {challenge.title}
                                    </Text>
                                    <View style={[styles.typeBadge, { backgroundColor: challenge.type === 'solo' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(236, 72, 153, 0.1)' }]}>
                                        {challenge.type === 'solo' ? (
                                            <User size={10} color={Colors.primary} />
                                        ) : (
                                            <Users size={10} color={Colors.secondary} />
                                        )}
                                        <Text style={[styles.typeBadgeText, { color: challenge.type === 'solo' ? Colors.primary : Colors.secondary }]}>
                                            {challenge.type}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={{ fontSize: 14, color: Colors.black }}>
                                    Completed on {challenge.completedDate ? new Date(challenge.completedDate).toLocaleDateString() : 'Unknown'}
                                </Text>
                            </View>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{challenge.goal >= 1000 ? `${challenge.goal / 1000}k` : challenge.goal}</Text>
                            </View>
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>No completed challenges yet</Text>
                        <Text style={styles.emptyStateSubtext}>Keep walking to earn badges!</Text>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView >
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
        color: Colors.black,
    },
    content: {
        padding: Layout.padding,
    },
    chartCard: {
        padding: 15,
        backgroundColor: Colors.card,
        borderRadius: Layout.borderRadius,
        marginBottom: Layout.padding,
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginTop: 20,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 0, // Squared design
    },
    legendText: {
        color: Colors.black,
        fontSize: 14,
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 15,
        marginTop: 10,
    },
    filterContainer: {
        flexDirection: 'row',
        marginBottom: 15,
        backgroundColor: Colors.card,
        padding: 4,
        borderRadius: 0, // Squared design
        borderWidth: 1,
        borderColor: Colors.black,
    },
    filterButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 0, // Squared design
    },
    filterButtonActive: {
        backgroundColor: Colors.background,
    },
    filterText: {
        fontSize: 14,
        color: Colors.black,
        fontWeight: '600',
    },
    filterTextActive: {
        color: Colors.text,
        fontWeight: 'bold',
    },
    historyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.card,
        padding: 15,
        borderRadius: Layout.borderRadius,
        marginBottom: 10,
        gap: 15,
    },
    iconContainer: {
        marginTop: 2,
    },
    badge: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 0,
    },
    badgeText: {
        color: Colors.text,
        fontSize: 12,
        fontWeight: 'bold',
    },
    emptyState: {
        alignItems: 'center',
        padding: 30,
        opacity: 0.5,
    },
    emptyStateText: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    emptyStateSubtext: {
        color: Colors.black,
        fontSize: 14,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 0, // Squared
        borderWidth: 1,
        borderColor: Colors.black,
    },
    typeBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.card,
        borderRadius: 0, // Squared
        padding: 4,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: Colors.black,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 0, // Squared
    },
    toggleButtonActive: {
        backgroundColor: Colors.black, // Active state black
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.black,
    },
    toggleTextActive: {
        color: Colors.white, // White text on black background
        fontWeight: 'bold',
    },
});

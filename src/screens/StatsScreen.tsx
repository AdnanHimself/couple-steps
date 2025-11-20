import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Image } from 'react-native';
import { Colors, Layout } from '../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { StepService } from '../services/StepService';
import { ChallengeService } from '../services/ChallengeService';
import { supabase } from '../lib/supabase';
// @ts-ignore
import { CheckCircle } from 'lucide-react-native';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_HEIGHT = 300;
const PADDING = 20;
const BAR_WIDTH = 20;

export const StatsScreen = () => {
    const { currentUser, partner } = useApp();
    const [history, setHistory] = useState<any[]>([]);
    const [completedChallenges, setCompletedChallenges] = useState<any[]>([]);

    useEffect(() => {
        if (currentUser && partner) {
            StepService.getHistory(currentUser.id, partner.id).then(data => {
                setHistory(data);
            });

            // Fetch completed challenges
            const fetchCompleted = async () => {
                const { data: coupleData } = await supabase
                    .from('couples')
                    .select('id')
                    .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`)
                    .single();

                if (coupleData) {
                    const completed = await ChallengeService.getCompletedChallenges(coupleData.id);
                    setCompletedChallenges(completed);
                }
            };
            fetchCompleted();
        }
    }, [currentUser, partner]);

    // Process data for the last 7 days
    const getLast7Days = () => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });

            const mySteps = history.find(h => h.user_id === currentUser?.id && h.date === dateStr)?.count || 0;
            const partnerSteps = history.find(h => h.user_id === partner?.id && h.date === dateStr)?.count || 0;

            days.push({ date: dateStr, label: dayLabel, mySteps, partnerSteps });
        }
        return days;
    };

    const chartData = getLast7Days();
    const maxSteps = Math.max(...chartData.map(d => d.mySteps + d.partnerSteps), 10000);
    const chartWidth = SCREEN_WIDTH - PADDING * 2;
    const spacing = (chartWidth - chartData.length * BAR_WIDTH) / (chartData.length + 1);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Weekly Activity</Text>
                <Text style={styles.subtitle}>Stacked Steps</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.chartCard}>
                    <Svg height={CHART_HEIGHT} width={chartWidth}>
                        {/* Grid Lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => {
                            const y = CHART_HEIGHT - 30 - tick * (CHART_HEIGHT - 50);
                            return (
                                <React.Fragment key={i}>
                                    <Line x1="0" y1={y} x2={chartWidth} y2={y} stroke="rgba(255,255,255,0.1)" strokeDasharray="4" />
                                    <SvgText x="0" y={y - 5} fill={Colors.textSecondary} fontSize="10">
                                        {Math.round(tick * maxSteps / 1000) + 'k'}
                                    </SvgText>
                                </React.Fragment>
                            );
                        })}

                        {/* Bars */}
                        {chartData.map((d, i) => {
                            const x = spacing + i * (BAR_WIDTH + spacing);
                            const totalHeight = CHART_HEIGHT - 50;
                            const myBarHeight = (d.mySteps / maxSteps) * totalHeight;
                            const partnerBarHeight = (d.partnerSteps / maxSteps) * totalHeight;
                            const myY = CHART_HEIGHT - 30 - myBarHeight;
                            const partnerY = myY - partnerBarHeight;
                            return (
                                <React.Fragment key={i}>
                                    {/* My Bar (Bottom) - Yellow */}
                                    <Rect x={x} y={myY} width={BAR_WIDTH} height={myBarHeight} fill={currentUser?.color || '#fbbf24'} rx={4} />
                                    {/* Partner Bar (Top) - Red */}
                                    {d.partnerSteps > 0 && (
                                        <Rect x={x} y={partnerY} width={BAR_WIDTH} height={partnerBarHeight} fill={partner?.color || '#f87171'} opacity={0.9} rx={4} />
                                    )}
                                    {/* Label */}
                                    <SvgText x={x + BAR_WIDTH / 2} y={CHART_HEIGHT - 10} fill={Colors.textSecondary} fontSize="12" textAnchor="middle">
                                        {d.label}
                                    </SvgText>
                                </React.Fragment>
                            );
                        })}
                    </Svg>

                    {/* Legend */}
                    <View style={styles.legend}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: '#fbbf24' }]} />
                            <Text style={styles.legendText}>You</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: '#f87171' }]} />
                            <Text style={styles.legendText}>{partner?.username || 'Partner'}</Text>
                        </View>
                    </View>
                </View>


                {/* History Section */}
                <Text style={styles.sectionTitle}>Challenge History</Text>
                {
                    completedChallenges.length > 0 ? (
                        completedChallenges.map((challenge) => (
                            <View key={challenge.id} style={styles.historyCard}>
                                <View style={[styles.iconContainer, { backgroundColor: Colors.success }]}>
                                    <CheckCircle size={24} color="#FFF" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.historyTitle}>{challenge.title}</Text>
                                    <Text style={styles.historyDate}>
                                        Completed {new Date(challenge.completedDate).toLocaleDateString()}
                                    </Text>
                                </View>
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{challenge.goal / 1000}k</Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>No completed challenges yet.</Text>
                            <Text style={styles.emptyStateSubtext}>Keep walking together!</Text>
                        </View>
                    )
                }
                <View style={{ height: 100 }} />
            </ScrollView >
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
        color: Colors.textSecondary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
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
        borderRadius: 4,
    },
    legendText: {
        color: Colors.textSecondary,
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
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    historyTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
    },
    historyDate: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    badge: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
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
        color: Colors.textSecondary,
        fontSize: 14,
    },
});

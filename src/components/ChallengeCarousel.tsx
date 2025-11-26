import React from 'react';
import { View, StyleSheet, FlatList, Dimensions } from 'react-native';
import { ChallengeCard } from './ChallengeCard';
import { Challenge } from '../types';
import { useApp } from '../context/AppContext';
import { useNavigation } from '@react-navigation/native';

export const ChallengeCarousel = () => {
    const { activeChallenge, setActiveChallenge, stepHistory, currentUser, partner, challenges } = useApp();
    const navigation = useNavigation();

    const getStepsForUser = (userId: string) => {
        return stepHistory
            .filter(s => s.userId === userId)
            .reduce((acc: number, curr: any) => acc + curr.count, 0);
    };

    const userSteps = currentUser ? getStepsForUser(currentUser.id) : 0;
    const partnerSteps = partner ? getStepsForUser(partner.id) : 0;
    const totalSteps = userSteps + partnerSteps;

    const handleSelect = (challenge: Challenge) => {
        // Navigate to selection screen instead of immediate selection
        // @ts-ignore - Navigation types not fully typed yet
        navigation.navigate('ChallengeSelection');
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={challenges}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                    const isActive = activeChallenge?.id === item.id;
                    const progress = isActive ? Math.min(totalSteps / item.goal, 1) : 0;

                    return (
                        <ChallengeCard
                            challenge={item}
                            progress={progress}
                            totalSteps={totalSteps}
                            isActive={isActive}
                            onSelect={handleSelect}
                        />
                    );
                }}
                contentContainerStyle={styles.contentContainer}
                snapToInterval={Dimensions.get('window').width - 32} // Card width + margin
                decelerationRate="fast"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    contentContainer: {
        paddingHorizontal: 0, // Handled by card margin
    },
});

import { User } from '../types';

export interface Reward {
    id: string;
    title: string;
    description: string;
    cost: number; // Points or steps required
    isRedeemed: boolean;
}

// This service is designed to be easily extended with backend logic later.
export const RewardsService = {
    // Placeholder for fetching available rewards
    getAvailableRewards: async (): Promise<Reward[]> => {
        return [
            { id: 'r1', title: 'Massage Coupon', description: 'Redeem for a 30min massage', cost: 50000, isRedeemed: false },
            { id: 'r2', title: 'Dinner Date', description: 'Winner picks the restaurant', cost: 100000, isRedeemed: false },
        ];
    },

    // Placeholder for redeeming a reward
    redeemReward: async (userId: string, rewardId: string): Promise<boolean> => {
        console.log(`User ${userId} redeeming reward ${rewardId}`);
        return true;
    },

    // Future: Calculate points based on steps/challenges
    calculatePoints: (steps: number): number => {
        return Math.floor(steps / 100); // 1 point per 100 steps
    }
};

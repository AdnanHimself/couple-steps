import { User, Challenge, StepLog } from '../types';

const USERS: User[] = [
    { id: 'u1', username: 'Alex', avatarUrl: 'https://i.pravatar.cc/150?u=alex', color: '#4F46E5' },
    { id: 'u2', username: 'Sam', avatarUrl: 'https://i.pravatar.cc/150?u=sam', color: '#EC4899' },
];

const CHALLENGES: Challenge[] = [
    {
        id: 'c1',
        title: 'Great Wall of China',
        goal: 200000,
        type: 'couple',
        description: 'Walk the length of the Great Wall!',
        imageUrl: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=800&q=80',
        durationDays: 30,
        milestones: [
            { steps: 50000, label: 'First Watchtower' },
            { steps: 100000, label: 'Halfway Point' },
            { steps: 150000, label: 'Dragon\'s Back' },
        ],
    },
    {
        id: 'c2',
        title: 'Berlin to Rome',
        goal: 1500000,
        type: 'couple',
        description: 'A romantic journey across Europe.',
        imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80',
        durationDays: 90,
        milestones: [
            { steps: 300000, label: 'Munich' },
            { steps: 600000, label: 'Alps Crossing' },
            { steps: 1000000, label: 'Florence' },
        ],
    },
];

const INITIAL_STEPS: StepLog[] = [
    { date: new Date().toISOString().split('T')[0], userId: 'u1', count: 8500 },
    { date: new Date().toISOString().split('T')[0], userId: 'u2', count: 7200 },
    // Previous days
    { date: '2023-10-26', userId: 'u1', count: 10000 },
    { date: '2023-10-26', userId: 'u2', count: 9500 },
];

export const MockService = {
    getUsers: () => Promise.resolve(USERS),
    getChallenges: () => Promise.resolve(CHALLENGES),
    getSteps: (userId: string) => {
        return Promise.resolve(INITIAL_STEPS.filter(s => s.userId === userId));
    },
};

/**
 * TYPE DEFINITIONS
 * 
 * This file defines all the TypeScript interfaces used throughout the app.
 * These types ensure type safety and make the code more maintainable.
 */

/**
 * User Interface
 * Represents a user in the app (either the current user or their partner).
 * 
 * @property id - Unique identifier from Supabase Auth (UUID).
 * @property username - Display name or handle chosen by the user.
 * @property avatarUrl - URL to the user's profile picture (remote image).
 * @property color - Personalized color hex code (e.g., "#FF5733") used for UI accents.
 */
export interface User {
    id: string;
    username: string;
    avatarUrl: string;
    color: string;
    email?: string;
}

/**
 * Challenge Interface
 * Represents a step challenge definition that users or couples can participate in.
 * 
 * @property id - Unique identifier for the challenge (UUID).
 * @property title - The display title of the challenge (e.g., "Everest Hike").
 * @property goal - The target number of steps required to complete this challenge.
 * @property description - A short, motivating description of the challenge.
 * @property imageUrl - URL for the background image displayed on the challenge card.
 * @property durationDays - Recommended duration to complete the challenge (in days).
 * @property milestones - List of intermediate checkpoints (Milestone objects).
 * @property completedDate - (Optional) ISO date string of when the challenge was finished.
 * @property type - Categorization: 'solo' for individual, 'couple' for shared goals.
 */
export interface Challenge {
    id: string;
    title: string;
    goal: number;
    description: string;
    imageUrl: string;
    durationDays: number;
    milestones: Milestone[];
    completedDate?: string;
    type: 'solo' | 'couple';
}

/**
 * UserChallenge Interface
 * Represents the link between a user and a specific challenge they are actively working on.
 * This tracks the progress and status of a specific instance of a challenge.
 * 
 * @property id - Unique identifier for this user-challenge record (UUID).
 * @property userId - The UUID of the user participating in this challenge.
 * @property challengeId - The UUID of the challenge definition being attempted.
 * @property status - Current state: 'active' (in progress), 'completed' (finished), or 'paused'.
 * @property startDate - ISO date string of when the user started this challenge.
 * @property endDate - (Optional) ISO date string of when the challenge was completed.
 * @property progress - Current number of steps contributed towards this challenge.
 * @property challenge - (Optional) The full Challenge object details (joined data).
 */
export interface UserChallenge {
    id: string;
    userId: string;
    challengeId: string;
    status: 'active' | 'completed' | 'paused';
    startDate: string;
    endDate?: string;
    progress: number;
    challenge?: Challenge;
}

/**
 * Milestone Interface
 * Represents a checkpoint within a challenge
 * 
 * @property steps - Step count at which this milestone is reached
 * @property label - Descriptive name for the milestone (e.g., "Halfway Point")
 */
export interface Milestone {
    steps: number;
    label: string;
}

/**
 * StepLog Interface
 * Represents a daily step count record for a user
 * 
 * @property date - ISO date string in YYYY-MM-DD format
 * @property userId - ID of the user who logged these steps
 * @property count - Number of steps taken on this date
 * 
 * Note: Each user gets one StepLog entry per day. The count is updated throughout the day.
 */
export interface StepLog {
    date: string; // YYYY-MM-DD
    userId: string;
    count: number;
}



export interface DBChallenge {
    id: string;
    title?: string;
    name?: string;
    description: string;
    goal: number;
    image_url: string;
    duration_days?: number;
    milestones?: Milestone[];
    type?: 'solo' | 'couple';
    created_at?: string;
}

export interface DBStepLog {
    id: string;
    user_id: string;
    date: string;
    count: number;
    updated_at: string;
}

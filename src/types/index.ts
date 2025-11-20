/**
 * TYPE DEFINITIONS
 * 
 * This file defines all the TypeScript interfaces used throughout the app.
 * These types ensure type safety and make the code more maintainable.
 */

/**
 * User Interface
 * Represents a user in the app (either the current user or their partner)
 * 
 * @property id - Unique identifier from Supabase Auth (UUID)
 * @property name - Display name of the user
 * @property avatarUrl - URL to the user's profile picture
 * @property color - Personalized color for the user (used in UI elements like progress rings)
 */
export interface User {
    id: string;
    username: string;
    avatarUrl: string;
    color: string;
}

/**
 * Challenge Interface
 * Represents a step challenge that couples can participate in
 * 
 * @property id - Unique identifier for the challenge
 * @property title - Display name (e.g., "Great Wall of China")
 * @property goal - Total number of steps required to complete the challenge
 * @property description - Brief explanation of the challenge
 * @property imageUrl - Background image for the challenge card
 * @property durationDays - Suggested duration in days
 * @property milestones - Array of milestone markers throughout the challenge
 * 
 * Note: Changed from 'name' to 'title' and 'totalSteps' to 'goal' to match database schema
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

/**
 * Message Interface
 * Represents a chat message between partners
 * 
 * @property id - Unique identifier for the message
 * @property senderId - ID of the user who sent the message
 * @property text - Content of the message
 * @property timestamp - Unix timestamp (milliseconds) when the message was sent
 * 
 * Note: Messages are stored in Supabase and synced in real-time
 */
export interface Message {
    id: string;
    senderId: string;
    text: string;
    timestamp: number;
}

/**
 * AppState Interface (Currently unused)
 * Originally defined the global app state structure
 * 
 * Note: We use React Context (AppContext) for state management instead.
 * This interface is kept for reference but not actively used.
 */
export interface AppState {
    currentUser: User;
    partner: User;
    challenge: Challenge;
    steps: StepLog[];
    messages: Message[];
}

/**
 * COLORS & DESIGN TOKENS
 * 
 * This file defines the color palette and design system constants used throughout the app.
 * Using centralized constants ensures visual consistency and makes theme changes easier.
 */

/**
 * Color Palette
 * 
 * Design Philosophy:
 * - Dark theme for reduced eye strain and modern aesthetic
 * - High contrast for accessibility
 * - Vibrant accent colors for visual interest
 * - Gradients for depth and premium feel
 */
export const Colors = {
    // PRIMARY COLORS
    primary: '#DC2626',       // Wine Red - Main brand color, used for buttons, active states, highlights
    secondary: '#EC4899',     // Pink - Secondary actions, partner-related UI elements

    // BACKGROUND COLORS
    background: '#0A0A0A',    // Near Black - Main app background for dark theme
    card: '#1E1E1E',          // Dark Gray - Elevation for cards and containers
    surface: '#1E1E1E',       // Same as card - Alternative surface color
    surfaceLight: '#2A2A2A',  // Slightly lighter gray - For subtle elevation differences
    backgroundSecondary: '#151515', // Secondary background for contrast

    // TEXT COLORS
    text: '#FFFFFF',          // White - Primary text for high contrast on dark backgrounds
    textSecondary: '#A0A0A0', // Light Gray - Secondary text, descriptions, less important info

    // UI ELEMENTS
    border: '#333333',        // Medium Gray - Borders, dividers, subtle lines

    // STATUS COLORS
    success: '#10B981',       // Green - Success messages, positive states, online status
    warning: '#F59E0B',       // Amber - Warnings, challenges, attention-grabbing elements
    danger: '#EF4444',        // Red - Errors, destructive actions, sign out

    // UTILITY
    white: '#FFFFFF',         // Pure white - For icons, text on colored backgrounds

    /**
     * GRADIENTS
     * 
     * Linear gradients used for modern, premium UI elements.
     * Each gradient is an array of colors: [start, end]
     * 
     * Usage: <LinearGradient colors={Colors.gradients.primary} ... />
     */
    gradients: {
        primary: ['#4F46E5', '#7C3AED'],     // Indigo to Purple - Primary buttons, active challenges
        secondary: ['#EC4899', '#F43F5E'],   // Pink to Rose - Secondary actions, partner elements
        card: ['#1E1E1E', '#2A2A2A'],        // Subtle dark gradient - Card backgrounds for depth
        dark: ['#0A0A0A', '#1E1E1E'],        // Background gradient - Screen backgrounds for visual interest
    }
};

/**
 * LAYOUT CONSTANTS
 * 
 * Standardized spacing and border radius values for consistent UI.
 * These values are used across all components to maintain design consistency.
 * 
 * @property padding - Standard padding for containers (20px)
 * @property borderRadius - Standard corner radius for rounded elements (16px)
 */
export const Layout = {
    padding: 24,          // Used for screen padding, card padding, spacing between elements
    borderRadius: 16,     // Used for cards, buttons, inputs - creates friendly, modern appearance

    // Header Constants for Consistency
    headerHeight: 120,    // Fixed height for all screen headers
    headerPaddingTop: 60, // Fixed top padding (status bar + spacing)
    headerPaddingHorizontal: 20, // Standard horizontal padding
    headerFontSize: 28,   // Standard font size for screen titles
};

import { Platform } from 'react-native';
import { AndroidHealthConnect } from './android/AndroidHealthConnect';
import { IOSHealthKit } from './ios/IOSHealthKit';

/**
 * Define the shape of our Health Service.
 * This interface ensures both Android and iOS implementations behave the same way.
 */
export interface HealthServiceType {
    /**
     * Initialize the health system (Health Connect or HealthKit).
     */
    initialize(): Promise<void>;

    /**
     * Request necessary permissions from the user.
     * @returns Promise<boolean> True if permissions are granted.
     */
    requestPermissions(): Promise<boolean>;

    /**
     * Get the total step count for today.
     * @returns Promise<number> Total steps for the current day.
     */
    getTodaySteps(): Promise<number>;

    /**
     * Get step history for the last N days.
     * @param days - Number of days to look back.
     * @returns Promise<Array<{ date: string; steps: number }>> Array of daily step counts.
     */
    getStepHistory(days: number): Promise<Array<{ date: string; steps: number }>>;

    /**
     * Open system settings if permissions are denied (mostly for Android).
     */
    openSettings(): Promise<void>;
}

// Select the correct implementation based on the OS
// If it's iOS, use IOSHealthKit. If it's Android, use AndroidHealthConnect.
// The 'default' fallback is AndroidHealthConnect (good practice to have a default).
const HealthService: HealthServiceType = Platform.select({
    ios: IOSHealthKit,
    android: AndroidHealthConnect,
    default: AndroidHealthConnect,
});

export default HealthService;

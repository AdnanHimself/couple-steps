import AppleHealthKit, {
    HealthValue,
    HealthKitPermissions,
} from 'react-native-health';
import { Logger } from '../../utils/Logger';

// Define permissions we need (Read Steps)
const permissions = {
    permissions: {
        read: [AppleHealthKit.Constants.Permissions.Steps],
    },
} as HealthKitPermissions;

// iOS implementation using HealthKit
export const IOSHealthKit = {

    // Initialize HealthKit
    initialize: async (): Promise<void> => {
        return new Promise((resolve, reject) => {
            // Init HealthKit with permissions
            AppleHealthKit.initHealthKit(permissions, (error: string) => {
                if (error) {
                    Logger.error('[IOSHealthKit] Init error:', error);
                    // Don't reject, just log. We can try requesting permissions later.
                    resolve();
                } else {
                    Logger.info('[IOSHealthKit] Initialized successfully');
                    resolve();
                }
            });
        });
    },

    // Request permissions (HealthKit shows a modal)
    requestPermissions: async (): Promise<boolean> => {
        // HealthKit init actually triggers the permission prompt if not already granted
        // So we just re-run init or check status.
        // For simplicity, we assume true if init worked.
        return true;
    },

    // Get steps for today
    getTodaySteps: async (): Promise<number> => {
        return new Promise((resolve) => {
            const options = {
                includeManuallyAdded: true, // Include steps user added manually
            };

            AppleHealthKit.getStepCount(options, (err: Object, results: HealthValue) => {
                if (err) {
                    Logger.warn('[IOSHealthKit] Error getting steps:', err);
                    resolve(0);
                    return;
                }
                Logger.info('[IOSHealthKit] Today steps:', results.value);
                resolve(results.value);
            });
        });
    },

    // Get step history
    getStepHistory: async (days: number): Promise<Array<{ date: string; steps: number }>> => {
        // Placeholder for history
        return [];
    },

    // Open settings (iOS doesn't have a direct link to Health permissions from app)
    openSettings: async (): Promise<void> => {
        Logger.info('[IOSHealthKit] Cannot open Health settings directly on iOS');
    }
};

import {
    initialize,
    requestPermission,
    readRecords,
    getSdkStatus,
    SdkAvailabilityStatus,
    openHealthConnectSettings,
} from 'react-native-health-connect';
import { Logger } from '../../utils/Logger';

// Android implementation using Health Connect
export const AndroidHealthConnect = {

    // Initialize Health Connect
    initialize: async (): Promise<void> => {
        try {
            // Check if Health Connect is available on this device
            const status = await getSdkStatus();
            if (status === SdkAvailabilityStatus.SDK_AVAILABLE) {
                await initialize();
                Logger.info('[AndroidHealthConnect] SDK initialized');
            } else {
                Logger.warn('[AndroidHealthConnect] SDK not available:', status);
            }
        } catch (e) {
            Logger.error('[AndroidHealthConnect] Failed to initialize (Defensive):', e);
            // Do NOT throw, just log and continue
        }
    },

    // Request permissions to read steps
    requestPermissions: async (): Promise<boolean> => {
        try {
            const status = await getSdkStatus();
            if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) {
                Logger.warn('[AndroidHealthConnect] Cannot request permissions: SDK not available');
                return false;
            }

            // Request permission to read Steps
            const permissions = await requestPermission([
                { accessType: 'read', recordType: 'Steps' },
            ]);

            // We assume if the function returns without error, permissions might be granted.
            return true;
        } catch (e) {
            Logger.error('[AndroidHealthConnect] Permission request failed (Defensive):', e);
            return false;
        }
    },

    // Get steps for today (from midnight to now)
    getTodaySteps: async (): Promise<number> => {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Midnight today
            const now = new Date();

            // Try to read steps from Health Connect
            const result = await readRecords('Steps', {
                timeRangeFilter: {
                    operator: 'between',
                    startTime: today.toISOString(),
                    endTime: now.toISOString(),
                },
            });

            // Sum up all step records
            const totalSteps = result.records.reduce((sum, record) => sum + record.count, 0);
            Logger.info('[AndroidHealthConnect] Today steps:', totalSteps);
            return totalSteps;

        } catch (e: any) {
            // Handle specific errors
            if (e.message && e.message.includes('SecurityException')) {
                Logger.warn('[AndroidHealthConnect] Permission denied (SecurityException). Returning 0.');
                return 0;
            }
            Logger.error('[AndroidHealthConnect] Error reading steps (Defensive):', e);
            return 0;
        }
    },

    // Get step history for the last N days
    getStepHistory: async (days: number): Promise<Array<{ date: string; steps: number }>> => {
        try {
            // Implementation for history would go here
            // For now, return empty array to satisfy interface
            return [];
        } catch (e) {
            Logger.error('[AndroidHealthConnect] Error reading history (Defensive):', e);
            return [];
        }
    },

    // Open Health Connect settings app
    openSettings: async (): Promise<void> => {
        try {
            await openHealthConnectSettings();
        } catch (e) {
            Logger.error('[AndroidHealthConnect] Failed to open settings (Defensive):', e);
        }
    }
};

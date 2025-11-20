import { initialize, requestPermission, readRecords, getSdkStatus, SdkAvailabilityStatus } from 'react-native-health-connect';
import { Permission } from 'react-native-health-connect/lib/typescript/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_DATE_KEY = 'LAST_STEP_DATE';

export const PedometerService = {
    /**
     * Check if Health Connect is available on this device
     */
    isAvailable: async (): Promise<boolean> => {
        try {
            const status = await getSdkStatus();
            const isAvailable = status === SdkAvailabilityStatus.SDK_AVAILABLE;
            console.log('[HealthConnect] SDK Status:', status, '| Available:', isAvailable);
            return isAvailable;
        } catch (e) {
            console.error('[HealthConnect] Error checking availability:', e);
            return false;
        }
    },

    /**
     * Initialize Health Connect SDK
     */
    initialize: async (): Promise<void> => {
        try {
            console.log('[HealthConnect] Initializing SDK...');
            const isInitialized = await initialize();
            console.log('[HealthConnect] SDK initialized:', isInitialized);
        } catch (e) {
            console.error('[HealthConnect] Initialize error:', e);
        }
    },

    /**
     * Request permissions to read step count data
     */
    requestPermissions: async (): Promise<boolean> => {
        try {
            console.log('[HealthConnect] Requesting permissions...');

            const permissions: Permission[] = [
                { accessType: 'read', recordType: 'Steps' }
            ];

            const grantedPermissions = await requestPermission(permissions);
            const allGranted = grantedPermissions.length === permissions.length;
            console.log('[HealthConnect] Permissions granted:', allGranted);

            return allGranted;
        } catch (e) {
            console.error('[HealthConnect] Permission error:', e);
            return false;
        }
    },

    /**
     * Get step count for a specific date range
     */
    getStepsBetween: async (startDate: Date, endDate: Date): Promise<number> => {
        try {
            const result = await readRecords('Steps', {
                timeRangeFilter: {
                    operator: 'between',
                    startTime: startDate.toISOString(),
                    endTime: endDate.toISOString(),
                },
            });

            // Sum up all step records in this time range
            const totalSteps = result.records.reduce((sum, record) => {
                return sum + (record.count || 0);
            }, 0);

            console.log('[HealthConnect] Steps between', startDate.toISOString(), 'and', endDate.toISOString(), ':', totalSteps);
            return totalSteps;
        } catch (e) {
            console.error('[HealthConnect] Error reading steps:', e);
            return 0;
        }
    },

    /**
     * Get today's total steps
     */
    getTodaySteps: async (): Promise<number> => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const now = new Date();

        return await PedometerService.getStepsBetween(today, now);
    },

    /**
     * Subscribe is no longer needed - Health Connect uses polling
     * This is a placeholder for backward compatibility
     */
    subscribe: (callback: (steps: number) => void) => {
        console.warn('[HealthConnect] subscribe() is deprecated. Use polling with getTodaySteps() instead.');
        return { remove: () => { } };
    },

    /**
     * Reset counter (not needed for Health Connect, but kept for compatibility)
     */
    reset: async () => {
        console.log('[HealthConnect] Reset called - Health Connect manages data, nothing to reset locally');
        const today = new Date().toISOString().split('T')[0];
        await AsyncStorage.setItem(STORAGE_DATE_KEY, today);
    }
};

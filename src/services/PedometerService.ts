import { initialize, requestPermission, readRecords, getSdkStatus, SdkAvailabilityStatus } from 'react-native-health-connect';
import { Permission } from 'react-native-health-connect/lib/typescript/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { startNativePedometer, requestNativePermission, getLatestNativeSteps } from './NativePedometerService';
import { PermissionsAndroid, Platform } from 'react-native';
import { Logger } from '../utils/Logger';

const STORAGE_DATE_KEY = 'LAST_STEP_DATE';

// Module-level variable to store latest native steps (updated via callback)
let latestNativeSteps: number = 0;

export const PedometerService = {
    /**
     * Check if Health Connect is available on this device
     */
    isAvailable: async (): Promise<boolean> => {
        try {
            const status = await getSdkStatus();
            const isAvailable = status === SdkAvailabilityStatus.SDK_AVAILABLE;
            Logger.info('[HealthConnect] SDK Status:', status, '| Available:', isAvailable);
            return isAvailable;
        } catch (e) {
            Logger.error('[HealthConnect] Error checking availability:', e);
            return false;
        }
    },

    /**
     * Initialize Health Connect SDK
     */
    initialize: async (): Promise<void> => {
        try {
            Logger.info('[HealthConnect] Initializing SDK...');
            const isInitialized = await initialize();
            Logger.info('[HealthConnect] SDK initialized:', isInitialized);

            // ---- Start Native Pedometer (real‑time) ----
            const nativePerm = await requestNativePermission();
            if (nativePerm) {
                await startNativePedometer((steps) => {
                    // Store latest native steps in a module‑level variable
                    latestNativeSteps = steps;
                });
                Logger.info('[NativePedometer] started');
            } else {
                Logger.warn('[NativePedometer] permission denied');
            }
        } catch (e) {
            Logger.error('[HealthConnect] Initialize error:', e);
        }
    },

    /**
     * Request permissions to read step count data
     */
    requestPermissions: async (): Promise<boolean> => {
        try {
            Logger.info('[HealthConnect] Requesting permissions...');

            // Step 1: Request Android System Permission (ACTIVITY_RECOGNITION)
            if (Platform.OS === 'android') {
                Logger.info('[HealthConnect] Requesting ACTIVITY_RECOGNITION permission...');
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
                    {
                        title: 'Activity Recognition Permission',
                        message: 'Couple Steps needs access to your activity data to track your steps.',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    }
                );

                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                    Logger.warn('[HealthConnect] ACTIVITY_RECOGNITION permission denied');
                    return false;
                }
                Logger.info('[HealthConnect] ACTIVITY_RECOGNITION permission granted ✅');
            }

            // Step 2: Request Health Connect Permissions
            const permissions: Permission[] = [
                { accessType: 'read', recordType: 'Steps' }
            ];

            const grantedPermissions = await requestPermission(permissions);
            const allGranted = grantedPermissions.length === permissions.length;
            Logger.info('[HealthConnect] Health Connect permissions granted:', allGranted);

            return allGranted;
        } catch (e) {
            Logger.error('[HealthConnect] Permission error:', e);
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

            Logger.info('[HealthConnect] Steps between', startDate.toISOString(), 'and', endDate.toISOString(), ':', totalSteps);
            return totalSteps;
        } catch (e) {
            Logger.error('[HealthConnect] Error reading steps:', e);
            return 0;
        }
    },

    /**
     * Get hourly step counts for a specific date (0-23h)
     */
    getHourlySteps: async (date: Date): Promise<number[]> => {
        try {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const result = await readRecords('Steps', {
                timeRangeFilter: {
                    operator: 'between',
                    startTime: startOfDay.toISOString(),
                    endTime: endOfDay.toISOString(),
                },
            });

            const hourlySteps = new Array(24).fill(0);
            result.records.forEach(record => {
                const recordStart = new Date(record.startTime);
                const hour = recordStart.getHours();
                if (hour >= 0 && hour < 24) {
                    hourlySteps[hour] += (record.count || 0);
                }
            });
            Logger.info('[HealthConnect] Hourly steps:', hourlySteps);
            return hourlySteps;
        } catch (e) {
            Logger.warn('[HealthConnect] Could not read hourly steps (using fallback):', (e as Error).message);
            // Fallback: use native steps for the current hour only
            const fallback = new Array(24).fill(0);
            const now = new Date();
            const currentHour = now.getHours();
            const nativeSteps = getLatestNativeSteps();
            fallback[currentHour] = nativeSteps;
            return fallback;
        }
    },

    /**
     * Get today's total steps
     */
    getTodaySteps: async (): Promise<number> => {
        // Always use native sensor for now (Health Connect has permission issues)
        const nativeSteps = getLatestNativeSteps();
        Logger.info('[NativePedometer] returning latest steps:', nativeSteps);
        return nativeSteps;
    },

    /**
     * Subscribe is no longer needed - Health Connect uses polling
     * This is a placeholder for backward compatibility
     */
    subscribe: (callback: (steps: number) => void) => {
        Logger.warn('[HealthConnect] subscribe() is deprecated. Use polling with getTodaySteps() instead.');
        return { remove: () => { } };
    },

    /**
     * Reset counter (not needed for Health Connect, but kept for compatibility)
     */
    reset: async () => {
        Logger.info('[HealthConnect] Reset called - Health Connect manages data, nothing to reset locally');
        const today = new Date().toISOString().split('T')[0];
        await AsyncStorage.setItem(STORAGE_DATE_KEY, today);
    },
};

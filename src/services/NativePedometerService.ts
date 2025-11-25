import { Pedometer } from 'expo-sensors';
import { Platform, PermissionsAndroid } from 'react-native';
import { Logger } from '../utils/Logger';

interface Subscription {
    remove: () => void;
}

let subscription: Subscription | null = null;
let latestSteps: number = 0;

/**
 * Request Android ACTIVITY_RECOGNITION permission.
 */
export async function requestNativePermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;
    const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
        {
            title: 'Aktivitätserkennung',
            message: 'Couple Steps benötigt Zugriff auf deine Schritt‑Daten.',
            buttonPositive: 'OK',
            buttonNegative: 'Abbrechen',
        },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
}

/**
 * Start the native pedometer and call onStepUpdate with the latest step count.
 */
export async function startNativePedometer(onStepUpdate: (steps: number) => void): Promise<void> {
    const available = await Pedometer.isAvailableAsync();
    if (!available) {
        Logger.warn('[NativePedometer] Pedometer sensor not available on this device');
        return;
    }

    subscription = Pedometer.watchStepCount((result) => {
        latestSteps = result.steps;
        onStepUpdate(latestSteps);
    });
}

/**
 * Stop listening to the sensor.
 */
export function stopNativePedometer(): void {
    if (subscription) {
        subscription.remove();
        subscription = null;
    }
}

/**
 * Return the most recent step count observed by the watcher.
 */
export function getLatestNativeSteps(): number {
    return latestSteps;
}

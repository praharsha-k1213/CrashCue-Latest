// import * as Notifications from 'expo-notifications';
import { DeviceMotion } from 'expo-sensors';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

// Mock Notifications for Expo Go (SDK 53+ crash fix)
const Notifications = {
    setNotificationHandler: () => { },
    scheduleNotificationAsync: async (notification: any) => {
        console.log('[Mock Notification]', notification.content.title, notification.content.body);
    },
    requestPermissionsAsync: async () => {
        console.log('[Mock Notification] requestPermissionsAsync called. Returning GRANTED.');
        return { status: 'granted' };
    },
    setNotificationChannelAsync: async (channelId: string, options: any) => { },
    AndroidNotificationPriority: {
        MAX: 'max',
        HIGH: 'high',
        DEFAULT: 'default',
        LOW: 'low',
        MIN: 'min',
    },
    AndroidImportance: {
        MAX: 5,
        HIGH: 4,
        DEFAULT: 3,
        LOW: 2,
        MIN: 1,
        NONE: 0,
    }
};

// Configure notifications
Notifications.setNotificationHandler();

interface CrashDetectionContextType {
    isMonitoring: boolean;
    startMonitoring: () => void;
    stopMonitoring: () => void;
    lastEvent: string | null;
    sensorData: {
        acceleration: { x: number; y: number; z: number } | null;
        rotation: { alpha: number; beta: number; gamma: number } | null;
    };
}

const CrashDetectionContext = createContext<CrashDetectionContextType>({
    isMonitoring: false,
    startMonitoring: () => { },
    stopMonitoring: () => { },
    lastEvent: null,
    sensorData: { acceleration: null, rotation: null },
});

export const CrashDetectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [sensorData, setSensorData] = useState<{
        acceleration: { x: number; y: number; z: number } | null;
        rotation: { alpha: number; beta: number; gamma: number } | null;
    }>({ acceleration: null, rotation: null });
    const [lastEvent, setLastEvent] = useState<string | null>(null);
    const [subscription, setSubscription] = useState<any>(null);

    // Thresholds
    const FREE_FALL_THRESHOLD = 0.3; // g (gravity ~= 0 means free fall)
    const IMPACT_THRESHOLD = 3.5; // g (linear acceleration)
    const SPIN_THRESHOLD = 8.0; // rad/s (violent rotation)

    // Debounce/Cool-down
    const [isAlerting, setIsAlerting] = useState(false);

    useEffect(() => {
        registerForPushNotificationsAsync();
    }, []);

    useEffect(() => {
        if (isMonitoring) {
            _subscribe();
        } else {
            _unsubscribe();
        }
        return () => _unsubscribe();
    }, [isMonitoring]);

    const _subscribe = async () => {
        if (Platform.OS === 'web') {
            console.log('Crash Detection: Sensors not supported on Web');
            return;
        }

        try {
            const isAvailable = await DeviceMotion.isAvailableAsync();
            if (!isAvailable) {
                console.log('Crash Detection: DeviceMotion not available on this device');
                return;
            }

            // 50ms update interval for high precision
            DeviceMotion.setUpdateInterval(50);

            const sub = DeviceMotion.addListener(data => {
                const { acceleration, accelerationIncludingGravity, rotation, rotationRate } = data;

                setSensorData({
                    acceleration: acceleration,
                    rotation: rotationRate
                });

                if (!isAlerting) {
                    detectCrash(data);
                }
            });
            setSubscription(sub);
        } catch (error) {
            console.log('Crash Detection: Error starting sensors', error);
        }
    };

    const _unsubscribe = () => {
        subscription && subscription.remove();
        setSubscription(null);
    };

    const detectCrash = (data: any) => {
        const { acceleration, accelerationIncludingGravity, rotationRate } = data;

        // 1. Calculate Magnitudes
        // Linear Acceleration (Impact)
        const impactMag = acceleration ? Math.sqrt(acceleration.x ** 2 + acceleration.y ** 2 + acceleration.z ** 2) : 0;

        // Gravity Vector (Free Fall catch)
        const gravityMag = accelerationIncludingGravity ? Math.sqrt(accelerationIncludingGravity.x ** 2 + accelerationIncludingGravity.y ** 2 + accelerationIncludingGravity.z ** 2) : 9.8;

        // Rotation Rate (Spin)
        const spinMag = rotationRate ? Math.sqrt(rotationRate.alpha ** 2 + rotationRate.beta ** 2 + rotationRate.gamma ** 2) : 0;

        // 2. Logic Gates
        let eventTitle = "";
        let eventBody = "";
        let detected = false;

        // A. Severe Crash (High Impact)
        if (impactMag > IMPACT_THRESHOLD) {
            eventTitle = "CRASH DETECTED";
            eventBody = `High impact force of ${impactMag.toFixed(1)}g detected. Initiating emergency protocols.`;
            detected = true;
        }
        // B. Free Fall (Downfall)
        // Note: gravityMag is usually ~1.0g (normalized) or ~9.8m/s^2 depending on library. 
        // Expo docs: accelerationIncludingGravity is in g (1g = 9.8m/s^2). Normal stationary = 1g.
        else if (gravityMag < FREE_FALL_THRESHOLD) {
            eventTitle = "FREE FALL DETECTED";
            eventBody = "Device is in free fall. Brace for impact.";
            detected = true;
        }
        // C. Violent Spin (Rollover/Tumble)
        else if (spinMag > SPIN_THRESHOLD) {
            eventTitle = "ROLLOVER DETECTED";
            eventBody = "Violent tumbling motion detected.";
            detected = true;
        }
        // D. Composite (Moderate Impact + Moderate Spin)
        else if (impactMag > 2.5 && spinMag > 4.0) {
            eventTitle = "ACCIDENT DETECTED";
            eventBody = "Simultaneous impact and spin detected.";
            detected = true;
        }

        if (detected) {
            setIsAlerting(true);
            triggerNotification(eventTitle, eventBody);
            setLastEvent(`${eventTitle} at ${new Date().toLocaleTimeString()}`);

            // Stop alerting after 5 seconds to prevent spam, allowing new alerts
            setTimeout(() => setIsAlerting(false), 5000);
        }
    };

    const triggerNotification = async (title: string, body: string) => {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: null, // Immediate
        });
    };

    const startMonitoring = () => setIsMonitoring(true);
    const stopMonitoring = () => setIsMonitoring(false);

    async function registerForPushNotificationsAsync() {
        try {
            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'default',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF231F7C',
                });
            }
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== 'granted') {
                console.log('Permission not granted for notifications');
            }
        } catch (error) {
            console.log('Notification registration failed (likely Expo Go limitation):', error);
        }
    }

    return (
        <CrashDetectionContext.Provider
            value={{
                isMonitoring,
                startMonitoring,
                stopMonitoring,
                lastEvent,
                sensorData,
            }}
        >
            {children}
        </CrashDetectionContext.Provider>
    );
};

export const useCrashDetection = () => useContext(CrashDetectionContext);

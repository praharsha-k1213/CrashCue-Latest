import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = '3001';
const API_PATH = '/api';

const getBaseUrl = () => {
    // 1. Try to get the dynamic IP from Expo Constants (Best for Physical Devices via LAN)
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
        const ip = hostUri.split(':')[0];
        // Ensure we don't pick up localhost if hostUri is somehow localhost (unlikely on LAN)
        if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
            return `http://${ip}:${API_PORT}${API_PATH}`;
        }
    }

    // 2. Fallbacks
    if (Platform.OS === 'android') {
        // Use 10.0.2.2 for Android Emulator to access host localhost
        return `http://10.0.2.2:${API_PORT}${API_PATH}`;
    }

    // 3. Default for iOS Simulator and Web
    return `http://localhost:${API_PORT}${API_PATH}`;
};

export const API_BASE_URL = getBaseUrl();

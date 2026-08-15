import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

// Widget Task Handler Registration
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { widgetTaskHandler } from '../widget/widget-task-handler';
registerWidgetTaskHandler(widgetTaskHandler);

import { AuthProvider, useAuth } from '../context/AuthContext';
import { CrashDetectionProvider } from '../context/CrashDetectionContext';
import { SpeedHistoryProvider } from '../context/SpeedHistoryContext';
import { ThemeProvider } from '../context/ThemeContext';
import { LocalStoreProvider } from '../store/LocalStore';
import '../tasks/backgroundLocationTask'; // Headless Task Registration

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const PERMISSIONS_DONE_KEY = 'CRASHCUE_PERMISSIONS_DONE';
const CONTACTS_SETUP_DONE_KEY = 'CRASHCUE_CONTACTS_SETUP_DONE';

function RootLayoutContent() {
    const { user, userProfile, isLoading } = useAuth();
    const [fontsLoaded] = useFonts({
        SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    });
    const router = useRouter();
    const segments = useSegments();
    const [permissionsChecked, setPermissionsChecked] = useState(false);
    const [permissionsDone, setPermissionsDone] = useState(false);
    const [contactsSetupDone, setContactsSetupDone] = useState(false);
    const [contactsChecked, setContactsChecked] = useState(false);

    useEffect(() => {
        if (fontsLoaded && !isLoading) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded, isLoading]);

    // Single merged effect: read fresh flags from AsyncStorage, THEN decide routing.
    // This eliminates the race where routing runs with stale in-memory flags.
    useEffect(() => {
        if (isLoading || !fontsLoaded) return;

        const run = async () => {
            // Always read fresh from AsyncStorage on every navigation
            const [permDone, contactsDone] = await Promise.all([
                AsyncStorage.getItem(PERMISSIONS_DONE_KEY),
                AsyncStorage.getItem(CONTACTS_SETUP_DONE_KEY),
            ]);
            const permissionsGranted = permDone === 'true';
            const contactsSetupComplete = contactsDone === 'true';

            // Keep in-sync so any UI that reads these states is also up to date
            setPermissionsDone(permissionsGranted);
            setContactsSetupDone(contactsSetupComplete);
            setPermissionsChecked(true);
            setContactsChecked(true);

            const inAuthGroup = segments[0] === 'auth' || segments[0] === 'database-viewer';
            const inOnboarding = segments[0] === 'onboarding';
            const inPermissions = segments[0] === 'permissions';
            const inSetupContacts = segments[0] === 'setup-contacts';

            // 1. First-install: show permissions before login
            if (!permissionsGranted && !inPermissions) {
                router.replace('/permissions');
                return;
            }

            // 2. Not logged in → go to login (once permissions are done)
            if (!user && !inAuthGroup && !inPermissions) {
                router.replace('/auth/login');
                return;
            }

            // 3. Logged-in user flows
            if (user && userProfile) {
                // 3a. After first login → contacts setup (once)
                if (!contactsSetupComplete && !inSetupContacts && !inAuthGroup) {
                    router.replace('/setup-contacts');
                    return;
                }

                // 3b. Contacts done → onboarding (new users only)
                if (!userProfile.isOnboarded && !inOnboarding && !inSetupContacts) {
                    router.replace('/onboarding');
                    return;
                }

                // 3c. Fully onboarded → redirect away from auth/onboarding screens
                if (userProfile.isOnboarded && (inAuthGroup || inOnboarding)) {
                    router.replace('/(tabs)');
                }
            } else if (user && inAuthGroup) {
                console.log('⏳ Waiting for user profile to load...');
            }
        };

        run();
    }, [user, userProfile, isLoading, fontsLoaded, segments]);

    if (!fontsLoaded || isLoading) {
        return null; // Keep splash screen visible
    }

    return (
        <Stack>
            <Stack.Screen name="permissions" options={{ headerShown: false, animation: 'fade' }} />
            <Stack.Screen name="setup-contacts" options={{ headerShown: false, animation: 'slide_from_right' }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="database-viewer" options={{ headerShown: false }} />
            <Stack.Screen name="alerts" options={{ headerShown: false }} />
            <Stack.Screen name="alert-details" options={{ headerShown: false }} />
            <Stack.Screen name="sos" options={{ headerShown: false }} />
            <Stack.Screen name="emergency-active" options={{ headerShown: false }} />
            <Stack.Screen name="emergency-contacts" options={{ headerShown: false }} />
            <Stack.Screen name="user" options={{ headerShown: false }} />
            <Stack.Screen name="locked" options={{ headerShown: false }} />
            <Stack.Screen name="performance-analytics" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
        </Stack>
    );
}

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <ThemeProvider>
                <AuthProvider>
                    <CrashDetectionProvider>
                        <SpeedHistoryProvider>
                            <LocalStoreProvider>
                                <RootLayoutContent />
                                <StatusBar style="light" />
                            </LocalStoreProvider>
                        </SpeedHistoryProvider>
                    </CrashDetectionProvider>
                </AuthProvider>
            </ThemeProvider>
        </GestureHandlerRootView>
    );
}

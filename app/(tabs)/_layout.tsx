import { CustomTabBar } from '@/components/CustomTabBar';
import { ExpandableTabBar } from '@/components/ExpandableTabBar';
import { Tabs } from 'expo-router';
import React from 'react';
import { Dimensions } from 'react-native';
import { useLocalStore } from '../../store/LocalStore';
import { useSpeedHistory } from '../../context/SpeedHistoryContext';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function TabLayout() {
    const { navStyle } = useLocalStore();
    const { crashDetected } = useSpeedHistory();
    const router = useRouter();

    React.useEffect(() => {
        if (crashDetected) {
            router.push('/sos');
        }
    }, [crashDetected]);

    return (
        <Tabs
            initialRouteName="index"
            tabBar={(props) => navStyle === 'classic' ? <CustomTabBar {...props} /> : <ExpandableTabBar {...props} />}
            screenOptions={{
                headerShown: false,
                tabBarHideOnKeyboard: true,
                // Ensure content goes behind the floating bar
                sceneStyle: { backgroundColor: 'transparent' },
            }}
        >
            <Tabs.Screen name="modes" options={{ title: 'Driving Mode' }} />
            <Tabs.Screen name="index" options={{ title: 'Home' }} />
            <Tabs.Screen name="history" options={{ title: 'History' }} />
            <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
        </Tabs>
    );
}

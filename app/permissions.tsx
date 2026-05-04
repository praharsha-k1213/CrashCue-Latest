import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as Contacts from 'expo-contacts';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PERMISSIONS_DONE_KEY = 'CRASHCUE_PERMISSIONS_DONE';

interface PermissionItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  required: boolean;
  status: 'pending' | 'granted' | 'denied';
}

export default function PermissionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [isRequesting, setIsRequesting] = useState(false);
  const [allDone, setAllDone] = useState(false);

  const [permissions, setPermissions] = useState<PermissionItem[]>([
    {
      id: 'location',
      icon: 'location',
      title: 'Location Access',
      description: 'Track your speed and detect crashes in real-time using GPS.',
      required: true,
      status: 'pending',
    },
    {
      id: 'background_location',
      icon: 'navigate',
      title: 'Background Location',
      description: 'Detect crashes even when the app is not in the foreground.',
      required: true,
      status: 'pending',
    },
    {
      id: 'camera',
      icon: 'flashlight',
      title: 'Camera & Flash',
      description: 'Activate the strobe flashlight during an SOS emergency.',
      required: false,
      status: 'pending',
    },
    {
      id: 'notifications',
      icon: 'notifications',
      title: 'Notifications',
      description: 'Receive crash alerts and emergency status updates.',
      required: false,
      status: 'pending',
    },
    {
      id: 'contacts',
      icon: 'people',
      title: 'Contacts Access',
      description: 'Easily select your SOS emergency contacts directly from your address book.',
      required: false,
      status: 'pending',
    },
  ]);

  const glowValue = useSharedValue(0.7);

  useEffect(() => {
    glowValue.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0.7, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowValue.value,
  }));

  const updatePermissionStatus = (id: string, status: 'granted' | 'denied') => {
    setPermissions(prev =>
      prev.map(p => (p.id === id ? { ...p, status } : p))
    );
  };

  const requestAllPermissions = async () => {
    setIsRequesting(true);

    try {
      // 1. Foreground Location
      const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
      updatePermissionStatus('location', fgStatus === 'granted' ? 'granted' : 'denied');

      // 2. Background Location (only after foreground is granted)
      if (fgStatus === 'granted') {
        const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
        updatePermissionStatus('background_location', bgStatus === 'granted' ? 'granted' : 'denied');

        if (bgStatus !== 'granted') {
          Alert.alert(
            'Background Location Needed',
            'To detect crashes when the screen is off, please select "Allow all the time" in the next settings screen.',
            [
              {
                text: 'Open Settings',
                onPress: () => Linking.openSettings(),
              },
              { text: 'Skip for now', style: 'cancel' },
            ]
          );
        }
      }

      // 3. Camera
      const camResult = await requestCameraPermission();
      updatePermissionStatus('camera', camResult.granted ? 'granted' : 'denied');

      // 4. Notifications
      const { status: notifStatus } = await Notifications.requestPermissionsAsync();
      updatePermissionStatus('notifications', notifStatus === 'granted' ? 'granted' : 'denied');

      // 5. Contacts
      const { status: contactStatus } = await Contacts.requestPermissionsAsync();
      updatePermissionStatus('contacts', contactStatus === 'granted' ? 'granted' : 'denied');

    } catch (e) {
      console.log('Permission request error:', e);
    }

    setIsRequesting(false);
    setAllDone(true);
  };

  const handleContinue = async () => {
    await AsyncStorage.setItem(PERMISSIONS_DONE_KEY, 'true');
    router.replace('/auth/login');
  };

  const getStatusColor = (status: string) => {
    if (status === 'granted') return '#10B981';
    if (status === 'denied') return '#EF4444';
    return '#6366F1';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'granted') return 'checkmark-circle';
    if (status === 'denied') return 'close-circle';
    return 'ellipse-outline';
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0F' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />
      <LinearGradient
        colors={['#0D0B2A', '#0A0A0F', '#0A0A0F']}
        style={{ position: 'absolute', inset: 0 }}
      />

      <ScrollView
        contentContainerStyle={{
          paddingTop: Math.max(insets.top + 20, 60),
          paddingBottom: Math.max(insets.bottom + 20, 40),
          paddingHorizontal: 24,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInUp.duration(700)} style={{ alignItems: 'center', marginBottom: 40 }}>
          <Animated.View
            style={[
              {
                width: 90,
                height: 90,
                borderRadius: 45,
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
                borderWidth: 1,
                borderColor: 'rgba(99, 102, 241, 0.3)',
              },
              glowStyle,
            ]}
          >
            <Ionicons name="shield-checkmark" size={44} color="#6366F1" />
          </Animated.View>

          <Text
            style={{
              fontSize: 28,
              fontWeight: '900',
              color: '#FFFFFF',
              textAlign: 'center',
              marginBottom: 10,
              letterSpacing: 0.5,
            }}
          >
            App Permissions
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: 'rgba(255,255,255,0.55)',
              textAlign: 'center',
              lineHeight: 22,
              maxWidth: 300,
            }}
          >
            CrashCue needs the following permissions to protect you on every trip.
          </Text>
        </Animated.View>

        {/* Permission List */}
        {permissions.map((item, index) => (
          <Animated.View
            key={item.id}
            entering={FadeInDown.delay(index * 100).duration(600)}
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderRadius: 20,
              padding: 18,
              marginBottom: 14,
              borderWidth: 1,
              borderColor:
                item.status === 'granted'
                  ? 'rgba(16,185,129,0.3)'
                  : item.status === 'denied'
                  ? 'rgba(239,68,68,0.3)'
                  : 'rgba(255,255,255,0.08)',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            {/* Icon */}
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                backgroundColor: `${getStatusColor(item.status)}22`,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16,
                flexShrink: 0,
              }}
            >
              <Ionicons
                name={item.icon as any}
                size={22}
                color={getStatusColor(item.status)}
              />
            </View>

            {/* Text */}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontWeight: '700',
                    fontSize: 15,
                    marginRight: 8,
                  }}
                >
                  {item.title}
                </Text>
                {item.required && (
                  <View
                    style={{
                      backgroundColor: 'rgba(99,102,241,0.2)',
                      borderRadius: 6,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                    }}
                  >
                    <Text style={{ color: '#818CF8', fontSize: 10, fontWeight: '700' }}>
                      REQUIRED
                    </Text>
                  </View>
                )}
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 19 }}>
                {item.description}
              </Text>
            </View>

            {/* Status */}
            <Ionicons
              name={getStatusIcon(item.status) as any}
              size={22}
              color={getStatusColor(item.status)}
              style={{ marginLeft: 12, flexShrink: 0 }}
            />
          </Animated.View>
        ))}

        <View style={{ height: 16 }} />

        {/* Info note */}
        <Animated.View
          entering={FadeInDown.delay(500).duration(600)}
          style={{
            backgroundColor: 'rgba(99,102,241,0.08)',
            borderRadius: 16,
            padding: 16,
            marginBottom: 28,
            flexDirection: 'row',
            alignItems: 'flex-start',
            borderWidth: 1,
            borderColor: 'rgba(99,102,241,0.15)',
          }}
        >
          <Ionicons name="information-circle" size={20} color="#818CF8" style={{ marginRight: 10, marginTop: 1 }} />
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 19, flex: 1 }}>
            Your location data is only used locally for crash detection and speed tracking. We never share your data with third parties.
          </Text>
        </Animated.View>

        {/* Primary Button */}
        {!allDone ? (
          <Animated.View entering={FadeInDown.delay(600).duration(600)}>
            <TouchableOpacity
              onPress={requestAllPermissions}
              disabled={isRequesting}
              style={{
                backgroundColor: '#6366F1',
                borderRadius: 18,
                paddingVertical: 18,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                opacity: isRequesting ? 0.7 : 1,
                shadowColor: '#6366F1',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.4,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <Ionicons name="shield-checkmark" size={20} color="white" style={{ marginRight: 10 }} />
              <Text style={{ color: 'white', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 }}>
                {isRequesting ? 'Requesting Permissions...' : 'Grant Permissions'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.duration(500)}>
            <TouchableOpacity
              onPress={handleContinue}
              style={{
                backgroundColor: '#10B981',
                borderRadius: 18,
                paddingVertical: 18,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                shadowColor: '#10B981',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.4,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <Ionicons name="arrow-forward-circle" size={20} color="white" style={{ marginRight: 10 }} />
              <Text style={{ color: 'white', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 }}>
                Continue to Login
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Skip */}
        {!allDone && (
          <TouchableOpacity
            onPress={handleContinue}
            style={{ marginTop: 16, alignItems: 'center', paddingVertical: 8 }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: '600' }}>
              Skip for now (some features may not work)
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

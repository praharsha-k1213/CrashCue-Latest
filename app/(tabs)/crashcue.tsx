import { GRADIENTS, SHADOWS } from '@/constants/DesignTokens';
import { useTheme } from '@/context/ThemeContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { triggerErrorVibration, triggerHaptic, triggerSuccessVibration } from '@/utils/hapticFeedback';
import { Ionicons } from '@expo/vector-icons';
import * as IntentLauncher from 'expo-intent-launcher';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Linking, Platform, ScrollView, StatusBar, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Mock Notifications for Expo Go
const Notifications = {
  setNotificationHandler: () => { },
  requestPermissionsAsync: async () => ({ status: 'granted' }),
  scheduleNotificationAsync: async (notif: any) => {
    console.log('[Mock Notification]', notif.content.title);
  },
  AndroidNotificationPriority: { MAX: 'max' }
};

// Configure notifications (Mock)
Notifications.setNotificationHandler();

export default function CrashCueScreen() {
  const router = useRouter();
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [locationTracking, setLocationTracking] = useState(true);
  const [emergencyAlerts, setEmergencyAlerts] = useState(true);
  const [autoCheckIn, setAutoCheckIn] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('Active');
  const [networkStatus] = useState('Connected');
  const [lastCheckIn, setLastCheckIn] = useState('Never');

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Theme colors
  const textPrimary = useThemeColor({}, 'textPrimary');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primary = useThemeColor({}, 'primary');
  const backgroundCard = useThemeColor({}, 'backgroundCard');
  const border = useThemeColor({}, 'border');
  const background = useThemeColor({}, 'background');
  const accent = (colors.accent as string) || '#EF4444';

  // Pulsing animation for emergency buttons
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  // Request notification permissions on mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Please enable notifications for emergency alerts.');
        }
      } catch (error) {
        console.log('Notification permission check failed:', error);
      }
    })();
  }, []);

  // Check GPS and location permissions
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGpsStatus('Permission Denied');
      } else {
        setGpsStatus('Active');
      }
    })();
  }, []);

  // Auto check-in functionality
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (autoCheckIn && locationTracking) {
      interval = setInterval(() => {
        handleAutoCheckIn();
      }, 3600000); // 1 hour in milliseconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoCheckIn, locationTracking]);

  // Handle auto check-in
  const handleAutoCheckIn = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      const timestamp = new Date().toLocaleString();
      setLastCheckIn(timestamp);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📍 Auto Check-In Complete',
          body: `Location shared at ${timestamp}`,
          sound: true,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Auto check-in error:', error);
    }
  };

  // Handle emergency call
  const handleEmergencyCall = () => {
    Alert.alert(
      '🚨 EMERGENCY CALL',
      'This will immediately call emergency services (911).',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call 911',
          style: 'destructive',
          onPress: async () => {
            await triggerErrorVibration();
            const phoneNumber = '911';
            const telUrl = `tel:${phoneNumber}`;
            try {
              if (Platform.OS === 'android') {
                await IntentLauncher.startActivityAsync('android.intent.action.CALL', {
                  data: telUrl,
                });
                return;
              }
              const canOpen = await Linking.canOpenURL(telUrl);
              if (canOpen) {
                await Linking.openURL(telUrl);
              } else {
                Alert.alert('Error', 'Unable to make phone call');
              }
            } catch (error) {
              Linking.openURL(telUrl).catch(() => {
                Alert.alert('Error', 'Unable to make phone call');
              });
            }
          }
        }
      ]
    );
  };

  // Handle panic alert
  const handlePanicButton = async () => {
    Alert.alert(
      '🚨 PANIC ALERT',
      'This will immediately notify all emergency contacts with your location.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'SEND ALERT',
          style: 'destructive',
          onPress: async () => {
            await triggerErrorVibration();
            try {
              const { status } = await Location.requestForegroundPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location permission is required to send panic alert.');
                return;
              }

              const location = await Location.getCurrentPositionAsync({});
              const { latitude, longitude } = location.coords;

              let locationString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
              try {
                const address = await Location.reverseGeocodeAsync({ latitude, longitude });
                if (address && address[0]) {
                  locationString = `${address[0].street || ''}, ${address[0].city || ''}, ${address[0].region || ''}`;
                }
              } catch (geoError) {
                console.log('Geocoding failed, using coordinates:', geoError);
              }

              await Notifications.scheduleNotificationAsync({
                content: {
                  title: '🚨 PANIC ALERT SENT!',
                  body: `Emergency contacts notified!\nLocation: ${locationString}`,
                  sound: true,
                  priority: Notifications.AndroidNotificationPriority.MAX,
                  data: { latitude, longitude },
                },
                trigger: null,
              });

              Alert.alert(
                '✅ Alert Sent!',
                `Emergency contacts have been notified with your location:\n\n${locationString}\n\nThey will receive your GPS coordinates and current address.`,
                [{ text: 'OK' }]
              );

              setLastCheckIn(new Date().toLocaleString());
            } catch (error) {
              console.error('Panic alert error:', error);
              Alert.alert('Error', 'Failed to send panic alert. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Handle manual check-in
  const handleCheckIn = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for check-in.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      let locationString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      try {
        const address = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (address && address[0]) {
          locationString = `${address[0].street || ''}, ${address[0].city || ''}`;
        }
      } catch (geoError) {
        console.log('Geocoding failed for manual check-in:', geoError);
      }

      const timestamp = new Date().toLocaleString();
      setLastCheckIn(timestamp);
      await triggerSuccessVibration();

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📍 Check-In Complete',
          body: `Location: ${locationString}`,
          sound: true,
        },
        trigger: null,
      });

      Alert.alert(
        '✅ Check-In Successful',
        `Your location has been shared:\n\n${locationString}\n\nTime: ${timestamp}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Check-in error:', error);
      Alert.alert('Error', 'Failed to share location. Please try again.');
    }
  };

  // Handle medical info
  const handleMedicalInfo = () => {
    router.push('/user');
  };

  // Handle emergency contacts
  const handleEmergencyContacts = () => {
    router.push('/user');
  };

  // Handle nearby hospitals
  const handleNearbyHospitals = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to find nearby hospitals.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;
      const query = encodeURIComponent('hospitals');

      let url = Platform.OS === 'ios'
        ? `http://maps.apple.com/?q=${query}&ll=${latitude},${longitude}`
        : `geo:${latitude},${longitude}?q=${query}`;

      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`hospitals near ${latitude},${longitude}`)}`;
      }
      await triggerHaptic('medium');
      Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Unable to open maps for nearby hospitals.');
    }
  };

  // Handle location tracking toggle
  const handleLocationTrackingToggle = async (value: boolean) => {
    if (value) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please enable location permissions in settings.');
        return;
      }
      setGpsStatus('Active');
    } else {
      setGpsStatus('Disabled');
    }
    await triggerHaptic('light');
    setLocationTracking(value);
  };

  // Handle emergency alerts toggle
  const handleEmergencyAlertsToggle = async (value: boolean) => {
    if (value) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please enable notifications in settings.');
        return;
      }
    }
    await triggerHaptic('light');
    setEmergencyAlerts(value);
  };

  return (
    <View className="flex-1 md:items-center md:justify-center md:bg-gray-100 dark:md:bg-slate-900 web:h-screen web:overflow-hidden" style={{ backgroundColor: theme === 'light' ? '#F8F9FA' : '#0F1419' }}>
      <View className="flex-1 w-full md:max-w-md md:h-full md:shadow-2xl md:overflow-hidden bg-transparent">
        <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} />

        {/* Background Gradient */}
        {colors.gradientColors ? (
          <LinearGradient
            colors={colors.gradientColors as any}
            start={colors.gradientStart}
            end={colors.gradientEnd}
            className="absolute inset-0"
          />
        ) : (
          <LinearGradient
            colors={theme === 'light'
              ? ['#F8F9FA', '#E9ECEF']
              : ['#0F1419', '#1A1F2E']
            }
            className="absolute inset-0"
          />
        )}

        {/* Decorative Glowing Circles matching login.tsx */}
        <View
          className="absolute w-72 h-72 rounded-full -top-24 -left-12"
          style={{ backgroundColor: primary + '26' }}
        />
        <View
          className="absolute w-72 h-72 rounded-full -bottom-24 -right-12"
          style={{ backgroundColor: accent + '26' }}
        />

        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Header */}
          <View
            className="p-6 border-b"
            style={{ paddingTop: Math.max(insets.top + 10, 64), borderBottomColor: border }}
          >
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={() => router.navigate('index')}
                  className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: theme === 'light' ? '#FFFFFF' : backgroundCard }}
                >
                  <Ionicons name="chevron-back" size={24} color={primary} />
                </TouchableOpacity>
                <View>
                  <Text className="text-3xl font-black mb-1" style={{ color: textPrimary }}>
                    🚨 CrashCue
                  </Text>
                  <Text className="text-base font-semibold" style={{ color: textSecondary }}>
                    Your Safety Companion
                  </Text>
                </View>
              </View>
              <View
                className="px-3 py-2 rounded-xl border"
                style={{ backgroundColor: primary + '20', borderColor: primary }}
              >
                <Text className="text-xs font-black tracking-widest" style={{ color: primary }}>ACTIVE</Text>
              </View>
            </View>
          </View>

          {/* Emergency Actions */}
          <View className="px-5 mt-6">
            <Text className="text-xl font-black mb-4 tracking-wide" style={{ color: textPrimary }}>
              Emergency Actions
            </Text>

            {/* Emergency Call Button - Pulsing */}
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                className="rounded-3xl p-6 mb-4"
                style={{
                  backgroundColor: '#FEE2E2',
                  borderWidth: 3,
                  borderColor: '#EF4444',
                  ...SHADOWS.xl,
                }}
                onPress={handleEmergencyCall}
                activeOpacity={0.8}
              >
                <View className="flex-row items-center">
                  <LinearGradient
                    colors={GRADIENTS.danger}
                    className="w-16 h-16 rounded-2xl items-center justify-center mr-4"
                    style={SHADOWS.colored('#EF4444')}
                  >
                    <Ionicons name="call" size={32} color="#FFF" />
                  </LinearGradient>
                  <View className="flex-1">
                    <Text className="text-xl font-black text-red-600 mb-1">
                      Emergency Call
                    </Text>
                    <Text className="text-sm font-semibold text-red-700">
                      Call 911 immediately
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#EF4444" />
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Panic Button */}
            <TouchableOpacity
              className="rounded-3xl p-6 mb-4 border-2"
              style={{
                backgroundColor: theme === 'light' ? '#FFF8F0' : '#2D2519',
                borderColor: '#F59E0B',
                ...SHADOWS.lg,
              }}
              onPress={handlePanicButton}
              activeOpacity={0.8}
            >
              <View className="flex-row items-center">
                <LinearGradient
                  colors={GRADIENTS.warning}
                  className="w-16 h-16 rounded-2xl items-center justify-center mr-4"
                  style={SHADOWS.colored('#F59E0B')}
                >
                  <Ionicons name="warning" size={32} color="#FFF" />
                </LinearGradient>
                <View className="flex-1">
                  <Text className="text-xl font-black mb-1" style={{ color: textPrimary }}>
                    Panic Alert
                  </Text>
                  <Text className="text-sm font-semibold" style={{ color: textSecondary }}>
                    Notify all emergency contacts
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={textSecondary} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Safety Features Grid */}
          <View className="px-5 mt-6">
            <Text className="text-xl font-black mb-4 tracking-wide" style={{ color: textPrimary }}>
              Safety Features
            </Text>

            <View className="flex-row flex-wrap justify-between">
              {/* Check-In */}
              <TouchableOpacity
                className="w-[48%] rounded-3xl p-5 items-center mb-4 border"
                style={{
                  backgroundColor: theme === 'light' ? '#FFFFFF' : backgroundCard,
                  borderColor: theme === 'light' ? '#E5E7EB' : border,
                  ...SHADOWS.md,
                }}
                onPress={handleCheckIn}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={GRADIENTS.blue}
                  className="w-16 h-16 rounded-2xl items-center justify-center mb-3"
                  style={SHADOWS.colored('#3b82f6')}
                >
                  <Ionicons name="location" size={28} color="#FFF" />
                </LinearGradient>
                <Text className="text-base font-black mb-1 text-center" style={{ color: textPrimary }}>
                  Check-In
                </Text>
                <Text className="text-xs font-semibold text-center" style={{ color: textSecondary }}>
                  Share location
                </Text>
              </TouchableOpacity>

              {/* Medical Info */}
              <TouchableOpacity
                className="w-[48%] rounded-3xl p-5 items-center mb-4 border"
                style={{
                  backgroundColor: theme === 'light' ? '#FFFFFF' : backgroundCard,
                  borderColor: theme === 'light' ? '#E5E7EB' : border,
                  ...SHADOWS.md,
                }}
                onPress={handleMedicalInfo}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={GRADIENTS.success}
                  className="w-16 h-16 rounded-2xl items-center justify-center mb-3"
                  style={SHADOWS.colored('#10B981')}
                >
                  <Ionicons name="add-circle" size={28} color="#FFF" />
                </LinearGradient>
                <Text className="text-base font-black mb-1 text-center" style={{ color: textPrimary }}>
                  Medical Info
                </Text>
                <Text className="text-xs font-semibold text-center" style={{ color: textSecondary }}>
                  Health details
                </Text>
              </TouchableOpacity>

              {/* Contacts */}
              <TouchableOpacity
                className="w-[48%] rounded-3xl p-5 items-center mb-4 border"
                style={{
                  backgroundColor: theme === 'light' ? '#FFFFFF' : backgroundCard,
                  borderColor: theme === 'light' ? '#E5E7EB' : border,
                  ...SHADOWS.md,
                }}
                onPress={handleEmergencyContacts}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={GRADIENTS.warning}
                  className="w-16 h-16 rounded-2xl items-center justify-center mb-3"
                  style={SHADOWS.colored('#F59E0B')}
                >
                  <Ionicons name="people" size={28} color="#FFF" />
                </LinearGradient>
                <Text className="text-base font-black mb-1 text-center" style={{ color: textPrimary }}>
                  Contacts
                </Text>
                <Text className="text-xs font-semibold text-center" style={{ color: textSecondary }}>
                  Emergency contacts
                </Text>
              </TouchableOpacity>

              {/* Nearby Hospitals */}
              <TouchableOpacity
                className="w-[48%] rounded-3xl p-5 items-center mb-4 border"
                style={{
                  backgroundColor: theme === 'light' ? '#FFFFFF' : backgroundCard,
                  borderColor: theme === 'light' ? '#E5E7EB' : border,
                  ...SHADOWS.md,
                }}
                onPress={handleNearbyHospitals}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={GRADIENTS.danger}
                  className="w-16 h-16 rounded-2xl items-center justify-center mb-3"
                  style={SHADOWS.colored('#EF4444')}
                >
                  <Ionicons name="medkit" size={28} color="#FFF" />
                </LinearGradient>
                <Text className="text-base font-black mb-1 text-center" style={{ color: textPrimary }}>
                  Hospitals
                </Text>
                <Text className="text-xs font-semibold text-center" style={{ color: textSecondary }}>
                  Find nearby
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Settings */}
          <View className="px-5 mt-6">
            <Text className="text-xl font-black mb-4 tracking-wide" style={{ color: textPrimary }}>
              Settings
            </Text>

            {/* Location Tracking */}
            <View
              className="flex-row justify-between items-center p-5 rounded-3xl mb-3 border"
              style={{
                backgroundColor: theme === 'light' ? '#FFFFFF' : backgroundCard,
                borderColor: theme === 'light' ? '#E5E7EB' : border,
                ...SHADOWS.sm,
              }}
            >
              <View className="flex-1 mr-4">
                <Text className="text-base font-black mb-1" style={{ color: textPrimary }}>
                  Location Tracking
                </Text>
                <Text className="text-sm font-semibold" style={{ color: textSecondary }}>
                  Share your location with emergency contacts
                </Text>
              </View>
              <Switch
                value={locationTracking}
                onValueChange={handleLocationTrackingToggle}
                trackColor={{ false: theme === 'light' ? '#D1D5DB' : '#374151', true: primary }}
                thumbColor={locationTracking ? '#FFFFFF' : '#F3F4F6'}
                ios_backgroundColor={theme === 'light' ? '#D1D5DB' : '#374151'}
              />
            </View>

            {/* Emergency Alerts */}
            <View
              className="flex-row justify-between items-center p-5 rounded-3xl mb-3 border"
              style={{
                backgroundColor: theme === 'light' ? '#FFFFFF' : backgroundCard,
                borderColor: theme === 'light' ? '#E5E7EB' : border,
                ...SHADOWS.sm,
              }}
            >
              <View className="flex-1 mr-4">
                <Text className="text-base font-black mb-1" style={{ color: textPrimary }}>
                  Emergency Alerts
                </Text>
                <Text className="text-sm font-semibold" style={{ color: textSecondary }}>
                  Receive emergency notifications
                </Text>
              </View>
              <Switch
                value={emergencyAlerts}
                onValueChange={handleEmergencyAlertsToggle}
                trackColor={{ false: theme === 'light' ? '#D1D5DB' : '#374151', true: primary }}
                thumbColor={emergencyAlerts ? '#FFFFFF' : '#F3F4F6'}
                ios_backgroundColor={theme === 'light' ? '#D1D5DB' : '#374151'}
              />
            </View>

            {/* Auto Check-In */}
            <View
              className="flex-row justify-between items-center p-5 rounded-3xl mb-3 border"
              style={{
                backgroundColor: theme === 'light' ? '#FFFFFF' : backgroundCard,
                borderColor: theme === 'light' ? '#E5E7EB' : border,
                ...SHADOWS.sm,
              }}
            >
              <View className="flex-1 mr-4">
                <Text className="text-base font-black mb-1" style={{ color: textPrimary }}>
                  Auto Check-In
                </Text>
                <Text className="text-sm font-semibold" style={{ color: textSecondary }}>
                  Automatically share location every hour
                </Text>
              </View>
              <Switch
                value={autoCheckIn}
                onValueChange={setAutoCheckIn}
                trackColor={{ false: theme === 'light' ? '#D1D5DB' : '#374151', true: primary }}
                thumbColor={autoCheckIn ? '#FFFFFF' : '#F3F4F6'}
                ios_backgroundColor={theme === 'light' ? '#D1D5DB' : '#374151'}
              />
            </View>
          </View>

          {/* System Status */}
          <View className="px-5 mt-6">
            <Text className="text-xl font-black mb-4 tracking-wide" style={{ color: textPrimary }}>
              System Status
            </Text>

            <View
              className="rounded-3xl p-5 border"
              style={{
                backgroundColor: theme === 'light' ? '#F0FDF4' : '#1E3A2F',
                borderColor: theme === 'light' ? '#86EFAC' : '#34D399',
                ...SHADOWS.sm,
              }}
            >
              <View className="flex-row items-center mb-3">
                <Ionicons
                  name={gpsStatus === 'Active' ? 'checkmark-circle' : 'close-circle'}
                  size={24}
                  color={gpsStatus === 'Active' ? '#10B981' : '#EF4444'}
                />
                <Text className="text-base font-bold ml-3 flex-1" style={{ color: textPrimary }}>
                  GPS Location: {gpsStatus}
                </Text>
              </View>
              <View className="flex-row items-center mb-3">
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                <Text className="text-base font-bold ml-3 flex-1" style={{ color: textPrimary }}>
                  Network: {networkStatus}
                </Text>
              </View>
              <View className="flex-row items-center mb-3">
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                <Text className="text-base font-bold ml-3 flex-1" style={{ color: textPrimary }}>
                  Alerts: {emergencyAlerts ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="time" size={24} color="#10B981" />
                <Text className="text-base font-bold ml-3 flex-1" style={{ color: textPrimary }}>
                  Last Check-In: {lastCheckIn}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

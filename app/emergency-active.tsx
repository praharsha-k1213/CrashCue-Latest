import { Ionicons } from '@expo/vector-icons'; // Added missing import
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, Platform, ScrollView, StatusBar, Text, TouchableOpacity, View, Linking } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useTimeBattery } from '../hooks/useTimeBattery';
import { useLocalStore } from '../store/LocalStore';
import { useSpeedHistory } from '../context/SpeedHistoryContext';
import { makeEmergencyCall, sendEmergencySMS, sendEmergencyWhatsApp } from '../services/twilioService';

const { width } = Dimensions.get('window');

export default function EmergencyActiveScreen() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);
  const { timeString } = useTimeBattery();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { userNumbers, userProfile, doctor } = useLocalStore();
  const { currentLocation } = useSpeedHistory();
  const [alertsSent, setAlertsSent] = useState(false);

  const pulseValue = useSharedValue(1);

  useEffect(() => {
    pulseValue.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 600 }),
        withTiming(1, { duration: 600 })
      ),
      -1,
      true
    );

    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    // Auto trigger Twilio (contacts + doctor)
    if (!alertsSent && ((userNumbers && userNumbers.length > 0) || (userProfile?.name && doctor?.phone)) && currentLocation) {
      setAlertsSent(true);
      const userName = userProfile?.name || 'A user';

      // Combine emergency contacts + doctor into one list
      const allContacts: { name: string; phone: string }[] = [...(userNumbers || [])];
      if (doctor?.name && doctor?.phone) {
        allContacts.push({ name: doctor.name, phone: doctor.phone });
      }

      allContacts.forEach((contact) => {
        const raw = contact.phone.replace(/[\s\-\(\)]/g, '');
        const formattedNumber = raw.startsWith('+') ? raw : raw.startsWith('91') && raw.length > 10 ? `+${raw}` : `+91${raw}`;

        makeEmergencyCall({
          toPhoneNumber: formattedNumber,
          userName: userName,
          location: currentLocation,
        }).catch(console.error);

        sendEmergencySMS({
          toPhoneNumber: formattedNumber,
          userName: userName,
          location: currentLocation,
        }).catch(console.error);

        sendEmergencyWhatsApp({
          toPhoneNumber: formattedNumber,
          userName: userName,
          location: currentLocation,
        }).catch(console.error);
      });
    }

    return () => clearInterval(timer);
  }, [alertsSent, userNumbers, currentLocation, userProfile]);

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
    opacity: withRepeat(withTiming(0.6, { duration: 1200 }), -1, true)
  }));

  const openInMaps = () => {
      if (!currentLocation) return;
      const url = Platform.select({
          ios: `maps:0,0?q=${currentLocation.latitude},${currentLocation.longitude}`,
          android: `geo:0,0?q=${currentLocation.latitude},${currentLocation.longitude}`
      });
      if (url) Linking.openURL(url);
  };

  // Flashlight removed

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#200', '#000', '#000']} className="absolute inset-0" />

      {/* Header Bar */}
      <View
        className="flex-row items-center justify-between px-5 pb-5 border-b"
        style={{ paddingTop: Math.max(insets.top + 10, 60), borderBottomColor: 'rgba(255,0,0,0.3)' }}
      >
        <TouchableOpacity onPress={() => router.replace('/(tabs)')} className="p-2">
          <Ionicons name="chevron-back" size={24} color="#FF0000" />
        </TouchableOpacity>
        <Text className="text-xs font-black tracking-widest text-red-500">ACTIVE_LINK</Text>
        <Text
          className="text-sm font-black text-red-500"
          style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}
        >
          {timeString || '—:—:—'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        {/* Emergency Alert Active Card */}
        <Animated.View
          entering={FadeInDown.duration(600)}
          className="rounded-3xl p-8 items-center mb-6 border"
          style={{ backgroundColor: 'rgba(255,0,0,0.05)', borderColor: 'rgba(255,0,0,0.2)' }}
        >
          <Animated.View
            className="absolute w-35 h-35 rounded-full top-5"
            style={[animatedPulseStyle, { backgroundColor: 'rgba(255,0,0,0.1)' }]}
          />
          <View className="w-20 h-20 rounded-full bg-black border-2 border-red-500 items-center justify-center mb-5">
            <Ionicons name="radio-outline" size={32} color="#FF0000" />
          </View>
          <Text className="text-[13px] font-black tracking-widest text-center text-red-500 mb-3">BROADCASTING_EMERGENCY_STATUS</Text>
          <Text
            className="text-xs text-center leading-5"
            style={{ color: 'rgba(255,255,255,0.7)', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}
          >
            COORDINATES: {currentLocation ? `${currentLocation.latitude.toFixed(4)}° N, ${currentLocation.longitude.toFixed(4)}° E` : 'LOCATING...'}{'\n'}SIGNAL_STRENGTH: OPTIMAL
          </Text>
          <View className="flex-row mt-5 gap-3">
            <View className="px-4 py-1.5 bg-red-500 rounded-lg justify-center">
              <Text className="text-white text-[11px] font-black tracking-widest">SESSION: {countdown}S</Text>
            </View>
            <TouchableOpacity onPress={openInMaps} className="px-4 py-1.5 bg-white/20 rounded-lg justify-center border border-white/30">
              <Text className="text-white text-[11px] font-black tracking-widest">OPEN MAPS</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Emergency Services Status (Currently not directly called in code, marked as standby) */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(600)}
          className="rounded-3xl p-5 mb-4 border"
          style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)' }}
        >
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-[10px] font-black tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>FEDERAL_SERVICES [911]</Text>
            <View className="flex-row items-center">
              <View className="w-1.5 h-1.5 rounded-full mr-2 bg-yellow-500" />
              <Text className="text-[10px] font-black tracking-wide text-yellow-500">STANDBY</Text>
            </View>
          </View>
          <View className="gap-1">
             <Text className="text-[11px] font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>NOTE:</Text>
             <Text
                className="text-[13px] font-medium text-white"
                style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}
             >
                911 AUTODIAL PENDING USER CONSENT
             </Text>
          </View>
        </Animated.View>

        {/* Emergency Contacts Status */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(600)}
          className="rounded-3xl p-5 mb-4 border"
          style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)' }}
        >
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-[10px] font-black tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>EVAC / EMERGENCY CONTACTS</Text>
            <View className="flex-row items-center">
              <View className="w-1.5 h-1.5 rounded-full mr-2 bg-green-500" />
              <Text className="text-[10px] font-black tracking-wide text-green-500">ALERTS_SENT</Text>
            </View>
          </View>
          <View className="gap-1">
            <Text className="text-[11px] font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>MOBILE_UPLINK:</Text>
            {userNumbers?.map((contact: { name: string; phone: string }, idx: number) => (
              <Text
                key={`contact-${idx}`}
                className="text-[13px] font-medium text-white"
                style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}
              >
                {contact.name.toUpperCase()} [{contact.phone}]
              </Text>
            ))}
            {doctor?.phone ? (
              <Text
                className="text-[13px] font-medium text-white"
                style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}
              >
                {doctor.name.toUpperCase() || 'FAMILY DOCTOR'} [{doctor.phone}]
              </Text>
            ) : null}
            {(!userNumbers || userNumbers.length === 0) && !doctor?.phone && (
              <Text
                className="text-[12px] font-medium text-red-400"
                style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}
              >
                NO CONTACTS CONFIGURED
              </Text>
            )}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).duration(600)}>
          <TouchableOpacity
            className="py-4.5 rounded-2xl items-center border mt-5"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text className="text-white text-[13px] font-black tracking-widest">MISSION_ABORT_EXIT</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

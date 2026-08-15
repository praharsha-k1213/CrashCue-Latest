import { useTimeBattery } from '@/hooks/useTimeBattery';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useThemeColor } from '../hooks/useThemeColor';

export default function AlertsScreen() {
  const router = useRouter();
  const { timeString } = useTimeBattery();
  const insets = useSafeAreaInsets();
  // Theme colors
  const { theme } = useTheme();
  const primary = useThemeColor({}, 'primary');
  const accent = useThemeColor({}, 'accent');
  const background = useThemeColor({}, 'background');
  const backgroundHeader = useThemeColor({}, 'backgroundHeader');
  const backgroundCard = useThemeColor({}, 'backgroundCard');
  const border = useThemeColor({}, 'border');
  const textPrimary = useThemeColor({}, 'textPrimary');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const success = useThemeColor({}, 'success');
  const warning = useThemeColor({}, 'warning');
  const error = useThemeColor({}, 'error');

  return (
    <View className="flex-1" style={{ backgroundColor: background }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[backgroundHeader, background, '#000000']} className="absolute inset-0" />

      {/* Header */}
      <View
        className="flex-row items-center justify-between px-5 pb-6 border-b"
        style={{ paddingTop: Math.max(insets.top + 10, 60), borderBottomColor: border, backgroundColor: backgroundHeader }}
      >
        <TouchableOpacity onPress={() => router.replace('/(tabs)')} className="p-2">
          <Ionicons name="chevron-back" size={24} color={primary} />
        </TouchableOpacity>
        <Text className="text-xs font-black tracking-widest" style={{ color: textPrimary }}>INCIDENT_LOGS</Text>
        <View className="items-end">
          <Text
            className="text-sm font-black"
            style={{ color: primary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}
          >
            {timeString || '—:—:—'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Animated.View entering={FadeInDown.duration(600)}>
          <Text className="text-[11px] font-black tracking-widest mb-6 opacity-80" style={{ color: primary }}>SECURITY_ANOMALIES</Text>
        </Animated.View>

        {/* Alert Card 1 */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(600)}
          className="rounded-3xl p-5 mb-4 border"
          style={{ backgroundColor: backgroundCard, borderColor: border }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-base font-bold tracking-wide" style={{ color: textPrimary }}>HARD_BRAKING_DETECTED</Text>
            <View
              className="px-3 py-1.5 rounded-lg border items-center"
              style={{ backgroundColor: success + '1A', borderColor: success }}
            >
              <Text className="text-[9px] font-black tracking-widest" style={{ color: success }}>LOW_RISK</Text>
            </View>
          </View>
          <Text
            className="text-[11px] mb-1.5 tracking-widest"
            style={{ color: textSecondary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}
          >
            TIMESTAMP: 2H_AGO
          </Text>
          <Text className="text-xs mb-4" style={{ color: primary + '80' }}>LOC: MAIN_ST_&_5TH_AVE</Text>
          <TouchableOpacity
            className="py-3.5 rounded-xl items-center border"
            style={{ backgroundColor: background, borderColor: border }}
            onPress={() =>
              router.push({
                pathname: '/alert-details',
                params: {
                  type: 'Hard Braking',
                  severity: 'LOW',
                  time: '2 hours ago',
                  location: 'Main St & 5th Ave',
                  description: 'Detected a rapid deceleration which may indicate hard braking. Review nearby traffic and driving conditions.',
                },
              })
            }
          >
            <Text className="text-[11px] font-black tracking-widest" style={{ color: textPrimary }}>ACCESS_SECURITY_LOG</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Alert Card 2 */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(600)}
          className="rounded-3xl p-5 mb-4 border"
          style={{ backgroundColor: backgroundCard, borderColor: warning + '33' }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-base font-bold tracking-wide" style={{ color: textPrimary }}>MINOR_IMPACT_WARNING</Text>
            <View
              className="px-3 py-1.5 rounded-lg border items-center"
              style={{ backgroundColor: warning + '1A', borderColor: warning }}
            >
              <Text className="text-[9px] font-black tracking-widest" style={{ color: warning }}>ELEVATED</Text>
            </View>
          </View>
          <Text
            className="text-[11px] mb-1.5 tracking-widest"
            style={{ color: textSecondary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}
          >
            TIMESTAMP: 1D_AGO
          </Text>
          <Text className="text-xs mb-4" style={{ color: primary + '80' }}>LOC: HIGHWAY_101</Text>
          <TouchableOpacity
            className="py-3.5 rounded-xl items-center border"
            style={{ backgroundColor: background, borderColor: border }}
            onPress={() =>
              router.push({
                pathname: '/alert-details',
                params: {
                  type: 'Minor Impact',
                  severity: 'MEDIUM',
                  time: '1 day ago',
                  location: 'Highway 101',
                  description: 'A minor collision or bump was recorded by sensors. Inspect vehicle exterior and logs for damage.',
                },
              })
            }
          >
            <Text className="text-[11px] font-black tracking-widest" style={{ color: textPrimary }}>ACCESS_SECURITY_LOG</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Alert Card 3 */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(600)}
          className="rounded-3xl p-5 mb-4 border"
          style={{ backgroundColor: backgroundCard, borderColor: border }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-base font-bold tracking-wide" style={{ color: textPrimary }}>SUDDEN_STASIS_EVENT</Text>
            <View
              className="px-3 py-1.5 rounded-lg border items-center"
              style={{ backgroundColor: success + '1A', borderColor: success }}
            >
              <Text className="text-[9px] font-black tracking-widest" style={{ color: success }}>LOW_RISK</Text>
            </View>
          </View>
          <Text
            className="text-[11px] mb-1.5 tracking-widest"
            style={{ color: textSecondary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}
          >
            TIMESTAMP: 3D_AGO
          </Text>
          <Text className="text-xs mb-4" style={{ color: primary + '80' }}>LOC: PARK_AVENUE</Text>
          <TouchableOpacity
            className="py-3.5 rounded-xl items-center border"
            style={{ backgroundColor: background, borderColor: border }}
            onPress={() =>
              router.push({
                pathname: '/alert-details',
                params: {
                  type: 'Sudden Stop',
                  severity: 'LOW',
                  time: '3 days ago',
                  location: 'Park Avenue',
                  description: 'Vehicle speed dropped sharply to zero. Could be traffic or an avoidance maneuver. Review context.',
                },
              })
            }
          >
            <Text className="text-[11px] font-black tracking-widest" style={{ color: textPrimary }}>ACCESS_SECURITY_LOG</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

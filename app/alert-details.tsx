import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Platform, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useThemeColor } from '../hooks/useThemeColor';

export default function AlertDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    type?: string;
    severity?: string;
    time?: string;
    location?: string;
    description?: string;
  }>();

  // Theme colors
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
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

  const type = params.type || 'Alert';
  const severity = params.severity || '—';
  const time = params.time || '—';
  const location = params.location || '—';
  const description = params.description || '—';

  return (
    <View className="flex-1" style={{ backgroundColor: background }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[backgroundHeader, background, '#000']} className="absolute inset-0" />

      {/* Header */}
      <View
        className="flex-row items-center justify-between px-5 pb-6 border-b"
        style={{ paddingTop: Math.max(insets.top + 10, 60), borderBottomColor: border, backgroundColor: backgroundHeader }}
      >
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} className="p-2">
          <Ionicons name="chevron-back" size={24} color={primary} />
        </TouchableOpacity>
        <Text className="text-[13px] font-black tracking-widest" style={{ color: textPrimary }}>INCIDENT_ANALYSIS_TERMINAL</Text>
        <View className="w-11" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Animated.View
          entering={FadeInDown.duration(600)}
          className="rounded-3xl p-6 border"
          style={{ backgroundColor: backgroundCard, borderColor: border }}
        >
          <View className="flex-row items-start mb-6">
            <View className="flex-1">
              <Text className="text-[10px] font-black tracking-widest" style={{ color: textSecondary }}>INCIDENT_TYPE</Text>
              <Text className="text-2xl font-bold tracking-wide mt-1" style={{ color: textPrimary }}>{type.toUpperCase()}</Text>
            </View>
            <View
              className="px-4 py-2 rounded-xl border items-center"
              style={severity === 'MEDIUM' ? { backgroundColor: warning + '1A', borderColor: warning } : { backgroundColor: success + '1A', borderColor: success }}
            >
              <Text className="text-[10px] font-black tracking-widest" style={{ color: severity === 'MEDIUM' ? warning : success }}>{severity}</Text>
            </View>
          </View>

          <View className="gap-4 mb-8">
            <View className="flex-row items-center gap-3">
              <Ionicons name="time-outline" size={16} color={primary} />
              <View>
                <Text className="text-[10px] font-black tracking-widest" style={{ color: textSecondary }}>TIMESTAMP</Text>
                <Text
                  className="text-sm mt-0.5"
                  style={{ color: textPrimary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}
                >
                  {time}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-3">
              <Ionicons name="location-outline" size={16} color={primary} />
              <View>
                <Text className="text-[10px] font-black tracking-widest" style={{ color: textSecondary }}>GEOLOCATION</Text>
                <Text
                  className="text-sm mt-0.5"
                  style={{ color: textPrimary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}
                >
                  {location}
                </Text>
              </View>
            </View>
          </View>

          <View className="mb-8">
            <Text className="text-xs font-black tracking-widest mb-4" style={{ color: primary }}>SITUATION_REPORT</Text>
            <Text className="text-[15px] leading-6" style={{ color: textSecondary }}>{description}</Text>
          </View>

          <View>
            <Text className="text-xs font-black tracking-widest mb-4" style={{ color: primary }}>TACTICAL_PROTOCOLS</Text>
            <View
              className="p-4 rounded-xl mb-2 border-l-4"
              style={{ borderLeftColor: primary, backgroundColor: background + '4D' }}
            >
              <Text className="text-[15px] leading-6" style={{ color: textSecondary }}>• Verify safety of all occupants.</Text>
            </View>
            <View
              className="p-4 rounded-xl mb-2 border-l-4"
              style={{ borderLeftColor: primary, backgroundColor: background + '4D' }}
            >
              <Text className="text-[15px] leading-6" style={{ color: textSecondary }}>• Deploy emergency links if required.</Text>
            </View>
            <View
              className="p-4 rounded-xl mb-2 border-l-4"
              style={{ borderLeftColor: primary, backgroundColor: background + '4D' }}
            >
              <Text className="text-[15px] leading-6" style={{ color: textSecondary }}>• Analyze telemetry logs and recorder data.</Text>
            </View>
            <View
              className="p-4 rounded-xl mb-2 border-l-4"
              style={{ borderLeftColor: primary, backgroundColor: background + '4D' }}
            >
              <Text className="text-[15px] leading-6" style={{ color: textSecondary }}>• Execute hardware integrity checks.</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

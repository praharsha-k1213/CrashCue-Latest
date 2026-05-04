import { useThemeColor } from '@/hooks/useThemeColor';
import { useTimeBattery } from '@/hooks/useTimeBattery';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GRADIENTS } from '../../constants/DesignTokens';
import { useAuth } from '../../context/AuthContext';
import { useCrashDetection } from '../../context/CrashDetectionContext';
import { useTheme } from '../../context/ThemeContext';
import { useLocalStore } from '../../store/LocalStore';

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { colors } = useTheme();
  const { isMonitoring, startMonitoring, stopMonitoring } = useCrashDetection();
  const { timeString } = useTimeBattery();
  const { navStyle, setNavStyle } = useLocalStore();
  const insets = useSafeAreaInsets();

  const border = useThemeColor({}, 'border') as string;
  const textPrimary = useThemeColor({}, 'textPrimary') as string;
  const textSecondary = useThemeColor({}, 'textSecondary') as string;
  const primary = colors.primary as string;
  const accent = colors.accent as string;
  const backgroundCard = useThemeColor({}, 'backgroundCard') as string;
  const background = useThemeColor({}, 'background') as string;

  const [crashDetection, setCrashDetection] = useState(isMonitoring);
  const sensitivityOptions = ['Low', 'Medium', 'High'];
  const [sensitivityIdx, setSensitivityIdx] = useState(1);

  useEffect(() => {
    setCrashDetection(isMonitoring);
  }, [isMonitoring]);

  return (
    <View className="flex-1 md:items-center md:justify-center" style={{ backgroundColor: background }}>
      <View className="flex-1 w-full md:max-w-md md:h-full md:shadow-2xl md:overflow-hidden">
        <StatusBar barStyle="light-content" />

        {/* Background Gradient to match Sign In */}
        {colors.gradientColors && (
          <LinearGradient
            colors={colors.gradientColors as any}
            start={colors.gradientStart}
            end={colors.gradientEnd}
            className="absolute inset-0"
          />
        )}
        
        <View
          className="absolute w-[300px] h-[300px] rounded-full -top-[100px] -left-[48px]"
          style={{ backgroundColor: primary + '26' }}
        />
        <View
          className="absolute w-[300px] h-[300px] rounded-full -bottom-[100px] -right-[48px]"
          style={{ backgroundColor: accent + '26' }}
        />

        <Stack.Screen options={{ headerShown: false }} />

        {/* Header - now using safe area top inset for responsiveness */}
        <View className="px-5 pb-5 border-b" style={{ paddingTop: Math.max(insets.top + 20, 60), borderBottomColor: border }}>
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity
              onPress={() => router.navigate('index')}
              className="w-10 h-10 rounded-xl items-center justify-center border"
              style={{ backgroundColor: backgroundCard, borderColor: border }}
            >
              <Ionicons name="chevron-back" size={24} color={primary} />
            </TouchableOpacity>
            <View className="px-3 py-1.5 rounded-lg border" style={{ backgroundColor: backgroundCard, borderColor: border }}>
              <Text className="text-xs font-black tracking-widest" style={{ color: primary }}>
                {timeString || '—:—:—'}
              </Text>
            </View>
          </View>
          <Text className="text-3xl font-black mb-1" style={{ color: textPrimary }}>
            Settings
          </Text>
          <Text className="text-base font-semibold" style={{ color: textSecondary }}>
            Customize your experience
          </Text>
        </View>

        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingTop: 20, paddingBottom: Math.max(insets.bottom + 40, 100) }}
          showsVerticalScrollIndicator={false}
        >
          {/* Navigation Style Toggle */}
          <Animated.View entering={FadeInDown.duration(600)} className="mb-6">
            <View
              className="rounded-3xl p-5 border"
              style={{
                backgroundColor: backgroundCard,
                borderColor: border,
                // @ts-ignore
                backdropFilter: Platform.OS === 'web' ? 'blur(20px)' : undefined,
              }}
            >
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-base font-black mb-1" style={{ color: textPrimary }}>
                    Navigation Style
                  </Text>
                  <Text className="text-xs font-semibold" style={{ color: textSecondary }}>
                    {navStyle === 'modern' ? 'Floating Menu' : 'Classic Tab Bar'}
                  </Text>
                </View>
                <View className="flex-row rounded-xl p-1 border" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)', borderColor: border }}>
                  <TouchableOpacity
                    onPress={async () => {
                      await Haptics.selectionAsync();
                      setNavStyle('modern');
                    }}
                    className={`px-3 py-1.5 rounded-lg ${navStyle === 'modern' ? 'shadow-sm' : ''}`}
                    style={{ backgroundColor: navStyle === 'modern' ? primary + '40' : 'transparent' }}
                  >
                    <Text className={`text-xs font-bold`} style={{ color: navStyle === 'modern' ? primary : textSecondary }}>Modern</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={async () => {
                      await Haptics.selectionAsync();
                      setNavStyle('classic');
                    }}
                    className={`px-3 py-1.5 rounded-lg ${navStyle === 'classic' ? 'shadow-sm' : ''}`}
                    style={{ backgroundColor: navStyle === 'classic' ? primary + '40' : 'transparent' }}
                  >
                    <Text className={`text-xs font-bold`} style={{ color: navStyle === 'classic' ? primary : textSecondary }}>Classic</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Crash Detection */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)} className="mb-6">
            <Text className="text-xl font-black mb-4" style={{ color: textPrimary }}>
              Safety Features
            </Text>

            <View
              className="rounded-3xl p-5 border mb-3"
              style={{
                backgroundColor: backgroundCard,
                borderColor: border,
                // @ts-ignore
                backdropFilter: Platform.OS === 'web' ? 'blur(20px)' : undefined,
              }}
            >
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-1 mr-4">
                  <Text className="text-base font-black mb-1" style={{ color: textPrimary }}>
                    Crash Detection
                  </Text>
                  <Text className="text-sm font-semibold" style={{ color: textSecondary }}>
                    Monitor for sudden impacts
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    if (crashDetection) {
                      stopMonitoring();
                    } else {
                      startMonitoring();
                    }
                    setCrashDetection(!crashDetection);
                  }}
                  activeOpacity={0.8}
                  className="w-14 h-8 rounded-full p-1 justify-center"
                  style={{ backgroundColor: crashDetection ? primary : border }}
                >
                  <View
                    className="w-6 h-6 rounded-full bg-white"
                    style={{
                      transform: [{ translateX: crashDetection ? 20 : 0 }],
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 2,
                      elevation: 2,
                    }}
                  />
                </TouchableOpacity>
              </View>

              {/* Sensitivity */}
              <View className="pt-4 border-t" style={{ borderTopColor: border }}>
                <Text className="text-sm font-bold mb-3" style={{ color: textSecondary }}>
                  Detection Sensitivity
                </Text>
                <View className="flex-row gap-2">
                  {sensitivityOptions.map((opt, idx) => {
                    const isSelected = sensitivityIdx === idx;
                    return (
                      <TouchableOpacity
                        key={opt}
                        className="flex-1 px-4 py-3 rounded-2xl border"
                        style={{
                          backgroundColor: isSelected ? primary : 'transparent',
                          borderColor: isSelected ? primary : border,
                        }}
                        onPress={async () => {
                          await Haptics.selectionAsync();
                          setSensitivityIdx(idx);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text
                          className="text-sm font-black text-center"
                          style={{ color: isSelected ? '#FFFFFF' : textSecondary }}
                        >
                          {opt.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Account & Privacy */}
          <Animated.View entering={FadeInUp.delay(200).duration(600)} className="mb-6">
            <Text className="text-xl font-black mb-4" style={{ color: textPrimary }}>
              Account & Privacy
            </Text>

            {/* Profile */}
            <TouchableOpacity
              className="flex-row items-center justify-between rounded-3xl p-5 mb-3 border"
              style={{
                backgroundColor: backgroundCard,
                borderColor: border,
              }}
              activeOpacity={0.7}
              onPress={() => router.push('/emergency-contacts')}
            >
              <View className="flex-row items-center flex-1">
                <LinearGradient
                  colors={GRADIENTS.purple}
                  className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
                >
                  <Ionicons name="person" size={24} color="#FFF" />
                </LinearGradient>
                <View className="flex-1">
                  <Text className="text-base font-black mb-1" style={{ color: textPrimary }}>
                    Profile
                  </Text>
                  <Text className="text-sm font-semibold" style={{ color: textSecondary }}>
                    Manage your information
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color={textSecondary} />
            </TouchableOpacity>

            {/* Database */}
            <TouchableOpacity
              className="flex-row items-center justify-between rounded-3xl p-5 mb-3 border"
              style={{
                backgroundColor: backgroundCard,
                borderColor: border,
              }}
              activeOpacity={0.7}
              onPress={() => router.push('/database-viewer')}
            >
              <View className="flex-row items-center flex-1">
                <LinearGradient
                  colors={GRADIENTS.blue}
                  className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
                >
                  <Ionicons name="server" size={24} color="#FFF" />
                </LinearGradient>
                <View className="flex-1">
                  <Text className="text-base font-black mb-1" style={{ color: textPrimary }}>
                    Local Data
                  </Text>
                  <Text className="text-sm font-semibold" style={{ color: textSecondary }}>
                    View stored information
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color={textSecondary} />
            </TouchableOpacity>

            {/* Privacy */}
            <TouchableOpacity
              className="flex-row items-center justify-between rounded-3xl p-5 mb-3 border"
              style={{
                backgroundColor: backgroundCard,
                borderColor: border,
              }}
              activeOpacity={0.7}
              onPress={async () => {
                try {
                  await WebBrowser.openBrowserAsync('https://example.com/privacy');
                } catch (e) { }
              }}
            >
              <View className="flex-row items-center flex-1">
                <LinearGradient
                  colors={GRADIENTS.success}
                  className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
                >
                  <Ionicons name="shield-checkmark" size={24} color="#FFF" />
                </LinearGradient>
                <View className="flex-1">
                  <Text className="text-base font-black mb-1" style={{ color: textPrimary }}>
                    Privacy Policy
                  </Text>
                  <Text className="text-sm font-semibold" style={{ color: textSecondary }}>
                    Read our privacy terms
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color={textSecondary} />
            </TouchableOpacity>
          </Animated.View>

          {/* Sign Out */}
          <Animated.View entering={FadeInUp.delay(300).duration(600)}>
            <TouchableOpacity
              className="rounded-3xl p-5 items-center border"
              style={{
                borderColor: '#EF4444',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                // @ts-ignore
                backdropFilter: Platform.OS === 'web' ? 'blur(20px)' : undefined,
              }}
              activeOpacity={0.8}
              onPress={() => {
                Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await signOut();
                      } catch (e) {
                        Alert.alert('Error', 'Failed to sign out.');
                      }
                    }
                  },
                ]);
              }}
            >
              <Ionicons name="log-out" size={24} color="#EF4444" style={{ marginBottom: 8 }} />
              <Text className="text-base font-black tracking-wide text-red-600">
                Sign Out
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </View>
    </View>
  );
}

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, ScrollView, StatusBar, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Svg, { Defs, Line, Polyline, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useScreenAwake } from '../../hooks/useScreenAwake';
import { useThemeColor } from '../../hooks/useThemeColor';
import { useSpeedHistory } from '../../context/SpeedHistoryContext';

type Mode = 'highway' | 'city';

const SPEED_LIMITS: Record<Mode, number> = {
  city: 50,
  highway: 100,
};

export default function ModesScreen() {
  useScreenAwake();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [detectedMode, setDetectedMode] = useState((params.mode as Mode) || 'city');
  const recommendedSpeed = SPEED_LIMITS[detectedMode];

  // Global engine manages the speedometer and history
  const { currentSpeed, speedHistory: rawHistory, crashDetected } = useSpeedHistory();
  const speedHistory = rawHistory.map(entry => entry.speed);
  
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  // Theme colors
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

  const isStationary = speedHistory.length > 0 && speedHistory.slice(-5).every((s) => s < 2);

  // Speed limit check
  React.useEffect(() => {
    if (currentSpeed > recommendedSpeed) {
      setAlertMessage(`Speed limit exceeded! Please slow down to ${recommendedSpeed} km/h.`);
      setShowAlert(true);
      playAlertSound();
    } else {
      setShowAlert(false);
    }
  }, [currentSpeed, recommendedSpeed]);

  // Mode switching logic (manual override)
  const toggleMode = (mode: Mode) => {
    setDetectedMode(mode);
  };

  const playAlertSound = async () => {
    try {
      // Implementation for sound
    } catch (e) { }
  };

  const renderSpeedGraph = () => {
    const data = speedHistory.slice(-40); // Last 40 points
    if (data.length < 2) return null;
    const { width: windowWidth } = Dimensions.get('window');
    const width = windowWidth - 96; // Screen width minus 24px outer padding + 24px inner padding horizontally
    const height = 120;
    const maxSpeed = Math.max(120, ...data);
    const minSpeed = 0;

    // Create points string
    const points = data.map((s, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((s - minSpeed) / (maxSpeed - minSpeed)) * height;
      return `${x},${y}`;
    }).join(' ');

    // Fill area points (close the path)
    const fillPoints = `${points} ${width},${height} 0,${height}`;

    return (
      <View className="items-center mt-4">
        <Svg width={width} height={height}>
          <Defs>
            <SvgLinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={primary} stopOpacity="0.4" />
              <Stop offset="1" stopColor={primary} stopOpacity="0" />
            </SvgLinearGradient>
          </Defs>
          {/* Grid lines */}
          <Line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke={border} strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
          <Line x1="0" y1={height / 4} x2={width} y2={height / 4} stroke={border} strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />

          {/* Fill */}
          <Polyline points={fillPoints} fill="url(#gradient)" stroke="none" />

          {/* Line */}
          <Polyline
            points={points}
            fill="none"
            stroke={primary}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: background }}>
      <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} />
      <LinearGradient
        colors={theme === 'light' ? [backgroundHeader, '#F3F4F6'] : [backgroundHeader, '#000']}
        className="absolute inset-0"
      />

      {/* Header */}
      <View className="px-5 pb-5 border-b" style={{ paddingTop: Math.max(insets.top + 10, 64), borderBottomColor: border }}>
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} className="w-10 h-10 rounded-full items-center justify-center border" style={{ backgroundColor: backgroundCard, borderColor: border }}>
            <Ionicons name="arrow-back" size={24} color={primary} />
          </TouchableOpacity>
          <Text className="text-lg font-black tracking-widest" style={{ color: textPrimary }}>DRIVING MODES</Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>

        {/* Mode Toggles */}
        <Animated.View entering={FadeInDown.duration(600)} className="flex-row gap-4 mb-8">
          <TouchableOpacity
            onPress={() => toggleMode('city')}
            className={`flex-1 p-5 rounded-3xl border-2 items-center justify-center ${detectedMode === 'city' ? 'bg-primary/10' : 'bg-transparent'}`}
            style={{
              borderColor: detectedMode === 'city' ? primary : border,
              backgroundColor: detectedMode === 'city' ? (theme === 'light' ? '#EEF2FF' : 'rgba(99, 102, 241, 0.1)') : backgroundCard
            }}
          >
            <Ionicons name="business" size={32} color={detectedMode === 'city' ? primary : textSecondary} />
            <Text className="text-base font-black mt-3" style={{ color: detectedMode === 'city' ? primary : textSecondary }}>CITY</Text>
            <Text className="text-xs font-medium opacity-60 mt-1" style={{ color: textSecondary }}>Max 50 km/h</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => toggleMode('highway')}
            className={`flex-1 p-5 rounded-3xl border-2 items-center justify-center`}
            style={{
              borderColor: detectedMode === 'highway' ? '#10B981' : border,
              backgroundColor: detectedMode === 'highway' ? (theme === 'light' ? '#ECFDF5' : 'rgba(16, 185, 129, 0.1)') : backgroundCard
            }}
          >
            <Ionicons name="car-sport" size={32} color={detectedMode === 'highway' ? '#10B981' : textSecondary} />
            <Text className="text-base font-black mt-3" style={{ color: detectedMode === 'highway' ? '#10B981' : textSecondary }}>HIGHWAY</Text>
            <Text className="text-xs font-medium opacity-60 mt-1" style={{ color: textSecondary }}>Max 100 km/h</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Big Speedometer Display */}
        <Animated.View entering={FadeInDown.delay(200).duration(800)} className="items-center mb-10 w-full">
          <View
            className="w-72 h-72 rounded-full items-center justify-center relative border-8"
            style={{
              backgroundColor: backgroundCard,
              borderColor: detectedMode === 'highway' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(99, 102, 241, 0.4)',
              shadowColor: detectedMode === 'highway' ? '#10B981' : primary,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: theme === 'light' ? 0.1 : 0.3,
              shadowRadius: 15,
              elevation: 8
            }}
          >
            {/* Inner Border Area */}
            <View
              className="absolute inset-2 space-y-2 rounded-full border-2"
              style={{ borderColor: detectedMode === 'highway' ? '#10B981' : primary, opacity: 0.3 }}
            />

            <LinearGradient
              colors={[detectedMode === 'highway' ? '#10B981' : primary, 'transparent']}
              className="absolute inset-0 rounded-full opacity-10"
            />

            <Text className="text-[100px] font-black tracking-tighter leading-none" style={{ color: textPrimary, marginTop: 15 }}>
              {Math.round(currentSpeed)}
            </Text>
            <Text className="text-xl font-bold tracking-widest mt-1" style={{ color: textSecondary }}>KM/H</Text>

            {/* Status Badge */}
            <View
              className="absolute bottom-6 px-4 py-1.5 rounded-full border"
              style={{ backgroundColor: background, borderColor: border }}
            >
              <Text className="text-xs font-black tracking-widest" style={{ color: isStationary ? (theme === 'light' ? '#059669' : '#10B981') : (theme === 'light' ? '#D97706' : '#F59E0B') }}>
                {isStationary ? 'STATIONARY' : 'MOVING'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Telemetry Graph */}
        <Animated.View
          entering={FadeInUp.delay(400).duration(600)}
          className="rounded-3xl p-6 border overflow-hidden"
          style={{
            backgroundColor: backgroundCard,
            borderColor: border,
            shadowColor: theme === 'light' ? '#000' : primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: theme === 'light' ? 0.05 : 0.1,
            shadowRadius: 5,
            elevation: theme === 'light' ? 2 : 4
          }}
        >
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-xs font-black tracking-widest" style={{ color: textSecondary }}>LIVE TELEMETRY</Text>
            <View className="flex-row items-center gap-1">
              <View className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <Text className="text-[10px] font-bold text-red-500">REC</Text>
            </View>
          </View>
          {renderSpeedGraph()}
        </Animated.View>

      </ScrollView>

      {/* Alert Modal */}
      <Modal visible={showAlert} transparent animationType="fade" onRequestClose={() => setShowAlert(false)}>
        <View className="flex-1 justify-center items-center bg-black/80 px-6">
          <Animated.View
            entering={FadeInUp.duration(300)}
            className="w-full rounded-3xl p-6 items-center border"
            style={{ backgroundColor: backgroundCard, borderColor: border }}
          >
            <View className="w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-4">
              <Ionicons name="warning" size={32} color="#EF4444" />
            </View>
            <Text className="text-xl font-black text-center mb-2" style={{ color: textPrimary }}>Safety Alert</Text>
            <Text className="text-base text-center mb-6" style={{ color: textSecondary }}>{alertMessage}</Text>
            <TouchableOpacity
              className="w-full py-4 bg-red-500 rounded-xl items-center shadow-lg shadow-red-500/30"
              onPress={() => setShowAlert(false)}
            >
              <Text className="text-white font-bold tracking-widest text-lg">I'M SAFE</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

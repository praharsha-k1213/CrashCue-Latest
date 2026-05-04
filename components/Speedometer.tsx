import { useSpeedHistory } from '@/context/SpeedHistoryContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const { width } = Dimensions.get('window');
const SPEEDOMETER_SIZE = 80;
const CENTER = SPEEDOMETER_SIZE / 2;
const RADIUS = (SPEEDOMETER_SIZE - 20) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface SpeedometerProps {
  useRealGPS?: boolean;
  showStatus?: boolean;
  size?: 'mini' | 'normal' | 'large';
  externalSpeed?: number;
  externalIsMoving?: boolean;
}

export default function Speedometer({
  useRealGPS = true,
  showStatus = true,
  size = 'normal',
  externalSpeed,
  externalIsMoving
}: SpeedometerProps) {
  const router = useRouter();
  const { speedHistory, isTracking, crashDetected, triggerSOS } = useSpeedHistory();
  const { theme } = useTheme();
  const [speed, setSpeed] = useState<number>(0);
  const [isStationary, setIsStationary] = useState<boolean>(true);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [gpsStatus, setGpsStatus] = useState<'searching' | 'active' | 'error' | 'demo' | 'permission_denied'>('searching');

  // Animated values
  const animatedSpeed = useSharedValue(0);

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textPrimary = useThemeColor({}, 'textPrimary');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primary = useThemeColor({}, 'primary');
  const accent = useThemeColor({}, 'accent');
  const backgroundCard = useThemeColor({}, 'backgroundCard');
  const border = useThemeColor({}, 'border');
  const warning = useThemeColor({}, 'warning');
  const error = useThemeColor({}, 'error');

  // Update animated speed when speed changes
  useEffect(() => {
    animatedSpeed.value = withTiming(speed, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
  }, [speed]);

  // Speed processing and display
  useEffect(() => {
    if (externalSpeed !== undefined && externalIsMoving !== undefined) {
      setSpeed(externalSpeed);
      setIsStationary(!externalIsMoving);
      setGpsStatus('demo');
      return;
    }

    if (speedHistory.length > 0) {
      const latestData = speedHistory[speedHistory.length - 1];
      const latestSpeed = latestData.speed;
      const currentTime = Date.now();

      const timeSinceUpdate = currentTime - latestData.timestamp;
      const hasRecentData = timeSinceUpdate < 3000;
      const hasGoodAccuracy = latestData.location && latestData.location.latitude !== 0;

      if (hasRecentData && hasGoodAccuracy) {
        setGpsStatus('active');
      } else if (timeSinceUpdate < 10000) {
        setGpsStatus('searching');
      } else {
        setGpsStatus('error');
      }

      setSpeed(Math.max(0, Math.round(latestSpeed)));
      setIsStationary(latestSpeed < 2);
    } else if (!useRealGPS) {
      setGpsStatus('demo');
      setSpeed(0);
      setIsStationary(true);
    } else {
      setGpsStatus('searching');
      setSpeed(0);
      setIsStationary(true);
    }
  }, [speedHistory, useRealGPS, externalSpeed, externalIsMoving]);

  // Check permissions
  useEffect(() => {
    const checkPermissions = async () => {
      if (useRealGPS) {
        try {
          const { status } = await Location.getForegroundPermissionsAsync();
          if (status !== 'granted') {
            setGpsStatus('permission_denied');
          }
        } catch (error) {
          // Ignore
        }
      }
    };
    checkPermissions();
  }, [useRealGPS]);

  // Minimized Button
  if (!isVisible) {
    return (
      <TouchableOpacity
        className="absolute bottom-8 right-6 w-14 h-14 rounded-full items-center justify-center border-2 z-[1000]"
        style={{
          backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
          borderColor: primary,
          shadowColor: primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
        onPress={() => setIsVisible(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="speedometer" size={24} color={primary} />
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View
      className="absolute bottom-8 right-6 rounded-3xl p-4 items-center z-[1000] border-2"
      style={{
        backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 20, 25, 0.95)',
        borderColor: crashDetected ? error : border,
        shadowColor: crashDetected ? error : '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 10,
        minWidth: 160,
      }}
    >
      {/* Header Controls */}
      <View className="flex-row justify-between w-full mb-2">
        <TouchableOpacity
          onPress={() => setIsVisible(false)}
          className="w-6 h-6 rounded-full items-center justify-center bg-gray-100 dark:bg-gray-800"
        >
          <Ionicons name="close" size={12} color={textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setIsMinimized(!isMinimized)}
          className="w-6 h-6 rounded-full items-center justify-center bg-gray-100 dark:bg-gray-800"
        >
          <Ionicons name={isMinimized ? "expand" : "contract"} size={12} color={textSecondary} />
        </TouchableOpacity>
      </View>

      {isMinimized ? (
        <TouchableOpacity onPress={() => router.push('/modes')} className="items-center">
          <Text className="text-2xl font-black" style={{ color: primary }}>
            {Math.round(speed)}
          </Text>
          <Text className="text-[9px] font-bold" style={{ color: textSecondary }}>KM/H</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={() => router.push('/modes')} activeOpacity={0.9} className="items-center">
          {/* Circular Indicator */}
          <View className="mb-2 relative">
            <Svg width={100} height={100} viewBox="0 0 100 100">
              <Defs>
                <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor={primary} stopOpacity="1" />
                  <Stop offset="1" stopColor={accent} stopOpacity="1" />
                </LinearGradient>
              </Defs>
              {/* Track */}
              <Circle cx="50" cy="50" r="40" stroke={theme === 'light' ? '#E5E7EB' : '#333'} strokeWidth="8" fill="none" />
              {/* Progress - calculating arc not easy in SVG without logic, simple circle for now */}
              <Circle
                cx="50"
                cy="50"
                r="40"
                stroke="url(#grad)"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - Math.min(speed, 120) / 120)}`}
                strokeLinecap="round"
                rotation="-90"
                origin="50, 50"
              />
            </Svg>
            <View className="absolute inset-0 items-center justify-center">
              <Text className="text-3xl font-black tracking-tighter" style={{ color: textPrimary }}>
                {Math.round(speed)}
              </Text>
              <Text className="text-[10px] font-bold" style={{ color: textSecondary }}>KM/H</Text>
            </View>
          </View>

          {/* Status Badge */}
          <View
            className="flex-row items-center px-2 py-1 rounded-lg mb-1"
            style={{ backgroundColor: isStationary ? '#10B9811A' : '#F59E0B1A' }}
          >
            <View className={`w-2 h-2 rounded-full mr-1.5 ${isStationary ? 'bg-green-500' : 'bg-orange-500'}`} />
            <Text
              className={`text-[10px] font-bold ${isStationary ? 'text-green-600' : 'text-orange-500'}`}
            >
              {isStationary ? 'STATIONARY' : 'MOVING'}
            </Text>
          </View>

          {/* GPS Status */}
          <Text className="text-[9px] font-medium opacity-60" style={{ color: textSecondary }}>
            {gpsStatus === 'active' ? 'GPS Active' : 'Searching GPS...'}
          </Text>

          {crashDetected && (
            <Animated.View className="absolute -top-4 -right-4 bg-red-500 px-3 py-1 rounded-full shadow-lg">
              <Text className="text-white text-[10px] font-black">CRASH!</Text>
            </Animated.View>
          )}
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}
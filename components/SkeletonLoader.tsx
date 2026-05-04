import { useThemeColor } from '@/hooks/useThemeColor';
import React, { useEffect } from 'react';
import { Animated, View } from 'react-native';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export default function SkeletonLoader({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}: SkeletonLoaderProps) {
  const shimmerAnim = new Animated.Value(0);
  const backgroundColor = useThemeColor({}, 'backgroundCard');
  const border = useThemeColor({}, 'border');

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      className="border"
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor,
          borderColor: border,
          opacity,
        },
        style,
      ]}
    />
  );
}

// Skeleton card component
export function SkeletonCard() {
  const borderColor = useThemeColor({}, 'border');

  return (
    <View className="rounded-xl border p-4 my-2 mx-4" style={{ borderColor }}>
      <SkeletonLoader width="60%" height={20} style={{ marginBottom: 8 }} />
      <SkeletonLoader width="100%" height={14} style={{ marginBottom: 8 }} />
      <SkeletonLoader width="80%" height={14} />
    </View>
  );
}

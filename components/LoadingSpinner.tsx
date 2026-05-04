import { useThemeColor } from '@/hooks/useThemeColor';
import React, { useEffect } from 'react';
import { Animated, View } from 'react-native';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

export default function LoadingSpinner({ size = 'medium', color }: LoadingSpinnerProps) {
  const spinAnim = new Animated.Value(0);
  const primary = useThemeColor({}, 'primary');
  const spinnerColor = color || primary;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  }, [spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const sizeMap = {
    small: { size: 24, borderWidth: 2 },
    medium: { size: 40, borderWidth: 3 },
    large: { size: 60, borderWidth: 4 },
  };

  const { size: spinnerSize, borderWidth } = sizeMap[size];

  return (
    <View className="justify-center items-center" style={{ width: spinnerSize, height: spinnerSize }}>
      <Animated.View
        className="rounded-full"
        style={{
          width: spinnerSize,
          height: spinnerSize,
          borderWidth: borderWidth,
          borderColor: spinnerColor,
          borderTopColor: 'transparent',
          transform: [{ rotate: spin }],
        }}
      />
    </View>
  );
}

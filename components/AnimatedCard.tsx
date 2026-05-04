import React, { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

interface AnimatedCardProps {
  children: React.ReactNode;
  style?: any;
  delay?: number;
}

export default function AnimatedCard({ children, style, delay = 0 }: AnimatedCardProps) {
  const slideAnim = useSharedValue(50);
  const fadeAnim = useSharedValue(0);

  useEffect(() => {
    slideAnim.value = withDelay(delay, withTiming(0, { duration: 400 }));
    fadeAnim.value = withDelay(delay, withTiming(1, { duration: 300 }));
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  return (
    <Animated.View
      className="rounded-xl p-4 my-2 mx-4"
      style={[style, animatedStyle]}
    >
      {children}
    </Animated.View>
  );
}

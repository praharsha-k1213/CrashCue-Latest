import { triggerHaptic } from '@/utils/hapticFeedback';
import React, { useRef } from 'react';
import { Animated, TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface AnimatedButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  onPress?: () => void;
  scaleOnPress?: boolean;
  hapticFeedback?: 'light' | 'medium' | 'heavy' | 'none';
}

export default function AnimatedButton({
  children,
  onPress,
  scaleOnPress = true,
  hapticFeedback = 'light',
  ...props
}: AnimatedButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = async () => {
    if (scaleOnPress) {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }).start();
    }
    if (hapticFeedback !== 'none') {
      await triggerHaptic(hapticFeedback);
    }
  };

  const handlePressOut = () => {
    if (scaleOnPress) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }).start();
    }
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      activeOpacity={0.8}
      {...props}
    >
      <Animated.View style={{ width: '100%', flex: 1, transform: [{ scale: scaleAnim }] }}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

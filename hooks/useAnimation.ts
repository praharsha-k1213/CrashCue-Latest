import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export const useAnimation = (initialValue: number = 0) => {
  const animValue = useRef(new Animated.Value(initialValue)).current;

  const animate = (
    toValue: number,
    duration: number = 300,
    useNativeDriver: boolean = true
  ) => {
    Animated.timing(animValue, {
      toValue,
      duration,
      useNativeDriver,
    }).start();
  };

  const reset = () => {
    animValue.setValue(initialValue);
  };

  return { animValue, animate, reset };
};

export const usePulseAnimation = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return { pulseAnim, scale: pulseAnim };
};

export const useSlideAnimation = (initialValue: number = 100) => {
  const slideAnim = useRef(new Animated.Value(initialValue)).current;

  const slideIn = (duration: number = 400) => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration,
      useNativeDriver: true,
    }).start();
  };

  const slideOut = (duration: number = 400) => {
    Animated.timing(slideAnim, {
      toValue: initialValue,
      duration,
      useNativeDriver: true,
    }).start();
  };

  return { slideAnim, slideIn, slideOut };
};

export const useFadeAnimation = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fadeIn = (duration: number = 300) => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    }).start();
  };

  const fadeOut = (duration: number = 300) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration,
      useNativeDriver: true,
    }).start();
  };

  return { fadeAnim, fadeIn, fadeOut };
};

export const useScaleAnimation = () => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const scaleIn = (duration: number = 300) => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  };

  const scaleOut = (duration: number = 300) => {
    Animated.timing(scaleAnim, {
      toValue: 0.8,
      duration,
      useNativeDriver: true,
    }).start();
  };

  return { scaleAnim, scaleIn, scaleOut };
};

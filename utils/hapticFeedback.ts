import * as Haptics from 'expo-haptics';
import { Vibration } from 'react-native';

export const triggerHaptic = async (type: 'light' | 'medium' | 'heavy' = 'medium') => {
  try {
    switch (type) {
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      default:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  } catch (error) {
    console.log('Haptic feedback not available');
  }
};

export const triggerStrongVibration = (duration: number = 80) => {
  try {
    Vibration.vibrate(duration);
  } catch (error) {
    console.log('Vibration not available');
  }
};

export const triggerSelectionHaptic = async () => {
  try {
    await Haptics.selectionAsync();
  } catch (error) {
    console.log('Selection haptic not available');
  }
};

export const triggerNotificationHaptic = async (type: 'Success' | 'Warning' | 'Error' = 'Success') => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType[type]);
  } catch (error) {
    console.log('Notification haptic not available');
  }
};

/**
 * Trigger a "Heartbeat" vibration pattern for critical states.
 * Pattern: [100ms vibrate, 100ms pause, 100ms vibrate, 400ms pause]
 */
export const triggerHeartbeatHaptic = () => {
  try {
    Vibration.vibrate([0, 100, 100, 100, 400]);
  } catch (error) {
    console.log('Heartbeat vibration not available');
  }
};

/**
 * Trigger an intense "Heartbeat" vibration pattern for extreme critical states.
 * Pattern: [0, 150, 50, 150, 200]
 */
export const triggerIntenseHeartbeatHaptic = () => {
  try {
    Vibration.vibrate([0, 150, 50, 150, 200]);
  } catch (error) {
    console.log('Intense heartbeat vibration not available');
  }
};

/**
 * Trigger a sharp "Double Tap" haptic using impact.
 */
export const triggerDoubleTapHaptic = async () => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 100);
  } catch (error) {
    console.log('Double tap haptic not available');
  }
};

/**
 * Trigger a standardized success vibration pattern.
 * Pattern: [0, 50, 50, 150]
 */
export const triggerSuccessVibration = () => {
  try {
    Vibration.vibrate([0, 50, 50, 150]);
  } catch (error) {
    console.log('Success vibration not available');
  }
};

/**
 * Trigger a standardized error vibration pattern.
 * Pattern: [0, 500, 100, 500]
 */
export const triggerErrorVibration = () => {
  try {
    Vibration.vibrate([0, 500, 100, 500]);
  } catch (error) {
    console.log('Error vibration not available');
  }
};

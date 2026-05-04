import { useEffect, useState } from 'react';
import * as Battery from 'expo-battery';

export function useTimeBattery() {
  const [timeString, setTimeString] = useState<string>('');
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      try {
        const ist = new Intl.DateTimeFormat('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          timeZone: 'Asia/Kolkata',
        }).format(now);
        setTimeString(ist);
      } catch (err) {
        setTimeString(new Date().toLocaleTimeString());
      }
    };

    updateTime();
    const timeInterval = setInterval(updateTime, 1000);

    let batterySubscription: Battery.Subscription | null = null;
    const setupBattery = async () => {
      try {
        const level = await Battery.getBatteryLevelAsync();
        setBatteryLevel(level);
        batterySubscription = Battery.addBatteryLevelListener(({ batteryLevel }) => {
          setBatteryLevel(batteryLevel);
        });
      } catch (_) {
        setBatteryLevel(null);
      }
    };

    setupBattery();

    return () => {
      clearInterval(timeInterval);
      if (batterySubscription) batterySubscription.remove();
    };
  }, []);

  return { timeString, batteryLevel };
}



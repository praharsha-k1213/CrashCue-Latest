import { useEffect, useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { getThemeOverride, subscribeTheme } from './themeController';

export function useColorScheme() {
  const systemScheme = useRNColorScheme();
  const override = useSyncExternalStore(subscribeTheme, getThemeOverride, getThemeOverride);
  return (override ?? systemScheme) as 'light' | 'dark' | null;
}

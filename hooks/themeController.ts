import type { ColorSchemeName } from 'react-native';

let themeOverride: ColorSchemeName | null = 'dark';
const subscribers = new Set<() => void>();

export function getThemeOverride(): ColorSchemeName | null {
  return themeOverride;
}

export function setThemeOverride(next: ColorSchemeName | null) {
  themeOverride = next;
  subscribers.forEach((fn) => fn());
}

export function subscribeTheme(listener: () => void) {
  subscribers.add(listener);
  return () => subscribers.delete(listener);
}



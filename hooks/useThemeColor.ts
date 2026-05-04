import { ThemePalette } from '@/constants/Themes';
import { useTheme } from '@/context/ThemeContext';

export function useThemeColor(
  props: { [key: string]: string | undefined },
  colorName: keyof ThemePalette
): string {
  const themeContext = useTheme();

  // Default fallback if context is missing or failing
  const colors = themeContext?.colors || { primary: '#00E0FF' };

  // Return override from props if exists
  if (props && props[colorName]) {
    return props[colorName];
  }

  // Return from current theme palette - cast to string to satisfy typical style props
  // gradientColors should not be accessed via this hook for UI styles
  const color = colors[colorName];
  if (typeof color === 'string') {
    return color;
  }

  // Final fallback
  return (colors?.primary as string) || '#00E0FF';
}

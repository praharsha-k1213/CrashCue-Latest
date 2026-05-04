import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeKey, ThemePalette, Themes } from '../constants/Themes';

const ThemeContext = createContext<{
  theme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
  colors: ThemePalette;
}>({
  theme: 'silver',
  setTheme: () => { },
  colors: Themes.silver,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeKey>('silver');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load theme from storage on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('user_theme');
        if (savedTheme && Themes[savedTheme]) {
          setThemeState(savedTheme as ThemeKey);
        }
      } catch (e) {
        console.error('Failed to load theme:', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadTheme();
  }, []);

  const setTheme = async (newTheme: ThemeKey) => {
    try {
      setThemeState(newTheme);
      await AsyncStorage.setItem('user_theme', newTheme);
    } catch (e) {
      console.error('Failed to save theme:', e);
    }
  };

  if (!isLoaded) {
    return null; // Or a splash screen
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors: Themes[theme] }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
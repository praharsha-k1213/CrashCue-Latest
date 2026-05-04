/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    // Basic colors
    text: '#1F2937',
    background: '#FFFFFF',
    tint: tintColorLight,
    icon: '#6B7280',
    tabIconDefault: '#6B7280',
    tabIconSelected: tintColorLight,
    
    // App specific colors
    primary: '#DC2626', // Red for CrashCue branding
    secondary: '#059669', // Green for success states
    accent: '#00E072', // Bright green for highlights
    warning: '#F59E0B', // Orange for warnings
    error: '#EF4444', // Red for errors
    gradient: '#8B5CF6', // Purple for gradients
    
    // Background colors
    backgroundSecondary: '#F9FAFB', // Light gray for cards
    backgroundTertiary: '#F3F4F6', // Even lighter gray
    backgroundCard: '#FFFFFF', // White for cards
    backgroundHeader: '#F3F4F6', // Light gray for headers
    
    // Text colors
    textPrimary: '#1F2937', // Dark gray for main text
    textSecondary: '#6B7280', // Medium gray for secondary text
    textTertiary: '#9CA3AF', // Light gray for tertiary text
    textInverse: '#FFFFFF', // White text for dark backgrounds
    
    // Border colors
    border: '#E5E7EB', // Light gray borders
    borderDark: '#D1D5DB', // Slightly darker borders
    
    // Status colors
    success: '#10B981',
    info: '#3B82F6',
    
    // Interactive elements
    buttonPrimary: '#DC2626',
    buttonSecondary: '#6B7280',
    buttonSuccess: '#059669',
    buttonDanger: '#EF4444',
    
    // Special effects
    shadow: 'rgba(0, 0, 0, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  dark: {
    // Basic colors
    text: '#ECEDEE',
    background: '#0A0A0A',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    
    // App specific colors
    primary: '#00E0FF', // Teal/Cyan for CrashCue branding (matching image)
    secondary: '#00E072', // Green for success states
    accent: '#00E0FF', // Teal/Cyan for highlights
    warning: '#FF8C00', // Orange for warnings
    error: '#FF4444', // Red for errors
    gradient: '#8B5CF6', // Purple for gradients
    
    // Background colors
    backgroundSecondary: '#1A1A1A', // Dark gray for cards
    backgroundTertiary: '#0F0F0F', // Even darker gray
    backgroundCard: '#1A1A1A', // Dark gray for cards
    backgroundHeader: '#1A1A1A', // Dark gray for headers
    
    // Text colors
    textPrimary: '#FFFFFF', // White for main text
    textSecondary: '#CCCCCC', // Light gray for secondary text
    textTertiary: '#9CA3AF', // Medium gray for tertiary text
    textInverse: '#000000', // Black text for light backgrounds
    
    // Border colors
    border: '#333333', // Dark gray borders
    borderDark: '#555555', // Lighter gray borders
    
    // Status colors
    success: '#10B981',
    info: '#3B82F6',
    
    // Interactive elements
    buttonPrimary: '#00E0FF',
    buttonSecondary: '#333333',
    buttonSuccess: '#00E072',
    buttonDanger: '#FF4444',
    
    // Special effects
    shadow: 'rgba(0, 0, 0, 0.3)',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
};

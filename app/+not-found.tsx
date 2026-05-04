import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

// Automatically redirect any unknown route to home — never show a 404 screen.
export default function NotFoundScreen() {
  const router = useRouter();

  useEffect(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  }, []);

  return <View />;
}
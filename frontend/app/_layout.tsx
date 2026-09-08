import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { ActivityIndicator, View } from 'react-native';
import { COLORS } from '../constants/theme';

export default function RootLayout() {
  const { user, isLoading, restoreSession } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    restoreSession();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const currentGroup = segments[0];
    const inAuthGroup = currentGroup === '(auth)';
    const isAtSplash = !currentGroup || currentGroup === 'index';

    // Allow index.tsx to display its splash animation
    if (isAtSplash) {
      return;
    }

    if (!user && !inAuthGroup) {
      // Redirect to the sign-in page if not on login or splash.
      router.replace('/(auth)/login');
    } else if (user) {
      if (inAuthGroup) {
        if (user.role === 'customer') {
          router.replace('/(customer)/home');
        } else if (user.role === 'worker') {
          router.replace('/(worker)/dashboard');
        } else if (user.role === 'admin') {
          router.replace('/(admin)/dashboard');
        }
      } else {
        // Enforce role route security (workers cannot access customer tabs, etc.)
        if (user.role === 'customer' && (currentGroup === '(worker)' || currentGroup === '(admin)')) {
          router.replace('/(customer)/home');
        } else if (user.role === 'worker' && (currentGroup === '(customer)' || currentGroup === '(admin)')) {
          router.replace('/(worker)/dashboard');
        } else if (user.role === 'admin' && (currentGroup === '(customer)' || currentGroup === '(worker)')) {
          router.replace('/(admin)/dashboard');
        }
      }
    }
  }, [user, isLoading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
    </Stack>
  );
}

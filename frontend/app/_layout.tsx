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

    if (!user && !inAuthGroup) {
      // Redirect to the sign-in page.
      router.replace('/(auth)/login');
    } else if (user) {
      // If user is inside (auth) or at root index, send to their role dashboard
      if (inAuthGroup || !currentGroup || currentGroup === 'index') {
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

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      {/* We will add (customer), (worker), (admin) groups later */}
    </Stack>
  );
}

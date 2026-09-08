import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  Animated, 
  Dimensions, 
  StatusBar, 
  Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { COLORS } from '../constants/theme';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Entrance animation (Fade in & scale up)
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 25,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Continuous breathing / floating pulse
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    // 3. Smooth progress bar animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2500,
      useNativeDriver: false,
    }).start();

    // 4. Timer to transition to the next screen
    const timer = setTimeout(() => {
      // Fade out smoothly
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        pulse.stop();
        // Check session and navigate
        if (user) {
          if (user.role === 'customer') {
            router.replace('/(customer)/home');
          } else if (user.role === 'worker') {
            router.replace('/(worker)/dashboard');
          } else if (user.role === 'admin') {
            router.replace('/(admin)/dashboard');
          } else {
            router.replace('/(auth)/login');
          }
        } else {
          router.replace('/(auth)/login');
        }
      });
    }, 2800);

    return () => {
      clearTimeout(timer);
      pulse.stop();
    };
  }, [user, isLoading]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EAF4FE" />
      
      {/* Background Decorative Rings */}
      <View style={styles.outerGlowCircle} />
      <View style={styles.innerGlowCircle} />

      <Animated.View 
        style={[
          styles.contentWrapper, 
          { 
            opacity: fadeAnim, 
            transform: [
              { scale: Animated.multiply(scaleAnim, pulseAnim) }
            ] 
          }
        ]}
      >
        {/* Animated Brand Graphic */}
        <View style={styles.imageContainer}>
          <Image 
            source={require('../assets/splash_intro.png')}
            style={styles.splashImage}
            resizeMode="contain"
          />
        </View>

        {/* Loading Indicator Section */}
        <View style={styles.loaderSection}>
          <View style={styles.progressBarBackground}>
            <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
          </View>
          <Text style={styles.loadingText}>Connecting to nearby professionals...</Text>
        </View>
      </Animated.View>

      {/* Footer Tagline */}
      <View style={styles.footer}>
        <Text style={styles.brandName}>RapidFix</Text>
        <Text style={styles.tagline}>On-Demand Services • Instant & Verified</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAF4FE',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  outerGlowCircle: {
    position: 'absolute',
    width: width * 1.4,
    height: width * 1.4,
    borderRadius: (width * 1.4) / 2,
    backgroundColor: '#D9EEFE',
    opacity: 0.5,
    top: -width * 0.3,
  },
  innerGlowCircle: {
    position: 'absolute',
    width: width * 1.05,
    height: width * 1.05,
    borderRadius: (width * 1.05) / 2,
    backgroundColor: '#E1F1FD',
    bottom: -width * 0.25,
  },
  contentWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  imageContainer: {
    width: Math.min(width * 0.95, 520),
    height: Math.min(width * 0.72, 340),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 8,
  },
  splashImage: {
    width: '100%',
    height: '100%',
  },
  loaderSection: {
    marginTop: 24,
    alignItems: 'center',
    width: '80%',
    maxWidth: 260,
  },
  progressBarBackground: {
    width: '100%',
    height: 5,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '500',
    color: '#4B5563',
    letterSpacing: 0.3,
  },
  footer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 44 : 28,
    alignItems: 'center',
    zIndex: 10,
  },
  brandName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E3A8A',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
});

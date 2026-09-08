import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  Animated, 
  Dimensions, 
  StatusBar, 
  Platform,
  Easing 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = Math.min(width * 0.68, 270);

export default function SplashScreen() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Entrance animation (Fade in & spring scale)
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 28,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Continuous breathing / floating pulse
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.035,
          duration: 1300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    // 3. Smooth slow rotating outer ring
    const rotate = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 9000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    rotate.start();

    // 4. Progress bar fill
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2500,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();

    // 5. Transition to next screen
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        pulse.stop();
        rotate.stop();

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
      rotate.stop();
    };
  }, [user, isLoading]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EDF6FF" />
      
      {/* Background Decorative Soft Radiance */}
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
        {/* Round Logo Area */}
        <View style={styles.logoContainer}>
          {/* Animated Rotating Outer Orbit Ring */}
          <Animated.View 
            style={[
              styles.outerOrbitRing, 
              { transform: [{ rotate: spin }] }
            ]} 
          />

          {/* Perfect Round Badge Container */}
          <View style={styles.roundBadge}>
            <Image 
              source={require('../assets/splash_intro.png')}
              style={styles.roundImage}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* Brand Text */}
        <View style={styles.brandSection}>
          <Text style={styles.brandTitle}>RapidFix</Text>
          <Text style={styles.brandSubtitle}>Skilled Help. Right When You Need It.</Text>
        </View>

        {/* Modern Loader Indicator */}
        <View style={styles.loaderSection}>
          <View style={styles.progressBarTrack}>
            <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
          </View>
          <Text style={styles.loadingText}>Connecting to nearby professionals...</Text>
        </View>
      </Animated.View>

      {/* Subtle Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>⚡ Fast • Verified • On-Demand</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  outerGlowCircle: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: (width * 1.5) / 2,
    backgroundColor: '#DCEEFE',
    opacity: 0.6,
    top: -width * 0.4,
  },
  innerGlowCircle: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: (width * 1.2) / 2,
    backgroundColor: '#E4F2FE',
    bottom: -width * 0.35,
  },
  contentWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  logoContainer: {
    width: CIRCLE_SIZE + 34,
    height: CIRCLE_SIZE + 34,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  outerOrbitRing: {
    position: 'absolute',
    width: CIRCLE_SIZE + 32,
    height: CIRCLE_SIZE + 32,
    borderRadius: (CIRCLE_SIZE + 32) / 2,
    borderWidth: 2,
    borderColor: 'rgba(37, 99, 235, 0.3)',
    borderStyle: 'dashed',
  },
  roundBadge: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    // Premium soft elevation
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 22,
    elevation: 12,
  },
  roundImage: {
    width: '100%',
    height: '100%',
  },
  brandSection: {
    marginTop: 22,
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: 0.8,
  },
  brandSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
    marginTop: 4,
  },
  loaderSection: {
    marginTop: 28,
    alignItems: 'center',
    width: '75%',
    maxWidth: 240,
  },
  progressBarTrack: {
    width: '100%',
    height: 5,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 8,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    letterSpacing: 0.2,
  },
  footer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 24,
    alignItems: 'center',
    zIndex: 10,
  },
  footerText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

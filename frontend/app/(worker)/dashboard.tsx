import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { COLORS, SIZES } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import * as Location from 'expo-location';
import { socketService } from '../../services/socket';
import { useFocusEffect } from 'expo-router';

interface WorkerStats {
  rating: number;
  totalRatings: number;
  completedJobs: number;
  isOnline: boolean;
  isAvailable: boolean;
  isVerified: boolean;
  category: string;
  experience: number;
}

export default function WorkerDashboard() {
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState<WorkerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      fetchWorkerProfile();
      return () => {
        stopLocationTracking();
      };
    }, [])
  );

  useEffect(() => {
    if (profile?.isOnline) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }
  }, [profile?.isOnline]);

  const startLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to go online.');
        return;
      }

      await socketService.connect();

      locationSubRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 10, // Or every 10 meters
        },
        (location) => {
          if (socketService.socket) {
            socketService.socket.emit('worker:updateLocation', {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
          }
        }
      );
    } catch (error) {
      console.error('Error starting location tracking:', error);
    }
  };

  const stopLocationTracking = () => {
    if (locationSubRef.current) {
      locationSubRef.current.remove();
      locationSubRef.current = null;
    }
    socketService.disconnect();
  };

  const fetchWorkerProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/worker/profile');
      if (response.data?.success) {
        setProfile({
          rating: response.data.profile.rating,
          totalRatings: response.data.profile.totalRatings,
          completedJobs: response.data.profile.completedJobs,
          isOnline: response.data.profile.isOnline,
          isAvailable: response.data.profile.isAvailable,
          isVerified: response.data.profile.isVerified || false,
          category: response.data.profile.category,
          experience: response.data.profile.experience,
        });
      }
    } catch (error: any) {
      console.error('Error fetching worker profile:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to fetch dashboard profile');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (field: 'isOnline' | 'isAvailable') => {
    if (!profile) return;

    if (!profile.isVerified) {
      Alert.alert(
        'Account Pending Approval',
        'Your profile is under review by the RapidFix Admin team. You will be able to go online and accept jobs once verified.'
      );
      return;
    }

    try {
      setUpdating(true);
      const updatedValue = !profile[field];
      
      const payload: any = {
        [field]: updatedValue
      };

      // If going online, get current location and attach to payload
      if (field === 'isOnline' && updatedValue) {
        try {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          payload.latitude = loc.coords.latitude;
          payload.longitude = loc.coords.longitude;
        } catch (e) {
          // Fallback coords
          payload.latitude = 23.0225;
          payload.longitude = 72.5714;
        }
      }

      const response = await api.put('/worker/status', payload);
      if (response.data?.success) {
        setProfile(prev => prev ? {
          ...prev,
          [field]: updatedValue
        } : null);

        // If location is available, emit socket update immediately
        if (payload.latitude && payload.longitude && socketService.socket) {
          socketService.socket.emit('worker:updateLocation', {
            latitude: payload.latitude,
            longitude: payload.longitude,
          });
        }
      }
    } catch (error: any) {
      console.error(`Error updating worker ${field}:`, error);
      Alert.alert('Update Failed', error.response?.data?.message || 'Unable to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Header with Title and Logout */}
        <View style={styles.topBar}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.greeting}>Hello, {user?.name || 'Worker'}</Text>
              {profile?.isVerified && (
                <Ionicons name="checkmark-circle" size={18} color={COLORS.success} style={{ marginLeft: 6 }} />
              )}
            </View>
            <Text style={styles.subtext}>
              {profile ? `${profile.category} • ${profile.experience} yrs experience` : 'Service Provider'}
            </Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={() => logout()}>
            <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
          </TouchableOpacity>
        </View>

        {/* Verification Status Card */}
        {!profile?.isVerified ? (
          <View style={styles.pendingCard}>
            <View style={styles.pendingHeader}>
              <Ionicons name="time-outline" size={24} color="#FF9900" />
              <Text style={styles.pendingTitle}>Account Pending Approval</Text>
            </View>
            <Text style={styles.pendingDesc}>
              Your account is currently under review by our Admin team. Once approved, you can turn on Work Mode and start receiving customer requests!
            </Text>
          </View>
        ) : (
          <View style={styles.verifiedCard}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.success} />
            <Text style={styles.verifiedText}>Approved & Verified Professional</Text>
          </View>
        )}

        {/* Toggles Card */}
        <View style={[styles.togglesCard, !profile?.isVerified && { opacity: 0.65 }]}>
          {/* Online/Offline Toggle */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextContainer}>
              <View style={[
                styles.statusDot, 
                { backgroundColor: profile?.isOnline ? COLORS.success : COLORS.textLight }
              ]} />
              <Text style={styles.toggleLabel}>Work Mode (Online)</Text>
            </View>
            <Switch
              trackColor={{ false: COLORS.border, true: COLORS.success }}
              thumbColor={COLORS.surface}
              onValueChange={() => handleToggleStatus('isOnline')}
              value={profile?.isOnline || false}
              disabled={updating || !profile?.isVerified}
            />
          </View>

          <View style={styles.divider} />

          {/* Available/Busy Toggle */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextContainer}>
              <Ionicons 
                name={profile?.isAvailable ? "checkmark-circle-outline" : "close-circle-outline"} 
                size={20} 
                color={profile?.isAvailable ? COLORS.primary : COLORS.textLight} 
              />
              <Text style={styles.toggleLabel}>Available for Jobs</Text>
            </View>
            <Switch
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.surface}
              onValueChange={() => handleToggleStatus('isAvailable')}
              value={profile?.isAvailable || false}
              disabled={updating || !profile?.isOnline || !profile?.isVerified}
            />
          </View>
        </View>

        {/* Statistics Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Completed Jobs</Text>
            <Text style={styles.statValue}>{profile?.completedJobs || 0}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Average Rating</Text>
            <Text style={styles.statValue}>
              ⭐ {profile?.rating && profile.rating > 0 ? profile.rating.toFixed(1) : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Recent Job Requests */}
        <Text style={styles.sectionTitle}>Active Job Bookings</Text>
        <View style={styles.emptyState}>
          <Ionicons name="briefcase-outline" size={48} color={COLORS.textLight} />
          <Text style={styles.emptyStateText}>No active jobs at the moment.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SIZES.lg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  greeting: {
    fontSize: SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  subtext: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
  },
  logoutBtn: {
    padding: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    elevation: 1,
  },
  pendingCard: {
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#FFE082',
    borderRadius: 12,
    padding: 16,
    marginBottom: SIZES.lg,
  },
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  pendingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B78103',
    marginLeft: 8,
  },
  pendingDesc: {
    fontSize: 13,
    color: '#7A5200',
    lineHeight: 18,
  },
  verifiedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: SIZES.lg,
  },
  verifiedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
    marginLeft: 8,
  },
  togglesCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: SIZES.xl,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  toggleTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.xl,
  },
  statCard: {
    backgroundColor: COLORS.surface,
    width: '48%',
    padding: SIZES.lg,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: SIZES.md,
    color: COLORS.text,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.xl,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyStateText: {
    marginTop: SIZES.md,
    color: COLORS.textLight,
    fontSize: 14,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SIZES.lg,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textLight,
  },
});

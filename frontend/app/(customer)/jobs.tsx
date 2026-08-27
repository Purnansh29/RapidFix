import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { socketService } from '../../services/socket';

interface Job {
  _id: string;
  category: string;
  description: string;
  address: string;
  budget?: number;
  isEmergency: boolean;
  status: 'Pending' | 'Accepted' | 'InProgress' | 'Completed' | 'Cancelled';
  workerId?: {
    name: string;
    phone: string;
  };
  createdAt: string;
}

export default function CustomerJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchJobs();
    setupSocketListener();

    return () => {
      if (socketService.socket) {
        socketService.socket.off('job:statusUpdated');
      }
    };
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await api.get('/jobs/my');
      if (response.data?.success) {
        setJobs(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to fetch bookings list');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const setupSocketListener = async () => {
    const socket = await socketService.connect();
    if (socket) {
      socket.on('job:statusUpdated', (data: { jobId: string; status: Job['status'] }) => {
        setJobs((prevJobs) =>
          prevJobs.map((job) =>
            job._id === data.jobId ? { ...job, status: data.status } : job
          )
        );
        Alert.alert('Job Update', `Job request status has changed to: ${data.status}`);
      });
    }
  };

  const handleCancelJob = (jobId: string) => {
    Alert.prompt(
      'Cancel Booking',
      'Please enter a reason for cancelling:',
      [
        {
          text: 'Back',
          style: 'cancel',
        },
        {
          text: 'Confirm Cancel',
          style: 'destructive',
          onPress: async (reason) => {
            try {
              const response = await api.put(`/jobs/${jobId}/cancel`, { reason });
              if (response.data?.success) {
                setJobs((prevJobs) =>
                  prevJobs.map((job) =>
                    job._id === jobId ? { ...job, status: 'Cancelled' } : job
                  )
                );
                Alert.alert('Cancelled', 'Your booking has been cancelled successfully.');
              }
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to cancel booking');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'Pending': return '#FFB020'; // Amber
      case 'Accepted': return COLORS.primary; // Blue
      case 'InProgress': return '#9C27B0'; // Purple
      case 'Completed': return COLORS.success; // Green
      case 'Cancelled': return COLORS.error; // Red
      default: return COLORS.textLight;
    }
  };

  const renderJobCard = ({ item }: { item: Job }) => {
    const showCancelButton = ['Pending', 'Accepted'].includes(item.status);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.categoryTitle}>{item.category}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
          </View>
        </View>

        <Text style={styles.description}>{item.description}</Text>

        <View style={styles.detailsRow}>
          <Ionicons name="location-outline" size={16} color={COLORS.textLight} />
          <Text style={styles.detailText} numberOfLines={1}>{item.address}</Text>
        </View>

        {item.budget && (
          <View style={styles.detailsRow}>
            <Ionicons name="cash-outline" size={16} color={COLORS.textLight} />
            <Text style={styles.detailText}>Estimated budget: ₹{item.budget}</Text>
          </View>
        )}

        <View style={styles.detailsRow}>
          <Ionicons name="person-outline" size={16} color={COLORS.textLight} />
          <Text style={styles.detailText}>
            Professional: {item.workerId ? item.workerId.name : 'Searching...'}
          </Text>
        </View>

        {item.isEmergency && (
          <View style={styles.emergencyLabel}>
            <Ionicons name="warning" size={14} color={COLORS.error} />
            <Text style={styles.emergencyText}>Urgent Emergency</Text>
          </View>
        )}

        {showCancelButton && (
          <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancelJob(item._id)}>
            <Text style={styles.cancelBtnText}>Cancel Booking</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Fetching bookings...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={jobs}
        renderItem={renderJobCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="list-outline" size={60} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>No Bookings Yet</Text>
            <Text style={styles.emptySub}>Book a professional from the Map tab to get started.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: SIZES.lg,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: SIZES.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 13,
    color: COLORS.textLight,
    marginLeft: 8,
    flex: 1,
  },
  emergencyLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  emergencyText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.error,
    marginLeft: 6,
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  cancelBtnText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: 'bold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textLight,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

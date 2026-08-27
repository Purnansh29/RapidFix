import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, RefreshControl, Linking } from 'react-native';
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
  customerId: {
    name: string;
    phone: string;
  };
  createdAt: string;
}

export default function WorkerRequests() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchJobs();
    setupSocketListener();

    return () => {
      if (socketService.socket) {
        socketService.socket.off('job:newRequest');
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
      Alert.alert('Error', error.response?.data?.message || 'Failed to fetch jobs list');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const setupSocketListener = async () => {
    const socket = await socketService.connect();
    if (socket) {
      // Listen for new requests
      socket.on('job:newRequest', (data: any) => {
        // Map payload format to local Job model structure
        const newJob: Job = {
          _id: data.jobId,
          category: data.category,
          description: data.description,
          address: data.address,
          budget: data.budget,
          isEmergency: data.isEmergency,
          status: 'Pending',
          customerId: {
            name: data.customer.name,
            phone: data.customer.phone,
          },
          createdAt: data.createdAt || new Date().toISOString(),
        };

        setJobs((prevJobs) => [newJob, ...prevJobs]);
        Alert.alert(
          data.isEmergency ? '🚨 EMERGENCY REQUEST' : 'New Job Request',
          `You have a new request for ${data.category} service.`
        );
      });

      // Listen for cancellations or modifications from customer
      socket.on('job:statusUpdated', (data: { jobId: string; status: Job['status'] }) => {
        setJobs((prevJobs) =>
          prevJobs.map((job) =>
            job._id === data.jobId ? { ...job, status: data.status } : job
          )
        );
        if (data.status === 'Cancelled') {
          Alert.alert('Booking Cancelled', 'The customer has cancelled this booking request.');
        }
      });
    }
  };

  const handleRespond = async (jobId: string, action: 'accept' | 'reject') => {
    try {
      const response = await api.put(`/jobs/${jobId}/respond`, { action });
      if (response.data?.success) {
        setJobs((prevJobs) =>
          prevJobs.map((job) =>
            job._id === jobId
              ? { ...job, status: action === 'accept' ? 'Accepted' : 'Cancelled' }
              : job
          )
        );
        Alert.alert('Success', `You have ${action}ed the job request.`);
      }
    } catch (error: any) {
      console.error('Response Error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to respond to request');
    }
  };

  const handleCallCustomer = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Error', 'Unable to place call on this device.');
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'Pending': return '#FFB020';
      case 'Accepted': return COLORS.primary;
      case 'InProgress': return '#9C27B0';
      case 'Completed': return COLORS.success;
      case 'Cancelled': return COLORS.error;
      default: return COLORS.textLight;
    }
  };

  const renderJobRequestCard = ({ item }: { item: Job }) => {
    const isPending = item.status === 'Pending';
    const isAccepted = item.status === 'Accepted';

    return (
      <View style={[styles.card, item.isEmergency && styles.emergencyCardBorder]}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.categoryTitle}>{item.category}</Text>
            <Text style={styles.timeText}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
          </View>
        </View>

        {item.isEmergency && (
          <View style={styles.emergencyLabel}>
            <Ionicons name="warning" size={14} color={COLORS.error} />
            <Text style={styles.emergencyText}>URGENT EMERGENCY</Text>
          </View>
        )}

        <Text style={styles.description}>{item.description}</Text>

        <View style={styles.detailsRow}>
          <Ionicons name="location-outline" size={16} color={COLORS.textLight} />
          <Text style={styles.detailText} numberOfLines={2}>{item.address}</Text>
        </View>

        {item.budget && (
          <View style={styles.detailsRow}>
            <Ionicons name="cash-outline" size={16} color={COLORS.textLight} />
            <Text style={styles.detailText}>Offered Budget: ₹{item.budget}</Text>
          </View>
        )}

        <View style={styles.customerRow}>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{item.customerId.name}</Text>
            <Text style={styles.customerLabel}>Customer</Text>
          </View>
          {isAccepted && (
            <TouchableOpacity style={styles.callBtn} onPress={() => handleCallCustomer(item.customerId.phone)}>
              <Ionicons name="call" size={18} color={COLORS.surface} />
            </TouchableOpacity>
          )}
        </View>

        {isPending && (
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.rejectBtn]} 
              onPress={() => handleRespond(item._id, 'reject')}
            >
              <Text style={styles.rejectBtnText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.acceptBtn]} 
              onPress={() => handleRespond(item._id, 'accept')}
            >
              <Text style={styles.acceptBtnText}>Accept</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading requests...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={jobs}
        renderItem={renderJobRequestCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={60} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>No Requests Yet</Text>
            <Text style={styles.emptySub}>Make sure your Work Mode toggle is active to receive jobs.</Text>
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
  emergencyCardBorder: {
    borderColor: COLORS.error,
    borderWidth: 1.5,
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
  timeText: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
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
  emergencyLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  emergencyText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.error,
    marginLeft: 6,
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
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F7F8FC',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  customerLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },
  callBtn: {
    backgroundColor: COLORS.success,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionBtn: {
    flex: 0.48,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  rejectBtnText: {
    color: COLORS.error,
    fontWeight: 'bold',
  },
  acceptBtn: {
    backgroundColor: COLORS.primary,
  },
  acceptBtnText: {
    color: COLORS.surface,
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

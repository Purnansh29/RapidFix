import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { COLORS } from '../../constants/theme';
import AdminDrawer from '../../components/AdminDrawer';

export default function AdminJobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = async () => {
    try {
      const response = await api.get('/admin/jobs');
      if (response.data?.success) {
        setJobs(response.data.data);
      }
    } catch (error) {
      console.error('Fetch Admin Jobs Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchJobs();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return '#FFB020';
      case 'Accepted': return COLORS.primary;
      case 'InProgress': return '#9C27B0';
      case 'Completed': return COLORS.success;
      case 'Cancelled': return COLORS.error;
      default: return COLORS.textLight;
    }
  };

  const renderJobCard = ({ item }: { item: any }) => (
    <View style={[styles.card, item.isEmergency && styles.emergencyCardBorder]}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.categoryTitle}>{item.category}</Text>
          <Text style={styles.timeText}>
            {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.detailsRow}>
        <Ionicons name="location-outline" size={16} color={COLORS.textLight} />
        <Text style={styles.detailText} numberOfLines={2}>{item.address}</Text>
      </View>

      <View style={styles.participantsRow}>
        <View style={styles.participant}>
          <Text style={styles.participantLabel}>Customer</Text>
          <Text style={styles.participantName}>{item.customerId?.name || 'Unknown'}</Text>
        </View>
        <View style={styles.participant}>
          <Text style={styles.participantLabel}>Worker</Text>
          <Text style={styles.participantName}>{item.workerId?.name || 'Unassigned'}</Text>
        </View>
        <View style={styles.participant}>
          <Text style={styles.participantLabel}>Budget</Text>
          <Text style={styles.participantName}>₹{item.budget || 'N/A'}</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const [drawerVisible, setDrawerVisible] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.hamburgerBtn} onPress={() => setDrawerVisible(true)}>
          <Ionicons name="menu" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.headerTitle}>Job Monitor</Text>
          <Text style={styles.headerSubtitle}>Real-time Platform Service Requests</Text>
        </View>
      </View>

      <FlatList
        data={jobs}
        renderItem={renderJobCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Jobs Found</Text>
          </View>
        }
      />

      {/* Navigation Drawer */}
      <AdminDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  hamburgerBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  emergencyCardBorder: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  timeText: {
    fontSize: 12,
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
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginLeft: 6,
    flex: 1,
  },
  participantsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f1f1f1',
    paddingTop: 12,
  },
  participant: {
    flex: 1,
  },
  participantLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  participantName: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 16,
    color: COLORS.textLight,
  }
});

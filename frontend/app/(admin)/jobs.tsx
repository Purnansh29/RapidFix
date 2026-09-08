import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  RefreshControl, 
  TouchableOpacity,
  TextInput,
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { COLORS } from '../../constants/theme';
import AdminDrawer from '../../components/AdminDrawer';

type JobFilter = 'All' | 'Pending' | 'Active' | 'Completed' | 'Cancelled';

export default function AdminJobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [filter, setFilter] = useState<JobFilter>('All');
  const [search, setSearch] = useState('');

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/jobs');
      if (response.data?.success) {
        setJobs(response.data.data || []);
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
      case 'Pending': return '#F59E0B';
      case 'Accepted': return '#2563EB';
      case 'InProgress': return '#8B5CF6';
      case 'Completed': return '#10B981';
      case 'Cancelled': return '#EF4444';
      default: return '#64748B';
    }
  };

  const filteredJobs = jobs.filter(job => {
    // 1. Status Filter
    if (filter === 'Pending' && job.status !== 'Pending') return false;
    if (filter === 'Active' && job.status !== 'Accepted' && job.status !== 'InProgress') return false;
    if (filter === 'Completed' && job.status !== 'Completed') return false;
    if (filter === 'Cancelled' && job.status !== 'Cancelled') return false;

    // 2. Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const cat = (job.category || '').toLowerCase();
      const cust = (job.customerId?.name || '').toLowerCase();
      const worker = (job.workerId?.name || '').toLowerCase();
      const addr = (job.address || '').toLowerCase();
      return cat.includes(q) || cust.includes(q) || worker.includes(q) || addr.includes(q);
    }

    return true;
  });

  const renderJobCard = ({ item }: { item: any }) => {
    const formattedDate = item.createdAt 
      ? new Date(item.createdAt).toLocaleDateString() + ' ' + new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'Recent';

    return (
      <View style={[styles.card, item.isEmergency && styles.emergencyCardBorder]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {item.isEmergency && (
                <Text style={{ fontSize: 13, marginRight: 4 }}>🚨</Text>
              )}
              <Text style={styles.categoryTitle}>{item.category || 'General Service'}</Text>
            </View>
            <Text style={styles.timeText}>{formattedDate}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '18' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>
        </View>

        {item.description ? (
          <Text style={styles.jobDescription} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        <View style={styles.detailsRow}>
          <Ionicons name="location-outline" size={16} color="#64748B" />
          <Text style={styles.detailText} numberOfLines={2}>{item.address || 'Address not specified'}</Text>
        </View>

        <View style={styles.participantsRow}>
          <View style={styles.participant}>
            <Text style={styles.participantLabel}>CUSTOMER</Text>
            <Text style={styles.participantName}>{item.customerId?.name || 'Customer'}</Text>
            <Text style={styles.participantPhone}>{item.customerId?.phone || ''}</Text>
          </View>
          <View style={styles.participant}>
            <Text style={styles.participantLabel}>WORKER</Text>
            <Text style={styles.participantName}>{item.workerId?.name || 'Unassigned'}</Text>
            <Text style={styles.participantPhone}>{item.workerId?.phone || ''}</Text>
          </View>
          <View style={[styles.participant, { alignItems: 'flex-end' }]}>
            <Text style={styles.participantLabel}>BUDGET</Text>
            <Text style={styles.budgetAmount}>₹{item.budget || '0'}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Hamburger */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.hamburgerBtn} onPress={() => setDrawerVisible(true)}>
          <Ionicons name="menu" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.headerTitle}>Job Monitor</Text>
          <Text style={styles.headerSubtitle}>
            {jobs.length} Total Bookings Across RapidFix
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchJobs} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#2563EB" />
          ) : (
            <Ionicons name="refresh" size={20} color="#2563EB" />
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by customer, pro, category, address..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['All', 'Pending', 'Active', 'Completed', 'Cancelled'] as JobFilter[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, filter === tab && styles.filterTabActive]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[styles.filterTabText, filter === tab && styles.filterTabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Fetching all platform service jobs...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredJobs}
          renderItem={renderJobCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="briefcase-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Jobs Found</Text>
              <Text style={styles.emptySubtitle}>Try selecting another status tab or search query.</Text>
            </View>
          }
        />
      )}

      {/* Navigation Drawer */}
      <AdminDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
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
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterTabActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  emergencyCardBorder: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  timeText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  jobDescription: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 10,
    lineHeight: 17,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 6,
    flex: 1,
  },
  participantsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  participant: {
    flex: 1,
  },
  participantLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  participantName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  participantPhone: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  budgetAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10B981',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
});

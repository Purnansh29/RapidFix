import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Image,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import api from '../../services/api';
import AdminDrawer from '../../components/AdminDrawer';

interface Badge {
  name: string;
  icon: string;
  color: string;
}

interface WorkerPerformance {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email: string;
  profileImage?: string;
  category: string;
  experience: number;
  isVerified: boolean;
  isOnline: boolean;
  isAvailable: boolean;
  isActive: boolean;
  rating: number;
  totalRatings: number;
  jobsCompleted: number;
  cancellationRate: number;
  responseTime: string;
  acceptanceRate: string;
  totalEarnings: number;
  activeHours: string;
  complaints: number;
  badges: Badge[];
}

export default function WorkerPerformanceManagement() {
  const [workers, setWorkers] = useState<WorkerPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedBadgeFilter, setSelectedBadgeFilter] = useState<string>('All');
  const [drawerVisible, setDrawerVisible] = useState(false);

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/workers/performance');
      if (res.data?.success) {
        setWorkers(res.data.data || []);
      }
    } catch (e) {
      console.error('Error fetching worker performance:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPerformance();
  };

  const filteredWorkers = workers.filter(w => {
    const matchesSearch = 
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.category.toLowerCase().includes(search.toLowerCase()) ||
      w.phone.includes(search);

    if (!matchesSearch) return false;

    if (selectedBadgeFilter === 'All') return true;
    if (selectedBadgeFilter === 'Top Rated') return w.badges.some(b => b.name === 'Top Rated');
    if (selectedBadgeFilter === 'Fast Responder') return w.badges.some(b => b.name === 'Fast Responder');
    if (selectedBadgeFilter === 'Most Active') return w.badges.some(b => b.name === 'Most Active');
    if (selectedBadgeFilter === 'Trusted') return w.badges.some(b => b.name === 'Trusted Worker');

    return true;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.hamburgerBtn} onPress={() => setDrawerVisible(true)}>
          <Ionicons name="menu" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.headerTitle}>Worker Performance</Text>
          <Text style={styles.headerSubtitle}>
            KPIs, Ratings, Speed & Badges ({workers.length} Pros)
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchPerformance}>
          <Ionicons name="refresh" size={20} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <Ionicons name="search" size={18} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search worker by name, category, phone..."
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

      {/* Badge Filter Pills */}
      <View style={styles.badgeFilterRow}>
        {['All', 'Top Rated', 'Fast Responder', 'Most Active', 'Trusted'].map(b => (
          <TouchableOpacity
            key={b}
            style={[styles.filterPill, selectedBadgeFilter === b && styles.filterPillActive]}
            onPress={() => setSelectedBadgeFilter(b)}
          >
            <Text style={[styles.filterPillText, selectedBadgeFilter === b && styles.filterPillTextActive]}>
              {b === 'Top Rated' ? '🏆 Top Rated' : b === 'Fast Responder' ? '⚡ Fast' : b === 'Most Active' ? '🔥 Active' : b === 'Trusted' ? '✅ Trusted' : 'All'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Workers List */}
      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Calculating worker performance metrics...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredWorkers}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="ribbon-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No matching workers</Text>
              <Text style={styles.emptySubtitle}>Try changing your search or badge filter.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              {/* Card Top: Avatar, Name & Verification */}
              <View style={styles.cardHeader}>
                <Image
                  source={
                    item.profileImage
                      ? { uri: item.profileImage }
                      : require('../../assets/icon.png')
                  }
                  style={styles.avatar}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.workerName}>{item.name}</Text>
                    {item.isVerified && (
                      <Ionicons name="checkmark-circle" size={16} color="#2563EB" style={{ marginLeft: 4 }} />
                    )}
                  </View>
                  <Text style={styles.workerCategory}>{item.category} • {item.experience} yrs exp</Text>
                  <Text style={styles.workerContact}>{item.phone} • {item.email}</Text>
                </View>

                {/* Rating Badge */}
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                  <Text style={styles.ratingCount}>({item.totalRatings})</Text>
                </View>
              </View>

              {/* Earned Badges Row */}
              {item.badges.length > 0 && (
                <View style={styles.badgesRow}>
                  {item.badges.map((badge, idx) => (
                    <View key={idx} style={[styles.badgeTag, { borderColor: badge.color + '40', backgroundColor: badge.color + '15' }]}>
                      <Text style={{ fontSize: 11, marginRight: 4 }}>{badge.icon}</Text>
                      <Text style={[styles.badgeTagText, { color: badge.color }]}>{badge.name}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* 8 Comprehensive Performance Metrics Grid */}
              <View style={styles.metricsGrid}>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>COMPLETED</Text>
                  <Text style={styles.metricVal}>{item.jobsCompleted} jobs</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>CANCEL RATE</Text>
                  <Text style={[styles.metricVal, item.cancellationRate > 15 ? { color: '#EF4444' } : { color: '#10B981' }]}>
                    {item.cancellationRate}%
                  </Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>RESPONSE</Text>
                  <Text style={styles.metricVal}>{item.responseTime}</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>ACCEPT RATE</Text>
                  <Text style={styles.metricVal}>{item.acceptanceRate}</Text>
                </View>
              </View>

              <View style={[styles.metricsGrid, { marginTop: 6 }]}>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>TOTAL EARNINGS</Text>
                  <Text style={[styles.metricVal, { color: '#10B981' }]}>₹{item.totalEarnings}</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>ACTIVE HOURS</Text>
                  <Text style={styles.metricVal}>{item.activeHours}</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>COMPLAINTS</Text>
                  <Text style={[styles.metricVal, item.complaints > 0 ? { color: '#EF4444' } : { color: '#64748B' }]}>
                    {item.complaints} reported
                  </Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>STATUS</Text>
                  <Text style={[styles.metricVal, { color: item.isOnline ? '#10B981' : '#94A3B8' }]}>
                    {item.isOnline ? 'Online' : 'Offline'}
                  </Text>
                </View>
              </View>
            </View>
          )}
        />
      )}

      {/* Navigation Drawer */}
      <AdminDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 24,
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
  searchBarContainer: {
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
  badgeFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 12,
    color: '#64748B',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
  },
  workerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  workerCategory: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
    marginTop: 1,
  },
  workerContact: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
    marginLeft: 3,
  },
  ratingCount: {
    fontSize: 10,
    color: '#B45309',
    marginLeft: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 6,
  },
  badgeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 8,
    justifyContent: 'space-between',
  },
  metricBox: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.4,
  },
  metricVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 2,
  },
});

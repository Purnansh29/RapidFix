import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { COLORS } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import EditProfileModal from '../../components/EditProfileModal';
import AdminDrawer from '../../components/AdminDrawer';

const { width } = Dimensions.get('window');

interface ServiceDemandItem {
  category: string;
  count: number;
  completed: number;
  revenue: number;
  percentage: number;
}

export default function AdminDashboard() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const handleLogoutConfirm = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of your RapidFix Admin account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      if (response.data?.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Fetch Stats Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading Advanced Admin Insights...</Text>
      </View>
    );
  }

  // 7 Advanced Overview Metrics
  const advancedMetrics = stats ? [
    { label: 'Customers', value: stats.customers ?? 0, icon: 'people', color: '#2563EB', bg: '#EFF6FF', border: '#DBEAFE' },
    { label: 'Total Workers', value: stats.workers?.total ?? 0, icon: 'construct', color: '#0D9488', bg: '#F0FDFA', border: '#CCFBF1' },
    { label: 'Active Workers', value: stats.workers?.active ?? 0, icon: 'shield-checkmark', color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0' },
    { label: 'Online Workers', value: stats.workers?.online ?? 0, icon: 'wifi', color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE' },
    { label: "Today's Jobs", value: stats.jobs?.today ?? 0, icon: 'calendar', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
    { label: 'Completed Jobs', value: stats.jobs?.completed ?? 0, icon: 'checkmark-circle', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
    { label: 'Cancelled Jobs', value: stats.jobs?.cancelled ?? 0, icon: 'close-circle', color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
  ] : [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Hamburger & Profile */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.hamburgerBtn} onPress={() => setDrawerVisible(true)}>
          <Ionicons name="menu" size={24} color="#0F172A" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.headerProfile} 
          onPress={() => setShowEditModal(true)}
          activeOpacity={0.8}
        >
          <View style={styles.logoBox}>
            {user?.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.adminAvatarImage} />
            ) : (
              <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
            )}
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.headerTitle}>{user?.name || 'RapidFix Admin'}</Text>
              <Ionicons name="pencil-outline" size={13} color={COLORS.primary} style={{ marginLeft: 6 }} />
            </View>
            <Text style={styles.headerSubtitle}>Enterprise Console • Overview</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogoutConfirm} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Live Status Banner */}
        <View style={styles.welcomeBanner}>
          <View style={styles.welcomeLeft}>
            <Text style={styles.welcomeTitle}>Enterprise Control Center</Text>
            <Text style={styles.welcomeDesc}>Real-time platform operations, finances & service demand.</Text>
          </View>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        {/* Quick Launchpad to Modules */}
        <View style={styles.launchpadRow}>
          <TouchableOpacity 
            style={[styles.launchBtn, { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' }]}
            onPress={() => router.push('/(admin)/operations' as any)}
          >
            <Ionicons name="map" size={18} color="#2563EB" />
            <Text style={[styles.launchBtnText, { color: '#1E40AF' }]}>Live Map</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.launchBtn, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}
            onPress={() => router.push('/(admin)/performance' as any)}
          >
            <Ionicons name="ribbon" size={18} color="#D97706" />
            <Text style={[styles.launchBtnText, { color: '#92400E' }]}>Performance</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.launchBtn, { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' }]}
            onPress={() => router.push('/(admin)/finance' as any)}
          >
            <Ionicons name="wallet" size={18} color="#16A34A" />
            <Text style={[styles.launchBtnText, { color: '#166534' }]}>Finance</Text>
          </TouchableOpacity>
        </View>

        {/* 📊 1. Advanced Overview Metrics */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>📊 Advanced Platform Overview</Text>
          <Text style={styles.sectionMeta}>{stats?.jobs?.active ?? 0} active now</Text>
        </View>

        <View style={styles.metricsGrid}>
          {advancedMetrics.map((item, idx) => (
            <View key={idx} style={[styles.metricCard, { borderColor: item.border }]}>
              <View style={[styles.metricIconBox, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon as any} size={18} color={item.color} />
              </View>
              <Text style={styles.metricValue}>{item.value}</Text>
              <Text style={styles.metricLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Revenue Strip Card */}
        {stats && (
          <TouchableOpacity 
            style={styles.revenueCard}
            onPress={() => router.push('/(admin)/finance' as any)}
            activeOpacity={0.8}
          >
            <View style={styles.revenueLeft}>
              <View style={styles.revenueIconBox}>
                <Ionicons name="trending-up" size={22} color={COLORS.success} />
              </View>
              <View style={{ marginLeft: 14 }}>
                <Text style={styles.revenueLabel}>Platform Commission (10% Share)</Text>
                <Text style={styles.revenueValue}>₹{stats.financials?.totalRevenue ?? 0}</Text>
                <Text style={styles.revenueSub}>Today: ₹{stats.financials?.todayRevenue ?? 0} • This Week: ₹{stats.financials?.weeklyRevenue ?? 0}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
          </TouchableOpacity>
        )}

        {/* 📈 5. Business Analytics - Service Demand */}
        <View style={[styles.sectionHeaderRow, { marginTop: 22 }]}>
          <Text style={styles.sectionLabel}>📈 Business Analytics: Service Demand</Text>
          <Text style={styles.sectionMeta}>Volume Breakdown</Text>
        </View>

        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsDesc}>
            Real-time customer service requests categorized by category demand.
          </Text>

          {stats?.serviceDemand && stats.serviceDemand.map((item: ServiceDemandItem, index: number) => (
            <View key={index} style={styles.demandRow}>
              <View style={styles.demandHeader}>
                <Text style={styles.demandCategory}>{item.category}</Text>
                <Text style={styles.demandCount}>{item.count} jobs ({item.completed} completed)</Text>
              </View>
              <View style={styles.barBackground}>
                <View 
                  style={[
                    styles.barFill, 
                    { 
                      width: `${item.percentage}%`,
                      backgroundColor: index === 0 ? '#2563EB' : index === 1 ? '#0D9488' : index === 2 ? '#8B5CF6' : index === 3 ? '#F59E0B' : '#64748B'
                    }
                  ]} 
                />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
      />

      {/* Admin Navigation Drawer */}
      <AdminDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 13, color: '#64748B' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  hamburgerBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerProfile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    overflow: 'hidden',
  },
  adminAvatarImage: { width: '100%', height: '100%' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  headerSubtitle: { fontSize: 11, color: '#64748B', marginTop: 1 },
  logoutBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  content: { padding: 16, paddingBottom: 32 },
  welcomeBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  welcomeLeft: { flex: 1, marginRight: 12 },
  welcomeTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  welcomeDesc: { fontSize: 12, color: '#64748B', marginTop: 3 },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 5 },
  liveText: { fontSize: 10, fontWeight: '800', color: '#047857' },
  launchpadRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  launchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  launchBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  sectionLabel: { fontSize: 13, fontWeight: '800', color: '#1E293B', letterSpacing: 0.3 },
  sectionMeta: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    width: (width - 42) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    elevation: 1,
  },
  metricIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricValue: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  metricLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', marginTop: 2 },
  revenueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  revenueLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  revenueIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  revenueLabel: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  revenueValue: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  revenueSub: { fontSize: 10, color: '#10B981', fontWeight: '600', marginTop: 2 },
  analyticsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  analyticsDesc: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
  },
  demandRow: {
    marginBottom: 12,
  },
  demandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  demandCategory: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  demandCount: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  barBackground: {
    width: '100%',
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
});

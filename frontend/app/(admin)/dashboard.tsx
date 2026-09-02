import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { COLORS } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

export default function AdminDashboard() {
  const { logout } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const statItems = stats ? [
    { icon: 'people', label: 'Customers', value: stats.users ?? 0, iconColor: COLORS.primary, bgColor: '#EFF6FF', borderColor: '#DBEAFE' },
    { icon: 'construct', label: 'Professionals', value: stats.workers ?? 0, iconColor: '#0D9488', bgColor: '#F0FDFA', borderColor: '#CCFBF1' },
    { icon: 'time', label: 'Active Jobs', value: stats.jobs?.active ?? 0, iconColor: '#8B5CF6', bgColor: '#F5F3FF', borderColor: '#DDD6FE' },
    { icon: 'checkmark-done-circle', label: 'Completed', value: stats.jobs?.completed ?? 0, iconColor: COLORS.success, bgColor: '#ECFDF5', borderColor: '#A7F3D0' },
  ] : [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBox}>
            <Ionicons name="flash" size={20} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>RapidFix Admin</Text>
            <Text style={styles.headerSubtitle}>Platform Overview</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Banner */}
        <View style={styles.welcomeBanner}>
          <View style={styles.welcomeLeft}>
            <Text style={styles.welcomeTitle}>Good to see you!</Text>
            <Text style={styles.welcomeDesc}>Here's what's happening across the platform today.</Text>
          </View>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <Text style={styles.sectionLabel}>Key Metrics</Text>
        {stats && (
          <View style={styles.grid}>
            {statItems.map((item, idx) => (
              <View key={idx} style={[styles.statCard, { borderColor: item.borderColor }]}>
                <View style={[styles.statIconBox, { backgroundColor: item.bgColor }]}>
                  <Ionicons name={item.icon as any} size={22} color={item.iconColor} />
                </View>
                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Revenue */}
        {stats && (
          <View style={styles.revenueCard}>
            <View style={styles.revenueLeft}>
              <View style={styles.revenueIconBox}>
                <Ionicons name="trending-up" size={22} color={COLORS.success} />
              </View>
              <View style={{ marginLeft: 14 }}>
                <Text style={styles.revenueLabel}>Estimated Revenue Generated</Text>
                <Text style={styles.revenueValue}>₹{stats.revenue?.toFixed(2) ?? '0.00'}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
          </View>
        )}

        {/* Platform Health */}
        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Platform Health</Text>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
            <Ionicons name="hourglass-outline" size={20} color={COLORS.secondary} />
            <Text style={styles.summaryValue}>{stats?.jobs?.pending ?? 0}</Text>
            <Text style={[styles.summaryLabel, { color: '#92400E' }]}>Pending</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
            <Ionicons name="close-circle-outline" size={20} color={COLORS.error} />
            <Text style={styles.summaryValue}>{stats?.jobs?.cancelled ?? 0}</Text>
            <Text style={[styles.summaryLabel, { color: '#991B1B' }]}>Cancelled</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#F0FDFA', borderColor: '#CCFBF1' }]}>
            <Ionicons name="wifi" size={20} color="#0D9488" />
            <Text style={styles.summaryValue}>{stats?.onlineWorkers ?? 0}</Text>
            <Text style={[styles.summaryLabel, { color: '#0F766E' }]}>Online Pros</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14, backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logoBox: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#EFF6FF',
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
    borderWidth: 1, borderColor: '#DBEAFE',
  },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  headerSubtitle: { fontSize: 12, color: COLORS.textLight },
  logoutBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#FEF2F2',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FECACA',
  },
  content: { padding: 16, paddingBottom: 30 },
  welcomeBanner: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0',
    elevation: 2, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6,
  },
  welcomeLeft: { flex: 1 },
  welcomeTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  welcomeDesc: { fontSize: 13, color: COLORS.textLight, marginTop: 3, lineHeight: 18 },
  liveIndicator: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginLeft: 10,
    borderWidth: 1, borderColor: '#A7F3D0',
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.success, marginRight: 5 },
  liveText: { fontSize: 10, fontWeight: '800', color: COLORS.success, letterSpacing: 0.8 },
  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: COLORS.textLight,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
  statCard: {
    width: '48%', backgroundColor: COLORS.surface, padding: 16, borderRadius: 14,
    alignItems: 'center', marginBottom: 12, borderWidth: 1,
    elevation: 2, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6,
  },
  statIconBox: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  statValue: { fontSize: 28, fontWeight: '800', color: COLORS.text },
  statLabel: { fontSize: 12, color: COLORS.textLight, marginTop: 4, textAlign: 'center' },
  revenueCard: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#A7F3D0',
    elevation: 2, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6,
  },
  revenueLeft: { flexDirection: 'row', alignItems: 'center' },
  revenueIconBox: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center' },
  revenueLabel: { fontSize: 12, color: COLORS.textLight, fontWeight: '600' },
  revenueValue: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginTop: 2 },
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1 },
  summaryValue: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginTop: 8 },
  summaryLabel: { fontSize: 11, fontWeight: '600', marginTop: 3, textAlign: 'center' },
});

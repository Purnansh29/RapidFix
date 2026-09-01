import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Ionicons name="log-out-outline" size={24} color={COLORS.error} onPress={logout} style={{ padding: 8 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {stats && (
          <View style={styles.grid}>
            <View style={styles.statCard}>
              <Ionicons name="people-outline" size={32} color={COLORS.primary} />
              <Text style={styles.statValue}>{stats.users}</Text>
              <Text style={styles.statLabel}>Customers</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="construct-outline" size={32} color="#00BCD4" />
              <Text style={styles.statValue}>{stats.workers}</Text>
              <Text style={styles.statLabel}>Workers</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="briefcase-outline" size={32} color="#9C27B0" />
              <Text style={styles.statValue}>{stats.jobs?.active}</Text>
              <Text style={styles.statLabel}>Active Jobs</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="checkmark-done-circle-outline" size={32} color={COLORS.success} />
              <Text style={styles.statValue}>{stats.jobs?.completed}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>

            <View style={[styles.statCard, { width: '100%' }]}>
              <Ionicons name="cash-outline" size={32} color="#4CAF50" />
              <Text style={styles.statValue}>₹{stats.revenue?.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Est. Revenue</Text>
            </View>
          </View>
        )}
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  content: {
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 12,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
  }
});

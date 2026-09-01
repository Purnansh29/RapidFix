import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { COLORS } from '../../constants/theme';

export default function EarningsScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEarnings = async () => {
    try {
      const response = await api.get('/payments/earnings');
      if (response.data?.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Fetch Earnings Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchEarnings();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchEarnings();
  };

  const renderPaymentItem = ({ item }: { item: any }) => (
    <View style={styles.paymentCard}>
      <View style={styles.paymentLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name="cash-outline" size={22} color={COLORS.primary} />
        </View>
        <View>
          <Text style={styles.jobCategory}>{item.jobId?.category || 'Service Job'}</Text>
          <Text style={styles.customerName}>From: {item.customerId?.name || 'Customer'}</Text>
          <Text style={styles.dateText}>
            {new Date(item.createdAt).toLocaleDateString()} · {item.paymentMethod}
          </Text>
        </View>
      </View>
      <View style={styles.paymentRight}>
        <Text style={styles.amountText}>₹{item.amount}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'Completed' ? COLORS.success + '20' : '#FFB02020' }]}>
          <Text style={[styles.statusText, { color: item.status === 'Completed' ? COLORS.success : '#FFB020' }]}>
            {item.status}
          </Text>
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Ionicons name="wallet-outline" size={28} color={COLORS.surface} />
          <Text style={styles.summaryValue}>₹{data?.totalEarnings?.toFixed(2) || '0.00'}</Text>
          <Text style={styles.summaryLabel}>Total Earned</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#9C27B0' }]}>
          <Ionicons name="time-outline" size={28} color={COLORS.surface} />
          <Text style={styles.summaryValue}>₹{data?.pendingEarnings?.toFixed(2) || '0.00'}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
      </View>

      {/* Transaction History */}
      <Text style={styles.sectionTitle}>Transaction History</Text>

      <FlatList
        data={data?.history || []}
        renderItem={renderPaymentItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cash-outline" size={60} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>No Transactions Yet</Text>
            <Text style={styles.emptySub}>Complete jobs to start earning!</Text>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.surface,
    marginTop: 10,
  },
  summaryLabel: {
    fontSize: 13,
    color: COLORS.surface,
    opacity: 0.85,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  paymentCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  jobCategory: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  customerName: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  paymentRight: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statusBadge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySub: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 8,
  },
});

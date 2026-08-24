import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { COLORS, SIZES } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function WorkerDashboard() {
  const { user } = useAuthStore();
  const [isOnline, setIsOnline] = useState(false);

  const toggleOnline = () => setIsOnline(previousState => !previousState);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Good Morning, {user?.name}</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? COLORS.success : COLORS.textLight }]} />
            <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
            <Switch
              trackColor={{ false: COLORS.border, true: COLORS.success }}
              thumbColor={COLORS.surface}
              onValueChange={toggleOnline}
              value={isOnline}
              style={{ marginLeft: 'auto' }}
            />
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Today's Earnings</Text>
            <Text style={styles.statValue}>₹1,250</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Jobs Completed</Text>
            <Text style={styles.statValue}>4</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Rating</Text>
            <Text style={styles.statValue}>⭐ 4.8</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Recent Requests</Text>
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={48} color={COLORS.textLight} />
          <Text style={styles.emptyStateText}>No new requests nearby.</Text>
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
  header: {
    marginBottom: SIZES.lg,
  },
  greeting: {
    fontSize: SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SIZES.sm,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SIZES.md,
    borderRadius: SIZES.sm,
    elevation: 2,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SIZES.sm,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SIZES.xl,
  },
  statCard: {
    backgroundColor: COLORS.surface,
    width: '48%',
    padding: SIZES.lg,
    borderRadius: SIZES.sm,
    marginBottom: SIZES.md,
    elevation: 2,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: SIZES.xs,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: SIZES.md,
    color: COLORS.text,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.xl,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.sm,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyStateText: {
    marginTop: SIZES.md,
    color: COLORS.textLight,
    fontSize: 16,
  },
});

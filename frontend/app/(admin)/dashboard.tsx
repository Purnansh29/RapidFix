import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { COLORS, SIZES } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function AdminDashboard() {
  const { logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const adminMenu = [
    { title: 'Workers', icon: 'people', color: '#3B82F6' },
    { title: 'Customers', icon: 'person', color: '#10B981' },
    { title: 'Jobs', icon: 'briefcase', color: '#F59E0B' },
    { title: 'Commissions', icon: 'cash', color: '#8B5CF6' },
    { title: 'Live Map', icon: 'map', color: '#EF4444' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Admin Overview</Text>
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="log-out" size={28} color={COLORS.error} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>1,248</Text>
            <Text style={styles.statLabel}>Total Jobs</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>₹45K</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>156</Text>
            <Text style={styles.statLabel}>Workers</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Management</Text>
        <View style={styles.grid}>
          {adminMenu.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuCard}>
              <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon as any} size={32} color={item.color} />
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.xl,
  },
  title: {
    fontSize: SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.xl,
  },
  statBox: {
    backgroundColor: COLORS.surface,
    width: '31%',
    padding: SIZES.md,
    borderRadius: SIZES.sm,
    alignItems: 'center',
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: SIZES.md,
    color: COLORS.text,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuCard: {
    backgroundColor: COLORS.surface,
    width: '48%',
    padding: SIZES.lg,
    borderRadius: SIZES.sm,
    alignItems: 'center',
    marginBottom: SIZES.md,
    elevation: 2,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.sm,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
});

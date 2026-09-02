import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { COLORS, SIZES } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function CustomerHome() {
  const { user } = useAuthStore();
  const router = useRouter();

  const services = [
    { id: 1, name: 'Plumber', icon: 'water', color: '#0066FF' },
    { id: 2, name: 'Electrician', icon: 'flash', color: '#FFB020' },
    { id: 3, name: 'Carpenter', icon: 'hammer', color: '#8D6E63' },
    { id: 4, name: 'Painter', icon: 'color-palette', color: '#E91E63' },
    { id: 5, name: 'AC Technician', icon: 'snow', color: '#00BCD4' },
    { id: 6, name: 'Appliance Repair', icon: 'construct', color: '#FF5722' },
    { id: 7, name: 'Cleaning & Housekeeping', icon: 'sparkles', color: '#9C27B0' },
    { id: 8, name: 'Mechanic', icon: 'car', color: '#607D8B' },
    { id: 9, name: 'All Services', icon: 'apps', color: COLORS.primary, showAll: true },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {user?.name || 'Customer'}</Text>
          <Text style={styles.subtitle}>What do you need help with today?</Text>
        </View>

        <TouchableOpacity 
          style={styles.emergencyCard}
          onPress={() => router.push({
            pathname: '/(customer)/map',
            params: { emergency: 'true' }
          })}
        >
          <Ionicons name="warning" size={24} color={COLORS.surface} />
          <Text style={styles.emergencyText}>EMERGENCY SERVICE</Text>
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Service Categories</Text>
          <Text style={styles.sectionSubtitle}>Find verified pros near you</Text>
        </View>

        <View style={styles.grid}>
          {services.map((service) => (
            <TouchableOpacity 
              key={service.id} 
              style={styles.serviceCard}
              onPress={() => router.push({
                pathname: '/(customer)/map',
                params: service.showAll ? {} : { category: service.name }
              })}
            >
              <View style={[styles.iconContainer, { backgroundColor: service.color + '15' }]}>
                <Ionicons name={service.icon as any} size={28} color={service.color} />
              </View>
              <Text style={styles.serviceText} numberOfLines={2}>{service.name}</Text>
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
    paddingBottom: 40,
  },
  header: {
    marginBottom: SIZES.lg,
  },
  greeting: {
    fontSize: SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: SIZES.md,
    color: COLORS.textLight,
    marginTop: 2,
  },
  emergencyCard: {
    backgroundColor: COLORS.error,
    padding: SIZES.md,
    borderRadius: SIZES.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.xl,
    elevation: 3,
  },
  emergencyText: {
    color: COLORS.surface,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: SIZES.sm,
  },
  sectionHeader: {
    marginBottom: SIZES.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    backgroundColor: COLORS.surface,
    width: '48%',
    padding: SIZES.md,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: SIZES.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    minHeight: 110,
    justifyContent: 'center',
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
});

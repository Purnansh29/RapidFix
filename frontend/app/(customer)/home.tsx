import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { COLORS, SIZES } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function CustomerHome() {
  const { user } = useAuthStore();

  const services = [
    { id: 1, name: 'Plumber', icon: 'water' },
    { id: 2, name: 'Electrician', icon: 'flash' },
    { id: 3, name: 'Carpenter', icon: 'hammer' },
    { id: 4, name: 'Painter', icon: 'color-palette' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {user?.name || 'Customer'}</Text>
          <Text style={styles.subtitle}>What do you need help with today?</Text>
        </View>

        <TouchableOpacity style={styles.emergencyCard}>
          <Ionicons name="warning" size={24} color={COLORS.surface} />
          <Text style={styles.emergencyText}>EMERGENCY SERVICE</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.grid}>
          {services.map((service) => (
            <TouchableOpacity key={service.id} style={styles.serviceCard}>
              <Ionicons name={service.icon as any} size={32} color={COLORS.primary} />
              <Text style={styles.serviceText}>{service.name}</Text>
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
  serviceCard: {
    backgroundColor: COLORS.surface,
    width: '48%',
    padding: SIZES.lg,
    borderRadius: SIZES.sm,
    alignItems: 'center',
    marginBottom: SIZES.md,
    elevation: 2,
  },
  serviceText: {
    marginTop: SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
});

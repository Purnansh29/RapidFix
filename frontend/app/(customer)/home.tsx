import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function CustomerHome() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const services = [
    { id: 1, name: 'Plumber', icon: 'water', color: '#2563EB', bg: '#EFF6FF' },
    { id: 2, name: 'Electrician', icon: 'flash', color: '#D97706', bg: '#FEF3C7' },
    { id: 3, name: 'Carpenter', icon: 'hammer', color: '#92400E', bg: '#FDF6B2' },
    { id: 4, name: 'Painter', icon: 'color-palette', color: '#DB2777', bg: '#FCE7F3' },
    { id: 5, name: 'AC Technician', icon: 'snow', color: '#0284C7', bg: '#E0F2FE' },
    { id: 6, name: 'Appliance Repair', icon: 'construct', color: '#EA580C', bg: '#FFEDD5' },
    { id: 7, name: 'Cleaning & Maid', icon: 'sparkles', color: '#7C3AED', bg: '#EDE9FE' },
    { id: 8, name: 'Mechanic', icon: 'car', color: '#475569', bg: '#F1F5F9' },
    { id: 9, name: 'All Services', icon: 'grid', color: '#2563EB', bg: '#EFF6FF', showAll: true },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Top Header Bar */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <View>
              <Text style={styles.greetingTitle}>Hello, {user?.name || 'Customer'}</Text>
              <Text style={styles.greetingSubtitle}>Find reliable experts near you</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={() => logout()}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          </TouchableOpacity>
        </View>

        {/* Quick Search / Map Launcher */}
        <TouchableOpacity 
          style={styles.searchBar}
          activeOpacity={0.8}
          onPress={() => router.push('/(customer)/map')}
        >
          <Ionicons name="search-outline" size={20} color={COLORS.primary} style={{ marginRight: 10 }} />
          <Text style={styles.searchPlaceholder}>Search for plumbers, electricians, painters...</Text>
        </TouchableOpacity>

        {/* Emergency Service Banner */}
        <TouchableOpacity 
          style={styles.emergencyCard}
          activeOpacity={0.85}
          onPress={() => router.push({
            pathname: '/(customer)/map',
            params: { emergency: 'true' }
          })}
        >
          <View style={styles.emergencyIconBox}>
            <Ionicons name="flash" size={22} color="#DC2626" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.emergencyTitle}>EMERGENCY SERVICE</Text>
            <Text style={styles.emergencyDesc}>Need instant repair? Book an immediate arrival pro</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#DC2626" />
        </TouchableOpacity>

        {/* Service Categories Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Service Categories</Text>
          <TouchableOpacity onPress={() => router.push('/(customer)/map')}>
            <Text style={styles.viewAllText}>View on Map →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          {services.map((service) => (
            <TouchableOpacity 
              key={service.id} 
              style={styles.serviceCard}
              activeOpacity={0.7}
              onPress={() => router.push({
                pathname: '/(customer)/map',
                params: service.showAll ? {} : { category: service.name }
              })}
            >
              <View style={[styles.iconContainer, { backgroundColor: service.bg }]}>
                <Ionicons name={service.icon as any} size={28} color={service.color} />
              </View>
              <Text style={styles.serviceText} numberOfLines={2}>{service.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Trust Badges */}
        <View style={styles.trustSection}>
          <Text style={styles.trustTitle}>The RapidFix Guarantee</Text>
          <View style={styles.trustGrid}>
            <View style={styles.trustItem}>
              <View style={[styles.trustIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.trustItemTitle}>100% Verified</Text>
              <Text style={styles.trustItemDesc}>Background checked professionals</Text>
            </View>

            <View style={styles.trustItem}>
              <View style={[styles.trustIconBox, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="speedometer" size={20} color={COLORS.success} />
              </View>
              <Text style={styles.trustItemTitle}>Fast Arrival</Text>
              <Text style={styles.trustItemDesc}>Live GPS tracking to your door</Text>
            </View>

            <View style={styles.trustItem}>
              <View style={[styles.trustIconBox, { backgroundColor: '#FFFBEB' }]}>
                <Ionicons name="lock-closed" size={20} color={COLORS.secondary} />
              </View>
              <Text style={styles.trustItemTitle}>Fair Pricing</Text>
              <Text style={styles.trustItemDesc}>Clear estimates, no hidden fees</Text>
            </View>
          </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  userAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  greetingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  greetingSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  logoutBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  searchPlaceholder: {
    fontSize: 13,
    color: COLORS.textMuted,
    flex: 1,
  },
  emergencyCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
    ...SHADOWS.soft,
  },
  emergencyIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyTitle: {
    color: '#DC2626',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  emergencyDesc: {
    color: '#991B1B',
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    backgroundColor: COLORS.surface,
    width: '48%',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.soft,
    minHeight: 116,
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
  trustSection: {
    marginTop: 10,
    backgroundColor: COLORS.surface,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.soft,
  },
  trustTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 14,
    textAlign: 'center',
  },
  trustGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trustItem: {
    width: '31%',
    alignItems: 'center',
  },
  trustIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  trustItemTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  trustItemDesc: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 14,
  },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import EditProfileModal from '../../components/EditProfileModal';

export default function CustomerProfile() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [showEditModal, setShowEditModal] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of your RapidFix account?',
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            {user?.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.cameraIconBadge}
              onPress={() => setShowEditModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="camera" size={16} color={COLORS.surface} />
            </TouchableOpacity>
          </View>

          <Text style={styles.name}>{user?.name || 'Customer'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          {user?.phone ? <Text style={styles.phone}>{user.phone}</Text> : null}

          <View style={styles.badgeRow}>
            <View style={styles.roleBadge}>
              <Ionicons name="shield-checkmark" size={14} color="#0066FF" style={{ marginRight: 4 }} />
              <Text style={styles.roleBadgeText}>Customer Account</Text>
            </View>
          </View>

          {/* Edit Profile Action Button */}
          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => setShowEditModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="pencil" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.editProfileBtnText}>Edit Profile & Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Account Options</Text>

          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => router.push('/(customer)/jobs')}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="time" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuText}>My Bookings & History</Text>
              <Text style={styles.menuSubtext}>View active and completed jobs</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => setShowEditModal(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="person-circle-outline" size={20} color="#16A34A" />
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuText}>Profile Photo & Details</Text>
              <Text style={styles.menuSubtext}>Import image from gallery, update phone</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => {
              Alert.alert('RapidFix Support', 'For assistance, please email support@rapidfix.com or call our 24/7 hotline.');
            }}
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#FFFBEB' }]}>
              <Ionicons name="help-circle-outline" size={20} color="#D97706" />
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuText}>Help & Support</Text>
              <Text style={styles.menuSubtext}>Frequently asked questions & assistance</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>

        {/* Logout Section */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SIZES.lg,
    paddingBottom: 40,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 14,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#DBEAFE',
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
    ...SHADOWS.sm,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  email: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  phone: {
    fontSize: 13,
    color: COLORS.text,
    marginTop: 2,
    fontWeight: '500',
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  roleBadgeText: {
    fontSize: 12,
    color: '#0066FF',
    fontWeight: '600',
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  editProfileBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  menuSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuInfo: {
    flex: 1,
  },
  menuText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '600',
  },
  menuSubtext: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    ...SHADOWS.soft,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.error,
  },
});


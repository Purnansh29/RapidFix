import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { COLORS } from '../constants/theme';

const { width, height } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(width * 0.82, 320);

interface AdminDrawerProps {
  visible: boolean;
  onClose: () => void;
}

const MENU_ITEMS = [
  {
    title: 'Advanced Overview',
    subtitle: 'Platform KPIs & Demands',
    icon: 'stats-chart',
    route: '/(admin)/dashboard',
    badge: 'Live',
    badgeColor: '#10B981',
  },
  {
    title: 'Live Operations Center',
    subtitle: 'Real-time GPS Operations Map',
    icon: 'map',
    route: '/(admin)/operations',
    badge: 'Map',
    badgeColor: '#3B82F6',
  },
  {
    title: 'Worker Performance',
    subtitle: 'Ratings, Badges & Response',
    icon: 'ribbon',
    route: '/(admin)/performance',
    badge: 'KPIs',
    badgeColor: '#F59E0B',
  },
  {
    title: 'Financial Center',
    subtitle: 'Revenue, Commission & Invoices',
    icon: 'wallet',
    route: '/(admin)/finance',
    badge: 'Reports',
    badgeColor: '#8B5CF6',
  },
  {
    title: 'User Directory',
    subtitle: 'Manage Customers & Pros',
    icon: 'people',
    route: '/(admin)/users',
  },
  {
    title: 'Job Monitor',
    subtitle: 'All Bookings & Statuses',
    icon: 'briefcase',
    route: '/(admin)/jobs',
  },
];

export default function AdminDrawer({ visible, onClose }: AdminDrawerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleNavigate = (route: string) => {
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 150);
  };

  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out of the Admin Console?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            onClose();
            await logout();
          },
        },
      ]
    );
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        {/* Drawer Content */}
        <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
          {/* Header */}
          <View style={styles.drawerHeader}>
            <View style={styles.adminAvatar}>
              <Ionicons name="shield-checkmark" size={26} color="#2563EB" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.adminTitle}>RapidFix Admin</Text>
              <Text style={styles.adminRole}>Enterprise Control Center</Text>
              <Text style={styles.adminEmail} numberOfLines={1}>{user?.email || 'admin@rapidfix.com'}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Quick System Status Banner */}
          <View style={styles.systemStatusBanner}>
            <View style={styles.statusDot} />
            <Text style={styles.systemStatusText}>System Status: All Systems Operational</Text>
          </View>

          {/* Nav Items */}
          <View style={styles.menuContainer}>
            <Text style={styles.menuSectionHeader}>MANAGEMENT & ANALYTICS</Text>

            {MENU_ITEMS.map((item) => {
              const isActive = pathname === item.route;
              return (
                <TouchableOpacity
                  key={item.route}
                  style={[styles.menuItem, isActive && styles.menuItemActive]}
                  onPress={() => handleNavigate(item.route)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuIconBox, isActive && styles.menuIconBoxActive]}>
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color={isActive ? '#FFFFFF' : '#2563EB'}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.menuTitle, isActive && styles.menuTitleActive]}>
                      {item.title}
                    </Text>
                    <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                  </View>

                  {item.badge && (
                    <View style={[styles.badge, { backgroundColor: item.badgeColor || '#2563EB' }]}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Footer with Logout */}
          <View style={styles.drawerFooter}>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              <Text style={styles.logoutText}>Exit Admin Session</Text>
            </TouchableOpacity>
            <Text style={styles.versionText}>RapidFix Core Engine v2.4</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  drawer: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    display: 'flex',
    flexDirection: 'column',
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  adminAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
  },
  adminTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  adminRole: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '600',
    marginTop: 1,
  },
  adminEmail: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  systemStatusBanner: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#16A34A',
    marginRight: 8,
  },
  systemStatusText: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '600',
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  menuSectionHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginVertical: 3,
  },
  menuItemActive: {
    backgroundColor: '#EFF6FF',
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIconBoxActive: {
    backgroundColor: '#2563EB',
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  menuTitleActive: {
    color: '#1E40AF',
    fontWeight: '700',
  },
  menuSubtitle: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  drawerFooter: {
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    gap: 8,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 10,
  },
});

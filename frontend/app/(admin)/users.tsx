import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity, 
  Alert, 
  RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { COLORS, SIZES } from '../../constants/theme';

type FilterType = 'all' | 'pending' | 'workers' | 'customers';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      if (response.data?.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Fetch Users Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const pendingWorkersCount = useMemo(() => {
    return users.filter(
      u => u.role === 'worker' && u.workerProfile && !u.workerProfile.isVerified
    ).length;
  }, [users]);

  const filteredUsers = useMemo(() => {
    switch (filter) {
      case 'pending':
        return users.filter(u => u.role === 'worker' && u.workerProfile && !u.workerProfile.isVerified);
      case 'workers':
        return users.filter(u => u.role === 'worker');
      case 'customers':
        return users.filter(u => u.role === 'customer');
      default:
        return users;
    }
  }, [users, filter]);

  const handleToggleVerification = async (userId: string, currentVerified: boolean) => {
    try {
      setActionLoadingId(userId);
      const nextStatus = !currentVerified;
      const response = await api.put(`/admin/workers/${userId}/verify`, {
        isVerified: nextStatus,
      });

      if (response.data?.success) {
        Alert.alert(
          'Success',
          `Professional account has been ${nextStatus ? 'Approved' : 'Revoked'}.`
        );
        // Update local state
        setUsers(prev => prev.map(u => {
          if (u._id === userId && u.workerProfile) {
            return {
              ...u,
              workerProfile: {
                ...u.workerProfile,
                isVerified: nextStatus,
              }
            };
          }
          return u;
        }));
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update verification status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentActive: boolean) => {
    try {
      setActionLoadingId(userId);
      const response = await api.put(`/admin/users/${userId}/status`);
      if (response.data?.success) {
        const nextActive = response.data.data.isActive;
        Alert.alert(
          'Success', 
          `User is now ${nextActive ? 'Active' : 'Banned/Inactive'}`
        );
        setUsers(prev => prev.map(u => {
          if (u._id === userId) {
            return { ...u, isActive: nextActive };
          }
          return u;
        }));
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update user status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const renderUserCard = ({ item }: { item: any }) => {
    const isWorker = item.role === 'worker';
    const isVerified = item.workerProfile?.isVerified || false;
    const isActive = item.isActive !== false;
    const isProcessing = actionLoadingId === item._id;

    return (
      <View style={[styles.card, !isActive && styles.inactiveCard]}>
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <View style={[
              styles.avatar,
              { backgroundColor: isWorker ? '#0066FF20' : '#10B98120' }
            ]}>
              <Text style={[
                styles.avatarText,
                { color: isWorker ? COLORS.primary : COLORS.success }
              ]}>
                {item.name ? item.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>

            <View style={styles.details}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{item.name}</Text>
                <View style={[
                  styles.roleBadge,
                  { backgroundColor: isWorker ? '#0066FF15' : '#10B98115' }
                ]}>
                  <Text style={[
                    styles.roleText,
                    { color: isWorker ? COLORS.primary : COLORS.success }
                  ]}>
                    {isWorker ? 'PROFESSIONAL' : 'CUSTOMER'}
                  </Text>
                </View>
              </View>

              <Text style={styles.contactText}>📧 {item.email}</Text>
              <Text style={styles.contactText}>📞 {item.phone || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Worker Details Section */}
        {isWorker && item.workerProfile && (
          <View style={styles.workerMetaContainer}>
            <View style={styles.metaBadge}>
              <Ionicons name="construct" size={14} color="#0066FF" style={{ marginRight: 4 }} />
              <Text style={styles.metaBadgeText}>{item.workerProfile.category || 'Service Provider'}</Text>
            </View>

            <View style={styles.metaBadge}>
              <Ionicons name="time" size={14} color="#6B7280" style={{ marginRight: 4 }} />
              <Text style={styles.metaBadgeText}>{item.workerProfile.experience || 0} Yrs Exp</Text>
            </View>

            <View style={[
              styles.verificationBadge,
              { backgroundColor: isVerified ? '#E8F5E9' : '#FFF3E0' }
            ]}>
              <Ionicons 
                name={isVerified ? "shield-checkmark" : "time"} 
                size={14} 
                color={isVerified ? "#2E7D32" : "#E65100"} 
                style={{ marginRight: 4 }} 
              />
              <Text style={[
                styles.verificationBadgeText,
                { color: isVerified ? "#2E7D32" : "#E65100" }
              ]}>
                {isVerified ? 'Approved' : 'Pending Approval'}
              </Text>
            </View>
          </View>
        )}

        {/* Action Buttons Row */}
        <View style={styles.cardActions}>
          {isWorker && (
            <TouchableOpacity
              style={[
                styles.approveBtn,
                isVerified ? styles.revokeBtn : styles.confirmApproveBtn
              ]}
              onPress={() => handleToggleVerification(item._id, isVerified)}
              disabled={isProcessing}
            >
              <Ionicons 
                name={isVerified ? "close-circle-outline" : "checkmark-circle-outline"} 
                size={16} 
                color={isVerified ? "#E65100" : "#FFFFFF"} 
                style={{ marginRight: 4 }}
              />
              <Text style={[
                styles.approveBtnText,
                isVerified ? styles.revokeBtnText : styles.confirmApproveBtnText
              ]}>
                {isVerified ? 'Revoke Approval' : 'Approve Account'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[
              styles.statusToggleBtn,
              isActive ? styles.banBtn : styles.unbanBtn
            ]}
            onPress={() => handleToggleUserStatus(item._id, isActive)}
            disabled={isProcessing}
          >
            <Ionicons 
              name={isActive ? "ban-outline" : "refresh-outline"} 
              size={16} 
              color={isActive ? COLORS.error : COLORS.success} 
              style={{ marginRight: 4 }}
            />
            <Text style={[
              styles.statusToggleText,
              { color: isActive ? COLORS.error : COLORS.success }
            ]}>
              {isActive ? 'Ban' : 'Unban'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
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
        <Text style={styles.headerTitle}>User & Worker Management</Text>
        <Text style={styles.headerSubtitle}>Approve professional profiles and monitor accounts</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
            All ({users.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'pending' && styles.filterTabActive]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.filterTabText, filter === 'pending' && styles.filterTabTextActive]}>
            Pending
          </Text>
          {pendingWorkersCount > 0 && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{pendingWorkersCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'workers' && styles.filterTabActive]}
          onPress={() => setFilter('workers')}
        >
          <Text style={[styles.filterTabText, filter === 'workers' && styles.filterTabTextActive]}>
            Pros
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'customers' && styles.filterTabActive]}
          onPress={() => setFilter('customers')}
        >
          <Text style={[styles.filterTabText, filter === 'customers' && styles.filterTabTextActive]}>
            Customers
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredUsers}
        renderItem={renderUserCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>No users found in this filter</Text>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.surface,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  filterTabTextActive: {
    color: COLORS.surface,
  },
  pendingBadge: {
    backgroundColor: '#FF9900',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 4,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inactiveCard: {
    opacity: 0.7,
    borderColor: COLORS.error + '40',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  details: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  roleText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  contactText: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 1,
  },
  workerMetaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metaBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verificationBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
    gap: 8,
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  confirmApproveBtn: {
    backgroundColor: '#10B981',
  },
  confirmApproveBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  revokeBtn: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  revokeBtnText: {
    color: '#E65100',
    fontSize: 13,
    fontWeight: '600',
  },
  statusToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  banBtn: {
    borderColor: COLORS.error + '40',
    backgroundColor: COLORS.error + '10',
  },
  unbanBtn: {
    borderColor: COLORS.success + '40',
    backgroundColor: COLORS.success + '10',
  },
  statusToggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 15,
    color: COLORS.textLight,
    marginTop: 10,
  }
});

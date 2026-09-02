import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity, 
  Alert, 
  RefreshControl,
  Modal,
  ScrollView 
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

  // Detailed Modal State
  const [selectedUserDetails, setSelectedUserDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

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

  const openUserDetails = async (userId: string) => {
    try {
      setLoadingDetails(true);
      setDetailsModalVisible(true);
      const response = await api.get(`/admin/users/${userId}/details`);
      if (response.data?.success) {
        setSelectedUserDetails(response.data.data);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to load user details');
      setDetailsModalVisible(false);
    } finally {
      setLoadingDetails(false);
    }
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
        // Update local list state
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

        // Update modal state if open
        if (selectedUserDetails && selectedUserDetails.user._id === userId && selectedUserDetails.workerProfile) {
          setSelectedUserDetails((prev: any) => ({
            ...prev,
            workerProfile: {
              ...prev.workerProfile,
              isVerified: nextStatus,
            }
          }));
        }
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

        if (selectedUserDetails && selectedUserDetails.user._id === userId) {
          setSelectedUserDetails((prev: any) => ({
            ...prev,
            user: {
              ...prev.user,
              isActive: nextActive,
            }
          }));
        }
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

        {/* Worker Specific Metadata & Reviews Stats */}
        {isWorker && item.workerProfile && (
          <View style={styles.metaRowContainer}>
            <View style={styles.metaBadge}>
              <Ionicons name="construct" size={13} color="#0066FF" style={{ marginRight: 4 }} />
              <Text style={styles.metaBadgeText}>{item.workerProfile.category || 'Service Provider'}</Text>
            </View>

            <View style={styles.metaBadge}>
              <Ionicons name="time" size={13} color="#6B7280" style={{ marginRight: 4 }} />
              <Text style={styles.metaBadgeText}>{item.workerProfile.experience || 0} Yrs Exp</Text>
            </View>

            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={13} color="#FFB020" style={{ marginRight: 3 }} />
              <Text style={styles.ratingBadgeText}>
                {item.averageRating && item.averageRating > 0 ? item.averageRating.toFixed(1) : 'New'} ({item.reviewsCount || 0} reviews)
              </Text>
            </View>

            <View style={[
              styles.verificationBadge,
              { backgroundColor: isVerified ? '#E8F5E9' : '#FFF3E0' }
            ]}>
              <Ionicons 
                name={isVerified ? "shield-checkmark" : "time"} 
                size={13} 
                color={isVerified ? "#2E7D32" : "#E65100"} 
                style={{ marginRight: 3 }} 
              />
              <Text style={[
                styles.verificationBadgeText,
                { color: isVerified ? "#2E7D32" : "#E65100" }
              ]}>
                {isVerified ? 'Approved' : 'Pending Review'}
              </Text>
            </View>
          </View>
        )}

        {/* Customer Specific Metadata & Reviews Given */}
        {!isWorker && (
          <View style={styles.metaRowContainer}>
            <View style={styles.metaBadge}>
              <Ionicons name="briefcase-outline" size={13} color="#0066FF" style={{ marginRight: 4 }} />
              <Text style={styles.metaBadgeText}>
                {item.totalBookings || 0} Bookings ({item.completedBookings || 0} Completed)
              </Text>
            </View>

            <View style={styles.metaBadge}>
              <Ionicons name="chatbox-ellipses-outline" size={13} color="#10B981" style={{ marginRight: 4 }} />
              <Text style={styles.metaBadgeText}>
                ✍️ {item.reviewsGivenCount || 0} Reviews Given
              </Text>
            </View>
          </View>
        )}

        {/* Action Buttons Row */}
        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={styles.detailsBtn}
            onPress={() => openUserDetails(item._id)}
          >
            <Ionicons name="eye-outline" size={15} color={COLORS.primary} style={{ marginRight: 4 }} />
            <Text style={styles.detailsBtnText}>View Details & Reviews</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', gap: 6 }}>
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
                  size={14} 
                  color={isVerified ? "#E65100" : "#FFFFFF"} 
                  style={{ marginRight: 3 }}
                />
                <Text style={[
                  styles.approveBtnText,
                  isVerified ? styles.revokeBtnText : styles.confirmApproveBtnText
                ]}>
                  {isVerified ? 'Revoke' : 'Approve'}
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
                size={14} 
                color={isActive ? COLORS.error : COLORS.success} 
                style={{ marginRight: 3 }}
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
        <Text style={styles.headerTitle}>User & Professional Directory</Text>
        <Text style={styles.headerSubtitle}>Monitor profiles, review submissions, and manage accounts</Text>
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

      {/* Detailed Full Profile & Reviews Modal */}
      <Modal
        visible={detailsModalVisible}
        animationType="slide"
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>
              {selectedUserDetails?.user?.role === 'worker' ? 'Professional Profile' : 'Customer Profile'}
            </Text>
            <TouchableOpacity 
              style={styles.modalCloseBtn}
              onPress={() => setDetailsModalVisible(false)}
            >
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {loadingDetails || !selectedUserDetails ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={{ marginTop: 12, color: COLORS.textLight }}>Loading profile & reviews...</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              {/* User Identity Card */}
              <View style={styles.profileCard}>
                <View style={styles.profileRow}>
                  <View style={[
                    styles.modalAvatar,
                    { backgroundColor: selectedUserDetails.user.role === 'worker' ? '#0066FF20' : '#10B98120' }
                  ]}>
                    <Text style={[
                      styles.modalAvatarText,
                      { color: selectedUserDetails.user.role === 'worker' ? COLORS.primary : COLORS.success }
                    ]}>
                      {selectedUserDetails.user.name?.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={styles.profileName}>{selectedUserDetails.user.name}</Text>
                    <Text style={styles.profileContact}>📧 {selectedUserDetails.user.email}</Text>
                    <Text style={styles.profileContact}>📞 {selectedUserDetails.user.phone || 'N/A'}</Text>
                    <Text style={styles.profileJoinDate}>
                      🗓️ Joined: {new Date(selectedUserDetails.user.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                {/* Status Badges */}
                <View style={styles.modalBadgeRow}>
                  <View style={[
                    styles.modalStatusBadge,
                    { backgroundColor: selectedUserDetails.user.isActive !== false ? '#E8F5E9' : '#FFEBEE' }
                  ]}>
                    <Text style={{ 
                      fontSize: 12, 
                      fontWeight: 'bold', 
                      color: selectedUserDetails.user.isActive !== false ? '#2E7D32' : '#C62828' 
                    }}>
                      {selectedUserDetails.user.isActive !== false ? '● Account Active' : '● Account Banned'}
                    </Text>
                  </View>

                  {selectedUserDetails.user.role === 'worker' && selectedUserDetails.workerProfile && (
                    <View style={[
                      styles.modalStatusBadge,
                      { backgroundColor: selectedUserDetails.workerProfile.isVerified ? '#E8F5E9' : '#FFF3E0' }
                    ]}>
                      <Text style={{ 
                        fontSize: 12, 
                        fontWeight: 'bold', 
                        color: selectedUserDetails.workerProfile.isVerified ? '#2E7D32' : '#E65100' 
                      }}>
                        {selectedUserDetails.workerProfile.isVerified ? '✓ Verified Pro' : '⏳ Pending Approval'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Professional Specific Details */}
              {selectedUserDetails.user.role === 'worker' && selectedUserDetails.workerProfile && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionHeaderTitle}>Professional Info</Text>
                  <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Category</Text>
                      <Text style={styles.infoValue}>{selectedUserDetails.workerProfile.category}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Experience</Text>
                      <Text style={styles.infoValue}>{selectedUserDetails.workerProfile.experience} Years</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Avg Rating</Text>
                      <Text style={styles.infoValue}>⭐ {selectedUserDetails.workerProfile.rating?.toFixed(1) || '0.0'}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Total Reviews</Text>
                      <Text style={styles.infoValue}>{selectedUserDetails.reviews?.length || 0}</Text>
                    </View>
                  </View>
                  {selectedUserDetails.workerProfile.description ? (
                    <View style={{ marginTop: 10 }}>
                      <Text style={styles.infoLabel}>Bio / Description:</Text>
                      <Text style={styles.descText}>{selectedUserDetails.workerProfile.description}</Text>
                    </View>
                  ) : null}
                </View>
              )}

              {/* Reviews Section */}
              <View style={styles.detailSection}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={styles.sectionHeaderTitle}>
                    {selectedUserDetails.user.role === 'worker' 
                      ? `Reviews Received (${selectedUserDetails.reviews?.length || 0})` 
                      : `Reviews Given (${selectedUserDetails.reviews?.length || 0})`}
                  </Text>
                </View>

                {(!selectedUserDetails.reviews || selectedUserDetails.reviews.length === 0) ? (
                  <View style={styles.noDataBox}>
                    <Text style={styles.noDataText}>No reviews recorded yet.</Text>
                  </View>
                ) : (
                  selectedUserDetails.reviews.map((rev: any) => (
                    <View key={rev._id} style={styles.reviewCard}>
                      <View style={styles.reviewHeader}>
                        <View>
                          <Text style={styles.reviewerName}>
                            {selectedUserDetails.user.role === 'worker' 
                              ? (rev.customerId?.name || 'Customer')
                              : `To: ${rev.workerId?.name || 'Professional'}`}
                          </Text>
                          <Text style={styles.reviewDate}>
                            {new Date(rev.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                        <View style={styles.reviewStarBadge}>
                          <Ionicons name="star" size={13} color="#FFB020" />
                          <Text style={styles.reviewStarText}>{rev.rating} / 5</Text>
                        </View>
                      </View>
                      {rev.comment ? (
                        <Text style={styles.reviewComment}>"{rev.comment}"</Text>
                      ) : (
                        <Text style={styles.noCommentText}>No text comment provided.</Text>
                      )}
                    </View>
                  ))
                )}
              </View>

              {/* Recent Jobs / Bookings Section */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionHeaderTitle}>
                  {selectedUserDetails.user.role === 'worker' ? 'Recent Completed Jobs' : 'Recent Bookings Requested'}
                </Text>

                {(!selectedUserDetails.jobs || selectedUserDetails.jobs.length === 0) ? (
                  <View style={styles.noDataBox}>
                    <Text style={styles.noDataText}>No job history found.</Text>
                  </View>
                ) : (
                  selectedUserDetails.jobs.map((job: any) => (
                    <View key={job._id} style={styles.jobItemCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.jobCategory}>{job.category}</Text>
                        <Text style={styles.jobDesc} numberOfLines={1}>{job.description}</Text>
                        <Text style={styles.jobDate}>
                          {new Date(job.createdAt).toLocaleDateString()} • ₹{job.budget || 0}
                        </Text>
                      </View>
                      <View style={[
                        styles.jobStatusBadge,
                        { backgroundColor: job.status === 'Completed' ? '#E8F5E9' : '#E3F2FD' }
                      ]}>
                        <Text style={[
                          styles.jobStatusText,
                          { color: job.status === 'Completed' ? '#2E7D32' : '#1976D2' }
                        ]}>
                          {job.status}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>

              {/* Modal Bottom Actions */}
              <View style={styles.modalActionsRow}>
                {selectedUserDetails.user.role === 'worker' && selectedUserDetails.workerProfile && (
                  <TouchableOpacity
                    style={[
                      styles.modalActionBtn,
                      selectedUserDetails.workerProfile.isVerified ? styles.revokeBtn : styles.confirmApproveBtn
                    ]}
                    onPress={() => handleToggleVerification(selectedUserDetails.user._id, selectedUserDetails.workerProfile.isVerified)}
                  >
                    <Ionicons 
                      name={selectedUserDetails.workerProfile.isVerified ? "close-circle-outline" : "checkmark-circle-outline"} 
                      size={18} 
                      color={selectedUserDetails.workerProfile.isVerified ? "#E65100" : "#FFF"} 
                    />
                    <Text style={[
                      styles.modalActionBtnText,
                      selectedUserDetails.workerProfile.isVerified ? styles.revokeBtnText : { color: '#FFF' }
                    ]}>
                      {selectedUserDetails.workerProfile.isVerified ? 'Revoke Approval' : 'Approve Professional'}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.modalActionBtn,
                    selectedUserDetails.user.isActive !== false ? styles.banBtn : styles.unbanBtn
                  ]}
                  onPress={() => handleToggleUserStatus(selectedUserDetails.user._id, selectedUserDetails.user.isActive !== false)}
                >
                  <Ionicons 
                    name={selectedUserDetails.user.isActive !== false ? "ban-outline" : "refresh-outline"} 
                    size={18} 
                    color={selectedUserDetails.user.isActive !== false ? COLORS.error : COLORS.success} 
                  />
                  <Text style={[
                    styles.modalActionBtnText,
                    { color: selectedUserDetails.user.isActive !== false ? COLORS.error : COLORS.success }
                  ]}>
                    {selectedUserDetails.user.isActive !== false ? 'Ban User' : 'Unban User'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
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
    padding: 20,
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
    width: 44,
    height: 44,
    borderRadius: 22,
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
    fontSize: 15,
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
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 1,
  },
  metaRowContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
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
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.text,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  ratingBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B78103',
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verificationBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailsBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  confirmApproveBtn: {
    backgroundColor: '#10B981',
  },
  confirmApproveBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  revokeBtn: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  revokeBtnText: {
    color: '#E65100',
    fontSize: 12,
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
  },
  // Detailed Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  profileContact: {
    fontSize: 13,
    color: COLORS.text,
    marginBottom: 2,
  },
  profileJoinDate: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  modalBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  modalStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  detailSection: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoItem: {
    width: '46%',
    backgroundColor: COLORS.background,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  descText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
    marginTop: 2,
  },
  noDataBox: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 13,
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
  reviewCard: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  reviewDate: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  reviewStarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  reviewStarText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#B78103',
  },
  reviewComment: {
    fontSize: 13,
    color: COLORS.text,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  noCommentText: {
    fontSize: 12,
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
  jobItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  jobCategory: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  jobDesc: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  jobDate: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },
  jobStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  jobStatusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  modalActionBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

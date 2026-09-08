import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import api from '../../services/api';
import AdminDrawer from '../../components/AdminDrawer';

interface WorkerMarker {
  type: 'worker';
  id: string;
  workerId: string;
  name: string;
  phone: string;
  profileImage?: string;
  category: string;
  experience: number;
  rating: number;
  isOnline: boolean;
  isAvailable: boolean;
  operationalStatus: string;
  markerColor: string;
  latitude: number;
  longitude: number;
}

interface JobMarker {
  type: 'job';
  id: string;
  category: string;
  description: string;
  address: string;
  budget: number;
  status: string;
  isEmergency: boolean;
  operationalStatus: string;
  markerColor: string;
  customer?: { name: string; phone: string } | null;
  worker?: { name: string; phone: string } | null;
  latitude: number;
  longitude: number;
}

export default function LiveOperationsCenter() {
  const [workers, setWorkers] = useState<WorkerMarker[]>([]);
  const [jobs, setJobs] = useState<JobMarker[]>([]);
  const [counts, setCounts] = useState({
    availableWorkers: 0,
    busyWorkers: 0,
    onTheWayJobs: 0,
    activeJobs: 0,
    emergencyJobs: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<WorkerMarker | JobMarker | null>(null);
  const [filter, setFilter] = useState<'All' | 'Workers' | 'Jobs' | 'Emergency'>('All');
  const [drawerVisible, setDrawerVisible] = useState(false);

  const fetchLiveOperations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/live-operations');
      if (res.data?.success) {
        setWorkers(res.data.data.workers || []);
        setJobs(res.data.data.jobs || []);
        if (res.data.data.counts) {
          setCounts(res.data.data.counts);
        }
      }
    } catch (e: any) {
      console.error('Error loading live operations:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveOperations();
    const interval = setInterval(fetchLiveOperations, 15000); // 15s refresh
    return () => clearInterval(interval);
  }, []);

  const filteredWorkers = filter === 'Jobs' || filter === 'Emergency' ? [] : workers;
  const filteredJobs = filter === 'Workers' 
    ? [] 
    : filter === 'Emergency' 
      ? jobs.filter(j => j.isEmergency)
      : jobs;

  // Initial region centered on workers or jobs
  const centerLat = workers[0]?.latitude || jobs[0]?.latitude || 23.0225;
  const centerLng = workers[0]?.longitude || jobs[0]?.longitude || 72.5714;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.hamburgerBtn} onPress={() => setDrawerVisible(true)}>
          <Ionicons name="menu" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.headerTitle}>Live Operations Center</Text>
          <Text style={styles.headerSubtitle}>
            GPS Command • {workers.length} Pros • {jobs.length} Active Jobs
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchLiveOperations} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#2563EB" />
          ) : (
            <Ionicons name="refresh" size={20} color="#2563EB" />
          )}
        </TouchableOpacity>
      </View>

      {/* Operational Status Tickers */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tickersBar}>
        <View style={[styles.tickerBadge, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
          <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
          <Text style={[styles.tickerText, { color: '#065F46' }]}>
            {counts.availableWorkers} Available
          </Text>
        </View>

        <View style={[styles.tickerBadge, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
          <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
          <Text style={[styles.tickerText, { color: '#991B1B' }]}>
            {counts.busyWorkers} Busy
          </Text>
        </View>

        <View style={[styles.tickerBadge, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
          <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
          <Text style={[styles.tickerText, { color: '#92400E' }]}>
            {counts.onTheWayJobs} En Route
          </Text>
        </View>

        <View style={[styles.tickerBadge, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
          <View style={[styles.dot, { backgroundColor: '#3B82F6' }]} />
          <Text style={[styles.tickerText, { color: '#1E40AF' }]}>
            {counts.activeJobs} Active Jobs
          </Text>
        </View>

        <View style={[styles.tickerBadge, { backgroundColor: '#FEF2F2', borderColor: '#F87171' }]}>
          <Text style={{ fontSize: 11 }}>🚨</Text>
          <Text style={[styles.tickerText, { color: '#B91C1C', marginLeft: 4 }]}>
            {counts.emergencyJobs} Emergency
          </Text>
        </View>
      </ScrollView>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['All', 'Workers', 'Jobs', 'Emergency'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, filter === tab && styles.filterTabActive]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[styles.filterTabText, filter === tab && styles.filterTabTextActive]}>
              {tab === 'Emergency' ? '🚨 Emergency' : tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Map View */}
      <View style={styles.mapWrapper}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: centerLat,
            longitude: centerLng,
            latitudeDelta: 0.12,
            longitudeDelta: 0.12,
          }}
          showsCompass={true}
        >
          {/* Worker Markers */}
          {filteredWorkers.map(worker => (
            <Marker
              key={`worker-${worker.id}`}
              coordinate={{ latitude: worker.latitude, longitude: worker.longitude }}
              pinColor={worker.markerColor}
              title={`${worker.name} (${worker.operationalStatus})`}
              description={`${worker.category} • ⭐ ${worker.rating}`}
              onPress={() => setSelectedEntity(worker)}
            />
          ))}

          {/* Job Markers */}
          {filteredJobs.map(job => (
            <Marker
              key={`job-${job.id}`}
              coordinate={{ latitude: job.latitude, longitude: job.longitude }}
              pinColor={job.markerColor}
              title={`${job.isEmergency ? '🚨 EMERGENCY: ' : ''}${job.category} Job`}
              description={`Status: ${job.operationalStatus} • ₹${job.budget}`}
              onPress={() => setSelectedEntity(job)}
            />
          ))}
        </MapView>
      </View>

      {/* Detail Bottom Sheet Modal */}
      <Modal
        visible={!!selectedEntity}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedEntity(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />

            {selectedEntity?.type === 'worker' ? (
              <View>
                <View style={styles.sheetHeader}>
                  <Image
                    source={
                      selectedEntity.profileImage
                        ? { uri: selectedEntity.profileImage }
                        : require('../../assets/icon.png')
                    }
                    style={styles.entityAvatar}
                  />
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={styles.entityTitle}>{selectedEntity.name}</Text>
                    <Text style={styles.entitySub}>{selectedEntity.category} • {selectedEntity.experience} yrs experience</Text>
                    <View style={styles.ratingPill}>
                      <Ionicons name="star" size={13} color="#F59E0B" />
                      <Text style={styles.ratingPillText}>{selectedEntity.rating} Rating</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: selectedEntity.isAvailable ? '#DCFCE7' : '#FEE2E2' }]}>
                    <Text style={[styles.statusBadgeText, { color: selectedEntity.isAvailable ? '#166534' : '#991B1B' }]}>
                      {selectedEntity.operationalStatus}
                    </Text>
                  </View>
                </View>

                <View style={styles.sheetMetaRow}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>PHONE</Text>
                    <Text style={styles.metaValue}>{selectedEntity.phone || 'N/A'}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>GPS STATUS</Text>
                    <Text style={styles.metaValue}>{selectedEntity.isOnline ? '🟢 Live Broadcasting' : '⚪ Offline'}</Text>
                  </View>
                </View>
              </View>
            ) : selectedEntity?.type === 'job' ? (
              <View>
                <View style={styles.sheetHeader}>
                  <View style={[styles.jobIconBox, { backgroundColor: selectedEntity.isEmergency ? '#FEE2E2' : '#EFF6FF' }]}>
                    <Ionicons
                      name={selectedEntity.isEmergency ? 'alert-circle' : 'briefcase'}
                      size={26}
                      color={selectedEntity.isEmergency ? '#DC2626' : '#2563EB'}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={styles.entityTitle}>
                      {selectedEntity.isEmergency ? '🚨 ' : ''}{selectedEntity.category} Service
                    </Text>
                    <Text style={styles.entitySub} numberOfLines={2}>{selectedEntity.description}</Text>
                    <Text style={styles.jobBudget}>Budget: ₹{selectedEntity.budget}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: '#E0E7FF' }]}>
                    <Text style={[styles.statusBadgeText, { color: '#3730A3' }]}>
                      {selectedEntity.operationalStatus}
                    </Text>
                  </View>
                </View>

                <View style={styles.sheetMetaRow}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>CUSTOMER</Text>
                    <Text style={styles.metaValue}>{selectedEntity.customer?.name || 'Customer'} ({selectedEntity.customer?.phone || 'N/A'})</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>ASSIGNED WORKER</Text>
                    <Text style={styles.metaValue}>{selectedEntity.worker?.name || 'Unassigned'}</Text>
                  </View>
                </View>
                <View style={[styles.metaItem, { marginTop: 8 }]}>
                  <Text style={styles.metaLabel}>ADDRESS</Text>
                  <Text style={styles.metaValue}>{selectedEntity.address}</Text>
                </View>
              </View>
            ) : null}

            <TouchableOpacity style={styles.closeSheetBtn} onPress={() => setSelectedEntity(null)}>
              <Text style={styles.closeSheetBtnText}>Close Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Navigation Drawer */}
      <AdminDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 24,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  hamburgerBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tickersBar: {
    maxHeight: 44,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tickerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  tickerText: {
    fontSize: 11,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  filterTabActive: {
    backgroundColor: '#2563EB',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  mapWrapper: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    elevation: 24,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entityAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F1F5F9',
  },
  jobIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  entityTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  entitySub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  ratingPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
    marginLeft: 4,
  },
  jobBudget: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 3,
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sheetMetaRow: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 2,
  },
  closeSheetBtn: {
    marginTop: 20,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeSheetBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
});

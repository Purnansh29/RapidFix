import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SIZES } from '../../constants/theme';
import api from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { socketService } from '../../services/socket';

interface Worker {
  _id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  profileImage: string;
  category: string;
  experience: number;
  description: string;
  rating: number;
  totalRatings: number;
  completedJobs: number;
  location: [number, number]; // [longitude, latitude]
}

const CATEGORIES = [
  'All',
  'Plumber',
  'Electrician',
  'Painter',
  'Carpenter',
  'AC Technician',
  'Appliance Repair',
  'Cleaning & Housekeeping',
  'Mechanic',
];

export default function CustomerMap() {
  const params = useLocalSearchParams<{ category?: string; emergency?: string }>();
  const router = useRouter();

  const [selectedCategory, setSelectedCategory] = useState<string>(
    params.category && params.category !== 'All Services' ? params.category : 'All'
  );
  const [currentCoords, setCurrentCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fallback coordinates (Ahmedabad, India) if GPS is disabled or fails
  const FALLBACK_LAT = 23.0225;
  const FALLBACK_LNG = 72.5714;

  const fetchWorkers = async (lat: number, lng: number, cat?: string) => {
    try {
      setLoading(true);
      const categoryToFilter = cat !== undefined ? cat : selectedCategory;
      const apiParams: any = {
        latitude: lat,
        longitude: lng,
        radius: 50000, // 50km radius
      };

      if (categoryToFilter && categoryToFilter !== 'All') {
        apiParams.category = categoryToFilter;
      }

      const response = await api.get('/customer/workers/nearby', { params: apiParams });
      if (response.data?.success) {
        setWorkers(response.data.data);
      }
    } catch (e: any) {
      console.error('Error fetching nearby workers:', e);
      Alert.alert('Error', e.response?.data?.message || 'Failed to search for nearby workers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Location permission denied. Showing default area.');
          const coords = { latitude: FALLBACK_LAT, longitude: FALLBACK_LNG };
          setCurrentCoords(coords);
          await fetchWorkers(coords.latitude, coords.longitude, selectedCategory);
          return;
        }

        let currentLocation;
        try {
          currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const coords = {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          };
          if (isMounted) {
            setCurrentCoords(coords);
            await fetchWorkers(coords.latitude, coords.longitude, selectedCategory);
          }
        } catch (gpsError) {
          console.warn('GPS location request failed, using fallback:', gpsError);
          setErrorMsg('Unable to retrieve active location. Showing default area.');
          const coords = { latitude: FALLBACK_LAT, longitude: FALLBACK_LNG };
          if (isMounted) {
            setCurrentCoords(coords);
            await fetchWorkers(coords.latitude, coords.longitude, selectedCategory);
          }
        }
      } catch (err) {
        console.error('Location initialization error:', err);
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [selectedCategory]);

  // Setup Socket listener for live location & status updates
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const socket = await socketService.connect();
      if (socket && isMounted) {
        // Live Location updates
        socket.on('worker:locationUpdated', (data: { workerId: string, latitude: number, longitude: number }) => {
          setWorkers((prevWorkers) => {
            return prevWorkers.map((worker) => {
              if (worker.userId === data.workerId) {
                return { ...worker, location: [data.longitude, data.latitude] };
              }
              return worker;
            });
          });
          
          setSelectedWorker(prev => {
            if (prev && prev.userId === data.workerId) {
              return { ...prev, location: [data.longitude, data.latitude] };
            }
            return prev;
          });
        });

        // Live Status updates (when any worker turns online/offline)
        socket.on('worker:statusUpdated', (data: { workerId: string, isOnline: boolean, isAvailable: boolean }) => {
          if (currentCoords) {
            fetchWorkers(currentCoords.latitude, currentCoords.longitude, selectedCategory);
          }
        });
      }
    })();

    return () => {
      isMounted = false;
      if (socketService.socket) {
        socketService.socket.off('worker:locationUpdated');
        socketService.socket.off('worker:statusUpdated');
      }
    };
  }, [currentCoords, selectedCategory]);

  const getMarkerColor = (cat: string) => {
    switch (cat?.toLowerCase()) {
      case 'painter': return '#E91E63';
      case 'electrician': return '#FFB020';
      case 'carpenter': return '#8D6E63';
      case 'ac technician': return '#00BCD4';
      case 'appliance repair': return '#FF5722';
      case 'mechanic': return '#607D8B';
      default: return '#0066FF';
    }
  };

  if (loading && !currentCoords) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Locating nearby professionals...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.headerTitle}>
            {selectedCategory === 'All' ? 'All Active Professionals' : `${selectedCategory}s Nearby`}
          </Text>
          <Text style={styles.headerSubtitle}>
            🟢 {workers.length} {workers.length === 1 ? 'pro' : 'pros'} online & ready
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={() => currentCoords && fetchWorkers(currentCoords.latitude, currentCoords.longitude, selectedCategory)}
        >
          <Ionicons name="refresh" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Category Pills Filter */}
      <View style={styles.categoryPillsContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.categoryPillsList}
          renderItem={({ item }) => {
            const isActive = selectedCategory === item;
            return (
              <TouchableOpacity
                style={[
                  styles.categoryPill,
                  isActive && styles.categoryPillActive
                ]}
                onPress={() => {
                  setSelectedCategory(item);
                  setSelectedWorker(null);
                }}
              >
                <Text style={[
                  styles.categoryPillText,
                  isActive && styles.categoryPillTextActive
                ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {currentCoords && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: currentCoords.latitude,
            longitude: currentCoords.longitude,
            latitudeDelta: 0.08,
            longitudeDelta: 0.08,
          }}
          showsUserLocation={true}
          showsMyLocationButton={true}
          onPress={() => setSelectedWorker(null)}
        >
          {/* Nearby Worker Markers */}
          {workers.map((worker) => (
            <Marker
              key={worker._id}
              coordinate={{
                latitude: worker.location[1],
                longitude: worker.location[0],
              }}
              title={worker.name}
              description={`${worker.category} • ${worker.experience} yrs exp`}
              pinColor={getMarkerColor(worker.category)}
              onPress={(e) => {
                e.stopPropagation();
                setSelectedWorker(worker);
              }}
            />
          ))}
        </MapView>
      )}

      {/* Selected Worker Details Card */}
      {selectedWorker && (
        <View style={styles.cardContainer}>
          <View style={styles.workerCard}>
            <View style={styles.cardHeader}>
              <Image
                source={
                  selectedWorker.profileImage
                    ? { uri: selectedWorker.profileImage }
                    : require('../../assets/icon.png') // fallback placeholder
                }
                style={styles.avatar}
              />
              <View style={styles.workerInfo}>
                <Text style={styles.workerName}>{selectedWorker.name}</Text>
                <Text style={styles.workerCategory}>{selectedWorker.category}</Text>
                
                {/* Rating & Jobs */}
                <View style={styles.metaRow}>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={14} color="#FFB020" />
                    <Text style={styles.ratingText}>
                      {selectedWorker.rating > 0 ? selectedWorker.rating.toFixed(1) : 'New'}
                    </Text>
                  </View>
                  <Text style={styles.metaDivider}>•</Text>
                  <Text style={styles.experienceText}>{selectedWorker.experience} years exp</Text>
                </View>
              </View>
            </View>

            <Text style={styles.description} numberOfLines={2}>
              {selectedWorker.description || 'No description provided.'}
            </Text>

            <View style={styles.cardActionRow}>
              <TouchableOpacity 
                style={styles.detailsButton}
                onPress={() => {
                  router.push({
                    pathname: '/(customer)/book',
                    params: {
                      workerId: selectedWorker.userId,
                      workerName: selectedWorker.name,
                      category: selectedWorker.category,
                    }
                  });
                }}
              >
                <Text style={styles.detailsButtonText}>Book Service</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    minHeight: 56,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 1,
  },
  refreshButton: {
    padding: 6,
  },
  categoryPillsContainer: {
    position: 'absolute',
    top: 116,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  categoryPillsList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  categoryPillTextActive: {
    color: COLORS.surface,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SIZES.lg,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textLight,
  },
  cardContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  workerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.border,
  },
  workerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  workerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  workerCategory: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#B27800',
    marginLeft: 4,
  },
  metaDivider: {
    marginHorizontal: 8,
    color: COLORS.textLight,
  },
  experienceText: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  description: {
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 18,
    marginBottom: 16,
  },
  cardActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailsButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

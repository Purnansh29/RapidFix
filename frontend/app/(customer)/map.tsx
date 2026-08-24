import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { COLORS, SIZES } from '../../constants/theme';
import api from '../../services/api';

interface WorkerLocation {
  _id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
}

export default function CustomerMap() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [workers, setWorkers] = useState<WorkerLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // 1. Request foreground permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        Alert.alert('Permission Denied', 'We need your location to find nearby workers.');
        setLoading(false);
        return;
      }

      // 2. Get current location
      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);

      // 3. Fetch nearby workers (Mock logic until API is fully implemented)
      fetchNearbyWorkers(currentLocation.coords.latitude, currentLocation.coords.longitude);
    })();
  }, []);

  const fetchNearbyWorkers = async (lat: number, lng: number) => {
    try {
      // In a real scenario: await api.get(`/customer/nearby-workers?lat=${lat}&lng=${lng}`);
      // Mocking workers for demonstration:
      setWorkers([
        { _id: '1', name: 'John (Plumber)', category: 'Plumber', latitude: lat + 0.005, longitude: lng + 0.005 },
        { _id: '2', name: 'Mike (Electrician)', category: 'Electrician', latitude: lat - 0.008, longitude: lng - 0.002 },
      ]);
    } catch (e) {
      console.error('Error fetching workers', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {location && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          showsUserLocation={true}
        >
          {/* Render Nearby Workers */}
          {workers.map((worker) => (
            <Marker
              key={worker._id}
              coordinate={{ latitude: worker.latitude, longitude: worker.longitude }}
              title={worker.name}
              description={worker.category}
              pinColor="green" // Green for available workers
            />
          ))}
        </MapView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.lg,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 16,
    textAlign: 'center',
  },
});

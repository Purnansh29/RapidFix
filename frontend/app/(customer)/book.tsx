import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Switch, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SIZES } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import * as Location from 'expo-location';

export default function BookService() {
  const { workerId, workerName, category } = useLocalSearchParams<{ workerId: string; workerName: string; category: string }>();
  const router = useRouter();

  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [budget, setBudget] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setCoords({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          // Simple reverse geocoding to fill address field by default
          const geocode = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          if (geocode && geocode.length > 0) {
            const place = geocode[0];
            const addressString = `${place.name || ''} ${place.street || ''}, ${place.city || ''}, ${place.region || ''}`;
            setAddress(addressString.trim());
          }
        }
      } catch (err) {
        console.warn('Geocoding error:', err);
      }
    })();
  }, []);

  const handleBook = async () => {
    if (!description.trim()) {
      Alert.alert('Validation Error', 'Please describe the problem you need help with.');
      return;
    }
    if (!address.trim()) {
      Alert.alert('Validation Error', 'Please enter a valid address.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        workerId,
        category,
        description,
        address,
        latitude: coords?.latitude || 23.0225,
        longitude: coords?.longitude || 72.5714,
        budget: budget ? parseFloat(budget) : undefined,
        isEmergency,
      };

      const response = await api.post('/jobs', payload);
      if (response.data?.success) {
        Alert.alert('Success', 'Your booking request has been sent successfully!', [
          { text: 'View Bookings', onPress: () => router.replace('/(customer)/jobs') },
        ]);
      }
    } catch (error: any) {
      console.error('Booking Error:', error);
      Alert.alert('Booking Failed', error.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hire {workerName || 'Professional'}</Text>
        </View>

        {/* Worker & Service Info Summary */}
        <View style={styles.workerSummary}>
          <Ionicons name="build" size={24} color={COLORS.primary} style={styles.summaryIcon} />
          <View>
            <Text style={styles.summaryTitle}>{workerName}</Text>
            <Text style={styles.summarySub}>{category} Services</Text>
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Describe the issue / requirements *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="E.g., Kitchen sink is clogged and leaking under the counter..."
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            placeholderTextColor={COLORS.textLight}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Service Address *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter home/office address"
            value={address}
            onChangeText={setAddress}
            placeholderTextColor={COLORS.textLight}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Approximate Budget (Optional)</Text>
          <View style={styles.budgetInputContainer}>
            <Text style={styles.currencyPrefix}>₹</Text>
            <TextInput
              style={[styles.input, styles.budgetInput]}
              placeholder="e.g. 500"
              keyboardType="numeric"
              value={budget}
              onChangeText={setBudget}
              placeholderTextColor={COLORS.textLight}
            />
          </View>
        </View>

        {/* Emergency Toggle */}
        <View style={styles.emergencyCard}>
          <View style={styles.emergencyTextContainer}>
            <View style={styles.emergencyHeaderRow}>
              <Ionicons name="warning" size={20} color={COLORS.error} style={{ marginRight: 6 }} />
              <Text style={styles.emergencyLabel}>Urgent Emergency Request</Text>
            </View>
            <Text style={styles.emergencySub}>Requires immediate assistance. The worker will be alerted instantly.</Text>
          </View>
          <Switch
            value={isEmergency}
            onValueChange={setIsEmergency}
            trackColor={{ false: COLORS.border, true: COLORS.error }}
            thumbColor={COLORS.surface}
          />
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          style={[styles.bookButton, isEmergency && { backgroundColor: COLORS.error }]} 
          onPress={handleBook}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.surface} />
          ) : (
            <Text style={styles.bookButtonText}>Confirm Booking Request</Text>
          )}
        </TouchableOpacity>

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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.xl,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  workerSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: SIZES.xl,
    elevation: 1,
  },
  summaryIcon: {
    marginRight: 16,
    backgroundColor: '#F0F4FF',
    padding: 10,
    borderRadius: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  summarySub: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  formGroup: {
    marginBottom: SIZES.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  budgetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textLight,
    paddingLeft: 12,
  },
  budgetInput: {
    flex: 1,
    borderWidth: 0,
    paddingLeft: 4,
  },
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF0F0',
    borderColor: '#FFE0E0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: SIZES.xl,
  },
  emergencyTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  emergencyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  emergencyLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.error,
  },
  emergencySub: {
    fontSize: 11,
    color: '#8A5C5C',
    lineHeight: 14,
  },
  bookButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  bookButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

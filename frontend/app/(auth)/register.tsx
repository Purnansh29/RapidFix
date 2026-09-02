import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  ScrollView,
  Modal,
  FlatList 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { COLORS, SIZES } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const SERVICE_CATEGORIES = [
  { label: 'Plumber', icon: 'water-outline' },
  { label: 'Electrician', icon: 'flash-outline' },
  { label: 'Carpenter', icon: 'hammer-outline' },
  { label: 'Painter', icon: 'color-palette-outline' },
  { label: 'AC Technician', icon: 'snow-outline' },
  { label: 'Appliance Repair', icon: 'construct-outline' },
  { label: 'Cleaning & Housekeeping', icon: 'sparkles-outline' },
  { label: 'Mechanic', icon: 'car-outline' },
  { label: 'Other', icon: 'apps-outline' },
];

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'worker'>('customer');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [experience, setExperience] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { login } = useAuthStore();

  const selectedCategoryDisplay = category === 'Other' 
    ? (customCategory ? `Other: ${customCategory}` : 'Other (Specify below)') 
    : category;

  const handleRegister = async () => {
    if (!name || !email || !phone || !password) {
      Alert.alert('Error', 'Please fill in all basic fields');
      return;
    }

    const finalCategory = category === 'Other' ? customCategory.trim() : category;

    if (role === 'worker' && (!finalCategory || !experience)) {
      Alert.alert('Error', 'Please select a service category and enter your experience');
      return;
    }

    try {
      setLoading(true);
      const payload: any = { name, email, phone, password, role };
      if (role === 'worker') {
        payload.category = finalCategory;
        payload.experience = parseInt(experience, 10) || 1;
        payload.description = `I am a professional ${finalCategory}`;
      }

      const response = await api.post('/auth/register', payload);
      
      if (response.data.success) {
        if (role === 'worker') {
          Alert.alert(
            'Registration Submitted',
            'Your professional account has been registered! It will be reviewed and approved by the Admin team before you can start accepting jobs.',
            [
              {
                text: 'OK',
                onPress: async () => {
                  await login(response.data.user, response.data.token);
                }
              }
            ]
          );
        } else {
          await login(response.data.user, response.data.token);
        }
      }
    } catch (error: any) {
      Alert.alert('Registration Failed', error.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join RapidFix today</Text>

        <View style={styles.roleSelector}>
          <TouchableOpacity 
            style={[styles.roleButton, role === 'customer' && styles.roleButtonActive]}
            onPress={() => setRole('customer')}
          >
            <Ionicons name="person" size={20} color={role === 'customer' ? COLORS.surface : COLORS.textLight} />
            <Text style={[styles.roleText, role === 'customer' && styles.roleTextActive]}>Customer</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.roleButton, role === 'worker' && styles.roleButtonActive]}
            onPress={() => setRole('worker')}
          >
            <Ionicons name="briefcase" size={20} color={role === 'worker' ? COLORS.surface : COLORS.textLight} />
            <Text style={[styles.roleText, role === 'worker' && styles.roleTextActive]}>Professional</Text>
          </TouchableOpacity>
        </View>

        {role === 'worker' && (
          <View style={styles.approvalNotice}>
            <Ionicons name="shield-checkmark" size={20} color="#0066FF" style={{ marginRight: 8 }} />
            <Text style={styles.approvalNoticeText}>
              Professional accounts require one-time Admin verification before going live.
            </Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="John Doe"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="john@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="+91 9876543210"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {role === 'worker' && (
          <>
            {/* Service Category Dropdown Trigger */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Service Category</Text>
              <TouchableOpacity
                style={styles.dropdownTrigger}
                onPress={() => setShowCategoryModal(true)}
              >
                <Text style={category ? styles.dropdownSelectedText : styles.dropdownPlaceholderText}>
                  {category ? selectedCategoryDisplay : 'Select your profession / service'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>

            {category === 'Other' && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Specify Your Profession</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Locksmith, Roofer"
                  value={customCategory}
                  onChangeText={setCustomCategory}
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Years of Experience</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 5"
                value={experience}
                onChangeText={setExperience}
                keyboardType="numeric"
              />
            </View>
          </>
        )}

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleRegister} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.surface} />
          ) : (
            <Text style={styles.buttonText}>
              {role === 'worker' ? 'Submit for Approval' : 'Register'}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.footerLink}>Login here</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Category Dropdown Selection Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Service Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={SERVICE_CATEGORIES}
              keyExtractor={(item) => item.label}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.categoryOption,
                    category === item.label && styles.categoryOptionSelected
                  ]}
                  onPress={() => {
                    setCategory(item.label);
                    setShowCategoryModal(false);
                  }}
                >
                  <View style={styles.categoryOptionLeft}>
                    <Ionicons 
                      name={item.icon as any} 
                      size={22} 
                      color={category === item.label ? COLORS.primary : COLORS.text} 
                      style={{ marginRight: 12 }}
                    />
                    <Text style={[
                      styles.categoryOptionText,
                      category === item.label && styles.categoryOptionTextSelected
                    ]}>
                      {item.label}
                    </Text>
                  </View>
                  {category === item.label && (
                    <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flexGrow: 1,
    padding: SIZES.lg,
    justifyContent: 'center',
  },
  title: {
    fontSize: SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SIZES.xs,
  },
  subtitle: {
    fontSize: SIZES.md,
    color: COLORS.textLight,
    marginBottom: SIZES.lg,
  },
  roleSelector: {
    flexDirection: 'row',
    marginBottom: SIZES.md,
    gap: SIZES.md,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.md,
    borderRadius: SIZES.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SIZES.xs,
  },
  roleButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  roleText: {
    fontSize: 16,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  roleTextActive: {
    color: COLORS.surface,
  },
  approvalNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF3FF',
    padding: 12,
    borderRadius: SIZES.sm,
    marginBottom: SIZES.md,
    borderWidth: 1,
    borderColor: '#CCE0FF',
  },
  approvalNoticeText: {
    fontSize: 13,
    color: '#0052CC',
    flex: 1,
    lineHeight: 18,
  },
  inputContainer: {
    marginBottom: SIZES.md,
  },
  label: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: SIZES.xs,
    fontWeight: '600',
  },
  input: {
    backgroundColor: COLORS.surface,
    padding: SIZES.md,
    borderRadius: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 16,
  },
  dropdownTrigger: {
    backgroundColor: COLORS.surface,
    padding: SIZES.md,
    borderRadius: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownSelectedText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  dropdownPlaceholderText: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: SIZES.md,
    borderRadius: SIZES.sm,
    alignItems: 'center',
    marginTop: SIZES.md,
    elevation: 2,
  },
  buttonText: {
    color: COLORS.surface,
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SIZES.xl,
  },
  footerText: {
    color: COLORS.textLight,
    fontSize: 16,
  },
  footerLink: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  categoryOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  categoryOptionSelected: {
    backgroundColor: COLORS.primary + '10',
  },
  categoryOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryOptionText: {
    fontSize: 16,
    color: COLORS.text,
  },
  categoryOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});

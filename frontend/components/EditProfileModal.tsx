import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

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

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdated?: () => void;
  workerDetails?: {
    category?: string;
    experience?: number;
    description?: string;
  };
}

export default function EditProfileModal({
  visible,
  onClose,
  onUpdated,
  workerDetails,
}: EditProfileModalProps) {
  const { user, updateUser } = useAuthStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('');
  const [experience, setExperience] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setImageUri(user.profileImage || null);
      setImageBase64(null);

      if (user.role === 'worker') {
        setCategory(workerDetails?.category || '');
        setExperience(workerDetails?.experience !== undefined ? String(workerDetails.experience) : '');
        setDescription(workerDetails?.description || '');
      }
    }
  }, [visible, user, workerDetails]);

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library in settings to import a profile photo.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setImageUri(asset.uri);
        if (asset.base64) {
          setImageBase64(`data:image/jpeg;base64,${asset.base64}`);
        } else {
          setImageBase64(asset.uri);
        }
      }
    } catch (error) {
      console.error('Error importing image from gallery:', error);
      Alert.alert('Error', 'Unable to import photo. Please try again.');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Full Name is required.');
      return;
    }

    if (!phone.trim()) {
      Alert.alert('Validation Error', 'Phone Number is required.');
      return;
    }

    if (user?.role === 'worker') {
      if (!category.trim()) {
        Alert.alert('Validation Error', 'Service Category is required.');
        return;
      }
      if (!experience.trim()) {
        Alert.alert('Validation Error', 'Years of experience is required.');
        return;
      }
    }

    try {
      setSaving(true);

      const payload: any = {
        name: name.trim(),
        phone: phone.trim(),
      };

      if (imageBase64) {
        payload.profileImage = imageBase64;
      }

      if (user?.role === 'worker') {
        payload.category = category;
        payload.experience = parseInt(experience, 10) || 1;
        payload.description = description.trim();
      }

      const response = await api.put('/auth/profile', payload);

      if (response.data?.success) {
        if (response.data.user) {
          await updateUser(response.data.user);
        }

        Alert.alert('Success', 'Profile updated successfully!', [
          {
            text: 'OK',
            onPress: () => {
              onUpdated?.();
              onClose();
            },
          },
        ]);
      }
    } catch (error: any) {
      console.error('Save Profile Error:', error);
      Alert.alert(
        'Update Failed',
        error.response?.data?.message || 'Could not save profile changes. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const roleLabel =
    user?.role === 'admin'
      ? 'Administrator'
      : user?.role === 'worker'
      ? 'Professional'
      : 'Customer';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
        >
          <View style={styles.modalSheet}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <Text style={styles.headerSubtitle}>{roleLabel} Account</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.scrollBody}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              keyboardDismissMode="on-drag"
            >
              {/* Profile Photo Section */}
              <View style={styles.avatarSection}>
                <View style={styles.avatarContainer}>
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarInitial}>
                        {name ? name.charAt(0).toUpperCase() : 'U'}
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.cameraBadge}
                    onPress={handlePickImage}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="camera" size={16} color={COLORS.surface} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.importPhotoBtn}
                  onPress={handlePickImage}
                  activeOpacity={0.7}
                >
                  <Ionicons name="images-outline" size={17} color={COLORS.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.importPhotoText}>Import from Gallery</Text>
                </TouchableOpacity>
                <Text style={styles.photoHint}>Tap to choose a picture from your device</Text>
              </View>

              {/* Form Fields */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor={COLORS.textLight}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+91 9876543210"
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={[styles.input, styles.disabledInput]}
                  value={user?.email || ''}
                  editable={false}
                />
                <Text style={styles.helperText}>Email cannot be changed</Text>
              </View>

              {/* Worker-Specific Fields */}
              {user?.role === 'worker' && (
                <>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Service Category</Text>
                    <TouchableOpacity
                      style={styles.dropdownTrigger}
                      onPress={() => setShowCategoryPicker(true)}
                    >
                      <Text style={category ? styles.dropdownSelected : styles.dropdownPlaceholder}>
                        {category || 'Select service category'}
                      </Text>
                      <Ionicons name="chevron-down" size={18} color={COLORS.textLight} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Years of Experience</Text>
                    <TextInput
                      style={styles.input}
                      value={experience}
                      onChangeText={setExperience}
                      placeholder="e.g. 5"
                      placeholderTextColor={COLORS.textLight}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>About / Professional Bio</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={description}
                      onChangeText={setDescription}
                      placeholder="Describe your skills, services offered, and experience..."
                      placeholderTextColor={COLORS.textLight}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  </View>
                </>
              )}

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onClose}
                  disabled={saving}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color={COLORS.surface} size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={18} color={COLORS.surface} style={{ marginRight: 6 }} />
                      <Text style={styles.saveButtonText}>Save Changes</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>

      {/* Category Dropdown Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <View style={styles.pickerBackdrop}>
          <View style={styles.pickerContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Profession Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <Ionicons name="close" size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={SERVICE_CATEGORIES}
              keyExtractor={(item) => item.label}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.categoryItem,
                    category === item.label && styles.categoryItemSelected,
                  ]}
                  onPress={() => {
                    setCategory(item.label);
                    setShowCategoryPicker(false);
                  }}
                >
                  <View style={styles.categoryItemLeft}>
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color={category === item.label ? COLORS.primary : COLORS.text}
                      style={{ marginRight: 12 }}
                    />
                    <Text
                      style={[
                        styles.categoryItemText,
                        category === item.label && styles.categoryItemTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                  {category === item.label && (
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingBottom: 24,
    ...SHADOWS.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  scrollBody: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
  },
  avatarFallback: {
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
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.primary,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
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
  importPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  importPhotoText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  photoHint: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 6,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  disabledInput: {
    backgroundColor: '#F1F5F9',
    color: COLORS.textLight,
  },
  textArea: {
    minHeight: 70,
    paddingTop: 10,
  },
  helperText: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 4,
    marginLeft: 2,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownSelected: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  dropdownPlaceholder: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
    marginBottom: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.surface,
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  pickerContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    maxHeight: '70%',
    padding: 16,
    ...SHADOWS.lg,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  categoryItemSelected: {
    backgroundColor: COLORS.primaryLight,
  },
  categoryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryItemText: {
    fontSize: 14,
    color: COLORS.text,
  },
  categoryItemTextSelected: {
    fontWeight: '700',
    color: COLORS.primary,
  },
});

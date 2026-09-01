import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { COLORS, SIZES } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'worker'>('customer');
  const [category, setCategory] = useState('');
  const [experience, setExperience] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { login } = useAuthStore();

  const handleRegister = async () => {
    if (!name || !email || !phone || !password) {
      Alert.alert('Error', 'Please fill in all basic fields');
      return;
    }

    if (role === 'worker' && (!category || !experience)) {
      Alert.alert('Error', 'Worker category and experience are required');
      return;
    }

    try {
      setLoading(true);
      const payload: any = { name, email, phone, password, role };
      if (role === 'worker') {
        payload.category = category;
        payload.experience = parseInt(experience, 10) || 1;
        payload.description = `I am a professional ${category}`;
      }

      const response = await api.post('/auth/register', payload);
      
      if (response.data.success) {
        await login(response.data.user, response.data.token);
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
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Service Category</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Plumber, Electrician, Painter"
                value={category}
                onChangeText={setCategory}
              />
            </View>
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
            <Text style={styles.buttonText}>Register</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.footerLink}>Login here</Text>
          </TouchableOpacity>
        </View>
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
    marginBottom: SIZES.xl,
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
});

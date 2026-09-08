import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getBaseUrl = () => {
  // If running on web in browser, always connect to localhost
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  }

  // If deployed production cloud URL (HTTPS) is configured, use it
  if (process.env.EXPO_PUBLIC_API_URL && process.env.EXPO_PUBLIC_API_URL.startsWith('https://')) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Auto-detect dynamic host IP from Expo Metro bundler on physical device
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:5000/api`;
  }

  // Use configured env if available
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Fallback for Android emulator
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }

  return 'http://localhost:5000/api';
};

const API_URL = getBaseUrl();
console.log('[API Base URL]:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  timeout: 12000, // 12 seconds timeout to prevent indefinite hanging
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      error.message = 'Server connection timed out. Please verify backend is running on port 5000 and IP matches.';
    }
    return Promise.reject(error);
  }
);

export default api;

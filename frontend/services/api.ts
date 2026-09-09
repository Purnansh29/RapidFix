import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getBaseUrl = () => {
  // 1. If explicit env URL is configured
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2. If running on web in browser
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location?.hostname && window.location.hostname !== 'localhost') {
      return `http://${window.location.hostname}:5000/api`;
    }
    return 'http://localhost:5000/api';
  }

  // 3. Auto-detect dynamic host IP from Expo Metro bundler during local development
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoClient?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:5000/api`;
  }

  // 4. Standalone Mobile APK Production Cloud Backend
  return 'https://rapidfix-backend.onrender.com/api';
};

const API_URL = getBaseUrl();
console.log('[API Base URL]:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds timeout to handle Render cold starts
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
      error.message = 'Server is waking up. Please wait 10 seconds and try again.';
    } else if (!error.response) {
      error.message = 'Unable to connect to server. Please check your internet connection.';
    }
    return Promise.reject(error);
  }
);

export default api;

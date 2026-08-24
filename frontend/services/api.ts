import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Uses your local IP address for physical device testing if needed
// or localhost for emulators. Update this as necessary.
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.197.252.142:5000/api';

const api = axios.create({
  baseURL: API_URL,
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
    // Handle global 401 Unauthorized here if needed (e.g., logout user)
    return Promise.reject(error);
  }
);

export default api;

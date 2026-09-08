import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getBaseUrl = () => {
  // If running on web, always connect to localhost
  if (Platform.OS === 'web') {
    return 'http://localhost:5000';
  }

  // If deployed production cloud URL (HTTPS) is configured, use it
  if (process.env.EXPO_PUBLIC_API_URL && process.env.EXPO_PUBLIC_API_URL.startsWith('https://')) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/api$/, '');
  }

  // Auto-detect dynamic host IP from Expo Metro bundler on physical device
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:5000`;
  }

  // If env is defined
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/api$/, '');
  }

  // Fallback for Android emulator
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000';
  }

  return 'http://localhost:5000';
};

const SOCKET_URL = getBaseUrl();

class SocketService {
  public socket: Socket | null = null;

  async connect() {
    if (this.socket) {
      return this.socket;
    }

    const token = await SecureStore.getItemAsync('userToken');
    
    if (!token) {
      console.warn('Socket connect failed: No token found');
      return null;
    }

    try {
      this.socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 5,
      });

      this.socket.on('connect', () => {
        console.log('Socket connected successfully:', this.socket?.id);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });

      return this.socket;
    } catch (error) {
      console.error('Socket initialization error:', error);
      return null;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();

import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    // If the API URL is defined, remove /api if present to get the root URL for socket.io
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/api$/, '');
  }
  
  if (Platform.OS === 'web') {
    return 'http://localhost:5000';
  }

  // Auto-detect host IP on physical devices/emulators
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:5000`;
  }

  // Fallback for emulators (Android uses 10.0.2.2 for host localhost loopback)
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

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();

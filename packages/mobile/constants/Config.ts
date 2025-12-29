import { Platform } from 'react-native';

// For Android Emulator, use 10.0.2.2. For iOS Simulator, use localhost.
// If testing on real device, replace with your machine's local IP (e.g., http://192.168.1.100:3000)
const SERVER_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_URL = `http://${SERVER_HOST}:3000`;
export const MEDIA_URL = `http://${SERVER_HOST}:3000`; // Or MinIO/CDN URL if different

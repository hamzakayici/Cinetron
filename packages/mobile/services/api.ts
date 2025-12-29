import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const DEFAULT_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
export const DEFAULT_API_URL = `http://${DEFAULT_HOST}:3000/api`;

const api = axios.create({
    baseURL: DEFAULT_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to attach the token
api.interceptors.request.use(async (config) => {
    try {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Dynamically load auth base URL if set
        const customUrl = await SecureStore.getItemAsync('serverUrl');
        if (customUrl) {
            config.baseURL = customUrl;
        }
    } catch (error) {
        console.error("Error retrieving token/url", error);
    }
    return config;
});

export const setAuthToken = async (token: string) => {
    await SecureStore.setItemAsync('token', token);
};

export const clearAuthToken = async () => {
    await SecureStore.deleteItemAsync('token');
};

export const setServerUrl = async (url: string) => {
    // Remove trailing slash if present
    let cleanUrl = url.replace(/\/$/, "");
    // Automatically append /api if not present
    if (!cleanUrl.endsWith('/api')) {
        cleanUrl += '/api';
    }
    await SecureStore.setItemAsync('serverUrl', cleanUrl);
    api.defaults.baseURL = cleanUrl;
};

export const getServerUrl = async () => {
    return await SecureStore.getItemAsync('serverUrl') || DEFAULT_API_URL;
};

export default api;

import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Use production backend
export const DEFAULT_API_URL = 'https://media.hazelify.com/api';

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

// Media API
export const getLibrary = async () => {
    const response = await api.get('/media');
    return response.data;
};

export const getMediaDetail = async (id: string) => {
    const response = await api.get(`/media/${id}`);
    return response.data;
};

export const getEpisodeDetail = async (id: string) => {
    const response = await api.get(`/media/episode/${id}`);
    return response.data;
};

export const getHistory = async () => {
    const response = await api.get('/media/history');
    return response.data;
};

export const getFavorites = async () => {
    const response = await api.get('/media/favorites');
    return response.data;
};

export const toggleFavorite = async (mediaId: string) => {
    const response = await api.post(`/media/${mediaId}/favorite`);
    return response.data;
};

export const getSubtitles = async (mediaId: string) => {
    const response = await api.get(`/media/${mediaId}/subtitles`);
    return response.data;
};

export default api;


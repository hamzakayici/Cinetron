import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// This will be determined after viewing the file
// Add a request interceptor to include the auth token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Add a response interceptor to handle 401 errors
api.interceptors.response.use((response) => {
    return response;
}, (error) => {
    if (error.response && error.response.status === 401) {
        // Clear token and redirect to login if unauthorized
        // careful with loops here if the 401 comes from a public endpoint
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/setup')) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
    }
    return Promise.reject(error);
});

// Define API methods
export const getMedia = () => api.get<any[]>('/media');
export const getMediaDetail = (id: string) => api.get<any>(`/media/${id}`);

// History & Favorites
export const getHistory = () => api.get<any[]>('/media/user/history');
export const getFavorites = () => api.get<any[]>('/media/user/favorites');
export const addFavorite = (id: string) => api.post(`/media/${id}/favorite`);
export const removeFavorite = (id: string) => api.delete(`/media/${id}/favorite`);
export const checkFavorite = (id: string) => api.get<{ isFavorite: boolean }>(`/media/${id}/favorite`);

// System
export const getSystemStats = () => api.get('/system/stats');

export default api;

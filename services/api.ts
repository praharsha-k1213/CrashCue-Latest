import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/constants/Config';
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem('CRASHCUE_TOKEN');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error getting token:', error);
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
        if (error.response?.status === 401) {
            await AsyncStorage.removeItem('CRASHCUE_TOKEN');
            await AsyncStorage.removeItem('CRASHCUE_USER');
        }
        return Promise.reject(error);
    }
);
export default api;
export const authAPI = {
    googleSignIn: async (idToken: string) => {
        const response = await api.post('/auth/google', { idToken });
        return response.data;
    },
    login: async (username: string, password: string) => {
        const response = await api.post('/auth/login', { username, password });
        return response.data;
    },
    register: async (username: string, email: string, password: string) => {
        const response = await api.post('/auth/register', { username, email, password });
        return response.data;
    },
    verifyToken: async (token: string) => {
        const response = await api.post('/auth/verify', { token });
        return response.data;
    },
};
export const conversationAPI = {
    getConversations: async (params?: { limit?: number; offset?: number; category?: string }) => {
        const response = await api.get('/conversations', { params });
        return response.data;
    },
    saveConversation: async (data: any) => {
        const response = await api.post('/conversations', data);
        return response.data;
    },
};
export const trainingAPI = {
    getTrainingData: async (params?: { limit?: number; offset?: number; category?: string }) => {
        const response = await api.get('/training', { params });
        return response.data;
    },
    saveTrainingData: async (data: any) => {
        const response = await api.post('/training', data);
        return response.data;
    },
    deleteTrainingData: async (id: number) => {
        const response = await api.delete(`/training/${id}`);
        return response.data;
    },
};
export const statsAPI = {
    getStats: async () => {
        const response = await api.get('/stats');
        return response.data;
    },
};
export const aiAPI = {
    chat: async (message: string, context?: any) => {
        const response = await api.post('/ai/chat', { message, context });
        return response.data;
    },
};

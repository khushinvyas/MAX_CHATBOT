// @ts-ignore: axios types may be missing in some environments
import axios from 'axios';

// Add vite env type for import.meta.env
/// <reference types="vite/client" />

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://max-chatbot-vkds.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
}

export interface ChatMessage {
  question: string;
  response?: string;
  error?: string;
}

export const authAPI = {
  login: async (credentials: LoginCredentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  
  register: async (data: RegisterData) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
};

export const chatAPI = {
  sendMessage: async (message: string, customerName?: string, language: string = 'en') => {
    const response = await api.post('/chat', { message, customerName, language });
    return response.data;
  },
  // Streaming version
  streamChat: async (
    message: string,
    customerName?: string,
    language: string = 'en',
    onChunk?: (chunk: string) => void
  ) => {
    const res = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, customerName, language }),
    });
    if (!res.body) throw new Error('No response body');
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      if (value && onChunk) {
        onChunk(decoder.decode(value));
      }
    }
  },
};

export const fileAPI = {
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  listFiles: async () => {
    const response = await api.get('/files/list');
    return response.data;
  },

  deleteFile: async (filename: string) => {
    const response = await api.delete(`/files/${filename}`);
    return response.data;
  },
};

export default api; 
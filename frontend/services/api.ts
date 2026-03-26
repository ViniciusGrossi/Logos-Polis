import axios from 'axios';

// Instância base configurada para requisições do sistema
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor: Injetar token de Auth se existir no futuro
api.interceptors.request.use(
  (config) => {
    // Exemplo: const token = localStorage.getItem('@Logos:token');
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Tratamento global de erros
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Tratar erros 401 (Token Expirado)
    if (error.response?.status === 401) {
      console.error('Sessão expirada. Redirecionando para login...');
      // window.location.href = '/login';
    }
    
    // Logar erros de API para debugging (remover em PRD)
    console.error(`[API Error] ${error.config?.url}:`, error.message);
    
    return Promise.reject(error);
  }
);

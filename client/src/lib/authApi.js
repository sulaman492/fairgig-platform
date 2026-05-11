import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ;

export const authApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise = null;

const shouldBypassRefresh = (config) => {
  const url = config?.url || '';
  return url.includes('/api/auth/login') ||
    url.includes('/api/auth/signup') ||
    url.includes('/api/auth/refresh');
};

authApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (error.response?.status !== 401 || originalRequest._retry || shouldBypassRefresh(originalRequest)) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = authApi.post('/api/auth/refresh');
      }

      await refreshPromise;
      refreshPromise = null;

      return authApi(originalRequest);
    } catch (refreshError) {
      refreshPromise = null;
      return Promise.reject(refreshError);
    }
  }
);

export const getApiErrorMessage = (error, fallbackMessage) => {
  return error?.response?.data?.error || fallbackMessage;
};

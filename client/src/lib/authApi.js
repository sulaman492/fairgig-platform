import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ;

export const authApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getApiErrorMessage = (error, fallbackMessage) => {
  return error?.response?.data?.error || fallbackMessage;
};

// src/services/api.ts
import axios from 'axios';

/*
  Centralized Axios instance configuration for ScentHub API client.
  Points to the local Django server instance.
*/
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // URL padrão do seu servidor Django
  timeout: 10000, // Cancela a requisição se o back demorar mais de 10 segundos
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

/*
  Axios Interceptor to inject authentication tokens or handle global errors.
  Keeps developer logs in English.
*/
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("axis_access_token");
    if (token) {
      // Adiciona o token ao cabeçalho de autorização padrão
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
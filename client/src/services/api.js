import axios from 'axios';

const api = axios.create({
    baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add company ID and auth token
api.interceptors.request.use(config => {
    const companyId = localStorage.getItem('selectedCompany');
    const token = localStorage.getItem('token');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    if (companyId && config.method !== 'get') {
        // For POST/PUT, add to body if JSON
        if (config.data && typeof config.data === 'object') {
             config.data.company = companyId;
        }
    }
    return config;
}, error => {
    return Promise.reject(error);
});

// Response interceptor — handle expired tokens
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            // Token expired or invalid — clean up and redirect
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Only redirect if not already on login
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;

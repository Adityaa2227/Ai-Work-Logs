const api = axios.create({
    baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add company ID
api.interceptors.request.use(config => {
    const companyId = localStorage.getItem('selectedCompany');
    if (companyId && config.method !== 'get') {
        // For POST/PUT, add to body if JSON
        if (config.data && typeof config.data === 'object') {
             config.data.company = companyId;
        }
    }
    // Also add as query param for GET requests automatically? 
    // It's safer to handle in hooks, but let's add a header for global context if needed.
    // Actually, for query params, let's keep it manual in hooks or use params serializer.
    return config;
}, error => {
    return Promise.reject(error);
});

export default api;

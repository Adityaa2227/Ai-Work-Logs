import api from './api';

export const getDashboardStats = async (companyId) => {
    if(!companyId) return null;
    const response = await api.get(`/stats/kpi?company=${companyId}`);
    return response.data;
};

export const getChartData = async (range = 7, companyId) => {
    if(!companyId) return null;
    const response = await api.get(`/stats/charts?range=${range}&company=${companyId}`);
    return response.data;
};

export const getLatestAIInsight = async () => {
    try {
        const response = await api.get('/ai/latest');
        return response.data;
    } catch (error) {
        return null; // Return null if 404 or error
    }
};

export const getInsight = async (company) => {
    const response = await api.post('/ai/insight', { company });
    return response.data;
};

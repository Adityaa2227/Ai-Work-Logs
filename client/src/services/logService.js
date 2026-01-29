import api from './api';

export const getLogs = async (params) => {
    const response = await api.get('/logs', { params });
    return response.data;
};

export const createLog = async (data) => {
    const response = await api.post('/logs', data);
    return response.data;
};

export const updateLog = async (id, data) => {
    const response = await api.put(`/logs/${id}`, data);
    return response.data;
};

export const deleteLog = async (id) => {
    const response = await api.delete(`/logs/${id}`);
    return response.data;
};

export const getSuggestions = async (company) => {
    const response = await api.get('/logs/suggestions', { params: { company } });
    return response.data;
};

// Summary services
export const getWeeklySummaries = async (company) => {
    const response = await api.get('/summaries/weekly', { params: { company } });
    return response.data;
};

export const getMonthlySummaries = async (company) => {
    const response = await api.get('/summaries/monthly', { params: { company } });
    return response.data;
};

export const generateWeeklySummary = async (weekNumber, year, company) => {
    const response = await api.post('/summaries/weekly/generate', { weekNumber, year, company });
    return response.data;
};

export const generateMonthlySummary = async (month, year, company) => {
    const response = await api.post('/summaries/monthly/generate', { month, year, company });
    return response.data;
};

export const updateSummary = async (id, content) => {
    const response = await api.put(`/summaries/${id}`, { content });
    return response.data;
};

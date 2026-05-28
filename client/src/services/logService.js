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

export const getLatestLog = async (company) => {
    const response = await api.get('/logs/latest', { params: { company } });
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

// Raw Notes AI structuring
export const structureRawNotes = async (rawNotes, company) => {
    const response = await api.post('/logs/structure-notes', { rawNotes, company });
    return response.data;
};

// Systems Timeline
export const getSystemsTimeline = async (company) => {
    const response = await api.get('/logs/systems-timeline', { params: { company } });
    return response.data;
};

// Engineering Stats
export const getEngineeringStats = async (company) => {
    const response = await api.get('/stats/engineering', { params: { company } });
    return response.data;
};

// PR Activities CRUD
export const getPRActivities = async (params) => {
    const response = await api.get('/pr', { params });
    return response.data;
};

export const createPRActivity = async (data) => {
    const response = await api.post('/pr', data);
    return response.data;
};

export const updatePRActivity = async (id, data) => {
    const response = await api.put(`/pr/${id}`, data);
    return response.data;
};

export const deletePRActivity = async (id) => {
    const response = await api.delete(`/pr/${id}`);
    return response.data;
};

export const getPRStats = async (company) => {
    const response = await api.get('/pr/stats', { params: { company } });
    return response.data;
};

// Manager Review Mode Reports
export const generatePPOReviewReport = async (company, from, to) => {
    const response = await api.post('/review/ppo', { company, from, to });
    return response.data;
};

export const generateLearningReport = async (company, from, to) => {
    const response = await api.post('/review/learning', { company, from, to });
    return response.data;
};

export const generateContributionReport = async (company, from, to) => {
    const response = await api.post('/review/contribution', { company, from, to });
    return response.data;
};

export const generateSprintSummary = async (company, sprint, from, to) => {
    const response = await api.post('/review/sprint', { company, sprint, from, to });
    return response.data;
};

export const getSavedReviews = async (company, type) => {
    const response = await api.get('/review', { params: { company, type } });
    return response.data;
};

// Smart Search
export const searchLogs = async (params) => {
    const response = await api.get('/search', { params });
    return response.data;
};

export const aiSearchLogs = async (company, query) => {
    const response = await api.post('/search/ai', { company, query });
    return response.data;
};

export const getImageKitAuthParams = async () => {
    const response = await api.get('/logs/imagekit-auth');
    return response.data;
};

export const getDailyInsight = async (company) => {
    try {
        const response = await api.post('/ai/insight', { company });
        return response.data;
    } catch (error) {
        if (error.response?.data?.quotaSafeguard) {
            return error.response.data;
        }
        throw error;
    }
};


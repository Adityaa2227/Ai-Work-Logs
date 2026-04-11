import api from './api';

export const getLatestFeedback = async (company) => {
    try {
        const response = await api.get(`/feedback/latest?company=${company}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching latest feedback:', error);
        throw error;
    }
};

export const generateFeedback = async (company) => {
    try {
        const response = await api.post(`/feedback/generate`, { company });
        return response.data;
    } catch (error) {
        console.error('Error generating feedback:', error);
        throw error;
    }
};

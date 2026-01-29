import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const getLatestFeedback = async () => {
    try {
        const response = await axios.get(`${API_URL}/feedback/latest`);
        return response.data;
    } catch (error) {
        console.error('Error fetching latest feedback:', error);
        throw error;
    }
};

export const generateFeedback = async () => {
    try {
        const response = await axios.post(`${API_URL}/feedback/generate`);
        return response.data;
    } catch (error) {
        console.error('Error generating feedback:', error);
        throw error;
    }
};

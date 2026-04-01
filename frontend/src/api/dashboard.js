import api from './axiosConfig';

export const dashboardAPI = {
    getStats: async () => {
        const response = await api.get('/dashboard/stats');
        return response.data;
    },
    
    getMedicationHistory: async () => {
        const response = await api.get('/dashboard/history');
        return response.data;
    },
    
    getUpcomingReminders: async () => {
        const response = await api.get('/doses/upcoming');
        return response.data;
    }
};
import api from './axiosConfig';

export const medicationAPI = {
    getAll: async () => {
        const response = await api.get('/medications');
        return response.data;
    },
    
    getById: async (id) => {
        const response = await api.get(`/medications/${id}`);
        return response.data;
    },
    
    create: async (medicationData) => {
        const response = await api.post('/medications', medicationData);
        return response.data;
    },
    
    update: async (id, medicationData) => {
        const response = await api.put(`/medications/${id}`, medicationData);
        return response.data;
    },
    
    delete: async (id) => {
        const response = await api.delete(`/medications/${id}`);
        return response.data;
    },
    
    getTodayDoses: async () => {
        const response = await api.get('/doses/today');
        return response.data;
    },
    
    markDoseTaken: async (doseId, data) => {
        const response = await api.post(`/doses/${doseId}/taken`, data);
        return response.data;
    },
    
    markDoseMissed: async (doseId) => {
        const response = await api.post(`/doses/${doseId}/missed`);
        return response.data;
    }
};
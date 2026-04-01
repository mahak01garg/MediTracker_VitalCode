import api from './axiosConfig';

export const authAPI = {
    register: async (userData) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },
    
    login: async (credentials) => {
        const response = await api.post('/auth/login', credentials);
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },
    
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },
    
    getProfile: async () => {
        const response = await api.get('/auth/profile');
        return response.data;
    },
    
    updateProfile: async (userData) => {
        const config = userData instanceof FormData
            ? { headers: { 'Content-Type': 'multipart/form-data' } }
            : undefined;
        const response = await api.put('/auth/profile', userData, config);
        return response.data;
    }
};

// frontend/src/api/ai.js - This should contain your AI API calls
import axios from './axiosConfig';

export const chatWithAI = async (message) => {
  try {
    const response = await axios.post('/ai/chat', {
      query: message
    }, {
      timeout: 15000
    });
    return response.data;
  } catch (error) {
    console.error('AI chat error:', error);
    throw error;
  }
};

export const testAI = async () => {
  try {
    const response = await axios.get('/ai/health');
    return response.data;
  } catch (error) {
    console.error('AI test error:', error);
    throw error;
  }
};

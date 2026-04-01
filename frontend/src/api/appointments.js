import api from './api';

// Get all doctors
export const getAllDoctors = async (params = {}) => {
  try {
    const response = await api.get('/appointments/doctors', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get single doctor details
export const getDoctorById = async (doctorId) => {
  try {
    const response = await api.get(`/appointments/doctors/${doctorId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get doctor's schedule for a specific date
export const getDoctorSchedule = async (doctorId, date) => {
  try {
    const response = await api.get('/appointments/schedule', {
      params: {
        doctorId,
        date
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Request/Book an appointment slot
export const requestAppointmentSlot = async (slotData) => {
  try {
    const response = await api.post('/appointments/slots/request', slotData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get user's appointments
export const getMyAppointments = async () => {
  try {
    const response = await api.get('/appointments/slots/my-appointments');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update appointment status (for doctors)
export const updateAppointmentStatus = async (requestId, status) => {
  try {
    const response = await api.put(`/appointments/slots/${requestId}/status`, {
      status
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Cancel appointment
export const cancelAppointment = async (requestId) => {
  try {
    const response = await api.put(`/appointments/slots/${requestId}/cancel`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

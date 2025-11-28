// API Configuration and Helper Functions
const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to handle API responses
const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'An error occurred');
  }
  
  return data;
};

// Doctor API
export const doctorApi = {
  getProfile: async (doctorId) => {
    const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}/profile`);
    return handleResponse(response);
  },
  
  updateProfile: async (doctorId, profileData) => {
    const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    });
    return handleResponse(response);
  },
  
  getStats: async (doctorId) => {
    const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}/stats`);
    return handleResponse(response);
  },
  
  getSettings: async (doctorId) => {
    const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}/settings`);
    return handleResponse(response);
  },
  
  updateSettings: async (doctorId, settings) => {
    const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return handleResponse(response);
  },
};

// Appointment API
export const appointmentApi = {
  getAll: async (doctorId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/appointments/doctor/${doctorId}${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url);
    return handleResponse(response);
  },
  
  getToday: async (doctorId) => {
    const response = await fetch(`${API_BASE_URL}/appointments/doctor/${doctorId}/today`);
    return handleResponse(response);
  },
  
  getById: async (appointmentId) => {
    const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`);
    return handleResponse(response);
  },
  
  create: async (doctorId, appointmentData) => {
    const response = await fetch(`${API_BASE_URL}/appointments/doctor/${doctorId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appointmentData),
    });
    return handleResponse(response);
  },
  
  update: async (appointmentId, appointmentData) => {
    const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appointmentData),
    });
    return handleResponse(response);
  },
  
  cancel: async (appointmentId) => {
    const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/cancel`, {
      method: 'PATCH',
    });
    return handleResponse(response);
  },
};

// Patient API
export const patientApi = {
  getAll: async (doctorId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/patients/doctor/${doctorId}${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url);
    return handleResponse(response);
  },
  
  getById: async (patientId) => {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}`);
    return handleResponse(response);
  },
  
  create: async (patientData) => {
    const response = await fetch(`${API_BASE_URL}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData),
    });
    return handleResponse(response);
  },
  
  update: async (patientId, patientData) => {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData),
    });
    return handleResponse(response);
  },
  
  getMedicalHistory: async (patientId) => {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/medical-history`);
    return handleResponse(response);
  },
  
  addMedicalRecord: async (patientId, recordData) => {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/medical-records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recordData),
    });
    return handleResponse(response);
  },
};

// Analytics API
export const analyticsApi = {
  getAppointmentAnalytics: async (doctorId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/analytics/doctor/${doctorId}/appointments${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url);
    return handleResponse(response);
  },
  
  getPatientAnalytics: async (doctorId) => {
    const response = await fetch(`${API_BASE_URL}/analytics/doctor/${doctorId}/patients`);
    return handleResponse(response);
  },
  
  getRevenueAnalytics: async (doctorId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/analytics/doctor/${doctorId}/revenue${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url);
    return handleResponse(response);
  },
};

// Billing API
export const billingApi = {
  getAll: async (doctorId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/billing/doctor/${doctorId}${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url);
    return handleResponse(response);
  },
  
  getSummary: async (doctorId) => {
    const response = await fetch(`${API_BASE_URL}/billing/doctor/${doctorId}/summary`);
    return handleResponse(response);
  },
  
  create: async (doctorId, billingData) => {
    const response = await fetch(`${API_BASE_URL}/billing/doctor/${doctorId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(billingData),
    });
    return handleResponse(response);
  },
  
  update: async (billingId, billingData) => {
    const response = await fetch(`${API_BASE_URL}/billing/${billingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(billingData),
    });
    return handleResponse(response);
  },
  
  markAsPaid: async (billingId) => {
    const response = await fetch(`${API_BASE_URL}/billing/${billingId}/mark-paid`, {
      method: 'PATCH',
    });
    return handleResponse(response);
  },
};

export default {
  doctorApi,
  appointmentApi,
  patientApi,
  analyticsApi,
  billingApi,
};

// API Configuration and Helper Functions
const API_BASE_URL = 'http://localhost:3001/api';

// Simple in-memory cache for GET requests
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache helper
const getCached = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCache = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

// Clear cache for specific endpoint or all
export const clearCache = (endpoint) => {
  if (endpoint) {
    // Clear all cache entries that start with the endpoint
    for (const key of cache.keys()) {
      if (key.startsWith(endpoint)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
};

// Generic API client
export const api = {
  get: async (endpoint, options = {}) => {
    // Check cache first (unless explicitly disabled)
    if (!options.noCache) {
      const cached = getCached(endpoint);
      if (cached) {
        return cached;
      }
    }

    const token = localStorage.getItem('authToken');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers,
      ...options
    });

    const result = await handleResponse(response);
    
    // Cache successful GET requests
    if (response.ok && !options.noCache) {
      setCache(endpoint, result);
    }

    return result;
  },

  post: async (endpoint, data = null, options = {}) => {
    const token = localStorage.getItem('authToken');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    };

    // Handle FormData (for file uploads)
    const isFormData = data instanceof FormData;
    if (isFormData) {
      delete headers['Content-Type']; // Let browser set it for FormData
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: isFormData ? data : JSON.stringify(data),
      ...options
    });

    const result = await handleResponse(response);
    
    // Clear related cache on successful mutation
    if (response.ok) {
      const baseEndpoint = endpoint.split('?')[0].split('/').slice(0, -1).join('/');
      clearCache(baseEndpoint);
    }

    return result;
  },

  put: async (endpoint, data = null, options = {}) => {
    const token = localStorage.getItem('authToken');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
      ...options
    });

    const result = await handleResponse(response);
    
    // Clear related cache on successful mutation
    if (response.ok) {
      const baseEndpoint = endpoint.split('?')[0].split('/').slice(0, -1).join('/');
      clearCache(baseEndpoint);
    }

    return result;
  },

  delete: async (endpoint, options = {}) => {
    const token = localStorage.getItem('authToken');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
      ...options
    });

    const result = await handleResponse(response);
    
    // Clear related cache on successful mutation
    if (response.ok) {
      const baseEndpoint = endpoint.split('?')[0].split('/').slice(0, -1).join('/');
      clearCache(baseEndpoint);
    }

    return result;
  }
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  console.log('Response status:', response.status);
  console.log('Response headers:', response.headers);
  
  let data;
  const contentType = response.headers.get('content-type');
  
  try {
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
      console.log('Parsed response data:', data);
    } else {
      // Handle non-JSON responses (like HTML error pages)
      const text = await response.text();
      console.error('Non-JSON response received:', text.substring(0, 200) + '...');
      data = { 
        error: 'Server returned non-JSON response',
        details: `Status: ${response.status}, Content-Type: ${contentType}`,
        preview: text.substring(0, 200)
      };
    }
  } catch (error) {
    console.error('Failed to parse response:', error);
    throw new Error(`Failed to parse server response: ${error.message}`);
  }
  
  if (!response.ok) {
    console.error('API Error:', data);
    throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
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
  
  getByPatient: async (patientId) => {
    const response = await fetch(`${API_BASE_URL}/appointments/patient/${patientId}`);
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
  
  delete: async (patientId) => {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}`, {
      method: 'DELETE',
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
  api,
  doctorApi,
  appointmentApi,
  patientApi,
  analyticsApi,
  billingApi,
};

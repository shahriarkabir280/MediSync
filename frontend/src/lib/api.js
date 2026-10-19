// API Configuration and Helper Functions
import { API_CONFIG } from '../config/api';
import { getAuthToken, authHeaders, handleUnauthorized } from './authToken';

const API_BASE_URL = `${API_CONFIG.BASE_URL}/api`;

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

    const token = getAuthToken();
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
    const token = getAuthToken();
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
    const token = getAuthToken();
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
      method: 'PUT',
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

  delete: async (endpoint, options = {}) => {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    };

    const { data, ...fetchOptions } = options;
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
      ...(data !== undefined && { body: JSON.stringify(data) }),
      ...fetchOptions
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

  if (response.status === 401) {
    handleUnauthorized(response.url);
  }

  if (!response.ok) {
    console.error('API Error:', data);
    throw new Error(data.error || data.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return data;
};

// Doctor API
export const doctorApi = {
  getProfile: async (doctorId) => {
    const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}/profile`, { headers: authHeaders() });
    return handleResponse(response);
  },

  updateProfile: async (doctorId, profileData) => {
    const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}/profile`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(profileData),
    });
    return handleResponse(response);
  },

  getStats: async (doctorId) => {
    const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}/stats`, { headers: authHeaders() });
    return handleResponse(response);
  },

  getSettings: async (doctorId) => {
    const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}/settings`, { headers: authHeaders() });
    return handleResponse(response);
  },

  updateSettings: async (doctorId, settings) => {
    const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}/settings`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(settings),
    });
    return handleResponse(response);
  },

  getMarketplace: async (search = '') => {
    const url = `${API_BASE_URL}/doctors/marketplace${search ? `?search=${search}` : ''}`;
    const response = await fetch(url, { headers: authHeaders() });
    return handleResponse(response);
  },
};

// Appointment API
export const appointmentApi = {
  getAll: async (doctorId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/appointments/doctor/${doctorId}${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url, { headers: authHeaders() });
    return handleResponse(response);
  },

  getToday: async (doctorId) => {
    const response = await fetch(`${API_BASE_URL}/appointments/doctor/${doctorId}/today`, { headers: authHeaders() });
    return handleResponse(response);
  },

  getById: async (appointmentId) => {
    const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`, { headers: authHeaders() });
    return handleResponse(response);
  },

  getByPatient: async (patientId) => {
    const response = await fetch(`${API_BASE_URL}/appointments/patient/${patientId}`, { headers: authHeaders() });
    return handleResponse(response);
  },

  create: async (doctorId, appointmentData) => {
    const response = await fetch(`${API_BASE_URL}/appointments/doctor/${doctorId}`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(appointmentData),
    });
    return handleResponse(response);
  },

  update: async (appointmentId, appointmentData) => {
    const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(appointmentData),
    });
    return handleResponse(response);
  },

  cancel: async (appointmentId) => {
    const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/cancel`, {
      method: 'PATCH',
      headers: authHeaders(),
    });
    return handleResponse(response);
  },
};

// Patient API
export const patientApi = {
  getAll: async (doctorId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/patients/doctor/${doctorId}${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url, { headers: authHeaders() });
    return handleResponse(response);
  },

  getById: async (patientId) => {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}`, { headers: authHeaders() });
    return handleResponse(response);
  },

  create: async (patientData) => {
    const response = await fetch(`${API_BASE_URL}/patients`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(patientData),
    });
    return handleResponse(response);
  },

  update: async (patientId, patientData) => {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(patientData),
    });
    return handleResponse(response);
  },

  delete: async (patientId) => {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return handleResponse(response);
  },

  getMedicalHistory: async (patientId) => {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/medical-history`, { headers: authHeaders() });
    return handleResponse(response);
  },

  addMedicalRecord: async (patientId, recordData) => {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/medical-records`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(recordData),
    });
    return handleResponse(response);
  },

  deleteMedicalRecord: async (patientId, recordId) => {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/medical-records/${recordId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return handleResponse(response);
  },

  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/patient-login`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  },
};

// Diagnostic Center API
export const diagnosticApi = {
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/diagnostic-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  },
};

// Analytics API
export const analyticsApi = {
  getAppointmentAnalytics: async (doctorId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/analytics/doctor/${doctorId}/appointments${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url, { headers: authHeaders() });
    return handleResponse(response);
  },

  getPatientAnalytics: async (doctorId) => {
    const response = await fetch(`${API_BASE_URL}/analytics/doctor/${doctorId}/patients`, { headers: authHeaders() });
    return handleResponse(response);
  },

  getRevenueAnalytics: async (doctorId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/analytics/doctor/${doctorId}/revenue${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url, { headers: authHeaders() });
    return handleResponse(response);
  },
};

// Billing API
export const billingApi = {
  getAll: async (doctorId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/billing/doctor/${doctorId}${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url, { headers: authHeaders() });
    return handleResponse(response);
  },

  getSummary: async (doctorId) => {
    const response = await fetch(`${API_BASE_URL}/billing/doctor/${doctorId}/summary`, { headers: authHeaders() });
    return handleResponse(response);
  },

  create: async (doctorId, billingData) => {
    const response = await fetch(`${API_BASE_URL}/billing/doctor/${doctorId}`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(billingData),
    });
    return handleResponse(response);
  },

  update: async (billingId, billingData) => {
    const response = await fetch(`${API_BASE_URL}/billing/${billingId}`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(billingData),
    });
    return handleResponse(response);
  },

  markAsPaid: async (billingId) => {
    const response = await fetch(`${API_BASE_URL}/billing/${billingId}/mark-paid`, {
      method: 'PATCH',
      headers: authHeaders(),
    });
    return handleResponse(response);
  },
};

// Wallet API
export const walletApi = {
  getSummary: async (doctorId) => {
    const response = await fetch(`${API_BASE_URL}/wallet/doctor/${doctorId}/summary`, { headers: authHeaders() });
    return handleResponse(response);
  },

  getTransactions: async (doctorId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/wallet/doctor/${doctorId}/transactions${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url, { headers: authHeaders() });
    return handleResponse(response);
  },

  withdraw: async (doctorId, withdrawalData) => {
    const response = await fetch(`${API_BASE_URL}/wallet/doctor/${doctorId}/withdraw`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(withdrawalData),
    });
    return handleResponse(response);
  },

  getRules: async () => {
    const response = await fetch(`${API_BASE_URL}/wallet/rules`, { headers: authHeaders() });
    return handleResponse(response);
  },

  updateRule: async (ruleId, ruleData) => {
    const response = await fetch(`${API_BASE_URL}/wallet/rules/${ruleId}`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(ruleData),
    });
    return handleResponse(response);
  },
};

export const paymentApi = {
  initiate: async (paymentData) => {
    const response = await fetch(`${API_BASE_URL}/payment/init`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(paymentData),
    });
    return handleResponse(response);
  },
};

// Prescription API
export const prescriptionApi = {
  create: async (payload) => {
    const response = await fetch(`${API_BASE_URL}/prescriptions`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  getByPatient: async (patientId) => {
    const response = await fetch(`${API_BASE_URL}/prescriptions/patient/${patientId}`, {
      headers: authHeaders(),
    });
    return handleResponse(response);
  },

  getById: async (prescriptionId) => {
    const response = await fetch(`${API_BASE_URL}/prescriptions/${prescriptionId}`, {
      headers: authHeaders(),
    });
    return handleResponse(response);
  },
};

// Laboratory API
export const labApi = {
  getStats: async () => {
    return api.get('/lab/stats');
  },
  getRecentOrders: async (limit = 10) => {
    return api.get(`/lab/recent?limit=${limit}`);
  },
  getPendingReviews: async (limit = 10) => {
    return api.get(`/lab/reviews/pending?limit=${limit}`);
  },
  getOrderDetails: async (orderId) => {
    return api.get(`/lab/orders/${orderId}`);
  },
  verifyOrder: async (orderId, doctorId) => {
    return api.put(`/lab/orders/${orderId}/verify`, { doctorId });
  },
  getTests: async () => {
    return api.get('/lab/tests');
  },
  createOrder: async (orderData) => {
    return api.post('/lab/orders', orderData);
  },
  getAllOrders: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/lab/orders/all${queryString ? `?${queryString}` : ''}`);
  },
  updateStatus: async (orderId, statusData) => {
    return api.put(`/lab/orders/${orderId}/status`, statusData);
  },
  updateOrder: async (orderId, orderData) => {
    return api.put(`/lab/orders/${orderId}`, orderData);
  },
  uploadReport: async (orderId, formData) => {
    return api.post(`/lab/orders/${orderId}/report`, formData);
  },
  uploadItemReport: async (orderItemId, formData) => {
    return api.post(`/lab/orders/item/${orderItemId}/report`, formData);
  },
  getHistory: async (patientId) => {
    return api.get(`/lab/patient/${patientId}/history`);
  },
  updateReportFile: async (orderId, formData) => {
    return api.put(`/lab/report/${orderId}/file`, formData);
  }
};

export default {
  api,
  doctorApi,
  appointmentApi,
  patientApi,
  diagnosticApi,
  analyticsApi,
  billingApi,
  walletApi,
  prescriptionApi,
  labApi,
};

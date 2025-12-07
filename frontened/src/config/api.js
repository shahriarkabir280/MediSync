// Centralized API configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3001',
  ENDPOINTS: {
    AUTH: '/api/auth',
    WEBSITE: '/api/website',
    DOCTORS: '/api/doctors',
    PATIENTS: '/api/patients',
    APPOINTMENTS: '/api/appointments'
  }
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint, path = '') => {
  return `${API_CONFIG.BASE_URL}${endpoint}${path}`;
};

// Helper function to get full image URL
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath; // External URL
  if (imagePath.startsWith('/uploads')) return `${API_CONFIG.BASE_URL}${imagePath}`; // Local upload
  return imagePath; // Return as-is for other cases
};

// Common API URLs
export const API_URLS = {
  AUTH: {
    LOGIN: buildApiUrl(API_CONFIG.ENDPOINTS.AUTH, '/login'),
    REGISTER: buildApiUrl(API_CONFIG.ENDPOINTS.AUTH, '/register'),
    VERIFY: buildApiUrl(API_CONFIG.ENDPOINTS.AUTH, '/verify'),
    LOGOUT: buildApiUrl(API_CONFIG.ENDPOINTS.AUTH, '/logout'),
    CHANGE_PASSWORD: buildApiUrl(API_CONFIG.ENDPOINTS.AUTH, '/change-password'),
    ENABLE_2FA: buildApiUrl(API_CONFIG.ENDPOINTS.AUTH, '/enable-2fa'),
    DISABLE_2FA: buildApiUrl(API_CONFIG.ENDPOINTS.AUTH, '/disable-2fa')
  },
  WEBSITE: {
    PROFILE: (doctorId) => buildApiUrl(API_CONFIG.ENDPOINTS.WEBSITE, `/profile/${doctorId}`),
    SETTINGS: (doctorId) => buildApiUrl(API_CONFIG.ENDPOINTS.WEBSITE, `/doctor/${doctorId}/settings`),
    PUBLIC: (urlSlug) => buildApiUrl(API_CONFIG.ENDPOINTS.WEBSITE, `/public/${urlSlug}`),
    UPLOAD_IMAGE: (doctorId) => buildApiUrl(API_CONFIG.ENDPOINTS.WEBSITE, `/doctor/${doctorId}/upload-image`),
    STATS: (doctorId) => buildApiUrl(API_CONFIG.ENDPOINTS.WEBSITE, `/doctor/${doctorId}/stats`),
    
    // Education endpoints
    EDUCATION: {
      ADD: (doctorId) => buildApiUrl(API_CONFIG.ENDPOINTS.WEBSITE, `/doctor/${doctorId}/education`),
      UPDATE: (doctorId, educationId) => buildApiUrl(API_CONFIG.ENDPOINTS.WEBSITE, `/doctor/${doctorId}/education/${educationId}`),
      DELETE: (doctorId, educationId) => buildApiUrl(API_CONFIG.ENDPOINTS.WEBSITE, `/doctor/${doctorId}/education/${educationId}`)
    },
    
    // Experience endpoints
    EXPERIENCE: {
      ADD: (doctorId) => buildApiUrl(API_CONFIG.ENDPOINTS.WEBSITE, `/doctor/${doctorId}/experience`),
      UPDATE: (doctorId, experienceId) => buildApiUrl(API_CONFIG.ENDPOINTS.WEBSITE, `/doctor/${doctorId}/experience/${experienceId}`),
      DELETE: (doctorId, experienceId) => buildApiUrl(API_CONFIG.ENDPOINTS.WEBSITE, `/doctor/${doctorId}/experience/${experienceId}`)
    },
    
    // Services endpoints
    SERVICES: {
      ADD: (doctorId) => buildApiUrl(API_CONFIG.ENDPOINTS.WEBSITE, `/doctor/${doctorId}/services`),
      UPDATE: (doctorId, serviceId) => buildApiUrl(API_CONFIG.ENDPOINTS.WEBSITE, `/doctor/${doctorId}/services/${serviceId}`),
      DELETE: (doctorId, serviceId) => buildApiUrl(API_CONFIG.ENDPOINTS.WEBSITE, `/doctor/${doctorId}/services/${serviceId}`)
    },
    
    // Chambers endpoints
    CHAMBERS: {
      ADD: (doctorId) => buildApiUrl(API_CONFIG.ENDPOINTS.WEBSITE, `/doctor/${doctorId}/chambers`),
      UPDATE: (doctorId, chamberId) => buildApiUrl(API_CONFIG.ENDPOINTS.WEBSITE, `/doctor/${doctorId}/chambers/${chamberId}`),
      DELETE: (doctorId, chamberId) => buildApiUrl(API_CONFIG.ENDPOINTS.WEBSITE, `/doctor/${doctorId}/chambers/${chamberId}`)
    },
    
    // Testimonials endpoints
    TESTIMONIALS: {
      ADD: (doctorId) => buildApiUrl(API_CONFIG.ENDPOINTS.WEBSITE, `/doctor/${doctorId}/testimonials`),
      UPDATE: (doctorId, testimonialId) => buildApiUrl(API_CONFIG.ENDPOINTS.WEBSITE, `/doctor/${doctorId}/testimonials/${testimonialId}`),
      DELETE: (doctorId, testimonialId) => buildApiUrl(API_CONFIG.ENDPOINTS.WEBSITE, `/doctor/${doctorId}/testimonials/${testimonialId}`)
    },
    
    // Social Media endpoints
    SOCIAL_MEDIA: {
      UPDATE: (doctorId) => buildApiUrl(API_CONFIG.ENDPOINTS.WEBSITE, `/doctor/${doctorId}/social-media`)
    },
    
    // Contact endpoints
    CONTACT: {
      GET: (doctorId) => buildApiUrl(API_CONFIG.ENDPOINTS.WEBSITE, `/doctor/${doctorId}/contact`),
      UPDATE: (doctorId) => buildApiUrl(API_CONFIG.ENDPOINTS.WEBSITE, `/doctor/${doctorId}/contact`),
      // Frontend-compatible endpoints
      SAVE: (doctorId) => buildApiUrl(API_CONFIG.ENDPOINTS.WEBSITE, `/contact/${doctorId}`)
    }
  },
  DOCTORS: {
    PROFILE: (doctorId) => buildApiUrl(API_CONFIG.ENDPOINTS.DOCTORS, `/${doctorId}`),
    SETTINGS: (doctorId) => buildApiUrl(API_CONFIG.ENDPOINTS.DOCTORS, `/${doctorId}/settings`),
    SETTINGS_AUTH: buildApiUrl(API_CONFIG.ENDPOINTS.DOCTORS, '/settings'),
    NOTIFICATIONS: buildApiUrl(API_CONFIG.ENDPOINTS.DOCTORS, '/settings/notifications'),
    NOTIFICATION_PREFERENCES: buildApiUrl(API_CONFIG.ENDPOINTS.DOCTORS, '/settings/notification-preferences'),
    TEST_NOTIFICATION: buildApiUrl(API_CONFIG.ENDPOINTS.DOCTORS, '/settings/test-notification'),
    STATS: (doctorId) => buildApiUrl(API_CONFIG.ENDPOINTS.DOCTORS, `/${doctorId}/stats`),
    DELETE_ACCOUNT: buildApiUrl(API_CONFIG.ENDPOINTS.DOCTORS, '/delete-account')
  },
  PATIENTS: {
    BY_DOCTOR: (doctorId) => buildApiUrl(API_CONFIG.ENDPOINTS.PATIENTS, `/doctor/${doctorId}`)
  },
  APPOINTMENTS: {
    BY_DOCTOR: (doctorId) => buildApiUrl(API_CONFIG.ENDPOINTS.APPOINTMENTS, `/doctor/${doctorId}`)
  },
  BILLING: {
    SETTINGS: buildApiUrl('/api/billing', '/settings'),
    PAYMENT_METHODS: buildApiUrl('/api/billing', '/payment-methods'),
    ADD_PAYMENT_METHOD: buildApiUrl('/api/billing', '/payment-methods'),
    DELETE_PAYMENT_METHOD: (methodId) => buildApiUrl('/api/billing', `/payment-methods/${methodId}`)
  },
  NOTIFICATIONS: {
    LIST: buildApiUrl('/api/notifications'),
    STATS: buildApiUrl('/api/notifications', '/stats'),
    MARK_READ: (notificationId) => buildApiUrl('/api/notifications', `/${notificationId}/read`),
    MARK_UNREAD: (notificationId) => buildApiUrl('/api/notifications', `/${notificationId}/unread`),
    MARK_ALL_READ: buildApiUrl('/api/notifications', '/mark-all-read'),
    DELETE: (notificationId) => buildApiUrl('/api/notifications', `/${notificationId}`),
    DELETE_MULTIPLE: buildApiUrl('/api/notifications'),
    CREATE: buildApiUrl('/api/notifications')
  }
};

export default API_CONFIG;
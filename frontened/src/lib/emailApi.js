import { api } from '../lib/api';

const API_BASE = '/email';

export const emailApi = {
  // Get all emails with filters
  getEmails: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`${API_BASE}?${queryString}`);
  },

  // Get single email
  getEmail: async (id) => {
    return api.get(`${API_BASE}/${id}`);
  },

  // Send email
  sendEmail: async (emailData) => {
    return api.post(`${API_BASE}/send`, emailData);
  },

  // Save draft
  saveDraft: async (draftData) => {
    return api.post(`${API_BASE}/draft`, draftData);
  },

  // Delete email
  deleteEmail: async (id, permanent = false) => {
    return api.delete(`${API_BASE}/${id}?permanent=${permanent}`);
  },

  // Empty trash
  emptyTrash: async () => {
    return api.delete(`${API_BASE}/trash`);
  },

  // Mark as read/unread
  markAsRead: async (id, isRead) => {
    return api.put(`${API_BASE}/${id}/read`, { is_read: isRead });
  },

  // Star/unstar email
  toggleStar: async (id, isStarred) => {
    return api.put(`${API_BASE}/${id}/star`, { is_starred: isStarred });
  },

  // Get email statistics
  getStats: async () => {
    return api.get(`${API_BASE}/stats`);
  },

  // Get recipients list
  getRecipients: async (search = '') => {
    return api.get(`${API_BASE}/recipients?search=${encodeURIComponent(search)}`);
  }
};

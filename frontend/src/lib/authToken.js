// Central auth token helpers.
// Each portal keeps its own token in localStorage; the current page decides which one is sent.
import { API_CONFIG } from '../config/api';

const TOKEN_KEYS = {
  doctor: 'authToken',
  patient: 'patientToken',
  diagnostic: 'diagnosticToken'
};

const PATIENT_SESSION_KEYS = ['patientToken', 'patientId', 'patientSessionEmail', 'patientDisplayId', 'patientName'];

// Uploads that the backend serves without auth
const PUBLIC_UPLOAD_PREFIXES = ['/uploads/profile-images/', '/uploads/blog-images/'];

export const getTokenRole = (pathname = window.location.pathname) => {
  if (pathname.startsWith('/patient-dashboard')) return 'patient';
  if (pathname.startsWith('/diagnostic-center')) return 'diagnostic';
  return 'doctor';
};

const readStorage = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const getAuthToken = () => readStorage(TOKEN_KEYS[getTokenRole()]);

// Explicit headers win, so callers can still override Authorization if they need to
export const authHeaders = (headers = {}) => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}`, ...headers } : { ...headers };
};

export const clearPatientSession = () => {
  PATIENT_SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
};

export const clearDiagnosticSession = () => {
  localStorage.removeItem(TOKEN_KEYS.diagnostic);
};

let redirecting = false;

// Called when the backend answers 401. Logs the current portal out and sends the user to its login page.
// Auth endpoints are skipped: they use 401 for wrong credentials / wrong current password.
export const handleUnauthorized = (url = '') => {
  if (redirecting || String(url).includes('/api/auth/')) return;

  const role = getTokenRole();
  if (role === 'patient') {
    redirecting = true;
    clearPatientSession();
    window.location.replace('/patient-login');
  } else if (role === 'diagnostic') {
    redirecting = true;
    clearDiagnosticSession();
    window.location.replace('/diagnostic-login');
  } else if (window.location.pathname === '/' && readStorage(TOKEN_KEYS.doctor)) {
    // Doctor dashboard: drop the stale token and reload into the login form.
    // Public pages are left alone, and without a token there is nothing to clear, so no loop.
    redirecting = true;
    localStorage.removeItem(TOKEN_KEYS.doctor);
    window.location.replace('/');
  }
};

// fetch() with the current portal's Bearer token and 401 handling
export const authFetch = async (url, options = {}) => {
  const response = await fetch(url, { ...options, headers: authHeaders(options.headers) });
  if (response.status === 401) handleUnauthorized(url);
  return response;
};

const getBackendPath = (url) => {
  if (typeof url !== 'string' || !url) return null;
  let path;
  if (url.startsWith(`${API_CONFIG.BASE_URL}/`)) {
    path = url.slice(API_CONFIG.BASE_URL.length);
  } else if (url.startsWith('/') && !url.startsWith('//')) {
    path = url;
  } else {
    return null; // external, blob: or data: URL
  }
  return path.split(/[?#]/)[0];
};

export const isPrivateFileUrl = (url) => {
  const path = getBackendPath(url);
  if (!path) return false;
  if (path.startsWith('/api/files/')) return true;
  return path.startsWith('/uploads/') && !PUBLIC_UPLOAD_PREFIXES.some((prefix) => path.startsWith(prefix));
};

// Adds ?token= to private file URLs for places that cannot send headers (<img>, <iframe>, window.open, <a href>)
export const withAuthToken = (url) => {
  if (!isPrivateFileUrl(url)) return url;
  const token = getAuthToken();
  if (!token) return url;

  const hashIndex = url.indexOf('#');
  const base = hashIndex === -1 ? url : url.slice(0, hashIndex);
  const hash = hashIndex === -1 ? '' : url.slice(hashIndex);
  if (/[?&]token=/.test(base)) return url;

  return `${base}${base.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}${hash}`;
};

import { useAuth } from '../contexts/AuthContext';

// Custom hook to get the authenticated doctor's information
export const useDoctor = () => {
  const { user, isAuthenticated } = useAuth();
  
  return {
    doctorId: user?.id,
    doctorName: user?.name,
    doctorEmail: user?.email,
    doctorSpecialization: user?.specialization,
    doctorProfileImage: user?.profileImage,
    isAuthenticated
  };
};

// API helper with authentication
export const authenticatedFetch = async (url, options = {}) => {
  const token = localStorage.getItem('authToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return fetch(url, {
    ...options,
    headers
  });
};

export default useDoctor;
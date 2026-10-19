import { useAuth } from '../contexts/AuthContext';
import { authFetch } from '../lib/authToken';

// Custom hook to get the authenticated doctor's information
export const useDoctor = () => {
  const { user, isAuthenticated } = useAuth();
  
  return {
    doctor: {
      id: user?.id,
      name: user?.name,
      email: user?.email,
      specialization: user?.specialization,
      profileImage: user?.profileImage,
    },
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
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // authFetch adds the Bearer token and handles 401s
  return authFetch(url, {
    ...options,
    headers
  });
};

export default useDoctor;
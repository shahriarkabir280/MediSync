import { supabase } from '../config/db.js';

/**
 * Generate unique ID for doctors
 * @returns {Promise<string>} Unique doctor ID like DOC-001
 */
export const generateDoctorUniqueId = async () => {
  try {
    const { count, error } = await supabase
      .from('doctors')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    // Fallback to 0 if null
    const nextCount = (count || 0) + 1;
    return `DOC-${String(nextCount).padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating doctor unique ID:', error);
    throw new Error('Failed to generate doctor unique ID');
  }
};

/**
 * Get next available unique ID for doctors
 * @returns {Promise<string>} Next available doctor ID
 */
export const getNextDoctorId = async () => {
  try {
    // Get all doctor IDs to find the maximum number
    const { data, error } = await supabase
      .from('doctors')
      .select('unique_id')
      .not('unique_id', 'is', null)
      .like('unique_id', 'DOC-%');

    if (error) throw error;

    if (!data || data.length === 0) {
      return 'DOC-001';
    }

    // Extract numeric parts and find the maximum
    const numbers = data
      .map(item => {
        const match = item.unique_id.match(/DOC-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => !isNaN(num));

    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNumber = maxNumber + 1;

    return `DOC-${String(nextNumber).padStart(3, '0')}`;
  } catch (error) {
    console.error('Error getting next doctor ID:', error);
    throw new Error('Failed to get next doctor ID');
  }
};

/**
 * Get next available unique ID for patients
 * @returns {Promise<string>} Next available patient ID
 */
export const getNextPatientId = async () => {
  try {
    // Get all patient IDs to find the maximum number
    const { data, error } = await supabase
      .from('patients')
      .select('unique_id')
      .not('unique_id', 'is', null)
      .like('unique_id', 'PAT-%');

    if (error) throw error;

    if (!data || data.length === 0) {
      return 'PAT-001';
    }

    // Extract numeric parts and find the maximum
    const numbers = data
      .map(item => {
        const match = item.unique_id.match(/PAT-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => !isNaN(num));

    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNumber = maxNumber + 1;

    return `PAT-${String(nextNumber).padStart(3, '0')}`;
  } catch (error) {
    console.error('Error getting next patient ID:', error);
    throw new Error('Failed to get next patient ID');
  }
};

/**
 * Validate unique ID format
 * @param {string} id - The ID to validate
 * @param {string} type - Either 'doctor' or 'patient'
 * @returns {boolean} True if valid format
 */
export const validateUniqueIdFormat = (id, type) => {
  const prefix = type === 'doctor' ? 'DOC' : 'PAT';
  const pattern = new RegExp(`^${prefix}-\\d{3}$`);
  return pattern.test(id);
};

/**
 * Check if unique ID already exists
 * @param {string} id - The ID to check
 * @param {string} type - Either 'doctor' or 'patient'
 * @returns {Promise<boolean>} True if ID exists
 */
export const checkUniqueIdExists = async (id, type) => {
  try {
    const table = type === 'doctor' ? 'doctors' : 'patients';
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq('unique_id', id);

    if (error) throw error;

    return count > 0;
  } catch (error) {
    console.error(`Error checking ${type} unique ID existence:`, error);
    throw new Error(`Failed to check ${type} unique ID existence`);
  }
};
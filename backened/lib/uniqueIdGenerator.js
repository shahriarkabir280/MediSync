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
 * Generate unique ID for patients
 * @returns {Promise<string>} Unique patient ID like PAT-001
 */
export const generatePatientUniqueId = async () => {
  try {
    const { count, error } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    const nextCount = (count || 0) + 1;
    return `PAT-${String(nextCount).padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating patient unique ID:', error);
    throw new Error('Failed to generate patient unique ID');
  }
};

/**
 * Get next available unique ID for doctors
 * @returns {Promise<string>} Next available doctor ID
 */
export const getNextDoctorId = async () => {
  try {
    const { data, error } = await supabase
      .from('doctors')
      .select('unique_id')
      .not('unique_id', 'is', null)
      .order('unique_id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return 'DOC-001';
    }

    const lastId = data.unique_id;
    // Extract number part: DOC-001 -> 001
    const lastNumber = parseInt(lastId.split('-')[1]);
    return `DOC-${String(lastNumber + 1).padStart(3, '0')}`;
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
    const { data, error } = await supabase
      .from('patients')
      .select('unique_id')
      .not('unique_id', 'is', null)
      .order('unique_id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return 'PAT-001';
    }

    const lastId = data.unique_id;
    const lastNumber = parseInt(lastId.split('-')[1]);
    return `PAT-${String(lastNumber + 1).padStart(3, '0')}`;
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
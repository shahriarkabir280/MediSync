import { sql } from '../config/db.js';

/**
 * Generate unique ID for doctors
 * @returns {Promise<string>} Unique doctor ID like DOC-001
 */
export const generateDoctorUniqueId = async () => {
  try {
    const result = await sql`
      SELECT COUNT(*) as count FROM doctors
    `;
    const count = parseInt(result[0].count) + 1;
    return `DOC-${String(count).padStart(3, '0')}`;
  } catch (error) {
    throw new Error('Failed to generate doctor unique ID');
  }
};

/**
 * Generate unique ID for patients
 * @returns {Promise<string>} Unique patient ID like PAT-001
 */
export const generatePatientUniqueId = async () => {
  try {
    const result = await sql`
      SELECT COUNT(*) as count FROM patients
    `;
    const count = parseInt(result[0].count) + 1;
    return `PAT-${String(count).padStart(3, '0')}`;
  } catch (error) {
    throw new Error('Failed to generate patient unique ID');
  }
};

/**
 * Get next available unique ID for doctors
 * @returns {Promise<string>} Next available doctor ID
 */
export const getNextDoctorId = async () => {
  try {
    const result = await sql`
      SELECT unique_id 
      FROM doctors 
      WHERE unique_id IS NOT NULL 
      ORDER BY unique_id DESC 
      LIMIT 1
    `;
    
    if (result.length === 0) {
      return 'DOC-001';
    }
    
    const lastId = result[0].unique_id;
    const lastNumber = parseInt(lastId.split('-')[1]);
    return `DOC-${String(lastNumber + 1).padStart(3, '0')}`;
  } catch (error) {
    throw new Error('Failed to get next doctor ID');
  }
};

/**
 * Get next available unique ID for patients
 * @returns {Promise<string>} Next available patient ID
 */
export const getNextPatientId = async () => {
  try {
    const result = await sql`
      SELECT unique_id 
      FROM patients 
      WHERE unique_id IS NOT NULL 
      ORDER BY unique_id DESC 
      LIMIT 1
    `;
    
    if (result.length === 0) {
      return 'PAT-001';
    }
    
    const lastId = result[0].unique_id;
    const lastNumber = parseInt(lastId.split('-')[1]);
    return `PAT-${String(lastNumber + 1).padStart(3, '0')}`;
  } catch (error) {
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
    const result = await sql`
      SELECT COUNT(*) as count 
      FROM ${sql(table)} 
      WHERE unique_id = ${id}
    `;
    return parseInt(result[0].count) > 0;
  } catch (error) {
    throw new Error(`Failed to check ${type} unique ID existence`);
  }
};
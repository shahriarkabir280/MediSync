import path from 'path';
import { supabase } from '../config/db.js';
import { ROLES } from './auth.js';

// Lab reports and medical records live in /uploads/medical-records.
const MEDICAL_RECORDS_DIR = '/medical-records/';

const orderBelongsToPatient = async (orderId, patientId) => {
  if (!orderId) return false;
  const { data } = await supabase
    .from('lab_orders')
    .select('id')
    .eq('id', orderId)
    .eq('patient_id', patientId)
    .maybeSingle();
  return Boolean(data);
};

// A medical file belongs to a patient through a medical record, a lab report file, or a lab result.
export const patientOwnsFile = async (patientId, filename) => {
  const { data: record } = await supabase
    .from('medical_records')
    .select('id')
    .eq('file_name', filename)
    .eq('patient_id', patientId)
    .limit(1)
    .maybeSingle();
  if (record) return true;

  const { data: reportFiles } = await supabase
    .from('lab_report_files')
    .select('order_id')
    .eq('file_name', filename);
  for (const file of reportFiles || []) {
    if (await orderBelongsToPatient(file.order_id, patientId)) return true;
  }

  const { data: results } = await supabase
    .from('lab_results')
    .select('order_item_id')
    .eq('file_name', filename);
  for (const result of results || []) {
    const { data: item } = await supabase
      .from('lab_order_items')
      .select('order_id')
      .eq('id', result.order_item_id)
      .maybeSingle();
    if (await orderBelongsToPatient(item?.order_id, patientId)) return true;
  }

  return false;
};

const forbidden = (res) => res.status(403).json({ success: false, message: 'You do not have access to this file' });

// Runs after authenticate(). Doctors may open any file; patients only their own medical files;
// the diagnostic center only lab reports and medical records.
// getFile(req) returns { dir, filename } for the requested file.
const fileAccess = (getFile) => async (req, res, next) => {
  try {
    const { role, id } = req.user;
    if (role === ROLES.DOCTOR) return next();

    const { dir, filename } = getFile(req);
    if (dir !== MEDICAL_RECORDS_DIR || !filename) return forbidden(res);
    if (role === ROLES.DIAGNOSTIC) return next();
    if (role === ROLES.PATIENT && await patientOwnsFile(id, filename)) return next();

    return forbidden(res);
  } catch (error) {
    next(error);
  }
};

// GET /api/files/:filename always serves from /uploads/medical-records
export const requireFileAccess = fileAccess((req) => ({
  dir: MEDICAL_RECORDS_DIR,
  filename: path.basename(req.params.filename || ''),
}));

// Private /uploads/<dir>/<file> paths (req.path is relative to the /uploads mount)
export const requireUploadAccess = fileAccess((req) => {
  const relative = decodeURIComponent(req.path);
  return {
    dir: `${path.posix.dirname(relative)}/`,
    filename: path.posix.basename(relative),
  };
});

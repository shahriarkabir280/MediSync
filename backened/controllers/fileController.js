import { supabase } from '../config/db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename: timestamp-originalname
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/\s+/g, '-'); // Replace spaces with dashes
    cb(null, `${timestamp}-${originalName}`);
  }
});

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow PDF, JPG, JPEG, PNG
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, JPEG, and PNG files are allowed.'));
    }
  }
});

// Upload file for patient
export const uploadPatientFile = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { doctorId, fileType } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const fileName = file.filename;
    const filePath = `/uploads/${fileName}`;
    const fileSize = file.size;
    const originalName = file.originalname;

    // Insert file record into medical_records table
    const { data, error } = await supabase
      .from('medical_records')
      .insert({
        patient_id: patientId,
        doctor_id: doctorId,
        file_name: fileName,
        file_path: filePath,
        file_type: fileType,
        file_size: fileSize,
        original_name: originalName,
        record_date: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data
    });

  } catch (error) {
    console.error('Error uploading file:', error);

    // Clean up uploaded file if database insertion fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: 'Failed to upload file',
      details: error.message
    });
  }
};

// Get patient files
export const getPatientFiles = async (req, res) => {
  try {
    const { patientId } = req.params;

    const { data, error } = await supabase
      .from('medical_records')
      .select(`
            *,
            doctors (first_name, last_name)
        `)
      .eq('patient_id', patientId)
      .order('record_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    const flattened = data.map(record => ({
      ...record,
      doctor_first_name: record.doctors?.first_name,
      doctor_last_name: record.doctors?.last_name,
      doctors: undefined
    }));

    res.json({
      success: true,
      data: flattened
    });

  } catch (error) {
    console.error('Error fetching patient files:', error);
    res.status(500).json({
      error: 'Failed to fetch patient files',
      details: error.message
    });
  }
};

// Helper to determine mime type
const getMimeType = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  const mimeTypes = {
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'webm': 'audio/webm',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav'
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

// Download/View file
export const downloadFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Get file info from database
    const { data: fileRecord, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('file_name', filename)
      .maybeSingle();

    if (error) throw error;

    // Determine content type
    let contentType = 'application/octet-stream';
    let originalName = filename;

    if (fileRecord) {
      contentType = getMimeType(fileRecord.original_name || filename);
      originalName = fileRecord.original_name;
    } else {
      // Fallback for files that exist on disk but lack a DB record (useful for dev/mocking)
      contentType = getMimeType(filename);
      console.log(`Serving file from disk without DB record: ${filename}`);
    }

    // Set appropriate headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${originalName}"`);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({
      error: 'Failed to download file',
      details: error.message
    });
  }
};

// Delete file
export const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    // Get file info first
    const { data: fileRecord, error: fetchError } = await supabase
      .from('medical_records')
      .select('*')
      .eq('id', fileId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!fileRecord) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = path.join(uploadDir, fileRecord.file_name);

    // Delete from database
    const { error: deleteError } = await supabase
      .from('medical_records')
      .delete()
      .eq('id', fileId);

    if (deleteError) throw deleteError;

    // Delete physical file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      error: 'Failed to delete file',
      details: error.message
    });
  }
};
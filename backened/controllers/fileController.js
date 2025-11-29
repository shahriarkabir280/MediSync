import { sql } from '../config/db.js';
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
    const result = await sql`
      INSERT INTO medical_records 
      (patient_id, doctor_id, file_name, file_path, file_type, file_size, original_name, record_date)
      VALUES (${patientId}, ${doctorId}, ${fileName}, ${filePath}, ${fileType}, ${fileSize}, ${originalName}, CURRENT_DATE)
      RETURNING *
    `;
    
    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: result[0]
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
    
    const result = await sql`
      SELECT 
        mr.*,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name
      FROM medical_records mr
      LEFT JOIN doctors d ON mr.doctor_id = d.id
      WHERE mr.patient_id = ${patientId}
      ORDER BY mr.record_date DESC, mr.created_at DESC
    `;
    
    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching patient files:', error);
    res.status(500).json({ 
      error: 'Failed to fetch patient files',
      details: error.message 
    });
  }
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
    const result = await sql`
      SELECT * FROM medical_records WHERE file_name = ${filename}
    `;
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'File record not found' });
    }
    
    const fileRecord = result[0];
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'application/pdf'); // Default to PDF
    res.setHeader('Content-Disposition', `inline; filename="${fileRecord.original_name}"`);
    
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
    const fileResult = await sql`
      SELECT * FROM medical_records WHERE id = ${fileId}
    `;
    
    if (fileResult.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const fileRecord = fileResult[0];
    const filePath = path.join(uploadDir, fileRecord.file_name);
    
    // Delete from database
    await sql`DELETE FROM medical_records WHERE id = ${fileId}`;
    
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
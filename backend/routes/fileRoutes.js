import express from 'express';
import jwt from 'jsonwebtoken';
import { authenticate, doctorOnly, ROLES } from '../middleware/auth.js';
import { requireFileAccess } from '../middleware/fileAccess.js';
import { upload, uploadPatientFile, getPatientFiles, downloadFile, deleteFile } from '../controllers/fileController.js';

const router = express.Router();

const SHARE_PURPOSE = 'file-share';
const SHARE_LINK_TTL = '7d';

// A share token opens exactly one file and nothing else, so doctors can send a record
// over WhatsApp or email without handing out their login token.
const isValidShareToken = (token, filename) => {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return payload.purpose === SHARE_PURPOSE && payload.file === filename;
  } catch {
    return false;
  }
};

const shareLinkOrSignedIn = (req, res, next) => {
  if (typeof req.query.share === 'string') {
    if (isValidShareToken(req.query.share, req.params.filename)) return next();
    return res.status(401).json({ success: false, message: 'This share link is invalid or has expired' });
  }
  authenticate(ROLES.DOCTOR, ROLES.PATIENT)(req, res, () => requireFileAccess(req, res, next));
};

// Upload file for patient
router.post('/patients/:patientId/files', doctorOnly, upload.single('file'), uploadPatientFile);

// Get all files for a patient
router.get('/patients/:patientId/files', doctorOnly, getPatientFiles);

// Create an expiring share link for one file
router.post('/files/:filename/share-link', doctorOnly, (req, res) => {
  const { filename } = req.params;
  const shareToken = jwt.sign({ purpose: SHARE_PURPOSE, file: filename }, process.env.JWT_SECRET, {
    expiresIn: SHARE_LINK_TTL,
  });
  const { exp } = jwt.decode(shareToken);

  res.json({
    success: true,
    path: `/api/files/${encodeURIComponent(filename)}?share=${shareToken}`,
    expiresAt: new Date(exp * 1000).toISOString(),
  });
});

// Download/View file
// Opened via <img>/<iframe>/window.open, so the token may arrive as ?token= (or ?share= for share links)
router.get('/files/:filename', shareLinkOrSignedIn, downloadFile);

// Delete file
router.delete('/files/:fileId', doctorOnly, deleteFile);

export default router;

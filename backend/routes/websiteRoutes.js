import express from 'express';
import { doctorOnly, requireOwnDoctor } from '../middleware/auth.js';
import {
  getDoctorProfile,
  updateDoctorProfile,
  uploadProfileImage,
  getPublicProfile,
  getDoctorWebsiteSettings,
  updateWebsiteSettings,
  addEducation,
  updateEducation,
  deleteEducation,
  addExperience,
  updateExperience,
  deleteExperience,
  addService,
  updateService,
  deleteService,
  addChamber,
  updateChamber,
  deleteChamber,
  addTestimonial,
  updateTestimonial,
  deleteTestimonial,
  updateSocialMedia,
  updateContact,
  getContact,
  getDashboardStats,
  getPublicBlogPost,
  runWebsiteMigration
} from '../controllers/websiteController.js';

// Auto-run migration to ensure all columns exist
runWebsiteMigration().catch(e => console.warn('Migration warning:', e.message));

const router = express.Router();

// Frontend-compatible routes (for PublicWebsiteTab)
router.get('/profile/:doctorId', doctorOnly, requireOwnDoctor(), getDoctorProfile);
router.post('/profile/:doctorId', doctorOnly, requireOwnDoctor(), updateDoctorProfile);
router.post('/settings/:doctorId', doctorOnly, requireOwnDoctor(), updateWebsiteSettings);
router.post('/education/:doctorId', doctorOnly, requireOwnDoctor(), addEducation);
router.post('/experience/:doctorId', doctorOnly, requireOwnDoctor(), addExperience);
router.post('/services/:doctorId', doctorOnly, requireOwnDoctor(), addService);
router.post('/chambers/:doctorId', doctorOnly, requireOwnDoctor(), addChamber);
router.post('/social-media/:doctorId', doctorOnly, requireOwnDoctor(), updateSocialMedia);
router.post('/contact/:doctorId', doctorOnly, requireOwnDoctor(), updateContact);
router.get('/contact/:doctorId', doctorOnly, requireOwnDoctor(), getContact);

// Doctor Profile Routes
router.get('/doctor/:doctorId/profile', doctorOnly, requireOwnDoctor(), getDoctorProfile);
router.put('/doctor/:doctorId/profile', doctorOnly, requireOwnDoctor(), updateDoctorProfile);
router.post('/doctor/:doctorId/upload-image', doctorOnly, requireOwnDoctor(), uploadProfileImage);

// Public Profile Routes
router.get('/public/:urlSlug', getPublicProfile);
router.get('/public/blog/:slug', getPublicBlogPost);

// Website Settings
router.get('/doctor/:doctorId/settings', doctorOnly, requireOwnDoctor(), getDoctorWebsiteSettings);
router.put('/doctor/:doctorId/settings', doctorOnly, requireOwnDoctor(), updateWebsiteSettings);

// Education Routes
router.post('/doctor/:doctorId/education', doctorOnly, requireOwnDoctor(), addEducation);
router.put('/doctor/:doctorId/education/:educationId', doctorOnly, requireOwnDoctor(), updateEducation);
router.delete('/doctor/:doctorId/education/:educationId', doctorOnly, requireOwnDoctor(), deleteEducation);

// Experience Routes
router.post('/doctor/:doctorId/experience', doctorOnly, requireOwnDoctor(), addExperience);
router.put('/doctor/:doctorId/experience/:experienceId', doctorOnly, requireOwnDoctor(), updateExperience);
router.delete('/doctor/:doctorId/experience/:experienceId', doctorOnly, requireOwnDoctor(), deleteExperience);

// Services Routes
router.post('/doctor/:doctorId/services', doctorOnly, requireOwnDoctor(), addService);
router.put('/doctor/:doctorId/services/:serviceId', doctorOnly, requireOwnDoctor(), updateService);
router.delete('/doctor/:doctorId/services/:serviceId', doctorOnly, requireOwnDoctor(), deleteService);

// Chamber Routes
router.post('/doctor/:doctorId/chambers', doctorOnly, requireOwnDoctor(), addChamber);
router.put('/doctor/:doctorId/chambers/:chamberId', doctorOnly, requireOwnDoctor(), updateChamber);
router.delete('/doctor/:doctorId/chambers/:chamberId', doctorOnly, requireOwnDoctor(), deleteChamber);

// Testimonials Routes
router.post('/doctor/:doctorId/testimonials', doctorOnly, requireOwnDoctor(), addTestimonial);
router.put('/doctor/:doctorId/testimonials/:testimonialId', doctorOnly, requireOwnDoctor(), updateTestimonial);
router.delete('/doctor/:doctorId/testimonials/:testimonialId', doctorOnly, requireOwnDoctor(), deleteTestimonial);

// Social Media Routes
router.put('/doctor/:doctorId/social-media', doctorOnly, requireOwnDoctor(), updateSocialMedia);

// Contact Routes
router.get('/doctor/:doctorId/contact', doctorOnly, requireOwnDoctor(), getContact);
router.put('/doctor/:doctorId/contact', doctorOnly, requireOwnDoctor(), updateContact);

// Dashboard Stats
router.get('/doctor/:doctorId/stats', doctorOnly, requireOwnDoctor(), getDashboardStats);

// Migration endpoint (dev utility)
router.post('/migrate', doctorOnly, runWebsiteMigration);

export default router;

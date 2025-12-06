import express from 'express';
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
  getDashboardStats
} from '../controllers/websiteController.js';

const router = express.Router();

// Frontend-compatible routes (for PublicWebsiteTab)
router.get('/profile/:doctorId', getDoctorProfile);
router.post('/profile/:doctorId', updateDoctorProfile);
router.post('/settings/:doctorId', updateWebsiteSettings);
router.post('/education/:doctorId', addEducation);
router.post('/experience/:doctorId', addExperience);
router.post('/services/:doctorId', addService);
router.post('/chambers/:doctorId', addChamber);
router.post('/social-media/:doctorId', updateSocialMedia);
router.post('/contact/:doctorId', updateContact);
router.get('/contact/:doctorId', getContact);

// Doctor Profile Routes
router.get('/doctor/:doctorId/profile', getDoctorProfile);
router.put('/doctor/:doctorId/profile', updateDoctorProfile);
router.post('/doctor/:doctorId/upload-image', uploadProfileImage);

// Public Profile Routes
router.get('/public/:urlSlug', getPublicProfile);

// Website Settings
router.get('/doctor/:doctorId/settings', getDoctorWebsiteSettings);
router.put('/doctor/:doctorId/settings', updateWebsiteSettings);

// Education Routes
router.post('/doctor/:doctorId/education', addEducation);
router.put('/doctor/:doctorId/education/:educationId', updateEducation);
router.delete('/doctor/:doctorId/education/:educationId', deleteEducation);

// Experience Routes
router.post('/doctor/:doctorId/experience', addExperience);
router.put('/doctor/:doctorId/experience/:experienceId', updateExperience);
router.delete('/doctor/:doctorId/experience/:experienceId', deleteExperience);

// Services Routes
router.post('/doctor/:doctorId/services', addService);
router.put('/doctor/:doctorId/services/:serviceId', updateService);
router.delete('/doctor/:doctorId/services/:serviceId', deleteService);

// Chamber Routes
router.post('/doctor/:doctorId/chambers', addChamber);
router.put('/doctor/:doctorId/chambers/:chamberId', updateChamber);
router.delete('/doctor/:doctorId/chambers/:chamberId', deleteChamber);

// Testimonials Routes
router.post('/doctor/:doctorId/testimonials', addTestimonial);
router.put('/doctor/:doctorId/testimonials/:testimonialId', updateTestimonial);
router.delete('/doctor/:doctorId/testimonials/:testimonialId', deleteTestimonial);

// Social Media Routes
router.put('/doctor/:doctorId/social-media', updateSocialMedia);

// Contact Routes
router.get('/doctor/:doctorId/contact', getContact);
router.put('/doctor/:doctorId/contact', updateContact);

// Dashboard Stats
router.get('/doctor/:doctorId/stats', getDashboardStats);

export default router;
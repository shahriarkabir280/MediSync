import express from 'express';
import {
    getEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    getAppointmentEvents,
} from '../controllers/calendarController.js';
import { authenticateToken } from './authRoutes.js';

const router = express.Router();

router.use(authenticateToken);

// Custom calendar events
router.get('/', getEvents);
router.get('/appointments', getAppointmentEvents); // read-only appointment overlay
router.get('/:id', getEventById);
router.post('/', createEvent);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

export default router;

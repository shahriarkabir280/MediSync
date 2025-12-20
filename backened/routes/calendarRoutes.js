import express from 'express';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../controllers/calendarController.js';
import { authenticateToken } from './authRoutes.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getEvents);
router.post('/', createEvent);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

export default router;

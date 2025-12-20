import { sql } from '../config/db.js';

export const getEvents = async (req, res) => {
    try {
        const doctorId = req.user.id;
        if (!doctorId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const events = await sql`
      SELECT id, title, start_time as start, end_time as "end", type, color
      FROM calendar_events
      WHERE doctor_id = ${doctorId}
      ORDER BY start_time ASC
    `;

        res.json(events);
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        res.status(500).json({ error: 'Failed to fetch calendar events' });
    }
};

export const createEvent = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const { title, start, end, type, color } = req.body;

        if (!doctorId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!title || !start || !end) {
            return res.status(400).json({ error: 'Title, start, and end are required' });
        }

        const [newEvent] = await sql`
      INSERT INTO calendar_events (doctor_id, title, start_time, end_time, type, color)
      VALUES (${doctorId}, ${title}, ${start}, ${end}, ${type}, ${color})
      RETURNING id, title, start_time as start, end_time as "end", type, color
    `;

        res.status(201).json(newEvent);
    } catch (error) {
        console.error('Error creating calendar event:', error);
        res.status(500).json({ error: 'Failed to create calendar event' });
    }
};

export const updateEvent = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const { id } = req.params;
        const { title, start, end, type, color } = req.body;

        if (!doctorId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const [updatedEvent] = await sql`
      UPDATE calendar_events
      SET title = ${title}, start_time = ${start}, end_time = ${end}, type = ${type}, color = ${color}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND doctor_id = ${doctorId}
      RETURNING id, title, start_time as start, end_time as "end", type, color
    `;

        if (!updatedEvent) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json(updatedEvent);
    } catch (error) {
        console.error('Error updating calendar event:', error);
        res.status(500).json({ error: 'Failed to update calendar event' });
    }
};

export const deleteEvent = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const { id } = req.params;

        if (!doctorId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const result = await sql`
      DELETE FROM calendar_events
      WHERE id = ${id} AND doctor_id = ${doctorId}
      RETURNING id
    `;

        if (result.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting calendar event:', error);
        res.status(500).json({ error: 'Failed to delete calendar event' });
    }
};

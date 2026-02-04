import { supabase } from '../config/db.js';

export const getEvents = async (req, res) => {
    try {
        const doctorId = req.user.id;
        if (!doctorId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { data: events, error } = await supabase
            .from('calendar_events')
            .select('id, title, start_time, end_time, type, color')
            .eq('doctor_id', doctorId)
            .order('start_time', { ascending: true });

        if (error) throw error;

        // Map fields to match frontend expectation (start_time -> start, end_time -> end)
        const formattedEvents = events.map(e => ({
            id: e.id,
            title: e.title,
            start: e.start_time,
            end: e.end_time,
            type: e.type,
            color: e.color
        }));

        res.json(formattedEvents);
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

        const { data: newEvent, error } = await supabase
            .from('calendar_events')
            .insert({
                doctor_id: doctorId,
                title,
                start_time: start,
                end_time: end,
                type,
                color
            })
            .select('id, title, start_time, end_time, type, color')
            .single();

        if (error) throw error;

        res.status(201).json({
            id: newEvent.id,
            title: newEvent.title,
            start: newEvent.start_time,
            end: newEvent.end_time,
            type: newEvent.type,
            color: newEvent.color
        });
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

        const { data: updatedEvent, error } = await supabase
            .from('calendar_events')
            .update({
                title,
                start_time: start,
                end_time: end,
                type,
                color,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('doctor_id', doctorId)
            .select('id, title, start_time, end_time, type, color')
            .single();

        if (error) throw error;

        if (!updatedEvent) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json({
            id: updatedEvent.id,
            title: updatedEvent.title,
            start: updatedEvent.start_time,
            end: updatedEvent.end_time,
            type: updatedEvent.type,
            color: updatedEvent.color
        });
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

        const { data, error } = await supabase
            .from('calendar_events')
            .delete()
            .eq('id', id)
            .eq('doctor_id', doctorId)
            .select('id')
            .single(); // Use single to check if row existed

        if (error) throw error;

        if (!data) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting calendar event:', error);
        res.status(500).json({ error: 'Failed to delete calendar event' });
    }
};

import { supabase } from '../config/db.js';

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatEvent = (e) => ({
    id: e.id,
    title: e.title,
    start: e.start_time,
    end: e.end_time,
    type: e.type || null,
    color: e.color || 'blue',
    description: e.description || null,    // null if column not yet migrated
    location: e.location || null,          // null if column not yet migrated
    readOnly: false,
});

// ── Get all events (with optional date-range filter) ─────────────────────────
export const getEvents = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const { start, end } = req.query;

        let query = supabase
            .from('calendar_events')
            .select('*')                   // use * so query works before/after migration
            .eq('doctor_id', doctorId)
            .order('start_time', { ascending: true });

        if (start) query = query.gte('start_time', start);
        if (end) query = query.lte('start_time', end);

        const { data: events, error } = await query;
        if (error) throw error;

        res.json(events.map(formatEvent));
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        res.status(500).json({ error: 'Failed to fetch calendar events' });
    }
};

// ── Get single event by ID ────────────────────────────────────────────────────
export const getEventById = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const { id } = req.params;

        const { data: event, error } = await supabase
            .from('calendar_events')
            .select('*')
            .eq('id', id)
            .eq('doctor_id', doctorId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Event not found' });
            }
            throw error;
        }

        res.json(formatEvent(event));
    } catch (error) {
        console.error('Error fetching calendar event:', error);
        res.status(500).json({ error: 'Failed to fetch calendar event' });
    }
};

// ── Create event ──────────────────────────────────────────────────────────────
export const createEvent = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const { title, start, end, type, color, description, location } = req.body;

        if (!title || !start || !end) {
            return res.status(400).json({ error: 'Title, start, and end are required' });
        }

        // Build insert payload — only include description/location if provided
        // (safe before migration: Supabase ignores unknown keys, but we guard anyway)
        const payload = {
            doctor_id: doctorId,
            title: title.trim(),
            start_time: start,
            end_time: end,
            type: type || null,
            color: color || 'blue',
        };
        if (description !== undefined) payload.description = description || null;
        if (location !== undefined) payload.location = location || null;

        let { data: newEvent, error } = await supabase
            .from('calendar_events')
            .insert(payload)
            .select('*')
            .single();

        // Fallback if the user hasn't migrated `description` / `location` (or stale schema cache)
        if (error && error.code === 'PGRST204') {
            console.warn('Columns description/location missing in calendar_events. Retrying without them.');
            delete payload.description;
            delete payload.location;

            const retry = await supabase
                .from('calendar_events')
                .insert(payload)
                .select('*')
                .single();

            newEvent = retry.data;
            error = retry.error;
        }

        if (error) {
            console.error('Error in createEvent payload:', payload);
            throw error;
        }

        console.log('Successfully created event:', newEvent.id, 'Start:', newEvent.start_time);
        res.status(201).json(formatEvent(newEvent));
    } catch (error) {
        console.error('Error creating calendar event:', error);
        res.status(500).json({ error: 'Failed to create calendar event' });
    }
};

// ── Update event ──────────────────────────────────────────────────────────────
export const updateEvent = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const { id } = req.params;
        const { title, start, end, type, color, description, location } = req.body;

        const updatePayload = { updated_at: new Date().toISOString() };
        if (title !== undefined) updatePayload.title = title.trim();
        if (start !== undefined) updatePayload.start_time = start;
        if (end !== undefined) updatePayload.end_time = end;
        if (type !== undefined) updatePayload.type = type || null;
        if (color !== undefined) updatePayload.color = color || 'blue';
        if (description !== undefined) updatePayload.description = description || null;
        if (location !== undefined) updatePayload.location = location || null;

        let { data: updatedEvent, error } = await supabase
            .from('calendar_events')
            .update(updatePayload)
            .eq('id', id)
            .eq('doctor_id', doctorId)
            .select('*')
            .single();

        // Fallback if the user hasn't migrated `description` / `location` (or stale schema cache)
        if (error && error.code === 'PGRST204') {
            console.warn('Columns description/location missing in calendar_events. Retrying without them.');
            delete updatePayload.description;
            delete updatePayload.location;

            const retry = await supabase
                .from('calendar_events')
                .update(updatePayload)
                .eq('id', id)
                .eq('doctor_id', doctorId)
                .select('*')
                .single();

            updatedEvent = retry.data;
            error = retry.error;
        }

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Event not found' });
            }
            throw error;
        }

        res.json(formatEvent(updatedEvent));
    } catch (error) {
        console.error('Error updating calendar event:', error);
        res.status(500).json({ error: 'Failed to update calendar event' });
    }
};

// ── Delete event ──────────────────────────────────────────────────────────────
export const deleteEvent = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const { id } = req.params;

        const { data, error } = await supabase
            .from('calendar_events')
            .delete()
            .eq('id', id)
            .eq('doctor_id', doctorId)
            .select('id')
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Event not found' });
            }
            throw error;
        }

        res.json({ message: 'Event deleted successfully', id: data.id });
    } catch (error) {
        console.error('Error deleting calendar event:', error);
        res.status(500).json({ error: 'Failed to delete calendar event' });
    }
};

// ── Get appointments as read-only calendar events ─────────────────────────────
export const getAppointmentEvents = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const { start, end } = req.query;

        let query = supabase
            .from('appointments')
            .select(`
                id,
                appointment_date,
                appointment_time,
                status,
                appointment_type,
                notes,
                patients (first_name, last_name)
            `)
            .eq('doctor_id', doctorId)
            .not('status', 'eq', 'cancelled')
            .order('appointment_date', { ascending: true })
            .order('appointment_time', { ascending: true });

        if (start) query = query.gte('appointment_date', start.split('T')[0]);
        if (end) query = query.lte('appointment_date', end.split('T')[0]);

        const { data: appointments, error } = await query;
        if (error) throw error;

        const events = (appointments || []).map(appt => {
            const patientName = appt.patients
                ? `${appt.patients.first_name} ${appt.patients.last_name}`
                : 'Patient';

            const timeStr = appt.appointment_time || '09:00:00';
            const startDt = new Date(`${appt.appointment_date}T${timeStr}`);
            const endDt = new Date(startDt.getTime() + 30 * 60 * 1000);

            let color = 'blue';
            if (appt.status === 'completed') color = 'green';
            else if (appt.appointment_type === 'surgery') color = 'red';
            else if (appt.appointment_type === 'follow-up') color = 'orange';
            else if (appt.appointment_type === 'meeting') color = 'purple';

            return {
                id: `appt-${appt.id}`,
                title: `${patientName} — ${appt.appointment_type || 'Appointment'}`,
                start: startDt.toISOString(),
                end: endDt.toISOString(),
                type: appt.appointment_type || 'appointment',
                color,
                description: appt.notes || null,
                location: null,
                readOnly: true,
            };
        });

        res.json(events);
    } catch (error) {
        console.error('Error fetching appointment events:', error);
        res.status(500).json({ error: 'Failed to fetch appointment events' });
    }
};

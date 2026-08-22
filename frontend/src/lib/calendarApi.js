import { api, clearCache } from './api';

const BASE = '/calendar';

const toDate = v => (v ? new Date(v) : null);

const formatEvent = (event) => ({
    ...event,
    start: toDate(event.start),
    end: toDate(event.end),
});

const calendarApi = {
    // Fetch all custom events — bypass cache so grid is always fresh
    getEvents: async (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        const url = qs ? `${BASE}?${qs}` : BASE;
        const data = await api.get(url, { noCache: true });
        return data.map(formatEvent);
    },

    // Fetch appointments overlaid as read-only events
    getAppointmentEvents: async (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        const url = qs ? `${BASE}/appointments?${qs}` : `${BASE}/appointments`;
        const data = await api.get(url, { noCache: true });
        return data.map(formatEvent);
    },

    getEventById: async (id) => {
        const data = await api.get(`${BASE}/${id}`, { noCache: true });
        return formatEvent(data);
    },

    createEvent: async (eventData) => {
        const event = await api.post(BASE, eventData);
        clearCache(BASE);
        return formatEvent(event);
    },

    updateEvent: async (id, eventData) => {
        const event = await api.put(`${BASE}/${id}`, eventData);
        clearCache(BASE);
        return formatEvent(event);
    },

    deleteEvent: async (id) => {
        await api.delete(`${BASE}/${id}`);
        clearCache(BASE);
        return true;
    },
};

export default calendarApi;

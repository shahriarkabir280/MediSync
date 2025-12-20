import { api } from './api';

const API_BASE = '/calendar';

const calendarApi = {
    getEvents: async () => {
        const data = await api.get(API_BASE);
        // Convert date strings back to Date objects
        return data.map(event => ({
            ...event,
            start: new Date(event.start),
            end: new Date(event.end)
        }));
    },

    createEvent: async (eventData) => {
        const event = await api.post(API_BASE, eventData);
        return {
            ...event,
            start: new Date(event.start),
            end: new Date(event.end)
        };
    },

    updateEvent: async (id, eventData) => {
        const event = await api.put(`${API_BASE}/${id}`, eventData);
        return {
            ...event,
            start: new Date(event.start),
            end: new Date(event.end)
        };
    },

    deleteEvent: async (id) => {
        await api.delete(`${API_BASE}/${id}`);
        return true;
    }
};

export default calendarApi;

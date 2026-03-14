import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  RefreshCw,
  X,
  Lock,
  CheckCircle2,
  Zap,
  ArrowRight
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import calendarApi from '../../lib/calendarApi';

const CalendarTab = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingEventId, setEditingEventId] = useState(null);

  const colorMap = {
    blue: { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-500', shadow: 'shadow-blue-100', dot: 'bg-blue-500' },
    red: { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300', border: 'border-red-500', shadow: 'shadow-red-100', dot: 'bg-red-500' },
    green: { bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-700 dark:text-green-300', border: 'border-green-500', shadow: 'shadow-green-100', dot: 'bg-green-500' },
    orange: { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-500', shadow: 'shadow-orange-100', dot: 'bg-orange-500' },
    purple: { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-500', shadow: 'shadow-purple-100', dot: 'bg-purple-500' },
  };

  const [newEvent, setNewEvent] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    type: '',
    color: 'blue',
    description: '',
    location: '',
  });

  const [viewingReadOnly, setViewingReadOnly] = useState(null);
  const [viewingCustomEvent, setViewingCustomEvent] = useState(null);
  const [cellEventsModal, setCellEventsModal] = useState(null);

  useEffect(() => { loadEvents(); }, []);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const [customEvents, apptEvents] = await Promise.all([
        calendarApi.getEvents(),
        calendarApi.getAppointmentEvents().catch(() => []),
      ]);
      setEvents([...customEvents, ...apptEvents]);
    } catch (err) {
      toast.error('Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  const openNewEventModal = (dateOverride = null, timeOverride = null) => {
    setEditingEventId(null);
    setViewingReadOnly(null);
    setViewingCustomEvent(null);
    setNewEvent({
      title: '',
      date: dateOverride ?? new Date().toISOString().split('T')[0],
      time: timeOverride ?? '09:00',
      type: '',
      color: 'blue',
      description: '',
      location: '',
    });
    setIsEventModalOpen(true);
  };

  const handleEditClick = (event) => {
    if (event.readOnly) {
      setViewingReadOnly(event);
      setViewingCustomEvent(null);
      setEditingEventId(null);
      setIsEventModalOpen(true);
      return;
    }
    setViewingCustomEvent(event);
    setViewingReadOnly(null);
    setEditingEventId(null);
    setIsEventModalOpen(true);
  };

  const handleEnterEditMode = (event) => {
    setViewingCustomEvent(null);
    setViewingReadOnly(null);
    setEditingEventId(event.id);
    setNewEvent({
      title: event.title,
      date: new Date(event.start).toISOString().split('T')[0],
      time: new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      type: event.type || '',
      color: event.color || 'blue',
      description: event.description || '',
      location: event.location || '',
    });
  };

  const closeModal = () => {
    setIsEventModalOpen(false);
    setEditingEventId(null);
    setViewingReadOnly(null);
    setViewingCustomEvent(null);
    setCellEventsModal(null);
    setNewEvent({ title: '', date: new Date().toISOString().split('T')[0], time: '09:00', type: '', color: 'blue', description: '', location: '' });
  };

  const handleCellClick = (dateStr, time, cellEvents) => {
    if (cellEvents && cellEvents.length > 0) {
      setCellEventsModal({ events: cellEvents, dateStr, time });
    } else {
      openNewEventModal(dateStr, time);
    }
  };

  const handlePickEventFromList = (event) => {
    setCellEventsModal(null);
    handleEditClick(event);
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.title.trim()) { toast.error('Please enter a title'); return; }
    const [year, month, day] = newEvent.date.split('-').map(Number);
    const [hour, minute] = newEvent.time.split(':').map(Number);
    const start = new Date(year, month - 1, day, hour, minute);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    try {
      const payload = {
        title: newEvent.title,
        start: start.toISOString(),
        end: end.toISOString(),
        type: newEvent.type,
        color: newEvent.color,
        description: newEvent.description || null,
        location: newEvent.location || null,
      };
      if (editingEventId) {
        const updated = await calendarApi.updateEvent(editingEventId, payload);
        setEvents(events.map(ev => ev.id === editingEventId ? updated : ev));
        toast.success('Event updated');
      } else {
        const created = await calendarApi.createEvent(payload);
        setEvents(prev => [...prev, created]);
        toast.success('Event added');
      }
      closeModal();
    } catch {
      toast.error(editingEventId ? 'Failed to update event' : 'Failed to create event');
    }
  };

  const handleDeleteEvent = async (id) => {
    const event = events.find(ev => ev.id === id);
    if (event?.readOnly) { toast.error('Appointment events cannot be deleted here.'); return; }
    if (!window.confirm('Delete this event?')) return;
    try {
      await calendarApi.deleteEvent(id);
      setEvents(events.filter(ev => ev.id !== id));
      closeModal();
      toast.success('Event deleted');
    } catch {
      toast.error('Failed to delete event');
    }
  };

  const computeColumnLayout = (evtList) => {
    const sorted = [...evtList].sort((a, b) => new Date(a.start) - new Date(b.start));
    const result = sorted.map(ev => ({ ...ev, _col: 0, _numCols: 1 }));
    let i = 0;
    while (i < result.length) {
      let clusterEnd = new Date(result[i].end || new Date(result[i].start).getTime() + 3_600_000);
      let j = i + 1;
      while (j < result.length && new Date(result[j].start) < clusterEnd) {
        const evEnd = new Date(result[j].end || new Date(result[j].start).getTime() + 3_600_000);
        if (evEnd > clusterEnd) clusterEnd = evEnd;
        j++;
      }
      const cluster = result.slice(i, j);
      const numCols = cluster.length;
      cluster.forEach((ev, idx) => { ev._col = idx; ev._numCols = numCols; });
      i = j;
    }
    return result;
  };

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const prevMonthDays = getDaysInMonth(year, month - 1);
    const cells = [];
    for (let i = firstDay - 1; i >= 0; i--)
      cells.push({ date: prevMonthDays - i, month: 'prev', fullDate: new Date(year, month - 1, prevMonthDays - i) });
    for (let i = 1; i <= daysInMonth; i++)
      cells.push({ date: i, month: 'current', fullDate: new Date(year, month, i) });
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++)
      cells.push({ date: i, month: 'next', fullDate: new Date(year, month + 1, i) });
    return cells;
  }, [currentDate]);

  const weekData = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(currentDate.getDate() - currentDate.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [currentDate]);

  const SLOT_HEIGHT = 56;
  const DAY_START_HOUR = 7;
  const timeSlots = useMemo(() =>
    Array.from({ length: 15 }, (_, i) => {
      const h = i + DAY_START_HOUR;
      return `${h.toString().padStart(2, '0')}:00`;
    }), []);

  const [nowMinutes, setNowMinutes] = useState(() => {
    const n = new Date();
    return (n.getHours() - DAY_START_HOUR) * 60 + n.getMinutes();
  });
  useEffect(() => {
    const id = setInterval(() => {
      const n = new Date();
      setNowMinutes((n.getHours() - DAY_START_HOUR) * 60 + n.getMinutes());
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const yearName = currentDate.getFullYear();

  const navigatePeriod = (direction) => {
    const d = new Date(currentDate);
    if (view === 'month') d.setMonth(d.getMonth() + direction);
    else if (view === 'week') d.setDate(d.getDate() + direction * 7);
    else d.setDate(d.getDate() + direction);
    setCurrentDate(d);
  };

  const isToday = (date) => {
    const t = new Date();
    return date.getDate() === t.getDate() && date.getMonth() === t.getMonth() && date.getFullYear() === t.getFullYear();
  };

  const getEventsForDate = (date) =>
    events.filter(ev => {
      if (!ev.start) return false;
      const d = new Date(ev.start);
      return d.getDate() === date.getDate() &&
        d.getMonth() === date.getMonth() &&
        d.getFullYear() === date.getFullYear();
    });

  const getEventsForDateTime = (date, timeStr) => {
    const [h] = timeStr.split(':').map(Number);
    return events.filter(ev => {
      const d = new Date(ev.start);
      return d.getDate() === date.getDate() && d.getMonth() === date.getMonth() &&
        d.getFullYear() === date.getFullYear() && d.getHours() === h;
    });
  };

  const getEventsForDayColumn = (date) => {
    const dayStart = new Date(date); dayStart.setHours(DAY_START_HOUR, 0, 0, 0);
    const dayEnd = new Date(date); dayEnd.setHours(DAY_START_HOUR + timeSlots.length, 0, 0, 0);
    const dateStr = date.toDateString();
    return events.filter(ev => {
      if (!ev.start) return false;
      const s = new Date(ev.start);
      if (s.toDateString() !== dateStr) return false;
      const e = new Date(ev.end || s.getTime() + 3600_000);
      return s < dayEnd && e > dayStart;
    });
  };

  const getEventPosition = (event) => {
    const start = new Date(event.start);
    const end = new Date(event.end || new Date(event.start).getTime() + 60 * 60 * 1000);
    const startMins = (start.getHours() - DAY_START_HOUR) * 60 + start.getMinutes();
    const durationMins = Math.max(30, (end - start) / 60_000);
    const top = (startMins / 60) * SLOT_HEIGHT;
    const height = (durationMins / 60) * SLOT_HEIGHT;
    return { top: Math.max(0, top), height: Math.max(22, height) };
  };

  const upcomingEvents = events
    .filter(ev => new Date(ev.start) >= new Date())
    .sort((a, b) => new Date(a.start) - new Date(b.start))
    .slice(0, 5);

  const counts = useMemo(() => {
    const consultationKeywords = ['appointment', 'consultation', 'consult', 'consultations'];
    const surgeryKeywords = ['surgery', 'surgeries', 'operation'];
    const meetingKeywords = ['meeting', 'meetings', 'conference'];

    return {
      consultations: events.filter(ev => consultationKeywords.includes(ev.type?.toLowerCase())).length,
      surgeries: events.filter(ev => surgeryKeywords.includes(ev.type?.toLowerCase())).length,
      meetings: events.filter(ev => meetingKeywords.includes(ev.type?.toLowerCase())).length,
      total: events.length
    };
  }, [events]);

  const headerTitle = view === 'day'
    ? currentDate.toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' })
    : `${monthName} ${yearName}`;

  const EventChip = ({ event, onClick }) => (
    <div
      onClick={onClick}
      className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium truncate border-l-2 shadow-sm cursor-pointer hover:shadow-md transition-all
        ${colorMap[event.color]?.bg || 'bg-muted'}
        ${colorMap[event.color]?.text || 'text-foreground'}
        ${colorMap[event.color]?.border || 'border-border'}`}
    >
      {event.title}
    </div>
  );

  const SidebarPanel = () => (
    <div className="space-y-4">
      {/* Overview */}
      <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center">
          <CalendarIcon className="w-4 h-4 mr-2 text-indigo-500" />
          Overview
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-2.5 rounded-lg border border-indigo-100 dark:border-indigo-900/30 flex flex-col items-center justify-center">
            <p className="text-[10px] font-medium text-muted-foreground mb-0.5">Consults</p>
            <p className="text-xl font-bold text-indigo-600">
              {counts.consultations}
            </p>
          </div>
          <div className="bg-red-50/50 dark:bg-red-900/10 p-2.5 rounded-lg border border-red-100 dark:border-red-900/30 flex flex-col items-center justify-center">
            <p className="text-[10px] font-medium text-muted-foreground mb-0.5">Surgeries</p>
            <p className="text-xl font-bold text-red-600">
              {counts.surgeries}
            </p>
          </div>
          <div className="bg-purple-50/50 dark:bg-purple-900/10 p-2.5 rounded-lg border border-purple-100 dark:border-purple-900/30 flex flex-col items-center justify-center">
            <p className="text-[10px] font-medium text-muted-foreground mb-0.5">Meetings</p>
            <p className="text-xl font-bold text-purple-600">
              {counts.meetings}
            </p>
          </div>
        </div>
      </div>

      {/* Upcoming */}
      <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
        <h3 className="text-sm font-semibold text-foreground mb-3">Upcoming</h3>
        <div className="space-y-1.5">
          {upcomingEvents.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-3">No upcoming events</p>
          )}
          {upcomingEvents.map(event => (
            <div
              key={event.id}
              onClick={() => handleEditClick(event)}
              className="group relative flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors border border-transparent cursor-pointer"
            >
              <div className={`w-1 h-8 rounded-full shrink-0 ${colorMap[event.color]?.dot || 'bg-muted'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-foreground truncate">{event.title}</p>
                <div className="flex items-center text-[10px] font-medium text-muted-foreground mt-0.5">
                  <Clock className="w-3 h-3 mr-1 shrink-0" />
                  {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); handleDeleteEvent(event.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 rounded-md transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Guide */}
      <div className="bg-indigo-600 rounded-xl p-4 shadow-sm text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-emerald-300" />
            <h3 className="text-sm font-semibold text-white">Quick guide</h3>
          </div>
          <div className="space-y-2 mt-3">
            <div className="flex items-start gap-2 bg-white/10 rounded-lg p-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 mt-0.5 shrink-0" />
              <p className="text-[10px] text-indigo-100 leading-tight">Click any time slot to add events or view existing ones.</p>
            </div>
            <div className="flex items-start gap-2 bg-white/10 rounded-lg p-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 mt-0.5 shrink-0" />
              <p className="text-[10px] text-indigo-100 leading-tight">Appointments from your schedule appear as read-only events.</p>
            </div>
          </div>
          <button
            onClick={() => loadEvents()}
            className="mt-4 w-full flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors border border-white/20"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh status
          </button>
        </div>
        <CalendarIcon className="absolute -bottom-4 -right-4 w-24 h-24 text-white/5 rotate-12" />
      </div>
    </div>
  );

  return (
    <div className="flex h-full flex-col p-2 sm:p-4 bg-background">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-xl border border-indigo-100 dark:border-indigo-800">
            <CalendarIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground leading-tight">
              {headerTitle}
            </h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
              Medical schedule overview
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
          {/* Default view navigation arrows */}
          <div className="flex items-center bg-muted/50 rounded-lg border border-border p-1 shrink-0">
            <button onClick={() => navigatePeriod(-1)} className="p-1.5 hover:bg-background rounded-md text-muted-foreground hover:text-foreground transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 hover:bg-background rounded-md text-xs font-medium text-foreground transition-all">
              Today
            </button>
            <button onClick={() => navigatePeriod(1)} className="p-1.5 hover:bg-background rounded-md text-muted-foreground hover:text-foreground transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-muted/50 rounded-lg border border-border p-1 shrink-0">
            {['month', 'week', 'day'].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-md text-[11px] font-semibold capitalize transition-all
                  ${view === v ? 'bg-background text-indigo-600 shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {v}
              </button>
            ))}
          </div>

          <button
            onClick={() => openNewEventModal()}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden xs:inline sm:inline">New event</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden min-h-0">
        <div className="flex-1 bg-card rounded-xl shadow-sm border border-border flex flex-col overflow-hidden relative min-h-0">
          {isLoading && (
            <div className="absolute inset-0 bg-card/60 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs font-medium text-muted-foreground">Loading calendar...</p>
              </div>
            </div>
          )}

          {/* Month View */}
          {view === 'month' && (
            <>
              <div className="grid grid-cols-7 border-b border-border bg-muted/30 shrink-0">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="py-2.5 text-center text-[10px] font-medium text-muted-foreground">
                    <span className="sm:hidden">{day.charAt(0)}</span>
                    <span className="hidden sm:inline">{day}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 flex-1 overflow-y-auto bg-muted/10">
                {calendarData.map((cell, idx) => {
                  const dateEvents = getEventsForDate(cell.fullDate);
                  const isCurrent = cell.month === 'current';
                  const isCellToday = isToday(cell.fullDate);
                  return (
                    <div
                      key={idx}
                      className={`min-h-[80px] sm:min-h-[100px] p-1.5 sm:p-2 border-r border-b border-border/50 transition-colors group relative bg-card hover:bg-muted/30
                        ${!isCurrent ? 'opacity-40 pointer-events-none' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <span className={`text-[11px] sm:text-xs font-medium flex items-center justify-center w-6 h-6 rounded-md
                          ${isCellToday ? 'bg-indigo-600 text-white shadow-sm' : 'text-foreground'}`}
                        >
                          {cell.date}
                        </span>
                        {isCurrent && (
                          <button
                            onClick={() => openNewEventModal(cell.fullDate.toISOString().split('T')[0])}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded-md transition-all"
                          >
                            <Plus className="w-3 h-3 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                      <div className="space-y-0.5">
                        {dateEvents.slice(0, 3).map(event => (
                          <EventChip key={`evt-${event.id}-${event.start}`} event={event} onClick={(e) => { e.stopPropagation(); handleEditClick(event); }} />
                        ))}
                        {dateEvents.length > 3 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCellClick(cell.fullDate.toISOString().split('T')[0], '09:00', dateEvents); }}
                            className="text-[9px] text-indigo-500 font-medium pl-1 hover:text-indigo-600 mt-1 cursor-pointer block"
                          >
                            +{dateEvents.length - 3} more
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Week View */}
          {view === 'week' && (() => {
            const totalH = timeSlots.length * SLOT_HEIGHT;
            const todayInWeek = weekData.findIndex(d => isToday(d));
            const showNow = todayInWeek >= 0 && nowMinutes >= 0 && nowMinutes <= timeSlots.length * 60;
            return (
              <>
                <div className="flex border-b border-border bg-muted/30 shrink-0">
                  <div className="w-12 sm:w-16 shrink-0 border-r border-border/40" />
                  {weekData.map((date, i) => (
                    <div key={i} className={`flex-1 min-w-0 py-2 sm:py-3 text-center border-r border-border/40 ${isToday(date) ? 'bg-indigo-50 dark:bg-indigo-900/10' : ''}`}>
                      <p className="text-[9px] sm:text-[10px] font-medium text-muted-foreground truncate">
                        <span className="sm:hidden">{date.toLocaleDateString('default', { weekday: 'narrow' })}</span>
                        <span className="hidden sm:inline">{date.toLocaleDateString('default', { weekday: 'short' })}</span>
                      </p>
                      <p className={`text-sm sm:text-base font-medium mt-0.5 w-7 h-7 flex items-center justify-center mx-auto rounded-md
                        ${isToday(date) ? 'bg-indigo-600 text-white shadow-sm' : 'text-foreground'}`}>
                        {date.getDate()}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto relative" style={{ minHeight: 0 }}>
                  <div className="flex" style={{ height: totalH }}>
                    <div className="w-12 sm:w-16 shrink-0 relative bg-muted/10 border-r border-border/40 z-10">
                      {timeSlots.map((time, idx) => (
                        <div key={idx} className="absolute text-right pr-2 text-[9px] font-medium text-muted-foreground w-full"
                          style={{ top: idx * SLOT_HEIGHT, height: SLOT_HEIGHT }}>
                          <span className="mt-1 block">{time}</span>
                        </div>
                      ))}
                    </div>

                    {weekData.map((date, colIdx) => {
                      const colEvents = getEventsForDayColumn(date);
                      const dateStr = date.toISOString().split('T')[0];
                      return (
                        <div key={colIdx} className={`flex-1 min-w-0 border-r border-border/40 relative ${isToday(date) ? 'bg-indigo-50/30 dark:bg-indigo-900/5' : ''}`}
                          style={{ height: totalH }}>
                          {timeSlots.map((_, idx) => (
                            <div key={idx}
                              className="absolute w-full border-b border-border/20 hover:bg-muted/30 transition-colors cursor-pointer group"
                              style={{ top: idx * SLOT_HEIGHT, height: SLOT_HEIGHT }}
                              onClick={() => {
                                const h = (DAY_START_HOUR + idx).toString().padStart(2, '0');
                                const time = `${h}:00`;
                                const slotEvents = getEventsForDateTime(date, time);
                                handleCellClick(dateStr, time, slotEvents);
                              }}
                            >
                              <div className="absolute w-full border-b border-border/10" style={{ top: SLOT_HEIGHT / 2 }} />
                              <Plus className="absolute right-1 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          ))}

                          {computeColumnLayout(colEvents).map(event => {
                            const { top, height } = getEventPosition(event);
                            const colW = 100 / event._numCols;
                            const colLeft = event._col * colW;
                            return (
                              <div key={event.id}
                                onClick={e => { e.stopPropagation(); handleEditClick(event); }}
                                className={`absolute rounded-md px-1.5 py-1 cursor-pointer shadow-sm hover:shadow-md hover:z-10 transition-shadow border-l-[3px] z-[1] overflow-hidden
                                  ${colorMap[event.color]?.bg || 'bg-muted'}
                                  ${colorMap[event.color]?.text || 'text-foreground'}
                                  ${colorMap[event.color]?.border || 'border-border'}
                                  ${event.readOnly ? 'opacity-85' : ''}`}
                                style={{ top, height: height - 2, left: `${colLeft}%`, width: `${colW - 1}%` }}
                              >
                                <p className="text-[10px] font-medium leading-tight line-clamp-2">{event.title}</p>
                              </div>
                            );
                          })}

                          {showNow && colIdx === todayInWeek && (
                            <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: (nowMinutes / 60) * SLOT_HEIGHT }}>
                              <div className="flex items-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 -ml-1 shrink-0" />
                                <div className="flex-1 h-px bg-red-500" />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            );
          })()}

          {/* Day View */}
          {view === 'day' && (() => {
            const totalH = timeSlots.length * SLOT_HEIGHT;
            const dateStr = currentDate.toISOString().split('T')[0];
            const dayEvents = getEventsForDayColumn(currentDate);
            const isCurrentDay = isToday(currentDate);
            const showNow = isCurrentDay && nowMinutes >= 0 && nowMinutes <= timeSlots.length * 60;
            return (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex border-b border-border bg-muted/30 shrink-0 px-4 py-3 items-center gap-3">
                  <span className={`text-base font-semibold ${isCurrentDay ? 'text-indigo-600' : 'text-foreground'}`}>
                    {currentDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </span>
                  {isCurrentDay && <span className="text-[10px] font-medium bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md hidden sm:inline-block">Today</span>}
                </div>

                <div className="flex-1 overflow-y-auto relative" style={{ minHeight: 0 }}>
                  <div className="flex" style={{ height: totalH }}>
                    <div className="w-14 sm:w-16 shrink-0 relative bg-muted/10 border-r border-border/40 z-10">
                      {timeSlots.map((time, idx) => (
                        <div key={idx} className="absolute text-right pr-2 text-[9px] font-medium text-muted-foreground w-full"
                          style={{ top: idx * SLOT_HEIGHT, height: SLOT_HEIGHT }}>
                          <span className="mt-1 block">{time}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex-1 relative" style={{ height: totalH }}>
                      {timeSlots.map((_, idx) => (
                        <div key={idx}
                          className="absolute w-full border-b border-border/20 hover:bg-muted/30 transition-colors cursor-pointer group"
                          style={{ top: idx * SLOT_HEIGHT, height: SLOT_HEIGHT }}
                          onClick={() => {
                            const h = (DAY_START_HOUR + idx).toString().padStart(2, '0');
                            const time = `${h}:00`;
                            const slotEvents = getEventsForDateTime(currentDate, time);
                            handleCellClick(dateStr, time, slotEvents);
                          }}
                        >
                          <div className="absolute w-full border-b border-border/10" style={{ top: SLOT_HEIGHT / 2 }} />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex items-center gap-1 text-indigo-500 transition-opacity">
                            <Plus className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-medium hidden sm:block">Add event</span>
                          </div>
                        </div>
                      ))}

                      {computeColumnLayout(dayEvents).map(event => {
                        const { top, height } = getEventPosition(event);
                        if (isNaN(top) || isNaN(height)) return null;
                        const colW = 100 / event._numCols;
                        const colLeft = event._col * colW;
                        const PAD_RIGHT = 12;
                        return (
                          <div key={`day-evt-${event.id}`}
                            onClick={e => { e.stopPropagation(); handleEditClick(event); }}
                            className={`absolute rounded-lg px-2 sm:px-3 py-1.5 cursor-pointer shadow-sm hover:shadow-md hover:z-10 transition-shadow border-l-4 z-[1] overflow-hidden
                              ${colorMap[event.color]?.bg || 'bg-muted'}
                              ${colorMap[event.color]?.text || 'text-foreground'}
                              ${colorMap[event.color]?.border || 'border-border'}
                              ${event.readOnly ? 'opacity-85' : ''}`}
                            style={{ top, height: height - 2, left: `calc(${colLeft}% + 4px)`, width: `calc(${colW}% - ${PAD_RIGHT / event._numCols}px)` }}
                          >
                            <p className="text-xs font-semibold truncate leading-tight">{event.title}</p>
                            {height > 40 && (
                              <p className="text-[10px] font-medium opacity-75 mt-0.5">
                                {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {' – '}
                                {new Date(event.end || new Date(event.start).getTime() + 3600_000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                          </div>
                        );
                      })}

                      {showNow && (
                        <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: (nowMinutes / 60) * SLOT_HEIGHT }}>
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 shrink-0 shadow-sm shadow-red-500/50" />
                            <div className="flex-1 h-px bg-red-500" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        <div className="hidden lg:block lg:w-64 xl:w-72 overflow-y-auto shrink-0 hide-scrollbar">
          <SidebarPanel />
        </div>
      </div>

      {/* Modals */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-border flex flex-col max-h-[90vh]">
            <div className="py-3 px-4 border-b border-border flex justify-between items-center bg-muted/30 shrink-0">
              <div className="flex items-center gap-2 text-foreground font-semibold text-base">
                {viewingReadOnly && <Lock className="w-4 h-4 text-muted-foreground shrink-0" />}
                {viewingReadOnly ? 'Appointment detail'
                  : viewingCustomEvent ? 'Event detail'
                    : editingEventId ? 'Edit event' : 'New event'}
              </div>
              <button onClick={closeModal} className="p-1 hover:bg-muted-foreground/10 rounded-md transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {viewingCustomEvent && !editingEventId ? (
              <div className="p-4 space-y-4 overflow-y-auto">
                <div className={`flex items-center gap-3 p-3 rounded-lg border-l-[3px] ${colorMap[viewingCustomEvent.color]?.bg || 'bg-muted'} ${colorMap[viewingCustomEvent.color]?.border || 'border-border'}`}>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm ${colorMap[viewingCustomEvent.color]?.text || 'text-foreground'}`}>{viewingCustomEvent.title}</p>
                    {viewingCustomEvent.type && <p className="text-[10px] text-muted-foreground font-medium mt-0.5 capitalize">{viewingCustomEvent.type}</p>}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-3 text-xs text-foreground items-start">
                    <Clock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">{new Date(viewingCustomEvent.start).toLocaleDateString('default', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                      <p className="text-muted-foreground mt-0.5">
                        {new Date(viewingCustomEvent.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' – '}
                        {new Date(viewingCustomEvent.end || new Date(viewingCustomEvent.start).getTime() + 3600_000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  {viewingCustomEvent.location && (
                    <div className="flex items-center gap-3 text-xs text-foreground">
                      <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span>{viewingCustomEvent.location}</span>
                    </div>
                  )}
                  {viewingCustomEvent.description && (
                    <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground border border-border/50">
                      {viewingCustomEvent.description}
                    </div>
                  )}
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => handleDeleteEvent(viewingCustomEvent.id)}
                    className="flex-1 px-3 py-2 border border-red-200 dark:border-red-900/40 text-red-600 rounded-lg font-medium text-xs hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => handleEnterEditMode(viewingCustomEvent)}
                    className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg font-medium text-xs hover:bg-indigo-700 transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ) : viewingReadOnly ? (
              <div className="p-4 space-y-4 overflow-y-auto">
                <div className={`p-3 rounded-lg border-l-[3px] ${colorMap[viewingReadOnly.color]?.bg || 'bg-muted'} ${colorMap[viewingReadOnly.color]?.border || 'border-border'}`}>
                  <p className={`font-semibold text-sm ${colorMap[viewingReadOnly.color]?.text || 'text-foreground'}`}>{viewingReadOnly.title}</p>
                  <p className="text-[10px] text-muted-foreground font-medium mt-0.5 capitalize">{viewingReadOnly.type || 'Appointment'}</p>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-3 text-xs text-foreground items-start">
                    <Clock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">{new Date(viewingReadOnly.start).toLocaleDateString('default', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                      <p className="text-muted-foreground mt-0.5">
                        {new Date(viewingReadOnly.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' – '}
                        {new Date(viewingReadOnly.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  {viewingReadOnly.location && (
                    <div className="flex items-center gap-3 text-xs text-foreground">
                      <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span>{viewingReadOnly.location}</span>
                    </div>
                  )}
                  {viewingReadOnly.description && (
                    <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground border border-border/50">
                      {viewingReadOnly.description}
                    </div>
                  )}
                </div>
                <div className="pt-2">
                  <button
                    onClick={closeModal}
                    className="w-full px-3 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-medium text-xs transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAddEvent} className="p-4 space-y-3.5 overflow-y-auto">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5 ml-0.5">Title</label>
                  <input
                    autoFocus
                    type="text"
                    placeholder="e.g. Consultation"
                    value={newEvent.title}
                    onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-muted-foreground/50 text-foreground text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5 ml-0.5">Date</label>
                    <input
                      type="date"
                      value={newEvent.date}
                      onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-foreground text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5 ml-0.5">Time</label>
                    <input
                      type="time"
                      value={newEvent.time}
                      onChange={e => setNewEvent({ ...newEvent, time: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-foreground text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5 ml-0.5">Type</label>
                    <select
                      value={newEvent.type}
                      onChange={e => setNewEvent({ ...newEvent, type: e.target.value })}
                      className="w-full px-2 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-foreground text-sm"
                    >
                      <option value="" disabled>Select</option>
                      <option value="consultation">Consultation</option>
                      <option value="surgery">Surgery</option>
                      <option value="meeting">Meeting</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5 ml-0.5">Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Room 4B"
                      value={newEvent.location}
                      onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-muted-foreground/50 text-foreground text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5 ml-0.5">Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Optional details..."
                    value={newEvent.description}
                    onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-muted-foreground/50 text-foreground text-sm resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-2 ml-0.5">Color</label>
                  <div className="flex gap-2.5">
                    {Object.keys(colorMap).map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewEvent({ ...newEvent, color })}
                        className={`w-6 h-6 rounded-full border-[1.5px] transition-all hover:scale-110
                          ${colorMap[color].dot}
                          ${newEvent.color === color ? 'border-foreground ring-2 ring-border/50 scale-110' : 'border-transparent'}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-3 py-2 border border-border rounded-lg text-foreground font-medium text-xs hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg font-medium text-xs hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    {editingEventId ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {cellEventsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-border flex flex-col max-h-[85vh]">
            <div className="py-3 px-4 border-b border-border flex justify-between items-center bg-muted/30 shrink-0">
              <div>
                <h2 className="text-base font-semibold text-foreground">Events</h2>
                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                  {cellEventsModal.dateStr} {cellEventsModal.time && `· ${cellEventsModal.time}`}
                </p>
              </div>
              <button onClick={() => setCellEventsModal(null)} className="p-1 hover:bg-muted-foreground/10 rounded-md transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="p-3 space-y-2 overflow-y-auto">
              {cellEventsModal.events.map(event => (
                <div
                  key={event.id}
                  onClick={() => handlePickEventFromList(event)}
                  className={`flex items-start gap-3 p-3 rounded-lg border-l-[3px] cursor-pointer hover:bg-muted/50 transition-colors
                    ${colorMap[event.color]?.bg || 'bg-muted'}
                    ${colorMap[event.color]?.border || 'border-border'}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${colorMap[event.color]?.text || 'text-foreground'}`}>{event.title}</p>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span className="font-medium">
                        {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' – '}
                        {new Date(event.end || new Date(event.start).getTime() + 3600_000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 opacity-50" />
                </div>
              ))}
            </div>

            <div className="p-3 pt-1 shrink-0 border-t border-border">
              <button
                onClick={() => {
                  const ds = cellEventsModal.dateStr;
                  const tm = cellEventsModal.time;
                  setCellEventsModal(null);
                  openNewEventModal(ds, tm);
                }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg font-medium text-xs hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Add event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarTab;

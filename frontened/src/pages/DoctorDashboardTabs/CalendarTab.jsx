import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  Globe,
  RefreshCw,
  ShieldCheck,
  ArrowRight,
  X,
  Lock,
  Keyboard,
  Download,
  HelpCircle,
  Zap,
  CheckCircle2,
  ExternalLink,
  Printer
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

  const [viewingReadOnly, setViewingReadOnly] = useState(null);   // appointment detail
  const [viewingCustomEvent, setViewingCustomEvent] = useState(null); // custom event detail
  const [cellEventsModal, setCellEventsModal] = useState(null);    // { events, dateStr, time }

  useEffect(() => { loadEvents(); }, []);

  const loadEvents = async () => {
    try {
      console.log('[DEBUG] loadEvents started');
      setIsLoading(true);
      // Load custom events + appointment overlay in parallel
      const [customEvents, apptEvents] = await Promise.all([
        calendarApi.getEvents(),
        calendarApi.getAppointmentEvents().catch(() => []), // non-fatal
      ]);
      console.log(`[DEBUG] loadEvents success: custom=${customEvents.length}, appts=${apptEvents.length}`);
      // Merge: custom events take precedence, appointments fill in the rest
      setEvents([...customEvents, ...apptEvents]);
    } catch (err) {
      console.error('[DEBUG] loadEvents error:', err);
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
    // Read-only appointment → appointment detail view
    if (event.readOnly) {
      setViewingReadOnly(event);
      setViewingCustomEvent(null);
      setEditingEventId(null);
      setIsEventModalOpen(true);
      return;
    }
    // Custom event → detail view first
    setViewingCustomEvent(event);
    setViewingReadOnly(null);
    setEditingEventId(null);
    setIsEventModalOpen(true);
  };

  // Switch from detail view → edit form
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
    // modal stays open
  };

  const closeModal = () => {
    setIsEventModalOpen(false);
    setEditingEventId(null);
    setViewingReadOnly(null);
    setViewingCustomEvent(null);
    setCellEventsModal(null);
    setNewEvent({ title: '', date: new Date().toISOString().split('T')[0], time: '09:00', type: '', color: 'blue', description: '', location: '' });
  };

  // When a time-slot cell is clicked: if it has events, show the list modal; otherwise open new event
  const handleCellClick = (dateStr, time, cellEvents) => {
    if (cellEvents && cellEvents.length > 0) {
      setCellEventsModal({ events: cellEvents, dateStr, time });
    } else {
      openNewEventModal(dateStr, time);
    }
  };

  // Pick an event from the cell list modal → open its detail
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

    // Convert to ISO string but preserve the intent of the local time selected by the doctor
    // Since backend uses Supabase/PostgreSQL, sending local time in ISO format is best.
    const toLocalISO = (date) => {
      const offset = date.getTimezoneOffset();
      const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
      return adjustedDate.toISOString().replace('Z', ''); // Remove Z to let DB/API handle it as local or provide offset
    };

    try {
      const payload = {
        title: newEvent.title,
        start: start.toISOString(), // .toISOString() is UTC, which is what we want if DB is TIMESTAMPTZ
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

  // ── Overlap layout: assign col index & total cols to overlapping events ──────
  const computeColumnLayout = (evtList) => {
    // Sort by start time
    const sorted = [...evtList].sort((a, b) => new Date(a.start) - new Date(b.start));
    const result = sorted.map(ev => ({ ...ev, _col: 0, _numCols: 1 }));
    // Group events that overlap into clusters
    let i = 0;
    while (i < result.length) {
      // Find all events overlapping with result[i]
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

  // ── Date Helpers ────────────────────────────────────────────────────────────
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

  // 7 AM – 9 PM (15 hours)
  const SLOT_HEIGHT = 56; // px per hour slot (must match the inline style below)
  const DAY_START_HOUR = 7;
  const timeSlots = useMemo(() =>
    Array.from({ length: 15 }, (_, i) => {
      const h = i + DAY_START_HOUR;
      return `${h.toString().padStart(2, '0')}:00`;
    }), []);

  // Current time line
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

  // Events whose start falls within a specific hourly slot (for fallback grid render)
  const getEventsForDateTime = (date, timeStr) => {
    const [h] = timeStr.split(':').map(Number);
    return events.filter(ev => {
      const d = new Date(ev.start);
      return d.getDate() === date.getDate() && d.getMonth() === date.getMonth() &&
        d.getFullYear() === date.getFullYear() && d.getHours() === h;
    });
  };

  // All events that overlap a given day column (for positioned rendering)
  const getEventsForDayColumn = (date) => {
    const dayStart = new Date(date); dayStart.setHours(DAY_START_HOUR, 0, 0, 0);
    const dayEnd = new Date(date); dayEnd.setHours(DAY_START_HOUR + timeSlots.length, 0, 0, 0);
    const dateStr = date.toDateString();
    return events.filter(ev => {
      if (!ev.start) return false;
      const s = new Date(ev.start);
      // Use toDateString for more stable day comparison
      if (s.toDateString() !== dateStr) return false;
      const e = new Date(ev.end || s.getTime() + 3600_000);
      return s < dayEnd && e > dayStart;
    });
  };

  // Compute top (px) and height (px) for a positioned event
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

  // ── Header Title ────────────────────────────────────────────────────────────
  const headerTitle = view === 'day'
    ? currentDate.toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' })
    : `${monthName} ${yearName}`;

  // ── Shared color pill for events ────────────────────────────────────────────
  const EventChip = ({ event, onClick }) => (
    <div
      onClick={onClick}
      className={`px-2 py-1 rounded-lg text-[9px] sm:text-[10px] font-bold truncate border-l-2 shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all
        ${colorMap[event.color]?.bg || 'bg-muted'}
        ${colorMap[event.color]?.text || 'text-foreground'}
        ${colorMap[event.color]?.border || 'border-border'}`}
    >
      {event.title}
    </div>
  );

  // ── Sidebar Panel ────────────────────────────────────────────────────────────
  const SidebarPanel = () => (
    <div className="space-y-4 sm:space-y-6">
      {/* Overview */}
      <div className="bg-card/60 backdrop-blur-3xl rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 shadow-xl border border-border">
        <h3 className="text-xs sm:text-sm font-black text-foreground mb-4 sm:mb-6 flex items-center uppercase tracking-widest">
          <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-indigo-600" />
          Overview
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/30 p-3 sm:p-4 rounded-xl border border-border">
            <p className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Consultations</p>
            <p className="text-xl sm:text-2xl font-black text-indigo-600 tracking-tighter">
              {events.filter(ev => ev.type === 'appointment').length}
            </p>
          </div>
          <div className="bg-muted/30 p-3 sm:p-4 rounded-xl border border-border">
            <p className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Surgeries</p>
            <p className="text-xl sm:text-2xl font-black text-red-600 tracking-tighter">
              {events.filter(ev => ev.type === 'surgery').length}
            </p>
          </div>
        </div>
      </div>

      {/* Upcoming */}
      <div className="bg-card/60 backdrop-blur-3xl rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 shadow-xl border border-border">
        <h3 className="text-xs sm:text-sm font-black text-foreground mb-4 sm:mb-6 uppercase tracking-widest">Upcoming</h3>
        <div className="space-y-2 sm:space-y-3">
          {upcomingEvents.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No upcoming events</p>
          )}
          {upcomingEvents.map(event => (
            <div
              key={event.id}
              onClick={() => handleEditClick(event)}
              className="group relative flex items-center space-x-3 p-3 sm:p-4 rounded-xl hover:bg-muted/30 transition-all border border-transparent hover:border-border cursor-pointer"
            >
              <div className={`w-1.5 h-8 sm:h-10 rounded-full shrink-0 ${colorMap[event.color]?.dot || 'bg-muted'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-foreground truncate">{event.title}</p>
                <div className="flex items-center text-[9px] sm:text-[10px] font-bold text-muted-foreground mt-0.5">
                  <Clock className="w-3 h-3 mr-1" />
                  {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); handleDeleteEvent(event.id); }}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 rounded-lg transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Guide */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 shadow-xl shadow-indigo-500/20 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber-300" />
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest">Quick Guide</h3>
          </div>
          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5 bg-white/10 rounded-xl p-2.5 backdrop-blur-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 mt-0.5 shrink-0" />
              <p className="text-[10px] sm:text-[11px] text-indigo-100 leading-relaxed">Click any time slot to add events or view existing ones</p>
            </div>
            <div className="flex items-start gap-2.5 bg-white/10 rounded-xl p-2.5 backdrop-blur-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 mt-0.5 shrink-0" />
              <p className="text-[10px] sm:text-[11px] text-indigo-100 leading-relaxed">Appointments from your schedule appear as read-only events</p>
            </div>
            <div className="flex items-start gap-2.5 bg-white/10 rounded-xl p-2.5 backdrop-blur-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 mt-0.5 shrink-0" />
              <p className="text-[10px] sm:text-[11px] text-indigo-100 leading-relaxed">Color-code events by type for quick visual scanning</p>
            </div>
          </div>
          <button
            onClick={() => loadEvents()}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white text-[9px] sm:text-[10px] font-black px-4 py-2.5 rounded-xl transition-all border border-white/20 uppercase tracking-widest active:scale-95 backdrop-blur-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Events
          </button>
        </div>
        <CalendarIcon className="absolute -bottom-6 -right-6 w-24 sm:w-32 h-24 sm:h-32 text-white/[0.06] rotate-12" />
      </div>
    </div>
  );

  return (
    <div className="flex h-full flex-col bg-muted/30 backdrop-blur-sm -m-3 sm:-m-6 p-3 sm:p-6">
      <Toaster position="top-right" />

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-8">
        {/* Left: Title + Nav */}
        <div className="flex items-center justify-between sm:justify-start sm:space-x-6">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black bg-gradient-to-r from-foreground to-indigo-600 bg-clip-text text-transparent tracking-tighter leading-tight">
              {headerTitle}
            </h1>
            <p className="text-muted-foreground text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] mt-0.5 sm:mt-1">
              Medical Schedule
            </p>
          </div>

          {/* Nav arrows (mobile: part of left group) */}
          <div className="flex items-center bg-card/60 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-lg border border-border p-1 sm:hidden">
            <button onClick={() => navigatePeriod(-1)} className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-all active:scale-95">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-2 hover:bg-muted rounded-lg text-[10px] font-black text-foreground transition-all uppercase tracking-wider">
              Today
            </button>
            <button onClick={() => navigatePeriod(1)} className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-all active:scale-95">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Nav arrows (sm+) */}
        <div className="hidden sm:flex items-center bg-card/60 backdrop-blur-xl rounded-2xl shadow-lg border border-border p-1.5">
          <button onClick={() => navigatePeriod(-1)} className="p-2.5 sm:p-3 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-all active:scale-95">
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-4 sm:px-6 py-2.5 sm:py-3 hover:bg-muted rounded-xl text-[10px] sm:text-xs font-black text-foreground transition-all uppercase tracking-wider">
            Today
          </button>
          <button onClick={() => navigatePeriod(1)} className="p-2.5 sm:p-3 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-all active:scale-95">
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Right: View toggle + New Event + Sidebar toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-card/60 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-lg border border-border p-1">
            {['month', 'week', 'day'].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-2.5 sm:px-4 lg:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all
                  ${view === v ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                {/* On xs show only first char; sm+ show full */}
                <span className="sm:hidden">{v.charAt(0).toUpperCase()}</span>
                <span className="hidden sm:inline">{v}</span>
              </button>
            ))}
          </div>

          {/* New Event */}
          <button
            onClick={() => openNewEventModal()}
            className="flex items-center gap-1.5 sm:gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-5 lg:px-8 py-2.5 sm:py-3 lg:py-4 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-500/30 transition-all hover:-translate-y-0.5 active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:w-5 sm:h-5" />
            <span className="hidden xs:inline sm:inline">New Event</span>
          </button>

        </div>
      </div>

      {/* ── Mobile Inline Overview (hidden on lg+) ── */}
      <div className="lg:hidden bg-card/60 backdrop-blur-xl rounded-2xl border border-border shadow-lg p-3 sm:p-4 mb-3">
        <div className="flex items-center gap-2 mb-3">
          <CalendarIcon className="w-3.5 h-3.5 text-indigo-600" />
          <p className="text-[9px] sm:text-[10px] font-black text-foreground uppercase tracking-widest">Overview</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Consultations */}
          <div className="flex-1 min-w-[70px] flex flex-col items-center justify-center bg-indigo-500/10 rounded-xl px-3 py-2.5 border border-indigo-500/20">
            <p className="text-lg sm:text-xl font-black text-indigo-600 leading-none">
              {events.filter(ev => ev.type === 'appointment').length}
            </p>
            <p className="text-[8px] sm:text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Consults</p>
          </div>
          {/* Surgeries */}
          <div className="flex-1 min-w-[70px] flex flex-col items-center justify-center bg-red-500/10 rounded-xl px-3 py-2.5 border border-red-500/20">
            <p className="text-lg sm:text-xl font-black text-red-600 leading-none">
              {events.filter(ev => ev.type === 'surgery').length}
            </p>
            <p className="text-[8px] sm:text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Surgeries</p>
          </div>
          {/* Meetings */}
          <div className="flex-1 min-w-[70px] flex flex-col items-center justify-center bg-purple-500/10 rounded-xl px-3 py-2.5 border border-purple-500/20">
            <p className="text-lg sm:text-xl font-black text-purple-600 leading-none">
              {events.filter(ev => ev.type === 'meeting').length}
            </p>
            <p className="text-[8px] sm:text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Meetings</p>
          </div>
          {/* Total */}
          <div className="flex-1 min-w-[70px] flex flex-col items-center justify-center bg-muted/40 rounded-xl px-3 py-2.5 border border-border">
            <p className="text-lg sm:text-xl font-black text-foreground leading-none">
              {events.length}
            </p>
            <p className="text-[8px] sm:text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Total</p>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 sm:gap-6 overflow-hidden">

        {/* ── Main Calendar ── */}
        <div className="flex-1 bg-card/60 backdrop-blur-3xl rounded-2xl sm:rounded-[2.5rem] shadow-2xl border border-border flex flex-col overflow-hidden relative min-h-0">
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-card/80 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 sm:w-16 sm:h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4 shadow-xl shadow-indigo-500/20" />
                <p className="text-[10px] sm:text-xs font-black text-muted-foreground animate-pulse uppercase tracking-widest">Loading...</p>
              </div>
            </div>
          )}

          {/* ── Month View ── */}
          {view === 'month' && (
            <>
              <div className="grid grid-cols-7 border-b border-border bg-muted/30 shrink-0">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="py-2 sm:py-4 text-center text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    <span className="sm:hidden">{day.charAt(0)}</span>
                    <span className="hidden sm:inline">{day}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 flex-1 overflow-y-auto">
                {calendarData.map((cell, idx) => {
                  const dateEvents = getEventsForDate(cell.fullDate);
                  const isCurrent = cell.month === 'current';
                  const isCellToday = isToday(cell.fullDate);
                  return (
                    <div
                      key={idx}
                      className={`min-h-[60px] sm:min-h-[90px] lg:min-h-[110px] p-1 sm:p-2 lg:p-3 border-r border-b border-border/40 transition-all hover:bg-muted/30 group relative
                        ${!isCurrent ? 'bg-muted/10 text-muted-foreground/40' : 'text-foreground'}`}
                    >
                      <div className="flex justify-between items-start mb-1 sm:mb-2">
                        <span className={`text-[10px] sm:text-xs font-black flex items-center justify-center w-5 h-5 sm:w-7 sm:h-7 rounded-lg transition-all
                          ${isCellToday ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-110'
                            : isCurrent ? 'text-foreground hover:bg-muted' : 'text-muted-foreground/40'}`}
                        >
                          {cell.date}
                        </span>
                        {isCurrent && (
                          <button
                            onClick={() => openNewEventModal(cell.fullDate.toISOString().split('T')[0])}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded-lg transition-all active:scale-90"
                          >
                            <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                      <div className="space-y-0.5 sm:space-y-1">
                        {dateEvents.slice(0, 2).map(event => (
                          <EventChip key={`evt-${event.id}-${event.start}`} event={event} onClick={(e) => { e.stopPropagation(); handleEditClick(event); }} />
                        ))}
                        {dateEvents.length > 2 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCellClick(cell.fullDate.toISOString().split('T')[0], '09:00', dateEvents); }}
                            className="text-[8px] sm:text-[9px] text-indigo-600 font-bold pl-1 hover:underline cursor-pointer"
                          >
                            +{dateEvents.length - 2} more
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ── Week View ── */}
          {view === 'week' && (() => {
            const totalH = timeSlots.length * SLOT_HEIGHT;
            const todayInWeek = weekData.findIndex(d => isToday(d));
            const showNow = todayInWeek >= 0 && nowMinutes >= 0 && nowMinutes <= timeSlots.length * 60;
            return (
              <>
                {/* Header row */}
                <div className="flex border-b border-border bg-muted/30 shrink-0">
                  <div className="w-12 sm:w-16 shrink-0" />
                  {weekData.map((date, i) => (
                    <div key={i} className={`flex-1 min-w-0 py-2 sm:py-3 text-center border-l border-border/40 ${isToday(date) ? 'bg-indigo-500/5' : ''}`}>
                      <p className="text-[8px] sm:text-[9px] font-black text-muted-foreground uppercase tracking-widest truncate">
                        <span className="sm:hidden">{date.toLocaleDateString('default', { weekday: 'narrow' })}</span>
                        <span className="hidden sm:inline">{date.toLocaleDateString('default', { weekday: 'short' })}</span>
                      </p>
                      <p className={`text-[11px] sm:text-sm font-black mt-0.5 w-7 h-7 flex items-center justify-center mx-auto rounded-full transition-all
                        ${isToday(date) ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-foreground'}`}>
                        {date.getDate()}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Scrollable time grid */}
                <div className="flex-1 overflow-y-auto relative" style={{ minHeight: 0 }}>
                  {/* Grid layout */}
                  <div className="flex" style={{ height: totalH }}>
                    {/* Time gutter */}
                    <div className="w-12 sm:w-16 shrink-0 relative">
                      {timeSlots.map((time, idx) => (
                        <div key={idx} className="absolute text-right pr-1.5 sm:pr-2 text-[8px] sm:text-[9px] font-black text-muted-foreground leading-none"
                          style={{ top: idx * SLOT_HEIGHT, height: SLOT_HEIGHT }}>
                          <span className="mt-1 block">{time}</span>
                        </div>
                      ))}
                    </div>

                    {/* Day columns */}
                    {weekData.map((date, colIdx) => {
                      const colEvents = getEventsForDayColumn(date);
                      const dateStr = date.toISOString().split('T')[0];
                      return (
                        <div key={colIdx} className={`flex-1 min-w-0 border-l border-border/40 relative ${isToday(date) ? 'bg-indigo-500/[0.03]' : ''}`}
                          style={{ height: totalH }}>
                          {/* Hour lines */}
                          {timeSlots.map((_, idx) => (
                            <div key={idx}
                              className="absolute w-full border-b border-border/20 hover:bg-muted/20 transition-all cursor-pointer group"
                              style={{ top: idx * SLOT_HEIGHT, height: SLOT_HEIGHT }}
                              onClick={() => {
                                const h = (DAY_START_HOUR + idx).toString().padStart(2, '0');
                                const time = `${h}:00`;
                                const slotEvents = getEventsForDateTime(date, time);
                                handleCellClick(dateStr, time, slotEvents);
                              }}
                            >
                              {/* Half-hour marker */}
                              <div className="absolute w-full border-b border-border/10" style={{ top: SLOT_HEIGHT / 2 }} />
                              <Plus className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-60 transition-all" />
                            </div>
                          ))}

                          {/* Events — overlap-aware column layout */}
                          {computeColumnLayout(colEvents).map(event => {
                            const { top, height } = getEventPosition(event);
                            const colW = 100 / event._numCols;
                            const colLeft = event._col * colW;
                            return (
                              <div key={event.id}
                                onClick={e => { e.stopPropagation(); handleEditClick(event); }}
                                className={`absolute rounded-lg px-1 py-0.5 cursor-pointer shadow-md hover:shadow-xl hover:z-10 transition-all border-l-2 z-[1] overflow-hidden
                                  ${colorMap[event.color]?.bg || 'bg-muted'}
                                  ${colorMap[event.color]?.text || 'text-foreground'}
                                  ${colorMap[event.color]?.border || 'border-border'}
                                  ${event.readOnly ? 'opacity-80' : ''}`}
                                style={{ top, height: height - 2, left: `${colLeft}%`, width: `${colW - 1}%` }}
                              >
                                <p className="text-[8px] sm:text-[9px] font-bold truncate leading-tight">{event.title}</p>
                                {height > 36 && (
                                  <p className="text-[7px] sm:text-[8px] opacity-70 truncate">
                                    {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                )}
                              </div>
                            );
                          })}

                          {/* "Now" line on today column */}
                          {showNow && colIdx === todayInWeek && (
                            <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: (nowMinutes / 60) * SLOT_HEIGHT }}>
                              <div className="flex items-center">
                                <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 shrink-0" />
                                <div className="flex-1 h-[1.5px] bg-red-500" />
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

          {/* ── Day View ── */}
          {view === 'day' && (() => {
            const totalH = timeSlots.length * SLOT_HEIGHT;
            const dateStr = currentDate.toISOString().split('T')[0];
            const dayEvents = getEventsForDayColumn(currentDate);
            const isCurrentDay = isToday(currentDate);
            const showNow = isCurrentDay && nowMinutes >= 0 && nowMinutes <= timeSlots.length * 60;
            return (
              <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
                {/* Day header */}
                <div className="flex border-b border-border bg-muted/30 shrink-0 px-3 sm:px-4 py-2.5 items-center gap-3">
                  <span className={`text-sm sm:text-base font-black ${isCurrentDay ? 'text-indigo-600' : 'text-foreground'}`}>
                    {currentDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </span>
                  {isCurrentDay && <span className="text-[9px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">Today</span>}
                </div>

                {/* Scrollable grid */}
                <div className="flex" style={{ height: totalH }}>
                  {/* Time gutter */}
                  <div className="w-12 sm:w-16 shrink-0 relative">
                    {timeSlots.map((time, idx) => (
                      <div key={idx} className="absolute text-right pr-1.5 sm:pr-2 text-[8px] sm:text-[9px] font-black text-muted-foreground leading-none"
                        style={{ top: idx * SLOT_HEIGHT, height: SLOT_HEIGHT }}>
                        <span className="mt-1 block">{time}</span>
                      </div>
                    ))}
                  </div>

                  {/* Single day column */}
                  <div className="flex-1 border-l border-border/40 relative" style={{ height: totalH }}>
                    {/* Hour slot click targets */}
                    {timeSlots.map((_, idx) => (
                      <div key={idx}
                        className="absolute w-full border-b border-border/20 hover:bg-muted/20 transition-all cursor-pointer group"
                        style={{ top: idx * SLOT_HEIGHT, height: SLOT_HEIGHT }}
                        onClick={() => {
                          const h = (DAY_START_HOUR + idx).toString().padStart(2, '0');
                          const time = `${h}:00`;
                          const slotEvents = getEventsForDateTime(currentDate, time);
                          handleCellClick(dateStr, time, slotEvents);
                        }}
                      >
                        {/* Half-hour line */}
                        <div className="absolute w-full border-b border-border/10" style={{ top: SLOT_HEIGHT / 2 }} />
                        {/* Add hint */}
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex items-center gap-1 text-indigo-500 transition-all">
                          <Plus className="w-3.5 h-3.5" />
                          <span className="text-[9px] font-black uppercase tracking-wider hidden sm:block">Add event</span>
                        </div>
                      </div>
                    ))}

                    {/* Events — overlap-aware column layout */}
                    {computeColumnLayout(dayEvents).map(event => {
                      const { top, height } = getEventPosition(event);
                      if (isNaN(top) || isNaN(height)) return null;
                      const colW = 100 / event._numCols;
                      const colLeft = event._col * colW;
                      const PAD_RIGHT = 24; // px reserved for the gutter (right area)
                      return (
                        <div key={`day-evt-${event.id}`}
                          onClick={e => { e.stopPropagation(); handleEditClick(event); }}
                          className={`absolute rounded-xl px-2 sm:px-3 py-1.5 cursor-pointer shadow-lg hover:shadow-2xl hover:z-10 hover:scale-[1.01] transition-all border-l-4 z-[1] overflow-hidden
                            ${colorMap[event.color]?.bg || 'bg-muted'}
                            ${colorMap[event.color]?.text || 'text-foreground'}
                            ${colorMap[event.color]?.border || 'border-border'}
                            ${event.readOnly ? 'opacity-80' : ''}`}
                          style={{ top, height: height - 2, left: `calc(${colLeft}% + 4px)`, width: `calc(${colW}% - ${PAD_RIGHT / event._numCols}px)` }}
                        >
                          <p className="text-[10px] sm:text-xs font-black truncate leading-tight">{event.title}</p>
                          {height > 40 && (
                            <p className="text-[9px] sm:text-[10px] opacity-70 mt-0.5">
                              {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {' – '}
                              {new Date(event.end || new Date(event.start).getTime() + 3600_000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                          {height > 65 && event.location && (
                            <p className="text-[8px] opacity-60 flex items-center gap-1 mt-1 truncate">
                              <MapPin className="w-2.5 h-2.5 shrink-0" />{event.location}
                            </p>
                          )}
                        </div>
                      );
                    })}

                    {/* Current time line */}
                    {showNow && (
                      <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: (nowMinutes / 60) * SLOT_HEIGHT }}>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-red-500 -ml-1.5 shrink-0 shadow-md shadow-red-500/50" />
                          <div className="flex-1 h-[2px] bg-red-500 shadow-sm shadow-red-500/30" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* ── Sidebar (always visible lg+, collapsible below) ── */}
        <div className="hidden lg:block lg:w-72 xl:w-80 overflow-y-auto shrink-0">
          <SidebarPanel />
        </div>
      </div>



      {/* ── Event Modal (3 modes: custom detail, read-only appointment, edit/create form) ── */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-card/90 backdrop-blur-3xl rounded-t-3xl sm:rounded-[2.5rem] shadow-2xl w-full sm:max-w-md overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in duration-200 border border-border">

            {/* Modal Header */}
            <div className="p-5 sm:p-8 border-b border-border flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                {viewingReadOnly && <Lock className="w-4 h-4 text-muted-foreground" />}
                <h2 className="text-lg sm:text-2xl font-black text-foreground tracking-tighter">
                  {viewingReadOnly ? 'Appointment Details'
                    : viewingCustomEvent ? 'Event Details'
                      : editingEventId ? 'Edit Event' : 'New Event'}
                </h2>
              </div>
              <button onClick={closeModal} className="p-2 sm:p-2.5 hover:bg-muted rounded-xl transition-all active:scale-90">
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              </button>
            </div>

            {/* ── Mode 1: Custom Event Detail View ── */}
            {viewingCustomEvent && !editingEventId ? (
              <div className="p-5 sm:p-8 space-y-4">
                {/* Title card */}
                <div className={`flex items-center gap-3 p-4 rounded-2xl border-l-4 ${colorMap[viewingCustomEvent.color]?.bg || 'bg-muted'} ${colorMap[viewingCustomEvent.color]?.border || 'border-border'}`}>
                  <div className="flex-1 min-w-0">
                    <p className={`font-black text-sm sm:text-base ${colorMap[viewingCustomEvent.color]?.text || 'text-foreground'}`}>{viewingCustomEvent.title}</p>
                    {viewingCustomEvent.type && <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-0.5">{viewingCustomEvent.type}</p>}
                  </div>
                  <div className={`w-4 h-4 rounded-full shrink-0 ${colorMap[viewingCustomEvent.color]?.dot || 'bg-muted'}`} />
                </div>

                {/* Details */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span className="font-medium">
                      {new Date(viewingCustomEvent.start).toLocaleDateString('default', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                      {' · '}
                      {new Date(viewingCustomEvent.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {' – '}
                      {new Date(viewingCustomEvent.end || new Date(viewingCustomEvent.start).getTime() + 3600_000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {viewingCustomEvent.location && (
                    <div className="flex items-center gap-3 text-sm text-foreground">
                      <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="font-medium">{viewingCustomEvent.location}</span>
                    </div>
                  )}
                  {viewingCustomEvent.description && (
                    <div className="bg-muted/30 rounded-xl p-3 text-xs text-muted-foreground leading-relaxed border border-border">
                      {viewingCustomEvent.description}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="pt-2 flex space-x-3">
                  <button
                    onClick={() => handleDeleteEvent(viewingCustomEvent.id)}
                    className="flex-1 px-4 py-3 sm:py-4 border border-red-200 dark:border-red-800 text-red-600 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-95"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => handleEnterEditMode(viewingCustomEvent)}
                    className="flex-1 px-4 py-3 sm:py-4 bg-indigo-600 text-white rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-500/30 hover:bg-indigo-700 transition-all active:scale-95"
                  >
                    Edit Event
                  </button>
                </div>
              </div>

              /* ── Mode 2: Read-only Appointment Detail View ── */
            ) : viewingReadOnly ? (
              <div className="p-5 sm:p-8 space-y-4">
                <div className={`flex items-center gap-3 p-4 rounded-2xl border-l-4 ${colorMap[viewingReadOnly.color]?.bg || 'bg-muted'} ${colorMap[viewingReadOnly.color]?.border || 'border-border'}`}>
                  <div>
                    <p className={`font-black text-sm sm:text-base ${colorMap[viewingReadOnly.color]?.text || 'text-foreground'}`}>{viewingReadOnly.title}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-0.5">{viewingReadOnly.type || 'Appointment'}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span className="font-medium">
                      {new Date(viewingReadOnly.start).toLocaleDateString('default', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                      {' · '}
                      {new Date(viewingReadOnly.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {' – '}
                      {new Date(viewingReadOnly.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {viewingReadOnly.location && (
                    <div className="flex items-center gap-3 text-sm text-foreground">
                      <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="font-medium">{viewingReadOnly.location}</span>
                    </div>
                  )}
                  {viewingReadOnly.description && (
                    <div className="bg-muted/30 rounded-xl p-3 text-xs text-muted-foreground leading-relaxed border border-border">
                      {viewingReadOnly.description}
                    </div>
                  )}
                </div>
                <div className="pt-2 flex items-center gap-2 text-[10px] text-muted-foreground bg-muted/20 rounded-xl px-3 py-2 border border-border">
                  <Lock className="w-3 h-3 shrink-0" />
                  <span>This appointment is managed from the Appointments tab</span>
                </div>
                <button
                  onClick={closeModal}
                  className="w-full px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-500/30 hover:bg-indigo-700 transition-all active:scale-95"
                >
                  Close
                </button>
              </div>

              /* ── Mode 3: Edit / Create Form ── */
            ) : (
              <form onSubmit={handleAddEvent} className="p-5 sm:p-8 space-y-4 sm:space-y-5 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase mb-1.5 ml-1 tracking-widest">Event Title</label>
                  <input
                    autoFocus
                    type="text"
                    placeholder="e.g. Patient Consultation"
                    value={newEvent.title}
                    onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-muted/30 border border-border rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-muted-foreground/40 text-foreground text-sm font-medium"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase mb-1.5 ml-1 tracking-widest">Date</label>
                    <input
                      type="date"
                      value={newEvent.date}
                      onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                      className="w-full px-3 sm:px-5 py-3 sm:py-4 bg-muted/30 border border-border rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-foreground text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase mb-1.5 ml-1 tracking-widest">Time</label>
                    <input
                      type="time"
                      value={newEvent.time}
                      onChange={e => setNewEvent({ ...newEvent, time: e.target.value })}
                      className="w-full px-3 sm:px-5 py-3 sm:py-4 bg-muted/30 border border-border rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-foreground text-sm font-medium"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase mb-1.5 ml-1 tracking-widest">Event Type</label>
                    <input
                      type="text"
                      placeholder="e.g. Meeting, Surgery"
                      value={newEvent.type}
                      onChange={e => setNewEvent({ ...newEvent, type: e.target.value })}
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 bg-muted/30 border border-border rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-muted-foreground/40 text-foreground text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase mb-1.5 ml-1 tracking-widest">Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Room 4B"
                      value={newEvent.location}
                      onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 bg-muted/30 border border-border rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-muted-foreground/40 text-foreground text-sm font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase mb-1.5 ml-1 tracking-widest">Description (optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Add any notes or details..."
                    value={newEvent.description}
                    onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-muted/30 border border-border rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-muted-foreground/40 text-foreground text-sm font-medium resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase mb-2 ml-1 tracking-widest">Color</label>
                  <div className="flex space-x-2.5 ml-1">
                    {Object.keys(colorMap).map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewEvent({ ...newEvent, color })}
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all hover:scale-110 active:scale-95
                          ${colorMap[color].dot}
                          ${newEvent.color === color ? 'border-foreground ring-4 ring-border scale-110' : 'border-transparent'}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="pt-2 sm:pt-4 flex space-x-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 sm:px-6 py-3 sm:py-4 border border-border rounded-xl sm:rounded-2xl text-foreground font-black text-[10px] sm:text-[11px] uppercase tracking-widest hover:bg-muted transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 sm:px-6 py-3 sm:py-4 bg-indigo-600 text-white rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-500/30 hover:bg-indigo-700 transition-all active:scale-95"
                  >
                    {editingEventId ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Cell Events List Modal ── */}
      {cellEventsModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-card/90 backdrop-blur-3xl rounded-t-3xl sm:rounded-[2.5rem] shadow-2xl w-full sm:max-w-md overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in duration-200 border border-border">

            {/* Header */}
            <div className="p-5 sm:p-8 border-b border-border flex justify-between items-center">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tighter">Events</h2>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">
                  {cellEventsModal.dateStr} {cellEventsModal.time && `· ${cellEventsModal.time}`}
                </p>
              </div>
              <button onClick={() => setCellEventsModal(null)} className="p-2 sm:p-2.5 hover:bg-muted rounded-xl transition-all active:scale-90">
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Events List */}
            <div className="p-4 sm:p-6 space-y-2 max-h-[60vh] overflow-y-auto">
              {cellEventsModal.events.map(event => (
                <div
                  key={event.id}
                  onClick={() => handlePickEventFromList(event)}
                  className={`flex items-start gap-3 p-3 sm:p-4 rounded-2xl border-l-4 cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all
                    ${colorMap[event.color]?.bg || 'bg-muted'}
                    ${colorMap[event.color]?.border || 'border-border'}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs sm:text-sm font-black truncate ${colorMap[event.color]?.text || 'text-foreground'}`}>{event.title}</p>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span className="font-medium">
                        {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' – '}
                        {new Date(event.end || new Date(event.start).getTime() + 3600_000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                    {event.type && (
                      <span className="inline-block mt-1.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest bg-muted/50 text-muted-foreground px-2 py-0.5 rounded-md border border-border">
                        {event.type}
                      </span>
                    )}
                    {event.readOnly && (
                      <span className="inline-flex items-center gap-1 mt-1.5 text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
                        <Lock className="w-2.5 h-2.5" /> Appointment
                      </span>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1 opacity-40" />
                </div>
              ))}
            </div>

            {/* Add New Event button */}
            <div className="p-4 sm:p-6 pt-0">
              <button
                onClick={() => {
                  const ds = cellEventsModal.dateStr;
                  const tm = cellEventsModal.time;
                  setCellEventsModal(null);
                  openNewEventModal(ds, tm);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-500/30 hover:bg-indigo-700 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Add New Event
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default CalendarTab;

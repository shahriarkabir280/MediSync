import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Clock,
  MapPin,
  Users,
  Video,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Globe,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import calendarApi from '../../lib/calendarApi';

const CalendarTab = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // 'month', 'week', 'day'
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingEventId, setEditingEventId] = useState(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

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
    color: 'blue'
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const data = await calendarApi.getEvents();
      setEvents(data);
    } catch (error) {
      toast.error('Failed to load events');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (event) => {
    setEditingEventId(event.id);
    setNewEvent({
      title: event.title,
      date: new Date(event.start).toISOString().split('T')[0],
      time: new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      type: event.type || '',
      color: event.color || 'blue'
    });
    setIsEventModalOpen(true);
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    const [year, month, day] = newEvent.date.split('-').map(Number);
    const [hour, minute] = newEvent.time.split(':').map(Number);

    const start = new Date(year, month - 1, day, hour, minute);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // Default 1 hour

    try {
      if (editingEventId) {
        const updatedEvent = await calendarApi.updateEvent(editingEventId, {
          title: newEvent.title,
          start,
          end,
          type: newEvent.type,
          color: newEvent.color
        });
        setEvents(events.map(e => e.id === editingEventId ? updatedEvent : e));
        toast.success('Event updated successfully');
      } else {
        const createdEvent = await calendarApi.createEvent({
          title: newEvent.title,
          start,
          end,
          type: newEvent.type,
          color: newEvent.color
        });
        setEvents([...events, createdEvent]);
        toast.success('Event added successfully');
      }

      setIsEventModalOpen(false);
      setEditingEventId(null);
      setNewEvent({
        title: '',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        type: '',
        color: 'blue'
      });
    } catch (error) {
      toast.error(editingEventId ? 'Failed to update event' : 'Failed to create event');
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await calendarApi.deleteEvent(id);
      setEvents(events.filter(e => e.id !== id));
      toast.success('Event deleted successfully');
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  // Date Logic
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const prevMonthDays = getDaysInMonth(year, month - 1);
    const cells = [];

    // Previous month overlap
    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push({
        date: prevMonthDays - i,
        month: 'prev',
        fullDate: new Date(year, month - 1, prevMonthDays - i)
      });
    }

    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      cells.push({
        date: i,
        month: 'current',
        fullDate: new Date(year, month, i)
      });
    }

    // Next month overlap
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      cells.push({
        date: i,
        month: 'next',
        fullDate: new Date(year, month + 1, i)
      });
    }

    return cells;
  }, [currentDate]);

  const weekData = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });
  }, [currentDate]);

  const timeSlots = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => { // 12 hours from 9 AM to 8 PM (9, 10, ..., 20)
      const hour = i + 9;
      return `${hour.toString().padStart(2, '0')}:00`;
    });
  }, []);

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const yearName = currentDate.getFullYear();

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(currentDate.getMonth() + direction);
    } else if (view === 'week') {
      newDate.setDate(currentDate.getDate() + (direction * 7));
    } else {
      newDate.setDate(currentDate.getDate() + direction);
    }
    setCurrentDate(newDate);
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const getEventsForDate = (date) => {
    return events.filter(event => {
      const eDate = new Date(event.start);
      return eDate.getDate() === date.getDate() &&
        eDate.getMonth() === date.getMonth() &&
        eDate.getFullYear() === date.getFullYear();
    });
  };

  const getEventsForDateTime = (date, timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return events.filter(event => {
      const eStart = new Date(event.start);
      return eStart.getDate() === date.getDate() &&
        eStart.getMonth() === date.getMonth() &&
        eStart.getFullYear() === date.getFullYear() &&
        eStart.getHours() === h;
    });
  };

  return (
    <div className="flex h-full flex-col bg-muted/30 backdrop-blur-sm -m-6 p-6">
      <Toaster position="top-right" />

      {/* Premium Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-8">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-foreground to-indigo-600 bg-clip-text text-transparent tracking-tighter">
              {view === 'day' ? currentDate.toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' }) : `${monthName} ${yearName}`}
            </h1>
            <p className="text-muted-foreground text-[11px] font-black uppercase tracking-[0.3em] mt-2">Medical Schedule Management</p>
          </div>
          <div className="flex items-center bg-card/60 backdrop-blur-xl rounded-[1.5rem] shadow-lg border border-border p-1.5">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-3 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-all active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-6 py-3 hover:bg-muted rounded-xl text-sm font-black text-foreground transition-all uppercase tracking-wider"
            >
              Today
            </button>
            <button
              onClick={() => navigateMonth(1)}
              className="p-3 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-all active:scale-95"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-card/60 backdrop-blur-xl rounded-[1.5rem] shadow-lg border border-border p-1.5">
            {['month', 'week', 'day'].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all ${view === v
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
              >
                {v}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setEditingEventId(null);
              setNewEvent({
                title: '',
                date: new Date().toISOString().split('T')[0],
                time: '09:00',
                type: '',
                color: 'blue'
              });
              setIsEventModalOpen(true);
            }}
            className="flex items-center space-x-3 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/30 transition-all hover:-translate-y-1 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>New Event</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex space-x-6 overflow-hidden">
        {/* Main Calendar View */}
        <div className="flex-1 bg-card/60 backdrop-blur-3xl rounded-[3rem] shadow-2xl border border-border flex flex-col overflow-hidden relative">
          {isLoading && (
            <div className="absolute inset-0 bg-card/80 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6 shadow-2xl shadow-indigo-500/20"></div>
                <p className="text-sm font-black text-muted-foreground animate-pulse uppercase tracking-[0.3em]">Loading schedule...</p>
              </div>
            </div>
          )}
          {view === 'month' ? (
            <>
              {/* Weekday Labels */}
              <div className="grid grid-cols-7 border-b border-border bg-muted/30">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="py-4 text-center text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
                    {day}
                  </div>
                ))}
              </div>

              {/* Grid Cells */}
              <div className="grid grid-cols-7 flex-1 overflow-y-auto custom-scrollbar">
                {calendarData.map((cell, idx) => {
                  const dateEvents = getEventsForDate(cell.fullDate);
                  const isCurrent = cell.month === 'current';
                  const isCellToday = isToday(cell.fullDate);

                  return (
                    <div
                      key={idx}
                      className={`min-h-[120px] p-3 border-r border-b border-border/40 transition-all hover:bg-muted/30 group relative
                        ${!isCurrent ? 'bg-muted/10 text-muted-foreground/40' : 'text-foreground'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-sm font-black flex items-center justify-center w-8 h-8 rounded-xl transition-all
                          ${isCellToday
                            ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-500/30 scale-110'
                            : isCurrent ? 'text-foreground hover:bg-muted' : 'text-muted-foreground/40'}`}>
                          {cell.date}
                        </span>
                        {isCurrent && (
                          <button
                            onClick={() => {
                              setEditingEventId(null);
                              setNewEvent({ ...newEvent, date: cell.fullDate.toISOString().split('T')[0] });
                              setIsEventModalOpen(true);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-muted rounded-xl transition-all active:scale-90"
                          >
                            <Plus className="w-4 h-4 text-muted-foreground" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        {dateEvents.map(event => (
                          <div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(event);
                            }}
                            className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black truncate border-l-2 shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all
                              ${colorMap[event.color]?.bg || 'bg-muted'} 
                              ${colorMap[event.color]?.text || 'text-foreground'} 
                              ${colorMap[event.color]?.border || 'border-border'}`}
                          >
                            {event.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : view === 'week' ? (
            <>
              {/* Week View Header */}
              <div className="grid grid-cols-8 border-b border-border bg-muted/30">
                <div className="p-3"></div>
                {weekData.map((date, i) => (
                  <div key={i} className="py-4 text-center border-l border-border/40">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
                      {date.toLocaleDateString('default', { weekday: 'short' })}
                    </p>
                    <p className={`text-sm font-black mt-1.5 ${isToday(date) ? 'text-indigo-600' : 'text-foreground'}`}>
                      {date.getDate()}
                    </p>
                  </div>
                ))}
              </div>

              {/* Week View Grid */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {timeSlots.map((time, idx) => (
                  <div key={idx} className="grid grid-cols-8 border-b border-border/30">
                    <div className="p-3 text-[10px] font-black text-muted-foreground text-right pr-4 self-center">
                      {time}
                    </div>
                    {weekData.map((date, i) => {
                      const hourEvents = getEventsForDateTime(date, time);
                      return (
                        <div key={i} className="min-h-[80px] border-l border-border/40 p-2 hover:bg-muted/20 transition-all">
                          {hourEvents.map(event => (
                            <div
                              key={event.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(event);
                              }}
                              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black shadow-sm border-l-2 mb-1.5 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all
                                 ${colorMap[event.color]?.bg || 'bg-muted'} 
                                 ${colorMap[event.color]?.text || 'text-foreground'} 
                                 ${colorMap[event.color]?.border || 'border-border'}`}
                            >
                              {event.title}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Day View */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {timeSlots.map((time, idx) => {
                  const hourEvents = getEventsForDateTime(currentDate, time);
                  return (
                    <div key={idx} className="flex border-b border-border/30 group">
                      <div className="w-24 p-4 text-xs font-black text-muted-foreground text-right pr-6 self-center">
                        {time}
                      </div>
                      <div className="flex-1 min-h-[100px] border-l border-border/40 p-4 hover:bg-muted/20 transition-all relative">
                        {hourEvents.map(event => (
                          <div
                            key={event.id}
                            onClick={() => handleEditClick(event)}
                            className={`p-4 rounded-2xl text-xs font-black shadow-lg border-l-4 mb-3 max-w-xl animate-in slide-in-from-left-2 duration-200 cursor-pointer hover:shadow-xl hover:scale-[1.01] transition-all
                                ${colorMap[event.color]?.bg || 'bg-muted'} 
                                ${colorMap[event.color]?.text || 'text-foreground'} 
                                ${colorMap[event.color]?.border || 'border-border'} 
                                ${colorMap[event.color]?.shadow || 'shadow-muted'}`}
                          >
                            <div className="flex justify-between items-start">
                              <span>{event.title}</span>
                              <span className="text-[10px] font-medium opacity-70">
                                {time} - {(parseInt(time) + 1).toString().padStart(2, '0')}:00
                              </span>
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            setEditingEventId(null);
                            setNewEvent({ ...newEvent, date: currentDate.toISOString().split('T')[0], time: time });
                            setIsEventModalOpen(true);
                          }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2.5 bg-indigo-500/10 text-indigo-600 rounded-full hover:bg-indigo-500/20 shadow-lg transition-all active:scale-90"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Premium Sidebar */}
        <div className="w-80 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
          {/* Schedule Overview */}
          <div className="bg-card/60 backdrop-blur-3xl rounded-[2.5rem] p-6 shadow-2xl border border-border">
            <h3 className="text-sm font-black text-foreground mb-6 flex items-center uppercase tracking-[0.2em]">
              <CalendarIcon className="w-5 h-5 mr-3 text-indigo-600" />
              Overview
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/30 p-4 rounded-2xl border border-border">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Consultations</p>
                <p className="text-2xl font-black text-indigo-600 tracking-tighter">
                  {events.filter(e => e.type === 'appointment').length}
                </p>
              </div>
              <div className="bg-muted/30 p-4 rounded-2xl border border-border">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Surgeries</p>
                <p className="text-2xl font-black text-red-600 tracking-tighter">
                  {events.filter(e => e.type === 'surgery').length}
                </p>
              </div>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-card/60 backdrop-blur-3xl rounded-[2.5rem] p-6 shadow-2xl border border-border">
            <h3 className="text-sm font-black text-foreground mb-6 uppercase tracking-[0.2em]">Upcoming Next</h3>
            <div className="space-y-3">
              {events
                .filter(e => e.start >= new Date())
                .sort((a, b) => a.start - b.start)
                .slice(0, 5)
                .map(event => (
                  <div
                    key={event.id}
                    onClick={() => handleEditClick(event)}
                    className="group relative flex space-x-4 p-4 rounded-2xl hover:bg-muted/30 transition-all border border-transparent hover:border-border cursor-pointer"
                  >
                    <div className={`w-1.5 h-auto rounded-full ${colorMap[event.color]?.dot || 'bg-muted'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-foreground truncate mb-2">{event.title}</p>
                      <div className="flex items-center text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                        <Clock className="w-3.5 h-3.5 mr-2" />
                        {event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEvent(event.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all active:scale-90"
                    >
                      <Plus className="w-4 h-4 rotate-45" />
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* Help Tip Card */}
          <div className="bg-indigo-600 rounded-[2.5rem] p-6 shadow-2xl shadow-indigo-500/30 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-sm font-black mb-3 uppercase tracking-[0.2em]">Helpful Tip</h3>
              <p className="text-xs text-indigo-100 leading-relaxed font-medium">
                You can sync your medical calendar with Google Calendar in settings.
              </p>
              <button
                onClick={() => setIsHelpModalOpen(true)}
                className="mt-5 bg-white/20 hover:bg-white/30 text-white text-[10px] font-black px-5 py-3 rounded-xl transition-all border border-white/30 uppercase tracking-[0.2em] active:scale-95"
              >
                Learn More
              </button>
            </div>
            {/* Decorative Icon */}
            <CalendarIcon className="absolute -bottom-6 -right-6 w-32 h-32 text-white/10 rotate-12" />
          </div>
        </div>
      </div>

      {/* Event Modal */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-card/80 backdrop-blur-3xl rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200 border border-border">
            <div className="p-8 border-b border-border flex justify-between items-center">
              <h2 className="text-2xl font-black text-foreground tracking-tighter">
                {editingEventId ? 'Edit Event' : 'New Event'}
              </h2>
              <button
                onClick={() => {
                  setIsEventModalOpen(false);
                  setEditingEventId(null);
                }}
                className="p-2.5 hover:bg-muted rounded-xl transition-all active:scale-90"
              >
                <Plus className="w-5 h-5 text-muted-foreground rotate-45" />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="p-8 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-muted-foreground uppercase mb-2 ml-1 tracking-[0.2em]">Event Title</label>
                <input
                  autoFocus
                  type="text"
                  placeholder="e.g. Patient Consultation"
                  value={newEvent.title}
                  onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-5 py-4 bg-muted/30 border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-muted-foreground/40 text-foreground font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-muted-foreground uppercase mb-2 ml-1 tracking-[0.2em]">Date</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full px-5 py-4 bg-muted/30 border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-foreground font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-muted-foreground uppercase mb-2 ml-1 tracking-[0.2em]">Time</label>
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={e => setNewEvent({ ...newEvent, time: e.target.value })}
                    className="w-full px-5 py-4 bg-muted/30 border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-foreground font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-muted-foreground uppercase mb-2 ml-1 tracking-[0.2em]">Event Type</label>
                <input
                  type="text"
                  placeholder="e.g. Appointment, Meeting, Surgery"
                  value={newEvent.type}
                  onChange={e => setNewEvent({ ...newEvent, type: e.target.value })}
                  className="w-full px-5 py-4 bg-muted/30 border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-muted-foreground/40 text-foreground font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-muted-foreground uppercase mb-2 ml-1 tracking-[0.2em]">Event Color</label>
                <div className="flex space-x-3 ml-1">
                  {Object.keys(colorMap).map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewEvent({ ...newEvent, color })}
                      className={`w-10 h-10 rounded-full border-2 transition-all transform hover:scale-110 active:scale-95
                        ${colorMap[color].dot} 
                        ${newEvent.color === color ? 'border-foreground ring-4 ring-border' : 'border-transparent'}`}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-4 flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEventModalOpen(false);
                    setEditingEventId(null);
                  }}
                  className="flex-1 px-6 py-4 border border-border rounded-2xl text-foreground font-black text-[11px] uppercase tracking-[0.2em] hover:bg-muted transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/30 hover:bg-indigo-700 transition-all active:scale-95"
                >
                  {editingEventId ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Help & Info Modal */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-card/80 backdrop-blur-3xl rounded-[3.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300 border border-border">
            <div className="relative h-36 bg-indigo-600 flex items-center px-10 overflow-hidden">
              <div className="relative z-10 text-white">
                <h2 className="text-3xl font-black mb-2 tracking-tighter">Calendar Synchronization</h2>
                <p className="text-indigo-100 text-sm font-medium">Expert tips for managing your medical schedule</p>
              </div>
              <CalendarIcon className="absolute -bottom-8 -right-8 w-56 h-56 text-white/10 rotate-12" />
              <button
                onClick={() => setIsHelpModalOpen(false)}
                className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all active:scale-90"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <div className="p-10 space-y-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Feature 1: Google Sync */}
              <div className="flex gap-8">
                <div className="w-16 h-16 bg-blue-50 rounded-[2rem] flex items-center justify-center shrink-0 border border-blue-100 shadow-lg">
                  <Globe className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground mb-3 tracking-tight">Google Calendar Integration</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Sync your CareConnect appointments directly with your external calendars. Navigate to
                    <span className="inline-flex items-center mx-1.5 px-3 py-1 bg-muted rounded-lg font-black text-foreground text-xs">
                      Settings <ArrowRight className="w-3 h-3 mx-1.5" /> Profile
                    </span>
                    to authorize your Google account. All changes will sync in real-time.
                  </p>
                </div>
              </div>

              {/* Feature 2: Smart Scheduling */}
              <div className="flex gap-8">
                <div className="w-16 h-16 bg-indigo-50 rounded-[2rem] flex items-center justify-center shrink-0 border border-indigo-100 shadow-lg">
                  <RefreshCw className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground mb-3 tracking-tight">Automated Conflicts Detection</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Our system automatically scans your schedule for overlapping surgeries and
                    consultations. If a conflict is detected, you'll receive an instant notification in your
                    dashboard to reschedule.
                  </p>
                </div>
              </div>

              {/* Feature 3: Security & Privacy */}
              <div className="flex gap-8">
                <div className="w-16 h-16 bg-emerald-50 rounded-[2rem] flex items-center justify-center shrink-0 border border-emerald-100 shadow-lg">
                  <ShieldCheck className="w-8 h-8 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground mb-3 tracking-tight">HIPAA Compliant Sync</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    All calendar data is encrypted during synchronization. Patient names are anonymized in
                    external calendars to maintain strict confidentiality and regulatory compliance.
                  </p>
                </div>
              </div>

              <div className="pt-6 bg-muted/30 p-8 rounded-[2.5rem] border border-border border-dashed">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-black text-foreground mb-2 text-lg">Need more help?</h4>
                    <p className="text-xs text-muted-foreground font-medium tracking-wide leading-relaxed">Contact support or visit our documentation for more advanced guides.</p>
                  </div>
                  <button className="px-6 py-3 bg-card border border-border rounded-2xl text-sm font-black text-indigo-600 hover:bg-muted transition-all shadow-lg active:scale-95">
                    View Docs
                  </button>
                </div>
              </div>
            </div>

            <div className="p-8 bg-muted/20 border-t border-border flex justify-end">
              <button
                onClick={() => setIsHelpModalOpen(false)}
                className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/30 hover:bg-indigo-700 transition-all transform hover:scale-105 active:scale-95"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarTab;

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
    blue: { bg: 'bg-blue-50/50', text: 'text-blue-700', border: 'border-blue-500', shadow: 'shadow-blue-100', dot: 'bg-blue-500' },
    red: { bg: 'bg-red-50/50', text: 'text-red-700', border: 'border-red-500', shadow: 'shadow-red-100', dot: 'bg-red-500' },
    green: { bg: 'bg-green-50/50', text: 'text-green-700', border: 'border-green-500', shadow: 'shadow-green-100', dot: 'bg-green-500' },
    orange: { bg: 'bg-orange-50/50', text: 'text-orange-700', border: 'border-orange-500', shadow: 'shadow-orange-100', dot: 'bg-orange-500' },
    purple: { bg: 'bg-purple-50/50', text: 'text-purple-700', border: 'border-purple-500', shadow: 'shadow-purple-100', dot: 'bg-purple-500' },
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
    <div className="flex h-full flex-col bg-slate-50/50 backdrop-blur-sm -m-6 p-6">
      <Toaster position="top-right" />

      {/* Top Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-6">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-indigo-600 bg-clip-text text-transparent">
              {view === 'day' ? currentDate.toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' }) : `${monthName} ${yearName}`}
            </h1>
            <p className="text-slate-500 text-sm font-medium">Schedule and manage your appointments</p>
          </div>
          <div className="flex items-center bg-white rounded-xl shadow-sm border border-slate-200 p-1">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 hover:bg-slate-50 rounded-lg text-sm font-semibold text-slate-700 transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-white rounded-xl shadow-sm border border-slate-200 p-1">
            {['month', 'week', 'day'].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === v
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-50'
                  }`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
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
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            <span>New Event</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex space-x-6 overflow-hidden">
        {/* Main Calendar View */}
        <div className="flex-1 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 flex flex-col overflow-hidden relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4 shadow-lg shadow-indigo-100"></div>
                <p className="text-sm font-bold text-slate-600 animate-pulse">Loading schedule...</p>
              </div>
            </div>
          )}
          {view === 'month' ? (
            <>
              {/* Weekday Labels */}
              <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
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
                      className={`min-h-[120px] p-2 border-r border-b border-slate-50 transition-colors hover:bg-slate-50/50 group relative
                        ${!isCurrent ? 'bg-slate-50/20 text-slate-300' : 'text-slate-700'}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-sm font-bold flex items-center justify-center w-7 h-7 rounded-lg transition-all
                          ${isCellToday
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                            : isCurrent ? 'text-slate-700' : 'text-slate-400'}`}>
                          {cell.date}
                        </span>
                        {isCurrent && (
                          <button
                            onClick={() => {
                              setEditingEventId(null);
                              setNewEvent({ ...newEvent, date: cell.fullDate.toISOString().split('T')[0] });
                              setIsEventModalOpen(true);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded-md transition-all"
                          >
                            <Plus className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-1">
                        {dateEvents.map(event => (
                          <div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(event);
                            }}
                            className={`px-2 py-1 rounded-md text-[10px] font-bold truncate border-l-2 shadow-sm cursor-pointer hover:brightness-95 transition-all
                              ${colorMap[event.color]?.bg || 'bg-slate-50'} 
                              ${colorMap[event.color]?.text || 'text-slate-700'} 
                              ${colorMap[event.color]?.border || 'border-slate-500'}`}
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
              <div className="grid grid-cols-8 border-b border-slate-100 bg-slate-50/50">
                <div className="p-3"></div>
                {weekData.map((date, i) => (
                  <div key={i} className="py-3 text-center border-l border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {date.toLocaleDateString('default', { weekday: 'short' })}
                    </p>
                    <p className={`text-sm font-bold mt-1 ${isToday(date) ? 'text-indigo-600' : 'text-slate-700'}`}>
                      {date.getDate()}
                    </p>
                  </div>
                ))}
              </div>

              {/* Week View Grid */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {timeSlots.map((time, idx) => (
                  <div key={idx} className="grid grid-cols-8 border-b border-slate-50">
                    <div className="p-2 text-[10px] font-bold text-slate-400 text-right pr-4 self-center">
                      {time}
                    </div>
                    {weekData.map((date, i) => {
                      const hourEvents = getEventsForDateTime(date, time);
                      return (
                        <div key={i} className="min-h-[80px] border-l border-slate-50 p-1 hover:bg-slate-50/30 transition-colors">
                          {hourEvents.map(event => (
                            <div
                              key={event.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(event);
                              }}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm border-l-2 mb-1 cursor-pointer hover:brightness-95 transition-all
                                 ${colorMap[event.color]?.bg || 'bg-slate-50'} 
                                 ${colorMap[event.color]?.text || 'text-slate-700'} 
                                 ${colorMap[event.color]?.border || 'border-slate-500'}`}
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
              {/* Day View View */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {timeSlots.map((time, idx) => {
                  const hourEvents = getEventsForDateTime(currentDate, time);
                  return (
                    <div key={idx} className="flex border-b border-slate-50 group">
                      <div className="w-20 p-4 text-xs font-bold text-slate-400 text-right pr-6 self-center">
                        {time}
                      </div>
                      <div className="flex-1 min-h-[100px] border-l border-slate-50 p-3 hover:bg-slate-50/50 transition-all relative">
                        {hourEvents.map(event => (
                          <div
                            key={event.id}
                            onClick={() => handleEditClick(event)}
                            className={`p-3 rounded-xl text-xs font-bold shadow-sm border-l-4 mb-2 max-w-xl animate-in slide-in-from-left-2 duration-200 cursor-pointer hover:brightness-95 transition-all
                                ${colorMap[event.color]?.bg || 'bg-slate-50/50'} 
                                ${colorMap[event.color]?.text || 'text-slate-700'} 
                                ${colorMap[event.color]?.border || 'border-slate-500'} 
                                ${colorMap[event.color]?.shadow || 'shadow-slate-100'}`}
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
                          className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 shadow-sm transition-all"
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

        {/* Info Sidebar */}
        <div className="w-80 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
          {/* Mini Insights */}
          <div className="bg-white rounded-2xl p-5 shadow-lg shadow-slate-200/50 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
              <CalendarIcon className="w-4 h-4 mr-2 text-indigo-600" />
              Schedule Overview
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Consultations</p>
                <p className="text-xl font-bold text-indigo-600">
                  {events.filter(e => e.type === 'appointment').length}
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Surgeries</p>
                <p className="text-xl font-bold text-red-600">
                  {events.filter(e => e.type === 'surgery').length}
                </p>
              </div>
            </div>
          </div>

          {/* Upcoming Events List */}
          <div className="bg-white rounded-2xl p-5 shadow-lg shadow-slate-200/50 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Upcoming Next</h3>
            <div className="space-y-4">
              {events
                .filter(e => e.start >= new Date())
                .sort((a, b) => a.start - b.start)
                .slice(0, 5)
                .map(event => (
                  <div
                    key={event.id}
                    onClick={() => handleEditClick(event)}
                    className="group relative flex space-x-3 p-3 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 cursor-pointer"
                  >
                    <div className={`w-1 h-auto rounded-full ${colorMap[event.color]?.dot || 'bg-slate-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate mb-1">{event.title}</p>
                      <div className="flex items-center text-[10px] font-medium text-slate-500">
                        <Clock className="w-3 h-3 mr-1" />
                        {event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEvent(event.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"
                    >
                      <Plus className="w-4 h-4 rotate-45" />
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* Quick Filters */}
          <div className="bg-indigo-600 rounded-2xl p-5 shadow-xl shadow-indigo-200 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-sm font-bold mb-2">Helpful Tip</h3>
              <p className="text-xs text-indigo-100 leading-relaxed font-medium">
                You can sync your medical calendar with Google Calendar in settings.
              </p>
              <button
                onClick={() => setIsHelpModalOpen(true)}
                className="mt-4 bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold px-4 py-2 rounded-lg transition-colors border border-white/30"
              >
                Learn More
              </button>
            </div>
            {/* Decal */}
            <CalendarIcon className="absolute -bottom-4 -right-4 w-24 h-24 text-white/10 rotate-12" />
          </div>
        </div>
      </div>

      {/* Event Modal */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {editingEventId ? 'Edit Event' : 'New Event'}
              </h2>
              <button
                onClick={() => {
                  setIsEventModalOpen(false);
                  setEditingEventId(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5 text-slate-400 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Event Title</label>
                <input
                  autoFocus
                  type="text"
                  placeholder="e.g. Patient Consultation"
                  value={newEvent.title}
                  onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Date</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Time</label>
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={e => setNewEvent({ ...newEvent, time: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Event Type</label>
                <input
                  type="text"
                  placeholder="e.g. Appointment, Meeting, Surgery"
                  value={newEvent.type}
                  onChange={e => setNewEvent({ ...newEvent, type: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Event Color</label>
                <div className="flex space-x-3 ml-1">
                  {Object.keys(colorMap).map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewEvent({ ...newEvent, color })}
                      className={`w-8 h-8 rounded-full border-2 transition-all transform hover:scale-110 
                        ${colorMap[color].dot} 
                        ${newEvent.color === color ? 'border-slate-800 ring-2 ring-slate-200' : 'border-transparent'}`}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-4 flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEventModalOpen(false);
                    setEditingEventId(null);
                  }}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="relative h-32 bg-indigo-600 flex items-center px-8 overflow-hidden">
              <div className="relative z-10 text-white">
                <h2 className="text-2xl font-bold mb-1">Calendar Synchronization</h2>
                <p className="text-indigo-100 text-sm">Expert tips for managing your medical schedule</p>
              </div>
              <CalendarIcon className="absolute -bottom-6 -right-6 w-48 h-48 text-white/10 rotate-12" />
              <button
                onClick={() => setIsHelpModalOpen(false)}
                className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Feature 1: Google Sync */}
              <div className="flex gap-6">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100 shadow-sm">
                  <Globe className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2 font-outfit">Google Calendar Integration</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Sync your CareConnect appointments directly with your external calendars. Navigate to
                    <span className="inline-flex items-center mx-1 px-2 py-0.5 bg-slate-100 rounded-md font-bold text-slate-700 text-xs">
                      Settings <ArrowRight className="w-3 h-3 mx-1" /> Profile
                    </span>
                    to authorize your Google account. All changes will sync in real-time.
                  </p>
                </div>
              </div>

              {/* Feature 2: Smart Scheduling */}
              <div className="flex gap-6">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-100 shadow-sm">
                  <RefreshCw className="w-7 h-7 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2 font-outfit">Automated Conflicts Detection</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Our system automatically scans your schedule for overlapping surgeries and
                    consultations. If a conflict is detected, you'll receive an instant notification in your
                    dashboard to reschedule.
                  </p>
                </div>
              </div>

              {/* Feature 3: Security & Privacy */}
              <div className="flex gap-6">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-100 shadow-sm">
                  <ShieldCheck className="w-7 h-7 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2 font-outfit">HIPAA Compliant Sync</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    All calendar data is encrypted during synchronization. Patient names are anonymized in
                    external calendars to maintain strict confidentiality and regulatory compliance.
                  </p>
                </div>
              </div>

              <div className="pt-4 bg-slate-50 p-6 rounded-2xl border border-slate-100 border-dashed">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 mb-1">Need more help?</h4>
                    <p className="text-xs text-slate-500 font-medium tracking-wide leading-relaxed">Contact support or visit our documentation for more advanced guides.</p>
                  </div>
                  <button className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-indigo-600 hover:bg-slate-50 transition-all shadow-sm">
                    View Docs
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsHelpModalOpen(false)}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all transform hover:scale-105"
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
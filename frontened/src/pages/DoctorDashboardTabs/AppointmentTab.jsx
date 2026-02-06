import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import {
    Calendar, Clock, User, Phone, CheckCircle2, XCircle,
    AlertCircle, MoreVertical, Plus, Search, Filter,
    Settings as SettingsIcon, ChevronRight, ArrowRight,
    TrendingUp, Users, CalendarDays, Activity,
    Edit3, Trash2, Check, RefreshCw, Info, ExternalLink,
    MapPin, DollarSign, Clock4, FileText, Zap, X
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { API_URLS } from "../../config/api";
import { debounce } from "../../utils/performance";
import { toast } from "react-hot-toast";

const Skeleton = ({ className }) => (
    <div className={`animate-pulse bg-muted rounded-xl ${className}`}></div>
);

const AppointmentSkeleton = () => (
    <div className="flex items-center justify-between p-4 border border-border rounded-3xl bg-card space-x-4">
        <div className="flex items-center space-x-4 flex-1">
            <Skeleton className="w-1.5 h-10 rounded-full" />
            <Skeleton className="w-20 h-4" />
            <div className="flex-1 space-y-2">
                <Skeleton className="w-1/3 h-5" />
                <Skeleton className="w-1/4 h-3" />
            </div>
        </div>
        <div className="flex items-center space-x-3">
            <Skeleton className="w-20 h-6 rounded-full" />
            <div className="flex space-x-2">
                <Skeleton className="w-12 h-8 rounded-xl" />
                <Skeleton className="w-12 h-8 rounded-xl" />
            </div>
        </div>
    </div>
);

const StatSkeleton = () => (
    <div className="bg-card border border-border rounded-[2rem] p-6 space-y-4">
        <div className="flex items-center justify-between">
            <Skeleton className="w-10 h-10 rounded-2xl" />
            <Skeleton className="w-12 h-4" />
        </div>
        <div className="space-y-2">
            <Skeleton className="w-1/2 h-8" />
            <Skeleton className="w-3/4 h-3" />
        </div>
    </div>
);

const AppointmentTab = memo(() => {
    const { user } = useAuth();
    const doctorId = user?.id;
    const [allAppointments, setAllAppointments] = useState([]);
    const [patients, setPatients] = useState([]);
    const [stats, setStats] = useState(null);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);

    // Modal states
    const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
    const [showEditAppointmentModal, setShowEditAppointmentModal] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState(null);

    // Settings states
    const [settingsEditing, setSettingsEditing] = useState(false);
    const [tempSettings, setTempSettings] = useState(null);

    // Filter states
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Form states
    const [appointmentForm, setAppointmentForm] = useState({
        patient_id: '',
        appointment_date: new Date().toISOString().split('T')[0],
        appointment_time: '',
        appointment_type: 'consultation',
        notes: ''
    });

    // View mode for specialized filters (like Week View)
    const [viewMode, setViewMode] = useState('daily'); // 'daily' or 'week'

    // Helper to get local date string YYYY-MM-DD
    const getLocalFormattedDate = (date = new Date()) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Doctor ID from authentication context
    // Now using authenticated doctor ID instead of hardcoded value

    // Memoized filtered and sorted appointments to prevent unnecessary re-renders
    const filteredAppointments = useMemo(() => {
        let filtered = [...allAppointments];

        // Filter by date or date range
        if (viewMode === 'week') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const nextWeek = new Date();
            nextWeek.setDate(today.getDate() + 7);
            nextWeek.setHours(23, 59, 59, 999);

            filtered = filtered.filter(apt => {
                const aptDate = new Date(apt.appointment_date);
                return aptDate >= today && aptDate <= nextWeek;
            });
        } else if (selectedDate) {
            filtered = filtered.filter(apt => {
                const appointmentDate = new Date(apt.appointment_date);
                const formattedAptDate = getLocalFormattedDate(appointmentDate);
                return formattedAptDate === selectedDate;
            });
        }

        // Filter by search term
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(apt => {
                const patientName = `${apt.patient_first_name || ''} ${apt.patient_last_name || ''}`.toLowerCase();
                const type = (apt.appointment_type || '').toLowerCase();
                const uniqueId = (apt.patient_unique_id || '').toLowerCase();
                const notes = (apt.notes || '').toLowerCase();

                return patientName.includes(lowerSearch) ||
                    type.includes(lowerSearch) ||
                    uniqueId.includes(lowerSearch) ||
                    notes.includes(lowerSearch);
            });
        }

        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(apt => apt.status === statusFilter);
        }

        // Sort appointments
        const statusPriority = {
            'pending': 1,
            'confirmed': 2,
            'cancelled': 3,
            'completed': 4
        };

        filtered.sort((a, b) => {
            // If in week view, sort by date first
            if (viewMode === 'week') {
                const dateA = new Date(a.appointment_date).getTime();
                const dateB = new Date(b.appointment_date).getTime();
                if (dateA !== dateB) return dateA - dateB;
            }

            const priorityDiff = (statusPriority[a.status] || 5) - (statusPriority[b.status] || 5);
            if (priorityDiff !== 0) return priorityDiff;
            return (a.appointment_time || '').localeCompare(b.appointment_time || '');
        });

        return filtered;
    }, [allAppointments, selectedDate, searchTerm, statusFilter, viewMode]);


    const fetchData = useCallback(async () => {
        if (!doctorId) return;

        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');

            if (!token) {
                throw new Error('Authentication required');
            }

            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            const [appointmentsResponse, statsResponse, settingsResponse] = await Promise.all([
                fetch(API_URLS.APPOINTMENTS.BY_DOCTOR(doctorId), { headers }),
                fetch(API_URLS.DOCTORS.STATS(doctorId), { headers }),
                fetch(API_URLS.DOCTORS.SETTINGS(doctorId), { headers })
            ]);

            const appointmentsData = appointmentsResponse.ok ? await appointmentsResponse.json() : { data: [] };
            const statsData = statsResponse.ok ? await statsResponse.json() : { data: null };
            const settingsData = settingsResponse.ok ? await settingsResponse.json() : {
                data: {
                    default_appointment_duration: 30,
                    working_hours_start: '09:00',
                    working_hours_end: '17:00',
                    consultation_fee: 0,
                    accept_new_patients: true
                }
            };

            setAllAppointments(appointmentsData.data || appointmentsData || []);
            setStats(statsData.data || statsData);
            setSettings(settingsData.data || settingsData);
            setTempSettings(settingsData.data || settingsData);
            setError(null);
        } catch (err) {
            setError(err.message);
            toast.error(`Error loading data: ${err.message}`);
            console.error('Error fetching appointments:', err);
        } finally {
            setLoading(false);
        }
    }, [doctorId]);

    const fetchPatients = useCallback(async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (!doctorId || !token) return;

            const response = await fetch(API_URLS.PATIENTS.BY_DOCTOR(doctorId), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const patientsData = await response.json();
                setPatients(patientsData.data || patientsData || []);
            }
        } catch (err) {
            console.error('Error fetching patients:', err);
        }
    }, [doctorId]);

    const resetAppointmentForm = useCallback(() => {
        setAppointmentForm({
            patient_id: '',
            appointment_date: new Date().toISOString().split('T')[0],
            appointment_time: '',
            appointment_type: 'consultation',
            notes: ''
        });
    }, []);

    const handleNewAppointment = useCallback(async (e) => {
        e.preventDefault();
        console.log('Submitting new appointment:', appointmentForm);
        try {
            const token = localStorage.getItem('authToken');
            if (!doctorId || !token) {
                throw new Error('Authentication required');
            }

            const response = await fetch(API_URLS.APPOINTMENTS.BY_DOCTOR(doctorId), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...appointmentForm, doctor_id: doctorId })
            });

            if (!response.ok) {
                throw new Error('Failed to create appointment');
            }

            const result = await response.json();
            console.log('Appointment created successfully:', result);

            // Add new appointment to local state instead of full reload
            const newAppointment = {
                ...(result.data || result),
                patient_first_name: patients.find(p => p.id == appointmentForm.patient_id)?.first_name || '',
                patient_last_name: patients.find(p => p.id == appointmentForm.patient_id)?.last_name || '',
                patient_unique_id: patients.find(p => p.id == appointmentForm.patient_id)?.unique_id || '',
                patient_email: patients.find(p => p.id == appointmentForm.patient_id)?.email || ''
            };

            setAllAppointments(prev => [...prev, newAppointment]);
            setShowNewAppointmentModal(false);
            resetAppointmentForm();
            setError(null);
            toast.success('Appointment created successfully');
        } catch (err) {
            console.error('Error creating appointment:', err);
            setError(err.message);
            toast.error(err.message);
        }
    }, [doctorId, appointmentForm, patients, resetAppointmentForm]);

    const handleEditAppointment = useCallback(async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('authToken');
            if (!editingAppointment || !token) {
                throw new Error('Authentication required');
            }

            const response = await fetch(`http://localhost:3001/api/appointments/${editingAppointment.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(appointmentForm)
            });

            if (!response.ok) {
                throw new Error('Failed to update appointment');
            }

            const result = await response.json();

            // Update appointment in local state instead of full reload
            setAllAppointments(prev =>
                prev.map(apt =>
                    apt.id === editingAppointment.id
                        ? {
                            ...apt,
                            ...appointmentForm,
                            patient_first_name: patients.find(p => p.id == appointmentForm.patient_id)?.first_name || apt.patient_first_name,
                            patient_last_name: patients.find(p => p.id == appointmentForm.patient_id)?.last_name || apt.patient_last_name,
                            patient_unique_id: patients.find(p => p.id == appointmentForm.patient_id)?.unique_id || apt.patient_unique_id
                        }
                        : apt
                )
            );

            setShowEditAppointmentModal(false);
            setEditingAppointment(null);
            resetAppointmentForm();
            setError(null);
            toast.success('Appointment updated successfully');
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        }
    }, [editingAppointment, appointmentForm, patients, resetAppointmentForm]);

    const handleCancelAppointment = useCallback(async (appointmentId) => {
        if (window.confirm('Are you sure you want to cancel this appointment?')) {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    throw new Error('Authentication required');
                }

                const response = await fetch(`http://localhost:3001/api/appointments/${appointmentId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status: 'cancelled' })
                });

                if (!response.ok) {
                    throw new Error('Failed to cancel appointment');
                }

                setAllAppointments(prev =>
                    prev.map(apt =>
                        apt.id === appointmentId
                            ? { ...apt, status: 'cancelled' }
                            : apt
                    )
                );
                toast.success('Appointment cancelled');
            } catch (err) {
                setError(err.message);
                toast.error(err.message);
            }
        }
    }, []);

    const handleStatusChange = useCallback(async (appointmentId, newStatus) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('Authentication required');
            }

            const response = await fetch(`http://localhost:3001/api/appointments/${appointmentId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                throw new Error('Failed to update appointment status');
            }

            setAllAppointments(prev =>
                prev.map(apt =>
                    apt.id === appointmentId
                        ? { ...apt, status: newStatus }
                        : apt
                )
            );
            toast.success(`Appointment status: ${newStatus}`);
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        }
    }, []);

    const openEditModal = useCallback((appointment) => {
        setEditingAppointment(appointment);
        setAppointmentForm({
            patient_id: appointment.patient_id,
            appointment_date: appointment.appointment_date,
            appointment_time: appointment.appointment_time,
            appointment_type: appointment.appointment_type,
            notes: appointment.notes || ''
        });
        setShowEditAppointmentModal(true);
    }, []);

    const getQuickActions = useCallback((appointment) => {
        if (appointment.status === 'completed' || appointment.status === 'cancelled') return null;

        return (
            <div className="flex items-center space-x-2">
                {appointment.status === 'pending' && (
                    <button
                        onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                        className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all shadow-sm border border-emerald-100 group"
                        title="Confirm Appointment"
                    >
                        <Check size={16} className="group-hover:scale-110 transition-transform" />
                    </button>
                )}
                {appointment.status === 'confirmed' && (
                    <button
                        onClick={() => handleStatusChange(appointment.id, 'completed')}
                        className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-all shadow-sm border border-indigo-100 group"
                        title="Mark as Completed"
                    >
                        <CheckCircle2 size={16} className="group-hover:scale-110 transition-transform" />
                    </button>
                )}
                <button
                    onClick={() => openEditModal(appointment)}
                    className="p-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-xl transition-all shadow-sm border border-slate-200 group"
                    title="Edit Details"
                >
                    <Edit3 size={16} className="group-hover:scale-110 transition-transform" />
                </button>
                <button
                    onClick={() => handleCancelAppointment(appointment.id)}
                    className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl transition-all shadow-sm border border-rose-100 group"
                    title="Cancel Appointment"
                >
                    <XCircle size={16} className="group-hover:scale-110 transition-transform" />
                </button>
            </div>
        );
    }, [handleStatusChange, handleCancelAppointment, openEditModal]);

    const handleSaveSettings = useCallback(async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (!doctorId || !token) {
                throw new Error('Authentication required');
            }

            const response = await fetch(API_URLS.DOCTORS.SETTINGS(doctorId), {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(tempSettings)
            });

            if (!response.ok) {
                throw new Error('Failed to update settings');
            }

            const result = await response.json();
            setSettings(result.data || tempSettings);
            setSettingsEditing(false);
            setError(null);
        } catch (err) {
            setError(err.message);
        }
    }, [doctorId, tempSettings]);

    const handleCancelSettings = useCallback(() => {
        setTempSettings(settings);
        setSettingsEditing(false);
    }, [settings]);

    useEffect(() => {
        if (doctorId) {
            fetchData();
            fetchPatients();
        }
    }, [fetchData, fetchPatients, doctorId]);

    const formatTime = (timeString) => {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'confirmed':
                return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'cancelled':
                return 'bg-rose-50 text-rose-600 border-rose-100';
            case 'completed':
                return 'bg-slate-100 text-slate-600 border-slate-200';
            default:
                return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    if (loading) {
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex justify-between items-center">
                    <div className="space-y-2">
                        <Skeleton className="w-48 h-10" />
                        <Skeleton className="w-64 h-4" />
                    </div>
                    <Skeleton className="w-40 h-12 rounded-2xl" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatSkeleton />
                    <StatSkeleton />
                    <StatSkeleton />
                    <StatSkeleton />
                </div>
                <div className="space-y-4">
                    <Skeleton className="w-full h-16 rounded-3xl" />
                    <div className="space-y-3">
                        <AppointmentSkeleton />
                        <AppointmentSkeleton />
                        <AppointmentSkeleton />
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6 animate-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center border border-rose-100 shadow-xl shadow-rose-500/5">
                    <AlertCircle size={40} className="text-rose-500" />
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold text-slate-800">Connection Error</h3>
                    <p className="text-slate-500 max-w-sm">{error}</p>
                </div>
                <button
                    onClick={fetchData}
                    className="group px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold transition-all hover:bg-slate-800 hover:shadow-xl active:scale-95 flex items-center space-x-2"
                >
                    <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                    <span>Try Again</span>
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="px-1">
                    <h1 className="text-3xl sm:text-4xl font-black text-foreground font-outfit tracking-tight">
                        Appointments
                    </h1>
                    <p className="text-muted-foreground text-[11px] sm:text-sm font-medium mt-1 flex items-center space-x-2">
                        <Activity size={14} className="text-indigo-500" />
                        <span>Manage your clinical schedule</span>
                    </p>
                </div>
                <button
                    onClick={() => {
                        resetAppointmentForm();
                        setShowNewAppointmentModal(true);
                        fetchPatients();
                    }}
                    className="group flex items-center space-x-2 px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-[1.5rem] font-bold shadow-xl shadow-indigo-200 hover:shadow-indigo-300 transition-all hover:-translate-y-1 active:scale-95"
                >
                    <div className="p-1 bg-white/20 rounded-lg group-hover:rotate-90 transition-transform duration-300">
                        <Plus size={20} />
                    </div>
                    <span>New Appointment</span>
                </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {[
                    { label: "Today", value: stats?.todayAppointments || 0, icon: Clock, color: "indigo", bg: "bg-indigo-50", text: "text-indigo-600" },
                    { label: "This Week", value: stats?.weekAppointments || 0, icon: CalendarDays, color: "emerald", bg: "bg-emerald-50", text: "text-emerald-600" },
                    { label: "This Month", value: stats?.monthAppointments || 0, icon: TrendingUp, color: "amber", bg: "bg-amber-50", text: "text-amber-600" },
                    { label: "Pending", value: allAppointments.filter(apt => apt.status === 'pending').length, icon: AlertCircle, color: "rose", bg: "bg-rose-50", text: "text-rose-600" }
                ].map((stat, i) => (
                    <div key={i} className="group bg-card p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-border shadow-sm hover:shadow-xl hover:border-indigo-500/30 hover:-translate-y-1 transition-all duration-300 overflow-hidden relative">
                        <div className={`absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 ${stat.bg} rounded-bl-[4rem] opacity-20 transform translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform`}></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                                <div className={`p-2 sm:p-3 ${stat.bg} ${stat.text} rounded-xl sm:rounded-2xl group-hover:rotate-6 transition-transform`}>
                                    <stat.icon size={20} className="sm:w-6 sm:h-6" />
                                </div>
                                <span className="text-[10px] sm:text-xs font-bold text-muted-foreground tracking-tight leading-none">{stat.label}</span>
                            </div>
                            <h3 className="text-2xl sm:text-3xl font-black text-foreground mb-1">{stat.value}</h3>
                            <p className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Total Appointments</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search and Filters Bar */}
            <div className="bg-card/80 backdrop-blur-xl border border-border rounded-[1.5rem] sm:rounded-[2rem] p-3 sm:p-4 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 items-end">
                    <div className="lg:col-span-3 space-y-1 sm:space-y-1.5 px-1">
                        <label className="text-[10px] sm:text-[11px] font-bold text-slate-500 ml-1">Appointment Date</label>
                        <div className="relative group">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => {
                                    setSelectedDate(e.target.value);
                                    setViewMode('daily');
                                }}
                                className="w-full pl-12 pr-4 py-3 bg-muted/50 border border-border rounded-2xl text-sm font-bold focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-foreground"
                            />
                        </div>
                    </div>

                    <div className="lg:col-span-5 space-y-1 sm:space-y-1.5 px-0.5 sm:px-1">
                        <label className="text-[10px] sm:text-[11px] font-bold text-muted-foreground ml-1">Search Patients</label>
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-indigo-500 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Name, ID, or appointment notes..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-muted/50 border border-border rounded-2xl text-sm font-bold focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-foreground"
                            />
                        </div>
                    </div>

                    <div className="lg:col-span-3 space-y-1 sm:space-y-1.5 px-1">
                        <label className="text-[10px] sm:text-[11px] font-bold text-muted-foreground ml-1">Filter by Status</label>
                        <div className="relative group">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-indigo-500 transition-colors" size={18} />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-muted/50 border border-border rounded-2xl text-sm font-bold focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none appearance-none cursor-pointer text-foreground"
                            >
                                <option value="all">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                    </div>

                    <div className="lg:col-span-1 flex items-center justify-center pb-0.5">
                        <button
                            onClick={() => {
                                setSelectedDate(getLocalFormattedDate());
                                setSearchTerm('');
                                setStatusFilter('all');
                                setViewMode('daily');
                            }}
                            className="p-3.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all group"
                            title="Reset Filters"
                        >
                            <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                {/* Appointment List Section */}
                <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-slate-100 rounded-xl">
                                <CalendarDays size={18} className="text-slate-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-foreground tracking-tight">
                                    {viewMode === 'week'
                                        ? "Next 7 Days View"
                                        : selectedDate === getLocalFormattedDate()
                                            ? "Today's Schedule"
                                            : `Schedule for ${new Date(selectedDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}`
                                    }
                                </h3>
                                <p className="text-xs font-bold text-muted-foreground mt-1">
                                    {viewMode === 'week' ? "Upcoming appointments across the next week" : "Priority: Pending → Confirmed → Cancelled → Completed"}
                                </p>
                            </div>
                        </div>
                        <div className="flex bg-muted p-1 rounded-xl">
                            <span className="px-3 py-1 text-[10px] font-bold text-muted-foreground tracking-tight">
                                {filteredAppointments.length} Records
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar p-1">
                        {loading ? (
                            Array(3).fill(0).map((_, i) => <AppointmentSkeleton key={i} />)
                        ) : filteredAppointments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-muted/50 rounded-[3rem] border border-dashed border-border">
                                <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center shadow-sm mb-4 border border-border">
                                    <Calendar size={32} className="text-muted-foreground/20" />
                                </div>
                                <p className="text-muted-foreground font-medium text-xs mt-2">No appointments found</p>
                            </div>
                        ) : (
                            filteredAppointments.map((appointment) => (
                                <div
                                    key={appointment.id}
                                    className={`group flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-5 bg-card border border-border rounded-[1.5rem] sm:rounded-[2rem] hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-500/30 transition-all duration-300 gap-3 sm:gap-0 ${appointment.status === 'completed' ? 'opacity-80' : ''
                                        }`}
                                >
                                    <div className="flex items-center space-x-3 sm:space-x-5 flex-1 min-w-0">
                                        <div className="relative shrink-0">
                                            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center border font-outfit shadow-sm ${appointment.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                appointment.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    appointment.status === 'cancelled' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                        'bg-slate-50 text-slate-500 border-slate-200'
                                                }`}>
                                                <Clock size={16} className="mb-0.5" />
                                                <span className="text-xs font-black tracking-tighter">
                                                    {formatTime(appointment.appointment_time).split(' ')[0]}
                                                </span>
                                            </div>
                                            <div className="absolute -top-1 -right-1 w-3 h-3 border-2 border-white rounded-full shadow-sm" style={{
                                                backgroundColor:
                                                    appointment.status === 'pending' ? '#f59e0b' :
                                                        appointment.status === 'confirmed' ? '#10b981' :
                                                            appointment.status === 'cancelled' ? '#ef4444' : '#9ca3af'
                                            }}></div>
                                        </div>

                                        <div className="flex-1 min-w-0 pr-1 sm:pr-2">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-0.5 sm:mb-1 overflow-hidden">
                                                <h4 className={`text-xs sm:text-base font-black text-foreground tracking-tight truncate ${appointment.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                                                    {appointment.patient_first_name} {appointment.patient_last_name}
                                                </h4>
                                                <span className="px-1.5 sm:px-2 py-0.5 bg-muted rounded text-[9px] sm:text-[10px] font-bold text-muted-foreground truncate w-fit">
                                                    #{appointment.patient_unique_id}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <span className="flex items-center text-[11px] font-medium text-muted-foreground">
                                                    <Info size={12} className="mr-1 text-indigo-400" />
                                                    {appointment.appointment_type}
                                                </span>
                                                {appointment.notes && (
                                                    <span className="flex items-center text-[11px] font-bold text-muted-foreground truncate max-w-[200px]">
                                                        <FileText size={12} className="mr-1 text-muted-foreground/30" />
                                                        {appointment.notes}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-6 w-full sm:w-auto">
                                        <div className={`px-3 py-1.5 rounded-xl border text-[9px] sm:text-[10px] font-bold tracking-tight capitalize sm:hidden block ${getStatusStyle(appointment.status)}`}>
                                            {appointment.status}
                                        </div>
                                        <div className={`hidden sm:block px-3 sm:px-4 py-1.5 rounded-xl border text-[9px] sm:text-[10px] font-bold tracking-tight capitalize ${getStatusStyle(appointment.status)}`}>
                                            {appointment.status}
                                        </div>
                                        <div className="flex items-center transition-all">
                                            {getQuickActions(appointment)}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Column - Secondary Actions & Insights */}
                <div className="space-y-6 sm:space-y-8">
                    {/* Fast Navigation Panel */}
                    <div className="bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-[5rem]"></div>
                        <h3 className="text-xl font-black font-outfit tracking-tight mb-6 relative z-10 flex items-center space-x-2">
                            <Zap size={20} className="text-amber-400" />
                            <span>Quick Access</span>
                        </h3>
                        <div className="space-y-4 relative z-10">
                            {[
                                {
                                    label: "View Pending Only",
                                    sub: "Action required",
                                    action: () => {
                                        setSelectedDate(getLocalFormattedDate());
                                        setStatusFilter('pending');
                                        setSearchTerm('');
                                        setViewMode('daily');
                                    },
                                    icon: AlertCircle,
                                    color: "text-amber-400",
                                    bg: "bg-amber-400/10"
                                },
                                {
                                    label: "Tomorrow's List",
                                    sub: "Plan ahead",
                                    action: () => {
                                        const tom = new Date();
                                        tom.setDate(tom.getDate() + 1);
                                        setSelectedDate(getLocalFormattedDate(tom));
                                        setStatusFilter('all');
                                        setSearchTerm('');
                                        setViewMode('daily');
                                    },
                                    icon: Calendar,
                                    color: "text-indigo-400",
                                    bg: "bg-indigo-400/10"
                                },
                                {
                                    label: "Week View",
                                    sub: "Upcoming 7 days",
                                    action: () => {
                                        setViewMode('week');
                                        setStatusFilter('all');
                                        setSearchTerm('');
                                    },
                                    icon: CalendarDays,
                                    color: "text-emerald-400",
                                    bg: "bg-emerald-400/10"
                                }
                            ].map((btn, i) => (
                                <button
                                    key={i}
                                    onClick={btn.action}
                                    className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className={`p-2.5 ${btn.bg} ${btn.color} rounded-2xl transition-transform group-hover:rotate-6`}>
                                            <btn.icon size={20} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-bold tracking-tight">{btn.label}</p>
                                            <p className="text-[10px] font-medium text-white/40 leading-none mt-1">{btn.sub}</p>
                                        </div>
                                    </div>
                                    <ArrowRight size={16} className="text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Insights/Notice Card */}
                    <div className="bg-gradient-to-br from-indigo-50 to-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 border border-indigo-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/50 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-700"></div>

                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div className="flex items-center space-x-3">
                                <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
                                    <TrendingUp size={20} />
                                </div>
                                <h3 className="font-black text-slate-800 tracking-tight">Today's Insights</h3>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white px-2 py-1 rounded-lg border border-slate-100">Real-time</span>
                        </div>

                        <div className="space-y-6 relative z-10">
                            <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-indigo-50 shadow-sm">
                                <div className="flex items-center space-x-3">
                                    <div className="w-1.5 h-6 sm:h-8 bg-emerald-500 rounded-full"></div>
                                    <div>
                                        <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-tight">Confirmed</p>
                                        <p className="text-base sm:text-lg font-black text-slate-800">
                                            {allAppointments.filter(a => getLocalFormattedDate(new Date(a.appointment_date)) === getLocalFormattedDate() && a.status === 'confirmed').length}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <div className="w-1.5 h-6 sm:h-8 bg-amber-500 rounded-full"></div>
                                    <div>
                                        <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-tight">Pending</p>
                                        <p className="text-base sm:text-lg font-black text-slate-800">
                                            {allAppointments.filter(a => getLocalFormattedDate(new Date(a.appointment_date)) === getLocalFormattedDate() && a.status === 'pending').length}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <p className="text-slate-600 text-sm font-medium leading-relaxed bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
                                {allAppointments.filter(a => getLocalFormattedDate(new Date(a.appointment_date)) === getLocalFormattedDate() && a.status === 'pending').length > 0
                                    ? "Action suggested: Review and confirm your pending arrivals to optimize today's clinical flow."
                                    : "Excellent! Your schedule for today is fully confirmed. Focus on delivering great patient care."
                                }
                            </p>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between relative z-10">
                            <div className="flex items-center space-x-1 sm:space-x-2">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                            <User size={14} />
                                        </div>
                                    ))}
                                </div>
                                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 tracking-tight truncate max-w-[80px] sm:max-w-none">Clinical Team active</span>
                            </div>
                            <button
                                onClick={() => toast('Insights report generation coming soon!')}
                                className="p-2 text-indigo-600 hover:bg-white rounded-xl transition-all"
                            >
                                <ExternalLink size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Appointment Settings Section */}
            <div className="bg-card border border-border rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/4 group-hover:bg-indigo-500/10 transition-colors duration-700"></div>

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-border">
                        <div className="flex items-center space-x-3 sm:space-x-4">
                            <div className="p-2 sm:p-3 bg-indigo-500/10 text-indigo-500 rounded-xl sm:rounded-2xl">
                                <SettingsIcon size={20} className="sm:w-6 sm:h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg sm:text-xl font-black text-foreground tracking-tight">Practice Settings</h3>
                                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mt-1">Configure your scheduling preferences</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            {!settingsEditing ? (
                                <button
                                    onClick={() => setSettingsEditing(true)}
                                    className="flex items-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-indigo-600 text-white rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all hover:bg-indigo-700 hover:shadow-xl active:scale-95"
                                >
                                    <Edit3 size={16} className="sm:w-4 sm:h-4" />
                                    <span>Customize Preference</span>
                                </button>
                            ) : (
                                <div className="flex items-center space-x-2 sm:space-x-3 animate-in fade-in slide-in-from-right-4">
                                    <button
                                        onClick={handleCancelSettings}
                                        className="px-4 sm:px-6 py-2.5 sm:py-3 border border-border text-muted-foreground rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold hover:bg-muted transition-all font-outfit"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveSettings}
                                        className="flex items-center space-x-1 sm:space-x-2 px-4 sm:px-8 py-2.5 sm:py-3 bg-indigo-600 text-white rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all hover:bg-indigo-700 hover:shadow-xl shadow-indigo-500/20 active:scale-95"
                                    >
                                        <Check size={16} className="sm:w-4 sm:h-4" />
                                        <span>Apply Changes</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="space-y-2.5">
                            <label className="text-[11px] font-bold text-muted-foreground ml-1">Session Duration</label>
                            <select
                                className="w-full px-5 py-4 bg-muted/30 border border-border rounded-2xl text-sm font-bold focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none appearance-none cursor-pointer disabled:opacity-60 text-foreground"
                                value={tempSettings?.default_appointment_duration || 30}
                                onChange={(e) => setTempSettings({ ...tempSettings, default_appointment_duration: parseInt(e.target.value) })}
                                disabled={!settingsEditing}
                            >
                                <option value={15}>15 Minutes</option>
                                <option value={30}>30 Minutes</option>
                                <option value={45}>45 Minutes</option>
                                <option value={60}>1.0 Hour</option>
                            </select>
                        </div>

                        <div className="space-y-2.5">
                            <label className="text-[11px] font-bold text-muted-foreground ml-1">Start Time</label>
                            <div className="relative">
                                <Clock size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                                <input
                                    type="time"
                                    className="w-full pl-12 pr-5 py-4 bg-muted/30 border border-border rounded-2xl text-sm font-bold focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none disabled:opacity-60 text-foreground"
                                    value={tempSettings?.working_hours_start || '09:00'}
                                    onChange={(e) => setTempSettings({ ...tempSettings, working_hours_start: e.target.value })}
                                    disabled={!settingsEditing}
                                />
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            <label className="text-[11px] font-bold text-muted-foreground ml-1">End Time</label>
                            <div className="relative">
                                <Clock size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                                <input
                                    type="time"
                                    className="w-full pl-12 pr-5 py-4 bg-muted/30 border border-border rounded-2xl text-sm font-bold focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none disabled:opacity-60 text-foreground"
                                    value={tempSettings?.working_hours_end || '17:00'}
                                    onChange={(e) => setTempSettings({ ...tempSettings, working_hours_end: e.target.value })}
                                    disabled={!settingsEditing}
                                />
                            </div>
                        </div>

                        <div className="space-y-2 sm:space-y-2.5">
                            <label className="text-[10px] sm:text-[11px] font-bold text-muted-foreground ml-1">Consultation Fee</label>
                            <div className="relative">
                                <span className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-muted-foreground/50 font-bold text-base sm:text-lg select-none">৳</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="w-full pl-10 sm:pl-12 pr-4 sm:pr-5 py-3 sm:py-4 bg-muted/30 border border-border rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none disabled:opacity-60 text-foreground"
                                    value={tempSettings?.consultation_fee || 0}
                                    onChange={(e) => setTempSettings({ ...tempSettings, consultation_fee: parseFloat(e.target.value) })}
                                    disabled={!settingsEditing}
                                />
                            </div>
                        </div>

                        <div className="lg:col-span-4 flex items-center bg-muted/20 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border mt-2">
                            <div className="flex-1 pr-4">
                                <h4 className="text-sm sm:text-base font-black text-foreground tracking-tight">Accept New Patients</h4>
                                <p className="text-[9px] sm:text-[11px] font-bold text-muted-foreground max-w-xs leading-relaxed">Enable this to allow patients to find and book appointments with you through the public directory.</p>
                            </div>
                            <button
                                onClick={() => settingsEditing && setTempSettings({ ...tempSettings, accept_new_patients: !tempSettings?.accept_new_patients })}
                                disabled={!settingsEditing}
                                className={`relative inline-flex h-6 sm:h-8 w-11 sm:w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 ${tempSettings?.accept_new_patients ? 'bg-indigo-600' : 'bg-muted'
                                    }`}
                            >
                                <span className={`pointer-events-none inline-block h-4 sm:h-6 w-4 sm:w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${tempSettings?.accept_new_patients ? 'translate-x-5 sm:translate-x-6' : 'translate-x-0'
                                    }`} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals Strategy - Using a wrapper for professional feel */}
            {(showNewAppointmentModal || (showEditAppointmentModal && editingAppointment)) && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
                        onClick={() => { setShowNewAppointmentModal(false); setShowEditAppointmentModal(false); setEditingAppointment(null); resetAppointmentForm(); }}></div>

                    <div className="bg-card w-full max-w-lg rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 border border-border mx-2 sm:mx-0">
                        {/* Modal Header */}
                        <div className="p-6 sm:p-8 pb-4 flex items-center justify-between border-b border-border">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                                    {showNewAppointmentModal ? "New Appointment" : "Update Appointment"}
                                </h2>
                                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mt-1">
                                    {showNewAppointmentModal ? "Schedule a new clinical session" : "Modify existing schedule details"}
                                </p>
                            </div>
                            <button
                                onClick={() => { setShowNewAppointmentModal(false); setShowEditAppointmentModal(false); setEditingAppointment(null); resetAppointmentForm(); }}
                                className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-foreground"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={showNewAppointmentModal ? handleNewAppointment : handleEditAppointment} className="p-6 sm:p-8 space-y-4 sm:space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-muted-foreground ml-1">Select Patient</label>
                                <div className="relative">
                                    <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                                    <select
                                        value={showNewAppointmentModal ? appointmentForm.patient_id : editingAppointment.patient_id}
                                        onChange={(e) => showNewAppointmentModal
                                            ? setAppointmentForm({ ...appointmentForm, patient_id: e.target.value })
                                            : setEditingAppointment({ ...editingAppointment, patient_id: e.target.value })
                                        }
                                        className="w-full pl-10 sm:pl-12 pr-4 sm:pr-5 py-3 sm:py-4 bg-muted/50 border border-border rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none appearance-none cursor-pointer text-foreground"
                                        required
                                    >
                                        <option value="">Choose a registered patient</option>
                                        {patients.map((patient) => (
                                            <option key={patient.id} value={patient.id}>
                                                {patient.first_name} {patient.last_name} ({patient.unique_id})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-muted-foreground ml-1">Preferred Date</label>
                                    <div className="relative">
                                        <Calendar size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                                        <input
                                            type="date"
                                            value={appointmentForm.appointment_date}
                                            onChange={(e) => setAppointmentForm({ ...appointmentForm, appointment_date: e.target.value })}
                                            className="w-full pl-10 sm:pl-12 pr-4 sm:pr-5 py-3 sm:py-4 bg-muted/50 border border-border rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-foreground"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5 sm:space-y-2">
                                    <label className="text-[10px] sm:text-[11px] font-bold text-muted-foreground ml-1">Arrival Time</label>
                                    <div className="relative">
                                        <Clock size={16} className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                                        <input
                                            type="time"
                                            value={appointmentForm.appointment_time}
                                            onChange={(e) => setAppointmentForm({ ...appointmentForm, appointment_time: e.target.value })}
                                            className="w-full pl-10 sm:pl-12 pr-4 sm:pr-5 py-3 sm:py-4 bg-muted/50 border border-border rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-foreground"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-[10px] sm:text-[11px] font-bold text-muted-foreground ml-1">Appointment Category</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {["consultation", "follow-up", "check-up", "emergency", "procedure"].map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setAppointmentForm({ ...appointmentForm, appointment_type: type })}
                                            className={`px-3 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-bold transition-all border ${appointmentForm.appointment_type === type
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20 scale-[1.03]"
                                                : "bg-muted/50 text-muted-foreground border-border hover:border-indigo-500/30"
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-[10px] sm:text-[11px] font-bold text-muted-foreground ml-1">Clinical Notes (Optional)</label>
                                <textarea
                                    value={appointmentForm.notes}
                                    onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })}
                                    className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-muted/50 border border-border rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none resize-none min-h-[80px] sm:min-h-[100px] text-foreground"
                                    placeholder="Enter case summary or specialized requirements..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={actionLoading === 'create-appointment' || actionLoading === 'edit-appointment'}
                                className="w-full py-4 sm:py-5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-2xl sm:rounded-[1.5rem] text-sm sm:text-base font-bold tracking-tight shadow-2xl shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-2 sm:mt-4"
                            >
                                {actionLoading === 'create-appointment' || actionLoading === 'edit-appointment'
                                    ? <RefreshCw className="animate-spin mx-auto" size={24} />
                                    : (showNewAppointmentModal ? "Confirm Schedule" : "Save Changes")
                                }
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
});

export default AppointmentTab;

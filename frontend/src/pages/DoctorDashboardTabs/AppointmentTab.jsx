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
import * as dashboardCache from "../../lib/dashboardCache";


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

const AppointmentTab = memo(({ onSwitchTab }) => {
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
    const [patientSearch, setPatientSearch] = useState('');

    // Form states
    const [appointmentForm, setAppointmentForm] = useState({
        patient_id: '',
        appointment_date: new Date().toISOString().split('T')[0],
        appointment_time: '',
        appointment_type: 'consultation',
        notes: '',
        suggestions: ''
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
            // STEP 1: Load from cache INSTANTLY
            const cacheKey = `appointments_data_${doctorId}`;
            const cached = await dashboardCache.getCachedData(cacheKey);
            if (cached) {
                setAllAppointments(cached.appointments || []);
                setStats(cached.stats || null);
                setSettings(cached.settings || null);
                setTempSettings(cached.settings || null);
                setLoading(false); // Hide spinner if we have cache
            } else {
                setLoading(true);
            }

            const token = localStorage.getItem('authToken');

            if (!token) {
                if (!cached) throw new Error('Authentication required');
                return; // Use cache if offline/unauth
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

            const freshAppointments = appointmentsData.data || appointmentsData || [];
            const freshStats = statsData.data || statsData;
            const freshSettings = settingsData.data || settingsData;

            setAllAppointments(freshAppointments);
            setStats(freshStats);
            setSettings(freshSettings);
            setTempSettings(freshSettings);

            // STEP 2: Persist to cache
            await dashboardCache.saveData(cacheKey, {
                appointments: freshAppointments,
                stats: freshStats,
                settings: freshSettings
            });

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
            if (!doctorId) return;

            // STEP 1: Load from cache
            const cacheKey = `appointment_patients_${doctorId}`;
            const cached = await dashboardCache.getCachedData(cacheKey);
            if (cached) {
                setPatients(cached);
            }

            const token = localStorage.getItem('authToken');
            if (!token) return;

            const response = await fetch(API_URLS.PATIENTS.BY_DOCTOR(doctorId), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const patientsData = await response.json();
                const freshPatients = patientsData.data || patientsData || [];
                setPatients(freshPatients);

                // STEP 2: Persist to cache
                await dashboardCache.saveData(cacheKey, freshPatients);
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
            notes: '',
            suggestions: ''
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
            notes: appointment.notes || '',
            suggestions: appointment.suggestions || ''
        });
        setShowEditAppointmentModal(true);
    }, []);

    const getQuickActions = useCallback((appointment) => {
        if (appointment.status === 'completed' || appointment.status === 'cancelled') return null;

        return (
            <div className="flex items-center space-x-1">
                {appointment.status === 'pending' && (
                    <button
                        onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                        className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all border border-emerald-100"
                        title="Confirm appointment"
                    >
                        <Check size={13} />
                    </button>
                )}
                {appointment.status === 'confirmed' && (
                    <button
                        onClick={() => handleStatusChange(appointment.id, 'completed')}
                        className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-all border border-indigo-100"
                        title="Mark as completed"
                    >
                        <CheckCircle2 size={13} />
                    </button>
                )}
                <button
                    onClick={() => openEditModal(appointment)}
                    className="p-1.5 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg transition-all border border-slate-200"
                    title="Edit details"
                >
                    <Edit3 size={13} />
                </button>
                <button
                    onClick={() => handleCancelAppointment(appointment.id)}
                    className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-all border border-rose-100"
                    title="Cancel appointment"
                >
                    <XCircle size={13} />
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
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-100 rounded-xl">
                        <Activity className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">
                            Appointments
                        </h1>
                        <p className="text-muted-foreground text-xs mt-0.5">Manage your clinical schedule</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        resetAppointmentForm();
                        setShowNewAppointmentModal(true);
                        fetchPatients();
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 active:scale-95 transition-all shadow-sm"
                >
                    <Plus size={16} />
                    <span>New appointment</span>
                </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { label: "Today", value: stats?.todayAppointments || 0, icon: Clock, bg: "bg-indigo-50", text: "text-indigo-600" },
                    { label: "This week", value: stats?.weekAppointments || 0, icon: CalendarDays, bg: "bg-emerald-50", text: "text-emerald-600" },
                    { label: "This month", value: stats?.monthAppointments || 0, icon: TrendingUp, bg: "bg-amber-50", text: "text-amber-600" },
                    { label: "Pending", value: allAppointments.filter(apt => apt.status === 'pending').length, icon: AlertCircle, bg: "bg-rose-50", text: "text-rose-600" }
                ].map((stat, i) => (
                    <div key={i} className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-center gap-3">
                        <div className={`p-2 ${stat.bg} ${stat.text} rounded-lg shrink-0`}>
                            <stat.icon size={16} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-lg font-bold text-foreground leading-none">{stat.value}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search and Filters Bar */}
            <div className="bg-card border border-border rounded-xl p-3 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-2.5 items-end">
                    <div className="lg:col-span-3 space-y-1">
                        <label className="text-[10px] font-semibold text-muted-foreground ml-1">Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={14} />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => {
                                    setSelectedDate(e.target.value);
                                    setViewMode('daily');
                                }}
                                className="w-full pl-9 pr-3 py-2 bg-muted/50 border border-border rounded-lg text-xs font-medium focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-foreground"
                            />
                        </div>
                    </div>

                    <div className="lg:col-span-5 space-y-1">
                        <label className="text-[10px] font-semibold text-muted-foreground ml-1">Search patients</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={14} />
                            <input
                                type="text"
                                placeholder="Name, ID, or notes..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-muted/50 border border-border rounded-lg text-xs font-medium focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-foreground"
                            />
                        </div>
                    </div>

                    <div className="lg:col-span-3 space-y-1">
                        <label className="text-[10px] font-semibold text-muted-foreground ml-1">Status</label>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={14} />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-muted/50 border border-border rounded-lg text-xs font-medium focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none appearance-none cursor-pointer text-foreground"
                            >
                                <option value="all">All statuses</option>
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                    </div>

                    <div className="lg:col-span-1 flex items-center justify-center">
                        <button
                            onClick={() => {
                                setSelectedDate(getLocalFormattedDate());
                                setSearchTerm('');
                                setStatusFilter('all');
                                setViewMode('daily');
                            }}
                            className="p-2 text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Reset filters"
                        >
                            <RefreshCw size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Appointment List Section */}
                <div className="lg:col-span-2 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <CalendarDays size={16} className="text-muted-foreground" />
                            <div>
                                <h3 className="text-sm font-semibold text-foreground">
                                    {viewMode === 'week'
                                        ? "Next 7 days"
                                        : selectedDate === getLocalFormattedDate()
                                            ? "Today's schedule"
                                            : `Schedule for ${new Date(selectedDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}`
                                    }
                                </h3>
                                <p className="text-[10px] text-muted-foreground">
                                    {viewMode === 'week' ? "Upcoming appointments this week" : "Sorted by priority"}
                                </p>
                            </div>
                        </div>
                        <span className="px-2 py-1 bg-muted rounded-lg text-[10px] font-semibold text-muted-foreground">
                            {filteredAppointments.length} records
                        </span>
                    </div>

                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                        {loading ? (
                            Array(3).fill(0).map((_, i) => <AppointmentSkeleton key={i} />)
                        ) : filteredAppointments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
                                <Calendar size={28} className="text-muted-foreground/30 mb-2" />
                                <p className="text-muted-foreground text-xs">No appointments found</p>
                            </div>
                        ) : (
                            filteredAppointments.map((appointment) => (
                                <div
                                    key={appointment.id}
                                    className={`flex items-center justify-between p-3 bg-card border border-border rounded-xl hover:border-indigo-500/30 hover:shadow-sm transition-all gap-3 ${appointment.status === 'completed' ? 'opacity-70' : ''}`}
                                >
                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                        <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center border shrink-0 ${appointment.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                            appointment.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                appointment.status === 'cancelled' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                    'bg-slate-50 text-slate-500 border-slate-200'
                                            }`}>
                                            <Clock size={12} />
                                            <span className="text-[9px] font-bold">{formatTime(appointment.appointment_time).split(' ')[0]}</span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-1.5 mb-0.5">
                                                <h4 className={`text-sm font-semibold text-foreground truncate ${appointment.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                                                    {appointment.patient_first_name} {appointment.patient_last_name}
                                                </h4>
                                                <span className="px-1.5 py-0.5 bg-muted rounded text-[9px] font-medium text-muted-foreground shrink-0">
                                                    #{appointment.patient_unique_id}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className="flex items-center text-[10px] text-muted-foreground">
                                                    <Info size={10} className="mr-1 text-indigo-400" />
                                                    {appointment.appointment_type}
                                                </span>
                                                {appointment.notes && (
                                                    <span className="flex items-center text-[10px] text-muted-foreground truncate max-w-[150px]">
                                                        <FileText size={10} className="mr-1 opacity-40" />
                                                        {appointment.notes}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2 shrink-0">
                                        <div className={`px-2 py-1 rounded-lg border text-[9px] font-semibold capitalize ${getStatusStyle(appointment.status)}`}>
                                            {appointment.status}
                                        </div>
                                        {getQuickActions(appointment)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Column - Secondary Actions & Insights */}
                <div className="space-y-4">
                    {/* Fast Navigation Panel */}
                    <div className="bg-slate-900 rounded-xl p-4 text-white relative overflow-hidden shadow-lg">
                        <h3 className="text-sm font-semibold mb-3 flex items-center space-x-2">
                            <Zap size={14} className="text-amber-400" />
                            <span>Quick access</span>
                        </h3>
                        <div className="space-y-2">
                            {[
                                {
                                    label: "View pending only",
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
                                    label: "Tomorrow's list",
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
                                    label: "Week view",
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
                                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`p-1.5 ${btn.bg} ${btn.color} rounded-lg`}>
                                            <btn.icon size={14} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs font-semibold">{btn.label}</p>
                                            <p className="text-[10px] text-white/40 leading-none mt-0.5">{btn.sub}</p>
                                        </div>
                                    </div>
                                    <ArrowRight size={12} className="text-white/20 group-hover:text-white transition-colors" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Insights/Notice Card */}
                    <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                                <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                                    <TrendingUp size={14} />
                                </div>
                                <h3 className="text-sm font-semibold text-foreground">Today's insights</h3>
                            </div>
                            <span className="text-[9px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">Live</span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border mb-3">
                            <div className="flex items-center space-x-2">
                                <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
                                <div>
                                    <p className="text-[10px] text-muted-foreground">Confirmed</p>
                                    <p className="text-sm font-bold text-foreground">
                                        {allAppointments.filter(a => getLocalFormattedDate(new Date(a.appointment_date)) === getLocalFormattedDate() && a.status === 'confirmed').length}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-1 h-6 bg-amber-500 rounded-full"></div>
                                <div>
                                    <p className="text-[10px] text-muted-foreground">Pending</p>
                                    <p className="text-sm font-bold text-foreground">
                                        {allAppointments.filter(a => getLocalFormattedDate(new Date(a.appointment_date)) === getLocalFormattedDate() && a.status === 'pending').length}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed">
                            {allAppointments.filter(a => getLocalFormattedDate(new Date(a.appointment_date)) === getLocalFormattedDate() && a.status === 'pending').length > 0
                                ? "Review and confirm pending arrivals to optimize your schedule."
                                : "Schedule fully confirmed. Focus on delivering great patient care."
                            }
                        </p>
                    </div>
                </div>
            </div>

            {/* Appointment Settings Section */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-border">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
                            <SettingsIcon size={16} />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-foreground">Practice settings</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Configure your scheduling preferences</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        {!settingsEditing ? (
                            <button
                                onClick={() => setSettingsEditing(true)}
                                className="flex items-center space-x-2 px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold transition-all hover:bg-indigo-700 active:scale-95"
                            >
                                <Edit3 size={13} />
                                <span>Edit settings</span>
                            </button>
                        ) : (
                            <div className="flex items-center space-x-2 animate-in fade-in">
                                <button
                                    onClick={handleCancelSettings}
                                    className="px-3 py-2 border border-border text-muted-foreground rounded-lg text-xs font-medium hover:bg-muted transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveSettings}
                                    className="flex items-center space-x-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold transition-all hover:bg-indigo-700 active:scale-95"
                                >
                                    <Check size={13} />
                                    <span>Save changes</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-muted-foreground ml-1">Session duration</label>
                        <select
                            className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-xs font-medium focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none appearance-none cursor-pointer disabled:opacity-60 text-foreground"
                            value={tempSettings?.default_appointment_duration || 30}
                            onChange={(e) => setTempSettings({ ...tempSettings, default_appointment_duration: parseInt(e.target.value) })}
                            disabled={!settingsEditing}
                        >
                            <option value={15}>15 minutes</option>
                            <option value={30}>30 minutes</option>
                            <option value={45}>45 minutes</option>
                            <option value={60}>1 hour</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-muted-foreground ml-1">Start time</label>
                        <div className="relative">
                            <Clock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                            <input
                                type="time"
                                className="w-full pl-8 pr-3 py-2 bg-muted/30 border border-border rounded-lg text-xs font-medium focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none disabled:opacity-60 text-foreground"
                                value={tempSettings?.working_hours_start || '09:00'}
                                onChange={(e) => setTempSettings({ ...tempSettings, working_hours_start: e.target.value })}
                                disabled={!settingsEditing}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-muted-foreground ml-1">End time</label>
                        <div className="relative">
                            <Clock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                            <input
                                type="time"
                                className="w-full pl-8 pr-3 py-2 bg-muted/30 border border-border rounded-lg text-xs font-medium focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none disabled:opacity-60 text-foreground"
                                value={tempSettings?.working_hours_end || '17:00'}
                                onChange={(e) => setTempSettings({ ...tempSettings, working_hours_end: e.target.value })}
                                disabled={!settingsEditing}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-muted-foreground ml-1">Consultation fee</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 font-medium text-sm select-none">৳</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="w-full pl-7 pr-3 py-2 bg-muted/30 border border-border rounded-lg text-xs font-medium focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none disabled:opacity-60 text-foreground"
                                value={tempSettings?.consultation_fee || 0}
                                onChange={(e) => setTempSettings({ ...tempSettings, consultation_fee: parseFloat(e.target.value) })}
                                disabled={!settingsEditing}
                            />
                        </div>
                    </div>

                    <div className="lg:col-span-4 flex items-center bg-muted/20 p-3 rounded-lg border border-border">
                        <div className="flex-1 pr-4">
                            <h4 className="text-xs font-semibold text-foreground">Accept new patients</h4>
                            <p className="text-[10px] text-muted-foreground mt-0.5 max-w-xs">Allow patients to find and book appointments through the directory.</p>
                        </div>
                        <button
                            onClick={() => settingsEditing && setTempSettings({ ...tempSettings, accept_new_patients: !tempSettings?.accept_new_patients })}
                            disabled={!settingsEditing}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 ${tempSettings?.accept_new_patients ? 'bg-indigo-600' : 'bg-muted'}`}
                        >
                            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${tempSettings?.accept_new_patients ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {(showNewAppointmentModal || (showEditAppointmentModal && editingAppointment)) && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
                        onClick={() => { setShowNewAppointmentModal(false); setShowEditAppointmentModal(false); setEditingAppointment(null); resetAppointmentForm(); }}></div>

                    <div className="bg-card/95 backdrop-blur-xl w-full max-w-md rounded-xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 border border-border/50 mx-3 p-0">
                        {/* Modal Header */}
                        <div className="p-3 pb-2 flex items-center justify-between border-b border-border/50">
                            <div>
                                <h2 className="text-sm font-semibold text-foreground">
                                    {showNewAppointmentModal ? "New appointment" : "Update appointment"}
                                </h2>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {showNewAppointmentModal ? "Schedule a new clinical session" : "Modify existing schedule details"}
                                </p>
                            </div>
                            <button
                                onClick={() => { setShowNewAppointmentModal(false); setShowEditAppointmentModal(false); setEditingAppointment(null); resetAppointmentForm(); }}
                                className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={showNewAppointmentModal ? handleNewAppointment : handleEditAppointment} className="p-4 sm:p-5 space-y-2.5 sm:space-y-3.5 max-h-[75vh] overflow-y-auto custom-scrollbar">
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-muted-foreground ml-1">Select Patient</label>

                                {/* Search Input */}
                                <div className="relative">
                                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 z-10 pointer-events-none" />
                                    <input
                                        type="text"
                                        placeholder="Search by name or ID..."
                                        value={patientSearch}
                                        onChange={(e) => setPatientSearch(e.target.value)}
                                        className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-muted/50 border border-border rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-foreground"
                                    />
                                </div>


                                {/* Filtered Patient List - Only show when search has text */}
                                {patientSearch && (
                                    <>
                                        {patients.filter(p =>
                                            `${p.first_name} ${p.last_name} ${p.unique_id}`.toLowerCase().includes(patientSearch.toLowerCase())
                                        ).length === 0 ? (
                                            // No patients found message
                                            <div className="bg-amber-50 border border-amber-200 rounded-xl sm:rounded-2xl p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                                <div className="flex items-start space-x-3">
                                                    <div className="p-2 bg-amber-100 rounded-lg shrink-0">
                                                        <AlertCircle size={20} className="text-amber-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="text-sm font-bold text-amber-900 mb-1">Patient Not Found</h4>
                                                        <p className="text-xs text-amber-700 leading-relaxed mb-3">
                                                            No patient matches "<span className="font-bold">{patientSearch}</span>". Please register the patient first.
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setShowNewAppointmentModal(false);
                                                                setShowEditAppointmentModal(false);
                                                                setPatientSearch('');
                                                                if (onSwitchTab) {
                                                                    onSwitchTab('patients');
                                                                }
                                                                toast('Switched to Patient tab. Register the new patient here.', {
                                                                    icon: '👤',
                                                                    duration: 4000
                                                                });
                                                            }}
                                                            className="flex items-center space-x-2 px-3 py-2 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-all"
                                                        >
                                                            <Users size={14} />
                                                            <span>Go to Patient Tab</span>
                                                            <ArrowRight size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            // Patient list dropdown
                                            <div className="relative animate-in fade-in slide-in-from-top-2 duration-200">
                                                <User size={16} className="absolute left-4 top-3 text-muted-foreground/50 z-10 pointer-events-none" />
                                                <select
                                                    value={showNewAppointmentModal ? appointmentForm.patient_id : editingAppointment.patient_id}
                                                    onChange={(e) => {
                                                        if (showNewAppointmentModal) {
                                                            setAppointmentForm({ ...appointmentForm, patient_id: e.target.value });
                                                        } else {
                                                            setEditingAppointment({ ...editingAppointment, patient_id: e.target.value });
                                                        }
                                                    }}
                                                    size="4"
                                                    className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-1.5 bg-muted/50 border border-border rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none cursor-pointer text-foreground overflow-y-auto custom-scrollbar"
                                                >
                                                    <option value="" disabled>Choose from filtered results</option>
                                                    {patients
                                                        .filter(patient =>
                                                            `${patient.first_name} ${patient.last_name} ${patient.unique_id}`.toLowerCase().includes(patientSearch.toLowerCase())
                                                        )
                                                        .map((patient) => (
                                                            <option key={patient.id} value={patient.id} className="py-2">
                                                                {patient.first_name} {patient.last_name} ({patient.unique_id})
                                                            </option>
                                                        ))
                                                    }
                                                </select>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Hidden input to satisfy form required validation */}
                                <input
                                    type="hidden"
                                    value={showNewAppointmentModal ? appointmentForm.patient_id : editingAppointment.patient_id}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-muted-foreground ml-1">Preferred Date</label>
                                    <div className="relative">
                                        <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                                        <input
                                            type="date"
                                            value={appointmentForm.appointment_date}
                                            onChange={(e) => setAppointmentForm({ ...appointmentForm, appointment_date: e.target.value })}
                                            className="w-full pl-8 sm:pl-9 pr-3 py-1.5 sm:py-2 bg-muted/50 border border-border rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-bold focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-foreground"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-muted-foreground ml-1">Arrival Time</label>
                                    <div className="relative">
                                        <Clock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                                        <input
                                            type="time"
                                            value={appointmentForm.appointment_time}
                                            onChange={(e) => setAppointmentForm({ ...appointmentForm, appointment_time: e.target.value })}
                                            className="w-full pl-8 sm:pl-9 pr-3 py-1.5 sm:py-2 bg-muted/50 border border-border rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-bold focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-foreground"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-muted-foreground ml-1">Appointment Category</label>
                                <div className="relative group">
                                    <Activity className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-indigo-500 transition-colors" size={14} />
                                    <select
                                        value={appointmentForm.appointment_type}
                                        onChange={(e) => setAppointmentForm({ ...appointmentForm, appointment_type: e.target.value })}
                                        className="w-full pl-8 sm:pl-9 pr-3 py-1.5 sm:py-2 bg-muted/50 border border-border rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-bold focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none appearance-none cursor-pointer text-foreground"
                                    >
                                        <option value="consultation">Consultation</option>
                                        <option value="follow-up">Follow-up</option>
                                        <option value="check-up">Check-up</option>
                                        <option value="emergency">Emergency</option>
                                        <option value="procedure">Procedure</option>
                                    </select>
                                    <ChevronRight className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 rotate-90" size={12} />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-muted-foreground ml-1">Clinical Notes (Optional)</label>
                                <textarea
                                    value={appointmentForm.notes}
                                    onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })}
                                    className="w-full px-3 sm:px-4 py-1.5 sm:py-2 bg-muted/50 border border-border rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-bold focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none resize-none min-h-[40px] sm:min-h-[45px] text-foreground"
                                    placeholder="Enter case summary..."
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-indigo-500 ml-1 flex items-center">
                                    <Zap size={9} className="mr-1" /> Doctor's Advice
                                </label>
                                <textarea
                                    value={appointmentForm.suggestions}
                                    onChange={(e) => setAppointmentForm({ ...appointmentForm, suggestions: e.target.value })}
                                    className="w-full px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-500/5 border border-indigo-500/10 rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-bold focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none resize-none min-h-[40px] sm:min-h-[45px] text-foreground placeholder:text-indigo-400/30"
                                    placeholder="Enter professional advice..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={actionLoading === 'create-appointment' || actionLoading === 'edit-appointment'}
                                className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold tracking-tight shadow-2xl shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-1 sm:mt-2"
                            >
                                {actionLoading === 'create-appointment' || actionLoading === 'edit-appointment'
                                    ? <RefreshCw className="animate-spin mx-auto" size={20} />
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

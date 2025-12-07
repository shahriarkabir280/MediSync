import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { API_URLS } from "../../config/api";

const AppointmentTab = () => {
    const { user } = useAuth();
    const doctorId = user?.id;
    const [appointments, setAppointments] = useState([]);
    const [allAppointments, setAllAppointments] = useState([]);
    const [patients, setPatients] = useState([]);
    const [stats, setStats] = useState(null);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(null); // Track which action is loading
    
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
    
    // Doctor ID from authentication context
    // Now using authenticated doctor ID instead of hardcoded value

    // Memoized filtered and sorted appointments to prevent unnecessary re-renders
    const filteredAppointments = useMemo(() => {
        let filtered = allAppointments;
        
        // Filter by date
        if (selectedDate) {
            filtered = filtered.filter(apt => {
                const appointmentDate = new Date(apt.appointment_date).toISOString().split('T')[0];
                return appointmentDate === selectedDate;
            });
        }
        
        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(apt => 
                `${apt.patient_first_name} ${apt.patient_last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                apt.appointment_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (apt.patient_unique_id && apt.patient_unique_id.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
        
        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(apt => apt.status === statusFilter);
        }
        
        // Sort appointments by priority: pending -> confirmed -> cancelled -> completed
        const statusPriority = {
            'pending': 1,
            'confirmed': 2,
            'cancelled': 3,
            'completed': 4
        };
        
        filtered.sort((a, b) => {
            // First sort by status priority
            const priorityDiff = (statusPriority[a.status] || 5) - (statusPriority[b.status] || 5);
            if (priorityDiff !== 0) return priorityDiff;
            
            // Then sort by appointment time within same status
            return a.appointment_time.localeCompare(b.appointment_time);
        });
        
        return filtered;
    }, [allAppointments, selectedDate, searchTerm, statusFilter]);

    // Update appointments when filtered appointments change
    useEffect(() => {
        setAppointments(filteredAppointments);
    }, [filteredAppointments]);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');
            
            if (!doctorId || !token) {
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
            setError(null); // Clear any previous errors
        } catch (err) {
            console.error('Error creating appointment:', err);
            setError(err.message);
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
            setError(null); // Clear any previous errors
        } catch (err) {
            setError(err.message);
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
                
                // Update appointment status in local state instead of full reload
                setAllAppointments(prev => 
                    prev.map(apt => 
                        apt.id === appointmentId 
                            ? { ...apt, status: 'cancelled' }
                            : apt
                    )
                );
            } catch (err) {
                setError(err.message);
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
            
            // Update appointment status in local state instead of full reload
            setAllAppointments(prev => 
                prev.map(apt => 
                    apt.id === appointmentId 
                        ? { ...apt, status: newStatus }
                        : apt
                )
            );
        } catch (err) {
            setError(err.message);
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
        const actions = [];
        
        if (appointment.status === 'pending') {
            actions.push(
                <button
                    key="confirm"
                    onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                    className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                >
                    Confirm
                </button>
            );
        }
        
        if (appointment.status === 'confirmed') {
            actions.push(
                <button
                    key="complete"
                    onClick={() => handleStatusChange(appointment.id, 'completed')}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                    Complete
                </button>
            );
        }
        
        
        return actions;
    }, [handleStatusChange]);

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
                return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
            case 'confirmed':
                return 'bg-green-100 text-green-800 border border-green-200';
            case 'cancelled':
                return 'bg-red-100 text-red-800 border border-red-200';
            case 'completed':
                return 'bg-gray-100 text-gray-600 border border-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 border border-gray-200';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-lg">Loading appointments...</p>
                    <div className="mt-2 animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-red-600 mb-2">Error loading appointments</p>
                    <p className="text-sm text-gray-600">{error}</p>
                    <button 
                        onClick={fetchData}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">Appointments</h1>
                    <p className="text-muted-foreground">Manage patient appointments and scheduling.</p>
                </div>
                <button 
                    onClick={() => {
                        console.log('Opening new appointment modal');
                        resetAppointmentForm();
                        setShowNewAppointmentModal(true);
                        fetchPatients(); // Ensure patients are loaded
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                    New Appointment
                </button>
            </div>

            {/* Filters and Search */}
            <div className="bg-card border border-border rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Date</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full p-2 border border-input rounded-md bg-background"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Search</label>
                        <input
                            type="text"
                            placeholder="Search by patient name, unique ID, or type..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-2 border border-input rounded-md bg-background"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full p-2 border border-input rounded-md bg-background"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={() => {
                                setSelectedDate(new Date().toISOString().split('T')[0]);
                                setSearchTerm('');
                                setStatusFilter('all');
                            }}
                            className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
                        >
                            Reset Filters
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="grid gap-6">
                {/* Appointments List */}
                <div className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold">
                                {selectedDate === new Date().toISOString().split('T')[0] 
                                    ? "Today's Appointments" 
                                    : `Appointments for ${new Date(selectedDate).toLocaleDateString()}`
                                }
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Sorted by priority: Pending → Confirmed → Cancelled → Completed
                            </p>
                        </div>
                        <span className="text-sm text-muted-foreground">
                            {appointments.length} appointment{appointments.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                    <div className="max-h-96 overflow-y-auto space-y-3">
                        {appointments.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                                {searchTerm || statusFilter !== 'all' 
                                    ? 'No appointments match your filters' 
                                    : 'No appointments for this date'
                                }
                            </p>
                        ) : (
                            appointments.map((appointment) => (
                                <div 
                                    key={appointment.id} 
                                    className={`flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors ${
                                        appointment.status === 'completed' ? 'opacity-60 bg-gray-50' : ''
                                    }`}
                                >
                                    <div className="flex items-center space-x-4">
                                        {/* Priority Indicator */}
                                        <div className="w-2 h-8 rounded-full mr-1" style={{
                                            backgroundColor: 
                                                appointment.status === 'pending' ? '#f59e0b' :
                                                appointment.status === 'confirmed' ? '#10b981' :
                                                appointment.status === 'cancelled' ? '#ef4444' :
                                                appointment.status === 'completed' ? '#6b7280' : '#9ca3af'
                                        }}></div>
                                        <div className="text-sm font-medium text-blue-600 min-w-[80px]">
                                            {formatTime(appointment.appointment_time)}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`font-medium ${appointment.status === 'completed' ? 'line-through text-gray-600' : ''}`}>
                                                {appointment.patient_first_name} {appointment.patient_last_name}
                                                <span className="ml-2 text-xs text-muted-foreground">
                                                    ({appointment.patient_unique_id})
                                                </span>
                                            </p>
                                            <p className="text-sm text-muted-foreground capitalize">
                                                {appointment.appointment_type}
                                                {appointment.notes && ` • ${appointment.notes.substring(0, 50)}${appointment.notes.length > 50 ? '...' : ''}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <span className={`px-3 py-1 text-xs rounded-full capitalize ${getStatusStyle(appointment.status)}`}>
                                            {appointment.status}
                                        </span>
                                        <div className="flex space-x-2">
                                            {getQuickActions(appointment).map(action => action)}
                                            <button 
                                                onClick={() => openEditModal(appointment)}
                                                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                            >
                                                Edit
                                            </button>
                                            {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                                                <button 
                                                    onClick={() => handleCancelAppointment(appointment.id)}
                                                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Quick Actions Panel */}
                <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <button
                            onClick={() => {
                                setSelectedDate(new Date().toISOString().split('T')[0]);
                                setStatusFilter('pending');
                            }}
                            className="px-4 py-2 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors text-sm"
                        >
                            View Pending
                        </button>
                        <button
                            onClick={() => {
                                const tomorrow = new Date();
                                tomorrow.setDate(tomorrow.getDate() + 1);
                                setSelectedDate(tomorrow.toISOString().split('T')[0]);
                                setStatusFilter('all');
                            }}
                            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
                        >
                            Tomorrow
                        </button>
                        <button
                            onClick={() => {
                                const nextWeek = new Date();
                                nextWeek.setDate(nextWeek.getDate() + 7);
                                setSelectedDate(nextWeek.toISOString().split('T')[0]);
                                setStatusFilter('all');
                            }}
                            className="px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors text-sm"
                        >
                            Next Week
                        </button>
                        <button
                            onClick={() => setShowNewAppointmentModal(true)}
                            className="px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm"
                        >
                            + New Appointment
                        </button>
                    </div>
                </div>

                {/* Appointment Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-card border border-border rounded-lg p-4">
                        <h4 className="font-medium text-muted-foreground mb-2">Today</h4>
                        <p className="text-2xl font-bold text-blue-600">{stats?.todayAppointments || 0}</p>
                        <p className="text-sm text-muted-foreground">Today's appointments</p>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-4">
                        <h4 className="font-medium text-muted-foreground mb-2">This Week</h4>
                        <p className="text-2xl font-bold text-green-600">{stats?.weekAppointments || 0}</p>
                        <p className="text-sm text-muted-foreground">This week's total</p>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-4">
                        <h4 className="font-medium text-muted-foreground mb-2">This Month</h4>
                        <p className="text-2xl font-bold text-purple-600">{stats?.monthAppointments || 0}</p>
                        <p className="text-sm text-muted-foreground">Monthly total</p>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-4">
                        <h4 className="font-medium text-muted-foreground mb-2">Pending</h4>
                        <p className="text-2xl font-bold text-orange-600">
                            {allAppointments.filter(apt => apt.status === 'pending').length}
                        </p>
                        <p className="text-sm text-muted-foreground">Awaiting confirmation</p>
                    </div>
                </div>

                {/* Appointment Settings */}
                <div className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Appointment Settings</h3>
                        {!settingsEditing ? (
                            <button
                                onClick={() => setSettingsEditing(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Edit Settings
                            </button>
                        ) : (
                            <div className="space-x-2">
                                <button
                                    onClick={handleSaveSettings}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                >
                                    Save Changes
                                </button>
                                <button
                                    onClick={handleCancelSettings}
                                    className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Default Appointment Duration</label>
                            <select 
                                className="w-full p-2 border border-input rounded-md bg-background"
                                value={tempSettings?.default_appointment_duration || 30}
                                onChange={(e) => setTempSettings({...tempSettings, default_appointment_duration: parseInt(e.target.value)})}
                                disabled={!settingsEditing}
                            >
                                <option value={15}>15 minutes</option>
                                <option value={30}>30 minutes</option>
                                <option value={45}>45 minutes</option>
                                <option value={60}>1 hour</option>
                                <option value={90}>1.5 hours</option>
                                <option value={120}>2 hours</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Working Hours Start</label>
                            <input
                                type="time"
                                className="w-full p-2 border border-input rounded-md bg-background"
                                value={tempSettings?.working_hours_start || '09:00'}
                                onChange={(e) => setTempSettings({...tempSettings, working_hours_start: e.target.value})}
                                disabled={!settingsEditing}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Working Hours End</label>
                            <input
                                type="time"
                                className="w-full p-2 border border-input rounded-md bg-background"
                                value={tempSettings?.working_hours_end || '17:00'}
                                onChange={(e) => setTempSettings({...tempSettings, working_hours_end: e.target.value})}
                                disabled={!settingsEditing}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Consultation Fee ($)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="w-full p-2 border border-input rounded-md bg-background"
                                value={tempSettings?.consultation_fee || 0}
                                onChange={(e) => setTempSettings({...tempSettings, consultation_fee: parseFloat(e.target.value)})}
                                disabled={!settingsEditing}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="acceptNewPatients"
                                checked={tempSettings?.accept_new_patients || false}
                                onChange={(e) => setTempSettings({...tempSettings, accept_new_patients: e.target.checked})}
                                disabled={!settingsEditing}
                                className="rounded"
                            />
                            <label htmlFor="acceptNewPatients" className="text-sm font-medium">
                                Accept New Patients
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* New Appointment Modal */}
            {showNewAppointmentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <h2 className="text-xl font-bold mb-4">New Appointment</h2>
                        {error && (
                            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700">
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleNewAppointment} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Patient</label>
                                <select
                                    value={appointmentForm.patient_id}
                                    onChange={(e) => setAppointmentForm({...appointmentForm, patient_id: e.target.value})}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    required
                                >
                                    <option value="">Select a patient</option>
                                    {patients.map((patient) => (
                                        <option key={patient.id} value={patient.id}>
                                            {patient.first_name} {patient.last_name} ({patient.unique_id})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Date</label>
                                <input
                                    type="date"
                                    value={appointmentForm.appointment_date}
                                    onChange={(e) => setAppointmentForm({...appointmentForm, appointment_date: e.target.value})}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Time</label>
                                <input
                                    type="time"
                                    value={appointmentForm.appointment_time}
                                    onChange={(e) => setAppointmentForm({...appointmentForm, appointment_time: e.target.value})}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Type</label>
                                <select
                                    value={appointmentForm.appointment_type}
                                    onChange={(e) => setAppointmentForm({...appointmentForm, appointment_type: e.target.value})}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                >
                                    <option value="consultation">Consultation</option>
                                    <option value="follow-up">Follow-up</option>
                                    <option value="check-up">Check-up</option>
                                    <option value="emergency">Emergency</option>
                                    <option value="procedure">Procedure</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Notes</label>
                                <textarea
                                    value={appointmentForm.notes}
                                    onChange={(e) => setAppointmentForm({...appointmentForm, notes: e.target.value})}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    rows="3"
                                    placeholder="Additional notes..."
                                />
                            </div>
                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={actionLoading === 'create-appointment'}
                                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {actionLoading === 'create-appointment' ? 'Creating...' : 'Create Appointment'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowNewAppointmentModal(false);
                                        resetAppointmentForm();
                                    }}
                                    className="flex-1 border border-gray-300 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Appointment Modal */}
            {showEditAppointmentModal && editingAppointment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <h2 className="text-xl font-bold mb-4">Edit Appointment</h2>
                        <form onSubmit={handleEditAppointment} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Patient</label>
                                <select
                                    value={editingAppointment.patient_id}
                                    onChange={(e) => setEditingAppointment({...editingAppointment, patient_id: e.target.value})}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    required
                                >
                                    <option value="">Select a patient</option>
                                    {patients.map((patient) => (
                                        <option key={patient.id} value={patient.id}>
                                            {patient.first_name} {patient.last_name} ({patient.unique_id})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Date</label>
                                <input
                                    type="date"
                                    value={appointmentForm.appointment_date}
                                    onChange={(e) => setAppointmentForm({...appointmentForm, appointment_date: e.target.value})}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Time</label>
                                <input
                                    type="time"
                                    value={appointmentForm.appointment_time}
                                    onChange={(e) => setAppointmentForm({...appointmentForm, appointment_time: e.target.value})}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Type</label>
                                <select
                                    value={appointmentForm.appointment_type}
                                    onChange={(e) => setAppointmentForm({...appointmentForm, appointment_type: e.target.value})}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                >
                                    <option value="consultation">Consultation</option>
                                    <option value="follow-up">Follow-up</option>
                                    <option value="check-up">Check-up</option>
                                    <option value="emergency">Emergency</option>
                                    <option value="procedure">Procedure</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Notes</label>
                                <textarea
                                    value={appointmentForm.notes}
                                    onChange={(e) => setAppointmentForm({...appointmentForm, notes: e.target.value})}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    rows="3"
                                    placeholder="Additional notes..."
                                />
                            </div>
                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    Update Appointment
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditAppointmentModal(false);
                                        setEditingAppointment(null);
                                        resetAppointmentForm();
                                    }}
                                    className="flex-1 border border-gray-300 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppointmentTab;
import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { patientApi, appointmentApi } from "../../lib/api";
import { API_CONFIG } from "../../config/api";
import { useDoctor } from "../../hooks/useDoctor";
import {
    User, Phone, Mail, Calendar, Heart, AlertCircle, Plus, Edit2, Edit, Eye, X, Save,
    FileText, Clock, Trash2, Stethoscope, Pill, ClipboardList, UserCircle, Search,
    Users, Activity, Filter, ChevronRight, ArrowRight, ExternalLink, TrendingUp, Zap,
    MoreHorizontal, Download, Share2, Shield, Info, MapPin
} from "lucide-react";
import { toast } from "react-hot-toast";
import { debounce } from "../../utils/performance";

// Helper components for a more modern UI
const PatientSkeleton = () => (
    <div className="flex items-center justify-between p-6 bg-card border border-border rounded-[2.5rem] animate-pulse">
        <div className="flex items-center space-x-5 flex-1">
            <div className="w-16 h-16 bg-muted rounded-[2rem]"></div>
            <div className="space-y-3 flex-1">
                <div className="h-4 bg-muted rounded-full w-48"></div>
                <div className="flex space-x-3">
                    <div className="h-3 bg-muted/50 rounded-full w-24"></div>
                    <div className="h-3 bg-muted/50 rounded-full w-24"></div>
                </div>
            </div>
        </div>
        <div className="w-24 h-10 bg-muted/50 rounded-2xl"></div>
    </div>
);

const StatCard = ({ icon: Icon, label, value, subLabel, color }) => (
    <div className="bg-card p-6 rounded-[2.5rem] border border-border shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 group">
        <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-2xl ${color} bg-opacity-10 transition-transform group-hover:scale-110 duration-500`}>
                <Icon size={24} className={color.replace('bg-', 'text-')} />
            </div>
            <div className="flex bg-muted px-2 py-1 rounded-lg border border-border">
                <Activity size={12} className="text-muted-foreground mr-1" />
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Active</span>
            </div>
        </div>
        <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{label}</h4>
        <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-foreground tracking-tighter">{value}</span>
            <span className="text-[10px] font-bold text-muted-foreground">{subLabel}</span>
        </div>
    </div>
);

const PatientTab = memo(() => {
    const { doctorId } = useDoctor();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionLoading, setActionLoading] = useState(null);
    const [appointmentLoading, setAppointmentLoading] = useState(false);

    // Modal states
    const [showNewPatientModal, setShowNewPatientModal] = useState(false);
    const [showEditPatientModal, setShowEditPatientModal] = useState(false);
    const [showPatientModal, setShowPatientModal] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [patientDetails, setPatientDetails] = useState(null);
    const [patientAppointments, setPatientAppointments] = useState([]);
    const [medicalRecords, setMedicalRecords] = useState([]);
    const [medicalHistory, setMedicalHistory] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [activeDetailsTab, setActiveDetailsTab] = useState('profile');
    const [uploadingFile, setUploadingFile] = useState(null);
    const [showFileUpload, setShowFileUpload] = useState(false);

    // Form state
    const [patientForm, setPatientForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        gender: '',
        blood_group: '',
        address: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        medical_history: '',
        allergies: ''
    });

    // Edit form state
    const [editForm, setEditForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        gender: '',
        blood_group: '',
        address: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        medical_history: '',
        allergies: ''
    });

    useEffect(() => {
        fetchPatients();
    }, [doctorId]);

    const fetchPatients = useCallback(async () => {
        if (!doctorId) return;
        try {
            setLoading(true);
            const data = await patientApi.getAll(doctorId);
            setPatients(data.data || []);
            setError(null);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching patients:', err);
        } finally {
            setLoading(false);
        }
    }, [doctorId]);

    const filteredPatients = useMemo(() => {
        if (!searchTerm) return patients;
        const lowerSearch = searchTerm.toLowerCase();
        return patients.filter(patient =>
            `${patient.first_name || ''} ${patient.last_name || ''}`.toLowerCase().includes(lowerSearch) ||
            (patient.email || '').toLowerCase().includes(lowerSearch) ||
            (patient.unique_id || '').toLowerCase().includes(lowerSearch) ||
            (patient.phone || '').includes(lowerSearch)
        );
    }, [patients, searchTerm]);

    // Calculate dynamic stats for the dashboard
    const patientStats = useMemo(() => {
        const total = patients.length;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const newThisMonth = patients.filter(p => p.created_at && new Date(p.created_at) > thirtyDaysAgo).length;
        const activePatients = patients.filter(p => (p.total_appointments || 0) > 0).length;

        return { total, newThisMonth, activePatients };
    }, [patients]);

    const resetPatientForm = useCallback(() => {
        setPatientForm({
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            date_of_birth: '',
            gender: '',
            blood_group: '',
            address: '',
            emergency_contact_name: '',
            emergency_contact_phone: '',
            medical_history: '',
            allergies: ''
        });
    }, []);

    const handleCreatePatient = useCallback(async (e) => {
        e.preventDefault();
        setActionLoading('create-patient');

        try {
            const result = await patientApi.create(patientForm);

            // Add new patient to local state
            setPatients(prev => [...prev, result.data]);
            setShowNewPatientModal(false);
            resetPatientForm();
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    }, [patientForm, resetPatientForm]);

    const handleFileUpload = useCallback(async (file, fileType) => {
        if (!file || !selectedPatient) return;

        try {
            setUploadingFile(fileType);

            // Create form data
            const formData = new FormData();
            formData.append('file', file);
            formData.append('patientId', selectedPatient.id);
            formData.append('doctorId', doctorId);
            formData.append('fileType', fileType);
            formData.append('fileName', file.name);

            // Upload file (you'll need to implement this API endpoint)
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/patients/${selectedPatient.id}/files`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to upload file');
            }

            const result = await response.json();

            // Refresh medical records to show the new file
            const updatedRecords = await patientApi.getMedicalHistory(selectedPatient.id);
            setMedicalRecords(updatedRecords.data || []);

            setError(null);
            setShowFileUpload(false);
        } catch (err) {
            setError(err.message || 'Failed to upload file');
        } finally {
            setUploadingFile(null);
        }
    }, [selectedPatient, doctorId]);

    const handleEditPatient = useCallback(async (e) => {
        e.preventDefault();
        setActionLoading('edit-patient');

        try {
            const result = await patientApi.update(selectedPatient.id, editForm);

            // Update patient in local state
            setPatients(prev =>
                prev.map(patient =>
                    patient.id === selectedPatient.id
                        ? { ...patient, ...result.data }
                        : patient
                )
            );

            setShowEditPatientModal(false);
            setSelectedPatient(null);
            setEditForm({
                first_name: '',
                last_name: '',
                email: '',
                phone: '',
                date_of_birth: '',
                gender: '',
                blood_group: '',
                address: '',
                emergency_contact_name: '',
                emergency_contact_phone: '',
                medical_history: '',
                allergies: ''
            });
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    }, [editForm, selectedPatient]);

    const handleViewDetails = useCallback(async (patient) => {
        setSelectedPatient(patient);
        setDetailsLoading(true);
        setActionLoading('loading-details');

        try {
            // Fetch comprehensive patient information
            const [detailsResult, appointmentsResult, medicalHistoryResult] = await Promise.all([
                patientApi.getById(patient.id),
                appointmentApi.getByPatient(patient.id),
                patientApi.getMedicalHistory(patient.id)
            ]);

            setPatientDetails(detailsResult.data);
            setPatientAppointments(appointmentsResult.data || []);
            setMedicalRecords(medicalHistoryResult.data || []);
            setShowPatientModal(true);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setDetailsLoading(false);
            setActionLoading(null);
        }
    }, []);

    const openEditModal = useCallback((patient) => {
        setSelectedPatient(patient);
        setEditForm({
            first_name: patient.first_name || '',
            last_name: patient.last_name || '',
            email: patient.email || '',
            phone: patient.phone || '',
            date_of_birth: patient.date_of_birth ? patient.date_of_birth.split('T')[0] : '',
            gender: patient.gender || '',
            blood_group: patient.blood_group || '',
            address: patient.address || '',
            emergency_contact_name: patient.emergency_contact_name || '',
            emergency_contact_phone: patient.emergency_contact_phone || '',
            medical_history: patient.medical_history || '',
            allergies: patient.allergies || ''
        });
        setShowEditPatientModal(true);
    }, []);

    const handleDeletePatient = useCallback(async (patientId) => {
        if (!confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
            return;
        }

        try {
            setActionLoading('delete-patient');
            await patientApi.delete(patientId);
            setPatients(prev => prev.filter(p => p.id !== patientId));
            setShowPatientModal(false);
            setSelectedPatient(null);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    }, []);

    const loadPatientAppointments = useCallback(async (patientId) => {
        try {
            setAppointmentLoading(true);
            const result = await appointmentApi.getByPatient(patientId);
            setPatientAppointments(result.data || []);
        } catch (err) {
            console.error('Error loading patient appointments:', err);
            setPatientAppointments([]);
        } finally {
            setAppointmentLoading(false);
        }
    }, []);

    const calculateAge = (dateOfBirth) => {
        if (!dateOfBirth) return 'N/A';
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="space-y-8 animate-in fade-in duration-700">
                <div className="space-y-2">
                    <div className="h-10 bg-muted rounded-full w-48 animate-pulse"></div>
                    <div className="h-4 bg-muted/50 rounded-full w-64 animate-pulse"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-muted/50 rounded-[2.5rem] animate-pulse"></div>
                    ))}
                </div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <PatientSkeleton key={i} />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Glassmorphism Header */}
            <div className="relative p-8 rounded-[3rem] bg-indigo-600 dark:bg-indigo-950/40 overflow-hidden shadow-2xl shadow-indigo-500/20 dark:shadow-none group border border-indigo-500/20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/20 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center space-x-3 text-indigo-100 mb-2">
                            <Users size={20} className="text-indigo-200" />
                            <span className="text-xs font-black uppercase tracking-widest opacity-80">Patient Directory</span>
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tighter">
                            Patient <span className="text-indigo-200">Management</span>
                        </h1>
                        <p className="text-indigo-100/70 text-sm font-medium max-w-md">
                            Access comprehensive clinical records and manage your patient relationships in one professional space.
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            resetPatientForm();
                            setShowNewPatientModal(true);
                        }}
                        className="group flex items-center space-x-3 px-8 py-4 bg-card dark:bg-indigo-600 text-indigo-600 dark:text-white rounded-[2rem] font-black shadow-xl shadow-indigo-900/10 hover:shadow-indigo-900/20 hover:-translate-y-1 transition-all duration-300"
                    >
                        <div className="p-1.5 bg-indigo-500/10 dark:bg-white/20 rounded-xl group-hover:rotate-90 transition-transform duration-500">
                            <Plus size={20} />
                        </div>
                        <span>Register New Patient</span>
                    </button>
                </div>
            </div>

            {/* Statistics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    icon={Users}
                    label="Total Patients"
                    value={patientStats.total}
                    subLabel="Unique Records"
                    color="bg-indigo-600"
                />
                <StatCard
                    icon={TrendingUp}
                    label="New Arrivals"
                    value={patientStats.newThisMonth}
                    subLabel="Last 30 days"
                    color="bg-emerald-500"
                />
                <StatCard
                    icon={Activity}
                    label="Active Cases"
                    value={patientStats.activePatients}
                    subLabel="Current Cycle"
                    color="bg-amber-500"
                />
            </div>

            {/* Enhanced Search & Filter Section */}
            <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 rounded-[2.5rem] blur-xl group-focus-within:opacity-100 opacity-0 transition-opacity"></div>
                <div className="relative flex flex-col lg:flex-row gap-4 p-4 bg-card/80 backdrop-blur-xl border border-border rounded-[2.5rem] shadow-sm">
                    <div className="flex-1 relative">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-indigo-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name, unique ID, email or phone..."
                            className="w-full pl-14 pr-6 py-4 bg-muted border border-border rounded-3xl text-sm font-bold focus:bg-card focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none text-foreground"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {searchTerm && (
                        <div className="flex items-center px-4">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-muted px-3 py-1.5 rounded-full border border-border">
                                Found {filteredPatients.length} Results
                            </span>
                            <button
                                onClick={() => setSearchTerm('')}
                                className="ml-2 p-2 text-muted-foreground hover:text-rose-500 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-[2rem] p-6 flex items-center justify-between group animate-in slide-in-from-top-2">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-card rounded-2xl text-rose-500 shadow-sm">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-black text-foreground tracking-tight">System Error</p>
                            <p className="text-xs font-bold text-rose-500/70 capitalize">{error}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { setError(null); fetchPatients(); }}
                        className="px-6 py-2.5 bg-card text-foreground rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all border border-border active:scale-95"
                    >
                        Retry Connection
                    </button>
                </div>
            )}

            {/* Patients List Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-muted rounded-xl text-muted-foreground">
                            <ClipboardList size={18} />
                        </div>
                        <h3 className="text-xl font-black text-foreground tracking-tight">Clinical Directory</h3>
                    </div>
                    <div className="flex bg-muted p-1 rounded-xl">
                        <span className="px-3 py-1 text-[10px] font-bold text-muted-foreground tracking-tight uppercase">
                            {filteredPatients.length} Active Records
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {filteredPatients.length === 0 ? (
                        <div className="text-center py-12">
                            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">
                                {searchTerm ? 'No patients found matching your search' : 'No patients registered yet'}
                            </p>
                            {!searchTerm && (
                                <button
                                    onClick={() => {
                                        resetPatientForm();
                                        setShowNewPatientModal(true);
                                    }}
                                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    Add Your First Patient
                                </button>
                            )}
                        </div>
                    ) : (
                        filteredPatients.map((patient) => (
                            <div
                                key={patient.id}
                                className="group relative bg-card border border-border rounded-[2.5rem] p-6 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-500/30 transition-all duration-500"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center space-x-5">
                                        <div className="relative">
                                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-[2rem] flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-500">
                                                {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
                                            </div>
                                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-card rounded-full flex items-center justify-center shadow-sm border border-border">
                                                <Shield size={12} className="text-emerald-500" />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex items-center space-x-2">
                                                <h4 className="text-lg font-black text-foreground tracking-tight group-hover:text-indigo-500 transition-colors">
                                                    {patient.first_name} {patient.last_name}
                                                </h4>
                                                <span className="px-2 py-0.5 bg-muted text-[10px] font-black text-muted-foreground rounded-md border border-border uppercase tracking-tighter">
                                                    {patient.unique_id}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-muted-foreground">
                                                <span className="flex items-center space-x-1.5">
                                                    <Calendar size={14} className="text-muted-foreground/50" />
                                                    <span>{calculateAge(patient.date_of_birth)} Yrs</span>
                                                </span>
                                                <span className="flex items-center space-x-1.5">
                                                    <Heart size={14} className="text-rose-400" />
                                                    <span>{patient.blood_group || 'N/A'}</span>
                                                </span>
                                                <span className="flex items-center space-x-1.5 capitalize">
                                                    <User size={14} className="text-indigo-500/70" />
                                                    <span>{patient.gender}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <div className="hidden sm:flex flex-col items-end mr-4">
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Clinical History</span>
                                            <span className="text-sm font-black text-foreground">{patient.total_appointments || 0} Visits</span>
                                        </div>

                                        <div className="flex bg-muted p-1.5 rounded-2xl border border-border">
                                            <button
                                                onClick={() => handleViewDetails(patient)}
                                                disabled={actionLoading === 'loading-details'}
                                                className="p-2.5 text-muted-foreground hover:text-indigo-500 hover:bg-card rounded-xl transition-all group/btn"
                                                title="View Patient Sheet"
                                            >
                                                <Eye size={20} className="group-hover/btn:scale-110 transition-transform" />
                                            </button>
                                            <button
                                                onClick={() => openEditModal(patient)}
                                                className="p-2.5 text-muted-foreground hover:text-amber-500 hover:bg-card rounded-xl transition-all group/btn"
                                                title="Edit Profile"
                                            >
                                                <Edit size={20} className="group-hover/btn:scale-110 transition-transform" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Hover Status Bar */}
                                <div className="mt-6 pt-6 border-t border-border/50 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 text-[10px] font-bold text-muted-foreground">
                                    <span className="flex items-center space-x-1.5 line-clamp-1 max-w-[60%]">
                                        <MapPin size={12} />
                                        <span>{patient.address || 'No address provided'}</span>
                                    </span>
                                    <span className="flex items-center space-x-1.5">
                                        <Clock size={12} />
                                        <span>Last visit: {formatDate(patient.updated_at)}</span>
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* New Patient Modal */}
            {showNewPatientModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-card border border-border rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-500">
                        <div className="p-8 border-b border-border flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-foreground tracking-tight">Register New Patient</h2>
                                <p className="text-xs font-medium text-muted-foreground mt-1">Create a comprehensive clinical profile</p>
                            </div>
                            <button
                                onClick={() => setShowNewPatientModal(false)}
                                className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-foreground"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8">
                            {error && (
                                <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-600 text-sm font-bold flex items-center space-x-3">
                                    <AlertCircle size={18} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <form onSubmit={handleCreatePatient} className="space-y-8">
                                {/* Basic Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-wider ml-1">First Name *</label>
                                        <input
                                            type="text"
                                            value={patientForm.first_name}
                                            onChange={(e) => setPatientForm({ ...patientForm, first_name: e.target.value })}
                                            className="w-full px-5 py-4 bg-muted/50 border border-border rounded-2xl text-sm font-bold focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-foreground"
                                            placeholder="e.g. John"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-wider ml-1">Last Name *</label>
                                        <input
                                            type="text"
                                            value={patientForm.last_name}
                                            onChange={(e) => setPatientForm({ ...patientForm, last_name: e.target.value })}
                                            className="w-full px-5 py-4 bg-muted/50 border border-border rounded-2xl text-sm font-bold focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-foreground"
                                            placeholder="e.g. Doe"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-wider ml-1">Email Address *</label>
                                        <input
                                            type="email"
                                            value={patientForm.email}
                                            onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })}
                                            className="w-full px-5 py-4 bg-muted/50 border border-border rounded-2xl text-sm font-bold focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-foreground"
                                            placeholder="john.doe@example.com"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-wider ml-1">Phone Number</label>
                                        <input
                                            type="tel"
                                            value={patientForm.phone}
                                            onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
                                            className="w-full px-5 py-4 bg-muted/50 border border-border rounded-2xl text-sm font-bold focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-foreground"
                                            placeholder="+1 (555) 000-0000"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-wider ml-1">Date of Birth</label>
                                        <input
                                            type="date"
                                            value={patientForm.date_of_birth}
                                            onChange={(e) => setPatientForm({ ...patientForm, date_of_birth: e.target.value })}
                                            className="w-full px-5 py-4 bg-muted/50 border border-border rounded-2xl text-sm font-bold focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-foreground"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-wider ml-1">Gender Identity</label>
                                        <select
                                            value={patientForm.gender}
                                            onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}
                                            className="w-full px-5 py-4 bg-muted/50 border border-border rounded-2xl text-sm font-bold focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-foreground appearance-none cursor-pointer"
                                        >
                                            <option value="">Select Identity</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-wider ml-1">Blood Group</label>
                                        <select
                                            value={patientForm.blood_group}
                                            onChange={(e) => setPatientForm({ ...patientForm, blood_group: e.target.value })}
                                            className="w-full px-5 py-4 bg-muted/50 border border-border rounded-2xl text-sm font-bold focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-foreground appearance-none cursor-pointer"
                                        >
                                            <option value="">Select Group</option>
                                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(group => (
                                                <option key={group} value={group}>{group}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-muted-foreground uppercase tracking-wider ml-1">Residential Address</label>
                                    <textarea
                                        value={patientForm.address}
                                        onChange={(e) => setPatientForm({ ...patientForm, address: e.target.value })}
                                        className="w-full px-5 py-4 bg-muted/50 border border-border rounded-2xl text-sm font-bold focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-foreground resize-none"
                                        rows="2"
                                        placeholder="Full residential details..."
                                    />
                                </div>

                                {/* Emergency Contact Section */}
                                <div className="bg-muted/30 rounded-[2rem] p-6 border border-border space-y-6">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg">
                                            <Shield size={16} />
                                        </div>
                                        <h3 className="text-sm font-black text-foreground tracking-tight">Emergency Contact</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-wider ml-1">Contact Name</label>
                                            <input
                                                type="text"
                                                value={patientForm.emergency_contact_name}
                                                onChange={(e) => setPatientForm({ ...patientForm, emergency_contact_name: e.target.value })}
                                                className="w-full px-5 py-4 bg-card border border-border rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-foreground"
                                                placeholder="Legal guardian or relative"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-wider ml-1">Contact Phone</label>
                                            <input
                                                type="tel"
                                                value={patientForm.emergency_contact_phone}
                                                onChange={(e) => setPatientForm({ ...patientForm, emergency_contact_phone: e.target.value })}
                                                className="w-full px-5 py-4 bg-card border border-border rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-foreground"
                                                placeholder="Secondary contact line"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Medical Info Section */}
                                <div className="bg-indigo-500/5 rounded-[2rem] p-6 border border-indigo-500/10 space-y-6">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
                                            <Stethoscope size={16} />
                                        </div>
                                        <h3 className="text-sm font-black text-foreground tracking-tight">Clinical Background</h3>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-wider ml-1">Medical History</label>
                                            <textarea
                                                value={patientForm.medical_history}
                                                onChange={(e) => setPatientForm({ ...patientForm, medical_history: e.target.value })}
                                                className="w-full px-5 py-4 bg-card border border-border rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-foreground resize-none"
                                                rows="3"
                                                placeholder="Previous conditions, surgeries, chronic diseases..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-wider ml-1">Allergies & Sensitivities</label>
                                            <textarea
                                                value={patientForm.allergies}
                                                onChange={(e) => setPatientForm({ ...patientForm, allergies: e.target.value })}
                                                className="w-full px-5 py-4 bg-card border border-border rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-foreground resize-none"
                                                rows="2"
                                                placeholder="Drug, food, or environmental allergies..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowNewPatientModal(false);
                                            resetPatientForm();
                                        }}
                                        className="flex-1 px-8 py-5 border border-border text-muted-foreground rounded-2xl font-black text-sm hover:bg-muted transition-all"
                                    >
                                        Discard
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={actionLoading === 'create-patient'}
                                        className="flex-[2] py-5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-2xl font-black text-sm tracking-tight shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all disabled:opacity-50"
                                    >
                                        {actionLoading === 'create-patient' ? (
                                            <div className="flex items-center justify-center space-x-2">
                                                <RefreshCw size={20} className="animate-spin" />
                                                <span>Registering...</span>
                                            </div>
                                        ) : 'Finalize Registration'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            {/* Edit Patient Modal */}
            {showEditPatientModal && selectedPatient && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-card border border-border rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-500">
                        <div className="p-8 border-b border-border flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-foreground tracking-tight">Edit Patient Profile</h2>
                                <p className="text-xs font-medium text-muted-foreground mt-1">Update clinical and personal information</p>
                            </div>
                            <button
                                onClick={() => setShowEditPatientModal(false)}
                                className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-foreground"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8">
                            {error && (
                                <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-600 text-sm font-bold flex items-center space-x-3">
                                    <AlertCircle size={18} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <form onSubmit={handleEditPatient} className="space-y-8">
                                {/* Basic Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-wider ml-1">First Name *</label>
                                        <input
                                            type="text"
                                            value={editForm.first_name}
                                            onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                                            className="w-full px-5 py-4 bg-muted/50 border border-border rounded-2xl text-sm font-bold focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-foreground"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-wider ml-1">Last Name *</label>
                                        <input
                                            type="text"
                                            value={editForm.last_name}
                                            onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                                            className="w-full px-5 py-4 bg-muted/50 border border-border rounded-2xl text-sm font-bold focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-foreground"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-wider ml-1">Email Address *</label>
                                        <input
                                            type="email"
                                            value={editForm.email}
                                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                            className="w-full px-5 py-4 bg-muted/50 border border-border rounded-2xl text-sm font-bold focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-foreground"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-wider ml-1">Phone Number</label>
                                        <input
                                            type="tel"
                                            value={editForm.phone}
                                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                            className="w-full px-5 py-4 bg-muted/50 border border-border rounded-2xl text-sm font-bold focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-foreground"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-wider ml-1">Date of Birth</label>
                                        <input
                                            type="date"
                                            value={editForm.date_of_birth}
                                            onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                                            className="w-full px-5 py-4 bg-muted/50 border border-border rounded-2xl text-sm font-bold focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-foreground"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-wider ml-1">Gender Identity</label>
                                        <select
                                            value={editForm.gender}
                                            onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                                            className="w-full px-5 py-4 bg-muted/50 border border-border rounded-2xl text-sm font-bold focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-foreground appearance-none cursor-pointer"
                                        >
                                            <option value="">Select Identity</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-wider ml-1">Blood Group</label>
                                        <select
                                            value={editForm.blood_group}
                                            onChange={(e) => setEditForm({ ...editForm, blood_group: e.target.value })}
                                            className="w-full px-5 py-4 bg-muted/50 border border-border rounded-2xl text-sm font-bold focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-foreground appearance-none cursor-pointer"
                                        >
                                            <option value="">Select Group</option>
                                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(group => (
                                                <option key={group} value={group}>{group}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-muted-foreground uppercase tracking-wider ml-1">Residential Address</label>
                                    <textarea
                                        value={editForm.address}
                                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                        className="w-full px-5 py-4 bg-muted/50 border border-border rounded-2xl text-sm font-bold focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-foreground resize-none"
                                        rows="2"
                                    />
                                </div>

                                {/* Emergency Contact */}
                                <div className="bg-muted/30 rounded-[2rem] p-6 border border-border space-y-6">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg">
                                            <Shield size={16} />
                                        </div>
                                        <h3 className="text-sm font-black text-foreground tracking-tight">Emergency Contact</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-wider ml-1">Contact Name</label>
                                            <input
                                                type="text"
                                                value={editForm.emergency_contact_name}
                                                onChange={(e) => setEditForm({ ...editForm, emergency_contact_name: e.target.value })}
                                                className="w-full px-5 py-4 bg-card border border-border rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-foreground"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-wider ml-1">Contact Phone</label>
                                            <input
                                                type="tel"
                                                value={editForm.emergency_contact_phone}
                                                onChange={(e) => setEditForm({ ...editForm, emergency_contact_phone: e.target.value })}
                                                className="w-full px-5 py-4 bg-card border border-border rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-foreground"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Medical Information */}
                                <div className="bg-indigo-500/5 rounded-[2rem] p-6 border border-indigo-500/10 space-y-6">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
                                            <Stethoscope size={16} />
                                        </div>
                                        <h3 className="text-sm font-black text-foreground tracking-tight">Clinical Background</h3>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-wider ml-1">Medical History</label>
                                            <textarea
                                                value={editForm.medical_history}
                                                onChange={(e) => setEditForm({ ...editForm, medical_history: e.target.value })}
                                                className="w-full px-5 py-4 bg-card border border-border rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-foreground resize-none"
                                                rows="3"
                                                placeholder="Previous conditions, surgeries, chronic diseases..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-wider ml-1">Allergies & Sensitivities</label>
                                            <textarea
                                                value={editForm.allergies}
                                                onChange={(e) => setEditForm({ ...editForm, allergies: e.target.value })}
                                                className="w-full px-5 py-4 bg-card border border-border rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-foreground resize-none"
                                                rows="2"
                                                placeholder="Food allergies, drug allergies, environmental allergies..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditPatientModal(false)}
                                        className="flex-1 px-8 py-5 border border-border text-muted-foreground rounded-2xl font-black text-sm hover:bg-muted transition-all"
                                    >
                                        Discard
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={actionLoading === 'edit-patient'}
                                        className="flex-[2] py-5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-2xl font-black text-sm tracking-tight shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all disabled:opacity-50"
                                    >
                                        {actionLoading === 'edit-patient' ? (
                                            <div className="flex items-center justify-center space-x-2">
                                                <RefreshCw size={20} className="animate-spin" />
                                                <span>Updating...</span>
                                            </div>
                                        ) : 'Update Profile'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Patient Details Modal */}
            {showPatientModal && selectedPatient && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 sm:p-6 animate-in fade-in duration-300">
                    <div className="bg-card rounded-[3.5rem] w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl dark:shadow-none border border-border relative overflow-hidden">
                        {/* Modal Header */}
                        <div className="relative z-10 flex-shrink-0 px-10 py-8 border-b border-border bg-card">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                                <div className="flex items-center space-x-6">
                                    <div className="relative">
                                        <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-[2.5rem] flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-indigo-100 dark:shadow-none ring-4 ring-white dark:ring-indigo-900/50">
                                            {selectedPatient.first_name.charAt(0)}{selectedPatient.last_name.charAt(0)}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 p-2 bg-emerald-500 text-white rounded-2xl border-4 border-white dark:border-indigo-900 shadow-sm">
                                            <Shield size={16} />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center space-x-3">
                                            <h2 className="text-3xl font-black text-foreground tracking-tighter">
                                                {selectedPatient.first_name} {selectedPatient.last_name}
                                            </h2>
                                            <span className="px-4 py-1.5 bg-indigo-500/10 text-[10px] font-black text-indigo-500 rounded-full border border-indigo-500/20 uppercase tracking-widest">
                                                {selectedPatient.unique_id}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-muted-foreground">
                                            <span className="flex items-center space-x-2">
                                                <Calendar size={16} className="text-indigo-400" />
                                                <span>{calculateAge(selectedPatient.date_of_birth)} Years Old</span>
                                            </span>
                                            <span className="flex items-center space-x-2">
                                                <MapPin size={16} className="text-muted-foreground/50" />
                                                <span>{selectedPatient.address || 'Location Hidden'}</span>
                                            </span>
                                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg border border-emerald-500/20">
                                                Active Case
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-4">
                                    <button
                                        onClick={() => openEditModal(selectedPatient)}
                                        className="flex items-center space-x-3 px-6 py-3.5 bg-muted text-foreground rounded-2xl font-black text-xs hover:bg-muted/80 transition-all border border-border"
                                    >
                                        <Edit size={16} className="text-indigo-500" />
                                        <span>Update Profile</span>
                                    </button>
                                    <button
                                        onClick={() => setShowPatientModal(false)}
                                        className="p-4 bg-muted/30 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all border border-border hover:border-rose-500/20"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Modern Tab Navigation */}
                        <div className="relative z-10 flex-shrink-0 px-10 py-4 bg-muted/40 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden border-b border-border/50">
                            <div className="flex items-center space-x-2 p-1 bg-muted/50 rounded-[2rem] border border-border overflow-x-auto no-scrollbar">
                                {[
                                    { id: 'profile', label: 'Overview', icon: UserCircle },
                                    { id: 'medical-history', label: 'Clinical History', icon: Stethoscope },
                                    { id: 'records', label: 'Documents', icon: FileText },
                                    { id: 'appointments', label: 'Schedule', icon: Clock },
                                    { id: 'prescriptions', label: 'Medications', icon: Pill }
                                ].map((tab) => {
                                    const Icon = tab.icon;
                                    const isActive = activeDetailsTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveDetailsTab(tab.id)}
                                            className={`flex items-center space-x-2 px-6 py-2.5 rounded-[1.5rem] text-xs font-black transition-all duration-300 whitespace-nowrap ${isActive
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-card'
                                                }`}
                                        >
                                            <Icon size={16} className={isActive ? 'text-white' : 'text-muted-foreground/60'} />
                                            <span>{tab.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => handleDeletePatient(selectedPatient.id)}
                                    className="p-2.5 text-rose-300 hover:text-rose-600 transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body Container */}
                        <div className="relative z-10 flex-1 overflow-y-auto bg-card">
                            <div className="px-10 py-8">
                                {detailsLoading ? (
                                    <div className="flex flex-col items-center justify-center h-full space-y-4 animate-in fade-in duration-500">
                                        <div className="relative">
                                            <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Activity size={24} className="text-indigo-600 animate-pulse" />
                                            </div>
                                        </div>
                                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Retrieving Clinical Data...</p>
                                    </div>
                                ) : (
                                    <div className="min-h-full space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        {/* Profile Overview Tab */}
                                        {activeDetailsTab === 'profile' && (
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                                <div className="lg:col-span-2 space-y-8">
                                                    <div className="bg-muted/30 border border-border rounded-[2.5rem] p-8">
                                                        <h3 className="text-lg font-black text-foreground tracking-tight mb-6 flex items-center space-x-3">
                                                            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-500/20">
                                                                <Info size={18} />
                                                            </div>
                                                            <span>Vital Information</span>
                                                        </h3>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 text-sm">
                                                            <div className="space-y-1">
                                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Email Address</p>
                                                                <p className="font-bold text-foreground">{selectedPatient.email}</p>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Primary Contact</p>
                                                                <p className="font-bold text-foreground">{selectedPatient.phone || 'Not Recorded'}</p>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Date of Birth</p>
                                                                <p className="font-bold text-foreground">{formatDate(selectedPatient.date_of_birth)}</p>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Blood Type</p>
                                                                <span className="inline-block px-3 py-1 bg-rose-500/10 text-rose-500 rounded-lg font-black">{selectedPatient.blood_group || 'Unknown'}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="bg-muted/30 border border-border rounded-[2.5rem] p-8">
                                                        <h3 className="text-lg font-black text-foreground tracking-tight mb-6 flex items-center space-x-3">
                                                            <div className="p-2 bg-emerald-500 rounded-xl text-white shadow-lg shadow-emerald-500/20">
                                                                <AlertCircle size={18} />
                                                            </div>
                                                            <span>Emergency Contact Details</span>
                                                        </h3>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-card p-6 rounded-[2rem] border border-border/50">
                                                            <div className="space-y-1">
                                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Contact Person</p>
                                                                <p className="font-bold text-foreground">{selectedPatient.emergency_contact_name || 'N/A'}</p>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Emergency Line</p>
                                                                <p className="font-bold text-foreground">{selectedPatient.emergency_contact_phone || 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-8">
                                                    <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-100">
                                                        <Zap size={32} className="text-indigo-200 mb-6" />
                                                        <h4 className="text-xl font-black tracking-tight mb-2">Clinical Note</h4>
                                                        <p className="text-indigo-100 text-xs font-bold leading-relaxed mb-6">
                                                            {selectedPatient.medical_history ? selectedPatient.medical_history.substring(0, 100) + '...' : 'No primary clinical notes active for this patient.'}
                                                        </p>
                                                        <button
                                                            onClick={() => setActiveDetailsTab('medical-history')}
                                                            className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                                                        >
                                                            View Full Record
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Clinical History Tab */}
                                        {activeDetailsTab === 'medical-history' && (
                                            <div className="space-y-8">
                                                {/* Medical History Section */}
                                                <div className="bg-muted/30 border border-border rounded-[3rem] p-8">
                                                    <div className="flex items-center justify-between mb-8">
                                                        <div className="flex items-center space-x-4">
                                                            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-500/20">
                                                                <Stethoscope size={24} />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-xl font-black text-foreground tracking-tight">Medical Biography</h3>
                                                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Complete Clinical Timeline</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {selectedPatient.medical_history ? (
                                                        <div className="space-y-4">
                                                            {selectedPatient.medical_history.split('\n').filter(line => line.trim()).map((entry, index) => (
                                                                <div key={index} className="group relative pl-8 pb-6 last:pb-0">
                                                                    {/* Timeline connector */}
                                                                    <div className="absolute left-2 top-2 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500/20 to-transparent group-last:hidden"></div>

                                                                    {/* Timeline dot */}
                                                                    <div className="absolute left-0 top-2 w-5 h-5 bg-indigo-600 rounded-full border-4 border-card shadow-lg shadow-indigo-500/20 group-hover:scale-125 transition-transform"></div>

                                                                    {/* Content card */}
                                                                    <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-500/30 transition-all duration-300">
                                                                        <p className="text-sm font-bold text-foreground leading-relaxed">{entry}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center py-16 bg-muted/20 rounded-[2.5rem] border border-dashed border-border">
                                                            <div className="p-4 bg-muted/50 rounded-2xl mb-4">
                                                                <Stethoscope size={40} className="text-muted-foreground/30" />
                                                            </div>
                                                            <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">No Medical History Documented</p>
                                                            <p className="text-xs font-bold text-muted-foreground/50 mt-2">Patient records will appear here</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Allergies Section */}
                                                <div className="bg-rose-500/5 border border-rose-500/10 rounded-[3rem] p-8">
                                                    <div className="flex items-center justify-between mb-8">
                                                        <div className="flex items-center space-x-4">
                                                            <div className="p-3 bg-rose-600 text-white rounded-2xl shadow-lg shadow-rose-500/20">
                                                                <AlertCircle size={24} />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-xl font-black text-rose-600 dark:text-rose-500 tracking-tight">Allergies & Sensitivities</h3>
                                                                <p className="text-xs font-bold text-rose-500/70 uppercase tracking-widest">Critical Patient Safety Information</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {selectedPatient.allergies ? (
                                                        <div className="space-y-4">
                                                            {selectedPatient.allergies.split(',').map((allergy, index) => (
                                                                <div key={index} className="group bg-card border border-rose-500/10 rounded-2xl p-5 hover:shadow-xl hover:shadow-rose-500/5 hover:border-rose-500/30 transition-all duration-300">
                                                                    <div className="flex items-center space-x-4">
                                                                        <div className="p-2 bg-rose-500/10 text-rose-500 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition-all">
                                                                            <AlertCircle size={20} />
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <p className="text-sm font-black text-rose-600 dark:text-rose-400">{allergy.trim()}</p>
                                                                        </div>
                                                                        <div className="px-3 py-1 bg-rose-500/10 text-rose-500 rounded-lg">
                                                                            <span className="text-[10px] font-black uppercase tracking-widest">Alert</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center py-16 bg-emerald-500/5 rounded-[2.5rem] border border-dashed border-emerald-500/10">
                                                            <div className="p-4 bg-emerald-500/10 rounded-2xl mb-4">
                                                                <Shield size={40} className="text-emerald-500" />
                                                            </div>
                                                            <p className="text-sm font-black text-emerald-600 uppercase tracking-widest">No Known Allergies</p>
                                                            <p className="text-xs font-bold text-muted-foreground/50 mt-2">Patient is cleared for standard treatments</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Additional Clinical Notes */}
                                                <div className="bg-amber-500/5 border border-amber-500/10 rounded-[3rem] p-8">
                                                    <div className="flex items-center space-x-4 mb-6">
                                                        <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-500/20">
                                                            <FileText size={24} />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xl font-black text-amber-600 dark:text-amber-500 tracking-tight">Clinical Notes</h3>
                                                            <p className="text-xs font-bold text-amber-500/70 uppercase tracking-widest">Additional Observations</p>
                                                        </div>
                                                    </div>

                                                    <div className="bg-card border border-amber-500/10 rounded-2xl p-6">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            <div className="space-y-2">
                                                                <div className="flex items-center space-x-2 text-muted-foreground">
                                                                    <Calendar size={14} />
                                                                    <span className="text-[10px] font-black uppercase tracking-widest">Last Updated</span>
                                                                </div>
                                                                <p className="text-sm font-black text-foreground">{formatDate(selectedPatient.updated_at || selectedPatient.created_at)}</p>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="flex items-center space-x-2 text-muted-foreground">
                                                                    <Activity size={14} />
                                                                    <span className="text-[10px] font-black uppercase tracking-widest">Record Status</span>
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                                                    <p className="text-sm font-black text-emerald-600">Active & Current</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Medical Records Tab */}
                                        {activeDetailsTab === 'records' && (
                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between px-2">
                                                    <h3 className="text-xl font-black text-foreground tracking-tight">Clinical Documentation</h3>
                                                    <button
                                                        onClick={() => setShowFileUpload(true)}
                                                        className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-500/20 hover:-translate-y-1 transition-all"
                                                    >
                                                        <Plus size={16} />
                                                        <span>Upload New Document</span>
                                                    </button>
                                                </div>

                                                {medicalRecords.filter(r => !r.prescription && r.file_type !== 'prescription').length === 0 ? (
                                                    <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-[3rem] border border-dashed border-border">
                                                        <FileText size={48} className="text-muted-foreground/30 mb-4" />
                                                        <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">No Medical Documents Found</p>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {medicalRecords
                                                            .filter(r => !r.prescription && r.file_type !== 'prescription')
                                                            .map((record) => (
                                                                <div key={record.id} className="bg-card border border-border rounded-[2.5rem] p-6 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group">
                                                                    <div className="flex items-start justify-between mb-4">
                                                                        <div className="flex items-center space-x-4">
                                                                            <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                                                                <FileText size={24} />
                                                                            </div>
                                                                            <div>
                                                                                <h4 className="text-sm font-black text-foreground">{record.diagnosis || 'Clinical Update'}</h4>
                                                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                                                                    {formatDate(record.record_date || record.created_at)}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        {record.file_path && (
                                                                            <button
                                                                                onClick={() => window.open(`${API_CONFIG.BASE_URL}/api/files/${record.file_name}`, '_blank')}
                                                                                className="p-2 text-indigo-500 hover:bg-indigo-500/10 rounded-xl transition-all"
                                                                            >
                                                                                <ExternalLink size={18} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    {record.notes && (
                                                                        <div className="bg-muted/30 p-4 rounded-2xl text-[11px] font-bold text-muted-foreground leading-relaxed mb-4">
                                                                            {record.notes}
                                                                        </div>
                                                                    )}
                                                                    <div className="flex items-center space-x-2">
                                                                        <span className="px-3 py-1 bg-muted text-[10px] font-black text-muted-foreground rounded-lg uppercase tracking-widest">
                                                                            {record.file_type || 'Record'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Appointments Tab */}
                                        {activeDetailsTab === 'appointments' && (
                                            <div className="space-y-6">
                                                <h3 className="text-xl font-black text-foreground tracking-tight px-2">Scheduling Timeline</h3>
                                                {appointmentLoading ? (
                                                    <div className="flex justify-center py-20 animate-pulse">
                                                        <div className="h-2 w-24 bg-muted rounded-full"></div>
                                                    </div>
                                                ) : patientAppointments.length === 0 ? (
                                                    <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-[3rem] border border-dashed border-border">
                                                        <Calendar size={48} className="text-muted-foreground/30 mb-4" />
                                                        <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">No Appointments Scheduled</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        {patientAppointments.map((appointment) => (
                                                            <div key={appointment.id} className="relative pl-8 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-border group">
                                                                <div className="absolute left-[-4px] top-6 w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-card shadow-sm"></div>
                                                                <div className="bg-card border border-border rounded-[2rem] p-6 hover:shadow-xl transition-all">
                                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                                        <div className="flex items-center space-x-4">
                                                                            <div className="p-3 bg-muted rounded-2xl text-muted-foreground">
                                                                                <Clock size={20} />
                                                                            </div>
                                                                            <div>
                                                                                <h4 className="text-sm font-black text-foreground">
                                                                                    {formatDate(appointment.appointment_date)} at {appointment.appointment_time}
                                                                                </h4>
                                                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                                                                    {appointment.appointment_type} Session
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${appointment.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' :
                                                                            appointment.status === 'confirmed' ? 'bg-indigo-500/10 text-indigo-600' :
                                                                                appointment.status === 'pending' ? 'bg-amber-500/10 text-amber-600' :
                                                                                    'bg-rose-500/10 text-rose-600'
                                                                            }`}>
                                                                            {appointment.status}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Prescriptions Tab */}
                                        {activeDetailsTab === 'prescriptions' && (
                                            <div className="space-y-6">
                                                <h3 className="text-xl font-black text-foreground tracking-tight px-2">Medication Logs</h3>
                                                {medicalRecords.filter(r => r.prescription || r.file_type === 'prescription').length === 0 ? (
                                                    <div className="flex flex-col items-center justify-center py-20 bg-muted/30 rounded-[3rem] border border-border border-dashed">
                                                        <Pill size={48} className="text-muted-foreground/30 mb-4" />
                                                        <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">No Prescriptions active</p>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {medicalRecords
                                                            .filter(r => r.prescription || r.file_type === 'prescription')
                                                            .map((record) => (
                                                                <div key={record.id} className="bg-card border border-border rounded-[2.5rem] p-8 hover:shadow-xl transition-all group">
                                                                    <div className="flex items-center justify-between mb-6">
                                                                        <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-all">
                                                                            <Pill size={24} />
                                                                        </div>
                                                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest font-outfit">Digital Prescription</span>
                                                                    </div>
                                                                    <div className="bg-muted/30 p-6 rounded-[2rem] border-l-4 border-amber-400 mb-6 italic font-bold text-foreground text-sm whitespace-pre-wrap">
                                                                        {record.prescription}
                                                                    </div>
                                                                    <div className="flex items-center justify-between">
                                                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                                                            Prescribed: {formatDate(record.record_date || record.created_at)}
                                                                        </p>
                                                                        {record.file_path && (
                                                                            <button
                                                                                onClick={() => window.open(`${API_CONFIG.BASE_URL}/api/files/${record.file_name}`, '_blank')}
                                                                                className="text-xs font-black text-indigo-500 hover:text-indigo-400 underline transition-colors"
                                                                            >
                                                                                View Document
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* File Upload Modal */}
            {showFileUpload && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-in fade-in duration-300">
                    <div className="bg-card border border-border rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-500">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-xl font-black text-foreground tracking-tight">Upload Document</h3>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Clinical Data Storage</p>
                                </div>
                                <button
                                    onClick={() => setShowFileUpload(false)}
                                    className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-foreground"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-muted-foreground uppercase tracking-wider ml-1">Document Category</label>
                                    <select
                                        className="w-full px-5 py-4 bg-muted/50 border border-border rounded-2xl text-sm font-bold focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none appearance-none cursor-pointer text-foreground"
                                        id="fileType"
                                    >
                                        <option value="medical_record">General Medical Record</option>
                                        <option value="prescription">Digital Prescription</option>
                                        <option value="lab_result">Laboratory Analysis</option>
                                        <option value="xray">Radiology (X-Ray)</option>
                                        <option value="scan">Advanced Scan (CT/MRI)</option>
                                        <option value="report">Formal Medical Report</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-muted-foreground uppercase tracking-wider ml-1">Select Clinical File</label>
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            className="hidden"
                                            id="fileInput"
                                            onChange={(e) => {
                                                const fileName = e.target.files[0]?.name;
                                                const label = document.getElementById('fileLabel');
                                                if (label) label.innerText = fileName || 'Choose a file...';
                                            }}
                                        />
                                        <label
                                            htmlFor="fileInput"
                                            id="fileLabel"
                                            className="flex items-center justify-center w-full px-5 py-8 border-2 border-dashed border-border rounded-[2rem] text-sm font-bold text-muted-foreground cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group-hover:scale-[1.02]"
                                        >
                                            Drag & drop or click to browse
                                        </label>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground font-medium text-center mt-2">
                                        Max File Size: 10MB | Formats: PDF, JPG, PNG
                                    </p>
                                </div>

                                <div className="flex items-center space-x-4 pt-4">
                                    <button
                                        onClick={() => setShowFileUpload(false)}
                                        className="flex-1 px-8 py-5 border border-border text-muted-foreground rounded-2xl font-black text-sm hover:bg-muted transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            const fileInput = document.getElementById('fileInput');
                                            const fileType = document.getElementById('fileType');
                                            const file = fileInput.files[0];

                                            if (file) {
                                                if (file.size > 10 * 1024 * 1024) {
                                                    setError('File size must be less than 10MB');
                                                    return;
                                                }
                                                handleFileUpload(file, fileType.value);
                                            } else {
                                                setError('Please select a file');
                                            }
                                        }}
                                        disabled={uploadingFile}
                                        className="flex-[2] py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm tracking-tight shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all disabled:opacity-50"
                                    >
                                        {uploadingFile ? (
                                            <div className="flex items-center justify-center space-x-2">
                                                <RefreshCw size={20} className="animate-spin" />
                                                <span>Uploading...</span>
                                            </div>
                                        ) : 'Sync to Cloud'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
});

export default PatientTab;

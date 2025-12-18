import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { patientApi, appointmentApi } from "../../lib/api";
import { useDoctor } from "../../hooks/useDoctor";
import { User, Phone, Mail, Calendar, Heart, AlertCircle, Plus, Edit2, Edit, Eye, X, Save, FileText, Clock, Trash2, Stethoscope, Pill, ClipboardList, UserCircle } from "lucide-react";
import { debounce } from "../../utils/performance";

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

    // Memoized filtered patients
    const filteredPatients = useMemo(() => {
        if (!searchTerm) return patients;
        return patients.filter(patient => 
            `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (patient.unique_id && patient.unique_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (patient.phone && patient.phone.includes(searchTerm))
        );
    }, [patients, searchTerm]);

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
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-lg">Loading patients...</p>
                    <div className="mt-2 animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Patients</h1>
                <p className="text-muted-foreground">Manage patient records and comprehensive information.</p>
            </div>

            {/* Enhanced Search Bar */}
            <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search by name, email, unique ID, or phone..."
                            className="w-full p-3 border border-input rounded-md bg-background"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => {
                            resetPatientForm();
                            setShowNewPatientModal(true);
                        }}
                        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Add Patient
                    </button>
                </div>
                {searchTerm && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Showing {filteredPatients.length} of {patients.length} patients</span>
                        <button
                            onClick={() => setSearchTerm('')}
                            className="text-blue-600 hover:underline"
                        >
                            Clear search
                        </button>
                    </div>
                )}
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600">{error}</p>
                    <button 
                        onClick={() => {
                            setError(null);
                            fetchPatients();
                        }}
                        className="mt-2 text-sm text-red-700 underline"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Patients List */}
            <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">
                        Patient List ({filteredPatients.length})
                    </h3>
                    <div className="text-sm text-muted-foreground">
                        Total: {patients.length} patients
                    </div>
                </div>
                
                <div className="max-h-96 overflow-y-auto space-y-3">
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
                            <div key={patient.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                        {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-medium">
                                            {patient.first_name} {patient.last_name}
                                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                {patient.unique_id}
                                            </span>
                                        </p>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                Age: {calculateAge(patient.date_of_birth)}
                                            </span>
                                            {patient.blood_group && (
                                                <span className="flex items-center gap-1">
                                                    <Heart size={12} />
                                                    {patient.blood_group}
                                                </span>
                                            )}
                                            {patient.gender && (
                                                <span className="capitalize">{patient.gender}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                            <span className="flex items-center gap-1">
                                                <Mail size={12} />
                                                {patient.email}
                                            </span>
                                            {patient.phone && (
                                                <span className="flex items-center gap-1">
                                                    <Phone size={12} />
                                                    {patient.phone}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                        {patient.total_appointments || 0} visits
                                    </span>
                                    <button 
                                        onClick={() => handleViewDetails(patient)}
                                        disabled={actionLoading === 'loading-details'}
                                        className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors flex items-center gap-1"
                                    >
                                        <Eye size={12} />
                                        View
                                    </button>
                                    <button 
                                        onClick={() => openEditModal(patient)}
                                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors flex items-center gap-1"
                                    >
                                        <Edit2 size={12} />
                                        Edit
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* New Patient Modal */}
            {showNewPatientModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold">Add New Patient</h2>
                                <button 
                                    onClick={() => setShowNewPatientModal(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            
                            {error && (
                                <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleCreatePatient} className="space-y-4">
                                {/* Basic Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">First Name *</label>
                                        <input
                                            type="text"
                                            value={patientForm.first_name}
                                            onChange={(e) => setPatientForm({...patientForm, first_name: e.target.value})}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Last Name *</label>
                                        <input
                                            type="text"
                                            value={patientForm.last_name}
                                            onChange={(e) => setPatientForm({...patientForm, last_name: e.target.value})}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Email *</label>
                                        <input
                                            type="email"
                                            value={patientForm.email}
                                            onChange={(e) => setPatientForm({...patientForm, email: e.target.value})}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Phone</label>
                                        <input
                                            type="tel"
                                            value={patientForm.phone}
                                            onChange={(e) => setPatientForm({...patientForm, phone: e.target.value})}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Date of Birth</label>
                                        <input
                                            type="date"
                                            value={patientForm.date_of_birth}
                                            onChange={(e) => setPatientForm({...patientForm, date_of_birth: e.target.value})}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Gender</label>
                                        <select
                                            value={patientForm.gender}
                                            onChange={(e) => setPatientForm({...patientForm, gender: e.target.value})}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Blood Group</label>
                                        <select
                                            value={patientForm.blood_group}
                                            onChange={(e) => setPatientForm({...patientForm, blood_group: e.target.value})}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        >
                                            <option value="">Select Blood Group</option>
                                            <option value="A+">A+</option>
                                            <option value="A-">A-</option>
                                            <option value="B+">B+</option>
                                            <option value="B-">B-</option>
                                            <option value="AB+">AB+</option>
                                            <option value="AB-">AB-</option>
                                            <option value="O+">O+</option>
                                            <option value="O-">O-</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Address</label>
                                    <textarea
                                        value={patientForm.address}
                                        onChange={(e) => setPatientForm({...patientForm, address: e.target.value})}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                        rows="2"
                                    />
                                </div>

                                {/* Emergency Contact */}
                                <div className="border-t pt-4">
                                    <h3 className="font-medium mb-3">Emergency Contact</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Contact Name</label>
                                            <input
                                                type="text"
                                                value={patientForm.emergency_contact_name}
                                                onChange={(e) => setPatientForm({...patientForm, emergency_contact_name: e.target.value})}
                                                className="w-full p-2 border border-gray-300 rounded-md"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Contact Phone</label>
                                            <input
                                                type="tel"
                                                value={patientForm.emergency_contact_phone}
                                                onChange={(e) => setPatientForm({...patientForm, emergency_contact_phone: e.target.value})}
                                                className="w-full p-2 border border-gray-300 rounded-md"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Medical Information */}
                                <div className="border-t pt-4">
                                    <h3 className="font-medium mb-3">Medical Information</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Medical History</label>
                                            <textarea
                                                value={patientForm.medical_history}
                                                onChange={(e) => setPatientForm({...patientForm, medical_history: e.target.value})}
                                                className="w-full p-2 border border-gray-300 rounded-md"
                                                rows="3"
                                                placeholder="Previous conditions, surgeries, chronic diseases..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Allergies</label>
                                            <textarea
                                                value={patientForm.allergies}
                                                onChange={(e) => setPatientForm({...patientForm, allergies: e.target.value})}
                                                className="w-full p-2 border border-gray-300 rounded-md"
                                                rows="2"
                                                placeholder="Food allergies, drug allergies, environmental allergies..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex space-x-3 pt-6 border-t">
                                    <button
                                        type="submit"
                                        disabled={actionLoading === 'create-patient'}
                                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {actionLoading === 'create-patient' ? 'Creating Patient...' : 'Create Patient'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowNewPatientModal(false);
                                            resetPatientForm();
                                        }}
                                        className="flex-1 border border-gray-300 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            {/* Edit Patient Modal */}
            {showEditPatientModal && selectedPatient && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold">Edit Patient</h2>
                                <button 
                                    onClick={() => setShowEditPatientModal(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            
                            {error && (
                                <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleEditPatient} className="space-y-4">
                                {/* Basic Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">First Name *</label>
                                        <input
                                            type="text"
                                            value={editForm.first_name}
                                            onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Last Name *</label>
                                        <input
                                            type="text"
                                            value={editForm.last_name}
                                            onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Email *</label>
                                        <input
                                            type="email"
                                            value={editForm.email}
                                            onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Phone</label>
                                        <input
                                            type="tel"
                                            value={editForm.phone}
                                            onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Date of Birth</label>
                                        <input
                                            type="date"
                                            value={editForm.date_of_birth}
                                            onChange={(e) => setEditForm({...editForm, date_of_birth: e.target.value})}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Gender</label>
                                        <select
                                            value={editForm.gender}
                                            onChange={(e) => setEditForm({...editForm, gender: e.target.value})}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Blood Group</label>
                                        <select
                                            value={editForm.blood_group}
                                            onChange={(e) => setEditForm({...editForm, blood_group: e.target.value})}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        >
                                            <option value="">Select Blood Group</option>
                                            <option value="A+">A+</option>
                                            <option value="A-">A-</option>
                                            <option value="B+">B+</option>
                                            <option value="B-">B-</option>
                                            <option value="AB+">AB+</option>
                                            <option value="AB-">AB-</option>
                                            <option value="O+">O+</option>
                                            <option value="O-">O-</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Address</label>
                                    <textarea
                                        value={editForm.address}
                                        onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                        rows="2"
                                    />
                                </div>

                                {/* Emergency Contact */}
                                <div className="border-t pt-4">
                                    <h3 className="font-medium mb-3">Emergency Contact</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Contact Name</label>
                                            <input
                                                type="text"
                                                value={editForm.emergency_contact_name}
                                                onChange={(e) => setEditForm({...editForm, emergency_contact_name: e.target.value})}
                                                className="w-full p-2 border border-gray-300 rounded-md"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Contact Phone</label>
                                            <input
                                                type="tel"
                                                value={editForm.emergency_contact_phone}
                                                onChange={(e) => setEditForm({...editForm, emergency_contact_phone: e.target.value})}
                                                className="w-full p-2 border border-gray-300 rounded-md"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Medical Information */}
                                <div className="border-t pt-4">
                                    <h3 className="font-medium mb-3">Medical Information</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Medical History</label>
                                            <textarea
                                                value={editForm.medical_history}
                                                onChange={(e) => setEditForm({...editForm, medical_history: e.target.value})}
                                                className="w-full p-2 border border-gray-300 rounded-md"
                                                rows="3"
                                                placeholder="Previous conditions, surgeries, chronic diseases..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Allergies</label>
                                            <textarea
                                                value={editForm.allergies}
                                                onChange={(e) => setEditForm({...editForm, allergies: e.target.value})}
                                                className="w-full p-2 border border-gray-300 rounded-md"
                                                rows="2"
                                                placeholder="Food allergies, drug allergies, environmental allergies..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex space-x-3 pt-6 border-t">
                                    <button
                                        type="submit"
                                        disabled={actionLoading === 'edit-patient'}
                                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {actionLoading === 'edit-patient' ? 'Updating Patient...' : 'Update Patient'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowEditPatientModal(false)}
                                        className="flex-1 border border-gray-300 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Patient Details Modal */}
            {showPatientModal && selectedPatient && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-6xl h-[85vh] flex flex-col">
                        <div className="flex-shrink-0 p-6 border-b bg-gradient-to-r from-blue-50 to-blue-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center">
                                        <User className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-800">
                                            {selectedPatient.first_name} {selectedPatient.last_name}
                                        </h2>
                                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                            <span className="flex items-center">
                                                <UserCircle size={16} className="mr-1" />
                                                Patient ID: {selectedPatient.unique_id}
                                            </span>
                                            <span className="flex items-center">
                                                <Calendar size={16} className="mr-1" />
                                                Age: {calculateAge(selectedPatient.date_of_birth)} years
                                            </span>
                                            <span className="flex items-center">
                                                <Heart size={16} className="mr-1" />
                                                {selectedPatient.gender || 'Not specified'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => {
                                        setShowPatientModal(false);
                                        setSelectedPatient(null);
                                        setPatientAppointments([]);
                                        setMedicalRecords([]);
                                        setActiveDetailsTab('profile');
                                    }}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Tab Navigation with Action Buttons */}
                        <div className="flex-shrink-0 border-b bg-gray-50">
                            <div className="px-6 py-4 flex justify-between items-center">
                                <nav className="flex space-x-8 overflow-x-auto">
                                    {[
                                        { id: 'profile', label: 'Profile', icon: User },
                                        { id: 'medical-history', label: 'Medical History', icon: FileText },
                                        { id: 'records', label: 'Medical Records', icon: ClipboardList },
                                        { id: 'appointments', label: 'Appointments', icon: Calendar },
                                        { id: 'prescriptions', label: 'Prescriptions', icon: Pill }
                                    ].map((tab) => {
                                        const Icon = tab.icon;
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveDetailsTab(tab.id)}
                                                className={`py-3 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors whitespace-nowrap ${
                                                    activeDetailsTab === tab.id
                                                        ? 'border-blue-500 text-blue-600'
                                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                                }`}
                                            >
                                                <Icon size={16} />
                                                <span className="hidden sm:inline">{tab.label}</span>
                                                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                                            </button>
                                        );
                                    })}
                                </nav>
                                
                                {/* Action Buttons */}
                                <div className="flex space-x-3 ml-4">
                                    <button
                                        onClick={() => {
                                            setEditForm({
                                                first_name: selectedPatient.first_name || '',
                                                last_name: selectedPatient.last_name || '',
                                                email: selectedPatient.email || '',
                                                phone: selectedPatient.phone || '',
                                                date_of_birth: selectedPatient.date_of_birth ? new Date(selectedPatient.date_of_birth).toISOString().split('T')[0] : '',
                                                gender: selectedPatient.gender || '',
                                                blood_group: selectedPatient.blood_group || '',
                                                address: selectedPatient.address || '',
                                                emergency_contact_name: selectedPatient.emergency_contact_name || '',
                                                emergency_contact_phone: selectedPatient.emergency_contact_phone || '',
                                                medical_history: selectedPatient.medical_history || '',
                                                allergies: selectedPatient.allergies || ''
                                            });
                                            setShowPatientModal(false);
                                            setShowEditPatientModal(true);
                                        }}
                                        className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                                        title="Edit Patient"
                                    >
                                        <Edit size={16} />
                                        <span className="hidden md:inline">Edit</span>
                                    </button>
                                    <button
                                        onClick={() => handleDeletePatient(selectedPatient.id)}
                                        disabled={actionLoading === 'delete-patient'}
                                        className="bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                        title="Delete Patient"
                                    >
                                        {actionLoading === 'delete-patient' ? (
                                            <span className="text-sm">...</span>
                                        ) : (
                                            <>
                                                <Trash2 size={16} />
                                                <span className="hidden md:inline">Delete</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Tab Content - Fixed Height with Scroll */}
                        <div className="flex-1 overflow-hidden">
                            <div className="h-full overflow-y-auto p-6">
                                {detailsLoading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-gray-500">Loading patient details...</div>
                                    </div>
                                ) : (
                                    <div className="min-h-full">
                                        {/* Profile Tab */}
                                        {activeDetailsTab === 'profile' && (
                                            <div className="space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                                    {/* Basic Information */}
                                                    <div className="bg-white border rounded-lg p-4">
                                                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                                                            <User size={18} className="mr-2 text-blue-600" />
                                                            Basic Information
                                                        </h3>
                                                        <div className="space-y-2 text-sm">
                                                            <div className="flex justify-between">
                                                                <span className="font-medium">Email:</span>
                                                                <span className="text-gray-600 truncate ml-2">{selectedPatient.email}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="font-medium">Phone:</span>
                                                                <span className="text-gray-600">{selectedPatient.phone || 'N/A'}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="font-medium">Date of Birth:</span>
                                                                <span className="text-gray-600">{selectedPatient.date_of_birth ? new Date(selectedPatient.date_of_birth).toLocaleDateString() : 'N/A'}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="font-medium">Blood Group:</span>
                                                                <span className="text-gray-600 font-semibold">{selectedPatient.blood_group || 'N/A'}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Contact Information */}
                                                    <div className="bg-white border rounded-lg p-4">
                                                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                                                            <Phone size={18} className="mr-2 text-green-600" />
                                                            Contact & Address
                                                        </h3>
                                                        <div className="space-y-2 text-sm">
                                                            <div>
                                                                <span className="font-medium">Address:</span>
                                                                <p className="text-gray-600 mt-1 bg-gray-50 p-2 rounded text-xs">
                                                                    {selectedPatient.address || 'No address provided'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Emergency Contact */}
                                                    <div className="bg-white border rounded-lg p-4">
                                                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                                                            <AlertCircle size={18} className="mr-2 text-red-600" />
                                                            Emergency Contact
                                                        </h3>
                                                        <div className="space-y-2 text-sm">
                                                            <div className="flex justify-between">
                                                                <span className="font-medium">Name:</span>
                                                                <span className="text-gray-600 truncate ml-2">{selectedPatient.emergency_contact_name || 'N/A'}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="font-medium">Phone:</span>
                                                                <span className="text-gray-600">{selectedPatient.emergency_contact_phone || 'N/A'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Medical History Tab */}
                                        {activeDetailsTab === 'medical-history' && (
                                            <div className="space-y-6">
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                    {/* Medical History */}
                                                    <div className="bg-white border rounded-lg p-4">
                                                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                                                            <Stethoscope size={18} className="mr-2 text-blue-600" />
                                                            Medical History
                                                        </h3>
                                                        <div className="text-sm bg-blue-50 p-4 rounded border-l-4 border-blue-200 max-h-48 overflow-y-auto">
                                                            {selectedPatient.medical_history || 'No medical history recorded'}
                                                        </div>
                                                    </div>

                                                    {/* Allergies */}
                                                    <div className="bg-white border rounded-lg p-4">
                                                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                                                            <AlertCircle size={18} className="mr-2 text-red-600" />
                                                            Known Allergies
                                                        </h3>
                                                        <div className="text-sm bg-red-50 p-4 rounded border-l-4 border-red-200 max-h-48 overflow-y-auto">
                                                            {selectedPatient.allergies || 'No known allergies'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Medical Records Tab */}
                                        {activeDetailsTab === 'records' && (
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <h3 className="font-semibold text-gray-800 flex items-center">
                                                        <ClipboardList size={18} className="mr-2 text-purple-600" />
                                                        Medical Records & Files
                                                    </h3>
                                                    <button
                                                        onClick={() => setShowFileUpload(true)}
                                                        className="bg-purple-600 text-white px-3 py-2 rounded-md hover:bg-purple-700 transition-colors flex items-center space-x-2 text-sm"
                                                    >
                                                        <Plus size={16} />
                                                        <span>Upload File</span>
                                                    </button>
                                                </div>
                                                
                                                {medicalRecords.length === 0 ? (
                                                    <div className="text-gray-500 bg-gray-50 p-8 rounded-lg text-center">
                                                        <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                                                        <p>No medical records found</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        {medicalRecords.map((record) => (
                                                            <div key={record.id} className="bg-white border rounded-lg p-4 shadow-sm">
                                                                <div className="flex justify-between items-start mb-3">
                                                                    <div>
                                                                        <div className="font-medium text-gray-900">{record.diagnosis || 'Medical Record'}</div>
                                                                        <div className="text-sm text-gray-500">
                                                                            {record.doctor_first_name && (
                                                                                <>Dr. {record.doctor_first_name} {record.doctor_last_name} • </>
                                                                            )}
                                                                            {new Date(record.record_date || record.created_at).toLocaleDateString()}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex space-x-2">
                                                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                                            {record.file_type || 'Record'}
                                                                        </span>
                                                                        {record.file_path && (
                                                                            <button
                                                                                onClick={() => window.open(`${API_CONFIG.BASE_URL}/api/files/${record.file_name}`, '_blank')}
                                                                                className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                                                                                title="View File"
                                                                            >
                                                                                View PDF
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {record.prescription && (
                                                                    <div className="mb-2">
                                                                        <span className="font-medium text-sm">Prescription:</span>
                                                                        <p className="text-sm text-gray-600 bg-green-50 p-2 rounded mt-1">{record.prescription}</p>
                                                                    </div>
                                                                )}
                                                                {record.notes && (
                                                                    <div className="mb-2">
                                                                        <span className="font-medium text-sm">Notes:</span>
                                                                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded mt-1">{record.notes}</p>
                                                                    </div>
                                                                )}
                                                                {record.lab_results && (
                                                                    <div className="mb-2">
                                                                        <span className="font-medium text-sm">Lab Results:</span>
                                                                        <p className="text-sm text-gray-600 bg-yellow-50 p-2 rounded mt-1">{record.lab_results}</p>
                                                                    </div>
                                                                )}
                                                                {record.file_name && (
                                                                    <div className="flex items-center space-x-2 mt-2 p-2 bg-blue-50 rounded">
                                                                        <FileText size={16} className="text-blue-600" />
                                                                        <span className="text-sm text-gray-700">{record.file_name}</span>
                                                                        {record.file_size && (
                                                                            <span className="text-xs text-gray-500">({(record.file_size / 1024).toFixed(1)} KB)</span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Appointments Tab */}
                                        {activeDetailsTab === 'appointments' && (
                                            <div className="space-y-4">
                                                <h3 className="font-semibold text-gray-800 flex items-center">
                                                    <Calendar size={18} className="mr-2 text-green-600" />
                                                    Appointment History
                                                </h3>
                                                {appointmentLoading ? (
                                                    <div className="flex items-center justify-center py-8">
                                                        <div className="text-gray-500">Loading appointment history...</div>
                                                    </div>
                                                ) : patientAppointments.length === 0 ? (
                                                    <div className="text-gray-500 bg-gray-50 p-8 rounded-lg text-center">
                                                        <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
                                                        <p>No appointments found</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {patientAppointments.map((appointment) => (
                                                            <div key={appointment.id} className="border rounded-lg p-4 bg-white shadow-sm">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <div>
                                                                        <div className="font-medium">
                                                                            {new Date(appointment.appointment_date).toLocaleDateString()} at{' '}
                                                                            {appointment.appointment_time}
                                                                        </div>
                                                                        <div className="text-sm text-gray-600 capitalize">
                                                                            {appointment.appointment_type}
                                                                        </div>
                                                                        {appointment.doctor_first_name && (
                                                                            <div className="text-sm text-gray-500">
                                                                                Dr. {appointment.doctor_first_name} {appointment.doctor_last_name}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                                        appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                                        appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                                                        appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                        'bg-red-100 text-red-800'
                                                                    }`}>
                                                                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                                                    </span>
                                                                </div>
                                                                {appointment.notes && (
                                                                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                                                        <span className="font-medium">Notes:</span> {appointment.notes}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Prescriptions Tab */}
                                        {activeDetailsTab === 'prescriptions' && (
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <h3 className="font-semibold text-gray-800 flex items-center">
                                                        <Pill size={18} className="mr-2 text-orange-600" />
                                                        Current & Past Prescriptions
                                                    </h3>
                                                    <button
                                                        onClick={() => setShowFileUpload(true)}
                                                        className="bg-orange-600 text-white px-3 py-2 rounded-md hover:bg-orange-700 transition-colors flex items-center space-x-2 text-sm"
                                                    >
                                                        <Plus size={16} />
                                                        <span>Add Prescription</span>
                                                    </button>
                                                </div>
                                                
                                                {medicalRecords.filter(record => record.prescription || record.file_type === 'prescription').length === 0 ? (
                                                    <div className="text-gray-500 bg-gray-50 p-8 rounded-lg text-center">
                                                        <Pill size={48} className="mx-auto mb-4 text-gray-300" />
                                                        <p>No prescriptions found</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        {medicalRecords
                                                            .filter(record => record.prescription || record.file_type === 'prescription')
                                                            .map((record) => (
                                                                <div key={record.id} className="bg-white border rounded-lg p-4 shadow-sm">
                                                                    <div className="flex justify-between items-start mb-3">
                                                                        <div>
                                                                            <div className="font-medium text-gray-900">
                                                                                {record.file_name ? record.file_name : 'Digital Prescription'}
                                                                            </div>
                                                                            <div className="text-sm text-gray-500">
                                                                                {record.doctor_first_name && (
                                                                                    <>Prescribed by Dr. {record.doctor_first_name} {record.doctor_last_name}<br /></>
                                                                                )}
                                                                                Date: {new Date(record.record_date || record.created_at).toLocaleDateString()}
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex space-x-2">
                                                                            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                                                                Prescription
                                                                            </span>
                                                                            {record.file_path && (
                                                                                <button
                                                                                    onClick={() => window.open(`${API_CONFIG.BASE_URL}/api/files/${record.file_name}`, '_blank')}
                                                                                    className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                                                                                    title="View Prescription PDF"
                                                                                >
                                                                                    View PDF
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    {record.prescription && (
                                                                        <div className="bg-green-50 border-l-4 border-green-200 p-3 rounded mb-2">
                                                                            <p className="text-sm text-gray-700 font-mono whitespace-pre-wrap">{record.prescription}</p>
                                                                        </div>
                                                                    )}
                                                                    {record.diagnosis && (
                                                                        <div className="text-sm">
                                                                            <span className="font-medium">For condition:</span>
                                                                            <span className="text-gray-600 ml-2">{record.diagnosis}</span>
                                                                        </div>
                                                                    )}
                                                                    {record.file_name && (
                                                                        <div className="flex items-center space-x-2 mt-2 p-2 bg-orange-50 rounded">
                                                                            <Pill size={16} className="text-orange-600" />
                                                                            <span className="text-sm text-gray-700">{record.file_name}</span>
                                                                            {record.file_size && (
                                                                                <span className="text-xs text-gray-500">({(record.file_size / 1024).toFixed(1)} KB)</span>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-md">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Upload Medical File</h3>
                                <button 
                                    onClick={() => setShowFileUpload(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">File Type</label>
                                    <select 
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                        id="fileType"
                                    >
                                        <option value="medical_record">Medical Record</option>
                                        <option value="prescription">Prescription</option>
                                        <option value="lab_result">Lab Result</option>
                                        <option value="xray">X-Ray</option>
                                        <option value="scan">CT/MRI Scan</option>
                                        <option value="report">Medical Report</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-2">Select PDF File</label>
                                    <input 
                                        type="file" 
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                        id="fileInput"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Supported formats: PDF, JPG, PNG (max 10MB)
                                    </p>
                                </div>
                                
                                <div className="flex space-x-3 pt-4">
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
                                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                                    >
                                        {uploadingFile ? 'Uploading...' : 'Upload File'}
                                    </button>
                                    <button
                                        onClick={() => setShowFileUpload(false)}
                                        className="flex-1 border border-gray-300 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export default PatientTab;
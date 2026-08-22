import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { createPortal } from "react-dom";
import { patientApi, appointmentApi } from "../../lib/api";
import * as dashboardCache from "../../lib/dashboardCache";
import { API_CONFIG } from "../../config/api";


import { useDoctor } from "../../hooks/useDoctor";
import {
    User, Phone, Mail, Calendar, Heart, AlertCircle, AlertTriangle, Plus, Edit2, Edit, Edit3, Eye, X, Save,
    FileText, Clock, Trash2, Stethoscope, Pill, ClipboardList, UserCircle, Search,
    Users, Activity, Filter, ChevronRight, ArrowRight, ExternalLink, TrendingUp, Zap,
    MoreHorizontal, Download, Share2, Shield, Info, MapPin, RefreshCw, Scan, Mic,
    Link, Camera, Printer, Upload
} from "lucide-react";
import {
    WhatsappShareButton, WhatsappIcon,
    EmailShareButton, EmailIcon,
    TelegramShareButton, TelegramIcon,
    TwitterShareButton, XIcon,
    FacebookShareButton, FacebookIcon,
    LinkedinShareButton, LinkedinIcon,
    RedditShareButton, RedditIcon,
    PinterestShareButton, PinterestIcon,
    PocketShareButton, PocketIcon,
    LineShareButton, LineIcon,
    ViberShareButton, ViberIcon,
    FacebookMessengerShareButton, FacebookMessengerIcon
} from "react-share";
import { toast } from "react-hot-toast";
// Helper components for a more modern UI
const PatientSkeleton = () => (
    <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg animate-pulse">
        <div className="flex items-center space-x-3 flex-1">
            <div className="w-10 h-10 bg-muted rounded-lg flex-shrink-0"></div>
            <div className="space-y-2 flex-1">
                <div className="h-3 bg-muted rounded w-36"></div>
                <div className="flex space-x-2">
                    <div className="h-2.5 bg-muted/50 rounded w-20"></div>
                    <div className="h-2.5 bg-muted/50 rounded w-16"></div>
                </div>
            </div>
        </div>
        <div className="w-16 h-7 bg-muted/50 rounded-lg"></div>
    </div>
);

const Portal = ({ children }) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    return mounted ? createPortal(children, document.body) : null;
};

// eslint-disable-next-line no-unused-vars
const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-card rounded-lg p-4 border border-border flex items-center gap-4">
        <div className={`p-2.5 ${color}/10 rounded-lg shrink-0`}>
            <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
        </div>
        <div className="min-w-0">
            <p className="text-xl font-bold text-foreground leading-none">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        </div>
    </div>
);

// Helper functions for generating print HTML
const generatePrescriptionFileHTML = (record, index, API_BASE_URL, formatDate) => {
    const fileUrl = `${API_BASE_URL}/api/files/${record.file_name}`;
    const isImage = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(record.file_name);
    const isPdf = /\.pdf$/i.test(record.file_name);

    let fileContent;
    if (isImage) {
        fileContent = `<img src="${fileUrl}" alt="Prescription ${index + 1}" />`;
    } else if (isPdf) {
        fileContent = `<iframe src="${fileUrl}" type="application/pdf"></iframe>`;
    } else {
        fileContent = `<p>File type not supported for preview. <a href="${fileUrl}" target="_blank">Download file</a></p>`;
    }

    return `
        <div class="prescription-file">
            <h2>Prescription #${index + 1}</h2>
            <p><strong>File:</strong> ${record.file_name}</p>
            <p><strong>Date:</strong> ${formatDate(record.record_date || record.created_at)}</p>
            <div class="file-container">
                ${fileContent}
            </div>
        </div>
    `;
};

const generatePrintAllHTML = (prescriptions, patient, API_BASE_URL, formatDate) => {
    const prescriptionHTML = prescriptions.map((record, index) =>
        generatePrescriptionFileHTML(record, index, API_BASE_URL, formatDate)
    ).join('');

    return `
        <html>
            <head>
                <title>Prescriptions - ${patient.first_name} ${patient.last_name}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; margin: 0; }
                    h1 { color: #4F46E5; border-bottom: 3px solid #4F46E5; padding-bottom: 10px; margin-bottom: 20px; }
                    .header-info { margin-bottom: 30px; }
                    .prescription-file { margin: 30px 0; page-break-inside: avoid; page-break-after: always; }
                    .prescription-file:last-child { page-break-after: auto; }
                    .prescription-file h2 { color: #6366F1; margin-bottom: 15px; }
                    .file-container { border: 2px solid #E5E7EB; border-radius: 10px; padding: 10px; background: white; }
                    .file-container img { max-width: 100%; height: auto; display: block; }
                    .file-container iframe { width: 100%; min-height: 800px; border: none; }
                    @media print { 
                        .no-print { display: none; }
                        body { padding: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="header-info no-print">
                    <h1>Prescription Records - ${patient.first_name} ${patient.last_name}</h1>
                    <p><strong>Patient ID:</strong> ${patient.unique_id}</p>
                    <p><strong>Print Date:</strong> ${new Date().toLocaleDateString()}</p>
                    <button onclick="window.print()" style="margin: 20px 0; padding: 10px 20px; background: #4F46E5; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">Print All</button>
                </div>
                ${prescriptionHTML}
            </body>
        </html>
    `;
};

const generateSinglePrescriptionHTML = (record, index, patient, API_BASE_URL, formatDate) => {
    const fileUrl = `${API_BASE_URL}/api/files/${record.file_name}`;
    const isImage = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(record.file_name);
    const isPdf = /\.pdf$/i.test(record.file_name);

    let fileContent;
    if (isImage) {
        fileContent = `<img src="${fileUrl}" alt="Prescription ${index + 1}" />`;
    } else if (isPdf) {
        fileContent = `<iframe src="${fileUrl}" type="application/pdf"></iframe>`;
    } else {
        fileContent = `<p>File type not supported for preview. <a href="${fileUrl}" target="_blank">Download file</a></p>`;
    }

    return `
        <html>
            <head>
                <title>Prescription #${index + 1} - ${patient.first_name} ${patient.last_name}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; margin: 0; }
                    h1 { color: #4F46E5; border-bottom: 3px solid #4F46E5; padding-bottom: 10px; margin-bottom: 20px; }
                    .header-info { margin-bottom: 30px; }
                    .file-container { border: 2px solid #E5E7EB; border-radius: 10px; padding: 10px; background: white; }
                    .file-container img { max-width: 100%; height: auto; display: block; margin: 0 auto; }
                    .file-container iframe { width: 100%; min-height: 800px; border: none; }
                    @media print { 
                        .no-print { display: none; }
                        body { padding: 0; }
                        .file-container { border: none; padding: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="header-info no-print">
                    <h1>Prescription #${index + 1}</h1>
                    <p><strong>Patient:</strong> ${patient.first_name} ${patient.last_name}</p>
                    <p><strong>Patient ID:</strong> ${patient.unique_id}</p>
                    <p><strong>File:</strong> ${record.file_name}</p>
                    <p><strong>Date:</strong> ${formatDate(record.record_date || record.created_at)}</p>
                    <button onclick="window.print()" style="margin: 20px 0; padding: 10px 20px; background: #4F46E5; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">Print</button>
                </div>
                <div class="file-container">
                    ${fileContent}
                </div>
            </body>
        </html>
    `;
};

// Helper function to generate print HTML for a single medical document
const generateMedicalDocumentHTML = (record, index, patient, API_BASE_URL, formatDate) => {
    const fileUrl = `${API_BASE_URL}/api/files/${record.file_name}`;
    const isImage = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(record.file_name);
    const isPdf = /\.pdf$/i.test(record.file_name);

    let fileContent = '';

    if (isImage) {
        fileContent = `<img src="${fileUrl}" alt="Document ${index + 1}" />`;
    } else if (isPdf) {
        fileContent = `<iframe src="${fileUrl}" type="application/pdf"></iframe>`;
    } else {
        fileContent = `<p>File type not supported for preview. <a href="${fileUrl}" target="_blank">Download file</a></p>`;
    }

    const docType = record.file_type ? record.file_type.replace('_', ' ').toUpperCase() : 'DOCUMENT';

    return `
        <html>
            <head>
                <title>${docType} #${index + 1} - ${patient.first_name} ${patient.last_name}</title>
                <style>
                    body { font-family: 'Inter', sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; color: #1e293b; }
                    h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; font-size: 24px; }
                    .header-info { margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
                    .header-info p { margin: 8px 0; font-size: 14px; }
                    .file-container { border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; background: white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
                    .file-container img { max-width: 100%; height: auto; display: block; margin: 0 auto; border-radius: 8px; }
                    .file-container iframe { width: 100%; min-height: 900px; border: none; border-radius: 8px; }
                    .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; background: #e0f2fe; color: #0284c7; margin-bottom: 10px; }
                    @media print { 
                        .no-print { display: none; }
                        body { padding: 0; margin: 0; }
                        .file-container { border: none; padding: 0; box-shadow: none; }
                        .header-info { border: none; background: none; padding: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="header-info no-print">
                    <span class="badge">${docType}</span>
                    <h1>${docType} #${index + 1}</h1>
                    <p><strong>Patient:</strong> ${patient.first_name} ${patient.last_name}</p>
                    <p><strong>Patient ID:</strong> ${patient.unique_id}</p>
                    <p><strong>File:</strong> ${record.file_name}</p>
                    <p><strong>Date:</strong> ${formatDate(record.record_date || record.created_at)}</p>
                    <button onclick="window.print()" class="no-print" style="margin-top: 15px; padding: 10px 20px; background: #0f172a; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">Print Document</button>
                    <a href="${fileUrl}" target="_blank" class="no-print" style="display: inline-block; margin-top: 15px; margin-left: 10px; padding: 10px 20px; background: white; color: #0f172a; border: 1px solid #cbd5e1; border-radius: 8px; text-decoration: none; font-weight: bold;">Download</a>
                </div>
                <div class="file-container">
                    ${fileContent}
                </div>
            </body>
        </html>
    `;
};

const DocumentCard = memo(({ record, index, patient, API_BASE_URL, formatDate, onShare, onDelete }) => {
    const [previewError, setPreviewError] = useState(false);
    const isImage = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(record.file_name);
    const isPdf = /\.pdf$/i.test(record.file_name);

    return (
        <div className="group bg-card hover:bg-card/50 border border-border/50 hover:border-indigo-500/30 rounded-[1.5rem] p-5 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 relative overflow-hidden flex flex-col h-full">
            {/* Decor */}
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:rotate-12 transition-transform duration-500">
                <FileText size={80} />
            </div>

            <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="flex items-center space-x-3">
                    <div className={`p-2.5 rounded-xl ${['scan', 'xray', 'imaging'].includes(record.file_type) ? 'bg-purple-500/10 text-purple-500' :
                        record.file_type === 'lab_result' ? 'bg-emerald-500/10 text-emerald-500' :
                            'bg-blue-500/10 text-blue-500'
                        }`}>
                        {['scan', 'xray', 'imaging'].includes(record.file_type) ? <Zap size={18} /> :
                            record.file_type === 'lab_result' ? <Activity size={18} /> :
                                <FileText size={18} />}
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest leading-none mb-1">
                            {record.file_type?.replace('_', ' ') || 'Document'}
                        </p>
                        <p className="text-xs font-bold text-foreground leading-none">
                            {formatDate(record.created_at || record.record_date)}
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-1">
                    <button
                        onClick={() => window.open(`${API_BASE_URL}/api/files/${record.file_name}`, '_blank')}
                        className="p-2 text-muted-foreground hover:text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-colors"
                        title="View Document"
                    >
                        <Eye size={16} />
                    </button>
                    <button
                        onClick={() => {
                            window.open(`${API_BASE_URL}/api/files/${record.file_name}`, '_blank');
                            toast.success('Downloading document...');
                        }}
                        className="p-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="Download Document"
                    >
                        <Download size={16} />
                    </button>
                    <button
                        onClick={() => {
                            const printWindow = window.open('', '_blank');
                            const htmlContent = generateMedicalDocumentHTML(record, index, patient, API_BASE_URL, formatDate);
                            if (printWindow) {
                                printWindow.document.write(htmlContent);
                                printWindow.document.close();
                            }
                        }}
                        className="p-2 text-muted-foreground hover:text-purple-500 hover:bg-purple-500/10 rounded-lg transition-colors"
                        title="Print Document"
                    >
                        <Printer size={16} />
                    </button>
                    <button
                        onClick={() => onShare(record)}
                        className="p-2 text-muted-foreground hover:text-green-500 hover:bg-green-500/10 rounded-lg transition-colors"
                        title="Share Document"
                    >
                        <Share2 size={16} />
                    </button>
                    <button
                        onClick={() => onDelete(record)}
                        className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Delete Document"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            <div className="relative z-10 space-y-3 flex-grow">
                {/* File Preview Section */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 border border-border/60 rounded-xl p-3 relative overflow-hidden mb-3">
                    <div className="bg-white dark:bg-slate-950 rounded-lg overflow-hidden border border-border/40 shadow-sm">
                        {isImage && !previewError ? (
                            <div
                                className="cursor-pointer h-40 group/img relative"
                                onClick={() => window.open(`${API_BASE_URL}/api/files/${record.file_name}`, '_blank')}
                            >
                                <img
                                    src={`${API_BASE_URL}/api/files/${record.file_name}`}
                                    alt={record.file_name}
                                    className="w-full h-full object-contain bg-slate-50 dark:bg-slate-900 transition-transform group-hover/img:scale-105"
                                    onError={() => setPreviewError(true)}
                                />
                            </div>
                        ) : previewError ? (
                            <div className="w-full h-40 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                                <div className="text-center">
                                    <FileText size={40} className="mx-auto text-muted-foreground/30 mb-2" />
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Preview not available</p>
                                </div>
                            </div>
                        ) : isPdf ? (
                            <iframe
                                src={`${API_BASE_URL}/api/files/${record.file_name}#toolbar=0`}
                                className="w-full h-40 bg-slate-50 dark:bg-slate-900"
                                title={`Document ${index + 1}`}
                            />
                        ) : (
                            <div className="w-full h-40 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                                <div className="text-center">
                                    <FileText size={40} className="mx-auto text-muted-foreground/30 mb-2" />
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Preview not available</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-bold text-foreground line-clamp-2 w-full break-all" title={record.file_name}>
                        {record.file_name}
                    </h4>
                </div>

                <div className="pt-3 border-t border-border/40 flex items-center justify-between">
                    {record.doctor_first_name ? (
                        <div className="flex items-center space-x-1.5">
                            <UserCircle size={12} className="text-muted-foreground/60" />
                            <span className="text-[10px] font-bold text-muted-foreground">
                                Dr. {record.doctor_first_name}
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-1.5">
                            <UserCircle size={12} className="text-muted-foreground/60" />
                            <span className="text-[10px] font-bold text-muted-foreground">
                                System Upload
                            </span>
                        </div>
                    )}
                    <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${isPdf
                        ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        }`}>
                        {isPdf ? 'PDF' : 'IMAGE'}
                    </div>
                </div>
            </div>
        </div>
    );
});

const PatientTab = memo(() => {
    const { doctorId } = useDoctor();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionLoading, setActionLoading] = useState(null);
    const [appointmentLoading] = useState(false);

    // Modal states
    const [showNewPatientModal, setShowNewPatientModal] = useState(false);
    const [showEditPatientModal, setShowEditPatientModal] = useState(false);
    const [showPatientModal, setShowPatientModal] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [patientAppointments, setPatientAppointments] = useState([]);
    const [medicalRecords, setMedicalRecords] = useState([]);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [activeDetailsTab, setActiveDetailsTab] = useState('profile');
    const [uploadingFile, setUploadingFile] = useState(null);
    const [showFileUpload, setShowFileUpload] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [patientToDelete, setPatientToDelete] = useState(null);
    const [recordToDelete, setRecordToDelete] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = React.useRef(null);
    const chunksRef = React.useRef([]);

    // Document Tab States
    const [documentSearch, setDocumentSearch] = useState('');
    const [documentFilter, setDocumentFilter] = useState('all');
    const [showDocumentDeleteConfirm, setShowDocumentDeleteConfirm] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [activeShareRecord, setActiveShareRecord] = useState(null);

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



    const fetchPatients = useCallback(async () => {
        if (!doctorId) return;
        try {
            // STEP 1: Load from cache INSTANTLY
            const cacheKey = `patient_list_${doctorId}`;
            const cached = await dashboardCache.getCachedData(cacheKey);
            if (cached) {
                setPatients(cached);
                setLoading(false); // Hide spinner if we have cache
            } else {
                setLoading(true);
            }

            // STEP 2: Fetch fresh data
            const data = await patientApi.getAll(doctorId);
            const freshPatients = data.data || [];
            setPatients(freshPatients);

            // Persist to cache
            await dashboardCache.saveData(cacheKey, freshPatients);

            setError(null);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching patients:', err);
        } finally {
            setLoading(false);
        }
    }, [doctorId]);

    useEffect(() => {
        fetchPatients();
    }, [doctorId, fetchPatients]);

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
        const totalPatients = patients.length;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const newThisMonth = patients.filter(p => p.created_at && new Date(p.created_at) > thirtyDaysAgo).length;
        const activePatients = patients.filter(p => (p.total_appointments || 0) > 0).length;
        const recurringPatients = patients.filter(p => (p.total_appointments || 0) > 1).length; // Example: more than one appointment

        return { totalPatients, newThisMonth, activePatients, recurringPatients };
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
            await patientApi.create(patientForm);

            // Refresh the patient list from the server to ensure consistency
            await fetchPatients();

            setShowNewPatientModal(false);
            resetPatientForm();
            setError(null);

            toast.success('Patient registered successfully!');
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    }, [patientForm, resetPatientForm, fetchPatients]);



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

            await response.json();

            // Refresh medical records to show the new file
            const updatedRecords = await patientApi.getMedicalHistory(selectedPatient.id);
            setMedicalRecords(updatedRecords.data || []);

            setError(null);
            setShowFileUpload(false);
            toast.success('Document uploaded successfully');
        } catch (err) {
            setError(err.message || 'Failed to upload file');
            toast.error(err.message || 'Failed to upload file');
        } finally {
            setUploadingFile(null);
        }
    }, [selectedPatient, doctorId]);

    const handleStartRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const file = new File([blob], `voice_note_${Date.now()}.webm`, { type: 'audio/webm' });
                handleFileUpload(file, 'medical_record');

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            toast.success('Recording started...');
        } catch (err) {
            console.error('Error accessing microphone:', err);
            toast.error('Could not access microphone');
        }
    }, [handleFileUpload]);

    const handleStopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            toast.success('Recording saved and uploading...');
        }
    }, [isRecording]);

    const handleShareFile = useCallback((record) => {
        setActiveShareRecord(record);
        setShowShareMenu(true);
    }, []);

    const executeShare = async (method) => {
        if (!activeShareRecord) return;

        const fileUrl = `${API_CONFIG.BASE_URL}/api/files/${activeShareRecord.file_name}`;
        const text = `Medical record for ${selectedPatient?.first_name} ${selectedPatient?.last_name}: ${activeShareRecord.original_name || 'Document'}`;

        switch (method) {
            case 'copy':
                await navigator.clipboard.writeText(fileUrl);
                toast.success('Link copied to clipboard');
                break;
            case 'native':
                if (navigator.share) {
                    try {
                        await navigator.share({
                            title: activeShareRecord.original_name || 'Medical Record',
                            text: text,
                            url: fileUrl
                        });
                    } catch (err) {
                        if (err.name !== 'AbortError') toast.error('Sharing failed');
                    }
                }
                break;
            default:
                break;
        }
        setShowShareMenu(false);
    };

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
            // STEP 1: Load from cache
            const cacheKey = `patient_details_${patient.id}`;
            const cached = await dashboardCache.getCachedData(cacheKey);
            if (cached) {
                setPatientAppointments(cached.appointments || []);
                setMedicalRecords(cached.records || []);
                setShowPatientModal(true); // Show modal immediately with cached data
                setDetailsLoading(false); // Hide spinner
            }

            // STEP 2: Fetch comprehensive patient information
            const [detailsResult, appointmentsResult, medicalHistoryResult] = await Promise.all([
                patientApi.getById(patient.id),
                appointmentApi.getByPatient(patient.id),
                patientApi.getMedicalHistory(patient.id)
            ]);

            const freshDetails = detailsResult.data;
            const freshAppointments = appointmentsResult.data || [];
            const freshRecords = medicalHistoryResult.data || [];
            setPatientAppointments(freshAppointments);
            setMedicalRecords(freshRecords);

            // Persist to cache
            await dashboardCache.saveData(cacheKey, {
                details: freshDetails,
                appointments: freshAppointments,
                records: freshRecords
            });

            if (!cached) setShowPatientModal(true);
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
            allergies: patient.allergies || '',
        });
        setShowEditPatientModal(true);
    }, []);

    const handleDeletePatient = useCallback((patientId) => {
        setPatientToDelete(patientId);
        setShowDeleteConfirm(true);
    }, []);

    const confirmDeletePatient = useCallback(async () => {
        if (!patientToDelete) return;

        try {
            setActionLoading('delete-patient');
            await patientApi.delete(patientToDelete);
            setPatients(prev => prev.filter(p => p.id !== patientToDelete));
            setShowDeleteConfirm(false);
            setPatientToDelete(null);
            setShowPatientModal(false);
            setSelectedPatient(null);
            setError(null);
            toast.success('Patient record deleted successfully');
        } catch (err) {
            setError(err.message);
            toast.error('Failed to delete patient record');
        } finally {
            setActionLoading(null);
        }
    }, [patientToDelete]);

    const handleDeleteRecord = useCallback((record) => {
        setRecordToDelete(record);
        setShowDocumentDeleteConfirm(true);
    }, []);

    const confirmDeleteRecord = useCallback(async () => {
        if (!recordToDelete || !selectedPatient) return;

        try {
            setActionLoading('delete-record');
            await patientApi.deleteMedicalRecord(selectedPatient.id, recordToDelete.id);

            // Update local state
            setMedicalRecords(prev => prev.filter(r => r.id !== recordToDelete.id));

            setShowDocumentDeleteConfirm(false);
            setRecordToDelete(null);
            toast.success('Document deleted successfully');
        } catch (err) {
            console.error('Error deleting document:', err);
            toast.error('Failed to delete document');
        } finally {
            setActionLoading(null);
        }
    }, [recordToDelete, selectedPatient]);


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
            <div className="space-y-4 animate-in fade-in duration-500">
                <div className="h-8 bg-muted rounded w-40 animate-pulse"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse"></div>
                    ))}
                </div>
                <div className="space-y-2">
                    {[1, 2, 3].map(i => <PatientSkeleton key={i} />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5 pb-12 animate-in fade-in duration-300">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-foreground">Patients</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Manage patient records and medical history</p>
                </div>
                <button
                    onClick={() => setShowNewPatientModal(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 active:scale-95 transition-all"
                >
                    <Plus size={16} />
                    <span>New Patient</span>
                </button>
            </div>

            {/* Statistics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StatCard
                    icon={Users}
                    label="Total patients"
                    value={patientStats.totalPatients}
                    subLabel="Medical base"
                    color="bg-indigo-600"
                />
                <StatCard
                    icon={RefreshCw}
                    label="Recurring patients"
                    value={patientStats.recurringPatients}
                    subLabel="2+ appointments"
                    color="bg-purple-500"
                />
                <StatCard
                    icon={Activity}
                    label="Active patients"
                    value={patientStats.activePatients}
                    subLabel="Current cycle"
                    color="bg-amber-500"
                />
            </div>

            {/* Search */}
            <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                <input
                    type="text"
                    placeholder="Search by name, patient ID or phone..."
                    className="w-full pl-9 pr-9 py-2.5 bg-card border border-border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X size={15} />
                    </button>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={16} className="text-rose-500 shrink-0" />
                        <p className="text-sm text-rose-700 dark:text-rose-400">{error}</p>
                    </div>
                    <button
                        onClick={() => { setError(null); fetchPatients(); }}
                        className="px-3 py-1.5 bg-card text-foreground rounded-md text-xs font-semibold border border-border hover:bg-muted transition-all"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Patients List Section */}
            <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-muted-foreground">All patients ({filteredPatients.length})</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredPatients.length === 0 ? (
                        <div className="col-span-full border border-border rounded-xl bg-card text-center py-12">
                            <User className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground">
                                {searchTerm ? 'No patients found' : 'No patients registered yet'}
                            </p>
                            {!searchTerm && (
                                <button
                                    onClick={() => { resetPatientForm(); setShowNewPatientModal(true); }}
                                    className="mt-3 px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    Add first patient
                                </button>
                            )}
                        </div>
                    ) : (
                        filteredPatients.map((patient) => (
                            <div
                                key={patient.id}
                                className="bg-card border border-border rounded-xl p-4 flex flex-col gap-4 hover:border-indigo-500/30 hover:shadow-sm transition-all group h-full"
                            >
                                {/* Top Row: Avatar & Actions */}
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {/* Avatar */}
                                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-sm font-bold shrink-0">
                                            {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
                                        </div>

                                        {/* Name & ID */}
                                        <div className="min-w-0">
                                            <h4 className="text-sm font-bold text-foreground truncate">
                                                {patient.first_name} {patient.last_name}
                                            </h4>
                                            <div className="mt-0.5">
                                                <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded">
                                                    {patient.unique_id}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 shrink-0 ml-2">
                                        <button
                                            onClick={() => handleViewDetails(patient)}
                                            disabled={actionLoading === 'loading-details'}
                                            className="p-1.5 text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md transition-colors"
                                            title="View details"
                                        >
                                            {actionLoading === 'loading-details' && selectedPatient?.id === patient.id ? (
                                                <RefreshCw size={15} className="animate-spin text-indigo-500" />
                                            ) : (
                                                <Eye size={15} />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => openEditModal(patient)}
                                            className="p-1.5 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-md transition-colors"
                                            title="Edit patient"
                                        >
                                            <Edit3 size={15} />
                                        </button>
                                    </div>
                                </div>

                                {/* Bottom Row: Info & Stats */}
                                <div className="flex items-end justify-between mt-auto pt-2 border-t border-border/50">
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={12} className="opacity-70" /> {calculateAge(patient.date_of_birth)} yrs
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <User size={12} className="opacity-70" /> {patient.gender}
                                        </span>
                                        <span className="flex items-center gap-1 text-rose-500 font-medium">
                                            <Heart size={12} className="opacity-70" /> {patient.blood_group || 'N/A'}
                                        </span>
                                        {patient.email && (
                                            <span className="flex items-center gap-1 truncate max-w-[140px]" title={patient.email}>
                                                <Mail size={12} className="opacity-70" /> {patient.email}
                                            </span>
                                        )}
                                    </div>

                                    {/* Appointments count */}
                                    <div className="text-right shrink-0 pl-3">
                                        <p className="text-sm font-bold text-foreground leading-none">{patient.total_appointments || 0}</p>
                                        <p className="text-[10px] text-muted-foreground">visits</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* New Patient Modal */}
            {
                showNewPatientModal && createPortal(
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[999] p-4 animate-in fade-in duration-200">
                        <div className="bg-card border border-border rounded-xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-lg animate-in zoom-in-95 duration-300">
                            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/30">
                                <div>
                                    <h2 className="text-lg font-bold text-foreground">New Patient</h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">Register a new patient record</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowNewPatientModal(false);
                                        resetPatientForm();
                                    }}
                                    className="p-1.5 text-muted-foreground hover:bg-muted rounded-md transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-5 no-scrollbar">
                                {error && (
                                    <div className="mb-4 p-3 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 rounded-md text-sm flex items-center gap-2">
                                        <AlertCircle size={16} />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <form onSubmit={handleCreatePatient} className="space-y-4">
                                    {/* Basic Information */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-foreground">First name *</label>
                                            <input
                                                type="text"
                                                value={patientForm.first_name}
                                                onChange={(e) => setPatientForm({ ...patientForm, first_name: e.target.value })}
                                                className="w-full px-3 py-2 bg-card border border-border rounded-md text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                                placeholder="John"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-foreground">Last name *</label>
                                            <input
                                                type="text"
                                                value={patientForm.last_name}
                                                onChange={(e) => setPatientForm({ ...patientForm, last_name: e.target.value })}
                                                className="w-full px-3 py-2 bg-card border border-border rounded-md text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                                placeholder="Doe"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-foreground">Email address *</label>
                                            <input
                                                type="email"
                                                value={patientForm.email}
                                                onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })}
                                                className="w-full px-3 py-2 bg-card border border-border rounded-md text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                                placeholder="john@example.com"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-foreground">Phone number</label>
                                            <input
                                                type="tel"
                                                value={patientForm.phone}
                                                onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
                                                className="w-full px-3 py-2 bg-card border border-border rounded-md text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                                placeholder="+1 (555) 000-0000"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-foreground">Date of birth</label>
                                            <input
                                                type="date"
                                                value={patientForm.date_of_birth}
                                                onChange={(e) => setPatientForm({ ...patientForm, date_of_birth: e.target.value })}
                                                className="w-full px-3 py-2 bg-card border border-border rounded-md text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-foreground">Gender</label>
                                            <select
                                                value={patientForm.gender}
                                                onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}
                                                className="w-full px-3 py-2 bg-card border border-border rounded-md text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                            >
                                                <option value="">Select</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-foreground">Blood group</label>
                                            <select
                                                value={patientForm.blood_group}
                                                onChange={(e) => setPatientForm({ ...patientForm, blood_group: e.target.value })}
                                                className="w-full px-3 py-2 bg-card border border-border rounded-md text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                            >
                                                <option value="">Select</option>
                                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(group => (
                                                    <option key={group} value={group}>{group}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground">Residential address</label>
                                        <textarea
                                            value={patientForm.address}
                                            onChange={(e) => setPatientForm({ ...patientForm, address: e.target.value })}
                                            className="w-full px-3 py-2 bg-card border border-border rounded-md text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-y"
                                            rows="2"
                                            placeholder="Full address details"
                                        />
                                    </div>

                                    <div className="pt-2 border-t border-border">
                                        <h3 className="text-sm font-semibold text-foreground mb-3">Emergency Contact</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-foreground">Contact name</label>
                                                <input
                                                    type="text"
                                                    value={patientForm.emergency_contact_name}
                                                    onChange={(e) => setPatientForm({ ...patientForm, emergency_contact_name: e.target.value })}
                                                    className="w-full px-3 py-2 bg-card border border-border rounded-md text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-foreground">Contact phone</label>
                                                <input
                                                    type="tel"
                                                    value={patientForm.emergency_contact_phone}
                                                    onChange={(e) => setPatientForm({ ...patientForm, emergency_contact_phone: e.target.value })}
                                                    className="w-full px-3 py-2 bg-card border border-border rounded-md text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-border">
                                        <h3 className="text-sm font-semibold text-foreground mb-3">Clinical Background</h3>
                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-foreground">Medical history</label>
                                                <textarea
                                                    value={patientForm.medical_history}
                                                    onChange={(e) => setPatientForm({ ...patientForm, medical_history: e.target.value })}
                                                    className="w-full px-3 py-2 bg-card border border-border rounded-md text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-y"
                                                    rows="2"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-foreground">Allergies & sensitivities</label>
                                                <textarea
                                                    value={patientForm.allergies}
                                                    onChange={(e) => setPatientForm({ ...patientForm, allergies: e.target.value })}
                                                    className="w-full px-3 py-2 bg-card border border-border rounded-md text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-y"
                                                    rows="2"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-6">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowNewPatientModal(false);
                                                resetPatientForm();
                                            }}
                                            className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted rounded-md transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={actionLoading === 'create-patient'}
                                            className="px-6 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[120px]"
                                        >
                                            {actionLoading === 'create-patient' ? (
                                                <div className="flex items-center gap-2">
                                                    <RefreshCw size={14} className="animate-spin" />
                                                    <span>Saving...</span>
                                                </div>
                                            ) : 'Save Patient'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }
            {/* Edit Patient Modal */}
            {
                showEditPatientModal && selectedPatient && createPortal(
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[999] p-4 animate-in fade-in duration-200">
                        <div className="bg-card border border-border rounded-xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-lg animate-in zoom-in-95 duration-300">
                            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/30">
                                <div>
                                    <h2 className="text-lg font-bold text-foreground">Edit Patient</h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">Update patient details</p>
                                </div>
                                <button
                                    onClick={() => setShowEditPatientModal(false)}
                                    className="p-1.5 text-muted-foreground hover:bg-muted rounded-md transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-5 no-scrollbar">
                                {error && (
                                    <div className="mb-4 p-3 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 rounded-md text-sm flex items-center gap-2">
                                        <AlertCircle size={16} />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <form onSubmit={handleEditPatient} className="space-y-4">
                                    {/* Basic Information */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-foreground">First name *</label>
                                            <input
                                                type="text"
                                                value={editForm.first_name}
                                                onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                                                className="w-full px-3 py-2 bg-card border border-border rounded-md text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-foreground">Last name *</label>
                                            <input
                                                type="text"
                                                value={editForm.last_name}
                                                onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                                                className="w-full px-3 py-2 bg-card border border-border rounded-md text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-foreground">Email address *</label>
                                            <input
                                                type="email"
                                                value={editForm.email}
                                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                                className="w-full px-3 py-2 bg-card border border-border rounded-md text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-foreground">Phone number</label>
                                            <input
                                                type="tel"
                                                value={editForm.phone}
                                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                                className="w-full px-3 py-2 bg-card border border-border rounded-md text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-foreground">Date of birth</label>
                                            <input
                                                type="date"
                                                value={editForm.date_of_birth}
                                                onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                                                className="w-full px-3 py-2 bg-card border border-border rounded-md text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-foreground">Gender</label>
                                            <select
                                                value={editForm.gender}
                                                onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                                                className="w-full px-3 py-2 bg-card border border-border rounded-md text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                            >
                                                <option value="">Select</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-foreground">Blood group</label>
                                            <select
                                                value={editForm.blood_group}
                                                onChange={(e) => setEditForm({ ...editForm, blood_group: e.target.value })}
                                                className="w-full px-3 py-2 bg-card border border-border rounded-md text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                            >
                                                <option value="">Select</option>
                                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(group => (
                                                    <option key={group} value={group}>{group}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground">Residential address</label>
                                        <textarea
                                            value={editForm.address}
                                            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                            className="w-full px-3 py-2 bg-card border border-border rounded-md text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-y"
                                            rows="2"
                                        />
                                    </div>

                                    <div className="pt-2 border-t border-border">
                                        <h3 className="text-sm font-semibold text-foreground mb-3">Emergency Contact</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-foreground">Contact name</label>
                                                <input
                                                    type="text"
                                                    value={editForm.emergency_contact_name}
                                                    onChange={(e) => setEditForm({ ...editForm, emergency_contact_name: e.target.value })}
                                                    className="w-full px-3.5 py-2 sm:py-2.5 bg-card border border-border rounded-lg text-[11px] sm:text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-foreground"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider ml-1">Contact Phone</label>
                                                <input
                                                    type="tel"
                                                    value={editForm.emergency_contact_phone}
                                                    onChange={(e) => setEditForm({ ...editForm, emergency_contact_phone: e.target.value })}
                                                    className="w-full px-3.5 py-2 sm:py-2.5 bg-card border border-border rounded-lg text-[11px] sm:text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-foreground"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Medical Information */}
                                    <div className="bg-indigo-500/5 rounded-xl p-4 border border-indigo-500/10 space-y-3.5">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <div className="p-1.5 bg-indigo-500/10 text-indigo-500 rounded-md">
                                                <Stethoscope size={14} />
                                            </div>
                                            <h3 className="text-[11px] font-black text-foreground tracking-tight">Clinical Background</h3>
                                        </div>
                                        <div className="space-y-3.5">
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider ml-1">Medical History</label>
                                                <textarea
                                                    value={editForm.medical_history}
                                                    onChange={(e) => setEditForm({ ...editForm, medical_history: e.target.value })}
                                                    className="w-full px-3.5 py-2 sm:py-2.5 bg-card border border-border rounded-lg text-[11px] sm:text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-foreground resize-none"
                                                    rows="2"
                                                    placeholder="Previous conditions, surgeries, chronic diseases..."
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider ml-1">Allergies & Sensitivities</label>
                                                <textarea
                                                    value={editForm.allergies}
                                                    onChange={(e) => setEditForm({ ...editForm, allergies: e.target.value })}
                                                    className="w-full px-3.5 py-2 sm:py-2.5 bg-card border border-border rounded-lg text-[11px] sm:text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-foreground resize-none"
                                                    rows="1"
                                                    placeholder="Food allergies, drug allergies, environmental allergies..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowEditPatientModal(false)}
                                            className="w-full sm:flex-1 px-6 py-2.5 sm:py-3 border border-border/60 text-muted-foreground font-black text-[10px] sm:text-[11px] uppercase tracking-widest rounded-lg sm:rounded-xl hover:bg-muted transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={actionLoading === 'edit-patient'}
                                            className="w-full sm:flex-[2] py-2.5 sm:py-3 bg-indigo-600 text-white rounded-lg sm:rounded-xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest shadow-2xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all disabled:opacity-50"
                                        >
                                            {actionLoading === 'edit-patient' ? (
                                                <div className="flex items-center justify-center space-x-2">
                                                    <RefreshCw size={14} className="animate-spin" />
                                                    <span>Updating...</span>
                                                </div>
                                            ) : 'Update Record'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

            {/* Patient Details Modal */}
            {
                showPatientModal && selectedPatient && (
                    <Portal>
                        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 sm:p-6 animate-in fade-in duration-200">
                            <div className="bg-card w-full max-w-5xl h-[90vh] sm:h-[85vh] flex flex-col rounded-xl border border-border shadow-xl relative overflow-hidden animate-in zoom-in-95 duration-300">

                                {/* Modal Header */}
                                <div className="flex-shrink-0 px-5 py-4 border-b border-border bg-muted/30">
                                {/* Close button */}
                                <button
                                    onClick={() => setShowPatientModal(false)}
                                    className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:bg-muted rounded-md transition-colors z-20"
                                >
                                    <X size={16} />
                                </button>

                                <div className="flex flex-col sm:flex-row sm:items-center gap-4 pr-8">
                                    <div className="relative flex-shrink-0">
                                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 rounded-full flex items-center justify-center text-xl font-bold">
                                            {selectedPatient.first_name.charAt(0)}{selectedPatient.last_name.charAt(0)}
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-xl font-bold text-foreground truncate">
                                                {selectedPatient.first_name} {selectedPatient.last_name}
                                            </h2>
                                            <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs font-medium rounded">
                                                {selectedPatient.unique_id}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1.5">
                                                <Calendar size={14} />
                                                <span>{calculateAge(selectedPatient.date_of_birth)} yrs</span>
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <MapPin size={14} />
                                                <span className="truncate max-w-[200px]">{selectedPatient.address || 'No address provided'}</span>
                                            </span>
                                            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                                <Activity size={14} />
                                                <span>Active Patient</span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                                        <button
                                            onClick={() => openEditModal(selectedPatient)}
                                            className="px-3 py-1.5 text-sm font-medium bg-muted hover:bg-muted/80 text-foreground rounded-md flex items-center gap-2 transition-colors"
                                        >
                                            <Edit3 size={14} />
                                            <span>Edit Profile</span>
                                        </button>
                                        <button
                                            onClick={() => handleDeletePatient(selectedPatient.id)}
                                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-md transition-colors"
                                            title="Delete Patient"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Tab Navigation */}
                            <div className="flex-shrink-0 px-5 border-b border-border bg-card overflow-x-auto no-scrollbar">
                                <div className="flex space-x-6">
                                    {[
                                        { id: 'profile', label: 'Overview', icon: UserCircle },
                                        { id: 'medical-history', label: 'History', icon: Stethoscope },
                                        { id: 'records', label: 'Documents', icon: FileText },
                                        { id: 'appointments', label: 'Appointments', icon: Clock },
                                        { id: 'prescriptions', label: 'Prescriptions', icon: Pill }
                                    ].map((tab) => {
                                        const Icon = tab.icon;
                                        const isActive = activeDetailsTab === tab.id;
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveDetailsTab(tab.id)}
                                                className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${isActive
                                                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                                                    }`}
                                            >
                                                <Icon size={16} />
                                                <span>{tab.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Modal Body Container */}
                            <div className="flex-1 overflow-y-auto bg-muted/10 no-scrollbar p-5">
                                {detailsLoading ? (
                                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                                        <p className="text-sm text-muted-foreground">Loading patient details...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Profile Overview Tab */}
                                        {activeDetailsTab === 'profile' && (
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                                <div className="lg:col-span-2 space-y-6">
                                                    <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                                                        <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                                                            <UserCircle size={18} className="text-muted-foreground" />
                                                            <span>Personal Information</span>
                                                        </h3>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            {[
                                                                { label: 'Email Address', value: selectedPatient.email, icon: Mail },
                                                                { label: 'Primary Contact', value: selectedPatient.phone || 'Not Recorded', icon: Phone },
                                                                { label: 'Date of Birth', value: formatDate(selectedPatient.date_of_birth), icon: Calendar },
                                                                { label: 'Blood Group', value: selectedPatient.blood_group || 'Unknown', icon: Heart, badge: true }
                                                            ].map((field, idx) => (
                                                                <div key={idx} className="space-y-2 group/field">
                                                                    <div className="flex items-center space-x-1.5">
                                                                        <field.icon size={11} className="text-muted-foreground/30 group-hover/field:text-indigo-500 transition-colors" />
                                                                        <p className="text-[9px] sm:text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.15em]">{field.label}</p>
                                                                    </div>
                                                                    {field.badge ? (
                                                                        <span className="inline-block px-2 py-0.5 bg-rose-500/10 text-rose-500 rounded-lg font-black text-[10px] sm:text-xs border border-rose-500/20 shadow-sm">{field.value}</span>
                                                                    ) : (
                                                                        <p className="text-xs sm:text-sm font-black text-foreground tracking-tight">{field.value}</p>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="bg-rose-50 border border-rose-100 dark:bg-rose-500/5 dark:border-rose-500/10 rounded-xl p-5 shadow-sm">
                                                        <h3 className="text-base font-semibold text-rose-600 dark:text-rose-400 mb-4 flex items-center gap-2">
                                                            <AlertCircle size={18} />
                                                            <span>Emergency Protocols</span>
                                                        </h3>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <div className="bg-card border border-border rounded-lg p-3">
                                                                <p className="text-xs text-muted-foreground mb-1">Guardian / Contact</p>
                                                                <p className="text-sm font-semibold text-foreground">{selectedPatient.emergency_contact_name || 'N/A'}</p>
                                                            </div>
                                                            <div className="bg-card border border-border rounded-lg p-3">
                                                                <p className="text-xs text-muted-foreground mb-1">Emergency Line</p>
                                                                <p className="text-sm font-semibold text-rose-600 dark:text-rose-500">{selectedPatient.emergency_contact_phone || 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-6">
                                                    <div className="bg-indigo-50 border border-indigo-100 dark:bg-indigo-500/5 dark:border-indigo-500/10 rounded-xl p-6 shadow-sm flex flex-col items-center text-center">
                                                        <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full mb-4">
                                                            <Zap size={24} />
                                                        </div>
                                                        <h4 className="text-base font-semibold text-indigo-900 dark:text-indigo-300 mb-2">Clinical Perspective</h4>
                                                        <p className="text-sm text-indigo-800/80 dark:text-indigo-200/80 leading-relaxed mb-6 italic max-w-sm">
                                                            "{selectedPatient.medical_history ? selectedPatient.medical_history.substring(0, 100) + '...' : 'No primary clinical notes active for this patient record.'}"
                                                        </p>
                                                        <button
                                                            onClick={() => setActiveDetailsTab('medical-history')}
                                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors w-full sm:w-auto"
                                                        >
                                                            Examine Full Record
                                                        </button>
                                                    </div>

                                                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <p className="text-sm font-semibold text-foreground">Health Score</p>
                                                            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">9.4/10</span>
                                                        </div>
                                                        <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
                                                            <div className="h-full bg-indigo-600 dark:bg-indigo-500 w-[94%] rounded-full"></div>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">High diagnostic compliance and clinical stability observed.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Clinical History Tab */}
                                        {activeDetailsTab === 'medical-history' && (
                                            <div className="space-y-6">
                                                <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                                                    <div className="flex items-center gap-3 mb-6">
                                                        <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                                            <Stethoscope size={18} />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-base font-semibold text-foreground">Medical History</h3>
                                                            <p className="text-xs text-muted-foreground">Chronological record of patient conditions</p>
                                                        </div>
                                                    </div>

                                                    {selectedPatient.medical_history ? (
                                                        <div className="space-y-4">
                                                            {selectedPatient.medical_history.split('\n').filter(line => line.trim()).map((entry, index) => (
                                                                <div key={index} className="flex gap-4">
                                                                    <div className="flex flex-col items-center">
                                                                        <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full mt-1.5 ring-4 ring-indigo-50 dark:ring-indigo-500/10"></div>
                                                                        <div className="w-px h-full bg-border my-2 last:hidden"></div>
                                                                    </div>
                                                                    <div className="bg-muted/30 border border-border rounded-lg p-3 sm:p-4 flex-1 mb-4 last:mb-0">
                                                                        <p className="text-sm text-foreground leading-relaxed">{entry}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-10 bg-muted/20 rounded-lg border border-dashed border-border">
                                                            <Stethoscope size={24} className="text-muted-foreground mx-auto mb-2" />
                                                            <p className="text-sm text-muted-foreground">No medical history recorded.</p>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/10 rounded-xl p-5 shadow-sm">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="p-2 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg">
                                                            <AlertCircle size={18} />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-base font-semibold text-rose-700 dark:text-rose-400">Allergies & Sensitivities</h3>
                                                        </div>
                                                    </div>

                                                    {selectedPatient.allergies ? (
                                                        <div className="flex flex-wrap gap-2">
                                                            {selectedPatient.allergies.split(',').map((allergy, index) => (
                                                                <div key={index} className="bg-white dark:bg-card border border-rose-200 dark:border-rose-500/20 rounded-md py-1.5 px-3 flex items-center gap-2 shadow-sm">
                                                                    <Shield size={14} className="text-rose-500" />
                                                                    <span className="text-sm font-medium text-rose-700 dark:text-rose-400">{allergy.trim()}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-8 bg-emerald-50 dark:bg-emerald-500/5 rounded-lg border border-dashed border-emerald-200 dark:border-emerald-500/20">
                                                            <Shield size={24} className="text-emerald-500 mx-auto mb-2 opacity-50" />
                                                            <p className="text-sm text-emerald-600 dark:text-emerald-400">No known allergies reported.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Medical Records Tab */}
                                        {activeDetailsTab === 'records' && (
                                            <div className="space-y-6">
                                                {/* Header & Controls */}
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                                            <FileText size={18} />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-base font-semibold text-foreground">Document Vault</h3>
                                                            <p className="text-xs text-muted-foreground">Secure electronic records & imaging</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {/* Search */}
                                                        <div className="relative">
                                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                                                            <input
                                                                type="text"
                                                                placeholder="Search..."
                                                                value={documentSearch}
                                                                onChange={(e) => setDocumentSearch(e.target.value)}
                                                                className="w-full sm:w-48 pl-9 pr-3 py-1.5 bg-card border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                                                            />
                                                        </div>

                                                        {/* Voice Recorder Button */}
                                                        <button
                                                            onClick={isRecording ? handleStopRecording : handleStartRecording}
                                                            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-sm font-medium transition-colors ${isRecording
                                                                ? 'border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 dark:border-rose-500/30 dark:text-rose-400 dark:bg-rose-500/10 animate-pulse'
                                                                : 'border-border bg-card text-foreground hover:bg-muted'
                                                                }`}
                                                        >
                                                            {isRecording ? <div className="w-2.5 h-2.5 bg-rose-500 rounded-full" /> : <Mic size={14} />}
                                                            <span className="hidden sm:inline">{isRecording ? 'Stop' : 'Voice'}</span>
                                                        </button>

                                                        {/* Camera Input */}
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            capture="environment"
                                                            className="hidden"
                                                            id="cameraInput"
                                                            onChange={(e) => {
                                                                const file = e.target.files[0];
                                                                if (file) {
                                                                    handleFileUpload(file, 'imaging');
                                                                }
                                                            }}
                                                        />

                                                        {/* Scanner Button */}
                                                        <button
                                                            onClick={() => document.getElementById('cameraInput').click()}
                                                            disabled={!!uploadingFile}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-card text-foreground border border-border rounded-md text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
                                                        >
                                                            {uploadingFile ? <RefreshCw size={14} className="animate-spin" /> : <Scan size={14} />}
                                                            <span className="hidden sm:inline">{uploadingFile ? 'Scanning...' : 'Scan'}</span>
                                                        </button>

                                                        {/* Upload Button */}
                                                        <button
                                                            onClick={() => setShowFileUpload(true)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
                                                        >
                                                            <Plus size={14} />
                                                            <span className="hidden sm:inline">Upload</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Filters */}
                                                <div className="flex flex-wrap gap-2 pb-2">
                                                    {[
                                                        { id: 'all', label: 'All Files' },
                                                        { id: 'medical_record', label: 'Reports' },
                                                        { id: 'lab_result', label: 'Lab Results' },
                                                        { id: 'imaging', label: 'Imaging' },
                                                        { id: 'other', label: 'Other' }
                                                    ].map(filter => (
                                                        <button
                                                            key={filter.id}
                                                            onClick={() => setDocumentFilter(filter.id)}
                                                            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors border ${documentFilter === filter.id
                                                                ? 'bg-foreground text-background border-foreground'
                                                                : 'bg-card border-border text-muted-foreground hover:text-foreground'
                                                                }`}
                                                        >
                                                            {filter.label}
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Documents Grid */}
                                                {(() => {
                                                    const filteredDocs = medicalRecords.filter(r => {
                                                        const isNotPrescription = !r.prescription && r.file_type !== 'prescription';
                                                        const isImaging = ['scan', 'xray', 'imaging'].includes(r.file_type);
                                                        const isLab = r.file_type === 'lab_result';
                                                        const isReport = r.file_type === 'medical_record';

                                                        const matchesType = documentFilter === 'all'
                                                            ? true
                                                            : (
                                                                (documentFilter === 'imaging' && isImaging) ||
                                                                (documentFilter === 'lab_result' && isLab) ||
                                                                (documentFilter === 'medical_record' && isReport) ||
                                                                (documentFilter === 'other' && !isImaging && !isLab && !isReport)
                                                            );
                                                        const matchesSearch = r.file_name?.toLowerCase().includes(documentSearch.toLowerCase());
                                                        return isNotPrescription && matchesType && matchesSearch;
                                                    });

                                                    if (filteredDocs.length === 0) {
                                                        return (
                                                            <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed border-border">
                                                                <Search size={24} className="text-muted-foreground mx-auto mb-2" />
                                                                <p className="text-sm text-muted-foreground">
                                                                    {documentSearch ? 'No matches found' : 'No documents found'}
                                                                </p>
                                                                {documentSearch && (
                                                                    <button
                                                                        onClick={() => setDocumentSearch('')}
                                                                        className="mt-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                                                                    >
                                                                        Clear Search
                                                                    </button>
                                                                )}
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                                            {filteredDocs.map((record, index) => (
                                                                <DocumentCard
                                                                    key={index}
                                                                    record={record}
                                                                    index={index}
                                                                    patient={selectedPatient}
                                                                    API_BASE_URL={API_CONFIG.BASE_URL}
                                                                    formatDate={formatDate}
                                                                    onShare={handleShareFile}
                                                                    onDelete={handleDeleteRecord}
                                                                />
                                                            ))}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        )}

                                        {/* Appointments Tab */}
                                        {activeDetailsTab === 'appointments' && (
                                            <div className="space-y-6">
                                                <div>
                                                    <h3 className="text-base font-semibold text-foreground">Consultation History</h3>
                                                    <p className="text-xs text-muted-foreground">Log of prior visits and sessions</p>
                                                </div>

                                                {appointmentLoading ? (
                                                    <div className="flex justify-center py-12">
                                                        <RefreshCw size={24} className="animate-spin text-muted-foreground" />
                                                    </div>
                                                ) : patientAppointments.length === 0 ? (
                                                    <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed border-border">
                                                        <Calendar size={28} className="text-muted-foreground mx-auto mb-2" />
                                                        <p className="text-sm text-muted-foreground">No past appointments found.</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        {patientAppointments.map((appointment) => (
                                                            <div key={appointment.id} className="bg-card border border-border rounded-xl p-5 shadow-sm">
                                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                                                                    <div className="flex items-start gap-3">
                                                                        <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-md mt-0.5">
                                                                            <Calendar size={16} />
                                                                        </div>
                                                                        <div>
                                                                            <h4 className="text-sm font-semibold text-foreground">
                                                                                {formatDate(appointment.appointment_date)} at {appointment.appointment_time}
                                                                            </h4>
                                                                            <p className="text-xs text-muted-foreground mt-0.5">Dr. {appointment.doctor_name || 'Staff'}</p>
                                                                            <div className="inline-flex mt-1 px-2 py-0.5 bg-muted rounded text-[10px] font-medium text-foreground">
                                                                                {appointment.appointment_type || 'Standard'} Session
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                                                                        <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1.5"><FileText size={12} /> Clinical Notes</p>
                                                                        <p className="text-sm text-foreground">{appointment.notes || "No notes provided."}</p>
                                                                    </div>
                                                                    <div className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-lg p-3 border border-indigo-100/50 dark:border-indigo-500/10">
                                                                        <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1 flex items-center gap-1.5"><Zap size={12} /> Suggestions</p>
                                                                        <p className="text-sm text-foreground">{appointment.suggestions || "No specific suggestions."}</p>
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
                                                {/* Header */}
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                                            <Pill size={18} />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="text-base font-semibold text-foreground">Prescription Records</h3>
                                                                <div className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-md flex items-center gap-1.5">
                                                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                                                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                                                                        {medicalRecords.filter(r => r.prescription || r.file_type === 'prescription').length} Total
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground mt-0.5">Medication history & active prescriptions</p>
                                                        </div>
                                                    </div>

                                                    {/* Action Buttons Row */}
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {/* Camera Upload */}
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            capture="environment"
                                                            className="hidden"
                                                            id="prescriptionCameraInput"
                                                            onChange={(e) => {
                                                                const file = e.target.files[0];
                                                                if (file) {
                                                                    handleFileUpload(file, 'prescription');
                                                                }
                                                            }}
                                                        />
                                                        <button
                                                            onClick={() => document.getElementById('prescriptionCameraInput').click()}
                                                            disabled={!!uploadingFile}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border rounded-md text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
                                                            title="Scan Prescription"
                                                        >
                                                            <Camera size={14} />
                                                            <span className="hidden sm:inline">Scan</span>
                                                        </button>

                                                        {/* File Upload */}
                                                        <input
                                                            type="file"
                                                            accept=".pdf,.jpg,.jpeg,.png"
                                                            className="hidden"
                                                            id="prescriptionFileInput"
                                                            onChange={(e) => {
                                                                const file = e.target.files[0];
                                                                if (file) {
                                                                    handleFileUpload(file, 'prescription');
                                                                }
                                                            }}
                                                        />
                                                        <button
                                                            onClick={() => document.getElementById('prescriptionFileInput').click()}
                                                            disabled={!!uploadingFile}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                                            title="Upload Prescription File"
                                                        >
                                                            <Upload size={14} />
                                                            <span className="hidden sm:inline">Upload</span>
                                                        </button>

                                                        <div className="w-px h-5 bg-border hidden sm:block"></div>

                                                        {/* Download All */}
                                                        <button
                                                            onClick={() => {
                                                                const prescriptions = medicalRecords.filter(r => r.prescription || r.file_type === 'prescription');
                                                                if (prescriptions.length === 0) {
                                                                    toast.error('No prescriptions to download');
                                                                    return;
                                                                }
                                                                let downloadCount = 0;
                                                                prescriptions.forEach((record, index) => {
                                                                    if (record.file_name) {
                                                                        // Create a temporary link to trigger download
                                                                        setTimeout(() => {
                                                                            const link = document.createElement('a');
                                                                            link.href = `${API_CONFIG.BASE_URL}/api/files/${record.file_name}`;
                                                                            link.download = record.file_name;
                                                                            link.target = '_blank';
                                                                            document.body.appendChild(link);
                                                                            link.click();
                                                                            document.body.removeChild(link);
                                                                        }, index * 500); // Stagger downloads
                                                                        downloadCount++;
                                                                    }
                                                                });
                                                                if (downloadCount > 0) {
                                                                    toast.success(`Downloading ${downloadCount} prescription file(s)`);
                                                                } else {
                                                                    toast.error('No prescription files available to download');
                                                                }
                                                            }}
                                                            disabled={medicalRecords.filter(r => (r.prescription || r.file_type === 'prescription') && r.file_name).length === 0}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border rounded-md text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
                                                            title="Download All Prescriptions"
                                                        >
                                                            <Download size={14} />
                                                            <span className="hidden sm:inline">Download</span>
                                                        </button>

                                                        {/* Print All */}
                                                        <button
                                                            onClick={() => {
                                                                const prescriptions = medicalRecords.filter(r => (r.prescription || r.file_type === 'prescription') && r.file_name);
                                                                if (prescriptions.length === 0) {
                                                                    toast.error('No prescription files to print');
                                                                    return;
                                                                }

                                                                const printWindow = window.open('', '_blank');
                                                                const htmlContent = generatePrintAllHTML(prescriptions, selectedPatient, API_CONFIG.BASE_URL, formatDate);
                                                                printWindow.document.write(htmlContent);
                                                                printWindow.document.close();
                                                            }}
                                                            disabled={medicalRecords.filter(r => r.prescription || r.file_type === 'prescription').length === 0}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border rounded-md text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
                                                            title="Print All Prescriptions"
                                                        >
                                                            <Printer size={14} />
                                                            <span className="hidden sm:inline">Print</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                {medicalRecords.filter(r => r.prescription || r.file_type === 'prescription').length === 0 ? (
                                                    <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed border-border">
                                                        <Pill size={24} className="text-muted-foreground mx-auto mb-2" />
                                                        <p className="text-sm text-muted-foreground">No prescriptions found.</p>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                        {medicalRecords
                                                            .filter(record => record.prescription || record.file_type === 'prescription')
                                                            .map((record, index) => (
                                                                <div
                                                                    key={index}
                                                                    className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
                                                                >
                                                                    {/* Card Header */}
                                                                    <div className="bg-muted/10 p-3 sm:p-4 border-b border-border/50">
                                                                        <div className="flex items-start justify-between">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-md">
                                                                                    <Pill size={16} className="text-indigo-600 dark:text-indigo-400" />
                                                                                </div>
                                                                                <div>
                                                                                    <div className="flex items-center gap-2 mb-0.5">
                                                                                        <h4 className="text-sm font-semibold text-foreground">Prescription #{index + 1}</h4>
                                                                                        <div className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                                                                                            Active
                                                                                        </div>
                                                                                    </div>
                                                                                    <p className="text-xs text-muted-foreground">
                                                                                        {record.file_name || 'Rx-' + (index + 1).toString().padStart(4, '0')}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center gap-1">
                                                                                {record.file_path && (
                                                                                    <button
                                                                                        onClick={() => window.open(`${API_CONFIG.BASE_URL}/api/files/${record.file_name}`, '_blank')}
                                                                                        className="p-1.5 text-muted-foreground hover:text-indigo-600 hover:bg-muted rounded-md transition-colors"
                                                                                        title="View Prescription"
                                                                                    >
                                                                                        <Eye size={14} />
                                                                                    </button>
                                                                                )}
                                                                                {record.file_path && (
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            window.open(`${API_CONFIG.BASE_URL}/api/files/${record.file_name}`, '_blank');
                                                                                            toast.success('Downloading prescription...');
                                                                                        }}
                                                                                        className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-muted rounded-md transition-colors"
                                                                                        title="Download Prescription"
                                                                                    >
                                                                                        <Download size={14} />
                                                                                    </button>
                                                                                )}
                                                                                <button
                                                                                    onClick={() => {
                                                                                        const printWindow = window.open('', '_blank');
                                                                                        const htmlContent = generateSinglePrescriptionHTML(record, index, selectedPatient, API_CONFIG.BASE_URL, formatDate);
                                                                                        printWindow.document.write(htmlContent);
                                                                                        printWindow.document.close();
                                                                                    }}
                                                                                    className="p-1.5 text-muted-foreground hover:text-purple-600 hover:bg-muted rounded-md transition-colors"
                                                                                    title="Print Prescription"
                                                                                >
                                                                                    <Printer size={14} />
                                                                                </button>
                                                                                {record.file_path && (
                                                                                    <button
                                                                                        onClick={() => handleShareFile(record)}
                                                                                        className="p-1.5 text-muted-foreground hover:text-green-600 hover:bg-muted rounded-md transition-colors"
                                                                                        title="Share Prescription"
                                                                                    >
                                                                                        <Share2 size={14} />
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Card Body - Prescription Details */}
                                                                    <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-4">
                                                                        {/* File Preview Section */}
                                                                        {record.file_name && (
                                                                            <div className="rounded-lg border border-border/50 overflow-hidden bg-muted/10">
                                                                                {/\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(record.file_name) ? (
                                                                                    <div
                                                                                        className="cursor-pointer group/img relative"
                                                                                        onClick={() => window.open(`${API_CONFIG.BASE_URL}/api/files/${record.file_name}`, '_blank')}
                                                                                    >
                                                                                        <img
                                                                                            src={`${API_CONFIG.BASE_URL}/api/files/${record.file_name}`}
                                                                                            alt={`Prescription ${index + 1}`}
                                                                                            className="w-full h-32 object-contain transition-transform group-hover/img:scale-105"
                                                                                            onError={(e) => {
                                                                                                e.target.style.display = 'none';
                                                                                                if (e.target.parentElement.nextSibling) {
                                                                                                    e.target.parentElement.nextSibling.style.display = 'flex';
                                                                                                }
                                                                                            }}
                                                                                        />
                                                                                    </div>
                                                                                ) : /\.pdf$/i.test(record.file_name) ? (
                                                                                    <iframe
                                                                                        src={`${API_CONFIG.BASE_URL}/api/files/${record.file_name}#toolbar=0`}
                                                                                        className="w-full h-32 bg-slate-50 dark:bg-slate-900 border-0"
                                                                                        title={`Prescription ${index + 1}`}
                                                                                    />
                                                                                ) : (
                                                                                    <div className="w-full h-32 flex items-center justify-center">
                                                                                        <div className="text-center">
                                                                                            <FileText size={24} className="mx-auto text-muted-foreground/30 mb-1" />
                                                                                            <p className="text-xs text-muted-foreground">Preview not available</p>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                                <div className="hidden w-full h-32 items-center justify-center">
                                                                                    <div className="text-center">
                                                                                        <FileText size={24} className="mx-auto text-muted-foreground/30 mb-1" />
                                                                                        <p className="text-xs text-muted-foreground">Failed to load preview</p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* Meta Information */}
                                                                        <div className="grid grid-cols-2 gap-3 mt-auto">
                                                                            <div className="bg-muted/30 rounded-lg p-2.5 border border-border/50">
                                                                                <div className="flex items-center gap-1.5 mb-1">
                                                                                    <Calendar size={12} className="text-muted-foreground" />
                                                                                    <p className="text-[10px] font-medium text-muted-foreground">Prescribed Date</p>
                                                                                </div>
                                                                                <p className="text-xs font-semibold text-foreground">{formatDate(record.record_date || record.created_at)}</p>
                                                                            </div>
                                                                            <div className="bg-muted/30 rounded-lg p-2.5 border border-border/50">
                                                                                <div className="flex items-center gap-1.5 mb-1">
                                                                                    <UserCircle size={12} className="text-muted-foreground" />
                                                                                    <p className="text-[10px] font-medium text-muted-foreground">Prescribed By</p>
                                                                                </div>
                                                                                <p className="text-xs font-semibold text-foreground truncate">
                                                                                    {record.doctor_first_name ? `Dr. ${record.doctor_first_name}` : 'System'}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div >
                        </div >
                    </div >
                    </Portal>
                )
            }
            {/* File Upload Modal */}
            {
                showFileUpload && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[160] p-4 animate-in fade-in duration-200">
                        <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-lg animate-in zoom-in-95 duration-200">
                            <div className="p-5 sm:p-6">
                                <div className="flex items-center justify-between mb-5">
                                    <div>
                                        <h3 className="text-lg font-semibold text-foreground">Upload Document</h3>
                                    </div>
                                    <button
                                        onClick={() => setShowFileUpload(false)}
                                        className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-foreground">Document Category</label>
                                        <div className="relative">
                                            <select
                                                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none appearance-none cursor-pointer text-foreground"
                                                id="fileType"
                                                defaultValue="medical_record"
                                            >
                                                <option value="medical_record">Medical Report</option>
                                                <option value="lab_result">Lab Result</option>
                                                <option value="imaging">Imaging (X-Ray, CT, MRI)</option>
                                                <option value="other">Other Document</option>
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                                <ChevronRight size={14} className="rotate-90" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-foreground">Select Clinical File</label>
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
                                                className="flex flex-col items-center justify-center w-full px-4 py-8 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground cursor-pointer hover:border-indigo-500/50 hover:bg-muted/50 transition-colors"
                                            >
                                                <Upload size={24} className="mb-2 text-muted-foreground" />
                                                Drag & drop or click to browse
                                            </label>
                                        </div>
                                        <p className="text-xs text-muted-foreground text-center mt-1">
                                            Max: 10MB | PDF, JPG, PNG
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3 pt-4">
                                        <button
                                            onClick={() => setShowFileUpload(false)}
                                            className="flex-1 px-4 py-2 border border-border text-foreground rounded-md text-sm font-medium hover:bg-muted transition-colors"
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
                                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                        >
                                            {uploadingFile ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <RefreshCw size={16} className="animate-spin" />
                                                    <span>Uploading...</span>
                                                </div>
                                            ) : 'Upload'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Delete Confirmation Modal */}
            {
                showDeleteConfirm && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200">
                        <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-lg animate-in zoom-in-95 duration-200">
                            <div className="p-6">
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-12 h-12 bg-rose-100 dark:bg-rose-500/10 rounded-full flex items-center justify-center text-rose-600 dark:text-rose-500 mb-4">
                                        <AlertTriangle size={24} />
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground mb-2">Delete Patient Record?</h3>
                                    <p className="text-sm text-muted-foreground mb-6">
                                        Are you sure you want to permanently delete this patient? This action will remove all history, appointments, prescriptions, and files. This cannot be undone.
                                    </p>
                                    <div className="flex items-center w-full gap-3">
                                        <button
                                            onClick={() => {
                                                setShowDeleteConfirm(false);
                                                setPatientToDelete(null);
                                            }}
                                            className="flex-1 px-4 py-2 border border-border text-foreground rounded-md text-sm font-medium hover:bg-muted transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={confirmDeletePatient}
                                            disabled={actionLoading === 'delete-patient'}
                                            className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-md text-sm font-medium hover:bg-rose-700 transition-colors disabled:opacity-50"
                                        >
                                            {actionLoading === 'delete-patient' ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <RefreshCw size={16} className="animate-spin" />
                                                    <span>Deleting...</span>
                                                </div>
                                            ) : 'Delete Record'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Document Delete Confirmation Modal */}
            {
                showDocumentDeleteConfirm && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200">
                        <div className="bg-card border border-border rounded-xl w-full max-w-sm shadow-lg animate-in zoom-in-95 duration-200">
                            <div className="p-6">
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-10 h-10 bg-rose-100 dark:bg-rose-500/10 rounded-full flex items-center justify-center text-rose-600 dark:text-rose-500 mb-4">
                                        <Trash2 size={20} />
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground mb-2">Delete Document?</h3>
                                    <p className="text-sm text-muted-foreground mb-6 break-words">
                                        Are you sure you want to delete <span className="font-semibold">{recordToDelete?.file_name}</span>? File access will be permanently revoked.
                                    </p>
                                    <div className="flex items-center w-full gap-3">
                                        <button
                                            onClick={() => {
                                                setShowDocumentDeleteConfirm(false);
                                                setRecordToDelete(null);
                                            }}
                                            className="flex-1 px-4 py-2 border border-border text-foreground rounded-md text-sm font-medium hover:bg-muted transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={confirmDeleteRecord}
                                            disabled={actionLoading === 'delete-record'}
                                            className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-md text-sm font-medium hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {actionLoading === 'delete-record' ? (
                                                <RefreshCw size={16} className="animate-spin" />
                                            ) : (
                                                'Delete'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Share Menu Modal */}
            {
                showShareMenu && activeShareRecord && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200">
                        <div className="bg-card border border-border rounded-xl w-full max-w-sm shadow-lg overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                                <h3 className="text-base font-semibold text-foreground">Share Document</h3>
                                <button
                                    onClick={() => setShowShareMenu(false)}
                                    className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="p-5 grid grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                <WhatsappShareButton
                                    url={`${API_CONFIG.BASE_URL}/api/files/${activeShareRecord.file_name}`}
                                    title={`Medical record for ${selectedPatient?.first_name} ${selectedPatient?.last_name}`}
                                    onClick={() => setShowShareMenu(false)}
                                    className="flex flex-col items-center hover:opacity-80 transition-opacity"
                                >
                                    <WhatsappIcon size={36} round />
                                    <span className="text-xs font-medium text-muted-foreground mt-2">WhatsApp</span>
                                </WhatsappShareButton>

                                <TelegramShareButton
                                    url={`${API_CONFIG.BASE_URL}/api/files/${activeShareRecord.file_name}`}
                                    title={`Medical record for ${selectedPatient?.first_name} ${selectedPatient?.last_name}`}
                                    onClick={() => setShowShareMenu(false)}
                                    className="flex flex-col items-center hover:opacity-80 transition-opacity"
                                >
                                    <TelegramIcon size={36} round />
                                    <span className="text-xs font-medium text-muted-foreground mt-2">Telegram</span>
                                </TelegramShareButton>

                                <EmailShareButton
                                    url={`${API_CONFIG.BASE_URL}/api/files/${activeShareRecord.file_name}`}
                                    subject="Medical Record from MediSync"
                                    body={`Please find attached the medical record for ${selectedPatient?.first_name} ${selectedPatient?.last_name}`}
                                    onClick={() => setShowShareMenu(false)}
                                    className="flex flex-col items-center hover:opacity-80 transition-opacity"
                                >
                                    <EmailIcon size={36} round />
                                    <span className="text-xs font-medium text-muted-foreground mt-2">Email</span>
                                </EmailShareButton>

                                <button
                                    onClick={() => executeShare('copy')}
                                    className="flex flex-col items-center hover:opacity-80 transition-opacity"
                                >
                                    <div className="w-[36px] h-[36px] rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-border">
                                        <Link size={16} className="text-muted-foreground" />
                                    </div>
                                    <span className="text-xs font-medium text-muted-foreground mt-2">Copy Link</span>
                                </button>

                                {navigator.share && (
                                    <button
                                        onClick={() => {
                                            setShowShareMenu(false);
                                            executeShare('native');
                                        }}
                                        className="flex flex-col items-center hover:opacity-80 transition-opacity"
                                    >
                                        <div className="w-[36px] h-[36px] rounded-full bg-blue-500 flex items-center justify-center">
                                            <Share2 size={16} className="text-white" />
                                        </div>
                                        <span className="text-xs font-medium text-muted-foreground mt-2">More Options</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
});

export default PatientTab;
import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { patientApi, appointmentApi } from "../../lib/api";
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
    <div className="bg-card rounded-3xl p-6 sm:p-8 border border-border shadow-sm h-full flex flex-col overflow-hidden group relative hover:shadow-xl transition-all duration-300">
        <div className={`absolute top-0 right-0 w-24 h-24 lg:w-32 lg:h-32 opacity-10 dark:opacity-5 rounded-bl-full -mr-8 -mt-8 ${color} transition-transform group-hover:scale-110`}></div>
        <div className="flex items-start justify-between relative z-10 gap-2">
            <div className="min-w-0">
                <h4 className="font-semibold text-muted-foreground mb-1 text-[10px] sm:text-xs uppercase tracking-wider truncate">{label}</h4>
                <p className="text-2xl sm:text-3xl font-bold text-foreground mb-2 truncate">{value}</p>
                <span className="text-[10px] font-bold text-muted-foreground uppercase truncate block">{subLabel}</span>
            </div>
            <div className={`p-3 sm:p-4 ${color}/10 rounded-xl sm:rounded-2xl transition-colors group-hover:bg-${color.split('-')[1]}-500/20 shrink-0`}>
                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color.replace('bg-', 'text-')}`} />
            </div>
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
            const result = await patientApi.create(patientForm);

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



    const handleUpdatePatient = useCallback(async (e) => {
        e.preventDefault();
        setActionLoading('create-patient');

        try {
            const result = await patientApi.create(patientForm);

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

            const result = await response.json();

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
            <div className="relative p-6 sm:p-10 rounded-[2rem] sm:rounded-[3.5rem] bg-indigo-600 dark:bg-card border border-indigo-500/20 dark:border-border overflow-hidden shadow-[0_20px_50px_rgba(79,70,229,0.3)] dark:shadow-none group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl group-hover:bg-white/20 transition-colors"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/20 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl"></div>

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-10">
                    <div className="space-y-2 sm:space-y-4">
                        <div className="flex items-center space-x-3 text-indigo-100 dark:text-indigo-400 mb-2">
                            <div className="p-2 bg-white/20 dark:bg-indigo-500/10 rounded-xl backdrop-blur-md">
                                <Users size={24} className="text-white dark:text-indigo-500" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Patient Management</span>
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-black text-white dark:text-foreground tracking-tighter leading-none">
                            Patient <span className="text-indigo-200 dark:text-indigo-500">Registry</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-indigo-100/70 dark:text-muted-foreground max-w-xl font-medium leading-relaxed">
                            Access and manage comprehensive medical records with secure data processing.
                        </p>
                    </div>

                    <button
                        onClick={() => setShowNewPatientModal(true)}
                        className="group flex items-center space-x-3 px-6 sm:px-8 py-3 sm:py-4 bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white rounded-2xl sm:rounded-3xl font-black text-xs sm:text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10 dark:shadow-indigo-500/20 shrink-0 self-start lg:self-auto"
                    >
                        <div className="p-1 sm:p-2 bg-indigo-600/10 dark:bg-white/20 rounded-lg sm:rounded-xl group-hover:rotate-90 transition-transform duration-500">
                            <Plus size={18} className="sm:w-5 sm:h-5" />
                        </div>
                        <span>Register New Patient</span>
                    </button>
                </div>
            </div>

            {/* Statistics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <StatCard
                    icon={Users}
                    label="Total Patients"
                    value={patientStats.totalPatients}
                    subLabel="Medical Base"
                    color="bg-indigo-600"
                />
                <StatCard
                    icon={RefreshCw}
                    label="Recurring Patients"
                    value={patientStats.recurringPatients}
                    subLabel="High Loyalty"
                    color="bg-purple-500"
                />
                <StatCard
                    icon={Activity}
                    label="Patient Activity"
                    value={patientStats.activePatients}
                    subLabel="Current Cycle"
                    color="bg-amber-500"
                />
            </div>

            {/* Enhanced Search & Filter Section */}
            <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-[2rem] sm:rounded-[3rem] blur-2xl group-focus-within:opacity-100 opacity-0 transition-opacity duration-500"></div>
                <div className="relative flex flex-col lg:flex-row items-center gap-4 sm:gap-6 p-4 sm:p-6 bg-card/60 backdrop-blur-2xl border border-border rounded-[2rem] sm:rounded-[3rem] shadow-xl group-hover:border-indigo-500/20 transition-all duration-500">
                    <div className="flex-1 relative w-full group/input">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within/input:text-indigo-500 transition-colors">
                            <Search size={22} className="group-hover/input:scale-110 transition-transform" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by name, patient ID, or contact number..."
                            className="w-full pl-16 pr-6 py-5 bg-card/50 border border-border/50 rounded-[2rem] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-foreground font-bold text-sm placeholder:text-muted-foreground/30 placeholder:font-black placeholder:uppercase placeholder:tracking-widest"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {searchTerm && (
                        <div className="flex items-center px-4">
                            <button
                                onClick={() => setSearchTerm('')}
                                className="w-12 h-12 flex items-center justify-center bg-rose-500/10 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-lg shadow-rose-500/10 active:scale-90"
                            >
                                <X size={20} />
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

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
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
                                className="group relative bg-card/60 backdrop-blur-xl border border-border rounded-[2rem] sm:rounded-[3rem] p-5 sm:p-8 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-500/40 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 overflow-hidden"
                            >
                                <div className="flex flex-col md:flex-row md:items-start gap-6">
                                    <div className="flex items-center space-x-4 sm:space-x-6 flex-1 min-w-0">
                                        <div className="relative flex-shrink-0">
                                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl sm:rounded-[2.2rem] flex items-center justify-center text-white text-lg sm:text-xl font-black shadow-xl shadow-indigo-500/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                                {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-card rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg border-2 border-white dark:border-indigo-900 ring-1 ring-border">
                                                <Shield size={10} className="text-emerald-500 sm:w-[12px] sm:h-[12px]" />
                                            </div>
                                        </div>

                                        <div className="space-y-3 flex-1 min-w-0">
                                            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                                <h4 className="text-lg sm:text-xl font-black text-foreground tracking-tighter group-hover:text-indigo-500 transition-colors truncate max-w-[280px] sm:max-w-none">
                                                    {patient.first_name} {patient.last_name}
                                                </h4>
                                                <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-indigo-500/10 text-[9px] sm:text-[10px] font-black text-indigo-500 rounded-lg border border-indigo-500/20 uppercase tracking-[0.1em] sm:tracking-[0.2em] flex-shrink-0">
                                                    {patient.unique_id}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-2 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
                                                <div className="flex items-center space-x-2">
                                                    <div className="p-1.5 bg-muted rounded-lg">
                                                        <Calendar size={14} className="text-indigo-400" />
                                                    </div>
                                                    <span>{calculateAge(patient.date_of_birth)} Years</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <div className="p-1.5 bg-rose-500/10 rounded-lg">
                                                        <Heart size={14} className="text-rose-500" />
                                                    </div>
                                                    <span className="text-rose-500">{patient.blood_group || 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                                                        <User size={14} className="text-indigo-500" />
                                                    </div>
                                                    <span className="text-indigo-500">{patient.gender}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center md:items-end gap-3 flex-shrink-0">
                                        <div className="flex items-center p-1.5 sm:p-2 bg-muted/50 rounded-2xl sm:rounded-[1.8rem] border border-border shrink-0">
                                            <button
                                                onClick={() => handleViewDetails(patient)}
                                                disabled={actionLoading === 'loading-details'}
                                                className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center text-muted-foreground hover:text-indigo-500 hover:bg-card rounded-xl sm:rounded-2xl transition-all shadow-indigo-500/10 active:scale-95 group/btn"
                                                title="Open Patient Sheet"
                                            >
                                                {actionLoading === 'loading-details' && selectedPatient?.id === patient.id ? (
                                                    <RefreshCw size={18} className="animate-spin text-indigo-500" />
                                                ) : (
                                                    <Eye size={20} className="group-hover/btn:scale-125 transition-transform" />
                                                )}
                                            </button>
                                            <div className="w-[1px] h-6 sm:h-8 bg-border mx-1 shrink-0"></div>
                                            <button
                                                onClick={() => openEditModal(patient)}
                                                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-muted-foreground hover:text-amber-500 hover:bg-card rounded-xl sm:rounded-2xl transition-all shadow-amber-500/10 active:scale-95 group/btn"
                                                title="Edit Medical Profile"
                                            >
                                                <Edit3 size={16} className="sm:w-[18px] sm:h-[18px] group-hover/btn:scale-125 transition-transform" />
                                            </button>
                                        </div>

                                        <div className="flex flex-col items-center md:items-end">
                                            <span className="text-[9px] sm:text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-1 whitespace-nowrap">Clinical Record</span>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-lg sm:text-xl font-black text-foreground tracking-tighter">{patient.total_appointments || 0}</span>
                                                <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground/60 whitespace-nowrap">Consultations</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>


                                <div className="mt-8 pt-8 border-t border-border/40 flex flex-wrap items-center gap-x-4 gap-y-2 opacity-40 group-hover:opacity-100 transition-opacity duration-500 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    <span className="flex items-center space-x-2">
                                        <MapPin size={14} className="text-indigo-400 flex-shrink-0" />
                                        <span className="break-words">{patient.address || 'Location Hidden (Private)'}</span>
                                    </span>
                                    <div className="w-1 h-1 bg-border rounded-full flex-shrink-0"></div>
                                    <span className="flex items-center space-x-2">
                                        <Mail size={14} className="text-indigo-400 flex-shrink-0" />
                                        <span className="break-words">{patient.email}</span>
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* New Patient Modal */}
            {
                showNewPatientModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[155] p-4 animate-in fade-in duration-300">
                        <div className="bg-card border border-border/60 rounded-[2rem] sm:rounded-[3rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-500">
                            <div className="p-6 sm:p-10 border-b border-border/40 flex items-center justify-between bg-muted/20">
                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tighter">Registration Portal</h2>
                                    <p className="text-[10px] sm:text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] sm:tracking-[0.4em] mt-1 sm:mt-2">Initialize new clinical record</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowNewPatientModal(false);
                                        resetPatientForm();
                                    }}
                                    className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-card text-muted-foreground hover:text-rose-500 rounded-xl sm:rounded-2xl border border-border transition-all active:scale-90"
                                >
                                    <X size={20} className="sm:w-6 sm:h-6" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 sm:p-10 no-scrollbar">
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

                                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 pt-8">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowNewPatientModal(false);
                                                resetPatientForm();
                                            }}
                                            className="w-full sm:flex-1 px-10 py-4 sm:py-5 border border-border/60 text-muted-foreground font-black text-[11px] sm:text-[12px] uppercase tracking-widest rounded-xl sm:rounded-2xl hover:bg-muted transition-all"
                                        >
                                            Discard
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={actionLoading === 'create-patient'}
                                            className="w-full sm:flex-[2] py-4 sm:py-5 bg-indigo-600 text-white rounded-xl sm:rounded-2xl font-black text-[11px] sm:text-[12px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all disabled:opacity-50"
                                        >
                                            {actionLoading === 'create-patient' ? (
                                                <div className="flex items-center justify-center space-x-3">
                                                    <RefreshCw size={18} className="animate-spin" />
                                                    <span>Synchronizing...</span>
                                                </div>
                                            ) : 'Initialize Record'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Edit Patient Modal */}
            {
                showEditPatientModal && selectedPatient && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[155] p-4 animate-in fade-in duration-300">
                        <div className="bg-card border border-border/60 rounded-[2rem] sm:rounded-[3rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-500">
                            <div className="p-6 sm:p-10 border-b border-border/40 flex items-center justify-between bg-muted/20">
                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tighter">Profile Amendment</h2>
                                    <p className="text-[10px] sm:text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] sm:tracking-[0.4em] mt-1 sm:mt-2">Modify existing clinical registry</p>
                                </div>
                                <button
                                    onClick={() => setShowEditPatientModal(false)}
                                    className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-card text-muted-foreground hover:text-rose-500 rounded-xl sm:rounded-2xl border border-border transition-all active:scale-90"
                                >
                                    <X size={20} className="sm:w-6 sm:h-6" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 sm:p-10 no-scrollbar">
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

                                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 pt-8">
                                        <button
                                            type="button"
                                            onClick={() => setShowEditPatientModal(false)}
                                            className="w-full sm:flex-1 px-10 py-4 sm:py-5 border border-border/60 text-muted-foreground font-black text-[11px] sm:text-[12px] uppercase tracking-widest rounded-xl sm:rounded-2xl hover:bg-muted transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={actionLoading === 'edit-patient'}
                                            className="w-full sm:flex-[2] py-4 sm:py-5 bg-indigo-600 text-white rounded-xl sm:rounded-2xl font-black text-[11px] sm:text-[12px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all disabled:opacity-50"
                                        >
                                            {actionLoading === 'edit-patient' ? (
                                                <div className="flex items-center justify-center space-x-3">
                                                    <RefreshCw size={18} className="animate-spin" />
                                                    <span>Updating...</span>
                                                </div>
                                            ) : 'Update Record'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Patient Details Modal */}
            {
                showPatientModal && selectedPatient && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-0 sm:p-3 lg:p-6 animate-in fade-in duration-500">
                        <div className="bg-card/80 backdrop-blur-3xl rounded-none sm:rounded-[2rem] lg:rounded-[2.5rem] w-full max-w-5xl h-full sm:h-[95vh] flex flex-col shadow-[0_40px_100px_rgba(0,0,0,0.5)] dark:shadow-none border border-border/50 relative overflow-hidden animate-in zoom-in-95 duration-700">
                            {/* High-end Gradient Accents */}
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
                            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>

                            {/* Modal Header */}
                            <div className="relative z-10 flex-shrink-0 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-border/40 bg-card/40">
                                {/* Close button - absolute on mobile, relative on desktop */}
                                <button
                                    onClick={() => setShowPatientModal(false)}
                                    className="absolute top-4 right-4 sm:hidden w-9 h-9 flex items-center justify-center bg-muted/30 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all border border-border hover:border-rose-500/20 active:scale-90 z-20"
                                >
                                    <X size={16} />
                                </button>

                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5">
                                    <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-3 sm:space-y-0 sm:space-x-4 text-center sm:text-left pr-12 sm:pr-0">
                                        <div className="relative group">
                                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl sm:rounded-[2rem] flex items-center justify-center text-white text-lg sm:text-2xl font-black shadow-xl shadow-indigo-500/20 group-hover:scale-105 transition-all duration-500 ring-2 sm:ring-4 ring-white dark:ring-indigo-900/20">
                                                {selectedPatient.first_name.charAt(0)}{selectedPatient.last_name.charAt(0)}
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 p-1.5 sm:p-2 bg-emerald-500 text-white rounded-lg sm:rounded-xl border-2 border-white dark:border-indigo-900 shadow-lg ring-1 ring-emerald-400/50">
                                                <Shield size={12} className="sm:w-[14px] sm:h-[14px]" />
                                            </div>
                                        </div>
                                        <div className="space-y-2 flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                                                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-foreground tracking-tighter leading-tight truncate">
                                                    {selectedPatient.first_name} <span className="text-indigo-500">{selectedPatient.last_name}</span>
                                                </h2>
                                                <div className="px-2 sm:px-3 py-0.5 sm:py-1 bg-indigo-500/10 text-[9px] sm:text-[10px] font-black text-indigo-500 rounded-lg sm:rounded-xl border border-indigo-500/20 uppercase tracking-[0.15em] sm:tracking-[0.2em] shadow-sm flex-shrink-0">
                                                    {selectedPatient.unique_id}
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">
                                                <span className="flex items-center space-x-1.5 bg-muted/40 px-2 sm:px-2.5 py-1 rounded-lg border border-border/50">
                                                    <Calendar size={14} className="text-indigo-400" />
                                                    <span>{calculateAge(selectedPatient.date_of_birth)} Yrs</span>
                                                </span>
                                                <span className="flex items-center space-x-1.5 bg-muted/40 px-2 sm:px-2.5 py-1 rounded-lg border border-border/50 max-w-[150px] sm:max-w-none">
                                                    <MapPin size={14} className="text-muted-foreground/40 flex-shrink-0" />
                                                    <span className="truncate">{selectedPatient.address || 'Location Hidden'}</span>
                                                </span>
                                                <div className="flex items-center space-x-1.5 px-2 sm:px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20 shadow-sm">
                                                    <Activity size={14} />
                                                    <span>Active</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mobile Update Button - shown below patient details */}
                                    <div className="sm:hidden flex justify-center mt-4">
                                        <button
                                            onClick={() => openEditModal(selectedPatient)}
                                            className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-black text-[9px] uppercase tracking-[0.1em] shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all active:scale-95 group/btn"
                                        >
                                            <Edit3 size={14} className="group-hover/btn:rotate-12 transition-transform" />
                                            <span>Update Profile</span>
                                        </button>
                                    </div>

                                    {/* Desktop buttons */}
                                    <div className="hidden sm:flex items-center justify-end space-x-2">
                                        <button
                                            onClick={() => openEditModal(selectedPatient)}
                                            className="flex items-center space-x-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg font-black text-[9px] uppercase tracking-[0.1em] shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all active:scale-95 group/btn"
                                        >
                                            <Edit3 size={13} className="group-hover/btn:rotate-12 transition-transform" />
                                            <span>Update</span>
                                        </button>
                                        <button
                                            onClick={() => setShowPatientModal(false)}
                                            className="w-10 h-10 flex items-center justify-center bg-muted/30 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all border border-border hover:border-rose-500/20 active:scale-90"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Modern Tab Navigation */}
                            <div className="relative z-10 flex-shrink-0 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-muted/20 backdrop-blur-3xl flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 border-b border-border/40">
                                <div className="flex items-center space-x-1.5 sm:space-x-2 p-1 bg-card/60 rounded-lg sm:rounded-xl border border-border/50 overflow-x-auto no-scrollbar shadow-inner">
                                    {[
                                        { id: 'profile', label: 'Clinical Overview', icon: UserCircle },
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
                                                className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-500 whitespace-nowrap ${isActive
                                                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/40 scale-105 active:scale-95'
                                                    : 'text-muted-foreground/60 hover:text-foreground hover:bg-muted/50'
                                                    }`}
                                            >
                                                <Icon size={13} className={`sm:w-[15px] sm:h-[15px] ${isActive ? 'text-white' : 'text-muted-foreground/40'}`} />
                                                <span>{tab.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="flex items-center space-x-1 sm:space-x-2">
                                    <button
                                        onClick={() => handleDeletePatient(selectedPatient.id)}
                                        className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-rose-500/5 text-rose-300 hover:text-rose-600 hover:bg-rose-500/10 transition-all rounded-lg border border-border hover:border-rose-500/20"
                                    >
                                        <Trash2 size={13} className="sm:w-3.5 sm:h-3.5" />
                                    </button>
                                    <div className="w-[1px] h-4 bg-border hidden lg:block"></div>
                                    <button className="flex items-center space-x-1 px-2 sm:px-2.5 py-1 sm:py-1.5 bg-muted/50 border border-border rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-card transition-all">
                                        <Download size={12} className="sm:w-[13px] sm:h-[13px]" />
                                        <span className="hidden sm:inline">Export</span>
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body Container */}
                            <div className="relative z-10 flex-1 overflow-y-auto bg-card no-scrollbar">
                                <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8">
                                    {detailsLoading ? (
                                        <div className="flex flex-col items-center justify-center py-32 space-y-6">
                                            <div className="relative">
                                                <div className="w-20 h-20 border-4 border-indigo-500/10 border-t-indigo-600 rounded-full animate-spin"></div>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Activity size={32} className="text-indigo-600 animate-pulse" />
                                                </div>
                                            </div>
                                            <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.4em]">Decrypting Clinical Intelligence...</p>
                                        </div>
                                    ) : (
                                        <div className="min-h-full space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                                            {/* Profile Overview Tab */}
                                            {activeDetailsTab === 'profile' && (
                                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                                                    <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                                                        <div className="bg-muted/10 border border-border/40 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 lg:p-8 shadow-inner group/info">
                                                            <h3 className="text-sm sm:text-base font-black text-foreground tracking-tighter mb-4 flex items-center space-x-3">
                                                                <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-xl shadow-indigo-500/20 group-hover/info:rotate-6 transition-transform">
                                                                    <Info size={14} className="sm:w-[16px] sm:h-[16px]" />
                                                                </div>
                                                                <span>Vital Identification</span>
                                                            </h3>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 sm:gap-x-10 gap-y-4 sm:gap-y-6">
                                                                {[
                                                                    { label: 'Email Address', value: selectedPatient.email, icon: Mail },
                                                                    { label: 'Primary Contact', value: selectedPatient.phone || 'Not Recorded', icon: Phone },
                                                                    { label: 'Date of Birth', value: formatDate(selectedPatient.date_of_birth), icon: Calendar },
                                                                    { label: 'Blood Grouping', value: selectedPatient.blood_group || 'Unknown', icon: Heart, badge: true }
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

                                                        <div className="bg-muted/10 border border-border/40 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 lg:p-8 shadow-inner group/emergency">
                                                            <h3 className="text-sm sm:text-base font-black text-foreground tracking-tighter mb-4 flex items-center space-x-3">
                                                                <div className="p-2 bg-rose-500 rounded-lg text-white shadow-xl shadow-rose-500/20 group-hover/emergency:-rotate-6 transition-transform">
                                                                    <AlertCircle size={14} className="sm:w-[16px] sm:h-[16px]" />
                                                                </div>
                                                                <span>Emergency Protocols</span>
                                                            </h3>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 bg-card/40 backdrop-blur-xl p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-border group-hover/emergency:border-rose-500/20 transition-all duration-500">
                                                                <div className="space-y-2 group/field">
                                                                    <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.15em] group-hover/field:text-rose-500 transition-colors">Guardian / Contact</p>
                                                                    <p className="text-xs sm:text-sm font-black text-foreground tracking-tight">{selectedPatient.emergency_contact_name || 'N/A'}</p>
                                                                </div>
                                                                <div className="space-y-1.5 group/field">
                                                                    <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.15em] group-hover/field:text-rose-500 transition-colors">Emergency Line</p>
                                                                    <p className="text-xs sm:text-sm font-black text-foreground tracking-tight text-rose-500">{selectedPatient.emergency_contact_phone || 'N/A'}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-6 sm:space-y-10">
                                                        <div className="bg-indigo-600 rounded-3xl sm:rounded-[3rem] p-8 sm:p-10 text-white shadow-2xl shadow-indigo-500/20 overflow-hidden relative group/notes">
                                                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover/notes:scale-150 transition-transform duration-1000"></div>
                                                            <Zap size={32} className="sm:w-12 sm:h-12 text-indigo-200/40 mb-6 sm:mb-8 relative z-10" />
                                                            <h4 className="text-lg sm:text-xl font-black tracking-tighter mb-2 relative z-10">Clinical Perspective</h4>
                                                            <p className="text-indigo-100/80 text-[12px] font-bold leading-relaxed mb-6 relative z-10 italic">
                                                                "{selectedPatient.medical_history ? selectedPatient.medical_history.substring(0, 100) + '...' : 'No primary clinical notes active for this patient record.'}"
                                                            </p>
                                                            <button
                                                                onClick={() => setActiveDetailsTab('medical-history')}
                                                                className="w-full py-3 sm:py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl sm:rounded-2xl text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] transition-all relative z-10"
                                                            >
                                                                Examine Full Record
                                                            </button>
                                                        </div>

                                                        <div className="bg-card border border-border/60 rounded-3xl sm:rounded-[3rem] p-8 sm:p-10 shadow-xl space-y-6 sm:space-y-8">
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Patient Score</p>
                                                                <span className="text-xl font-black text-indigo-500">9.4</span>
                                                            </div>
                                                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 w-[94%]"></div>
                                                            </div>
                                                            <p className="text-[9px] font-bold text-muted-foreground/60 leading-relaxed text-center">High diagnostic compliance and clinical stability observed.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Clinical History Tab */}
                                            {activeDetailsTab === 'medical-history' && (
                                                <div className="space-y-6 sm:space-y-8">
                                                    <div className="bg-muted/10 border border-border/40 rounded-[1.5rem] p-4 sm:p-6 shadow-inner group/history">
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                                            <div className="flex items-center space-x-3 sm:space-x-4">
                                                                <div className="p-2 sm:p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20 group-hover/history:scale-110 transition-transform">
                                                                    <Stethoscope size={20} className="sm:w-5 sm:h-5" />
                                                                </div>
                                                                <div>
                                                                    <h3 className="text-lg sm:text-xl font-black text-foreground tracking-tight">Medical Biography</h3>
                                                                    <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">Chronological Patient Registry</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {selectedPatient.medical_history ? (
                                                            <div className="space-y-4">
                                                                {selectedPatient.medical_history.split('\n').filter(line => line.trim()).map((entry, index) => (
                                                                    <div key={index} className="group/item relative pl-8 sm:pl-10 pb-6 last:pb-0">
                                                                        <div className="absolute left-[9px] top-5 bottom-0 w-[2px] bg-indigo-500/10 group-last/item:hidden"></div>
                                                                        <div className="absolute left-0 top-3 w-5 h-5 bg-card rounded-md border text-indigo-500 border-indigo-500/30 flex items-center justify-center shadow-sm group-hover/item:border-indigo-500 group-hover/item:scale-110 transition-all">
                                                                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                                                                        </div>
                                                                        <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-xl p-3 sm:p-4 hover:bg-card hover:shadow-md transition-all duration-300">
                                                                            <p className="text-sm font-medium text-foreground/80 leading-relaxed">{entry}</p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center py-16 bg-muted/5 rounded-3xl border-2 border-dashed border-border/40">
                                                                <div className="p-4 bg-card rounded-2xl border border-border/50 mb-4 shadow-sm">
                                                                    <Stethoscope size={32} className="text-muted-foreground/20" />
                                                                </div>
                                                                <p className="text-xs font-bold text-muted-foreground/40 uppercase tracking-widest">No temporal signatures indexed</p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="bg-rose-500/5 border border-rose-500/10 rounded-[1.5rem] p-4 sm:p-6 group/allergies shadow-inner">
                                                        <div className="flex items-center space-x-3 mb-4">
                                                            <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg group-hover/allergies:rotate-12 transition-transform">
                                                                <AlertCircle size={18} />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-500 tracking-tight">Critical Sensitivities</h3>
                                                                {/* <p className="text-[9px] font-bold text-rose-500/40 uppercase tracking-widest">High-Priority Alerts</p> */}
                                                            </div>
                                                        </div>

                                                        {selectedPatient.allergies ? (
                                                            <div className="flex flex-wrap gap-2 sm:gap-3">
                                                                {selectedPatient.allergies.split(',').map((allergy, index) => (
                                                                    <div key={index} className="group/alert bg-card border border-rose-500/10 rounded-lg py-1.5 px-3 hover:shadow-lg hover:shadow-rose-500/5 hover:border-rose-500/30 transition-all flex items-center space-x-2">
                                                                        <Shield size={12} className="text-rose-500/70 group-hover/alert:text-rose-500 transition-colors" />
                                                                        <span className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide">{allergy.trim()}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center py-12 bg-emerald-500/5 rounded-2xl border-2 border-dashed border-emerald-500/10">
                                                                <Shield size={32} className="text-emerald-500/10 mb-2" />
                                                                <p className="text-[10px] font-bold text-emerald-600/30 uppercase tracking-widest">No Sensitivities Detected</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Medical Records Tab */}
                                            {activeDetailsTab === 'records' && (
                                                <div className="space-y-6 sm:space-y-8">
                                                    {/* Header & Controls */}
                                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center space-x-2">
                                                                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
                                                                    <FileText size={18} />
                                                                </div>
                                                                <h3 className="text-xl font-black text-foreground tracking-tight">Digital Asset Vault</h3>
                                                            </div>
                                                            <p className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-widest pl-1">
                                                                Secure Clinical Documentation
                                                            </p>
                                                        </div>

                                                        <div className="flex flex-col sm:flex-row gap-3">
                                                            {/* Search */}
                                                            <div className="relative group">
                                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-indigo-500 transition-colors" size={14} />
                                                                <input
                                                                    type="text"
                                                                    placeholder="Search records..."
                                                                    value={documentSearch}
                                                                    onChange={(e) => setDocumentSearch(e.target.value)}
                                                                    className="w-full sm:w-64 pl-9 pr-4 py-2.5 bg-muted/30 border border-border/50 rounded-xl text-xs font-bold focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                                                                />
                                                            </div>

                                                            {/* Voice Recorder Button */}
                                                            <button
                                                                onClick={isRecording ? handleStopRecording : handleStartRecording}
                                                                className={`flex items-center justify-center space-x-2 px-5 py-2.5 bg-card text-foreground border border-border/50 rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95 ${isRecording
                                                                    ? 'border-rose-500 text-rose-500 animate-pulse shadow-rose-500/20'
                                                                    : 'hover:border-indigo-500/50 hover:text-indigo-500 hover:shadow-indigo-500/10'
                                                                    }`}
                                                            >
                                                                {isRecording ? <div className="w-3.5 h-3.5 bg-rose-500 rounded-sm animate-pulse" /> : <Mic size={14} />}
                                                                <span>{isRecording ? 'Stop' : 'Voice'}</span>
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
                                                                className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-card text-foreground border border-border/50 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-indigo-500/50 hover:text-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                {uploadingFile ? <RefreshCw size={14} className="animate-spin" /> : <Scan size={14} />}
                                                                <span>{uploadingFile ? 'Scanning...' : 'Scan'}</span>
                                                            </button>

                                                            {/* Upload Button */}
                                                            <button
                                                                onClick={() => setShowFileUpload(true)}
                                                                className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all active:scale-95"
                                                            >
                                                                <Plus size={14} />
                                                                <span>Upload</span>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Filters */}
                                                    <div className="flex flex-wrap gap-2 pb-2 bg-gradient-to-r from-transparent via-transparent to-transparent">
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
                                                                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${documentFilter === filter.id
                                                                    ? 'bg-foreground text-background border-foreground'
                                                                    : 'bg-card border-border/50 text-muted-foreground hover:border-foreground/20 hover:text-foreground'
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
                                                                <div className="flex flex-col items-center justify-center py-24 bg-muted/5 rounded-[2.5rem] border-2 border-dashed border-border/40">
                                                                    <div className="p-6 bg-card rounded-[2rem] border border-border/50 mb-4 shadow-xl">
                                                                        <Search size={32} className="text-muted-foreground/20" />
                                                                    </div>
                                                                    <p className="text-xs font-black text-muted-foreground/30 uppercase tracking-[0.3em]">
                                                                        {documentSearch ? 'No matches found' : 'No documents found'}
                                                                    </p>
                                                                    {documentSearch && (
                                                                        <button
                                                                            onClick={() => setDocumentSearch('')}
                                                                            className="mt-4 text-[10px] font-bold text-indigo-500 hover:text-indigo-600 uppercase tracking-wider"
                                                                        >
                                                                            Clear Search
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            );
                                                        }

                                                        return (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
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
                                                <div className="space-y-6 sm:space-y-12">
                                                    <div className="px-4">
                                                        <h3 className="text-lg sm:text-2xl font-black text-foreground tracking-tighter">Clinical History Timeline</h3>
                                                        <p className="text-[9px] sm:text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mt-1">Audit trail of all previous sessions & consultations</p>
                                                    </div>

                                                    {appointmentLoading ? (
                                                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                                            <RefreshCw size={24} className="animate-spin text-indigo-500/20" />
                                                            <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.4em]">Synchronizing data...</p>
                                                        </div>
                                                    ) : patientAppointments.length === 0 ? (
                                                        <div className="flex flex-col items-center justify-center py-24 bg-muted/10 rounded-[3rem] border-2 border-dashed border-border/40 mx-4">
                                                            <div className="p-8 bg-card rounded-[2rem] border border-border/50 mb-6 shadow-2xl transition-transform hover:rotate-6">
                                                                <Calendar size={56} className="text-muted-foreground/10" />
                                                            </div>
                                                            <p className="text-[11px] font-black text-muted-foreground/30 uppercase tracking-[0.2em]">No digital health records detected</p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-8 px-4 relative">
                                                            {/* Vertical Timeline Thread */}
                                                            <div className="absolute left-[2.45rem] top-4 bottom-4 w-[2px] bg-gradient-to-b from-indigo-500/20 via-slate-500/10 to-transparent hidden sm:block"></div>

                                                            {patientAppointments.map((appointment) => (
                                                                <div key={appointment.id} className="group relative sm:pl-16">
                                                                    {/* Timeline Node */}
                                                                    <div className="absolute left-6 top-6 w-5 h-5 bg-card rounded-full border-[3px] border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)] hidden sm:flex items-center justify-center z-10 group-hover:scale-125 transition-all duration-500">
                                                                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></div>
                                                                    </div>

                                                                    <div className="bg-card/40 backdrop-blur-3xl border border-border/60 rounded-[2rem] p-5 sm:p-7 hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.05)] hover:border-indigo-500/30 transition-all duration-700 relative overflow-hidden">
                                                                        {/* Background Gradient Mesh */}
                                                                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl group-hover:scale-150 transition-all duration-1000"></div>

                                                                        <div className="relative z-10 flex flex-col xl:flex-row xl:items-start justify-between gap-6">
                                                                            <div className="space-y-4 flex-1">
                                                                                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                                                                    <div className="flex items-center space-x-2">
                                                                                        <Calendar size={14} className="text-indigo-500/60" />
                                                                                        <h4 className="text-lg sm:text-2xl font-black text-foreground tracking-tighter">
                                                                                            {formatDate(appointment.appointment_date)}
                                                                                        </h4>
                                                                                    </div>
                                                                                    <div className="w-fit px-3 py-1 bg-muted/40 rounded-full border border-border/40 text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center">
                                                                                        <Clock size={12} className="mr-2 opacity-40" />
                                                                                        {appointment.appointment_time}
                                                                                    </div>
                                                                                </div>

                                                                                <div className="flex flex-wrap items-center gap-4">
                                                                                    <div className="flex items-center p-2.5 px-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100/30 group-hover:border-indigo-500/20 transition-all">
                                                                                        <div className="p-1.5 rounded-lg mr-3 bg-indigo-500/10 text-indigo-500">
                                                                                            <Stethoscope size={14} />
                                                                                        </div>
                                                                                        <div className="flex flex-col">
                                                                                            <span className="text-[8px] font-black text-muted-foreground/50 uppercase tracking-widest leading-none mb-1">Attending Clinician</span>
                                                                                            <span className="text-[11px] font-black text-foreground uppercase tracking-tighter">DR. {appointment.doctor_name || 'AUTHENTICATED MD'}</span>
                                                                                        </div>
                                                                                    </div>

                                                                                    <div className="flex items-center p-2.5 px-4 bg-slate-50/50 dark:bg-slate-900/10 rounded-xl border border-slate-100/30">
                                                                                        <Zap size={14} className="mr-3 text-indigo-500" />
                                                                                        <div className="flex flex-col">
                                                                                            <span className="text-[8px] font-black text-muted-foreground/50 uppercase tracking-widest leading-none mb-1">Consultation Class</span>
                                                                                            <span className="text-[11px] font-black text-foreground uppercase tracking-tighter"> {appointment.appointment_type || 'STANDARD'} SESSION</span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>

                                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                                                                    {/* Clinical Notes Section */}
                                                                                    <div className="p-4 bg-muted/20 border border-border/30 rounded-2xl relative group-hover:bg-card/60 transition-all flex flex-col">
                                                                                        <div className="flex items-center mb-3 px-1">
                                                                                            <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center mr-2">
                                                                                                <FileText size={10} className="text-indigo-500" />
                                                                                            </div>
                                                                                            <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Clinical Ledger</span>
                                                                                        </div>
                                                                                        <p className="text-[12px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed italic pr-4 flex-1">
                                                                                            {appointment.notes ? `"${appointment.notes}"` : "No specific clinical notes were recorded for this session. The patient presented for routine evaluation."}
                                                                                        </p>
                                                                                    </div>

                                                                                    {/* Professional Suggestions Section */}
                                                                                    <div className="p-4 bg-indigo-500/[0.03] border border-indigo-500/10 rounded-2xl relative group-hover:bg-indigo-500/[0.07] transition-all flex flex-col">
                                                                                        <div className="flex items-center mb-3 px-1">
                                                                                            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center mr-2">
                                                                                                <Zap size={10} className="text-indigo-500" />
                                                                                            </div>
                                                                                            <span className="text-[9px] font-black text-indigo-500/60 uppercase tracking-[0.2em]">Strategic Suggestions</span>
                                                                                        </div>
                                                                                        <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200 leading-relaxed pr-4 flex-1">
                                                                                            {appointment.suggestions || "Follow standard clinical protocols as discussed during the consultation."}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
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
                                                <div className="space-y-6 sm:space-y-8">
                                                    {/* Modern Header with Gradient */}
                                                    <div className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 p-6 sm:p-8">
                                                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl"></div>
                                                        <div className="relative z-10 space-y-4">
                                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                                <div className="flex items-center space-x-4">
                                                                    <div className="p-3 sm:p-4 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-xl shadow-indigo-500/20">
                                                                        <Pill size={24} className="text-white sm:w-7 sm:h-7" />
                                                                    </div>
                                                                    <div>
                                                                        <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">Prescription Records</h3>
                                                                        <p className="text-[10px] sm:text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider mt-1">Medication History & Active Prescriptions</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center space-x-2">
                                                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                                                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">
                                                                            {medicalRecords.filter(r => r.prescription || r.file_type === 'prescription').length} Total
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Action Buttons Row */}
                                                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
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
                                                                    className="flex items-center space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-card border border-border/50 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider hover:border-indigo-500/50 hover:bg-indigo-500/5 hover:text-indigo-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    title="Scan Prescription"
                                                                >
                                                                    <Camera size={14} className="sm:w-4 sm:h-4" />
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
                                                                    className="flex items-center space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-card border border-border/50 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider hover:border-purple-500/50 hover:bg-purple-500/5 hover:text-purple-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    title="Upload Prescription File"
                                                                >
                                                                    <Upload size={14} className="sm:w-4 sm:h-4" />
                                                                    <span className="hidden sm:inline">Upload</span>
                                                                </button>

                                                                <div className="w-px h-6 bg-border/50 hidden sm:block"></div>

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
                                                                    className="flex items-center space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-card border border-border/50 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider hover:border-blue-500/50 hover:bg-blue-500/5 hover:text-blue-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    title="Download All Prescriptions"
                                                                >
                                                                    <Download size={14} className="sm:w-4 sm:h-4" />
                                                                    <span className="hidden sm:inline">Download All</span>
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
                                                                    className="flex items-center space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    title="Print All Prescriptions"
                                                                >
                                                                    <Printer size={14} className="sm:w-4 sm:h-4" />
                                                                    <span className="hidden sm:inline">Print All</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {medicalRecords.filter(r => r.prescription || r.file_type === 'prescription').length === 0 ? (
                                                        <div className="flex flex-col items-center justify-center py-20 sm:py-32 bg-gradient-to-br from-muted/30 to-muted/10 rounded-[2rem] sm:rounded-[3rem] border-2 border-dashed border-border/40 relative overflow-hidden">
                                                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.03),transparent_50%)]"></div>
                                                            <div className="relative z-10 flex flex-col items-center">
                                                                <div className="p-8 sm:p-12 bg-card/80 backdrop-blur-sm rounded-[2rem] sm:rounded-[3rem] border border-border/50 mb-6 shadow-2xl">
                                                                    <Pill size={56} className="sm:w-20 sm:h-20 text-muted-foreground/20" />
                                                                </div>
                                                                <h4 className="text-base sm:text-lg font-black text-foreground/60 mb-2">No Prescriptions Found</h4>
                                                                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground/40 text-center max-w-sm">
                                                                    No medication records have been added to this patient's profile yet.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-6">
                                                            {/* Prescription Cards Grid */}
                                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                                                                {medicalRecords
                                                                    .filter(record => record.prescription || record.file_type === 'prescription')
                                                                    .map((record, index) => (
                                                                        <div
                                                                            key={index}
                                                                            className="group/rx bg-card border border-border/60 rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-500/30 transition-all duration-500"
                                                                        >
                                                                            {/* Card Header */}
                                                                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 p-4 sm:p-5 border-b border-border/40">
                                                                                <div className="flex items-start justify-between">
                                                                                    <div className="flex items-center space-x-3">
                                                                                        <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20 group-hover/rx:scale-110 transition-transform">
                                                                                            <Pill size={18} className="text-white" />
                                                                                        </div>
                                                                                        <div>
                                                                                            <div className="flex items-center space-x-2 mb-1">
                                                                                                <h4 className="text-sm sm:text-base font-black text-foreground tracking-tight">Prescription #{index + 1}</h4>
                                                                                                <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                                                                                                    <span className="text-[8px] font-black text-emerald-600 uppercase tracking-wider">Active</span>
                                                                                                </div>
                                                                                            </div>
                                                                                            <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wide">
                                                                                                {record.file_name || 'Rx-' + (index + 1).toString().padStart(4, '0')}
                                                                                            </p>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="flex items-center space-x-1">
                                                                                        {record.file_path && (
                                                                                            <button
                                                                                                onClick={() => window.open(`${API_CONFIG.BASE_URL}/api/files/${record.file_name}`, '_blank')}
                                                                                                className="p-2 text-muted-foreground hover:text-indigo-600 hover:bg-indigo-500/10 rounded-lg transition-all"
                                                                                                title="View Prescription"
                                                                                            >
                                                                                                <Eye size={16} />
                                                                                            </button>
                                                                                        )}
                                                                                        {record.file_path && (
                                                                                            <button
                                                                                                onClick={() => {
                                                                                                    window.open(`${API_CONFIG.BASE_URL}/api/files/${record.file_name}`, '_blank');
                                                                                                    toast.success('Downloading prescription...');
                                                                                                }}
                                                                                                className="p-2 text-muted-foreground hover:text-blue-600 hover:bg-blue-500/10 rounded-lg transition-all"
                                                                                                title="Download Prescription"
                                                                                            >
                                                                                                <Download size={16} />
                                                                                            </button>
                                                                                        )}
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                const printWindow = window.open('', '_blank');
                                                                                                const htmlContent = generateSinglePrescriptionHTML(record, index, selectedPatient, API_CONFIG.BASE_URL, formatDate);
                                                                                                printWindow.document.write(htmlContent);
                                                                                                printWindow.document.close();
                                                                                            }}
                                                                                            className="p-2 text-muted-foreground hover:text-purple-600 hover:bg-purple-500/10 rounded-lg transition-all"
                                                                                            title="Print Prescription"
                                                                                        >
                                                                                            <Printer size={16} />
                                                                                        </button>
                                                                                        {record.file_path && (
                                                                                            <button
                                                                                                onClick={() => handleShareFile(record)}
                                                                                                className="p-2 text-muted-foreground hover:text-green-600 hover:bg-green-500/10 rounded-lg transition-all"
                                                                                                title="Share Prescription"
                                                                                            >
                                                                                                <Share2 size={16} />
                                                                                            </button>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            {/* Card Body - Prescription Details */}
                                                                            <div className="p-4 sm:p-6 space-y-4">
                                                                                {/* File Preview Section */}
                                                                                {record.file_name && (
                                                                                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 border-2 border-indigo-500/20 rounded-2xl p-4 relative overflow-hidden">
                                                                                        <div className="absolute top-0 right-0 p-4 opacity-5">
                                                                                            <FileText size={80} />
                                                                                        </div>
                                                                                        <div className="relative z-10 space-y-3">
                                                                                            <div className="flex items-start justify-between gap-3">
                                                                                                <div className="flex-1 min-w-0">
                                                                                                    <p className="text-[9px] font-black text-indigo-600/60 dark:text-indigo-400/60 uppercase tracking-wider mb-1">Prescription File</p>
                                                                                                    <p className="text-sm font-bold text-foreground truncate" title={record.file_name}>
                                                                                                        {record.file_name}
                                                                                                    </p>
                                                                                                </div>
                                                                                                <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${/\.pdf$/i.test(record.file_name)
                                                                                                    ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                                                                                                    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                                                                                    }`}>
                                                                                                    {/\.pdf$/i.test(record.file_name) ? 'PDF' : 'IMAGE'}
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="bg-white dark:bg-slate-950 rounded-xl overflow-hidden border border-border/40 shadow-sm">
                                                                                                {/\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(record.file_name) ? (
                                                                                                    <img
                                                                                                        src={`${API_CONFIG.BASE_URL}/api/files/${record.file_name}`}
                                                                                                        alt={`Prescription ${index + 1}`}
                                                                                                        className="w-full h-48 object-contain bg-slate-50 dark:bg-slate-900"
                                                                                                        onError={(e) => {
                                                                                                            e.target.style.display = 'none';
                                                                                                            e.target.nextSibling.style.display = 'flex';
                                                                                                        }}
                                                                                                    />
                                                                                                ) : /\.pdf$/i.test(record.file_name) ? (
                                                                                                    <iframe
                                                                                                        src={`${API_CONFIG.BASE_URL}/api/files/${record.file_name}#toolbar=0`}
                                                                                                        className="w-full h-48 bg-slate-50 dark:bg-slate-900"
                                                                                                        title={`Prescription ${index + 1}`}
                                                                                                    />
                                                                                                ) : (
                                                                                                    <div className="w-full h-48 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                                                                                                        <div className="text-center">
                                                                                                            <FileText size={48} className="mx-auto text-muted-foreground/30 mb-2" />
                                                                                                            <p className="text-xs text-muted-foreground">Preview not available</p>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                )}
                                                                                                <div className="hidden w-full h-48 items-center justify-center bg-slate-50 dark:bg-slate-900">
                                                                                                    <div className="text-center">
                                                                                                        <FileText size={48} className="mx-auto text-muted-foreground/30 mb-2" />
                                                                                                        <p className="text-xs text-muted-foreground">Failed to load preview</p>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                )}

                                                                                {/* Meta Information */}
                                                                                <div className="grid grid-cols-2 gap-3">
                                                                                    <div className="bg-muted/30 rounded-xl p-3 border border-border/40">
                                                                                        <div className="flex items-center space-x-2 mb-1.5">
                                                                                            <Calendar size={12} className="text-indigo-500" />
                                                                                            <p className="text-[8px] sm:text-[9px] font-black text-muted-foreground/50 uppercase tracking-wider">Prescribed Date</p>
                                                                                        </div>
                                                                                        <p className="text-xs sm:text-sm font-black text-foreground">{formatDate(record.record_date || record.created_at)}</p>
                                                                                    </div>
                                                                                    <div className="bg-muted/30 rounded-xl p-3 border border-border/40">
                                                                                        <div className="flex items-center space-x-2 mb-1.5">
                                                                                            <UserCircle size={12} className="text-purple-500" />
                                                                                            <p className="text-[8px] sm:text-[9px] font-black text-muted-foreground/50 uppercase tracking-wider">Prescribed By</p>
                                                                                        </div>
                                                                                        <p className="text-xs sm:text-sm font-black text-foreground truncate">
                                                                                            {record.doctor_first_name ? `Dr. ${record.doctor_first_name}` : 'System'}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>


                                                                        </div>
                                                                    ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div >
                        </div >
                    </div >
                )
            }
            {
                showFileUpload && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[160] p-4 animate-in fade-in duration-300">
                        <div className="bg-card border border-border rounded-[2rem] sm:rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-500">
                            <div className="p-6 sm:p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-xl font-black text-foreground tracking-tight">Upload Document</h3>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Clinical Data Storage</p>
                                    </div>
                                    <button
                                        onClick={() => setShowFileUpload(false)}
                                        className="w-10 h-10 flex items-center justify-center hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-foreground border border-border/50"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-wider ml-1">Document Category</label>
                                        <div className="relative">
                                            <select
                                                className="w-full px-5 py-4 bg-muted/50 border border-border rounded-2xl text-sm font-bold focus:bg-card focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none appearance-none cursor-pointer text-foreground"
                                                id="fileType"
                                                defaultValue="medical_record"
                                            >
                                                <option value="medical_record">Medical Report</option>
                                                <option value="lab_result">Lab Result</option>
                                                <option value="imaging">Imaging (X-Ray, CT, MRI)</option>
                                                <option value="other">Other Document</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                                <ChevronRight size={16} className="rotate-90" />
                                            </div>
                                        </div>
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

                                    <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                                        <button
                                            onClick={() => setShowFileUpload(false)}
                                            className="w-full sm:flex-1 px-8 py-4 sm:py-5 border border-border text-muted-foreground rounded-xl sm:rounded-2xl font-black text-[11px] sm:text-sm hover:bg-muted transition-all uppercase tracking-widest"
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
                                            className="w-full sm:flex-[2] py-4 sm:py-5 bg-indigo-600 text-white rounded-xl sm:rounded-2xl font-black text-[11px] sm:text-sm tracking-tight shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all disabled:opacity-50 uppercase tracking-widest"
                                        >
                                            {uploadingFile ? (
                                                <div className="flex items-center justify-center space-x-2">
                                                    <RefreshCw size={18} className="animate-spin" />
                                                    <span>Syncing...</span>
                                                </div>
                                            ) : 'Sync to Cloud'}
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
                    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[200] p-4 animate-in fade-in duration-500">
                        <div className="bg-card/90 backdrop-blur-3xl rounded-[2.5rem] lg:rounded-[3.5rem] w-full max-w-xl shadow-[0_40px_100px_rgba(225,29,72,0.2)] border border-rose-500/20 relative overflow-hidden animate-in zoom-in-95 duration-500">
                            {/* Warning Gradient Accents */}
                            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-rose-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                            <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-rose-500/5 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2"></div>

                            <div className="relative z-10 p-8 sm:p-12 text-center">
                                <div className="flex justify-center mb-8">
                                    <div className="w-24 h-24 bg-rose-500/10 rounded-[2rem] flex items-center justify-center text-rose-500 shadow-inner group-hover:scale-110 transition-transform">
                                        <AlertTriangle size={48} className="animate-pulse" />
                                    </div>
                                </div>

                                <h3 className="text-2xl sm:text-3xl font-black text-foreground tracking-tighter mb-4">
                                    Confirm <span className="text-rose-500">Permanent</span> Deletion
                                </h3>

                                <div className="bg-muted/30 border border-border/50 rounded-2xl p-6 mb-8 text-left space-y-4">
                                    <p className="text-sm font-bold text-muted-foreground leading-relaxed">
                                        You are about to permanently purge this patient record. This action will trigger a cascade deletion of:
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { label: 'Clinical History', icon: Stethoscope },
                                            { label: 'Appointments', icon: Clock },
                                            { label: 'Prescriptions', icon: Pill },
                                            { label: 'Sync Documents', icon: FileText }
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-rose-500/60">
                                                <item.icon size={12} />
                                                <span>{item.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-3 bg-rose-500/5 rounded-xl border border-rose-500/10">
                                        <p className="text-[11px] font-black text-rose-500 uppercase tracking-[0.2em] text-center">
                                            This action cannot be undone
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    <button
                                        onClick={() => {
                                            setShowDeleteConfirm(false);
                                            setPatientToDelete(null);
                                        }}
                                        className="w-full sm:flex-1 py-4 sm:py-5 bg-muted/40 hover:bg-muted/60 text-foreground font-black text-[11px] sm:text-xs uppercase tracking-widest rounded-2xl transition-all"
                                    >
                                        Abort Request
                                    </button>
                                    <button
                                        onClick={confirmDeletePatient}
                                        disabled={actionLoading === 'delete-patient'}
                                        className="w-full sm:flex-[2] py-4 sm:py-5 bg-rose-600 text-white rounded-2xl font-black text-[11px] sm:text-xs uppercase tracking-[0.2em] shadow-2xl shadow-rose-500/20 hover:shadow-rose-500/40 hover:-translate-y-1 transition-all disabled:opacity-50 flex items-center justify-center space-x-3"
                                    >
                                        {actionLoading === 'delete-patient' ? (
                                            <>
                                                <RefreshCw size={18} className="animate-spin" />
                                                <span>Destroying Record...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 size={18} />
                                                <span>Confirm Purge</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Document Delete Confirmation Modal */}
            {
                showDocumentDeleteConfirm && (
                    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[200] p-4 animate-in fade-in duration-500">
                        <div className="bg-card/90 backdrop-blur-3xl rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-rose-500/20 relative overflow-hidden animate-in zoom-in-95 duration-500">
                            <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-rose-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>

                            <div className="relative z-10 p-8 sm:p-10 text-center">
                                <div className="flex justify-center mb-6">
                                    <div className="w-20 h-20 bg-rose-500/10 rounded-[2rem] flex items-center justify-center text-rose-500 shadow-inner">
                                        <Trash2 size={40} className="animate-pulse" />
                                    </div>
                                </div>

                                <h3 className="text-2xl font-black text-foreground tracking-tighter mb-4">
                                    Delete Document?
                                </h3>

                                <div className="bg-muted/30 border border-border/50 rounded-2xl p-5 mb-8 text-left">
                                    <p className="text-sm font-medium text-muted-foreground/80 leading-relaxed mb-4">
                                        You are removing <span className="font-bold text-foreground mx-1">{recordToDelete?.file_name}</span> from the permanent registry.
                                    </p>
                                    <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-rose-500/60 p-3 bg-rose-500/5 rounded-xl border border-rose-500/10">
                                        <AlertTriangle size={12} />
                                        <span>File access will be revoked</span>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    <button
                                        onClick={() => {
                                            setShowDocumentDeleteConfirm(false);
                                            setRecordToDelete(null);
                                        }}
                                        className="w-full sm:flex-1 py-4 bg-muted/40 hover:bg-muted/60 text-foreground font-black text-xs uppercase tracking-widest rounded-xl transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDeleteRecord}
                                        disabled={actionLoading === 'delete-record'}
                                        className="w-full sm:flex-[2] py-4 bg-rose-600 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-rose-500/20 hover:shadow-rose-500/40 hover:-translate-y-1 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                                    >
                                        {actionLoading === 'delete-record' ? (
                                            <>
                                                <RefreshCw size={16} className="animate-spin" />
                                                <span>Deleting...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 size={16} />
                                                <span>Confirm Delete</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Share Menu Modal */}
            {
                showShareMenu && activeShareRecord && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[200] p-4 animate-in fade-in duration-300">
                        <div className="bg-card border border-border/60 rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
                            <div className="p-6 border-b border-border/40 flex items-center justify-between bg-muted/20">
                                <div>
                                    <h3 className="text-xl font-black text-foreground tracking-tight">Share Record</h3>
                                    <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mt-1">Select official channel</p>
                                </div>
                                <button
                                    onClick={() => setShowShareMenu(false)}
                                    className="p-2 hover:bg-muted rounded-xl transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 grid grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                <WhatsappShareButton
                                    url={`${API_CONFIG.BASE_URL}/api/files/${activeShareRecord.file_name}`}
                                    title={`Medical record for ${selectedPatient?.first_name} ${selectedPatient?.last_name}`}
                                    onClick={() => setShowShareMenu(false)}
                                    className="flex flex-col items-center group transition-all"
                                >
                                    <WhatsappIcon size={44} round className="shadow-md group-hover:scale-110 group-hover:shadow-indigo-500/20 transition-all" />
                                    <span className="text-[9px] font-black uppercase tracking-tighter mt-2 text-muted-foreground group-hover:text-emerald-600 transition-colors">WhatsApp</span>
                                </WhatsappShareButton>

                                <TelegramShareButton
                                    url={`${API_CONFIG.BASE_URL}/api/files/${activeShareRecord.file_name}`}
                                    title={`Medical record for ${selectedPatient?.first_name} ${selectedPatient?.last_name}`}
                                    onClick={() => setShowShareMenu(false)}
                                    className="flex flex-col items-center group transition-all"
                                >
                                    <TelegramIcon size={44} round className="shadow-md group-hover:scale-110 group-hover:shadow-indigo-500/20 transition-all" />
                                    <span className="text-[9px] font-black uppercase tracking-tighter mt-2 text-muted-foreground group-hover:text-sky-600 transition-colors">Telegram</span>
                                </TelegramShareButton>

                                <EmailShareButton
                                    url={`${API_CONFIG.BASE_URL}/api/files/${activeShareRecord.file_name}`}
                                    subject="Medical Record from CareConnect"
                                    body={`Please find attached the medical record for ${selectedPatient?.first_name} ${selectedPatient?.last_name}`}
                                    onClick={() => setShowShareMenu(false)}
                                    className="flex flex-col items-center group transition-all"
                                >
                                    <EmailIcon size={44} round className="shadow-md group-hover:scale-110 group-hover:shadow-indigo-500/20 transition-all" />
                                    <span className="text-[9px] font-black uppercase tracking-tighter mt-2 text-muted-foreground group-hover:text-blue-600 transition-colors">Email</span>
                                </EmailShareButton>

                                <FacebookShareButton
                                    url={`${API_CONFIG.BASE_URL}/api/files/${activeShareRecord.file_name}`}
                                    quote={`Medical documentation via CareConnect`}
                                    onClick={() => setShowShareMenu(false)}
                                    className="flex flex-col items-center group transition-all"
                                >
                                    <FacebookIcon size={44} round className="shadow-md group-hover:scale-110 group-hover:shadow-indigo-500/20 transition-all" />
                                    <span className="text-[9px] font-black uppercase tracking-tighter mt-2 text-muted-foreground group-hover:text-blue-700 transition-colors">Facebook</span>
                                </FacebookShareButton>

                                <FacebookMessengerShareButton
                                    url={`${API_CONFIG.BASE_URL}/api/files/${activeShareRecord.file_name}`}
                                    appId="521171313219467"
                                    onClick={() => setShowShareMenu(false)}
                                    className="flex flex-col items-center group transition-all"
                                >
                                    <FacebookMessengerIcon size={44} round className="shadow-md group-hover:scale-110 group-hover:shadow-indigo-500/20 transition-all" />
                                    <span className="text-[9px] font-black uppercase tracking-tighter mt-2 text-muted-foreground group-hover:text-blue-500 transition-colors">Messenger</span>
                                </FacebookMessengerShareButton>

                                <LinkedinShareButton
                                    url={`${API_CONFIG.BASE_URL}/api/files/${activeShareRecord.file_name}`}
                                    title={`Medical record via CareConnect`}
                                    summary={`Patient: ${selectedPatient?.first_name} ${selectedPatient?.last_name}`}
                                    onClick={() => setShowShareMenu(false)}
                                    className="flex flex-col items-center group transition-all"
                                >
                                    <LinkedinIcon size={44} round className="shadow-md group-hover:scale-110 group-hover:shadow-indigo-500/20 transition-all" />
                                    <span className="text-[9px] font-black uppercase tracking-tighter mt-2 text-muted-foreground group-hover:text-blue-800 transition-colors">LinkedIn</span>
                                </LinkedinShareButton>

                                <TwitterShareButton
                                    url={`${API_CONFIG.BASE_URL}/api/files/${activeShareRecord.file_name}`}
                                    title={`Medical record via CareConnect`}
                                    onClick={() => setShowShareMenu(false)}
                                    className="flex flex-col items-center group transition-all"
                                >
                                    <XIcon size={44} round className="shadow-md group-hover:scale-110 group-hover:shadow-indigo-500/20 transition-all" />
                                    <span className="text-[9px] font-black uppercase tracking-tighter mt-2 text-muted-foreground group-hover:text-slate-900 transition-colors">Twitter (X)</span>
                                </TwitterShareButton>

                                <RedditShareButton
                                    url={`${API_CONFIG.BASE_URL}/api/files/${activeShareRecord.file_name}`}
                                    title={`Medical record via CareConnect`}
                                    onClick={() => setShowShareMenu(false)}
                                    className="flex flex-col items-center group transition-all"
                                >
                                    <RedditIcon size={44} round className="shadow-md group-hover:scale-110 group-hover:shadow-indigo-500/20 transition-all" />
                                    <span className="text-[9px] font-black uppercase tracking-tighter mt-2 text-muted-foreground group-hover:text-orange-600 transition-colors">Reddit</span>
                                </RedditShareButton>

                                <ViberShareButton
                                    url={`${API_CONFIG.BASE_URL}/api/files/${activeShareRecord.file_name}`}
                                    title={`Medical record via CareConnect`}
                                    onClick={() => setShowShareMenu(false)}
                                    className="flex flex-col items-center group transition-all"
                                >
                                    <ViberIcon size={44} round className="shadow-md group-hover:scale-110 group-hover:shadow-indigo-500/20 transition-all" />
                                    <span className="text-[9px] font-black uppercase tracking-tighter mt-2 text-muted-foreground group-hover:text-purple-600 transition-colors">Viber</span>
                                </ViberShareButton>

                                <LineShareButton
                                    url={`${API_CONFIG.BASE_URL}/api/files/${activeShareRecord.file_name}`}
                                    title={`Medical record via CareConnect`}
                                    onClick={() => setShowShareMenu(false)}
                                    className="flex flex-col items-center group transition-all"
                                >
                                    <LineIcon size={44} round className="shadow-md group-hover:scale-110 group-hover:shadow-indigo-500/20 transition-all" />
                                    <span className="text-[9px] font-black uppercase tracking-tighter mt-2 text-muted-foreground group-hover:text-green-600 transition-colors">Line</span>
                                </LineShareButton>

                                <PinterestShareButton
                                    url={`${API_CONFIG.BASE_URL}/api/files/${activeShareRecord.file_name}`}
                                    media={`${API_CONFIG.BASE_URL}/api/files/${activeShareRecord.file_name}`}
                                    description={`Medical record via CareConnect`}
                                    onClick={() => setShowShareMenu(false)}
                                    className="flex flex-col items-center group transition-all"
                                >
                                    <PinterestIcon size={44} round className="shadow-md group-hover:scale-110 group-hover:shadow-indigo-500/20 transition-all" />
                                    <span className="text-[9px] font-black uppercase tracking-tighter mt-2 text-muted-foreground group-hover:text-rose-600 transition-colors">Pinterest</span>
                                </PinterestShareButton>

                                <PocketShareButton
                                    url={`${API_CONFIG.BASE_URL}/api/files/${activeShareRecord.file_name}`}
                                    title={`Medical record via CareConnect`}
                                    onClick={() => setShowShareMenu(false)}
                                    className="flex flex-col items-center group transition-all"
                                >
                                    <PocketIcon size={44} round className="shadow-md group-hover:scale-110 group-hover:shadow-indigo-500/20 transition-all" />
                                    <span className="text-[9px] font-black uppercase tracking-tighter mt-2 text-muted-foreground group-hover:text-rose-400 transition-colors">Pocket</span>
                                </PocketShareButton>

                                <button
                                    onClick={() => executeShare('copy')}
                                    className="flex flex-col items-center group transition-all"
                                >
                                    <div className="w-[44px] h-[44px] rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-md group-hover:scale-110 transition-all">
                                        <Link size={20} className="text-slate-600 dark:text-slate-400 group-hover:rotate-45" />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-tighter mt-2 text-muted-foreground group-hover:text-foreground">Copy Link</span>
                                </button>

                                {navigator.share && (
                                    <button
                                        onClick={() => {
                                            setShowShareMenu(false);
                                            executeShare('native');
                                        }}
                                        className="flex flex-col items-center group transition-all"
                                    >
                                        <div className="w-[44px] h-[44px] rounded-full bg-blue-600 flex items-center justify-center shadow-md group-hover:scale-110 transition-all">
                                            <Share2 size={20} className="text-white" />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-tighter mt-2 text-muted-foreground group-hover:text-blue-600">More Apps</span>
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

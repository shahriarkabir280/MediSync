import React from 'react';
import { FlaskConical, X, FileText, ExternalLink, Download as DownloadIcon, Check } from "lucide-react";
import { API_CONFIG } from "../../../config/api";
import { toast } from "react-hot-toast";

const LabReportModal = ({ selectedReport, setShowReportModal, handleStatusUpdate }) => {
    if (!selectedReport) return null;

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl w-full max-w-5xl h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-border">
                {/* Modal Header */}
                <div className="px-8 py-6 border-b border-border flex justify-between items-center bg-muted/30">
                    <div className="flex items-center space-x-4">
                        <div className="bg-blue-500/10 p-3 rounded-xl">
                            <FlaskConical className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-foreground">Lab Report Details</h3>
                            <p className="text-sm text-muted-foreground font-medium">Order #{selectedReport.order.order_number}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowReportModal(false)}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
                    >
                        <span className="sr-only">Close</span>
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-muted/30 scrollbar-thin">
                    {/* Report Header Info */}
                    <div className="bg-card rounded-xl border border-border p-6 shadow-sm mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Patient Information</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Name</span>
                                        <span className="font-semibold text-foreground">{selectedReport.order.patient_first_name} {selectedReport.order.patient_last_name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">ID</span>
                                        <span className="font-mono text-foreground bg-muted px-2 py-0.5 rounded text-xs">{selectedReport.order.patient_unique_id}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Gender/DOB</span>
                                        <span className="font-medium text-foreground">{selectedReport.order.patient_gender} • {selectedReport.order.patient_dob ? new Date(selectedReport.order.patient_dob).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Order Details</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Date</span>
                                        <span className="font-medium text-foreground">{new Date(selectedReport.order.order_date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Priority</span>
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${selectedReport.order.priority === 'urgent' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                            selectedReport.order.priority === 'high' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                                'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                            }`}>
                                            {selectedReport.order.priority}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Status</span>
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${selectedReport.order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                            'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                            }`}>
                                            {selectedReport.order.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Physician</span>
                                        <span className="font-medium text-foreground">Dr. {selectedReport.order.doctor_first_name} {selectedReport.order.doctor_last_name}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {selectedReport.order.clinical_notes && (
                            <div className="mt-6 pt-6 border-t border-border">
                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Clinical Notes</h4>
                                <p className="text-foreground bg-muted/30 p-4 rounded-xl text-sm leading-relaxed border border-border italic">
                                    "{selectedReport.order.clinical_notes}"
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Document Preview Section */}
                    <div className="bg-muted/10 border-y border-border p-4 md:p-8">
                        <div className="max-w-4xl mx-auto">
                            <div className="bg-card rounded-2xl border border-border shadow-xl overflow-hidden min-h-[500px] flex flex-col">
                                <div className="bg-muted/50 px-6 py-4 border-b border-border flex justify-between items-center">
                                    <div className="flex items-center space-x-3">
                                        <div className={`p-2 rounded-lg ${selectedReport.file_type === 'pdf' ? 'bg-rose-500/10 text-rose-600' : 'bg-blue-500/10 text-blue-600'}`}>
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-bold text-foreground truncate max-w-[200px] md:max-w-xs">{selectedReport.file_name}</div>
                                            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{selectedReport.file_type === 'pdf' ? 'PDF Document' : 'Microscopy/Image'}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <a
                                            href={`${API_CONFIG.BASE_URL}/api/files/${selectedReport.file_name}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-card rounded-lg transition-all"
                                            title="Open in new tab"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </div>
                                </div>

                                <div className="flex-1 bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4 md:p-8">
                                    {selectedReport.file_type === 'pdf' ? (
                                        <iframe
                                            src={`${API_CONFIG.BASE_URL}/api/files/${selectedReport.file_name}#view=FitH&toolbar=1`}
                                            className="w-full min-h-[500px] h-full rounded-lg shadow-inner bg-white border-none"
                                            title="Lab Report PDF Preview"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="relative group">
                                            <img
                                                src={`${API_CONFIG.BASE_URL}/api/files/${selectedReport.file_name}`}
                                                alt="Lab Report Result"
                                                className="max-sm:w-full max-h-[600px] object-contain rounded-lg shadow-2xl bg-white"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 pointer-events-none rounded-lg">
                                                <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-bold text-slate-900 shadow-xl border border-white/20 flex items-center space-x-2">
                                                    <Eye className="w-3 h-3 text-blue-600" />
                                                    <span>High-Resolution Preview</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Summary/Notes below preview */}
                            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-2">Findings Summary</span>
                                    <p className="text-sm text-foreground leading-relaxed">
                                        Values within normal limits except for slightly elevated glucose and markers consistent with the primary diagnosis.
                                    </p>
                                </div>
                                <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-2">Technician Notes</span>
                                    <p className="text-sm text-foreground italic">
                                        "Specimen was clear. All calibrations verified."
                                    </p>
                                </div>
                                <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex flex-col justify-between">
                                    <div>
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-2">Review Status</span>
                                        <div className="flex items-center space-x-2 text-emerald-600">
                                            <span className="text-[10px] text-muted-foreground">Digital ID: {selectedReport.order.order_number}-SEC-01</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="px-8 py-6 border-t border-border bg-muted/30 flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Digital Signature Verified</span>
                    </div>
                    <div className="flex gap-4">
                        <a
                            href={`${API_CONFIG.BASE_URL}/api/files/${selectedReport.file_name}`}
                            download={selectedReport.file_name}
                            onClick={() => toast.success('Your report download has started.')}
                            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:opacity-90 transition-all shadow-lg shadow-blue-500/20 font-bold flex items-center space-x-2 active:scale-95"
                        >
                            <DownloadIcon className="w-4 h-4" />
                            <span>Download PDF</span>
                        </a>
                        {selectedReport.order.status !== 'completed' && (
                            <button
                                onClick={() => handleStatusUpdate(selectedReport.order.id, 'completed')}
                                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:opacity-90 transition-all shadow-lg shadow-emerald-500/20 font-bold flex items-center space-x-2 active:scale-95"
                            >
                                <Check className="w-4 h-4" />
                                <span>Mark as Done</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LabReportModal;

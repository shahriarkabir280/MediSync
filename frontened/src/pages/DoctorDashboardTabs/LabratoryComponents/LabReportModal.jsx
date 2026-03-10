import React from 'react';
import { FlaskConical, X, FileText, ExternalLink, Download as DownloadIcon, Check, Eye } from "lucide-react";
import { API_CONFIG } from "../../../config/api";
import { toast } from "react-hot-toast";

const LabReportModal = ({ selectedReport, setShowReportModal, handleStatusUpdate, onVerify }) => {
    if (!selectedReport) return null;

    const isPdf = selectedReport.file_type === 'pdf' || selectedReport.file_name?.toLowerCase().endsWith('.pdf');
    const fileUrl = `${API_CONFIG.BASE_URL}/api/files/${selectedReport.file_name}`;

    // Check if any results need verification
    const needsVerification = selectedReport.items.some(item => !item.verified_by);

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-5xl h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-white/20 relative">
                
                {/* Minimal Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                    <div className="flex items-center space-x-3">
                        <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
                            <FlaskConical className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-none">Lab Report</h3>
                            <div className="flex items-center space-x-2 mt-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Order #{selectedReport.order.order_number}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{new Date(selectedReport.order.order_date).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowReportModal(false)}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Compact Info Bar */}
                <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-x-8 gap-y-2 items-center">
                    <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Patient</span>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{selectedReport.order.patient_first_name} {selectedReport.order.patient_last_name}</span>
                        <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded-md bg-slate-200/50 dark:bg-slate-700 font-mono">ID: {selectedReport.order.patient_unique_id}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Priority</span>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                            selectedReport.order.priority === 'urgent' 
                            ? 'bg-rose-50 text-rose-600 border-rose-200' 
                            : 'bg-blue-50 text-blue-600 border-blue-200'
                        }`}>
                            {selectedReport.order.priority}
                        </span>
                    </div>

                    <div className="flex items-center space-x-2 ml-auto">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Signed By</span>
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Dr. {selectedReport.order.doctor_last_name}</span>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-hidden flex flex-col bg-slate-100 dark:bg-slate-950">
                    <div className="flex-1 relative group bg-white dark:bg-slate-900 m-4 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                        
                        {/* Tooltip for image */}
                        {!isPdf && (
                            <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] font-bold text-white shadow-xl flex items-center space-x-2">
                                <Eye className="w-3 h-3 text-blue-400" />
                                <span>High Resolution Imagery</span>
                            </div>
                        )}

                        {isPdf ? (
                            <iframe
                                src={`${fileUrl}#view=FitH&toolbar=1`}
                                className="w-full h-full border-none"
                                title="Report Preview"
                                loading="lazy"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center p-4 overflow-auto scrollbar-hide">
                                <img
                                    src={fileUrl}
                                    alt="Lab Result"
                                    className="max-w-full max-h-full object-contain cursor-zoom-in"
                                />
                            </div>
                        )}
                    </div>

                    {/* Minimal Observations Bar */}
                    {selectedReport.order.clinical_notes && (
                        <div className="mx-6 mb-4 px-4 py-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-800/30 rounded-xl">
                            <div className="flex items-start space-x-3">
                                <FileText className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                                    "{selectedReport.order.clinical_notes}"
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Simplified Footer */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                            <Check className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-wider">Secured Document</p>
                            <p className="text-[8px] text-slate-400 font-mono tracking-tighter">HASH: {selectedReport.order.order_number}-SEC-01</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                        <a
                            href={fileUrl}
                            download={selectedReport.file_name}
                            onClick={() => toast.success('Report download started')}
                            className="p-2.5 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"
                            title="Download Report"
                        >
                            <DownloadIcon className="w-5 h-5" />
                        </a>
                        
                        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>

                        {selectedReport.order.status !== 'completed' && (
                            <button
                                onClick={() => handleStatusUpdate(selectedReport.order.id, 'completed')}
                                className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl font-bold text-sm tracking-tight hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
                            >
                                Finalize Order
                            </button>
                        )}

                        {needsVerification && (
                            <button
                                onClick={() => onVerify(selectedReport.order.id)}
                                className="flex items-center space-x-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm tracking-tight hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-emerald-600/20"
                            >
                                <Check className="w-4 h-4" />
                                <span>Verify & Sign Off</span>
                            </button>
                        )}

                        <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm tracking-tight hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-blue-600/20"
                        >
                            <ExternalLink className="w-4 h-4" />
                            <span>Full View</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LabReportModal;

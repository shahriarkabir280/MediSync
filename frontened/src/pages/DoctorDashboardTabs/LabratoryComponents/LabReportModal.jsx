import React from 'react';
import { FlaskConical, X, FileText, ExternalLink, Download as DownloadIcon, Check } from "lucide-react";
import { API_CONFIG } from "../../../config/api";
import { toast } from "react-hot-toast";

const LabReportModal = ({ selectedReport, setShowReportModal, handleStatusUpdate, onVerify }) => {
    if (!selectedReport) return null;

    const isPdf = selectedReport.file_type === 'pdf' || selectedReport.file_name?.toLowerCase().endsWith('.pdf');
    const fileUrl = `${API_CONFIG.BASE_URL}/api/files/${selectedReport.file_name}`;
    const needsVerification = selectedReport.items.some(item => !item.verified_by);

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-3 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl h-[88vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800">

                {/* Header */}
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-1.5 rounded-lg">
                            <FlaskConical className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-none">Lab Report</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-slate-400 font-mono">#{selectedReport.order.order_number}</span>
                                <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
                                <span className="text-[10px] text-blue-600 font-semibold">
                                    {new Date(selectedReport.order.order_date).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowReportModal(false)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Info Bar */}
                <div className="px-4 py-1.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-x-5 gap-y-1 items-center">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Patient</span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                            {selectedReport.order.patient_first_name} {selectedReport.order.patient_last_name}
                        </span>
                        <span className="text-[9px] text-slate-400 px-1 py-0.5 rounded bg-slate-200/60 dark:bg-slate-700 font-mono">
                            {selectedReport.order.patient_unique_id}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Priority</span>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full border ${
                            selectedReport.order.priority === 'urgent'
                            ? 'bg-rose-50 text-rose-600 border-rose-200'
                            : 'bg-blue-50 text-blue-600 border-blue-200'
                        }`}>
                            {selectedReport.order.priority}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 ml-auto">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Dr.</span>
                        <span className="text-xs text-slate-600 dark:text-slate-300">{selectedReport.order.doctor_last_name}</span>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-hidden flex flex-col bg-slate-100 dark:bg-slate-950">
                    <div className="flex-1 relative bg-white dark:bg-slate-900 m-2.5 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        {isPdf ? (
                            <iframe
                                src={`${fileUrl}#view=FitH&toolbar=1`}
                                className="w-full h-full border-none"
                                title="Report Preview"
                                loading="lazy"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center p-3 overflow-auto scrollbar-hide">
                                <img
                                    src={fileUrl}
                                    alt="Lab Result"
                                    className="max-w-full max-h-full object-contain"
                                />
                            </div>
                        )}
                    </div>

                    {/* Clinical Notes (only if present) */}
                    {selectedReport.order.clinical_notes && (
                        <div className="mx-2.5 mb-2.5 px-3 py-2 bg-blue-50/60 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-800/30 rounded-lg flex items-start gap-2">
                            <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed italic">
                                {selectedReport.order.clinical_notes}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 flex items-center justify-end gap-2">
                    <a
                        href={fileUrl}
                        download={selectedReport.file_name}
                        onClick={() => toast.success('Download started')}
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                        title="Download"
                    >
                        <DownloadIcon className="w-4 h-4" />
                    </a>

                    <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition-all shadow-md shadow-blue-600/20"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Full View
                    </a>

                    {selectedReport.order.status !== 'completed' && (
                        <button
                            onClick={() => handleStatusUpdate(selectedReport.order.id, 'completed')}
                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
                        >
                            Finalize
                        </button>
                    )}

                    {needsVerification && (
                        <button
                            onClick={() => onVerify(selectedReport.order.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-all shadow-md shadow-emerald-600/20"
                        >
                            <Check className="w-3.5 h-3.5" />
                            Verify
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LabReportModal;

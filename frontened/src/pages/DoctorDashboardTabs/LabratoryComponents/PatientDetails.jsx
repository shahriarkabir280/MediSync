import React, { memo, useState, useEffect, useCallback } from 'react';
import {
    User, FlaskConical, Clock, Calendar, Plus, Eye,
    Activity, FileText, Stethoscope, ArrowLeft, ChevronRight,
    Search, Download, AlertCircle, CheckCircle2
} from "lucide-react";
import { prescriptionApi, labApi } from '../../../lib/api';
import { printElement } from '../../../lib/printUtils';
import PrescriptionForm from './PrescriptionForm';
import PrescriptionTemplate from './PrescriptionTemplate';

const PatientDetails = memo(({
    selectedPatient,
    doctor,
    doctorId,
    setShowNewOrderModal,
    selectedSubTab,
    setSelectedSubTab,
    handleViewReport,
    setSelectedReport,
    setShowReportModal,
    onBack,
}) => {
    const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
    const [viewingPrescription, setViewingPrescription] = useState(null);
    const [prescriptionHistory, setPrescriptionHistory] = useState([]);
    const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
    
    // Lab History State
    const [labHistory, setLabHistory] = useState([]);
    const [loadingLab, setLoadingLab] = useState(false);

    // Load custom letterhead settings 
    const [customLetterhead, setCustomLetterhead] = useState(() => {
        try {
            const key = `prescription_settings_${doctorId || 'default'}`;
            const saved = localStorage.getItem(key);
            return saved ? JSON.parse(saved) : null;
        } catch { return null; }
    });

    const fetchLabHistory = useCallback(async () => {
        if (!selectedPatient) return;
        try {
            setLoadingLab(true);
            const result = await labApi.getHistory(selectedPatient.id);
            if (result.success) {
                setLabHistory(result.data);
            }
        } catch (err) {
            console.error("Error fetching lab history:", err);
        } finally {
            setLoadingLab(false);
        }
    }, [selectedPatient]);

    useEffect(() => {
        fetchLabHistory();
    }, [fetchLabHistory]);

    // Refresh history when sub-tabs change
    useEffect(() => {
        if (selectedSubTab === 'new-reports' || selectedSubTab === 'processing') {
            fetchLabHistory();
        }
    }, [selectedSubTab, fetchLabHistory]);

    // Load prescription history 
    useEffect(() => {
        if (selectedSubTab === 'prescription' && selectedPatient) {
            setLoadingPrescriptions(true);
            prescriptionApi.getByPatient(selectedPatient.id)
                .then(res => { if (res?.data) setPrescriptionHistory(res.data); })
                .catch(() => setPrescriptionHistory([]))
                .finally(() => setLoadingPrescriptions(false));
        }
    }, [selectedSubTab, selectedPatient]);

    // ── Filter Tests ──
    const confirmedTests = labHistory.filter(t => t.order_status !== 'pending' && t.order_status !== 'cancelled');
    const inProgressTests = confirmedTests.filter(t => t.status === 'processing' || t.status === 'new');
    const completedResults = confirmedTests.filter(t => t.status === 'done' || t.status === 'completed');

    if (!selectedPatient) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50/30 dark:bg-slate-950/10">
                <div className="w-16 h-16 bg-muted rounded-3xl flex items-center justify-center mb-4 text-muted-foreground/30 shadow-inner">
                    <User className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1">Select A Patient Profile</h3>
                <p className="text-[10px] text-muted-foreground max-w-[200px] leading-relaxed uppercase tracking-wider">
                    Browse the clinical queue to view history and diagnostics.
                </p>
            </div>
        );
    }

    if (showPrescriptionForm) {
        return (
            <PrescriptionForm
                patient={selectedPatient}
                doctor={doctor}
                doctorId={doctorId}
                onSaveSuccess={() => {
                    setShowPrescriptionForm(false);
                    setSelectedSubTab('prescription');
                    prescriptionApi.getByPatient(selectedPatient.id)
                        .then(res => { if (res?.data) setPrescriptionHistory(res.data); })
                        .catch(() => { });
                }}
                onCancel={() => setShowPrescriptionForm(false)}
            />
        );
    }

    if (viewingPrescription) {
        return (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-[210mm] w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/20 rounded-t-2xl">
                        <span className="text-xs font-bold text-foreground truncate mr-2">
                            Rx — {new Date(viewingPrescription.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <div className="flex gap-1.5 flex-shrink-0">
                            <button
                                onClick={() => printElement('prescription-print-area', `${selectedPatient.unique_id || selectedPatient.id}_${selectedPatient.last_name || ''}`)}
                                className="flex items-center gap-1 px-2.5 py-1 bg-teal-600 text-white text-[11px] font-bold rounded-lg hover:bg-teal-700 transition-all font-print-hide"
                            >
                                Print
                            </button>
                            <button
                                onClick={() => setViewingPrescription(null)}
                                className="px-2.5 py-1 border border-border text-[11px] font-bold text-muted-foreground rounded-lg hover:bg-muted transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                    <PrescriptionTemplate
                        prescription={viewingPrescription}
                        doctor={doctor}
                        patient={selectedPatient}
                        customLetterhead={customLetterhead}
                    />
                </div>
            </div>
        );
    }

    const SUB_TABS = [
        { id: 'new-reports', label: 'Results', icon: <Activity className="w-4 h-4" /> },
        { id: 'processing', label: 'New & Progress', icon: <Clock className="w-4 h-4" /> },
        { id: 'history', label: 'History', icon: <Calendar className="w-4 h-4" /> },
        { id: 'prescription', label: 'Prescriptions', icon: <FileText className="w-4 h-4" /> },
    ];

    const initials = `${selectedPatient.first_name?.[0] || ''}${selectedPatient.last_name?.[0] || ''}`.toUpperCase() || 'U';

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-50/20 dark:bg-slate-950/5">

            {/* ── Mobile Back Bar ── */}
            <div className="lg:hidden flex items-center gap-2 px-3 py-2 border-b border-border bg-card flex-shrink-0">
                <button
                    onClick={onBack}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Patients
                </button>
                <span className="text-muted-foreground/40 text-xs">/</span>
                <span className="text-xs font-semibold text-foreground truncate">
                    {selectedPatient.first_name} {selectedPatient.last_name}
                </span>
            </div>

            {/* ── Main scrollable content ── */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-3 sm:p-4 space-y-3 sm:space-y-4">

                {/* ── Patient Header Card ── */}
                <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-sm overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
                    
                    <div className="flex items-center gap-4 mb-4 relative z-10">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-600/20">
                            {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex wrap items-center gap-2 mb-0.5">
                                <h3 className="text-sm sm:text-base font-black text-foreground leading-tight tracking-tight">
                                    {selectedPatient.first_name || selectedPatient.name} {selectedPatient.last_name || ''}
                                </h3>
                                <div className="flex gap-1.5">
                                    <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${
                                        selectedPatient.status === 'Urgent' ? 'bg-red-500 text-white shadow-sm shadow-red-500/20' : 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                                    }`}>
                                        {selectedPatient.status || 'Stable'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex wrap gap-x-4 gap-y-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                                <span>ID: {selectedPatient.unique_id || selectedPatient.id}</span>
                                <span>Age: {selectedPatient.age || 'N/A'}</span>
                                <span className={selectedPatient.gender === 'Female' ? 'text-pink-600/70' : 'text-blue-600/70'}>
                                    {selectedPatient.patient_gender || selectedPatient.gender || 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2.5 relative z-10">
                         <button
                            onClick={() => setShowPrescriptionForm(true)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-teal-600/10 transition-all active:scale-95 group"
                        >
                            <Stethoscope className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                            <span>Prescribe</span>
                        </button>
                        <button
                            onClick={() => setShowNewOrderModal(true)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-600/10 transition-all active:scale-95 group"
                        >
                            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                            <span>New Order</span>
                        </button>
                    </div>
                </div>

                {/* ── Tabs Content ── */}
                <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col min-h-[450px]">
                    <div className="border-b border-border bg-muted/10 shrink-0">
                        <nav className="flex px-1.5">
                            {SUB_TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setSelectedSubTab(tab.id)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-4 transition-all text-[9px] font-black uppercase tracking-widest border-b-2 ${
                                        selectedSubTab === tab.id
                                            ? 'border-blue-600 text-blue-600 bg-blue-50/50 dark:bg-blue-900/10'
                                            : 'border-transparent text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {tab.icon}
                                    <span className="inline">{tab.label}</span>
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="p-4 sm:p-5 flex-1">

                        {/* ── Results Tab ── */}
                        {selectedSubTab === 'new-reports' && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between mb-4 px-1">
                                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Released Reports</h4>
                                    <span className="text-[9px] font-black text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">{completedResults.length} ITEMS</span>
                                </div>
                                
                                {loadingLab ? (
                                    <div className="space-y-3">
                                        {[1, 2, 3].map(i => <div key={i} className="h-14 bg-muted/20 animate-pulse rounded-2xl" />)}
                                    </div>
                                ) : completedResults.length === 0 ? (
                                    <div className="py-20 text-center text-muted-foreground/30">
                                         <FlaskConical className="w-10 h-10 mx-auto mb-4 opacity-10" />
                                         <p className="text-[10px] font-black uppercase tracking-widest">Awaiting lab releases</p>
                                    </div>
                                ) : (
                                    completedResults.map((test) => (
                                        <div
                                            key={test.item_id}
                                            onClick={() => {
                                                setSelectedReport({
                                                    order: {
                                                        order_id: test.order_id,
                                                        order_number: test.order_number,
                                                        patient_first_name: selectedPatient.first_name,
                                                        patient_last_name: selectedPatient.last_name,
                                                        patient_unique_id: selectedPatient.unique_id,
                                                        order_date: test.order_date,
                                                        priority: test.order_priority,
                                                        doctor_name: test.doctor_name
                                                    },
                                                    items: [{
                                                        test_name: test.test_name,
                                                        test_code: test.test_code,
                                                        result_text: test.result?.result_text,
                                                        result_value: test.result?.result_value,
                                                        status: test.result?.status
                                                    }],
                                                    file_name: test.result?.file_name,
                                                    file_path: test.result?.file_path
                                                });
                                                setShowReportModal(true);
                                            }}
                                            className="group flex items-center gap-4 p-4 bg-white dark:bg-slate-900/50 border border-border/60 rounded-2xl hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all cursor-pointer border-l-4 border-l-emerald-500"
                                        >
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 shadow-inner">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                     <h5 className="font-black text-xs text-foreground truncate">{test.test_name}</h5>
                                                </div>
                                                <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
                                                    Order: #{test.order_number} · {new Date(test.order_date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                 <div className="flex flex-col items-end">
                                                      <span className="text-[8px] font-black text-emerald-600 uppercase">Released</span>
                                                      <span className="text-[7px] text-muted-foreground/40 font-bold">{new Date(test.result?.result_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                 </div>
                                                 <ChevronRight className="w-4 h-4 text-muted-foreground/20 group-hover:text-blue-600 transition-colors" />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* ── In Progress Tab ── */}
                        {selectedSubTab === 'processing' && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between mb-4 px-1">
                                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Active Diagnostics Flow</h4>
                                    <div className="flex gap-2">
                                        <span className="text-[8px] text-muted-foreground/30">H:{labHistory.length}</span>
                                        <span className="text-[9px] font-black text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-full">{inProgressTests.length} ACTIVE</span>
                                    </div>
                                </div>

                                {loadingLab ? (
                                    <div className="space-y-3">
                                        {[1, 2, 3].map(i => <div key={i} className="h-14 bg-muted/20 animate-pulse rounded-2xl" />)}
                                    </div>
                                ) : inProgressTests.length === 0 ? (
                                    <div className="py-20 text-center border-2 border-dashed border-muted/20 rounded-3xl">
                                         <Clock className="w-10 h-10 mx-auto mb-4 opacity-10" />
                                         <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">No active lab runs</p>
                                    </div>
                                ) : (
                                    inProgressTests.map((test) => (
                                        <div key={test.item_id} className="flex items-center gap-4 p-5 bg-muted/5 border border-border/40 rounded-2xl relative overflow-hidden group">
                                            <div className={`absolute top-0 left-0 w-1 h-full ${test.status === 'new' ? 'bg-amber-500' : 'bg-blue-500/20'} group-hover:bg-blue-500 transition-colors`} />
                                            
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${test.status === 'new' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 animate-pulse'} shadow-inner`}>
                                                <Activity className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h5 className="font-black text-xs text-foreground leading-none tracking-tight">{test.test_name}</h5>
                                                    {test.status === 'new' && (
                                                        <span className="text-[7px] font-black bg-amber-500 text-white px-1.5 py-0.5 rounded-sm animate-pulse tracking-widest">NEW</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                     <span className="text-[8px] font-black text-muted-foreground/50 uppercase tracking-widest">#{test.order_number}</span>
                                                     <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
                                                     <span className="text-[8px] font-black text-blue-600/70 uppercase">Sent {new Date(test.order_date).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col items-end">
                                                    <span className={`text-[9px] font-black ${test.status === 'new' ? 'text-amber-600' : 'text-blue-600'} uppercase tracking-widest flex items-center gap-1.5`}>
                                                        {test.status === 'new' ? (
                                                            <>Awaiting Queue</>
                                                        ) : (
                                                            <>
                                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
                                                                Analyzing
                                                            </>
                                                        )}
                                                    </span>
                                                    <span className="text-[7px] font-bold text-muted-foreground/40 mt-1 uppercase">
                                                        {test.status === 'new' ? 'Just Sent' : 'In Lab Queue'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                                
                                {inProgressTests.length > 0 && (
                                    <p className="text-[8px] text-center text-muted-foreground/40 font-black uppercase tracking-widest mt-6">
                                        Reports will move to Results tab as soon as they are validated.
                                    </p>
                                )}
                            </div>
                        )}

                        {/* ── History Tab ── */}
                        {selectedSubTab === 'history' && (
                            <div className="py-20 text-center">
                                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-10" />
                                <h5 className="text-[11px] font-black uppercase tracking-widest text-foreground">Longitudinal Charting</h5>
                                <p className="text-[10px] max-w-[220px] mx-auto mt-2 text-muted-foreground/60 leading-relaxed font-bold uppercase">
                                    Clinical trends and historical data visualization coming in v2.4
                                </p>
                            </div>
                        )}

                        {/* ── Prescription History Tab ── */}
                        {selectedSubTab === 'prescription' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-4 px-1">
                                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Medical Script Archive</h4>
                                    <button
                                        onClick={() => setShowPrescriptionForm(true)}
                                        className="flex items-center gap-1.5 text-[9px] font-black text-teal-600 hover:text-white hover:bg-teal-600 bg-teal-50 dark:bg-teal-900/20 px-3 py-2 rounded-xl border border-teal-200 dark:border-teal-800 transition-all uppercase tracking-widest"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> WRITE NEW
                                    </button>
                                </div>

                                {loadingPrescriptions ? (
                                    <div className="py-12 text-center">
                                        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Syncing Rx Records...</p>
                                    </div>
                                ) : prescriptionHistory.length === 0 ? (
                                    <div className="py-20 text-center border-2 border-dashed border-muted/20 rounded-3xl">
                                        <FileText className="w-12 h-12 text-muted-foreground/10 mx-auto mb-4" />
                                        <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest mb-6">No historical scripts found</p>
                                        <button
                                            onClick={() => setShowPrescriptionForm(true)}
                                            className="px-6 py-3 bg-teal-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-teal-600/20 transition-all hover:scale-105"
                                        >
                                            Initiate Rx
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-2.5">
                                        {prescriptionHistory.map((rx, idx) => (
                                            <div
                                                key={rx.id || idx}
                                                className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-border/60 rounded-2xl hover:border-teal-600/50 hover:shadow-lg transition-all cursor-pointer group border-l-4 border-l-teal-600"
                                                onClick={() => setViewingPrescription(rx)}
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center text-teal-600 shrink-0 shadow-inner">
                                                    <FileText className="w-5 h-5 flex-shrink-0" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-black text-foreground truncate uppercase tracking-tight">{rx.diagnosis || 'Active Script'}</p>
                                                    <p className="text-[9px] font-bold text-muted-foreground/60 mt-1 uppercase tracking-tight">
                                                        Issued: {new Date(rx.created_at).toLocaleDateString()}
                                                        {rx.prescription_items?.length ? ` · ${rx.prescription_items.length} MEDICATIONS` : ''}
                                                    </p>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-muted/20 flex items-center justify-center text-muted-foreground/30 group-hover:bg-teal-600 group-hover:text-white transition-all">
                                                    <ChevronRight className="w-4 h-4" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

export default PatientDetails;

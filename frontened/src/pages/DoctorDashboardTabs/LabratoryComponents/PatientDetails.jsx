import React, { memo, useState, useEffect } from 'react';
import { User, FlaskConical, Clock, Calendar, Plus, Eye, ExternalLink, Activity, Info, FileText, Stethoscope } from "lucide-react";
import { prescriptionApi } from '../../../lib/api';
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
    setShowReportModal
}) => {
    const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
    const [viewingPrescription, setViewingPrescription] = useState(null);
    const [prescriptionHistory, setPrescriptionHistory] = useState([]);
    const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);

    // Load prescription history when the prescription sub-tab is selected
    useEffect(() => {
        if (selectedSubTab === 'prescription' && selectedPatient) {
            setLoadingPrescriptions(true);
            prescriptionApi.getByPatient(selectedPatient.id)
                .then(res => {
                    if (res?.data) setPrescriptionHistory(res.data);
                })
                .catch(() => {
                    // API may not be set up yet — show empty state gracefully
                    setPrescriptionHistory([]);
                })
                .finally(() => setLoadingPrescriptions(false));
        }
    }, [selectedSubTab, selectedPatient]);

    if (!selectedPatient) {
        return (
            <div className="bg-card border-2 border-dashed border-border rounded-2xl p-12 md:p-20 text-center flex-1 flex flex-col items-center justify-center m-4">
                <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mb-6 text-muted-foreground/40">
                    <User className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Patient Details</h3>
                <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
                    Select a patient from the list to view their laboratory results, clinical history, and prescriptions.
                </p>
            </div>
        );
    }

    // ── Prescription Write form (full-screen overlay) ──
    if (showPrescriptionForm) {
        return (
            <PrescriptionForm
                patient={selectedPatient}
                doctor={doctor}
                doctorId={doctorId}
                onSaveSuccess={() => {
                    setShowPrescriptionForm(false);
                    setSelectedSubTab('prescription');
                    // Refresh history
                    prescriptionApi.getByPatient(selectedPatient.id)
                        .then(res => { if (res?.data) setPrescriptionHistory(res.data); })
                        .catch(() => { });
                }}
                onCancel={() => setShowPrescriptionForm(false)}
            />
        );
    }

    // ── Single prescription viewer ──
    if (viewingPrescription) {
        return (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl max-w-[210mm] w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                    <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-slate-50 rounded-t-2xl">
                        <span className="text-sm font-bold text-slate-700">Prescription — {new Date(viewingPrescription.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => printElement('prescription-print-area', `${selectedPatient.unique_id || selectedPatient.id}_${selectedPatient.last_name || ''}`)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white text-xs font-bold rounded-lg hover:bg-teal-700 transition-all font-print-hide"
                            >
                                Print
                            </button>
                            <button
                                onClick={() => setViewingPrescription(null)}
                                className="px-3 py-1.5 border border-slate-200 text-xs font-bold text-slate-600 rounded-lg hover:bg-slate-100 transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                    <PrescriptionTemplate
                        prescription={viewingPrescription}
                        doctor={doctor}
                        patient={selectedPatient}
                    />
                </div>
            </div>
        );
    }

    const SUB_TABS = [
        { id: 'new-reports', label: 'Results', icon: <Activity className="w-4 h-4" /> },
        { id: 'processing', label: 'In Progress', icon: <Clock className="w-4 h-4" /> },
        { id: 'history', label: 'History', icon: <Calendar className="w-4 h-4" /> },
        { id: 'prescription', label: 'Prescriptions', icon: <FileText className="w-4 h-4" /> },
    ];

    return (
        <div className="flex-1 p-4 space-y-5">
            {/* Patient Overview Header */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm overflow-hidden relative">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <User className="w-7 h-7" />
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h3 className="text-lg font-bold text-foreground">
                                    {selectedPatient.first_name || selectedPatient.name} {selectedPatient.last_name || ''}
                                </h3>
                                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 font-bold uppercase tracking-wider">
                                    {selectedPatient.status || 'Stable'}
                                </span>
                                <span className="flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold uppercase tracking-wider">
                                    Active
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                <span>ID: {selectedPatient.unique_id || selectedPatient.id}</span>
                                <span>•</span>
                                <span>Age: {selectedPatient.age || 'N/A'} YRS</span>
                                <span>•</span>
                                <span>Gender: {selectedPatient.patient_gender || selectedPatient.gender || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* PRIMARY CTA: Write Prescription */}
                        <button
                            onClick={() => setShowPrescriptionForm(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm shadow-md shadow-teal-600/20 transition-all active:scale-95"
                        >
                            <Stethoscope className="w-4 h-4" />
                            Write Prescription
                        </button>
                        <button
                            onClick={() => setShowNewOrderModal(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-sm transition-all active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            New Order
                        </button>
                        <button className="p-2.5 bg-muted text-muted-foreground rounded-xl hover:bg-muted/80 transition-all active:scale-90 border border-border">
                            <ExternalLink className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Sub-tab Navigation + Content */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                {/* Tab Bar */}
                <div className="border-b border-border bg-muted/20">
                    <nav className="flex space-x-1 p-1 overflow-x-auto scrollbar-hide">
                        {SUB_TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setSelectedSubTab(tab.id)}
                                className={`flex items-center space-x-2 px-5 py-2.5 transition-all text-xs font-bold uppercase tracking-wider rounded-xl whitespace-nowrap ${selectedSubTab === tab.id
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-muted-foreground hover:bg-muted/50'
                                    } ${tab.id === 'prescription' && selectedSubTab !== 'prescription' ? 'hover:!bg-teal-50 hover:!text-teal-600' : ''}`}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="p-5">
                    {/* ── Results Tab ── */}
                    {selectedSubTab === 'new-reports' && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Recent Lab Results</h4>
                            </div>
                            {[
                                { id: 'R001', testName: 'Comprehensive Metabolic Panel', date: '2024-12-10', status: 'Urgent', abnormal: true },
                                { id: 'R002', testName: 'Lipid Profile Complete', date: '2024-12-09', status: 'Processing', abnormal: false },
                                { id: 'R003', testName: 'Complete Blood Count', date: '2024-12-08', status: 'Done', abnormal: true }
                            ].map((report) => (
                                <div
                                    key={report.id}
                                    onClick={() => {
                                        setSelectedReport({
                                            order: { order_number: report.id, patient_first_name: selectedPatient.first_name, patient_last_name: selectedPatient.last_name, patient_unique_id: selectedPatient.unique_id, patient_gender: 'M', patient_dob: '1990-01-01', order_date: report.date, priority: report.status.toLowerCase() === 'urgent' ? 'urgent' : 'normal', status: report.status.toLowerCase(), doctor_first_name: 'Sarah', doctor_last_name: 'Johnson' },
                                            items: [{ test_name: report.testName, category_name: 'General', result_text: '185', unit: 'mg/dL', reference_range: '70-99', result_status: report.abnormal ? 'abnormal' : 'normal', abnormal_flag: report.abnormal }],
                                            file_name: report.id === 'R001' ? '1764353980932-Lecture-Slide-16-ODE-Solving-Method.pdf' : report.id === 'R002' ? '1764354095279-factory.png' : '1770451443166-example-cfg.pdf',
                                            file_type: (report.id === 'R001' || report.id === 'R003') ? 'pdf' : 'image'
                                        });
                                        setShowReportModal(true);
                                    }}
                                    className="flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 border border-border/50 rounded-xl transition-all cursor-pointer shadow-sm"
                                >
                                    <div className="flex items-center space-x-4 min-w-0">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${report.status === 'Urgent' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                                            <FlaskConical className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <h5 className="font-bold text-sm text-foreground truncate">{report.testName}</h5>
                                            <div className="flex items-center space-x-2 text-[10px] font-medium text-muted-foreground">
                                                <span>{report.date}</span>
                                                <span>•</span>
                                                <span>ID: #{report.id}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {report.abnormal && (
                                            <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[9px] font-bold uppercase tracking-wider rounded border border-rose-100">ABNORMAL</span>
                                        )}
                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider ${report.status === 'Urgent' ? 'bg-rose-600 text-white' : report.status === 'Processing' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'}`}>
                                            {report.status}
                                        </span>
                                        <Eye className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── In Progress Tab ── */}
                    {selectedSubTab === 'processing' && (
                        <div className="py-12 text-center text-muted-foreground opacity-60">
                            <Clock className="w-8 h-8 mx-auto mb-3 opacity-20" />
                            <p className="text-sm font-semibold">Active processing</p>
                            <p className="text-xs">2 tests in progress</p>
                        </div>
                    )}

                    {/* ── History Tab ── */}
                    {selectedSubTab === 'history' && (
                        <div className="py-12 text-center text-muted-foreground opacity-60">
                            <Calendar className="w-8 h-8 mx-auto mb-3 opacity-20" />
                            <p className="text-sm font-semibold">No historical data</p>
                            <p className="text-xs">Past records will appear here</p>
                        </div>
                    )}

                    {/* ── Prescription History Tab ── */}
                    {selectedSubTab === 'prescription' && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Prescription History</h4>
                                <button
                                    onClick={() => setShowPrescriptionForm(true)}
                                    className="flex items-center gap-1.5 text-[10px] font-black text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 dark:bg-teal-900/20 dark:text-teal-400 px-3 py-1.5 rounded-lg transition-all"
                                >
                                    <Plus className="w-3 h-3" /> Write New
                                </button>
                            </div>

                            {loadingPrescriptions ? (
                                <div className="py-10 text-center">
                                    <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                    <p className="text-xs text-muted-foreground">Loading prescriptions...</p>
                                </div>
                            ) : prescriptionHistory.length === 0 ? (
                                <div className="py-14 text-center">
                                    <div className="w-16 h-16 bg-teal-50 dark:bg-teal-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <FileText className="w-8 h-8 text-teal-300" />
                                    </div>
                                    <p className="text-sm font-semibold text-foreground mb-1">No prescriptions yet</p>
                                    <p className="text-xs text-muted-foreground mb-5">Create the first prescription for this patient</p>
                                    <button
                                        onClick={() => setShowPrescriptionForm(true)}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm shadow-md shadow-teal-600/20 transition-all mx-auto"
                                    >
                                        <Stethoscope className="w-4 h-4" />
                                        Write Prescription
                                    </button>
                                </div>
                            ) : (
                                prescriptionHistory.map((rx, idx) => (
                                    <div
                                        key={rx.id || idx}
                                        className="flex items-center justify-between p-4 bg-muted/20 hover:bg-teal-50/50 dark:hover:bg-teal-900/10 border border-border/50 hover:border-teal-200 dark:hover:border-teal-800 rounded-xl transition-all cursor-pointer group"
                                        onClick={() => setViewingPrescription(rx)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-teal-600">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-foreground">{rx.diagnosis || 'Prescription'}</p>
                                                <p className="text-[10px] text-muted-foreground font-medium">
                                                    {new Date(rx.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    {rx.prescription_items?.length ? ` • ${rx.prescription_items.length} medicine${rx.prescription_items.length > 1 ? 's' : ''}` : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <Eye className="w-4 h-4 text-muted-foreground group-hover:text-teal-600 transition-colors" />
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

export default PatientDetails;

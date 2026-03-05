import React, { memo } from 'react';
import { User, FlaskConical, Clock, Calendar, Plus, Eye, Search, ExternalLink, Activity, Info } from "lucide-react";

const PatientDetails = memo(({
    selectedPatient,
    setShowNewOrderModal,
    selectedSubTab,
    setSelectedSubTab,
    handleViewReport,
    setSelectedReport,
    setShowReportModal
}) => {
    if (!selectedPatient) {
        return (
            <div className="bg-card border-2 border-dashed border-border rounded-2xl p-12 md:p-20 text-center flex-1 flex flex-col items-center justify-center m-4">
                <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mb-6 text-muted-foreground/40">
                    <User className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Patient Details</h3>
                <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
                    Select a patient from the list to view their laboratory results and clinical history.
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 p-4 space-y-6">
            {/* Patient Overview Header */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm overflow-hidden relative">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <User className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h3 className="text-xl font-bold text-foreground">
                                    {selectedPatient.first_name || selectedPatient.name} {selectedPatient.last_name || ''}
                                </h3>
                                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 font-bold uppercase tracking-wider">
                                    {selectedPatient.status || 'Stable'}
                                </span>
                                <span className="flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold uppercase tracking-wider">
                                    Active
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                <span>ID: {selectedPatient.unique_id || selectedPatient.id}</span>
                                <span>•</span>
                                <span>Age: {selectedPatient.age || 'N/A'} YRS</span>
                                <span>•</span>
                                <span>Gender: {selectedPatient.patient_gender || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowNewOrderModal(true)}
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold text-sm shadow-sm active:scale-95 flex items-center space-x-2"
                        >
                            <Plus className="w-4 h-4" />
                            <span>New Order</span>
                        </button>
                        <button className="p-2.5 bg-muted text-muted-foreground rounded-xl hover:bg-muted/80 transition-all active:scale-90 border border-border">
                            <ExternalLink className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Resource Pipeline Selector */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="border-b border-border bg-muted/20">
                    <nav className="flex space-x-1 p-1 overflow-x-auto scrollbar-hide">
                        {[
                            { id: 'new-reports', label: 'Results', icon: <Activity className="w-4 h-4" /> },
                            { id: 'processing', label: 'In Progress', icon: <Clock className="w-4 h-4" /> },
                            { id: 'history', label: 'History', icon: <Calendar className="w-4 h-4" /> }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setSelectedSubTab(tab.id)}
                                className={`flex items-center space-x-2 px-6 py-3 transition-all text-xs font-bold uppercase tracking-wider rounded-xl ${selectedSubTab === tab.id
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-muted-foreground hover:bg-muted/50'
                                    }`}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
                                {selectedSubTab.replace('-', ' ')}
                            </h4>
                        </div>

                        <div className="space-y-3">
                            {selectedSubTab === 'new-reports' && [
                                { id: 'R001', testName: 'Comprehensive Metabolic Panel', date: '2024-12-10', status: 'Urgent', abnormal: true },
                                { id: 'R002', testName: 'Lipid Profile Complete', date: '2024-12-09', status: 'Processing', abnormal: false },
                                { id: 'R003', testName: 'Complete Blood Count', date: '2024-12-08', status: 'Done', abnormal: true }
                            ].map((report) => (
                                <div
                                    key={report.id}
                                    onClick={() => { setSelectedReport({ order: { order_number: report.id, patient_first_name: selectedPatient.first_name, patient_last_name: selectedPatient.last_name, patient_unique_id: selectedPatient.unique_id, patient_gender: 'M', patient_dob: '1990-01-01', order_date: report.date, priority: report.status.toLowerCase() === 'urgent' ? 'urgent' : 'normal', status: report.status.toLowerCase(), doctor_first_name: 'Sarah', doctor_last_name: 'Johnson' }, items: [{ test_name: report.testName, category_name: 'General', result_text: '185', unit: 'mg/dL', reference_range: '70-99', result_status: report.abnormal ? 'abnormal' : 'normal', abnormal_flag: report.abnormal }], file_name: report.id === 'R001' ? '1764353980932-Lecture-Slide-16-ODE-Solving-Method.pdf' : report.id === 'R002' ? '1764354095279-factory.png' : '1770451443166-example-cfg.pdf', file_type: (report.id === 'R001' || report.id === 'R003') ? 'pdf' : 'image' }); setShowReportModal(true); }}
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
                                            <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[9px] font-bold uppercase tracking-wider rounded border border-rose-100">
                                                ABNORMAL
                                            </span>
                                        )}
                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider ${report.status === 'Urgent' ? 'bg-rose-600 text-white' :
                                            report.status === 'Processing' ? 'bg-amber-500 text-white' :
                                                'bg-emerald-600 text-white'
                                            }`}>
                                            {report.status}
                                        </span>
                                        <Eye className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                </div>
                            ))}

                            {selectedSubTab === 'processing' && (
                                <div className="py-12 text-center text-muted-foreground opacity-60">
                                    <Clock className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                    <p className="text-sm font-semibold">Active processing</p>
                                    <p className="text-xs">2 tests in progress</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default PatientDetails;

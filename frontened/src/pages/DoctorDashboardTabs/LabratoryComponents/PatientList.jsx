import React, { memo } from 'react';
import { Search, User, ChevronRight, Users } from "lucide-react";

const PatientList = memo(({
    patients,
    selectedPatient,
    setSelectedPatient,
    setMobileShowDetails,
    patientSearchTerm,
    setPatientSearchTerm,
    fetchPatients,
    sidebarWidth,
    startResizing
}) => {
    return (
        <div
            className="flex flex-col h-full bg-card relative group/sidebar overflow-hidden"
            /* On desktop, use the resizable sidebarWidth. On mobile/tablet, fill container width. */
            style={{ width: typeof window !== 'undefined' && window.innerWidth >= 1024 ? sidebarWidth : undefined }}
        >
            {/* Header */}
            <div className="p-4 border-b border-border bg-muted/20 flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-sm font-bold text-foreground">Patients</h3>
                    </div>
                    {patients.length > 0 && (
                        <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-full border border-blue-100 dark:border-blue-800">
                            {patients.length}
                        </span>
                    )}
                </div>

                {/* Search */}
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-blue-500" />
                    <input
                        type="text"
                        placeholder="Search patients..."
                        className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm placeholder:text-muted-foreground/60"
                        value={patientSearchTerm}
                        onChange={(e) => {
                            setPatientSearchTerm(e.target.value);
                            fetchPatients(e.target.value);
                        }}
                    />
                </div>
            </div>

            {/* Patient List */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
                {patients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3 opacity-40">
                            <User className="w-7 h-7 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-semibold text-foreground/60">No patients found</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {patientSearchTerm ? 'Try a different search' : 'Patients will appear here'}
                        </p>
                    </div>
                ) : (
                    <div className="py-1.5 px-2 space-y-1">
                        {patients.map((patient) => {
                            const isActive = selectedPatient?.id === patient.id;
                            const initials = `${patient.first_name?.[0] || ''}${patient.last_name?.[0] || ''}`.toUpperCase() || 'U';
                            return (
                                <button
                                    key={patient.id}
                                    onClick={() => {
                                        setSelectedPatient(patient);
                                        setMobileShowDetails(true);
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group/item ${
                                        isActive
                                            ? 'bg-blue-600 shadow-sm shadow-blue-600/20'
                                            : 'hover:bg-muted/60'
                                    }`}
                                >
                                    {/* Avatar */}
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-xs transition-colors ${
                                        isActive
                                            ? 'bg-white/20 text-white'
                                            : 'bg-muted text-muted-foreground group-hover/item:bg-blue-100 group-hover/item:text-blue-600'
                                    }`}>
                                        {initials}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-semibold truncate leading-tight ${isActive ? 'text-white' : 'text-foreground'}`}>
                                            {patient.first_name} {patient.last_name}
                                        </p>
                                        <p className={`text-[10px] font-medium mt-0.5 ${isActive ? 'text-blue-100' : 'text-muted-foreground'}`}>
                                            ID: {patient.unique_id}
                                        </p>
                                    </div>

                                    <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-all ${
                                        isActive
                                            ? 'text-white translate-x-0.5'
                                            : 'text-muted-foreground/30 group-hover/item:text-muted-foreground group-hover/item:translate-x-0.5'
                                    }`} />
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Desktop-only Resize Handle */}
            <div
                onMouseDown={startResizing}
                className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-500/40 active:bg-blue-500/60 transition-colors z-10 hidden lg:block"
            />
        </div>
    );
});

export default PatientList;

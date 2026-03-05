import React, { memo } from 'react';
import { Search, User, ChevronRight } from "lucide-react";

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
            className="flex flex-col h-full bg-card border-r border-border relative group/sidebar overflow-hidden shadow-sm"
            style={{ width: sidebarWidth }}
        >
            <div className="p-4 border-b border-border bg-muted/20">
                <h3 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider">Patients</h3>
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-blue-500" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                        value={patientSearchTerm}
                        onChange={(e) => {
                            setPatientSearchTerm(e.target.value);
                            fetchPatients(e.target.value);
                        }}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin">
                {patients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center opacity-50">
                        <User className="w-8 h-8 mb-2" />
                        <p className="text-sm font-semibold">No patients found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border/50">
                        {patients.map((patient) => (
                            <button
                                key={patient.id}
                                onClick={() => {
                                    setSelectedPatient(patient);
                                    setMobileShowDetails(true);
                                }}
                                className={`w-full flex items-center justify-between p-4 transition-all text-left ${selectedPatient?.id === patient.id
                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-600'
                                        : 'hover:bg-muted/50 border-l-4 border-l-transparent'
                                    }`}
                            >
                                <div className="flex items-center space-x-3 min-w-0">
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-xs ${selectedPatient?.id === patient.id
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-muted text-muted-foreground'
                                        }`}>
                                        {(patient.first_name?.[0] || 'U').toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`text-sm font-semibold truncate ${selectedPatient?.id === patient.id ? 'text-blue-600' : 'text-foreground'
                                            }`}>
                                            {patient.first_name} {patient.last_name}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground uppercase font-medium">ID: {patient.unique_id}</p>
                                    </div>
                                </div>
                                <ChevronRight className={`w-4 h-4 transition-transform ${selectedPatient?.id === patient.id ? 'text-blue-600 translate-x-1' : 'text-muted-foreground/30'
                                    }`} />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Resize Handle */}
            <div
                onMouseDown={startResizing}
                className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-500/30 transition-colors z-10"
            />
        </div>
    );
});

export default PatientList;

import React from 'react';
import PatientList from './PatientList';
import PatientDetails from './PatientDetails';

const PatientConsole = ({
    patients,
    selectedPatient,
    setSelectedPatient,
    mobileShowDetails,
    setMobileShowDetails,
    patientSearchTerm,
    setPatientSearchTerm,
    fetchPatients,
    sidebarWidth,
    startResizing,
    setShowNewOrderModal,
    selectedSubTab,
    setSelectedSubTab,
    handleViewReport,
    setSelectedReport,
    setShowReportModal,
    doctor,
    doctorId,
}) => {
    return (
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            {/* 
                Layout strategy:
                - Mobile (< lg): Show EITHER the list OR the details, not both.
                  mobileShowDetails controls which is visible.
                - Desktop (lg+): Side-by-side split with resizable sidebar.
            */}
            <div className="flex h-[calc(100svh-220px)] min-h-[500px] max-h-[820px]">

                {/* LEFT: Patient List
                    - Mobile: full width, hidden when mobileShowDetails is true
                    - Desktop: fixed sidebar width, always visible */}
                <div
                    className={`
                        flex-shrink-0 h-full border-r border-border
                        ${mobileShowDetails ? 'hidden' : 'flex flex-col w-full'}
                        lg:flex lg:flex-col
                    `}
                    style={{ width: window.innerWidth >= 1024 ? sidebarWidth : undefined }}
                >
                    <PatientList
                        patients={patients}
                        selectedPatient={selectedPatient}
                        setSelectedPatient={setSelectedPatient}
                        setMobileShowDetails={setMobileShowDetails}
                        patientSearchTerm={patientSearchTerm}
                        setPatientSearchTerm={setPatientSearchTerm}
                        fetchPatients={fetchPatients}
                        sidebarWidth={sidebarWidth}
                        startResizing={startResizing}
                    />
                </div>

                {/* RIGHT: Patient Details
                    - Mobile: full width, hidden when mobileShowDetails is false
                    - Desktop: flex-1, always visible */}
                <div
                    className={`
                        flex-1 overflow-y-auto bg-background/30 flex flex-col min-w-0
                        ${mobileShowDetails ? 'flex' : 'hidden'}
                        lg:flex
                    `}
                >
                    <PatientDetails
                        selectedPatient={selectedPatient}
                        doctor={doctor}
                        doctorId={doctorId}
                        setShowNewOrderModal={setShowNewOrderModal}
                        selectedSubTab={selectedSubTab}
                        setSelectedSubTab={setSelectedSubTab}
                        handleViewReport={handleViewReport}
                        setSelectedReport={setSelectedReport}
                        setShowReportModal={setShowReportModal}
                        onBack={() => {
                            setMobileShowDetails(false);
                            setSelectedPatient(null);
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default PatientConsole;

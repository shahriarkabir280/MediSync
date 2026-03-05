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
    setShowReportModal
}) => {
    return (
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="flex flex-col lg:flex-row h-[750px]">
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

                {/* Right Column: Details */}
                <div className="flex-1 overflow-y-auto scrollbar-thin bg-background/30 flex flex-col min-w-0">
                    <PatientDetails
                        selectedPatient={selectedPatient}
                        setShowNewOrderModal={setShowNewOrderModal}
                        selectedSubTab={selectedSubTab}
                        setSelectedSubTab={setSelectedSubTab}
                        handleViewReport={handleViewReport}
                        setSelectedReport={setSelectedReport}
                        setShowReportModal={setShowReportModal}
                    />
                </div>
            </div>
        </div>
    );
};

export default PatientConsole;

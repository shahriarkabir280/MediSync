import React, { useState, useEffect } from "react";
import { patientApi } from "../../lib/api";

const PatientTab = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // TODO: Get this from auth context
    const doctorId = 1;

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async (search = '') => {
        try {
            setLoading(true);
            const params = search ? { search } : {};
            const data = await patientApi.getAll(doctorId, params);
            setPatients(data.data || []);
            setError(null);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching patients:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchPatients(searchTerm);
    };

    const calculateAge = (dateOfBirth) => {
        if (!dateOfBirth) return 'N/A';
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading patients...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Patients</h1>
                <p className="text-muted-foreground">Manage patient records and information.</p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-2">
                <input
                    type="text"
                    placeholder="Search patients by name or email..."
                    className="flex-1 p-2 border border-input rounded-md bg-background"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                    Search
                </button>
                {searchTerm && (
                    <button
                        type="button"
                        onClick={() => {
                            setSearchTerm('');
                            fetchPatients();
                        }}
                        className="px-4 py-2 border border-border rounded-md hover:bg-accent"
                    >
                        Clear
                    </button>
                )}
            </form>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600">{error}</p>
                    <button 
                        onClick={() => fetchPatients()}
                        className="mt-2 text-sm text-red-700 underline"
                    >
                        Retry
                    </button>
                </div>
            )}

            <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Patient List ({patients.length})</h3>
                    <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                        Add New Patient
                    </button>
                </div>
                <div className="space-y-3">
                    {patients.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            {searchTerm ? 'No patients found matching your search' : 'No patients found'}
                        </p>
                    ) : (
                        patients.map((patient) => (
                            <div key={patient.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                        <span className="text-primary font-semibold">
                                            {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-medium">
                                            {patient.first_name} {patient.last_name}
                                            <span className="ml-2 text-xs text-muted-foreground">
                                                ({patient.unique_id})
                                            </span>
                                        </p>
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                            <span>Age: {calculateAge(patient.date_of_birth)}</span>
                                            {patient.blood_group && <span>Blood: {patient.blood_group}</span>}
                                            {patient.gender && <span>{patient.gender}</span>}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {patient.email} • {patient.phone || 'No phone'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs text-muted-foreground">
                                        {patient.total_appointments} visits
                                    </span>
                                    <button className="px-3 py-1 text-sm border border-border rounded hover:bg-accent">
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default PatientTab;
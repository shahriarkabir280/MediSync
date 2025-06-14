import React from "react";
const PatientTab = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Patients</h1>
                <p className="text-muted-foreground">Manage patient records and information.</p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Patient List</h3>
                <div className="space-y-3">
                    {[{ name: 'John Smith', age: 30, condition: 'Healthy' },
                      { name: 'Mary Johnson', age: 45, condition: 'Diabetes' },
                      { name: 'David Brown', age: 50, condition: 'Hypertension' }].map((patient, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                            <div className="flex items-center space-x-4">
                                <div className="text-sm font-medium text-primary">{patient.name}</div>
                                <div>
                                    <p className="font-medium">Age: {patient.age}</p>
                                    <p className="text-sm text-muted-foreground">Condition: {patient.condition}</p>
                                </div>
                            </div>
                            <button className="px-3 py-1 text-sm border border-border rounded hover:bg-accent">
                                View Details
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PatientTab;
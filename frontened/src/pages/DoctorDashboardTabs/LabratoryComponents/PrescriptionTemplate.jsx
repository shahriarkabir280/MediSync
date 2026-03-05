import React from 'react';
import {
    Phone,
    Mail,
    MapPin,
    Calendar,
    User,
    Stethoscope,
    ChevronRight,
    Clock
} from "lucide-react";

/**
 * Professional Bangladesh-style Prescription Template
 * Optimized for both viewing and printing.
 */
const PrescriptionTemplate = ({ prescription, doctor, patient }) => {
    if (!prescription) return null;

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const calculateAge = (dob) => {
        if (!dob) return 'N/A';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        return age;
    };

    return (
        <div className="bg-white text-slate-800 p-8 lg:p-12 shadow-2xl max-w-[210mm] mx-auto min-h-[297mm] flex flex-col print:shadow-none print:p-0 print:m-0 animate-in fade-in duration-700">

            {/* Header / Doctor Info */}
            <header className="border-b-4 border-slate-900 pb-6 flex justify-between items-start">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">
                        {doctor?.first_name} {doctor?.last_name}
                    </h1>
                    <p className="text-lg font-bold text-blue-700">{doctor?.specialization}</p>
                    <div className="flex flex-col text-sm text-slate-500 font-medium">
                        <span>{doctor?.license_number && `Registration No: ${doctor.license_number}`}</span>
                        <span>{doctor?.years_of_experience && `${doctor.years_of_experience}+ Years of Experience`}</span>
                    </div>
                </div>

                <div className="text-right space-y-1">
                    <div className="flex items-center justify-end gap-2 text-sm text-slate-600">
                        <span>{doctor?.email || 'doctor@careconnect.com'}</span>
                        <Mail className="w-4 h-4" />
                    </div>
                    <div className="flex items-center justify-end gap-2 text-sm text-slate-600">
                        <span>{doctor?.phone || '+880 1XXX XXXXXX'}</span>
                        <Phone className="w-4 h-4" />
                    </div>
                </div>
            </header>

            {/* Patient Stats Bar */}
            <div className="grid grid-cols-4 bg-slate-50 border-b border-slate-200 py-3 px-4 mt-4 text-sm font-bold uppercase tracking-wider">
                <div className="flex gap-2 items-center">
                    <span className="text-slate-400">Name:</span>
                    <span className="text-slate-900 truncate">{patient?.first_name} {patient?.last_name}</span>
                </div>
                <div className="flex gap-2 items-center">
                    <span className="text-slate-400">Age:</span>
                    <span className="text-slate-900">{calculateAge(patient?.date_of_birth)}Y</span>
                </div>
                <div className="flex gap-2 items-center">
                    <span className="text-slate-400">Sex:</span>
                    <span className="text-slate-900">{patient?.gender || 'N/A'}</span>
                </div>
                <div className="flex gap-2 items-center justify-end">
                    <span className="text-slate-400">Date:</span>
                    <span className="text-slate-900">{formatDate(prescription.created_at)}</span>
                </div>
            </div>

            {/* Main Body */}
            <main className="flex-1 flex mt-8 gap-8">

                {/* Left Sidebar: Clinical Findings */}
                <aside className="w-[30%] border-r border-slate-200 pr-6 space-y-8">

                    {prescription.chief_complaints && (
                        <section>
                            <h3 className="text-sm font-black uppercase text-slate-900 mb-2 flex items-center gap-2">
                                <span className="w-1.5 h-4 bg-slate-900"></span>
                                C/C
                            </h3>
                            <p className="text-[13px] leading-relaxed text-slate-700 whitespace-pre-wrap pl-3">
                                {prescription.chief_complaints}
                            </p>
                        </section>
                    )}

                    {prescription.clinical_history && (
                        <section>
                            <h3 className="text-sm font-black uppercase text-slate-900 mb-2 flex items-center gap-2">
                                <span className="w-1.5 h-4 bg-slate-900"></span>
                                History
                            </h3>
                            <p className="text-[13px] leading-relaxed text-slate-700 whitespace-pre-wrap pl-3">
                                {prescription.clinical_history}
                            </p>
                        </section>
                    )}

                    {prescription.physical_examination && (
                        <section>
                            <h3 className="text-sm font-black uppercase text-slate-900 mb-2 flex items-center gap-2">
                                <span className="w-1.5 h-4 bg-slate-900"></span>
                                O/E
                            </h3>
                            <p className="text-[13px] leading-relaxed text-slate-700 whitespace-pre-wrap pl-3">
                                {prescription.physical_examination}
                            </p>
                        </section>
                    )}
                </aside>

                {/* Right Section: Rx & Advice */}
                <section className="flex-1">
                    <div className="flex items-start gap-4 mb-2">
                        <span className="text-5xl font-black text-slate-200 italic -mt-2">Rx</span>
                        <div className="flex-1">
                            {prescription.diagnosis && (
                                <h2 className="text-sm font-bold border-b border-slate-100 pb-2 mb-6">
                                    Diagnosis: <span className="text-blue-700">{prescription.diagnosis}</span>
                                </h2>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6 pt-4">
                        {prescription.prescription_items?.map((item, idx) => (
                            <div key={idx} className="relative pl-6">
                                <div className="absolute left-0 top-1 text-slate-300 font-bold text-xs">{idx + 1}.</div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-[14px] font-black text-slate-900">
                                        {item.medicine_type} {item.medicine_name}
                                    </span>
                                    <span className="text-slate-400">—</span>
                                    <span className="text-sm font-bold text-slate-800">{item.dosage}</span>
                                </div>
                                <div className="mt-1 flex gap-4 text-[12px] font-medium text-slate-600 italic">
                                    <span>Duration: {item.duration}</span>
                                    {item.instructions && (
                                        <>
                                            <span className="text-slate-300">|</span>
                                            <span>{item.instructions}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-16 pt-8 border-t border-slate-100">
                        <h3 className="text-sm font-black uppercase text-slate-900 mb-3 ml-2 italic">Advice:</h3>
                        <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 leading-relaxed whitespace-pre-wrap min-h-[100px]">
                            {prescription.advice || 'No specific advice given.'}
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="mt-12 pt-12 border-t border-slate-300 flex justify-between items-end">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-rose-600">
                        <Calendar className="w-5 h-5" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Next Follow Up</span>
                            <span className="text-sm font-bold">{formatDate(prescription.follow_up)}</span>
                        </div>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">This is a computer generated prescription and does not require a physical signature unless otherwise stated.</p>
                </div>

                <div className="text-center">
                    <div className="w-48 h-px bg-slate-300 mb-2"></div>
                    <p className="text-sm font-black uppercase tracking-tight text-slate-900">{doctor?.first_name} {doctor?.last_name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Digital Signature Area</p>
                </div>
            </footer>

            {/* Print-specific Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
        @media print {
          body * { visibility: hidden; }
          .prescription-print-container, .prescription-print-container * {
            visibility: visible;
          }
          .prescription-print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}} />
        </div>
    );
};

export default PrescriptionTemplate;

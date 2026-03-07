import React from 'react';
import { Phone, Mail, MapPin, Calendar, Clock } from "lucide-react";

/**
 * Bangladesh-style Doctor Prescription Template
 * Follows the standard BD medical prescription pad format.
 * Left column: C/C, Hx, O/E, Investigations
 * Right column: Rx symbol, Diagnosis, Numbered medicines, Advice
 * Footer: Follow-up date, Doctor signature
 */
const PrescriptionTemplate = ({ prescription, doctor, patient, customLetterhead = null, isPreview = false, printId }) => {
    if (!prescription) return null;

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
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


    // Support both AuthContext user shape (name, email, specialization, license_number)
    // and doctorApi shape (first_name, last_name)
    const docName = doctor
        ? (doctor.name || `${doctor.title || 'Dr.'} ${doctor.first_name || ''} ${doctor.last_name || ''}`.trim())
        : 'Dr. [Doctor Name]';
    // Ensure name starts with "Dr." if not already
    const docDisplayName = docName.startsWith('Dr') ? docName : `Dr. ${docName}`;

    // Prefer custom letterhead settings if available
    const docHospital = customLetterhead?.hospital_name || doctor?.hospital_name || doctor?.clinic_name || '';
    const docDegrees = customLetterhead?.degrees || doctor?.qualifications || doctor?.degrees || 'MBBS, FCPS';
    const docSpec = customLetterhead?.specialization || doctor?.specialization || 'General Physician';
    const docReg = customLetterhead?.bmdc_reg || doctor?.license_number || doctor?.bmdc_reg || 'A-XXXXX';
    const docPhone = customLetterhead?.phone || doctor?.phone || doctor?.contact_number || '+880 1XXX-XXXXXX';
    const docEmail = customLetterhead?.email || doctor?.email || 'doctor@careconnect.health';
    const docAddress = customLetterhead?.address || doctor?.chamber_address || doctor?.address || 'Chamber Address, Dhaka';
    const docExtraInfo = customLetterhead?.extra_info || '';

    // Helper to format multiline text into bullet points
    const formatListText = (text) => {
        if (!text) return null;
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        
        if (lines.length <= 1) {
            return <p className="text-[11px] leading-relaxed text-slate-700 whitespace-pre-wrap pl-2">{text}</p>;
        }

        return (
            <ul className="text-[11px] leading-relaxed text-slate-700 pl-4 list-disc space-y-0.5 marker:text-slate-400">
                {lines.map((line, i) => (
                    <li key={i}>{line.trim()}</li>
                ))}
            </ul>
        );
    };

    const hasItems = prescription.prescription_items?.filter(i => i.medicine_name?.trim()).length > 0;

    return (
        <div
            id={printId || (!isPreview ? 'prescription-print-area' : undefined)}
            className={`bg-white text-slate-900 font-sans ${isPreview ? 'w-[210mm] min-h-[297mm]' : 'max-w-[210mm] min-h-[297mm] mx-auto shadow-2xl'} flex flex-col print:shadow-none`}
            style={{ fontFamily: "'Times New Roman', serif" }}
        >
            {/* ═══ LETTERHEAD ═══ */}
            <header className="px-8 pt-6 pb-4">
                <div className="flex justify-between items-start">
                    {/* Doctor Info - Left */}
                    <div className="flex-1">
                        <h1 className="text-[26px] font-black tracking-tight text-slate-900 leading-tight" style={{ fontFamily: 'Arial, sans-serif' }}>
                            {docDisplayName}
                        </h1>
                        {docHospital && (
                            <p className="text-[14px] font-black text-slate-800 uppercase tracking-tight mt-0.5">{docHospital}</p>
                        )}
                        <p className="text-[12px] font-bold text-slate-600 mt-0.5">{docDegrees}</p>
                        <p className="text-[13px] font-bold text-blue-800 mt-0.5">{docSpec}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">BMDC Reg. No: {docReg}</p>
                        {docExtraInfo && (
                            <p className="text-[10px] font-bold text-teal-600 mt-1 uppercase tracking-wider">{docExtraInfo}</p>
                        )}
                    </div>

                    {/* Clinic/Contact - Right */}
                    <div className="text-right space-y-0.5 ml-4">
                        <div className="text-[11px] text-slate-600 flex items-center justify-end gap-1">
                            <span>{docPhone}</span>
                            <Phone className="w-3 h-3 flex-shrink-0" />
                        </div>
                        <div className="text-[11px] text-slate-600 flex items-center justify-end gap-1">
                            <span>{docEmail}</span>
                            <Mail className="w-3 h-3 flex-shrink-0" />
                        </div>
                        <div className="text-[11px] text-slate-600 flex items-center justify-end gap-1 max-w-[180px]">
                            <span className="text-right leading-tight">{docAddress}</span>
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="mt-3 border-t-[3px] border-slate-900" />
                <div className="mt-0.5 border-t border-slate-400" />
            </header>

            {/* ═══ PATIENT INFO BAR ═══ */}
            <div className="px-8 py-2">
                <div className="flex items-center gap-1 flex-wrap text-[12px]">
                    <span className="font-bold text-slate-500">Name:</span>
                    <span className="font-black text-slate-900 min-w-[120px] border-b border-dotted border-slate-400 pb-0.5 mr-4">
                        {patient?.first_name} {patient?.last_name}
                    </span>
                    <span className="font-bold text-slate-500">Age:</span>
                    <span className="font-black text-slate-900 min-w-[36px] border-b border-dotted border-slate-400 pb-0.5 mr-4 text-center">
                        {calculateAge(patient?.date_of_birth)}Y
                    </span>
                    <span className="font-bold text-slate-500">Sex:</span>
                    <span className="font-black text-slate-900 min-w-[40px] border-b border-dotted border-slate-400 pb-0.5 mr-4 text-center">
                        {patient?.gender ? patient.gender.charAt(0).toUpperCase() : 'N/A'}
                    </span>
                    <span className="font-bold text-slate-500">Wt:</span>
                    <span className="font-black text-slate-900 min-w-[40px] border-b border-dotted border-slate-400 pb-0.5 mr-4 text-center">
                        {prescription.vitals_weight ? `${prescription.vitals_weight}kg` : '____'}
                    </span>
                    <span className="font-bold text-slate-500 ml-auto">Date:</span>
                    <span className="font-black text-slate-900 border-b border-dotted border-slate-400 pb-0.5 ml-1">
                        {formatDate(prescription.created_at)}
                    </span>
                </div>
            </div>

            {/* ═══ MAIN BODY ═══ */}
            <main className="flex-1 flex px-8 mt-2 gap-0">

                {/* ── LEFT COLUMN: Clinical Notes (30%) ── */}
                <aside className="w-[30%] pr-5 border-r-2 border-dotted border-slate-300 space-y-4 py-2">

                    {prescription.chief_complaints && (
                        <section>
                            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-800 mb-1 flex items-center gap-1">
                                <span className="w-1 h-3.5 bg-slate-800 inline-block rounded-sm" />
                                C/C
                            </h4>
                            {formatListText(prescription.chief_complaints)}
                        </section>
                    )}

                    {prescription.clinical_history && (
                        <section>
                            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-800 mb-1 flex items-center gap-1">
                                <span className="w-1 h-3.5 bg-slate-800 inline-block rounded-sm" />
                                Hx
                            </h4>
                            {formatListText(prescription.clinical_history)}
                        </section>
                    )}

                    {prescription.physical_examination && (
                        <section>
                            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-800 mb-1 flex items-center gap-1">
                                <span className="w-1 h-3.5 bg-slate-800 inline-block rounded-sm" />
                                O/E
                            </h4>
                            {formatListText(prescription.physical_examination)}
                        </section>
                    )}

                    {prescription.investigations && (
                        <section>
                            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-800 mb-1 flex items-center gap-1">
                                <span className="w-1 h-3.5 bg-slate-800 inline-block rounded-sm" />
                                Inv.
                            </h4>
                            {formatListText(prescription.investigations)}
                        </section>
                    )}
                </aside>

                {/* ── RIGHT COLUMN: Rx (70%) ── */}
                <section className="flex-1 pl-5 py-2">

                    {/* Rx Symbol + Diagnosis */}
                    <div className="flex items-start gap-3 mb-4">
                        <span
                            className="text-[52px] font-black italic leading-none text-slate-200 select-none flex-shrink-0"
                            style={{ fontFamily: 'Times New Roman, serif' }}
                        >
                            Rx
                        </span>
                        <div className="flex-1 pt-1">
                            {prescription.diagnosis ? (
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Diagnosis</span>
                                    <p className="text-[13px] font-black text-blue-800 border-b border-slate-200 pb-1 mt-0.5">
                                        {prescription.diagnosis}
                                    </p>
                                </div>
                            ) : (
                                <div className="border-b border-slate-200 pb-1 mt-4">
                                    <span className="text-[10px] text-slate-300">No diagnosis entered</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Medicine List */}
                    <div className="space-y-4 mt-2">
                        {hasItems ? (
                            prescription.prescription_items
                                .filter(i => i.medicine_name?.trim())
                                .map((item, idx) => (
                                    <div key={idx} className="relative pl-6">
                                        {/* Number */}
                                        <span className="absolute left-0 top-0.5 text-[11px] font-bold text-slate-400">
                                            {idx + 1}.
                                        </span>
                                        {/* Medicine name line */}
                                        <div className="flex items-baseline gap-2 flex-wrap">
                                            <span className="text-[14px] font-black text-slate-900">
                                                {item.medicine_type}
                                            </span>
                                            <span className="text-[15px] font-black text-slate-900 underline decoration-dotted underline-offset-2">
                                                {item.medicine_name}
                                            </span>
                                            {item.dosage && (
                                                <>
                                                    <span className="text-slate-300 text-[12px]">—</span>
                                                    <span className="text-[13px] font-black text-slate-800">
                                                        {item.dosage}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        {/* Duration + Instruction */}
                                        <div className="mt-0.5 flex items-center gap-3 text-[11px] text-slate-600 italic pl-1">
                                            {item.duration && (
                                                <span>× {item.duration}</span>
                                            )}
                                            {item.duration && item.instructions && (
                                                <span className="text-slate-300">|</span>
                                            )}
                                            {item.instructions && (
                                                <span>{item.instructions}</span>
                                            )}
                                        </div>
                                        {/* Separator line */}
                                        {idx < prescription.prescription_items.filter(i => i.medicine_name?.trim()).length - 1 && (
                                            <div className="mt-2.5 border-b border-dashed border-slate-100" />
                                        )}
                                    </div>
                                ))
                        ) : (
                            <p className="text-[11px] text-slate-300 italic pl-6">No medications prescribed.</p>
                        )}
                    </div>

                    {/* Filling lines below medicines (for unused pad space) */}
                    <div className="mt-6 space-y-4">
                        {[...Array(Math.max(0, 4 - (prescription.prescription_items?.filter(i => i.medicine_name?.trim()).length || 0)))].map((_, i) => (
                            <div key={i} className="border-b border-dashed border-slate-100 h-6" />
                        ))}
                    </div>

                    {/* Advice */}
                    {prescription.advice && (
                        <div className="mt-6 pt-4 border-t border-slate-100">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-700 mb-2">
                                Advice:
                            </h4>
                            <div className="bg-slate-50 border border-slate-100 rounded p-2 pt-2 pb-2">
                                {formatListText(prescription.advice)}
                            </div>
                        </div>
                    )}
                </section>
            </main>

            {/* ═══ FOOTER ═══ */}
            <footer className="px-8 pb-6 mt-6">
                <div className="border-t-2 border-slate-300 pt-4 flex justify-between items-end">
                    {/* Follow-up */}
                    <div>
                        <div className="flex items-center gap-2 text-rose-600">
                            <Calendar className="w-4 h-4" />
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Next Visit</p>
                                <p className="text-[13px] font-black text-rose-700">
                                    {prescription.next_visit_date ? formatDate(prescription.next_visit_date) : '___________'}
                                </p>
                            </div>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-3 max-w-[200px] leading-relaxed">
                            This is a computer-generated prescription. Valid without physical signature unless stated otherwise.
                        </p>
                    </div>

                    {/* Signature */}
                    <div className="text-center">
                        <div className="w-44 h-px bg-slate-400 mb-1" />
                        <p className="text-[11px] font-black uppercase tracking-tight text-slate-800">{docDisplayName}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Signature</p>
                    </div>
                </div>
            </footer>

            {/* Print CSS */}
            {!isPreview && (
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @media print {
                      body { margin: 0; }
                      @page { size: A4; margin: 0; }
                    }
                  `
                }} />
            )}
        </div>
    );
};

export default PrescriptionTemplate;

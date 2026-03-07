import React, { useState, useCallback, useEffect } from 'react';
import {
    Plus, Trash2, Save, Printer, Clock, Stethoscope,
    AlertCircle, History, Info, X, Eye, ChevronRight,
    Activity, Thermometer, Heart, Wind, Settings
} from "lucide-react";
import { prescriptionApi, api } from '../../../lib/api';
import { toast } from 'react-hot-toast';
import { printElement } from '../../../lib/printUtils';
import { generatePDFBlob } from '../../../lib/pdfUtils';
import PrescriptionTemplate from './PrescriptionTemplate';
import PrescriptionSettings from './PrescriptionSettings';

const MED_TYPES = ['Tab.', 'Cap.', 'Syr.', 'Inj.', 'Drop', 'Cream', 'Oint.', 'Spray', 'Supp.', 'Powder', 'Gel', 'Inhaler'];
const DOSAGE_SHORTCUTS = ['১+০+১', '০+০+১', '১+১+১', '১+০+০', '০+১+০', '১/২+০+১/২', 'প্রয়োজন হলে (SOS)'];
const INSTRUCTION_SHORTCUTS = ['খাবারের পর (PC)', 'খাবারের আগে (AC)', 'খালি পেটে', 'ভরা পেটে', 'ঘুমানোর আগে (HS)', 'চুষে খাবেন', 'পানির সাথে মিশিয়ে'];
const DURATION_SHORTCUTS = ['৩ দিন', '৫ দিন', '৭ দিন', '১০ দিন', '১৪ দিন', '১ মাস', 'চলবে (Continue)'];
const COMMON_ADVICE = [
    'প্রচুর পরিমাণে পানি পান করবেন (Drink plenty of water)',
    'সম্পূর্ণ বিশ্রামে থাকবেন (Take complete rest)',
    'ঠান্ডা ও বাইরের খাবার পরিহার করবেন (Avoid cold/outside food)',
    'নিয়মিত ওষুধ সেবন করবেন (Take medicine regularly)',
    'প্রতিদিন ব্লাড প্রেসার মাপবেন (Monitor BP daily)',
    'নিয়মিত ডায়াবেটিস চেক করবেন (Check blood sugar regularly)',
    'লবণ ও চর্বিযুক্ত খাবার কম খাবেন (Low salt/fat diet)',
    'ধূমপান থেকে বিরত থাকবেন (Avoid smoking)',
];

const FieldLabel = ({ icon, text, color = 'text-slate-500' }) => (
    <div className={`flex items-center gap-1.5 mb-1.5 ${color}`}>
        {icon}
        <span className="text-[10px] font-black uppercase tracking-widest">{text}</span>
    </div>
);

const Chip = ({ label, onClick, active }) => (
    <button
        type="button"
        onClick={onClick}
        className={`text-[10px] px-2 py-0.5 rounded-full border transition-all font-semibold ${active
            ? 'bg-teal-600 text-white border-teal-600'
            : 'bg-background border-border text-muted-foreground hover:border-teal-400 hover:text-teal-600'
            }`}
    >
        {label}
    </button>
);

const PrescriptionForm = ({ patient, doctor, doctorId, patientReports = [], onSaveSuccess, onCancel }) => {
    const [loading, setLoading] = useState(false);
    const [activePanel, setActivePanel] = useState('write'); // 'write' | 'preview'
    const [showSettings, setShowSettings] = useState(false);
    const [customLetterhead, setCustomLetterhead] = useState(null);

    // Load custom settings on mount
    useEffect(() => {
        const STORAGE_KEY = `prescription_settings_${doctorId || 'default'}`;
        const savedSettings = localStorage.getItem(STORAGE_KEY);
        if (savedSettings) {
            setCustomLetterhead(JSON.parse(savedSettings));
        }
    }, [doctorId]);

    const handleSettingsSave = (newSettings) => {
        setCustomLetterhead(newSettings);
        setShowSettings(false);
        toast.success('Letterhead settings updated');
    };

    const [formData, setFormData] = useState({
        chief_complaints: '',
        clinical_history: '',
        vitals_temp: '',
        vitals_bp: '',
        vitals_pulse: '',
        vitals_spo2: '',
        vitals_weight: '',
        physical_examination: '',
        investigations: '',
        diagnosis: '',
        advice: '',
        follow_up: '',
    });

    const [items, setItems] = useState([
        { medicine_name: '', medicine_type: 'Tab.', dosage: '', duration: '', instructions: '' }
    ]);

    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleItemChange = useCallback((index, field, value) => {
        setItems(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    }, []);

    const handleChipToggle = useCallback((index, field, value) => {
        setItems(prev => {
            const next = [...prev];
            const currentVal = next[index][field] || '';
            
            // If already includes, remove it (toggle off)
            if (currentVal.includes(value)) {
                let updated = currentVal.replace(value, '').trim();
                // Clean up comma if trailing or double
                updated = updated.replace(/,\s*,/g, ',').replace(/^,\s*/, '').replace(/,\s*$/, '');
                next[index] = { ...next[index], [field]: updated };
            } else {
                // Append (toggle on)
                next[index] = { ...next[index], [field]: currentVal ? `${currentVal}, ${value}` : value };
            }
            return next;
        });
    }, []);

    const addItem = () => setItems(prev => [
        ...prev,
        { medicine_name: '', medicine_type: 'Tab.', dosage: '', duration: '', instructions: '' }
    ]);

    const removeItem = (index) => {
        if (items.length === 1) {
            setItems([{ medicine_name: '', medicine_type: 'Tab.', dosage: '', duration: '', instructions: '' }]);
        } else {
            setItems(prev => prev.filter((_, i) => i !== index));
        }
    };

    const toggleAdvice = (line) => {
        setFormData(prev => {
            const existing = prev.advice || '';
            if (existing.includes(line)) {
                return { ...prev, advice: existing.replace(line, '').replace(/\n\n/g, '\n').trim() };
            }
            return { ...prev, advice: existing ? `${existing}\n${line}` : line };
        });
    };

    // Build prescription object for live preview
    const livePrescription = {
        ...formData,
        physical_examination: [
            formData.vitals_temp && `Temp: ${formData.vitals_temp}°F`,
            formData.vitals_bp && `BP: ${formData.vitals_bp} mmHg`,
            formData.vitals_pulse && `Pulse: ${formData.vitals_pulse} bpm`,
            formData.vitals_spo2 && `SpO₂: ${formData.vitals_spo2}%`,
            formData.vitals_weight && `Wt: ${formData.vitals_weight} kg`,
            formData.physical_examination,
        ].filter(Boolean).join('  |  '),
        prescription_items: items.filter(i => i.medicine_name.trim()),
        created_at: new Date().toISOString(),
        next_visit_date: formData.follow_up,
    };

    const handlePrint = () => {
        printElement('prescription-print-form');
    };

    const handleSubmit = async (e) => {
        if (e?.preventDefault) e.preventDefault();
        if (!formData.diagnosis.trim()) {
            toast.error('Diagnosis is required');
            return;
        }
        setLoading(true);
        try {
            const payload = {
                ...formData,
                physical_examination: livePrescription.physical_examination,
                doctor_id: doctorId,
                patient_id: patient.id,
                prescription_items: items.filter(item => item.medicine_name.trim() !== ''),
                next_visit_date: formData.follow_up,
                custom_letterhead: customLetterhead
            };
            await prescriptionApi.create(payload);
            
            try {
                toast.loading('Generating PDF document...', { id: 'pdf-gen' });
                const { blob } = await generatePDFBlob('prescription-print-form', `prescription_${patient.id}_${Date.now()}.pdf`);
                
                const fileData = new FormData();
                fileData.append('file', blob, `prescription_${patient.id}_${Date.now()}.pdf`);
                fileData.append('doctorId', doctorId);
                fileData.append('fileType', 'prescription');

                await api.post(`/patients/${patient.id}/files`, fileData);
                toast.success('Prescription saved and attached to file history!', { id: 'pdf-gen' });
            } catch (pdfErr) {
                console.error("PDF upload failed:", pdfErr);
                toast.error('Data saved, but failed to attach PDF to history', { id: 'pdf-gen' });
            }

            if (onSaveSuccess) onSaveSuccess();
        } catch (err) {
            console.error(err);
            toast.error('Failed to save prescription. See console.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col animate-in fade-in duration-300">
            {/* Top Action Bar */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-600/20">
                        <Stethoscope className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-foreground">New Prescription</h2>
                        <p className="text-xs text-muted-foreground">
                            {patient?.first_name} {patient?.last_name}
                            <span className="mx-1.5 opacity-40">•</span>
                            ID: {patient?.unique_id || patient?.id}
                        </p>
                    </div>
                </div>

                {/* Panel Toggle (mobile) */}
                <div className="flex items-center gap-2">
                    <div className="hidden sm:flex bg-muted/50 p-1 rounded-xl gap-1">
                        <button
                            onClick={() => setActivePanel('write')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activePanel === 'write' ? 'bg-white dark:bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <ChevronRight className="w-3.5 h-3.5" /> Write
                        </button>
                        <button
                            onClick={() => setActivePanel('preview')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activePanel === 'preview' ? 'bg-white dark:bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <Eye className="w-3.5 h-3.5" /> Preview
                        </button>
                    </div>

                    {/* Settings Trigger */}
                    <button
                        onClick={() => setShowSettings(true)}
                        className="p-2 text-muted-foreground hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-xl transition-all"
                        title="Letterhead Settings"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handlePrint}
                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 border border-border text-xs font-bold text-muted-foreground hover:text-foreground rounded-xl transition-all"
                    >
                        <Printer className="w-3.5 h-3.5" /> Print
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-teal-600/20"
                    >
                        {loading ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save
                    </button>
                    <button
                        onClick={onCancel}
                        className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden flex">

                {/* ── LEFT: EDITOR ── */}
                <div className={`w-full lg:w-[52%] overflow-y-auto scrollbar-thin bg-background ${activePanel === 'preview' ? 'hidden lg:block' : 'block'}`}>
                    <form onSubmit={handleSubmit} className="p-4 space-y-4">

                        {/* Section: Clinical Information */}
                        <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-teal-600 flex items-center gap-1.5">
                                <Activity className="w-3.5 h-3.5" /> Clinical Information
                            </h3>

                            {/* C/C */}
                            <div>
                                <FieldLabel icon={<AlertCircle className="w-3 h-3 text-rose-500" />} text="Chief Complaints (C/C)" />
                                <textarea
                                    name="chief_complaints"
                                    value={formData.chief_complaints}
                                    onChange={handleInputChange}
                                    rows={2}
                                    placeholder="e.g. Fever for 3 days, Headache, Body ache..."
                                    className="w-full bg-muted/30 border border-border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none transition-all resize-none"
                                />
                            </div>

                            {/* History */}
                            <div>
                                <FieldLabel icon={<History className="w-3 h-3 text-blue-500" />} text="History (Hx)" />
                                <textarea
                                    name="clinical_history"
                                    value={formData.clinical_history}
                                    onChange={handleInputChange}
                                    rows={2}
                                    placeholder="e.g. DM for 5 years, Hypertensive, known case of..."
                                    className="w-full bg-muted/30 border border-border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none transition-all resize-none"
                                />
                            </div>

                            {/* Vitals */}
                            <div>
                                <FieldLabel icon={<Thermometer className="w-3 h-3 text-amber-500" />} text="On Examination (O/E) — Vitals" />
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                    {[
                                        { name: 'vitals_temp', placeholder: 'Temp (°F)', icon: '🌡' },
                                        { name: 'vitals_bp', placeholder: 'BP (mmHg)', icon: '💉' },
                                        { name: 'vitals_pulse', placeholder: 'Pulse (bpm)', icon: '❤️' },
                                        { name: 'vitals_spo2', placeholder: 'SpO₂ (%)', icon: '💨' },
                                        { name: 'vitals_weight', placeholder: 'Weight (kg)', icon: '⚖️' },
                                    ].map(v => (
                                        <div key={v.name} className="relative">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm">{v.icon}</span>
                                            <input
                                                type="text"
                                                name={v.name}
                                                value={formData[v.name]}
                                                onChange={handleInputChange}
                                                placeholder={v.placeholder}
                                                className="w-full bg-muted/30 border border-border rounded-xl pl-8 pr-2 py-2 text-xs font-semibold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none transition-all"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <textarea
                                    name="physical_examination"
                                    value={formData.physical_examination}
                                    onChange={handleInputChange}
                                    rows={1}
                                    placeholder="Additional findings (e.g. Jaundice+, Pallor-, Oedema+)..."
                                    className="mt-2 w-full bg-muted/30 border border-border rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none transition-all resize-none"
                                />
                            </div>

                            {/* Investigations */}
                            <div>
                                <FieldLabel icon={<Activity className="w-3 h-3 text-purple-500" />} text="Investigations / Lab Findings" />
                                <textarea
                                    name="investigations"
                                    value={formData.investigations}
                                    onChange={handleInputChange}
                                    rows={2}
                                    placeholder="e.g. HbA1c: 7.2%, FBS: 185mg/dL, CBC: WBC elevated"
                                    className="w-full bg-muted/30 border border-border rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none transition-all resize-none"
                                />
                                {patientReports.length > 0 && (
                                    <div className="mt-1.5 flex flex-wrap gap-1">
                                        {patientReports.slice(0, 5).map((r, i) => (
                                            <Chip
                                                key={i}
                                                label={`${r.test_name}: ${r.result_text} ${r.unit || ''}`}
                                                onClick={() => handleInputChange({ target: { name: 'investigations', value: formData.investigations + (formData.investigations ? '\n' : '') + `${r.test_name}: ${r.result_text} ${r.unit || ''}` } })}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Section: Rx - Diagnosis & Medications */}
                        <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-teal-600 flex items-center gap-1.5">
                                    <span className="text-lg font-black italic text-teal-400 leading-none">Rx</span>
                                    Prescription
                                </h3>
                            </div>

                            {/* Diagnosis */}
                            <div>
                                <FieldLabel icon={<Stethoscope className="w-3 h-3 text-teal-600" />} text="Diagnosis / Clinical Impression *" color="text-teal-600" />
                                <input
                                    type="text"
                                    name="diagnosis"
                                    value={formData.diagnosis}
                                    onChange={handleInputChange}
                                    placeholder="Primary and secondary diagnoses..."
                                    className="w-full bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800 rounded-xl p-3 text-sm font-semibold focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-all"
                                    required
                                />
                            </div>

                            {/* Medications */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Medications</span>
                                    <button
                                        type="button"
                                        onClick={addItem}
                                        className="flex items-center gap-1 text-[10px] font-black text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 dark:bg-teal-900/20 px-2.5 py-1 rounded-lg transition-all"
                                    >
                                        <Plus className="w-3 h-3" /> Add Medicine
                                    </button>
                                </div>

                                {items.map((item, index) => (
                                    <div key={index} className="group bg-muted/10 border border-border rounded-xl p-3 space-y-2">
                                        {/* Row 1: Number + Type + Name */}
                                        <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-teal-600/10 text-teal-700 text-[10px] font-black flex items-center justify-center flex-shrink-0">
                                                {index + 1}
                                            </span>
                                            <select
                                                value={item.medicine_type}
                                                onChange={(e) => handleItemChange(index, 'medicine_type', e.target.value)}
                                                className="w-20 bg-background border border-border rounded-lg p-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-teal-500/20 flex-shrink-0"
                                            >
                                                {MED_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                            <input
                                                type="text"
                                                value={item.medicine_name}
                                                onChange={(e) => handleItemChange(index, 'medicine_name', e.target.value)}
                                                placeholder="Medicine Name, strength (e.g. Napa 500mg)"
                                                className="flex-1 bg-background border border-border rounded-lg p-1.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-500/20"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="w-7 h-7 flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        {/* Row 2: Dosage + Duration + Instruction */}
                                        <div className="grid grid-cols-3 gap-2 pl-7">
                                            <div>
                                                <input
                                                    type="text"
                                                    value={item.dosage}
                                                    onChange={(e) => handleItemChange(index, 'dosage', e.target.value)}
                                                    placeholder="Dose (1+0+1)"
                                                    className="w-full bg-background border border-border rounded-lg p-1.5 text-xs outline-none focus:ring-2 focus:ring-teal-500/20"
                                                />
                                                <div className="mt-1 flex flex-wrap gap-0.5">
                                                    {DOSAGE_SHORTCUTS.map(d => (
                                                        <Chip key={d} label={d} active={item.dosage?.includes(d)} onClick={() => handleChipToggle(index, 'dosage', d)} />
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <input
                                                    type="text"
                                                    value={item.duration}
                                                    onChange={(e) => handleItemChange(index, 'duration', e.target.value)}
                                                    placeholder="Duration"
                                                    className="w-full bg-background border border-border rounded-lg p-1.5 text-xs outline-none focus:ring-2 focus:ring-teal-500/20"
                                                />
                                                <div className="mt-1 flex flex-wrap gap-0.5">
                                                    {DURATION_SHORTCUTS.map(d => (
                                                        <Chip key={d} label={d} active={item.duration?.includes(d)} onClick={() => handleChipToggle(index, 'duration', d)} />
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <input
                                                    type="text"
                                                    value={item.instructions}
                                                    onChange={(e) => handleItemChange(index, 'instructions', e.target.value)}
                                                    placeholder="Instruction (type freely...)"
                                                    className="w-full bg-background border border-border rounded-lg p-1.5 text-xs outline-none focus:ring-2 focus:ring-teal-500/20"
                                                />
                                                <div className="mt-1 flex flex-wrap gap-0.5">
                                                    {INSTRUCTION_SHORTCUTS.map(i => (
                                                        <Chip key={i} label={i} active={item.instructions?.includes(i)} onClick={() => handleChipToggle(index, 'instructions', i)} />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Section: Advice & Follow-up */}
                        <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-teal-600 flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5" /> Advice & Follow-up
                            </h3>

                            <div>
                                <FieldLabel icon={<Info className="w-3 h-3 text-amber-500" />} text="General Advice" />
                                <textarea
                                    name="advice"
                                    value={formData.advice}
                                    onChange={handleInputChange}
                                    rows={3}
                                    placeholder="Special instructions for the patient..."
                                    className="w-full bg-muted/30 border border-border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none transition-all resize-none"
                                />
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                    {COMMON_ADVICE.map(a => (
                                        <Chip
                                            key={a}
                                            label={a}
                                            active={formData.advice?.includes(a)}
                                            onClick={() => toggleAdvice(a)}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <FieldLabel icon={<Clock className="w-3 h-3 text-rose-500" />} text="Next Follow-up Date" />
                                <input
                                    type="date"
                                    name="follow_up"
                                    value={formData.follow_up}
                                    onChange={handleInputChange}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full sm:w-64 bg-background border border-border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Bottom Submit (mobile) */}
                        <div className="flex gap-3 pt-2 pb-6">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="flex-1 py-3 border border-border text-sm font-bold text-muted-foreground hover:text-foreground rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handlePrint}
                                className="flex items-center justify-center gap-2 px-6 py-3 border border-border text-sm font-bold text-muted-foreground hover:text-foreground rounded-xl transition-all"
                            >
                                <Printer className="w-4 h-4" /> Print
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-teal-600/20"
                            >
                                {loading ? <Clock className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Prescription
                            </button>
                        </div>
                    </form>
                </div>

                {/* ── RIGHT: LIVE PREVIEW ── */}
                <div className={`w-full lg:w-[48%] bg-slate-100 dark:bg-slate-900 border-l border-border overflow-y-auto scrollbar-thin ${activePanel === 'write' ? 'hidden lg:flex' : 'flex'} flex-col`}>
                    <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-slate-200/70 dark:bg-slate-800/50 border-b border-border">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                            <Eye className="w-3 h-3" /> Live Print Preview
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium">A4 Format</span>
                    </div>
                    <div className="flex-1 p-4 prescription-print-container">
                        <div className="transform origin-top scale-[0.72] lg:scale-75 xl:scale-[0.82]" style={{ transformOrigin: 'top center' }}>
                            <PrescriptionTemplate
                                prescription={livePrescription}
                                doctor={doctor}
                                patient={patient}
                                customLetterhead={customLetterhead}
                                isPreview
                                printId="prescription-print-form"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <PrescriptionSettings
                    doctor={doctor}
                    onSave={handleSettingsSave}
                    onCancel={() => setShowSettings(false)}
                />
            )}
        </div>
    );
};

export default PrescriptionForm;

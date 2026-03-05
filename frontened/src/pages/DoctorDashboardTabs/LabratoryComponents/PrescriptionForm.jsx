import React, { useState, useEffect } from 'react';
import {
    Plus,
    Trash2,
    Save,
    Printer,
    Clock,
    Stethoscope,
    AlertCircle,
    History,
    Info,
    ChevronDown
} from "lucide-react";
import { prescriptionApi } from '../../../lib/api';
import { toast } from 'react-hot-toast';

const MED_TYPES = ['Tab.', 'Cap.', 'Syr.', 'Inj.', 'Drop', 'Cream', 'Oint.', 'Spray', 'Supp.'];
const DOSAGE_SHORTCUTS = ['1+0+0', '0+0+1', '1+0+1', '1+1+1', '1+1+0'];
const INSTRUCTION_SHORTCUTS = ['After Meal', 'Before Meal', 'At Night', 'Empty Stomach'];
const DURATION_SHORTCUTS = ['3 days', '5 days', '7 days', '14 days', '1 month'];

const PrescriptionForm = ({ patient, doctorId, onSaveSuccess, onCancel }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        chief_complaints: '',
        clinical_history: '',
        physical_examination: '',
        diagnosis: '',
        advice: '',
        follow_up: '',
    });

    const [items, setItems] = useState([
        { medicine_name: '', medicine_type: 'Tab.', dosage: '', duration: '', instructions: '' }
    ]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { medicine_name: '', medicine_type: 'Tab.', dosage: '', duration: '', instructions: '' }]);
    };

    const removeItem = (index) => {
        if (items.length === 1) {
            setItems([{ medicine_name: '', medicine_type: 'Tab.', dosage: '', duration: '', instructions: '' }]);
        } else {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.diagnosis) {
            toast.error('Diagnosis is required');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...formData,
                doctor_id: doctorId,
                patient_id: patient.id,
                items: items.filter(item => item.medicine_name.trim() !== '')
            };

            await prescriptionApi.create(payload);
            toast.success('Prescription saved successfully');
            if (onSaveSuccess) onSaveSuccess();
        } catch (err) {
            console.error(err);
            toast.error('Failed to save prescription');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-background min-h-screen p-4 lg:p-6 animate-in fade-in duration-500">
            <div className="max-w-6xl mx-auto bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                {/* Header */}
                <div className="bg-muted/30 p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <Stethoscope className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">Write Prescription</h1>
                            <p className="text-sm text-muted-foreground flex items-center">
                                Patient: <span className="font-semibold text-foreground ml-1">{patient?.first_name} {patient?.last_name}</span>
                                <span className="mx-2">•</span>
                                ID: <span className="text-foreground ml-1">{patient?.unique_id}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20"
                        >
                            {loading ? <Clock className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Prescription
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* Left Column: clinical info */}
                        <div className="lg:col-span-4 space-y-6">
                            <section>
                                <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                                    <AlertCircle className="w-4 h-4 text-rose-500" />
                                    <h3 className="text-xs font-bold uppercase tracking-wider">Chief Complaints</h3>
                                </div>
                                <textarea
                                    name="chief_complaints"
                                    value={formData.chief_complaints}
                                    onChange={handleInputChange}
                                    rows={3}
                                    placeholder="e.g. Fever for 3 days, Headache..."
                                    className="w-full bg-muted/20 border border-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                                />
                            </section>

                            <section>
                                <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                                    <History className="w-4 h-4 text-emerald-500" />
                                    <h3 className="text-xs font-bold uppercase tracking-wider">Clinical History</h3>
                                </div>
                                <textarea
                                    name="clinical_history"
                                    value={formData.clinical_history}
                                    onChange={handleInputChange}
                                    rows={3}
                                    placeholder="e.g. Diabetic, Hypertensive..."
                                    className="w-full bg-muted/20 border border-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                                />
                            </section>

                            <section>
                                <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                                    <Stethoscope className="w-4 h-4 text-amber-500" />
                                    <h3 className="text-xs font-bold uppercase tracking-wider">O/E (On Examination)</h3>
                                </div>
                                <textarea
                                    name="physical_examination"
                                    value={formData.physical_examination}
                                    onChange={handleInputChange}
                                    rows={3}
                                    placeholder="e.g. BP: 120/80, Pulse: 72..."
                                    className="w-full bg-muted/20 border border-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                                />
                            </section>

                            <section className="p-4 bg-muted/10 rounded-2xl border border-dashed border-border">
                                <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                                    <Clock className="w-4 h-4" />
                                    <h3 className="text-xs font-bold uppercase tracking-wider">Follow Up</h3>
                                </div>
                                <input
                                    type="date"
                                    name="follow_up"
                                    value={formData.follow_up}
                                    onChange={handleInputChange}
                                    className="w-full bg-background border border-border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                                />
                            </section>
                        </div>

                        {/* Right Column: Medications */}
                        <div className="lg:col-span-8">
                            {/* Diagnosis - Top of medication area */}
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-2xl font-black text-blue-600/20 italic select-none">Rx</span>
                                    <h3 className="text-sm font-bold text-foreground">Diagnosis / Clinical Impression</h3>
                                </div>
                                <input
                                    type="text"
                                    name="diagnosis"
                                    value={formData.diagnosis}
                                    onChange={handleInputChange}
                                    placeholder="Enter diagnosis..."
                                    className="w-full bg-muted/20 border-b-2 border-border focus:border-blue-500 px-2 py-3 text-lg font-semibold outline-none transition-all placeholder:font-normal placeholder:opacity-50"
                                    required
                                />
                            </div>

                            {/* Medication Items */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Medications</h3>
                                    <button
                                        type="button"
                                        onClick={addItem}
                                        className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-all"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Add Medicine
                                    </button>
                                </div>

                                {items.map((item, index) => (
                                    <div key={index} className="group relative bg-muted/5 border border-border rounded-2xl p-4 lg:p-6 transition-all hover:border-blue-200 hover:bg-white animate-in zoom-in-95 duration-300">
                                        <button
                                            type="button"
                                            onClick={() => removeItem(index)}
                                            className="absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center bg-background border border-border text-rose-500 rounded-full shadow-sm hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>

                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                                            {/* Medicine Info */}
                                            <div className="md:col-span-4 flex gap-2">
                                                <select
                                                    value={item.medicine_type}
                                                    onChange={(e) => handleItemChange(index, 'medicine_type', e.target.value)}
                                                    className="w-20 bg-muted/20 border border-border rounded-xl p-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                                                >
                                                    {MED_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                                <input
                                                    type="text"
                                                    value={item.medicine_name}
                                                    onChange={(e) => handleItemChange(index, 'medicine_name', e.target.value)}
                                                    placeholder="Medicine Name"
                                                    className="flex-1 bg-muted/20 border border-border rounded-xl p-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20"
                                                />
                                            </div>

                                            {/* Dosage & Duration */}
                                            <div className="md:col-span-4 flex gap-2">
                                                <div className="flex-1 relative">
                                                    <input
                                                        type="text"
                                                        value={item.dosage}
                                                        onChange={(e) => handleItemChange(index, 'dosage', e.target.value)}
                                                        placeholder="Dosage (e.g. 1+0+1)"
                                                        className="w-full bg-muted/20 border border-border rounded-xl p-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
                                                    />
                                                    <div className="mt-1.5 flex flex-wrap gap-1">
                                                        {DOSAGE_SHORTCUTS.map(d => (
                                                            <button
                                                                key={d}
                                                                type="button"
                                                                onClick={() => handleItemChange(index, 'dosage', d)}
                                                                className="text-[10px] px-1.5 py-0.5 bg-muted hover:bg-blue-100 rounded text-muted-foreground hover:text-blue-700 transition-colors"
                                                            >
                                                                {d}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <input
                                                        type="text"
                                                        value={item.duration}
                                                        onChange={(e) => handleItemChange(index, 'duration', e.target.value)}
                                                        placeholder="Duration (7 days)"
                                                        className="w-full bg-muted/20 border border-border rounded-xl p-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
                                                    />
                                                    <div className="mt-1.5 flex flex-wrap gap-1">
                                                        {DURATION_SHORTCUTS.map(d => (
                                                            <button
                                                                key={d}
                                                                type="button"
                                                                onClick={() => handleItemChange(index, 'duration', d)}
                                                                className="text-[10px] px-1.5 py-0.5 bg-muted hover:bg-blue-100 rounded text-muted-foreground hover:text-blue-700 transition-colors"
                                                            >
                                                                {d}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Instructions */}
                                            <div className="md:col-span-4">
                                                <input
                                                    type="text"
                                                    value={item.instructions}
                                                    onChange={(e) => handleItemChange(index, 'instructions', e.target.value)}
                                                    placeholder="Instructions (e.g. After Meal)"
                                                    className="w-full bg-muted/20 border border-border rounded-xl p-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
                                                />
                                                <div className="mt-1.5 flex flex-wrap gap-1">
                                                    {INSTRUCTION_SHORTCUTS.map(i => (
                                                        <button
                                                            key={i}
                                                            type="button"
                                                            onClick={() => handleItemChange(index, 'instructions', i)}
                                                            className="text-[10px] px-1.5 py-0.5 bg-muted hover:bg-blue-100 rounded text-muted-foreground hover:text-blue-700 transition-colors"
                                                        >
                                                            {i}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Advice Section */}
                            <div className="mt-10 pt-10 border-t border-border">
                                <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                                    <Info className="w-4 h-4" />
                                    <h3 className="text-xs font-bold uppercase tracking-wider">General Advice</h3>
                                </div>
                                <textarea
                                    name="advice"
                                    value={formData.advice}
                                    onChange={handleInputChange}
                                    rows={4}
                                    placeholder="e.g. Drink plenty of water, Complete the full course..."
                                    className="w-full bg-muted/20 border border-border rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                                />
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PrescriptionForm;

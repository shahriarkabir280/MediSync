import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw, Info, User, BookOpen, MapPin, Phone, Mail, Award, Activity } from 'lucide-react';

const PrescriptionSettings = ({ doctor, onSave, onCancel }) => {
    const doctorId = doctor?.id || 'default';
    const STORAGE_KEY = `prescription_settings_${doctorId}`;

    const [settings, setSettings] = useState({
        hospital_name: '',
        degrees: '',
        specialization: '',
        bmdc_reg: '',
        phone: '',
        email: '',
        address: '',
        extra_info: ''
    });

    useEffect(() => {
        const savedSettings = localStorage.getItem(STORAGE_KEY);
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        } else if (doctor) {
            // Pre-fill from doctor profile if no custom settings exist
            setSettings({
                hospital_name: doctor.hospital_name || doctor.clinic_name || 'CareConnect Hospital',
                degrees: doctor.qualifications || doctor.degrees || 'MBBS, FCPS',
                specialization: doctor.specialization || 'General Physician',
                bmdc_reg: doctor.license_number || doctor.bmdc_reg || '',
                phone: doctor.phone || doctor.contact_number || '',
                email: doctor.email || '',
                address: doctor.chamber_address || doctor.address || '',
                extra_info: ''
            });
        }
    }, [doctor, STORAGE_KEY]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        onSave(settings);
    };

    const handleReset = () => {
        if (window.confirm('Reset to original profile information?')) {
            const defaultSettings = {
                hospital_name: doctor.hospital_name || doctor.clinic_name || 'CareConnect Hospital',
                degrees: doctor.qualifications || doctor.degrees || 'MBBS, FCPS',
                specialization: doctor.specialization || 'General Physician',
                bmdc_reg: doctor.license_number || doctor.bmdc_reg || '',
                phone: doctor.phone || doctor.contact_number || '',
                email: doctor.email || '',
                address: doctor.chamber_address || doctor.address || '',
                extra_info: ''
            };
            setSettings(defaultSettings);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600">
                            <Award className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">Letterhead Settings</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customize your prescription pad</p>
                        </div>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl p-4 flex gap-3">
                        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed font-medium">
                            The information here will appear at the top of every prescription you write.
                            Changes are saved locally and won't affect your main profile.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5 ml-1">
                                <Activity className="w-3 h-3 text-teal-600" /> Associated Hospital / Clinic
                            </label>
                            <input
                                name="hospital_name"
                                value={settings.hospital_name}
                                onChange={handleChange}
                                placeholder="e.g. Dhaka Medical College & Hospital"
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5 ml-1">
                                <BookOpen className="w-3 h-3" /> Degrees / Qualifications
                            </label>
                            <input
                                name="degrees"
                                value={settings.degrees}
                                onChange={handleChange}
                                placeholder="e.g. MBBS, FCPS (Medicine)"
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5 ml-1">
                                <Award className="w-3 h-3" /> Specialization
                            </label>
                            <input
                                name="specialization"
                                value={settings.specialization}
                                onChange={handleChange}
                                placeholder="e.g. General Physician"
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5 ml-1">
                                <User className="w-3 h-3" /> BMDC Reg No
                            </label>
                            <input
                                name="bmdc_reg"
                                value={settings.bmdc_reg}
                                onChange={handleChange}
                                placeholder="e.g. A-123456"
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5 ml-1">
                                <Phone className="w-3 h-3" /> Contact Phone
                            </label>
                            <input
                                name="phone"
                                value={settings.phone}
                                onChange={handleChange}
                                placeholder="e.g. +880 1711-XXXXXX"
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all outline-none"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5 ml-1">
                                <Mail className="w-3 h-3" /> Email Address
                            </label>
                            <input
                                name="email"
                                value={settings.email}
                                onChange={handleChange}
                                placeholder="e.g. doctor@example.com"
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all outline-none"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5 ml-1">
                                <MapPin className="w-3 h-3" /> Chamber Address
                            </label>
                            <textarea
                                name="address"
                                value={settings.address}
                                onChange={handleChange}
                                placeholder="Enter chamber address and visiting hours..."
                                rows={2}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all outline-none resize-none"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5 ml-1">
                                <Info className="w-3 h-3" /> Additional Header Info
                            </label>
                            <input
                                name="extra_info"
                                value={settings.extra_info}
                                onChange={handleChange}
                                placeholder="Any extra info to display in the header..."
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-bold uppercase tracking-wider transition-all"
                    >
                        <RotateCcw className="w-4 h-4" /> Reset to Profile
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="px-6 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-8 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-teal-600/20 transition-all active:scale-95"
                        >
                            <Save className="w-4 h-4" /> Save Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrescriptionSettings;

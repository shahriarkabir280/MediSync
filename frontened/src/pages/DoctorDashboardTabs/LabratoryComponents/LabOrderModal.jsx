import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { 
  FlaskConical, 
  X, 
  FileText, 
  Check, 
  Clock, 
  AlertCircle,
  ClipboardList,
  User as UserIcon,
  ChevronRight,
  Save,
  Beaker,
  Trash2,
  Plus,
  Search,
  ArrowLeft,
  XCircle,
  Edit3
} from "lucide-react";
import { labApi } from "../../../lib/api";
import { toast } from "react-hot-toast";

const LabOrderModal = ({ selectedReport, setShowReportModal, handleStatusUpdate, onVerify, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showTestCatalog, setShowTestCatalog] = useState(false);
    const [allTests, setAllTests] = useState([]);
    const [testSearchQuery, setTestSearchQuery] = useState('');
    
    const [formData, setFormData] = useState({
        clinical_notes: '',
        priority: 'normal',
        test_ids: []
    });

    // Initialize form data from report
    useEffect(() => {
        if (selectedReport?.order) {
            setFormData({
                clinical_notes: selectedReport.order.clinical_notes || '',
                priority: selectedReport.order.priority || 'normal',
                test_ids: selectedReport.items.map(i => i.test_id)
            });
        }
    }, [selectedReport]);

    // Fetch tests for catalog
    useEffect(() => {
        const fetchTests = async () => {
            try {
                const result = await labApi.getTests();
                if (result.success) setAllTests(result.data);
            } catch (error) {
                console.error("Error fetching tests:", error);
            }
        };
        fetchTests();
    }, []);

    if (!selectedReport) return null;

    const { order, items } = selectedReport;

    // Derived: Current test objects in the order (based on form data)
    const currentTests = useMemo(() => {
        return formData.test_ids.map(id => {
            const existing = items.find(i => i.test_id === id);
            if (existing) return { id: existing.test_id, test_name: existing.test_name, test_code: existing.test_code, category_name: existing.category_name, status: existing.status };
            const catalogItem = allTests.find(t => t.id === id);
            if (catalogItem) return { id: catalogItem.id, test_name: catalogItem.test_name, test_code: catalogItem.test_code, category_name: catalogItem.category_name, status: 'new' };
            return { id, test_name: 'Unknown Test', test_code: '...', category_name: '...', status: 'new' };
        });
    }, [formData.test_ids, items, allTests]);

    const filteredCatalog = useMemo(() => {
        const query = testSearchQuery.toLowerCase();
        return allTests.filter(t => 
            !formData.test_ids.includes(t.id) && 
            (t.test_name.toLowerCase().includes(query) || t.test_code.toLowerCase().includes(query))
        ).slice(0, 10);
    }, [allTests, testSearchQuery, formData.test_ids]);

    const handleSave = async () => {
        try {
            setLoading(true);
            const result = await labApi.updateOrder(order.id, {
                clinical_notes: formData.clinical_notes,
                priority: formData.priority,
                test_ids: formData.test_ids
            });

            if (result.success) {
                toast.success("Order updated successfully");
                setIsEditing(false);
                if (onSuccess) onSuccess();
            } else {
                toast.error(result.error || "Failed to update order");
            }
        } catch (error) {
            console.error("Update error:", error);
            toast.error("An error occurred while updating the order");
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!window.confirm("Are you sure you want to cancel this order?")) return;
        try {
            setLoading(true);
            const result = await labApi.updateOrder(order.id, { status: 'cancelled' });
            if (result.success) {
                toast.success("Order cancelled");
                setShowReportModal(false);
                if (onSuccess) onSuccess();
            } else {
                toast.error(result.error || "Failed to cancel order");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const toggleTest = (testId) => {
        setFormData(prev => {
            const exists = prev.test_ids.includes(testId);
            if (exists) {
                return { ...prev, test_ids: prev.test_ids.filter(id => id !== testId) };
            } else {
                return { ...prev, test_ids: [...prev.test_ids, testId] };
            }
        });
        setIsEditing(true);
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-[9999] p-3 sm:p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl w-full max-w-[calc(100%-0.75rem)] sm:max-w-3xl h-[90vh] sm:h-[85vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800">
                
                <div className="px-3 sm:px-6 py-2 sm:py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-slate-900 z-10 gap-2.5 sm:gap-0">
                    <div className="flex items-center gap-2 sm:gap-4">
                        <div className="bg-indigo-600 p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl shadow-lg shadow-indigo-600/20">
                            <Beaker className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-xs sm:text-base font-bold text-slate-900 dark:text-white leading-none truncate">Lab Order Details</h3>
                            <div className="flex items-center gap-1.5 mt-1 sm:mt-1.5 overflow-x-auto no-scrollbar">
                                <span className="text-[9px] sm:text-xs text-slate-400 font-mono flex-shrink-0">#{order.order_number}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300 flex-shrink-0" />
                                <span className={`text-[8px] sm:text-[10px] font-bold uppercase px-1.5 sm:px-2 py-0.5 rounded-full border transition-all flex-shrink-0 ${
                                    order.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50' :
                                    order.status === 'cancelled' ? 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800/50' :
                                    'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/50'
                                }`}>
                                    {order.status === 'confirmed' ? 'confirmed' : order.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            {!isEditing && order.status === 'pending' && (
                                <>
                                    <button 
                                        onClick={() => setIsEditing(true)}
                                        className="px-2 sm:px-3 py-1 bg-indigo-600 text-white rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shadow-md hover:bg-indigo-700 transition-all"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={handleCancelOrder}
                                        className="px-2 sm:px-3 py-1 bg-rose-600 text-white rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shadow-md hover:bg-rose-700 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </>
                            )}

                            {isEditing && (
                                <button 
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="px-3 sm:px-4 py-1.5 bg-emerald-600 text-white rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shadow-md hover:bg-emerald-700 transition-all disabled:opacity-50"
                                >
                                    {loading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Save"}
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="w-px h-5 sm:h-8 bg-slate-100 dark:bg-slate-800" />
                            <button
                                onClick={() => setShowReportModal(false)}
                                className="p-1 sm:p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all flex-shrink-0"
                            >
                                <X className="w-4 h-4 sm:w-6 sm:h-6" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">
                    {/* Left: Test List */}
                    <div className="flex-1 p-2 sm:p-5 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/20 custom-scrollbar">
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-6">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <FlaskConical className="w-3.5 h-3.5 text-indigo-500" /> Tests in this order ({formData.test_ids.length})
                                </label>
                                {isEditing && (
                                    <button 
                                        onClick={() => setShowTestCatalog(!showTestCatalog)}
                                        className="px-2 py-1 bg-white dark:bg-slate-800 border-[1px] border-slate-200 dark:border-slate-700 rounded-lg text-[9px] font-bold text-indigo-600 hover:border-indigo-500 transition-all"
                                    >
                                        {showTestCatalog ? "Back" : "Add Test"}
                                    </button>
                                )}
                            </div>

                            {showTestCatalog && isEditing ? (
                                <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                        <input 
                                            autoFocus
                                            type="text" 
                                            placeholder="Search by test name or code..." 
                                            value={testSearchQuery}
                                            onChange={(e) => setTestSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 transition-all text-xs shadow-sm"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 gap-1.5 sm:gap-2">
                                        {filteredCatalog.map(t => (
                                            <button 
                                                key={t.id}
                                                onClick={() => toggleTest(t.id)}
                                                className="p-2 sm:p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl sm:rounded-2xl text-left hover:border-indigo-500/50 hover:shadow-lg transition-all flex items-center justify-between group"
                                            >
                                                <div className="min-w-0">
                                                    <p className="font-bold text-slate-900 dark:text-white text-[11px] sm:text-xs truncate">{t.test_name}</p>
                                                    <p className="text-[9px] sm:text-[10px] uppercase font-black tracking-widest text-slate-400 mt-0.5 sm:mt-1">{t.test_code} • {t.category_name}</p>
                                                </div>
                                                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-lg sm:p-2.5 sm:rounded-xl text-indigo-600 opacity-0 group-hover:opacity-100 transition-all">
                                                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-1.5 sm:gap-2">
                                    {currentTests.map((t) => (
                                        <div 
                                            key={t.id} 
                                            className="p-2 sm:p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl sm:rounded-2xl shadow-sm flex items-center justify-between group hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                                        >
                                            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                                <div className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-colors ${t.status === 'done' || t.status === 'completed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'}`}>
                                                    {t.status === 'done' || t.status === 'completed' ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : <Clock className="w-4 h-4 sm:w-5 sm:h-5" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-slate-900 dark:text-white text-[11px] sm:text-xs truncate">{t.test_name}</h4>
                                                    <p className="text-[9px] sm:text-[10px] uppercase font-black tracking-widest text-slate-400 mt-0.5 sm:mt-1 truncate">{t.test_code} • {t.category_name}</p>
                                                </div>
                                            </div>
                                            {isEditing && (
                                                <button 
                                                    onClick={() => toggleTest(t.id)}
                                                    className="p-2 text-rose-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
                                                    title="Remove from order"
                                                >
                                                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Metadata Sidebar */}
                    <div className="w-full md:w-[280px] p-2.5 sm:p-5 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto custom-scrollbar">
                        <div className="space-y-5">
                            {/* Patient Info Card */}
                            <div className="p-5 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100/50 dark:border-indigo-800/30">
                                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                                    <UserIcon className="w-3 h-3" /> Patient Identity
                                </label>
                                <div className="space-y-0.5 sm:space-y-1">
                                    <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">{order.patient_first_name} {order.patient_last_name}</p>
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <span className="text-[9px] sm:text-[10px] font-mono bg-white dark:bg-slate-800 px-1.5 sm:px-2 py-0.5 rounded border border-slate-100 dark:border-slate-700 text-slate-500">{order.patient_unique_id}</span>
                                        <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full transition-colors ${order.patient_gender === 'Male' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400' : 'bg-pink-50 text-pink-600 dark:bg-pink-950/50 dark:text-pink-400'}`}>
                                            {order.patient_gender}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-2 font-bold uppercase tracking-tighter">
                                        {new Date().getFullYear() - new Date(order.patient_dob).getFullYear()} Years Old • {new Date(order.patient_dob).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {/* Priority Selection */}
                            <div className="p-4 bg-slate-100/50 dark:bg-slate-800/10 rounded-2xl border border-slate-200 dark:border-slate-800/50 shadow-sm">
                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Dispatch Priority
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['normal', 'high', 'urgent'].map(p => (
                                        <button
                                            key={p}
                                            disabled={loading || !isEditing}
                                            onClick={() => setFormData({...formData, priority: p})}
                                            className={`py-2 text-[9px] uppercase font-black tracking-widest border-2 rounded-xl transition-all ${
                                                formData.priority === p 
                                                    ? p === 'urgent' ? 'bg-rose-500 border-rose-500 text-white shadow-lg' 
                                                      : p === 'high' ? 'bg-amber-500 border-amber-500 text-white shadow-lg'
                                                      : 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                                                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-400 hover:border-indigo-500/50'
                                            } ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Clinical Notes */}
                            <div className="p-4 bg-slate-100/50 dark:bg-slate-800/10 rounded-2xl border border-slate-200 dark:border-slate-800/50 shadow-sm">
                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                                    <FileText className="w-3.5 h-3.5 text-blue-500" /> Clinical Directions
                                </label>
                                <textarea
                                    disabled={loading || !isEditing}
                                    placeholder="Enter case summary or special instructions..."
                                    value={formData.clinical_notes}
                                    onChange={(e) => setFormData({...formData, clinical_notes: e.target.value})}
                                    className={`w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-transparent rounded-xl focus:outline-none transition-all text-xs min-h-[100px] resize-none leading-relaxed font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 ${
                                        !isEditing ? 'opacity-70 cursor-not-allowed' : 'focus:border-indigo-500 focus:bg-white'
                                    }`}
                                />
                            </div>

                            {isEditing && (
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setShowTestCatalog(false);
                                        setFormData({
                                            clinical_notes: selectedReport.order.clinical_notes || '',
                                            priority: selectedReport.order.priority || 'normal',
                                            test_ids: selectedReport.items.map(i => i.test_id)
                                        });
                                    }}
                                    className="w-full py-1.5 text-[10px] font-black text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest border border-slate-100 dark:border-slate-800 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/10"
                                >
                                    Cancel Edits
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                {/* Status Bar */}
                <div className="px-4 sm:px-8 py-3 sm:py-4 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                        <div className="flex items-center gap-2.5 text-[9px] sm:text-[10px] uppercase font-black tracking-widest text-slate-400">
                            Ordered: <span className="text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-none">{new Date(order.order_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        </div>
                        <div className="hidden sm:block w-px h-5 bg-slate-200 dark:bg-slate-800" />
                        <div className="flex items-center gap-3">
                           <span className="text-[9px] sm:text-[10px] uppercase font-black tracking-widest text-slate-400">Phase:</span>
                           <span className={`px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${
                                order.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 
                                order.status === 'cancelled' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                           }`}>{order.status === 'confirmed' ? 'confirmed' : order.status}</span>
                        </div>
                    </div>
                    
                    {!isEditing && order.status === 'pending' && (
                        <button
                            onClick={() => handleStatusUpdate(order.id, 'confirmed')}
                            className="w-full sm:w-auto px-4 py-1.5 bg-emerald-600 text-white rounded-md sm:rounded-lg text-[9px] font-bold uppercase tracking-wider shadow-md hover:bg-emerald-700 transition-all"
                        >
                            Finalize
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default LabOrderModal;

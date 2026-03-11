import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { 
  Plus, 
  X, 
  Search, 
  FileText, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight,
  ClipboardList,
  Beaker,
  User as UserIcon
} from "lucide-react";
import { labApi } from "../../../lib/api";
import { toast } from "react-hot-toast";

const NewOrderModal = ({ setShowNewOrderModal, selectedPatient: preSelectedPatient, doctorId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [tests, setTests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTests, setSelectedTests] = useState([]);
  const [formData, setFormData] = useState({
    patient_id: preSelectedPatient?.id || '',
    clinical_notes: '',
    priority: 'normal'
  });

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const result = await labApi.getTests();
        if (result.success) {
          setTests(result.data);
        }
      } catch (error) {
        console.error("Error fetching tests:", error);
      }
    };
    fetchTests();
  }, []);

  const filteredTests = useMemo(() => {
    if (!searchQuery.trim()) return tests.slice(0, 10);
    return tests.filter(test => 
      test.test_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.test_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.category?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 10);
  }, [tests, searchQuery]);

  const toggleTest = (test) => {
    if (selectedTests.find(t => t.id === test.id)) {
      setSelectedTests(selectedTests.filter(t => t.id !== test.id));
    } else {
      setSelectedTests([...selectedTests, test]);
    }
  };

  const handleSubmit = async () => {
    if (!formData.patient_id) return toast.error("Please select or enter a Patient ID");
    if (!doctorId) return toast.error("Doctor ID missing. Please re-login.");
    if (selectedTests.length === 0) return toast.error("Please select at least one test");

    try {
      setLoading(true);
      const payload = {
        patient_id: formData.patient_id,
        doctor_id: doctorId,
        clinical_notes: formData.clinical_notes,
        priority: formData.priority,
        test_ids: selectedTests.map(t => t.id)
      };

      const result = await labApi.createOrder(payload);
      if (result.success) {
        toast.success("Lab order created successfully!");
        if (onSuccess) onSuccess();
        setShowNewOrderModal(false);
      } else {
        toast.error(result.error || "Failed to create order");
      }
    } catch (error) {
      console.error("Order Creation Error:", error);
      toast.error("An error occurred during order creation");
    } finally {
      setLoading(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[9999] p-3 sm:p-6 animate-in fade-in duration-300">
      <div className="bg-white/95 dark:bg-slate-900/95 rounded-2xl sm:rounded-3xl w-[95%] sm:w-[90%] max-w-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden border border-white/20 dark:border-slate-800/50 max-h-[90vh] sm:max-h-[75vh] relative">
        
        {/* Global Close Button */}
        <button 
          onClick={() => setShowNewOrderModal(false)}
          className="absolute right-3 top-3 sm:right-4 sm:top-4 p-1.5 bg-slate-100/50 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-700/50 rounded-lg text-slate-500 transition-all z-[110]"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Section: Catalog & Search */}
        <div className="flex-[0_0_auto] md:flex-1 p-4 sm:p-5 md:p-6 border-r border-slate-100 dark:border-slate-800/50 flex flex-col bg-slate-50/50 dark:bg-slate-950/20 min-h-0 max-h-[40vh] md:max-h-none">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-600/20">
              <Beaker className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">Order Catalog</h3>
            </div>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search tests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-[11px] sm:text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            <div className="space-y-2">
              {filteredTests.map(test => {
                const isSelected = selectedTests.find(t => t.id === test.id);
                return (
                  <button
                    key={test.id}
                    onClick={() => toggleTest(test)}
                    className={`w-full p-3 rounded-xl text-left border transition-all flex items-center justify-between group ${
                      isSelected 
                        ? 'bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-600/20' 
                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-500/30 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className={`font-bold text-[11px] sm:text-xs truncate ${isSelected ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
                        {test.test_name}
                      </span>
                      <span className={`text-[9px] sm:text-[10px] truncate ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                        {test.test_code} • {test.category}
                      </span>
                    </div>
                    {isSelected ? (
                      <CheckCircle2 className="w-4 h-4 text-white animate-in zoom-in duration-300 flex-shrink-0" />
                    ) : (
                      <Plus className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors flex-shrink-0" />
                    )}
                  </button>
                );
              })}
              {filteredTests.length === 0 && !loading && (
                <div className="py-8 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-[10px] font-medium">No results found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Section: Order Details */}
        <div className="flex-1 md:w-[280px] p-4 sm:p-5 md:p-6 flex flex-col justify-start md:justify-center bg-white dark:bg-slate-900 relative min-h-0">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            Order Details
          </h3>

          <div className="space-y-4 pr-1 custom-scrollbar overflow-y-auto">
            {/* Patient Selection */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <UserIcon className="w-2.5 h-2.5" /> Patient
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.patient_id}
                  readOnly={!!preSelectedPatient}
                  onChange={(e) => setFormData({...formData, patient_id: e.target.value})}
                  placeholder="ID#"
                  className={`w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-[11px] sm:text-xs ${
                    preSelectedPatient ? 'bg-indigo-50/30 dark:bg-indigo-900/10 border-indigo-200/50 dark:border-indigo-800/30' : 'bg-slate-50 dark:bg-slate-950/20'
                  }`}
                />
                {preSelectedPatient && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-500" />}
              </div>
            </div>

            {/* Selected Tests Summary */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <ClipboardList className="w-2.5 h-2.5" /> Selected ({selectedTests.length})
              </label>
              {selectedTests.length > 0 ? (
                <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                  {selectedTests.map(test => (
                    <div key={test.id} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950/20 rounded-lg group border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all">
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate pr-2">{test.test_name}</span>
                      <button 
                        onClick={() => toggleTest(test)}
                        className="p-1 hover:bg-red-50 hover:text-red-500 rounded-md transition-colors text-slate-300"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
                  <p className="text-[10px] text-slate-400 font-medium">None selected</p>
                </div>
              )}
            </div>

            {/* Clinical Notes */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <FileText className="w-2.5 h-2.5" /> Note
              </label>
              <textarea
                placeholder="Diagnostic reasoning..."
                value={formData.clinical_notes}
                onChange={(e) => setFormData({...formData, clinical_notes: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-[11px] sm:text-xs min-h-[60px] resize-none"
              />
            </div>

            {/* Priority Select */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Clock className="w-2.5 h-2.5" /> Priority
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {['normal', 'high', 'urgent'].map(p => (
                  <button
                    key={p}
                    onClick={() => setFormData({...formData, priority: p})}
                    className={`py-1.5 px-1 text-[8px] uppercase font-black tracking-widest border border-slate-200 dark:border-slate-800 rounded-lg transition-all ${
                      formData.priority === p 
                        ? p === 'urgent' ? 'bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/20' 
                          : p === 'high' ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/20'
                          : 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'bg-transparent text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/50">
            <button
              onClick={handleSubmit}
              disabled={loading || selectedTests.length === 0}
              className={`w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                loading || selectedTests.length === 0
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 scale-[0.98] hover:scale-100 active:scale-95'
              }`}
            >
              {loading ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Dispatch Order <ChevronRight className="w-3 h-3" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default NewOrderModal;

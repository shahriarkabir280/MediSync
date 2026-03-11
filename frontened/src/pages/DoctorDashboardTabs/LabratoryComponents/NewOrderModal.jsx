import React, { useState, useEffect, useMemo } from 'react';
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

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[100] p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="bg-white/90 dark:bg-slate-900/90 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col md:flex-row overflow-hidden border border-white/20 dark:border-slate-800/50 max-h-[90vh]">
        
        {/* Left Section: Catalog & Search */}
        <div className="flex-1 p-6 md:p-8 border-r border-slate-100 dark:border-slate-800/50 flex flex-col bg-slate-50/50 dark:bg-slate-950/20">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20">
              <Beaker className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Order Catalog</h3>
              <p className="text-sm text-slate-500 font-medium">Browse and search tests</p>
            </div>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or code (e.g. CBC, Lipid)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="space-y-3">
              {filteredTests.map(test => {
                const isSelected = selectedTests.find(t => t.id === test.id);
                return (
                  <button
                    key={test.id}
                    onClick={() => toggleTest(test)}
                    className={`w-full p-4 rounded-2xl text-left border transition-all flex items-center justify-between group ${
                      isSelected 
                        ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-600/20' 
                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
                        {test.test_name}
                      </span>
                      <span className={`text-xs ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                        {test.test_code} • {test.category}
                      </span>
                    </div>
                    {isSelected ? (
                      <CheckCircle2 className="w-5 h-5 text-white animate-in zoom-in duration-300" />
                    ) : (
                      <Plus className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                    )}
                  </button>
                );
              })}
              {filteredTests.length === 0 && !loading && (
                <div className="py-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <Search className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium">No tests found matching your search</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Section: Order Details */}
        <div className="w-full md:w-[380px] p-6 md:p-8 flex flex-col bg-white dark:bg-slate-900 relative">
          <button 
            onClick={() => setShowNewOrderModal(false)}
            className="absolute right-6 top-6 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-2">
            Order Details
          </h3>

          <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
            {/* Patient Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <UserIcon className="w-3 h-3" /> Patient Selection
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.patient_id}
                  readOnly={!!preSelectedPatient}
                  onChange={(e) => setFormData({...formData, patient_id: e.target.value})}
                  placeholder="Enter or select patient ID"
                  className={`w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm ${
                    preSelectedPatient ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800/30' : 'bg-slate-50 dark:bg-slate-950/20'
                  }`}
                />
                {preSelectedPatient && <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />}
              </div>
            </div>

            {/* Selected Tests Summary */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <ClipboardList className="w-3 h-3" /> Selected Tests ({selectedTests.length})
              </label>
              {selectedTests.length > 0 ? (
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {selectedTests.map(test => (
                    <div key={test.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/20 rounded-xl group border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate pr-2">{test.test_name}</span>
                      <button 
                        onClick={() => toggleTest(test)}
                        className="p-1 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-slate-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
                  <p className="text-xs text-slate-400 font-medium">No tests selected yet</p>
                </div>
              )}
            </div>

            {/* Clinical Notes */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-3 h-3" /> Clinical Instructions
              </label>
              <textarea
                placeholder="Diagnostic reasoning, clinical observations..."
                value={formData.clinical_notes}
                onChange={(e) => setFormData({...formData, clinical_notes: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm min-h-[100px] resize-none pb-8"
              />
            </div>

            {/* Priority Select */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-3 h-3" /> Order Priority
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['normal', 'high', 'urgent'].map(p => (
                  <button
                    key={p}
                    onClick={() => setFormData({...formData, priority: p})}
                    className={`py-2 px-1 text-[10px] uppercase font-black tracking-widest border-2 rounded-xl transition-all ${
                      formData.priority === p 
                        ? p === 'urgent' ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20' 
                          : p === 'high' ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20'
                          : 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                        : 'bg-transparent border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800/50">
            <button
              onClick={handleSubmit}
              disabled={loading || selectedTests.length === 0}
              className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-sm font-black uppercase tracking-widest transition-all ${
                loading || selectedTests.length === 0
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/30 hover:-translate-y-0.5 active:translate-y-0'
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Dispatch Order <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewOrderModal;

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Upload,
  ChevronRight,
  RefreshCw,
  LogOut,
  LayoutDashboard,
  ClipboardList,
  User as UserIcon,
  Beaker,
  History,
  Info,
  ArrowRight,
  Filter,
  CheckCircle,
  Clock3,
  Check,
  MoreVertical,
  ChevronDown,
  X
} from 'lucide-react';
import { labApi } from '../../lib/api';

const DiagnosticDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  
  const [uploadingItem, setUploadingItem] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const navigate = useNavigate();

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      
      const result = await labApi.getAllOrders(params);
      if (result.success) {
        setOrders(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch orders');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const fetchOrderDetails = useCallback(async (orderId) => {
    try {
      setDetailsLoading(true);
      const result = await labApi.getOrderDetails(orderId);
      if (result.success) {
        setSelectedOrderDetails(result.data);
      }
    } catch (err) {
      console.error("Error fetching order details:", err);
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (selectedOrder) {
      fetchOrderDetails(selectedOrder.id);
    } else {
      setSelectedOrderDetails(null);
    }
  }, [selectedOrder, fetchOrderDetails]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const result = await labApi.updateStatus(orderId, { status: newStatus });
      
      if (result.success) {
        if (selectedOrder && selectedOrder.id === orderId) {
            setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
        fetchOrders();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleFileSelect = (item, file) => {
    if (!file) return;
    setUploadingItem(item);
    setUploadFile(file);
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setUploadPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setUploadPreview(null);
    }
  };

  const handleUploadItem = async (orderItemId) => {
    if (!uploadFile) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', uploadFile);

      const result = await labApi.uploadItemReport(orderItemId, formData);

      if (result.success) {
        setUploadFile(null);
        setUploadPreview(null);
        setUploadingItem(null);
        
        // Refresh everything
        if (selectedOrder) fetchOrderDetails(selectedOrder.id);
        fetchOrders();
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'completed':
        return { 
          label: 'Completed', 
          icon: <CheckCircle2 className="w-3.5 h-3.5"/>, 
          class: 'bg-emerald-50 text-emerald-700 border-emerald-100',
          dot: 'bg-emerald-500'
        };
      case 'in_progress':
        return { 
          label: 'Processing', 
          icon: <Clock3 className="w-3.5 h-3.5"/>, 
          class: 'bg-indigo-50 text-indigo-700 border-indigo-100',
          dot: 'bg-indigo-500'
        };
      case 'pending':
        return { 
          label: 'Pending Approval', 
          icon: <Clock className="w-3.5 h-3.5"/>, 
          class: 'bg-amber-50 text-amber-700 border-amber-100',
          dot: 'bg-amber-500'
        };
      case 'confirmed':
        return { 
          label: 'Confirmed', 
          icon: <CheckCircle2 className="w-3.5 h-3.5"/>, 
          class: 'bg-emerald-50 text-emerald-700 border-emerald-100',
          dot: 'bg-emerald-500'
        };
      default:
        return { label: status, icon: null, class: 'bg-slate-50 text-slate-700 border-slate-100', dot: 'bg-slate-500' };
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.patient?.first_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.patient?.last_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;
      
      // Only show orders that are NOT pending
      if (order.status === 'pending') return false;
      
      // If "All" is selected, only show active orders (exclude completed)
      if (statusFilter === 'all' && order.status === 'completed') return false;
      
      return true;
    });
  }, [orders, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'in_progress').length,
      completed: orders.filter(o => o.status === 'completed').length
    };
  }, [orders]);

  return (
    <div className="min-h-screen bg-white flex font-sans selection:bg-indigo-100 text-slate-900">
      
      {/* ultra-compact sidebar */}
      <aside className="w-16 bg-slate-950 flex flex-col items-center py-6 sticky top-0 h-screen transition-all duration-300 z-50 shrink-0">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0 mb-10">
          <Beaker className="w-5 h-5 text-white" />
        </div>

        <nav className="flex-1 space-y-4">
          {[
            { id: 'dashboard', icon: LayoutDashboard, tooltip: 'Overview' },
            { id: 'orders', icon: ClipboardList, active: true, tooltip: 'Queue' },
            { id: 'history', icon: History, tooltip: 'Records' },
            { id: 'analytics', icon: Activity, tooltip: 'Stats' }
          ].map(item => (
            <button key={item.id} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all group relative ${item.active ? 'bg-white text-slate-900 shadow-xl shadow-white/10' : 'text-slate-500 hover:bg-slate-900 hover:text-white'}`}>
              <item.icon className="w-4.5 h-4.5" />
              <div className="absolute left-14 bg-slate-900 text-white px-2 py-1 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 pointer-events-none transition-all scale-75 group-hover:scale-100 origin-left z-50 whitespace-nowrap">
                {item.tooltip}
              </div>
            </button>
          ))}
        </nav>

        <button 
          onClick={() => navigate('/')} 
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:bg-red-500/10 hover:text-red-500 transition-all mt-auto"
        >
          <LogOut className="w-4.5 h-4.5" />
        </button>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-slate-50">
        
        {/* Compact Top Header */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40 shrink-0">
          <div className="flex items-center gap-4">
             <div>
                <h2 className="text-sm font-black text-slate-900 tracking-tight leading-none">Order Queue</h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Diagnostic Management</p>
             </div>
             
             <div className="h-6 w-px bg-slate-200 mx-1" />
             
             <div className="flex bg-slate-100 p-0.5 rounded-lg gap-0.5">
               {['all', 'confirmed', 'in_progress', 'completed'].map(f => (
                 <button 
                   key={f}
                   onClick={() => setStatusFilter(f)}
                   className={`px-3 py-1.5 rounded-md text-[9px] uppercase font-black tracking-widest transition-all ${statusFilter === f ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-900'}`}
                 >
                   {f === 'confirmed' ? 'New Orders' : f.replace('_', ' ')}
                 </button>
               ))}
             </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search patient..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-xs font-bold"
              />
            </div>
            <button onClick={fetchOrders} className="p-1.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 transition-all">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Scrollable Order Feed */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col gap-6">
            
            {/* Minimal Stat Banner */}
            <div className="grid grid-cols-4 gap-3">
               {[
                 { label: 'Pending', val: stats.pending, color: 'bg-amber-500' },
                 { label: 'Processing', val: stats.processing, color: 'bg-blue-500' },
                 { label: 'Completed', val: stats.completed, color: 'bg-emerald-500' },
                 { label: 'Efficiency', val: '98%', color: 'bg-indigo-600' }
               ].map((s, idx) => (
                 <div key={idx} className="bg-white px-4 py-3 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between overflow-hidden relative">
                    <div className="relative z-10">
                       <p className="text-[8px] uppercase font-black text-slate-400 tracking-widest mb-0.5">{s.label}</p>
                       <p className="text-sm font-black text-slate-900">{s.val}</p>
                    </div>
                    <div className={`w-1 h-full absolute left-0 top-0 ${s.color}`} />
                 </div>
               ))}
            </div>

            {/* Orders Feed */}
            <div className="space-y-2.5">
              {filteredOrders.map(order => {
                const config = getStatusConfig(order.status);
                const isSelected = selectedOrder?.id === order.id;
                
                const doneCount = order.lab_order_items?.filter(item => item.status === 'completed').length || 0;
                const totalCount = order.lab_order_items?.length || 0;
                const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

                return (
                  <button 
                    key={order.id} 
                    onClick={() => setSelectedOrder(order)}
                    className={`text-left w-full group transition-all ${isSelected ? 'z-10' : ''}`}
                  >
                    <div className={`p-4 bg-white rounded-2xl border flex items-center gap-5 shadow-sm transition-all ${isSelected ? 'border-indigo-600 border-2 bg-indigo-50/10' : 'border-slate-100 hover:border-slate-200'}`}>
                      
                      <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shrink-0 font-black text-xs uppercase tracking-tighter">
                        {order.patient?.first_name?.charAt(0)}{order.patient?.last_name?.charAt(0)}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2">
                           <span className="font-black text-slate-900 text-sm truncate">{order.patient?.first_name} {order.patient?.last_name}</span>
                           <span className="text-[8px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md uppercase tracking-widest">{order.order_number}</span>
                           {order.priority === 'urgent' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />}
                        </div>
                        
                        <div className="flex items-center gap-3">
                           <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                             <div 
                                className={`h-full transition-all duration-700 rounded-full ${order.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-600'}`} 
                                style={{ width: `${progress}%` }} 
                             />
                           </div>
                           <span className="text-[9px] font-bold text-slate-400 tracking-tighter whitespace-nowrap">
                             <span className="text-slate-900">{doneCount}</span>/{totalCount} <span className="uppercase text-[7px] ml-0.5">Tests</span>
                           </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 shrink-0">
                         <div className={`px-2.5 py-1 rounded-xl border text-[8px] uppercase font-black tracking-widest flex items-center gap-1.5 ${config.class}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                            {config.label}
                         </div>
                         <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-200'}`} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {filteredOrders.length === 0 && !loading && (
              <div className="py-20 flex flex-col items-center justify-center text-slate-300">
                <FileText className="w-8 h-8 opacity-20 mb-4" />
                <p className="text-xs font-bold uppercase tracking-widest">No orders found</p>
              </div>
            )}
          </div>

          {/* Compact Granular Action Side Panel */}
          <div className={`w-full lg:w-[380px] bg-white border-l border-slate-200 flex flex-col z-30 transition-transform duration-500 fixed lg:relative inset-y-0 right-0 ${selectedOrder ? 'translate-x-0' : 'translate-x-full lg:translate-x-0 shrink-0'}`}>
            {selectedOrder ? (
              <div className="flex-1 flex flex-col h-full relative overflow-hidden">
                
                {/* Header Section */}
                <div className="p-6 border-b border-slate-100 shrink-0 bg-white">
                   <div className="flex justify-between items-center mb-6">
                     <button onClick={() => setSelectedOrder(null)} className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-400">
                       <X className="w-4 h-4" />
                     </button>
                     <span className={`px-2.5 py-1 rounded-lg border text-[8px] uppercase font-black tracking-widest ${getStatusConfig(selectedOrder.status).class}`}>
                        {selectedOrder.status}
                     </span>
                   </div>
                   
                   <div className="flex gap-4 items-center">
                     <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-lg font-black shadow-lg shadow-indigo-100">
                        {selectedOrder.patient?.first_name?.charAt(0)}{selectedOrder.patient?.last_name?.charAt(0)}
                     </div>
                     <div className="min-w-0">
                        <h3 className="text-lg font-black text-slate-900 leading-none truncate">
                          {selectedOrder.patient?.first_name} {selectedOrder.patient?.last_name}
                        </h3>
                        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tight truncate">
                           ID: {selectedOrder.patient?.unique_id} • {selectedOrder.patient?.gender} • {new Date().getFullYear() - new Date(selectedOrder.patient?.date_of_birth).getFullYear()}Y
                        </p>
                     </div>
                   </div>
                </div>

                {/* Tracking & Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar pb-24 bg-slate-50/30">
                  
                  {/* Progress Card */}
                  <div className="bg-white rounded-xl p-4 flex items-center justify-between border border-slate-200 shadow-sm">
                     <div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Processing Status</p>
                        <h4 className="text-xl font-black text-slate-900">
                           {selectedOrderDetails?.items?.filter(i => i.result_file_path).length || 0}
                           <span className="text-slate-300 mx-2">/</span> 
                           {selectedOrderDetails?.items?.length || 0}
                           <span className="text-[10px] text-slate-400 ml-2 font-bold uppercase tracking-widest">Done</span>
                        </h4>
                     </div>
                     <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <Activity className="w-5 h-5" />
                     </div>
                  </div>

                  {/* Test List */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Prescribed Tests</p>
                    
                    {detailsLoading ? (
                      <div className="space-y-2">
                        {[1, 2].map(i => <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-xl" />)}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedOrderDetails?.items?.map(item => {
                          const isDone = !!item.result_file_path;
                          const isUploadingThis = uploadingItem?.id === item.id;

                          return (
                            <div key={item.id} className={`p-4 bg-white rounded-xl border transition-all ${isDone ? 'border-emerald-100 bg-emerald-50/10' : isUploadingThis ? 'border-indigo-600 ring-2 ring-indigo-50' : 'border-slate-200'}`}>
                               <div className="flex justify-between items-start mb-3">
                                  <div className="flex gap-3 items-start min-w-0">
                                     <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isDone ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                        {isDone ? <Check className="w-4 h-4" /> : <Beaker className="w-4 h-4" />}
                                     </div>
                                     <div className="min-w-0">
                                        <h5 className="font-bold text-slate-900 text-[13px] leading-tight mb-0.5 truncate">{item.test_name}</h5>
                                        <p className="text-[10px] font-semibold text-slate-400 truncate">{item.test_code}</p>
                                     </div>
                                  </div>
                                  {!isDone && <span className="text-[8px] font-bold bg-amber-100/50 text-amber-600 px-2 py-0.5 rounded uppercase tracking-wider">Pending</span>}
                               </div>

                               {!isDone ? (
                                  <div className="relative">
                                     <input 
                                        type="file" 
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        onChange={(e) => handleFileSelect(item, e.target.files[0])}
                                     />
                                     <div className={`w-full py-2 rounded-lg border flex items-center justify-center gap-2 transition-all ${isUploadingThis ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                                        {isUploadingThis && uploadFile ? (
                                          <span className="text-[9px] font-bold truncate px-2">{uploadFile.name}</span>
                                        ) : (
                                          <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider">
                                             <Upload className="w-3.5 h-3.5" /> Attach Result
                                          </div>
                                        )}
                                     </div>
                                  </div>
                               ) : (
                                 <div className="flex items-center justify-between p-2 bg-emerald-50/50 rounded-lg border border-emerald-100/50">
                                    <div className="flex items-center gap-2 min-w-0">
                                       <FileText className="w-3 h-3 text-emerald-600 shrink-0" />
                                       <span className="text-[9px] font-bold text-emerald-700 truncate">{item.result_file_name}</span>
                                    </div>
                                    <button className="text-[9px] font-black text-emerald-600 uppercase hover:underline shrink-0 ml-2">View</button>
                                 </div>
                               )}

                               {isUploadingThis && uploadFile && (
                                  <div className="mt-3 flex gap-2">
                                     <button 
                                        onClick={() => handleUploadItem(item.id)}
                                        disabled={uploading}
                                        className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-[10px] font-black uppercase tracking-widest disabled:opacity-50 shadow-lg shadow-indigo-600/20"
                                     >
                                        {uploading ? 'Uploading...' : 'Upload'}
                                     </button>
                                     <button 
                                        onClick={() => { setUploadFile(null); setUploadingItem(null); }}
                                        className="px-3 bg-slate-100 text-slate-500 py-2 rounded-lg"
                                     >
                                        <X className="w-4 h-4" />
                                     </button>
                                  </div>
                               )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Bar Action */}
                <div className="p-6 pt-0 bg-white">
                  {selectedOrder.status === 'pending' && (
                    <button 
                      onClick={() => handleStatusChange(selectedOrder.id, 'in_progress')}
                      className="w-full bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest py-3.5 rounded-2xl shadow-xl transition-all"
                    >
                      Start Analysis
                    </button>
                  )}
                  {selectedOrder.status === 'completed' && (
                    <div className="w-full bg-emerald-500 text-white font-black uppercase text-[9px] tracking-widest py-3.5 rounded-2xl flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4"/> Order Fully Processed
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-50">
                <div className="w-24 h-24 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6 border border-slate-100">
                    <Activity className="w-8 h-8 text-indigo-600 opacity-20" />
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1">Diagnostic Terminal</h3>
                <p className="text-slate-400 text-[10px] font-medium leading-relaxed max-w-[200px]">
                  Select an order item to begin granular result submission.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}} />
    </div>
  );
};

export default DiagnosticDashboard;

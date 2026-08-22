import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { createPortal } from "react-dom";
import { billingApi, walletApi, paymentApi } from "../../lib/api";
import { useDoctor } from "../../hooks/useDoctor";
import { 
  TrendingUp, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  FileText, 
  Plus, 
  Search, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  QrCode,
  DollarSign,
  PieChart,
  Settings as SettingsIcon,
  ChevronRight,
  Filter,
  Save,
  RotateCcw
} from "lucide-react";

const Portal = ({ children }) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    return mounted ? createPortal(children, document.body) : null;
};

const WalletTab = memo(() => {
    const { doctorId } = useDoctor();
    const [activeSubTab, setActiveSubTab] = useState('dashboard'); // dashboard, invoices, transactions, settings
    const [billingRecords, setBillingRecords] = useState([]);
    const [billingSummary, setBillingSummary] = useState(null);
    const [walletSummary, setWalletSummary] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [revenueRules, setRevenueRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Filtering States
    const [invoiceFilter, setInvoiceFilter] = useState('all');
    const [transactionFilter, setTransactionFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Form States
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingBill, setEditingBill] = useState(null);
    const [billForm, setBillForm] = useState({
        patient_name: '',
        patient_email: '',
        description: '',
        amount: '',
        due_date: '',
        status: 'pending'
    });

    const [showWithdrawForm, setShowWithdrawForm] = useState(false);
    const [withdrawForm, setWithdrawForm] = useState({
        amount: '',
        payment_method: 'bkash',
        account_details: ''
    });

    const [editingRule, setEditingRule] = useState(null);
    const [ruleForm, setRuleForm] = useState({
        doctor_percentage: '',
        clinic_percentage: '',
        referral_percentage: ''
    });

    const [showQR, setShowQR] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState(null); // { type: 'success'|'fail'|'cancel', tranId: string, amount: string }

    useEffect(() => {
        if (doctorId) {
            fetchInitialData();
            handleUrlParams();
        }
    }, [doctorId]);

    const handleUrlParams = () => {
        const params = new URLSearchParams(window.location.search);
        const status = params.get('status');
        const tranId = params.get('tran_id');
        const amount = params.get('amount');

        if (status) {
            setActiveSubTab('invoices');
            setPaymentStatus({ type: status, tranId, amount });
            // Clean up URL without refreshing
            window.history.replaceState({}, document.title, window.location.pathname);
            // Refresh data to show 'paid' status
            if (status === 'success') {
                fetchInitialData();
            }
        }
    };

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                fetchWalletData(),
                fetchBillingData(),
                fetchTransactions(),
                fetchRules()
            ]);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchWalletData = async () => {
        const response = await walletApi.getWalletSummary(doctorId);
        setWalletSummary(response.data);
    };

    const fetchBillingData = async () => {
        const params = invoiceFilter !== 'all' ? { status: invoiceFilter } : {};
        const [recordsData, summaryData] = await Promise.all([
            billingApi.getAll(doctorId, params),
            billingApi.getSummary(doctorId)
        ]);
        setBillingRecords(recordsData.data || []);
        setBillingSummary(summaryData.data);
    };

    const fetchTransactions = async () => {
        const response = await walletApi.getTransactions(doctorId, { limit: 50 });
        setTransactions(response.data || []);
    };

    const fetchRules = async () => {
        const response = await walletApi.getRules();
        setRevenueRules(response.data || []);
    };

    // --- Handlers ---
    
    const handleMarkAsPaid = async (billingId) => {
        if (!confirm('Mark this billing record as paid? This will trigger revenue split.')) return;
        try {
            await billingApi.markAsPaid(billingId);
            await fetchInitialData();
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    const handleSubmitBill = async (e) => {
        e.preventDefault();
        try {
            const billData = { ...billForm, amount: parseFloat(billForm.amount) };
            if (editingBill) {
                await billingApi.update(editingBill.id, billData);
            } else {
                await billingApi.create(doctorId, billData);
            }
            fetchBillingData();
            setShowCreateForm(false);
            setEditingBill(null);
            setBillForm({
                patient_name: '',
                patient_email: '',
                description: '',
                amount: '',
                due_date: '',
                status: 'pending'
            });
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    const handleWithdraw = async (e) => {
        e.preventDefault();
        try {
            await walletApi.withdraw(doctorId, {
                ...withdrawForm,
                amount: parseFloat(withdrawForm.amount)
            });
            await fetchInitialData();
            setShowWithdrawForm(false);
            alert('Withdrawal request submitted!');
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    const handleUpdateRule = async (e) => {
        e.preventDefault();
        try {
            await walletApi.updateRule(editingRule.id, {
                doctor_percentage: parseFloat(ruleForm.doctor_percentage),
                clinic_percentage: parseFloat(ruleForm.clinic_percentage),
                referral_percentage: parseFloat(ruleForm.referral_percentage)
            });
            fetchRules();
            setEditingRule(null);
            alert('Rule updated successfully!');
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    const handleOnlinePayment = async (record) => {
        try {
            const response = await paymentApi.initiate({
                billing_id: record.id,
                amount: record.amount,
                patient_name: `${record.patient_first_name} ${record.patient_last_name}`,
                patient_email: record.patient_email,
                patient_phone: record.patient_phone
            });
            if (response.success && response.url) {
                window.location.href = response.url;
            } else {
                alert('Payment initiation failed: ' + response.message);
            }
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    // --- Filtered Data ---

    const filteredInvoices = useMemo(() => {
        return billingRecords.filter(record => {
            const matchesSearch = !searchTerm ||
                `${record.patient_first_name} ${record.patient_last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                record.patient_email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = invoiceFilter === 'all' || record.status === invoiceFilter;
            return matchesSearch && matchesFilter;
        });
    }, [billingRecords, searchTerm, invoiceFilter]);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            const matchesFilter = transactionFilter === 'all' || tx.type === transactionFilter;
            const matchesSearch = !searchTerm || tx.description.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesFilter && matchesSearch;
        });
    }, [transactions, transactionFilter, searchTerm]);

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'paid': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'overdue': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
            default: return 'bg-muted text-muted-foreground border-border';
        }
    };

    if (loading && !walletSummary) {
        return (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-muted-foreground animate-pulse font-medium">Syncing Wallet...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
                        <Wallet className="w-8 h-8 text-indigo-500" />
                        Wallet                        <span className="ml-2 px-1.5 py-0.5 bg-indigo-500/10 text-indigo-500 text-[10px] rounded-md border border-indigo-500/20">V2</span>
                    </h1>
                    <p className="text-sm text-muted-foreground font-medium mt-1">Check your earnings and daily income here.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setShowWithdrawForm(true)}
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                    >
                        <ArrowUpRight className="w-4 h-4" />
                        Withdraw
                    </button>
                    <button 
                        onClick={() => { setEditingBill(null); setShowCreateForm(true); }}
                        className="px-6 py-2.5 bg-card border border-border text-foreground rounded-xl font-bold text-xs hover:bg-muted transition-all active:scale-95 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        New Invoice
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                 <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-2xl shadow-indigo-600/30 group hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500"><Wallet size={120} /></div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Balance</p>
                        <h2 className="text-4xl font-black">৳{parseFloat(walletSummary?.balance || 0).toLocaleString()}</h2>
                        <div className="flex items-center gap-2 mt-4 text-[10px] font-bold bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-md">
                            <TrendingUp className="w-3 h-3" /> Monthly Target Met
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-3xl p-6 group hover:border-indigo-500/30 transition-all duration-300">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4"><TrendingUp className="w-5 h-5 text-emerald-500" /></div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Earned Today</p>
                    <h2 className="text-2xl font-black text-foreground">৳{parseFloat(walletSummary?.today_earnings || 0).toLocaleString()}</h2>
                    <p className="text-[10px] font-medium text-emerald-500 mt-1">Automatic profit sharing</p>
                </div>

                <div className="bg-card border border-border rounded-3xl p-6 group hover:border-indigo-500/30 transition-all duration-300">
                    <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center mb-4"><Clock className="w-5 h-5 text-amber-500" /></div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Money Pending</p>
                    <h2 className="text-2xl font-black text-foreground">৳{parseFloat(billingSummary?.total_pending || 0).toLocaleString()}</h2>
                    <p className="text-[10px] font-medium text-muted-foreground/60 mt-1">Waiting for patients to pay</p>
                </div>

                <div className="bg-card border border-border rounded-3xl p-6 group hover:border-indigo-500/30 transition-all duration-300">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-4"><DollarSign className="w-5 h-5 text-indigo-500" /></div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Lifetime</p>
                    <h2 className="text-2xl font-black text-foreground">৳{parseFloat(walletSummary?.total_earned || 0).toLocaleString()}</h2>
                    <p className="text-[10px] font-medium text-indigo-500 mt-1">Net Earnings</p>
                </div>
            </div>

            {/* Sub-tabs */}
            <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-2xl w-fit border border-border">
                {[
                    { id: 'dashboard', label: 'Dashboard', icon: PieChart },
                    { id: 'invoices', label: 'Patient Bills', icon: FileText },
                    { id: 'transactions', label: 'Transaction History', icon: Clock },
                    { id: 'settings', label: 'Settings & Rules', icon: SettingsIcon },
                ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeSubTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveSubTab(tab.id); setSearchTerm(''); }}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                isActive 
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                        >
                            <Icon className="w-4 h-4" /> {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            <div className="animate-in slide-in-from-bottom-2 duration-400">
                {activeSubTab === 'dashboard' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            {/* QR Section */}
                            <div className="bg-card border border-border rounded-3xl p-8 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-5"><QrCode size={160} /></div>
                                <div className="relative z-10">
                                    <h3 className="text-xl font-black text-foreground mb-4 flex items-center gap-2"><QrCode className="w-5 h-5 text-indigo-500" /> Payment QR</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed max-w-lg mb-8">Patients can pay you by scanning this. Works with bKash, Nagad, and Rocket.</p>
                                    <div className="flex flex-wrap gap-6 items-center">
                                        <div className="w-32 h-32 bg-white rounded-2xl p-2 border-2 border-dashed border-indigo-500/20"><QrCode size={112} className="text-indigo-500/20" /></div>
                                        <div className="space-y-4 flex-1 min-w-[200px]">
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[10px] font-black uppercase"><span className="text-muted-foreground">App Connection</span><span className="text-emerald-500">Active</span></div>
                                                <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-emerald-500 w-[100%]" /></div>
                                            </div>
                                            <button className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:shadow-xl transition-all">Show QR to Patient</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Table */}
                            <div className="bg-card border border-border rounded-3xl overflow-hidden">
                                <div className="p-6 border-b border-border flex items-center justify-between">
                                    <h3 className="text-lg font-black text-foreground flex items-center gap-2"><TrendingUp className="w-5 h-5 text-indigo-500" /> Recent Activity</h3>
                                    <button onClick={() => setActiveSubTab('transactions')} className="text-xs font-bold text-indigo-500 hover:underline">Full History</button>
                                </div>
                                <div className="divide-y divide-border/50">
                                    {transactions.slice(0, 5).map(tx => (
                                        <div key={tx.id} className="p-4 hover:bg-muted/30 transition-all flex items-center justify-between group">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tx.type === 'credit' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                    {tx.type === 'credit' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-foreground truncate max-w-[200px]">{tx.description}</p>
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{new Date(tx.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-sm font-black ${tx.type === 'credit' ? 'text-emerald-500' : 'text-rose-500'}`}>{tx.type === 'credit' ? '+' : '-'}৳{parseFloat(tx.amount).toLocaleString()}</p>
                                                <span className="text-[9px] font-black text-muted-foreground/50 uppercase">{tx.source}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Stats */}
                        <div className="space-y-6">
                            <div className="bg-card border border-border rounded-3xl p-6">
                                <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-6">Split Distribution</h3>
                                <div className="space-y-6">
                                    {revenueRules.map(rule => (
                                        <div key={rule.id} className="space-y-2">
                                            <div className="flex justify-between text-xs font-bold">
                                                <span className="capitalize text-foreground">{rule.service_type}s</span>
                                                <span className="text-indigo-600">{rule.doctor_percentage}% Share</span>
                                            </div>
                                            <div className="h-2 bg-muted rounded-full overflow-hidden border border-border/50">
                                                <div className="h-full bg-indigo-500" style={{ width: `${rule.doctor_percentage}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-[#0F172A] rounded-3xl p-6 text-white relative overflow-hidden group">
                                <SettingsIcon className="absolute -right-4 -top-4 w-24 h-24 text-white/5 opacity-5 group-hover:rotate-45 transition-transform" />
                                <h3 className="text-xs font-black uppercase tracking-widest mb-6 border-b border-white/10 pb-4">Revenue Config</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center"><CheckCircle2 size={16} className="text-emerald-400" /></div>
                                        <p className="text-[10px] font-bold">Auto-Split Active</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center"><QrCode size={16} className="text-indigo-400" /></div>
                                        <p className="text-[10px] font-bold">QR Settlement Live</p>
                                    </div>
                                </div>
                                <button onClick={() => setActiveSubTab('settings')} className="w-full mt-8 py-3 bg-white text-black rounded-xl font-bold text-xs hover:bg-gray-100 transition-all">Advanced Settings</button>
                            </div>
                        </div>
                    </div>
                )}

                {activeSubTab === 'invoices' && (
                    <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                             <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search patients..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-muted/30 border border-border rounded-2xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                />
                            </div>
                            <div className="flex gap-2">
                                {['all', 'pending', 'paid'].map(st => (
                                    <button
                                        key={st}
                                        onClick={() => setInvoiceFilter(st)}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                            invoiceFilter === st ? 'bg-indigo-600 text-white' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                                        }`}
                                    >
                                        {st}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/30 border-b border-border">
                                    <tr>
                                        <th className="text-left py-4 px-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Patient</th>
                                        <th className="text-left py-4 px-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Amount</th>
                                        <th className="text-center py-4 px-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Status</th>
                                        <th className="text-right py-4 px-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {filteredInvoices.map(record => (
                                        <tr key={record.id} className="hover:bg-muted/10 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-[10px] uppercase">{record.patient_first_name?.charAt(0)}{record.patient_last_name?.charAt(0)}</div>
                                                    <div>
                                                        <p className="text-sm font-bold text-foreground">{record.patient_first_name} {record.patient_last_name}</p>
                                                        <p className="text-[9px] font-black text-muted-foreground uppercase">#{record.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6"><p className="text-sm font-black text-foreground">৳{parseFloat(record.amount).toLocaleString()}</p></td>
                                            <td className="py-4 px-6 text-center">
                                                <span className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg border ${getStatusStyle(record.status)}`}>{record.status}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => setShowQR(record)} className="p-2 hover:bg-indigo-500/10 rounded-lg group" title="Show QR"><QrCode size={15} className="group-hover:text-indigo-500 transition-colors" /></button>
                                                    {record.status === 'pending' && (
                                                        <div className="flex gap-2">
                                                            <button onClick={() => handleOnlinePayment(record)} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-black text-[9px] tracking-widest uppercase hover:bg-indigo-700 transition-all flex items-center gap-1">
                                                                <DollarSign size={10} /> Pay Online
                                                            </button>
                                                            <button onClick={() => handleMarkAsPaid(record.id)} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg font-black text-[9px] tracking-widest uppercase hover:bg-emerald-600 transition-all">Mark Paid</button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeSubTab === 'transactions' && (
                    <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                             <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search history..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-muted/30 border border-border rounded-2xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                />
                            </div>
                            <div className="flex gap-2">
                                {['all', 'credit', 'debit'].map(st => (
                                    <button
                                        key={st}
                                        onClick={() => setTransactionFilter(st)}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                            transactionFilter === st ? 'bg-indigo-600 text-white' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                                        }`}
                                    >
                                        {st}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/30 border-b border-border">
                                    <tr>
                                        <th className="text-left py-4 px-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Description</th>
                                        <th className="text-left py-4 px-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Add/Subtract</th>
                                        <th className="text-left py-4 px-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Amount</th>
                                        <th className="text-right py-4 px-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {filteredTransactions.map(tx => (
                                        <tr key={tx.id} className="hover:bg-muted/10 transition-colors">
                                            <td className="py-4 px-6">
                                                <div>
                                                    <p className="text-sm font-bold text-foreground">{tx.description}</p>
                                                    <p className="text-[9px] font-black text-muted-foreground uppercase">{tx.source}</p>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${tx.type === 'credit' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                                                    {tx.type}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <p className={`text-sm font-black ${tx.type === 'credit' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {tx.type === 'credit' ? '+' : '-'}৳{parseFloat(tx.amount).toLocaleString()}
                                                </p>
                                            </td>
                                            <td className="py-4 px-6 text-right font-bold text-xs text-muted-foreground">
                                                {new Date(tx.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeSubTab === 'settings' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-card border border-border rounded-3xl p-8 space-y-8 shadow-sm">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-black text-foreground flex items-center gap-2"><PieChart className="w-5 h-5 text-indigo-500" /> How you earn</h3>
                                <button onClick={fetchRules} className="p-2 hover:bg-muted rounded-xl transition-all"><RotateCcw size={16} className="text-muted-foreground" /></button>
                            </div>
                            <div className="space-y-6">
                                {revenueRules.map(rule => (
                                    <div key={rule.id} className="p-5 bg-muted/20 border border-border rounded-2xl transition-all hover:bg-muted/30 group">
                                         <div className="flex justify-between items-start mb-6">
                                             <div>
                                                 <h4 className="text-sm font-black text-foreground uppercase tracking-widest">{rule.service_type}s</h4>
                                                 <p className="text-[10px] font-bold text-muted-foreground mt-1">Rules for automatic income split</p>
                                             </div>
                                             <button 
                                                onClick={() => { setEditingRule(rule); setRuleForm({ doctor_percentage: rule.doctor_percentage, clinic_percentage: rule.clinic_percentage, referral_percentage: rule.referral_percentage }); }}
                                                className="p-2 bg-white border border-border rounded-xl text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                             >
                                                 <SettingsIcon size={14} />
                                             </button>
                                         </div>
                                         <div className="grid grid-cols-3 gap-4">
                                             <div className="text-center p-3 bg-white rounded-xl border border-border shadow-sm">
                                                 <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-50 mb-1">Doctor</p>
                                                 <p className="text-lg font-black text-indigo-600">{rule.doctor_percentage}%</p>
                                             </div>
                                             <div className="text-center p-3 bg-white rounded-xl border border-border shadow-sm">
                                                 <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-50 mb-1">Clinic</p>
                                                 <p className="text-lg font-black text-gray-500">{rule.clinic_percentage}%</p>
                                             </div>
                                             <div className="text-center p-3 bg-white rounded-xl border border-border shadow-sm">
                                                 <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-50 mb-1">Referral</p>
                                                 <p className="text-lg font-black text-emerald-500">{rule.referral_percentage}%</p>
                                             </div>
                                         </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-[#0F172A] rounded-3xl p-8 text-white space-y-8 shadow-2xl relative overflow-hidden group">
                             <div className="absolute top-0 right-0 p-8 opacity-5"><Plus size={160} /></div>
                             <div className="relative z-10 space-y-6">
                                <h3 className="text-xl font-black flex items-center gap-2">Income Settings</h3>
                                <p className="text-sm text-gray-400 font-medium leading-relaxed">System-wide rules for how your money is divided and sent to you.</p>
                                <div className="space-y-4">
                                     <div className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                                         <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Weekly Limit</p>
                                         <p className="text-xl font-black">৳1,000,000 <span className="text-[10px] font-bold text-emerald-400 ml-2">Verified</span></p>
                                     </div>
                                     <div className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                                         <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Payment Speed</p>
                                         <p className="text-xl font-black">Instant <span className="text-[10px] font-bold text-indigo-400 ml-2">Automatic</span></p>
                                     </div>
                                </div>
                                <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center font-black">BK</div>
                                        <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center font-black">NG</div>
                                        <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center font-black">RK</div>
                                    </div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">MFS Apps<br/>Active</p>
                                </div>
                             </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Editing Rule Modal */}
             {editingRule && (
                <Portal>
                    <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-300">
                        <div className="bg-card rounded-[2.5rem] p-8 w-full max-w-[400px] border border-border shadow-2xl animate-in zoom-in duration-300">
                            <div className="flex justify-between items-start mb-8 text-center w-full">
                                <div className="flex-1">
                                    <h2 className="text-2xl font-black text-foreground capitalize">Edit {editingRule.service_type} Rule</h2>
                                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">Revenue Percentage Config</p>
                                </div>
                            </div>
                            <form onSubmit={handleUpdateRule} className="space-y-6">
                                <div className="grid grid-cols-1 gap-4">
                                     {['doctor', 'clinic', 'referral'].map(field => (
                                         <div key={field} className="space-y-2">
                                             <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">{field} Percentage (%)</label>
                                             <input
                                                type="number"
                                                value={ruleForm[`${field}_percentage`]}
                                                onChange={(e) => setRuleForm({...ruleForm, [`${field}_percentage`]: e.target.value})}
                                                className="w-full px-4 py-3 bg-muted/40 border border-border rounded-2xl font-black text-foreground focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                                required
                                             />
                                         </div>
                                     ))}
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button onClick={() => setEditingRule(null)} type="button" className="flex-1 py-4 bg-muted text-foreground font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-muted/80 transition-all">Cancel</button>
                                    <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all"><Save className="inline-block w-4 h-4 mr-2" /> Save</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </Portal>
            )}

            {/* QR Modal (Simplified) */}
            {showQR && (
                <Portal>
                    <div className="fixed inset-0 bg-[#0F172A]/90 backdrop-blur-2xl flex items-center justify-center z-[9999] p-4 animate-in zoom-in duration-300">
                        <div className="bg-white rounded-[3rem] p-12 w-full max-w-[420px] shadow-2xl text-center space-y-10">
                            <div className="space-y-2">
                                <h2 className="text-4xl font-black text-black tracking-tighter">Scan to Pay</h2>
                                <p className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.3em] bg-indigo-50 py-2 rounded-xl">Instant Mobile Payment</p>
                            </div>
                            <div className="p-10 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200"><QrCode size={200} className="mx-auto text-black" /></div>
                            <div className="space-y-2">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Payable Amount</p>
                                <h3 className="text-5xl font-black text-black">৳{parseFloat(showQR.amount).toLocaleString()}</h3>
                                <p className="text-[10px] font-black text-gray-300 tracking-widest">INV-#{showQR.id.toString().padStart(6,'0')}</p>
                            </div>
                            <button onClick={() => setShowQR(null)} className="w-full py-5 bg-black text-white rounded-[2rem] font-black tracking-widest uppercase text-xs active:scale-95 transition-all">Close</button>
                        </div>
                    </div>
                </Portal>
            )}

            {/* Other Modals (Reuse logic from previous but clean up) */}
            {showWithdrawForm && (
                <Portal>
                     <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-300">
                        <div className="bg-card rounded-[2.5rem] p-8 w-full max-w-[400px] border border-border shadow-2xl animate-in zoom-in duration-300">
                            <h2 className="text-2xl font-black text-foreground mb-8 text-center italic">Take Money Out</h2>
                            <form onSubmit={handleWithdraw} className="space-y-6">
                                <input type="number" placeholder="৳ How much?" value={withdrawForm.amount} onChange={e=>setWithdrawForm({...withdrawForm, amount: e.target.value})} className="w-full p-4 bg-muted/40 rounded-2xl font-black text-xl text-center border border-border" required />
                                <div className="grid grid-cols-3 gap-2">
                                    {['bkash', 'nagad', 'rocket'].map(m => (
                                        <button key={m} type="button" onClick={()=>setWithdrawForm({...withdrawForm, payment_method: m})} className={`py-3 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${withdrawForm.payment_method === m ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-muted border-border text-muted-foreground'}`}>{m}</button>
                                    ))}
                                </div>
                                <input type="text" placeholder="Mobile Number" value={withdrawForm.account_details} onChange={e=>setWithdrawForm({...withdrawForm, account_details: e.target.value})} className="w-full p-4 bg-muted/40 rounded-2xl font-bold text-xs border border-border" required />
                                <div className="flex gap-4">
                                    <button onClick={()=>setShowWithdrawForm(false)} type="button" className="flex-1 py-4 bg-muted text-foreground font-black text-[11px] uppercase tracking-widest rounded-2xl">Cancel</button>
                                    <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-lg">Confirm</button>
                                </div>
                            </form>
                        </div>
                     </div>
                </Portal>
            )}

            {showCreateForm && (
                <Portal>
                    <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
                        <div className="bg-card rounded-[2.5rem] p-8 w-full max-w-[450px] border border-border shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                            <h2 className="text-2xl font-black text-foreground mb-8 text-center">{editingBill ? 'Modify' : 'New'} Invoice</h2>
                             <form onSubmit={handleSubmitBill} className="space-y-4">
                                <input type="text" placeholder="Patient Name" value={billForm.patient_name} onChange={e=>setBillForm({...billForm, patient_name: e.target.value})} className="w-full p-3.5 bg-muted/40 rounded-2xl border border-border text-xs font-bold" required />
                                <input type="email" placeholder="Patient Email" value={billForm.patient_email} onChange={e=>setBillForm({...billForm, patient_email: e.target.value})} className="w-full p-3.5 bg-muted/40 rounded-2xl border border-border text-xs font-bold" required />
                                <textarea placeholder="Description" value={billForm.description} onChange={e=>setBillForm({...billForm, description: e.target.value})} className="w-full p-3.5 bg-muted/40 rounded-2xl border border-border text-xs font-bold resize-none" rows={3} required />
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="number" placeholder="Amount (৳)" value={billForm.amount} onChange={e=>setBillForm({...billForm, amount: e.target.value})} className="w-full p-3.5 bg-muted/40 rounded-2xl border border-border text-xs font-black" required />
                                    <input type="date" value={billForm.due_date} onChange={e=>setBillForm({...billForm, due_date: e.target.value})} className="w-full p-3.5 bg-muted/40 rounded-2xl border border-border text-xs font-bold invert" required />
                                </div>
                                <div className="flex gap-4 pt-4">
                                     <button onClick={()=>setShowCreateForm(false)} type="button" className="flex-1 py-4 bg-muted text-foreground font-black text-[11px] uppercase tracking-widest rounded-2xl">Cancel</button>
                                     <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-lg">Save</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </Portal>
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
            `}</style>
            {/* Payment Status Modal */}
            {paymentStatus && (
                <Portal>
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setPaymentStatus(null)}></div>
                        <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 relative z-10 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300 text-center">
                            {paymentStatus.type === 'success' ? (
                                <>
                                    <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-3 shadow-xl shadow-emerald-500/20">
                                        <CheckCircle2 size={40} className="text-white" />
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900 mb-2">Payment Successful!</h2>
                                    <p className="text-slate-500 text-sm mb-8 font-medium">Your account has been credited instantly.</p>
                                    
                                    <div className="bg-slate-50 rounded-2xl p-6 mb-8 text-left space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Transaction ID</span>
                                            <span className="text-slate-900 font-bold text-xs select-all">{paymentStatus.tranId}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-3 border-t border-slate-200/60">
                                            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Amount Paid</span>
                                            <span className="text-emerald-600 font-black text-xl">৳{parseFloat(paymentStatus.amount || 0).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => setPaymentStatus(null)}
                                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-slate-900/10"
                                    >
                                        Back to Wallet
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="w-20 h-20 bg-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 -rotate-3 shadow-xl shadow-rose-500/20">
                                        <AlertCircle size={40} className="text-white" />
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900 mb-2">Payment {paymentStatus.type === 'fail' ? 'Failed' : 'Canceled'}</h2>
                                    <p className="text-slate-500 text-sm mb-8 font-medium">Something went wrong with the transaction.</p>
                                    
                                    <button 
                                        onClick={() => setPaymentStatus(null)}
                                        className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-600 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-rose-500/10"
                                    >
                                        Try Again
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </Portal>
            )}
        </div>
    );
});

export default WalletTab;

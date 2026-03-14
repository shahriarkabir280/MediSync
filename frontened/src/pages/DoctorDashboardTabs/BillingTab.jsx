import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { createPortal } from "react-dom";
import { billingApi } from "../../lib/api";
import { useDoctor } from "../../hooks/useDoctor";
import { debounce } from "../../utils/performance";

const Portal = ({ children }) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    return mounted ? createPortal(children, document.body) : null;
};

const BillingTab = memo(() => {
    const { doctorId } = useDoctor();
    const [billingRecords, setBillingRecords] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
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

    // Memoize filtered billing records
    const filteredRecords = useMemo(() => {
        return billingRecords.filter(record => {
            const matchesSearch = !searchTerm ||
                record.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                record.description?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesSearch;
        });
    }, [billingRecords, searchTerm]);

    useEffect(() => {
        if (doctorId) {
            fetchBillingData();
        }
    }, [filter, doctorId]);

    const fetchBillingData = useCallback(async () => {
        if (!doctorId) return;
        try {
            setLoading(true);
            const params = filter !== 'all' ? { status: filter } : {};
            const [recordsData, summaryData] = await Promise.all([
                billingApi.getAll(doctorId, params),
                billingApi.getSummary(doctorId)
            ]);

            setBillingRecords(recordsData.data || []);
            setSummary(summaryData.data);
            setError(null);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching billing data:', err);
        } finally {
            setLoading(false);
        }
    }, [doctorId, filter]);

    const handleMarkAsPaid = async (billingId) => {
        if (!confirm('Mark this billing record as paid?')) return;

        try {
            await billingApi.markAsPaid(billingId);
            await fetchBillingData();
        } catch (err) {
            alert('Error marking as paid: ' + err.message);
        }
    };

    const handleCreateBill = async () => {
        try {
            const billData = {
                patient_name: billForm.patient_name,
                patient_email: billForm.patient_email,
                description: billForm.description,
                amount: parseFloat(billForm.amount),
                due_date: billForm.due_date,
                status: billForm.status
            };

            await billingApi.create(doctorId, billData);
            await fetchBillingData();
            resetForm();
            setShowCreateForm(false);
        } catch (err) {
            alert('Error creating bill: ' + err.message);
        }
    };

    const handleUpdateBill = async () => {
        try {
            const billData = {
                patient_name: billForm.patient_name,
                patient_email: billForm.patient_email,
                description: billForm.description,
                amount: parseFloat(billForm.amount),
                due_date: billForm.due_date,
                status: billForm.status
            };

            await billingApi.update(editingBill.id, billData);
            await fetchBillingData();
            resetForm();
            setEditingBill(null);
            setShowCreateForm(false);
        } catch (err) {
            alert('Error updating bill: ' + err.message);
        }
    };

    const handleEditBill = (bill) => {
        setBillForm({
            patient_name: `${bill.patient_first_name} ${bill.patient_last_name}`,
            patient_email: bill.patient_email,
            description: bill.description,
            amount: bill.amount.toString(),
            due_date: bill.due_date ? bill.due_date.split('T')[0] : '',
            status: bill.status
        });
        setEditingBill(bill);
        setShowCreateForm(true);
    };

    const resetForm = () => {
        setBillForm({
            patient_name: '',
            patient_email: '',
            description: '',
            amount: '',
            due_date: '',
            status: 'pending'
        });
    };

    const handleFormChange = (field, value) => {
        setBillForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editingBill) {
            await handleUpdateBill();
        } else {
            await handleCreateBill();
        }
    };

    const getFilteredRecords = () => {
        return billingRecords.filter(record => {
            const matchesSearch = searchTerm === '' ||
                `${record.patient_first_name} ${record.patient_last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                record.patient_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                record.description.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesFilter = filter === 'all' || record.status === filter;

            return matchesSearch && matchesFilter;
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'paid':
                return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'pending':
                return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'overdue':
                return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
            default:
                return 'bg-muted text-muted-foreground border-border';
        }
    };

    if (loading && !billingRecords.length) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading billing data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-xl font-bold text-foreground">Billing</h1>
                <p className="text-xs text-muted-foreground">Manage billing records and payments.</p>
            </div>

            {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-rose-500 font-medium">{error}</p>
                    <button
                        onClick={fetchBillingData}
                        className="mt-2 text-sm font-bold text-rose-500 underline underline-offset-4 hover:text-rose-600 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-card border border-border rounded-xl p-4 transition-all duration-300">
                        <h4 className="text-[10px] font-semibold text-muted-foreground/60 mb-1">Total records</h4>
                        <p className="text-xl font-semibold text-foreground tracking-tight">{summary.total_records || 0}</p>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-4 transition-all duration-300">
                        <h4 className="text-[10px] font-semibold text-muted-foreground/60 mb-1">Total paid</h4>
                        <p className="text-xl font-semibold text-emerald-500 tracking-tight">
                            ৳{parseFloat(summary.total_paid || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-4 transition-all duration-300">
                        <h4 className="text-[10px] font-semibold text-muted-foreground/60 mb-1">Pending</h4>
                        <p className="text-xl font-semibold text-amber-500 tracking-tight">
                            ৳{parseFloat(summary.total_pending || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-4 transition-all duration-300">
                        <h4 className="text-[10px] font-semibold text-muted-foreground/60 mb-1">Overdue</h4>
                        <p className="text-xl font-semibold text-rose-500 tracking-tight">
                            ৳{parseFloat(summary.total_overdue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>
            )}

            {/* Search and Actions Bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="flex-1 max-w-md relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-indigo-500 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search records..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 text-xs font-medium text-foreground transition-all placeholder:text-muted-foreground/40"
                    />
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setEditingBill(null);
                        setShowCreateForm(true);
                    }}
                    className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold text-[11px] hover:bg-indigo-700 transition-all active:scale-95 flex items-center space-x-2"
                >
                    <span className="text-lg leading-none">+</span>
                    <span>Create bill</span>
                </button>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${filter === 'all'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-muted text-muted-foreground border border-border hover:bg-card'
                        }`}
                >
                    All records
                </button>
                <button
                    onClick={() => setFilter('pending')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${filter === 'pending'
                        ? 'bg-amber-500 text-white'
                        : 'bg-muted text-muted-foreground border border-border hover:bg-card'
                        }`}
                >
                    Pending
                </button>
                <button
                    onClick={() => setFilter('paid')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${filter === 'paid'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-muted text-muted-foreground border border-border hover:bg-card'
                        }`}
                >
                    Paid
                </button>
                <button
                    onClick={() => setFilter('overdue')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${filter === 'overdue'
                        ? 'bg-rose-500 text-white'
                        : 'bg-muted text-muted-foreground border border-border hover:bg-card'
                        }`}
                >
                    Overdue
                </button>
            </div>

            {/* Billing Records */}
            <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-foreground tracking-tight">
                        Billing records <span className="text-indigo-500 ml-1.5 opacity-50 text-xs font-medium">{getFilteredRecords().length}</span>
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left py-3 px-3 text-[10px] font-semibold text-muted-foreground/50">Patient</th>
                                <th className="text-left py-3 px-3 text-[10px] font-semibold text-muted-foreground/50">Description</th>
                                <th className="text-left py-3 px-3 text-[10px] font-semibold text-muted-foreground/50">Amount</th>
                                <th className="text-left py-3 px-3 text-[10px] font-semibold text-muted-foreground/50">Due date</th>
                                <th className="text-left py-3 px-3 text-[10px] font-semibold text-muted-foreground/50">Status</th>
                                <th className="text-left py-3 px-3 text-[10px] font-semibold text-muted-foreground/50 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {getFilteredRecords().length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-20 text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <div className="w-16 h-16 bg-muted/50 rounded-xl flex items-center justify-center mb-4">
                                                <svg className="w-8 h-8 text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                            </div>
                                            <div className="max-w-xs mx-auto">
                                                <p className="font-semibold text-lg text-foreground tracking-tight mb-1.5">
                                                    {searchTerm ? 'No matches found' : 'No records yet'}
                                                </p>
                                                <p className="text-sm font-medium leading-relaxed opacity-60">
                                                    {searchTerm ? 'Try adjusting your filters or search keywords' : 'Get started by creating your first billing record using the button above'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                getFilteredRecords().map((record) => (
                                    <tr key={record.id} className="group border-b border-border/50 hover:bg-muted/50 transition-colors">
                                        <td className="py-4 px-3">
                                            <div>
                                                <p className="font-bold text-foreground group-hover:text-indigo-500 transition-colors">
                                                    {record.patient_first_name} {record.patient_last_name}
                                                </p>
                                                <p className="text-xs font-medium text-muted-foreground">
                                                    {record.patient_email}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="py-4 px-3 text-sm text-foreground">
                                            {record.description || 'No description'}
                                        </td>
                                        <td className="py-4 px-3 font-bold text-foreground">
                                            ৳{parseFloat(record.amount).toFixed(2)}
                                        </td>
                                        <td className="py-4 px-3 text-sm text-muted-foreground">
                                            {formatDate(record.due_date)}
                                        </td>
                                        <td className="py-4 px-3">
                                            <span className={`px-3 py-1 text-[10px] font-bold rounded-lg border ${getStatusStyle(record.status)}`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-3">
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    onClick={() => handleEditBill(record)}
                                                    className="px-2.5 py-1 text-[10px] font-bold bg-muted text-muted-foreground border border-border rounded-md hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all font-sans"
                                                >
                                                    Edit
                                                </button>
                                                {record.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleMarkAsPaid(record.id)}
                                                        className="px-2.5 py-1 text-[10px] font-bold bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-all font-sans"
                                                    >
                                                        Mark paid
                                                    </button>
                                                )}
                                            </div>
                                            {record.status === 'paid' && (
                                                <span className="text-[10px] font-bold text-muted-foreground text-right block mt-1 opacity-50 italic">
                                                    Paid on {formatDate(record.payment_date)}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Bill Form Modal */}
            {showCreateForm && (
                <Portal>
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
                        <div className="bg-card rounded-xl p-5 w-full max-w-[380px] mx-4 max-h-[90vh] overflow-y-auto border border-border shadow-2xl animate-in zoom-in duration-200">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h2 className="text-lg font-bold text-foreground tracking-tight">
                                        {editingBill ? 'Edit bill' : 'New bill'}
                                    </h2>
                                    <p className="text-[10px] font-medium text-muted-foreground">Fill in the details below</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowCreateForm(false);
                                        setEditingBill(null);
                                        resetForm();
                                    }}
                                    className="w-7 h-7 flex items-center justify-center bg-muted text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 rounded-full transition-all border border-border"
                                >
                                    <span className="text-lg">×</span>
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-3.5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-semibold text-muted-foreground ml-1">Patient name</label>
                                    <input
                                        type="text"
                                        value={billForm.patient_name}
                                        onChange={(e) => handleFormChange('patient_name', e.target.value)}
                                        placeholder="John Doe"
                                        required
                                        className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs text-foreground transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-semibold text-muted-foreground ml-1">Patient email</label>
                                    <input
                                        type="email"
                                        value={billForm.patient_email}
                                        onChange={(e) => handleFormChange('patient_email', e.target.value)}
                                        placeholder="john.doe@email.com"
                                        required
                                        className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs text-foreground transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-semibold text-muted-foreground ml-1">Description</label>
                                    <textarea
                                        value={billForm.description}
                                        onChange={(e) => handleFormChange('description', e.target.value)}
                                        placeholder="Consultation details..."
                                        required
                                        rows={2}
                                        className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs text-foreground transition-all resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-semibold text-muted-foreground ml-1">Amount (৳)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={billForm.amount}
                                            onChange={(e) => handleFormChange('amount', e.target.value)}
                                            placeholder="0.00"
                                            required
                                            className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs text-foreground transition-all"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-semibold text-muted-foreground ml-1">Due date</label>
                                        <input
                                            type="date"
                                            value={billForm.due_date}
                                            onChange={(e) => handleFormChange('due_date', e.target.value)}
                                            required
                                            className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs text-foreground transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-semibold text-muted-foreground ml-1">Status</label>
                                    <div className="relative">
                                        <select
                                            value={billForm.status}
                                            onChange={(e) => handleFormChange('status', e.target.value)}
                                            className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold text-foreground transition-all appearance-none cursor-pointer pr-8"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="paid">Paid</option>
                                            <option value="overdue">Overdue</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2.5 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCreateForm(false);
                                            setEditingBill(null);
                                            resetForm();
                                        }}
                                        className="flex-1 px-4 py-2 bg-muted text-muted-foreground font-bold text-[11px] rounded-lg border border-border hover:bg-card transition-all active:scale-95"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-indigo-600 text-white font-bold text-[11px] rounded-lg hover:bg-indigo-700 transition-all active:scale-95"
                                    >
                                        {editingBill ? 'Update bill' : 'Create bill'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </Portal>
            )}
        </div>
    );
});

export default BillingTab;

import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { billingApi } from "../../lib/api";
import { useDoctor } from "../../hooks/useDoctor";
import { debounce } from "../../utils/performance";

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
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'overdue':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
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
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Billing</h1>
                <p className="text-muted-foreground">Manage billing records and payments.</p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600">{error}</p>
                    <button
                        onClick={fetchBillingData}
                        className="mt-2 text-sm text-red-700 underline"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-card border border-border rounded-lg p-4">
                        <h4 className="font-medium text-muted-foreground mb-2">Total Records</h4>
                        <p className="text-2xl font-bold text-foreground">{summary.total_records || 0}</p>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-4">
                        <h4 className="font-medium text-muted-foreground mb-2">Total Paid</h4>
                        <p className="text-2xl font-bold text-emerald-500">
                            ${parseFloat(summary.total_paid || 0).toFixed(2)}
                        </p>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-4">
                        <h4 className="font-medium text-muted-foreground mb-2">Pending</h4>
                        <p className="text-2xl font-bold text-amber-500">
                            ${parseFloat(summary.total_pending || 0).toFixed(2)}
                        </p>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-4">
                        <h4 className="font-medium text-muted-foreground mb-2">Overdue</h4>
                        <p className="text-2xl font-bold text-rose-500">
                            ${parseFloat(summary.total_overdue || 0).toFixed(2)}
                        </p>
                    </div>
                </div>
            )}

            {/* Search and Actions Bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="flex-1 max-w-md">
                    <input
                        type="text"
                        placeholder="Search by patient name, email, or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-foreground transition-all"
                    />
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setEditingBill(null);
                        setShowCreateForm(true);
                    }}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/10 active:scale-95"
                >
                    Create New Bill
                </button>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === 'all'
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                        : 'bg-muted text-muted-foreground border border-border hover:bg-card'
                        }`}
                >
                    All
                </button>
                <button
                    onClick={() => setFilter('pending')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === 'pending'
                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                        : 'bg-muted text-muted-foreground border border-border hover:bg-card'
                        }`}
                >
                    Pending
                </button>
                <button
                    onClick={() => setFilter('paid')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === 'paid'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                        : 'bg-muted text-muted-foreground border border-border hover:bg-card'
                        }`}
                >
                    Paid
                </button>
                <button
                    onClick={() => setFilter('overdue')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === 'overdue'
                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                        : 'bg-muted text-muted-foreground border border-border hover:bg-card'
                        }`}
                >
                    Overdue
                </button>
            </div>

            {/* Billing Records */}
            <div className="bg-card border border-border rounded-[2.5rem] p-8">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-foreground tracking-tight">
                        Billing Records ({getFilteredRecords().length})
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left py-4 px-3 text-xs font-black uppercase tracking-widest text-muted-foreground opacity-50">Patient</th>
                                <th className="text-left py-4 px-3 text-xs font-black uppercase tracking-widest text-muted-foreground opacity-50">Description</th>
                                <th className="text-left py-4 px-3 text-xs font-black uppercase tracking-widest text-muted-foreground opacity-50">Amount</th>
                                <th className="text-left py-4 px-3 text-xs font-black uppercase tracking-widest text-muted-foreground opacity-50">Due Date</th>
                                <th className="text-left py-4 px-3 text-xs font-black uppercase tracking-widest text-muted-foreground opacity-50">Status</th>
                                <th className="text-left py-4 px-3 text-xs font-black uppercase tracking-widest text-muted-foreground opacity-50 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {getFilteredRecords().length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-8 text-muted-foreground">
                                        {searchTerm ? 'No billing records match your search' : 'No billing records found'}
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
                                            ${parseFloat(record.amount).toFixed(2)}
                                        </td>
                                        <td className="py-4 px-3 text-sm text-muted-foreground">
                                            {formatDate(record.due_date)}
                                        </td>
                                        <td className="py-4 px-3">
                                            <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${getStatusStyle(record.status).replace('bg-', 'bg-opacity-10 border-').replace('text-', 'text-')}`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-3">
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    onClick={() => handleEditBill(record)}
                                                    className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-muted text-muted-foreground border border-border rounded-lg hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all"
                                                >
                                                    Edit
                                                </button>
                                                {record.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleMarkAsPaid(record.id)}
                                                        className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                                                    >
                                                        Mark Paid
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
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-[2rem] p-8 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto border border-border shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-foreground tracking-tight">
                                    {editingBill ? 'Edit Bill' : 'New Bill'}
                                </h2>
                                <p className="text-xs font-medium text-muted-foreground mt-1">Fill in the details below</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowCreateForm(false);
                                    setEditingBill(null);
                                    resetForm();
                                }}
                                className="w-10 h-10 flex items-center justify-center bg-muted text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 rounded-full transition-all border border-border"
                            >
                                <span className="text-2xl">×</span>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Patient Name</label>
                                <input
                                    type="text"
                                    value={billForm.patient_name}
                                    onChange={(e) => handleFormChange('patient_name', e.target.value)}
                                    placeholder="John Doe"
                                    required
                                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-foreground transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Patient Email</label>
                                <input
                                    type="email"
                                    value={billForm.patient_email}
                                    onChange={(e) => handleFormChange('patient_email', e.target.value)}
                                    placeholder="john.doe@email.com"
                                    required
                                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-foreground transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Description</label>
                                <textarea
                                    value={billForm.description}
                                    onChange={(e) => handleFormChange('description', e.target.value)}
                                    placeholder="Consultation, treatment, etc..."
                                    required
                                    rows={3}
                                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-foreground transition-all resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Amount ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={billForm.amount}
                                        onChange={(e) => handleFormChange('amount', e.target.value)}
                                        placeholder="0.00"
                                        required
                                        className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-foreground transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Due Date</label>
                                    <input
                                        type="date"
                                        value={billForm.due_date}
                                        onChange={(e) => handleFormChange('due_date', e.target.value)}
                                        required
                                        className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-foreground transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Status</label>
                                <select
                                    value={billForm.status}
                                    onChange={(e) => handleFormChange('status', e.target.value)}
                                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-foreground transition-all appearance-none cursor-pointer"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="paid">Paid</option>
                                    <option value="overdue">Overdue</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateForm(false);
                                        setEditingBill(null);
                                        resetForm();
                                    }}
                                    className="flex-1 px-4 py-3 bg-muted text-muted-foreground font-bold rounded-xl border border-border hover:bg-card transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95"
                                >
                                    {editingBill ? 'Update Bill' : 'Create Bill'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
});

export default BillingTab;

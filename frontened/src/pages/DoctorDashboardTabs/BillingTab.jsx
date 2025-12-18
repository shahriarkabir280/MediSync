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
                        <p className="text-2xl font-bold">{summary.total_records || 0}</p>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-4">
                        <h4 className="font-medium text-muted-foreground mb-2">Total Paid</h4>
                        <p className="text-2xl font-bold text-green-600">
                            ${parseFloat(summary.total_paid || 0).toFixed(2)}
                        </p>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-4">
                        <h4 className="font-medium text-muted-foreground mb-2">Pending</h4>
                        <p className="text-2xl font-bold text-yellow-600">
                            ${parseFloat(summary.total_pending || 0).toFixed(2)}
                        </p>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-4">
                        <h4 className="font-medium text-muted-foreground mb-2">Overdue</h4>
                        <p className="text-2xl font-bold text-red-600">
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
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setEditingBill(null);
                        setShowCreateForm(true);
                    }}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                    Create New Bill
                </button>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-md transition-colors ${
                        filter === 'all' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'border border-border hover:bg-accent'
                    }`}
                >
                    All
                </button>
                <button
                    onClick={() => setFilter('pending')}
                    className={`px-4 py-2 rounded-md transition-colors ${
                        filter === 'pending' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'border border-border hover:bg-accent'
                    }`}
                >
                    Pending
                </button>
                <button
                    onClick={() => setFilter('paid')}
                    className={`px-4 py-2 rounded-md transition-colors ${
                        filter === 'paid' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'border border-border hover:bg-accent'
                    }`}
                >
                    Paid
                </button>
                <button
                    onClick={() => setFilter('overdue')}
                    className={`px-4 py-2 rounded-md transition-colors ${
                        filter === 'overdue' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'border border-border hover:bg-accent'
                    }`}
                >
                    Overdue
                </button>
            </div>
            
            {/* Billing Records */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                      Billing Records ({getFilteredRecords().length})
                  </h3>
              </div>
              
              <div className="overflow-x-auto">
                  <table className="w-full">
                      <thead>
                          <tr className="border-b border-border">
                              <th className="text-left p-3 font-medium">Patient</th>
                              <th className="text-left p-3 font-medium">Description</th>
                              <th className="text-left p-3 font-medium">Amount</th>
                              <th className="text-left p-3 font-medium">Due Date</th>
                              <th className="text-left p-3 font-medium">Status</th>
                              <th className="text-left p-3 font-medium">Actions</th>
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
                                  <tr key={record.id} className="border-b border-border hover:bg-accent/50">
                                      <td className="p-3">
                                          <div>
                                              <p className="font-medium">
                                                  {record.patient_first_name} {record.patient_last_name}
                                              </p>
                                              <p className="text-sm text-muted-foreground">
                                                  {record.patient_email}
                                              </p>
                                          </div>
                                      </td>
                                      <td className="p-3">
                                          {record.description || 'No description'}
                                      </td>
                                      <td className="p-3 font-semibold">
                                          ${parseFloat(record.amount).toFixed(2)}
                                      </td>
                                      <td className="p-3">
                                          {formatDate(record.due_date)}
                                      </td>
                                      <td className="p-3">
                                          <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusStyle(record.status)}`}>
                                              {record.status}
                                          </span>
                                      </td>
                                      <td className="p-3">
                                          <div className="flex gap-2 flex-wrap">
                                              <button
                                                  onClick={() => handleEditBill(record)}
                                                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                              >
                                                  Edit
                                              </button>
                                              {record.status === 'pending' && (
                                                  <button
                                                      onClick={() => handleMarkAsPaid(record.id)}
                                                      className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                                  >
                                                      Mark Paid
                                                  </button>
                                              )}
                                          </div>
                                          {record.status === 'paid' && (
                                              <span className="text-xs text-muted-foreground block mt-1">
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">
                                {editingBill ? 'Edit Billing Record' : 'Create New Billing Record'}
                        </h2>
                        <button
                            onClick={() => {
                                setShowCreateForm(false);
                                setEditingBill(null);
                                resetForm();
                            }}
                            className="text-gray-500 hover:text-gray-700 text-2xl"
                        >
                            ×
                        </button>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Patient Name</label>
                            <input
                                type="text"
                                value={billForm.patient_name}
                                onChange={(e) => handleFormChange('patient_name', e.target.value)}
                                placeholder="John Doe"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-1">Patient Email</label>
                            <input
                                type="email"
                                value={billForm.patient_email}
                                onChange={(e) => handleFormChange('patient_email', e.target.value)}
                                placeholder="john.doe@email.com"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <textarea
                                value={billForm.description}
                                onChange={(e) => handleFormChange('description', e.target.value)}
                                placeholder="Consultation, treatment, etc..."
                                required
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-1">Amount ($)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={billForm.amount}
                                onChange={(e) => handleFormChange('amount', e.target.value)}
                                placeholder="100.00"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-1">Due Date</label>
                            <input
                                type="date"
                                value={billForm.due_date}
                                onChange={(e) => handleFormChange('due_date', e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-1">Status</label>
                            <select
                                value={billForm.status}
                                onChange={(e) => handleFormChange('status', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="overdue">Overdue</option>
                            </select>
                        </div>
                        
                        <div className="flex gap-2 pt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCreateForm(false);
                                    setEditingBill(null);
                                    resetForm();
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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
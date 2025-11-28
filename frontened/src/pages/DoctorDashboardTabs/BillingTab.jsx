import React, { useState, useEffect } from "react";
import { billingApi } from "../../lib/api";

const BillingTab = () => {
    const [billingRecords, setBillingRecords] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    
    // TODO: Get this from auth context
    const doctorId = 1;

    useEffect(() => {
        fetchBillingData();
    }, [filter]);

    const fetchBillingData = async () => {
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
    };

    const handleMarkAsPaid = async (billingId) => {
        if (!confirm('Mark this billing record as paid?')) return;
        
        try {
            await billingApi.markAsPaid(billingId);
            await fetchBillingData();
            alert('Billing marked as paid successfully!');
        } catch (err) {
            alert('Error marking as paid: ' + err.message);
        }
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

    return(
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
                      Billing Records ({billingRecords.length})
                  </h3>
                  <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                      Create New Bill
                  </button>
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
                          {billingRecords.length === 0 ? (
                              <tr>
                                  <td colSpan="6" className="text-center py-8 text-muted-foreground">
                                      No billing records found
                                  </td>
                              </tr>
                          ) : (
                              billingRecords.map((record) => (
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
                                          {record.status === 'pending' && (
                                              <button
                                                  onClick={() => handleMarkAsPaid(record.id)}
                                                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                                              >
                                                  Mark as Paid
                                              </button>
                                          )}
                                          {record.status === 'paid' && (
                                              <span className="text-sm text-muted-foreground">
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
        </div>
    );
};
export default BillingTab;
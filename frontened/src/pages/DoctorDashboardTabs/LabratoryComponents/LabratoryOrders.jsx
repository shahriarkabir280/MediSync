import React, { memo } from 'react';
import { Search, Filter, Eye, Clock, ChevronRight, FileText } from "lucide-react";

const OrderRow = memo(({ order, onViewReport }) => {
    return (
        <tr className="group hover:bg-muted/50 transition-colors cursor-default">
            <td className="p-4 border-b border-border/50">
                <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:text-blue-600 transition-colors">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div className="font-semibold text-foreground tracking-tight">#{order.order_number}</div>
                </div>
            </td>
            <td className="p-4 border-b border-border/50">
                <div className="font-medium text-foreground">{order.patient_first_name} {order.patient_last_name}</div>
                <div className="text-[10px] text-muted-foreground uppercase font-semibold">ID: {order.patient_unique_id}</div>
            </td>
            <td className="p-4 border-b border-border/50">
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${order.priority === 'urgent' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                        order.priority === 'high' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            'bg-blue-50 text-blue-600 border-blue-100'
                    }`}>
                    {order.priority}
                </div>
            </td>
            <td className="p-4 border-b border-border/50">
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${order.status === 'completed' ? 'bg-emerald-500 text-white' :
                        order.status === 'urgent' ? 'bg-rose-600 text-white' :
                            order.status === 'pending' ? 'bg-amber-500 text-white' :
                                'bg-blue-600 text-white'
                    }`}>
                    {order.status.replace('_', ' ')}
                </span>
            </td>
            <td className="p-4 border-b border-border/50">
                <span className="text-sm font-semibold text-foreground">{order.test_count} Tests</span>
            </td>
            <td className="p-4 border-b border-border/50">
                <div className="text-sm font-medium text-foreground">{new Date(order.order_date).toLocaleDateString()}</div>
                <div className="text-[10px] text-muted-foreground">{new Date(order.order_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </td>
            <td className="p-4 border-b border-border/50 text-right">
                <div className="flex items-center justify-end space-x-1">
                    <button
                        onClick={() => onViewReport(order.id)}
                        className="p-2 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Report"
                    >
                        <Eye className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => alert(`Review log for ${order.order_number}`)}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                        title="View Logs"
                    >
                        <Clock className="w-5 h-5" />
                    </button>
                </div>
            </td>
        </tr>
    );
});

const LabratoryOrders = memo(({
    searchTerm,
    setSearchTerm,
    handleSearch,
    setShowSearchModal,
    labStats,
    activeFilter,
    handleQuickFilter,
    loading,
    filteredOrders,
    handleViewReport
}) => {
    return (
        <div className="space-y-6">
            {/* Search and Filter Section */}
            <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3 w-full lg:w-auto flex-1">
                        <div className="relative flex-1 max-w-xl">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search orders or patients..."
                                className="w-full pl-10 pr-4 py-2 bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchTerm)}
                            />
                        </div>
                        <button
                            onClick={() => handleSearch(searchTerm)}
                            className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold text-sm shadow-sm active:scale-95"
                        >
                            Search
                        </button>
                    </div>
                    <button
                        onClick={setShowSearchModal}
                        className="px-4 py-2 bg-muted text-foreground rounded-xl hover:bg-muted/80 transition-colors font-semibold text-sm flex items-center justify-center space-x-2 border border-border"
                    >
                        <Filter className="w-4 h-4" />
                        <span>Advanced Search</span>
                    </button>
                </div>

                {/* Quick Filters */}
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mr-2">Filter By:</span>
                    {[
                        { key: 'all', label: 'All Orders', active: 'bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm' },
                        { key: 'urgent', label: `Urgent (${labStats.urgent?.urgent_count || 0})`, active: 'bg-rose-600 text-white shadow-sm' },
                        { key: 'pending', label: 'Pending Signature', active: 'bg-amber-500 text-white shadow-sm' },
                        { key: 'today', label: 'Today', active: 'bg-blue-600 text-white shadow-sm' },
                        { key: 'completed', label: 'Completed', active: 'bg-emerald-600 text-white shadow-sm' }
                    ].map((filter) => (
                        <button
                            key={filter.key}
                            onClick={() => handleQuickFilter(filter.key)}
                            className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${activeFilter === filter.key
                                ? filter.active + ' border-transparent'
                                : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Lab Orders Table */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border bg-muted/20">
                    <div>
                        <h3 className="text-lg font-bold text-foreground">Order Registry</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                            {loading ? 'Refreshing data...' : `${filteredOrders.length} orders found`}
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-muted/50 border-b border-border">
                                <th className="text-left p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Order #</th>
                                <th className="text-left p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Patient</th>
                                <th className="text-left p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Priority</th>
                                <th className="text-left p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                                <th className="text-left p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tests</th>
                                <th className="text-left p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Date</th>
                                <th className="text-right p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="text-center p-20">
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-sm font-medium text-muted-foreground">Loading orders...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center p-20 text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                            <Search className="w-8 h-8" />
                                            <div>
                                                <p className="font-semibold text-foreground">No orders found</p>
                                                <p className="text-xs">Adjust your search or filters to see more results.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <OrderRow key={order.id} order={order} onViewReport={handleViewReport} />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
});

export default LabratoryOrders;
export { OrderRow };

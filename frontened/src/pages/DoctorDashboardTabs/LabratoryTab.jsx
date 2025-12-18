import {useState, useEffect, useCallback, useMemo, memo} from "react";
import { User, FlaskConical, Plus, Upload, Search, Filter, Eye, Calendar, Clock, AlertTriangle } from "lucide-react";
import { debounce } from "../../utils/performance";

const LabratoryTab = memo(() => {
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [patients, setPatients] = useState([]);
    const [patientSearchTerm, setPatientSearchTerm] = useState('');
    const [labStats, setLabStats] = useState({
        today: { total_today: 0, pending_today: 0, processing_today: 0, completed_today: 0 },
        urgent: { urgent_count: 0 },
        unreviewed: { unreviewed_count: 0 }
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [labCategories, setLabCategories] = useState([]);
    const [labTests, setLabTests] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showNewOrderModal, setShowNewOrderModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [showSearchModal, setShowSearchModal] = useState(false);

    // Fetch lab statistics on component mount
    useEffect(() => {
        fetchLabStats();
        fetchRecentOrders();
        fetchLabCategories();
        fetchPatients();
    }, []);

    const fetchLabStats = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/lab/stats');
            const result = await response.json();
            if (result.success) {
                setLabStats(result.data);
            }
        } catch (error) {
            console.error('Error fetching lab stats:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchRecentOrders = useCallback(async () => {
        try {
            const response = await fetch('/api/lab/recent?limit=10');
            const result = await response.json();
            if (result.success) {
                setRecentOrders(result.data);
                setFilteredOrders(result.data);
            }
        } catch (error) {
            console.error('Error fetching recent orders:', error);
        }
    }, []);

    const fetchLabCategories = useCallback(async () => {
        try {
            const response = await fetch('/api/lab/categories');
            const result = await response.json();
            if (result.success) {
                setLabCategories(result.data);
            }
        } catch (error) {
            console.error('Error fetching lab categories:', error);
        }
    }, []);

    const fetchPatients = useCallback(async (searchTerm = '') => {
        try {
            const url = searchTerm ? 
                `/api/lab/patients?search=${encodeURIComponent(searchTerm)}&limit=10` : 
                '/api/lab/patients?limit=10';
            const response = await fetch(url);
            const result = await response.json();
            if (result.success) {
                setPatients(result.data);
            }
        } catch (error) {
            console.error('Error fetching patients:', error);
        }
    }, []);

    // Debounced search for better performance
    const debouncedFetchPatients = useMemo(
        () => debounce(fetchPatients, 500),
        [fetchPatients]
    );

    const handleNewTestOrder = () => {
        setShowNewOrderModal(true);
    };

    const handleBulkActions = () => {
        alert('Bulk actions functionality - to be implemented');
    };

    const handleSearch = useCallback(async (term) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/lab/search?search=${encodeURIComponent(term)}&limit=20`);
            const result = await response.json();
            if (result.success) {
                setFilteredOrders(result.data);
            }
        } catch (error) {
            console.error('Error searching orders:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleQuickFilter = async (filterType) => {
        try {
            setLoading(true);
            setActiveFilter(filterType);
            let endpoint = '/api/lab/filter?';
            
            switch(filterType) {
                case 'urgent':
                    endpoint += 'filter_type=urgent';
                    break;
                case 'pending':
                    endpoint += 'filter_type=pending';
                    break;
                case 'completed':
                    endpoint += 'filter_type=completed';
                    break;
                case 'today':
                    endpoint += 'filter_type=today';
                    break;
                default:
                    // For 'all', just fetch recent orders
                    const response = await fetch('/api/lab/recent?limit=20');
                    const result = await response.json();
                    if (result.success) {
                        setFilteredOrders(result.data);
                    }
                    return;
            }

            const response = await fetch(endpoint);
            const result = await response.json();
            if (result.success) {
                setFilteredOrders(result.data);
            }
        } catch (error) {
            console.error('Error filtering orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewReport = async (orderId) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/lab/report/${orderId}`);
            const result = await response.json();
            if (result.success) {
                setSelectedReport(result.data);
                setShowReportModal(true);
            }
        } catch (error) {
            console.error('Error fetching report:', error);
            alert('Error fetching report');
        } finally {
            setLoading(false);
        }
    };

    const getPriorityColor = (priority) => {
        switch(priority) {
            case 'urgent': return 'text-red-600 bg-red-50';
            case 'high': return 'text-orange-600 bg-orange-50';
            case 'normal': return 'text-blue-600 bg-blue-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'pending': return 'text-yellow-600 bg-yellow-50';
            case 'in_progress': return 'text-blue-600 bg-blue-50';
            case 'completed': return 'text-green-600 bg-green-50';
            case 'urgent': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    // Initialize filters on component mount
    useEffect(() => {
        if (recentOrders.length > 0 && filteredOrders.length === 0) {
            setFilteredOrders(recentOrders);
        }
    }, [recentOrders]);
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Laboratory Management</h1>
                <p className="text-muted-foreground">Comprehensive patient lab reports, prescriptions, and clinical decision support.</p>
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={handleNewTestOrder}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Test Order</span>
                </button>
                <button 
                  onClick={handleBulkActions}
                  className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Bulk Actions</span>
                </button>
              </div>
            </div>

            {/* Laboratory Statistics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-muted-foreground">Today's Reports</h4>
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                </div>
                <p className="text-2xl font-bold mb-1">{loading ? '...' : labStats.today?.total_today || 0}</p>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-red-600">{labStats.today?.pending_today || 0} Pending</span>
                  <span className="text-yellow-600">{labStats.today?.processing_today || 0} Processing</span>
                  <span className="text-green-600">{labStats.today?.completed_today || 0} Done</span>
                </div>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-muted-foreground">Urgent Reports</h4>
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                </div>
                <p className="text-2xl font-bold mb-1 text-red-600">{loading ? '...' : labStats.urgent?.urgent_count || 0}</p>
                <p className="text-sm text-muted-foreground">Require immediate attention</p>
              </div>

              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-muted-foreground">Unreviewed</h4>
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                </div>
                <p className="text-2xl font-bold mb-1 text-orange-600">{loading ? '...' : labStats.unreviewed?.unreviewed_count || 0}</p>
                <p className="text-sm text-muted-foreground">Awaiting doctor review</p>
              </div>

              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-muted-foreground">This Week</h4>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <p className="text-2xl font-bold mb-1">156</p>
                <p className="text-sm text-green-600">+23% from last week</p>
              </div>
            </div>

            {/* Search and Filter Section */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                <div className="flex items-center space-x-3">
                  <div className="relative flex-1 lg:w-80">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search orders, patients, order numbers..."
                      className="w-full pl-10 pr-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchTerm)}
                    />
                  </div>
                  <button
                    onClick={() => handleSearch(searchTerm)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center space-x-2"
                  >
                    <Search className="w-4 h-4" />
                    <span>Search</span>
                  </button>
                </div>
                <button
                  onClick={() => setShowSearchModal(true)}
                  className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors flex items-center space-x-2"
                >
                  <Filter className="w-4 h-4" />
                  <span>Advanced Search</span>
                </button>
              </div>

              {/* Quick Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">Quick Filters:</span>
                {[
                  { key: 'all', label: 'All Orders', color: 'bg-gray-100 text-gray-800 border-gray-200' },
                  { key: 'urgent', label: `Urgent (${labStats.urgent?.urgent_count || 0})`, color: 'bg-red-100 text-red-800 border-red-200' },
                  { key: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
                  { key: 'today', label: 'Today', color: 'bg-blue-100 text-blue-800 border-blue-200' },
                  { key: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800 border-green-200' }
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => handleQuickFilter(filter.key)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all hover:shadow-sm ${
                      activeFilter === filter.key ? filter.color + ' ring-2 ring-offset-1 ring-primary' : filter.color
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lab Orders Table */}
            <div className="bg-card border border-border rounded-lg">
              <div className="p-4 border-b border-border">
                <h3 className="text-lg font-semibold">
                  Lab Orders {activeFilter !== 'all' && `(${activeFilter})`}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {loading ? 'Loading...' : `${filteredOrders.length} orders found${filteredOrders.length > 5 ? ' - scroll to see more' : ''}`}
                </p>
              </div>
              
              <div className="max-h-96 overflow-y-auto scrollbar-thin border-t border-border">
                <table className="w-full">
                  <thead className="bg-muted/50 sticky top-0 z-10">
                    <tr>
                      <th className="text-left p-4 font-medium">Order #</th>
                      <th className="text-left p-4 font-medium">Patient</th>
                      <th className="text-left p-4 font-medium">Priority</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Tests</th>
                      <th className="text-left p-4 font-medium">Date</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="text-center p-8">
                          <div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                            <span>Loading orders...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center p-8 text-muted-foreground">
                          No lab orders found
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr key={order.id} className="border-b border-border hover:bg-muted/20">
                          <td className="p-4">
                            <div className="font-medium">{order.order_number}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-32">{order.clinical_notes}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-medium">{order.patient_first_name} {order.patient_last_name}</div>
                            <div className="text-xs text-muted-foreground">{order.patient_unique_id}</div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(order.priority)}`}>
                              {order.priority}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                              {order.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="p-4">{order.test_count} tests</td>
                          <td className="p-4">
                            <div className="text-sm">{new Date(order.order_date).toLocaleDateString()}</div>
                            <div className="text-xs text-muted-foreground">{new Date(order.order_date).toLocaleTimeString()}</div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleViewReport(order.id)}
                                className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                                title="View Report"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => alert(`Edit order ${order.order_number} - to be implemented`)}
                                className="p-1 text-green-600 hover:text-green-800 transition-colors"
                                title="Edit Order"
                              >
                                <Clock className="w-4 h-4" />
                              </button>
                              {order.priority === 'urgent' && (
                                <AlertTriangle className="w-4 h-4 text-red-500" title="Urgent" />
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Patient Selection */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Patient Selection & Search</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <input 
                    type="text" 
                    placeholder="Search by patient name, ID, or phone..."
                    className="w-full p-3 border border-input rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={patientSearchTerm}
                    onChange={(e) => {
                      setPatientSearchTerm(e.target.value);
                      fetchPatients(e.target.value);
                    }}
                  />
                </div>
                <div>
                  <span className="block text-sm text-muted-foreground mb-2">Found: {patients.length} patients</span>
                  <div className="text-xs text-muted-foreground">Search by name, ID, or phone number</div>
                </div>
                <div>
                  {/* Empty for layout */}
                </div>
              </div>
              
              {/* Patient List */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-sm text-muted-foreground">AVAILABLE PATIENTS</h4>
                  <span className="text-xs text-blue-600 font-medium">
                    {patients.length} patients found{patients.length > 3 ? ' - scroll to see more' : ''}
                  </span>
                </div>
                <div className="max-h-80 overflow-y-auto space-y-3 pr-2 scrollbar-thin border border-border rounded-lg p-3 bg-card/50">
                {patients.map((patient) => (
                  <div 
                    key={patient.id} 
                    className={`flex items-center justify-between p-4 border border-border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedPatient?.id === patient.id ? 'bg-accent border-primary shadow-md' : 'hover:bg-accent/50'
                    }`}
                    onClick={() => setSelectedPatient(patient)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-semibold">{patient.first_name} {patient.last_name}</p>
                          <span className="text-xs px-2 py-1 rounded-full border font-medium bg-blue-100 text-blue-800 border-blue-300">
                            Available
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">ID: {patient.unique_id} • {patient.gender} • {patient.phone || 'No phone'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                        Select Patient
                      </button>
                    </div>
                  </div>
                ))}
                {patients.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No patients found. Try a different search term.</p>
                  </div>
                )}
                </div>
            </div>

            {selectedPatient && (
              <>
                {/* Enhanced Patient Overview */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-primary-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className="text-xl font-bold">{selectedPatient.name}</h3>
                          <span className={`text-xs px-3 py-1 rounded-full border font-medium ${selectedPatient.statusColor}`}>
                            {selectedPatient.status}
                          </span>
                        </div>
                        <p className="text-muted-foreground mb-2">Patient ID: {selectedPatient.id} • Age: {selectedPatient.age}</p>
                        <div className="flex items-center space-x-6 text-sm">
                          <span className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Active Patient</span>
                          </span>
                          <span className="text-muted-foreground">Last Visit: {selectedPatient.lastVisit}</span>
                          <span className="text-muted-foreground">Department: Endocrinology</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                        New Test Order
                      </button>
                      <button className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors">
                        Print Reports
                      </button>
                      <button className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors">
                        Export Data
                      </button>
                    </div>
                  </div>
                </div>

                {/* Enhanced AI Clinical Decision Support */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">AI</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900">Clinical Decision Support System</h3>
                      <p className="text-sm text-blue-700">AI-powered analysis of patient data</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Critical Alerts */}
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                      <h4 className="font-medium text-red-900 mb-3 flex items-center space-x-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span>🚨 Critical Alerts</span>
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="p-2 bg-red-50 border border-red-200 rounded">
                          <p className="font-medium text-red-800">Blood Sugar: 185 mg/dL ↑</p>
                          <p className="text-red-600 text-xs">Above target range (80-130 mg/dL)</p>
                        </div>
                        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <p className="font-medium text-yellow-800">HbA1c: 6.8% ↑</p>
                          <p className="text-yellow-600 text-xs">Trending upward from 6.5%</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Trends Analysis */}
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                      <h4 className="font-medium text-blue-900 mb-3">📈 Trend Analysis</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span>Glucose Control</span>
                          <span className="text-red-600 font-medium">Worsening</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Cholesterol</span>
                          <span className="text-green-600 font-medium">Improving</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Blood Pressure</span>
                          <span className="text-blue-600 font-medium">Stable</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* AI Recommendations */}
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                      <h4 className="font-medium text-blue-900 mb-3">💡 AI Recommendations</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start space-x-2">
                          <span className="text-blue-600 font-bold">•</span>
                          <span>Consider increasing Metformin to 1000mg BID</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="text-green-600 font-bold">•</span>
                          <span>Continue current statin therapy</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="text-orange-600 font-bold">•</span>
                          <span>Schedule HbA1c recheck in 3 months</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Enhanced Lab Reports Management */}
                <div className="bg-card border border-border rounded-lg">
                  <div className="border-b border-border">
                    <nav className="flex space-x-8 px-6">
                      {[
                        { id: 'new-reports', label: 'New Reports', count: 3, color: 'bg-red-500' },
                        { id: 'processing', label: 'Processing', count: 2, color: 'bg-yellow-500' },
                        { id: 'history', label: 'Report History', count: 15, color: 'bg-blue-500' },
                        { id: 'prescriptions', label: 'Prescriptions', count: 8, color: 'bg-green-500' },
                        { id: 'trends', label: 'Trends & Analysis', count: null, color: 'bg-purple-500' }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          className="flex items-center space-x-2 py-4 border-b-2 border-transparent hover:border-primary text-muted-foreground hover:text-foreground transition-colors relative"
                        >
                          <span>{tab.label}</span>
                          {tab.count && (
                            <div className="flex items-center space-x-1">
                              <div className={`w-2 h-2 rounded-full ${tab.color}`}></div>
                              <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
                                {tab.count}
                              </span>
                            </div>
                          )}
                        </button>
                      ))}
                    </nav>
                  </div>

                  <div className="p-6">
                    {/* Enhanced New Reports Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold flex items-center space-x-2">
                          <span>New Reports</span>
                          <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded-full">Requires Attention</span>
                        </h4>
                        <div className="flex space-x-2">
                          <button className="text-sm text-primary hover:underline">Mark All as Reviewed</button>
                          <button className="text-sm border border-border px-3 py-1 rounded hover:bg-accent">Bulk Actions</button>
                        </div>
                      </div>
                      
                      {[
                        {
                          id: 'R001',
                          testName: 'Comprehensive Metabolic Panel',
                          date: '2024-12-10',
                          time: '09:15 AM',
                          status: 'Urgent',
                          statusColor: 'bg-red-500',
                          priority: 'High',
                          abnormal: ['Glucose: 185 mg/dL', 'HbA1c: 6.8%'],
                          doctor: 'Dr. Sarah Johnson',
                          lab: 'Central Lab',
                          processingTime: '2h 30m'
                        },
                        {
                          id: 'R002',
                          testName: 'Lipid Profile Complete',
                          date: '2024-12-09',
                          time: '02:30 PM',
                          status: 'Processing',
                          statusColor: 'bg-yellow-500',
                          priority: 'Normal',
                          abnormal: [],
                          doctor: 'Dr. Sarah Johnson',
                          lab: 'Cardio Lab',
                          processingTime: '45m'
                        },
                        {
                          id: 'R003',
                          testName: 'Complete Blood Count with Diff',
                          date: '2024-12-08',
                          time: '11:45 AM',
                          status: 'Done',
                          statusColor: 'bg-green-500',
                          priority: 'Normal',
                          abnormal: ['WBC: 11.2 K/μL'],
                          doctor: 'Dr. Sarah Johnson',
                          lab: 'Hematology Lab',
                          processingTime: '1h 15m'
                        }
                      ].map((report) => (
                        <div key={report.id} className="border border-border rounded-lg p-5 hover:shadow-md transition-all">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className={`w-4 h-4 rounded-full ${
                                report.status === 'Urgent' ? 'bg-red-500 animate-pulse' : 
                                report.status === 'Processing' ? 'bg-yellow-500' : 'bg-green-500'
                              }`}></div>
                              <h5 className="font-semibold text-lg">{report.testName}</h5>
                              <span className="text-sm text-muted-foreground">#{report.id}</span>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                report.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {report.priority} Priority
                              </span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="text-right text-sm">
                                <p className="font-medium">{report.date} at {report.time}</p>
                                <p className="text-muted-foreground">Processing: {report.processingTime}</p>
                              </div>
                              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                                report.status === 'Urgent' ? 'bg-red-100 text-red-800' :
                                report.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {report.status}
                              </span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                            <div className="space-y-2">
                              <p className="text-sm"><span className="font-medium">Ordered by:</span> {report.doctor}</p>
                              <p className="text-sm"><span className="font-medium">Laboratory:</span> {report.lab}</p>
                              {report.abnormal.length > 0 && (
                                <div>
                                  <p className="text-sm font-medium text-red-600 mb-1">Abnormal Values:</p>
                                  <div className="space-y-1">
                                    {report.abnormal.map((value, index) => (
                                      <span key={index} className="inline-block text-xs bg-red-50 text-red-700 px-2 py-1 rounded mr-2">
                                        {value}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex justify-end items-start space-x-2">
                              <button className="px-3 py-2 text-sm border border-border rounded hover:bg-accent transition-colors">
                                View Details
                              </button>
                              <button className="px-3 py-2 text-sm border border-border rounded hover:bg-accent transition-colors">
                                Compare Previous
                              </button>
                              {report.status !== 'Done' && (
                                <button className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">
                                  Review & Sign
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Quick Results Preview */}
                          <div className="bg-muted/30 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h6 className="text-sm font-medium">Key Results Summary</h6>
                              <button className="text-xs text-primary hover:underline">View Full Report</button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                              <div className="bg-white rounded p-2">
                                <span className="text-muted-foreground block">Glucose</span>
                                <span className={`font-semibold ${report.testName.includes('Metabolic') ? 'text-red-600' : 'text-green-600'}`}>
                                  {report.testName.includes('Metabolic') ? '185 mg/dL ↑' : '95 mg/dL'}
                                </span>
                              </div>
                              <div className="bg-white rounded p-2">
                                <span className="text-muted-foreground block">Cholesterol</span>
                                <span className="font-semibold text-green-600">180 mg/dL ↓</span>
                              </div>
                              <div className="bg-white rounded p-2">
                                <span className="text-muted-foreground block">HDL</span>
                                <span className="font-semibold">45 mg/dL</span>
                              </div>
                              <div className="bg-white rounded p-2">
                                <span className="text-muted-foreground block">LDL</span>
                                <span className="font-semibold">120 mg/dL</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {!selectedPatient && (
              <div className="bg-muted/20 border-2 border-dashed border-muted-foreground/20 rounded-lg p-16 text-center">
                <FlaskConical className="w-20 h-20 text-muted-foreground/50 mx-auto mb-6" />
                <h3 className="text-xl font-medium text-muted-foreground mb-3">Select a Patient to Begin</h3>
                <p className="text-muted-foreground mb-4">Choose a patient from the priority list above to view their comprehensive lab reports, prescriptions, and clinical data.</p>
                <div className="flex justify-center space-x-3">
                  <button 
                    onClick={() => alert('Search patients functionality - to be implemented')}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center space-x-2"
                  >
                    <Search className="w-4 h-4" />
                    <span>Search All Patients</span>
                  </button>
                  <button 
                    onClick={fetchRecentOrders}
                    className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors flex items-center space-x-2"
                  >
                    <Filter className="w-4 h-4" />
                    <span>Recent Reports</span>
                  </button>
                </div>
              </div>
            )}

            {/* Simple New Test Order Modal */}
            {showNewOrderModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-96 max-w-md">
                  <h3 className="text-lg font-semibold mb-4">New Test Order</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Patient ID</label>
                      <input 
                        type="text" 
                        placeholder="Enter patient ID"
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Clinical Notes</label>
                      <textarea 
                        placeholder="Enter clinical notes"
                        className="w-full p-2 border border-gray-300 rounded-md"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Priority</label>
                      <select className="w-full p-2 border border-gray-300 rounded-md">
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex space-x-3 mt-6">
                    <button 
                      onClick={() => {
                        alert('Order creation functionality - to be implemented');
                        setShowNewOrderModal(false);
                      }}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                      Create Order
                    </button>
                    <button 
                      onClick={() => setShowNewOrderModal(false)}
                      className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Lab Report Viewing Modal */}
            {showReportModal && selectedReport && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold">Lab Report - {selectedReport.order.order_number}</h3>
                    <button 
                      onClick={() => setShowReportModal(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Patient Information</h4>
                      <p><strong>Name:</strong> {selectedReport.order.patient_first_name} {selectedReport.order.patient_last_name}</p>
                      <p><strong>Patient ID:</strong> {selectedReport.order.patient_unique_id}</p>
                      <p><strong>Gender:</strong> {selectedReport.order.patient_gender}</p>
                      <p><strong>DOB:</strong> {selectedReport.order.patient_dob ? new Date(selectedReport.order.patient_dob).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Order Information</h4>
                      <p><strong>Order Date:</strong> {new Date(selectedReport.order.order_date).toLocaleDateString()}</p>
                      <p><strong>Priority:</strong> <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(selectedReport.order.priority)}`}>{selectedReport.order.priority}</span></p>
                      <p><strong>Status:</strong> <span className={`px-2 py-1 rounded text-xs ${getStatusColor(selectedReport.order.status)}`}>{selectedReport.order.status}</span></p>
                      <p><strong>Doctor:</strong> Dr. {selectedReport.order.doctor_first_name} {selectedReport.order.doctor_last_name}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold mb-3">Clinical Notes</h4>
                    <p className="bg-gray-50 p-3 rounded">{selectedReport.order.clinical_notes || 'No clinical notes provided'}</p>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold mb-3">Test Results</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-3 border-b">Test Name</th>
                            <th className="text-left p-3 border-b">Category</th>
                            <th className="text-left p-3 border-b">Result</th>
                            <th className="text-left p-3 border-b">Status</th>
                            <th className="text-left p-3 border-b">Sample Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedReport.items.map((item, index) => (
                            <tr key={index} className="border-b">
                              <td className="p-3">{item.test_name}</td>
                              <td className="p-3">{item.category_name}</td>
                              <td className="p-3">
                                {item.result_text || item.result_value || 'Pending'}
                                {item.abnormal_flag && <span className="ml-2 text-red-600 text-xs">[ABNORMAL]</span>}
                                {item.critical_flag && <span className="ml-2 text-red-800 text-xs font-bold">[CRITICAL]</span>}
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded text-xs ${item.result_status === 'normal' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                  {item.result_status || 'Pending'}
                                </span>
                              </td>
                              <td className="p-3">{item.sample_type}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button 
                      onClick={() => alert('Print functionality - to be implemented')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Print Report
                    </button>
                    <button 
                      onClick={() => alert('Download PDF functionality - to be implemented')}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      Download PDF
                    </button>
                    <button 
                      onClick={() => setShowReportModal(false)}
                      className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Search Modal */}
            {showSearchModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                  <h3 className="text-lg font-semibold mb-4">Advanced Search</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Patient Name</label>
                      <input 
                        type="text" 
                        placeholder="Enter patient name"
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Order Number</label>
                      <input 
                        type="text" 
                        placeholder="Enter order number"
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Status</label>
                        <select className="w-full p-2 border border-gray-300 rounded-md">
                          <option value="">All Statuses</option>
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Priority</label>
                        <select className="w-full p-2 border border-gray-300 rounded-md">
                          <option value="">All Priorities</option>
                          <option value="normal">Normal</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Date From</label>
                        <input 
                          type="date" 
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Date To</label>
                        <input 
                          type="date" 
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-3 mt-6">
                    <button 
                      onClick={() => {
                        alert('Advanced search functionality - to be implemented');
                        setShowSearchModal(false);
                      }}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                      Search
                    </button>
                    <button 
                      onClick={() => setShowSearchModal(false)}
                      className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
    );
});

export default LabratoryTab;
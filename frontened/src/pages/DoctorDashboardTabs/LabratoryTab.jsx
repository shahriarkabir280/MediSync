import { useState, useEffect, useCallback, useMemo, memo, useRef } from "react";
import { User, FlaskConical, Plus, Upload, Search, Filter, Eye, Calendar, Clock, AlertTriangle, Bot, MessageSquare, X, Sparkles, Send, Paperclip } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState('overview');

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showAIChatModal, setShowAIChatModal] = useState(false);

  // AI Chat State
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: "Hello! I'm your Clinical AI Assistant. I've analyzed the patient's latest lab results. Notable findings include elevated Glucose (185 mg/dL) and HbA1c (6.8%). How can I assist you further?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Sidebar resizing logic
  const [sidebarWidth, setSidebarWidth] = useState(384);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const handleMouseMove = useCallback((e) => {
    if (!isResizing.current) return;
    const delta = e.clientX - startX.current;
    const newWidth = Math.min(Math.max(280, startWidth.current + delta), 600);
    setSidebarWidth(newWidth);
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, [handleMouseMove]);

  const startResizing = useCallback((e) => {
    isResizing.current = true;
    startX.current = e.clientX;
    startWidth.current = sidebarWidth;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [sidebarWidth, handleMouseMove, stopResizing]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSendMessage = async (e) => {
    // If e is an event with preventDefault, call it
    if (e && e.preventDefault) e.preventDefault();

    // Check if input is empty (using current state if e is passed from a click handler with a specific text, 
    // but here we rely on state or we need to handle the quick action case where text is passed)
    // Actually, for quick actions, I'll update state then force send. 
    // Better: Helper function that accepts text or uses state.

    let textToSend = chatInput;
    // logic simplified: assume we rely on chatInput state or update it before calling this? 
    // No, react state updates are async. I should accept an argument or use a separate ref/param.
    // Let's stick to using the state in the form submit, and for chips, I'll call a separate helper or update state and trigger effect... 
    // Simplify: handleSendMessage uses `chatInput`. Chips will call `sendQuickMessage(text)`.
    if (!textToSend.trim()) return;

    processMessage(textToSend);
  };

  const sendQuickMessage = (text) => {
    processMessage(text);
  };

  const processMessage = (text) => {
    const userMsg = {
      id: Date.now(), // simple ID
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    // Mock AI Response
    setTimeout(() => {
      let aiText = "I'm analyzing the data based on your query...";
      const lowerInput = text.toLowerCase();

      if (lowerInput.includes('trend') || lowerInput.includes('history')) {
        aiText = "Based on the last 3 months, the patient's Glucose has been trending upwards (+15%). However, Cholesterol levels are improving (-5%).";
      } else if (lowerInput.includes('recommend') || lowerInput.includes('plan')) {
        aiText = "**Recommendations:**\n\n• Consider increasing Metformin dosage.\n• Schedule a follow-up HbA1c test in 3 months.\n• Continue monitoring cardiovascular markers.";
      } else if (lowerInput.includes('critical') || lowerInput.includes('alert') || lowerInput.includes('analyze')) {
        aiText = "⚠️ **Critical Alert:** Blood Sugar is 185 mg/dL, which is significantly above the target range (80-130 mg/dL). Immediate attention is advised.";
      } else if (lowerInput.includes('drug') || lowerInput.includes('interaction')) {
        aiText = "No significant drug interactions found between current medications (List: Metformin, Lisinopril).";
      } else {
        aiText = "I can help you analyze trends, provide recommendations, or check for critical alerts. Please ask specific questions about the patient's lab data.";
      }

      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: aiText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

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

      switch (filterType) {
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
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'normal': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
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
    <div className="space-y-8 p-2 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50">
      {/* Header Section */}
      {/* Header Section with Navigation */}
      <div className="bg-white/80 backdrop-blur-sm sticky top-0 z-30 border-b border-gray-100 shadow-sm">
        <div className="p-6 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-2">Laboratory Management</h1>
              <p className="text-muted-foreground font-medium">Comprehensive patient lab reports, prescriptions, and clinical decision support.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleNewTestOrder}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 flex items-center space-x-2 font-medium active:scale-95"
              >
                <Plus className="w-5 h-5" />
                <span>New Test Order</span>
              </button>
              <button
                onClick={handleBulkActions}
                className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 flex items-center space-x-2 font-medium shadow-sm hover:shadow active:scale-95"
              >
                <Upload className="w-5 h-5" />
                <span>Bulk Actions</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: <Sparkles className="w-4 h-4" /> },
            { id: 'orders', label: 'Manage Orders', icon: <FlaskConical className="w-4 h-4" /> },
            { id: 'patients', label: 'Patient Console', icon: <User className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 flex items-center space-x-2 font-medium text-sm border-b-2 transition-colors ${activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 space-y-8 pb-12">

        {/* Overview View */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <div className="flex items-center justify-between mb-4 relative">
                  <h4 className="font-semibold text-gray-600">Today's Reports</h4>
                  <div className="w-3 h-3 bg-blue-500 rounded-full ring-4 ring-blue-50"></div>
                </div>
                <div className="relative">
                  <p className="text-3xl font-bold mb-2 text-gray-900">{loading ? '...' : labStats.today?.total_today || 0}</p>
                  <div className="flex items-center space-x-3 text-sm font-medium">
                    <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">{labStats.today?.pending_today || 0} Pending</span>
                    <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{labStats.today?.completed_today || 0} Done</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <div className="flex items-center justify-between mb-4 relative">
                  <h4 className="font-semibold text-gray-600">Urgent Reports</h4>
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-25"></div>
                    <div className="w-3 h-3 bg-red-500 rounded-full ring-4 ring-red-50 relative z-10"></div>
                  </div>
                </div>
                <div className="relative">
                  <p className="text-3xl font-bold mb-2 text-red-600">{loading ? '...' : labStats.urgent?.urgent_count || 0}</p>
                  <p className="text-sm text-red-600/80 font-medium">Require immediate attention</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <div className="flex items-center justify-between mb-4 relative">
                  <h4 className="font-semibold text-gray-600">Unreviewed</h4>
                  <div className="w-3 h-3 bg-orange-500 rounded-full ring-4 ring-orange-50"></div>
                </div>
                <div className="relative">
                  <p className="text-3xl font-bold mb-2 text-orange-600">{loading ? '...' : labStats.unreviewed?.unreviewed_count || 0}</p>
                  <p className="text-sm text-orange-600/80 font-medium">Awaiting doctor review</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <div className="flex items-center justify-between mb-4 relative">
                  <h4 className="font-semibold text-gray-600">This Week</h4>
                  <div className="w-3 h-3 bg-green-500 rounded-full ring-4 ring-green-50"></div>
                </div>
                <div className="relative">
                  <p className="text-3xl font-bold mb-2 text-gray-900">156</p>
                  <div className="flex items-center text-sm">
                    <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium flex items-center">
                      +23% <span className="text-gray-500 ml-1 font-normal">from last week</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions & Recent Activity for Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => alert('Order Templates feature coming soon')} className="p-4 bg-blue-50 hover:bg-blue-100 rounded-xl flex flex-col items-center justify-center space-y-2 transition-colors">
                    <Sparkles className="w-6 h-6 text-blue-600" />
                    <span className="font-medium text-blue-900">Templates</span>
                  </button>
                  <button onClick={() => setActiveTab('patients')} className="p-4 bg-indigo-50 hover:bg-indigo-100 rounded-xl flex flex-col items-center justify-center space-y-2 transition-colors">
                    <Search className="w-6 h-6 text-indigo-600" />
                    <span className="font-medium text-indigo-900">Find Patient</span>
                  </button>
                  <button className="p-4 bg-green-50 hover:bg-green-100 rounded-xl flex flex-col items-center justify-center space-y-2 transition-colors">
                    <FlaskConical className="w-6 h-6 text-green-600" />
                    <span className="font-medium text-green-900">Lab Results</span>
                  </button>
                  <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-xl flex flex-col items-center justify-center space-y-2 transition-colors">
                    <Calendar className="w-6 h-6 text-purple-600" />
                    <span className="font-medium text-purple-900">Schedule</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center justify-between">
                  <span>Pending Reviews</span>
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">Urgent</span>
                </h3>
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">P{i}</div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">Lipid Profile</p>
                          <p className="text-xs text-gray-500">2 hrs ago</p>
                        </div>
                      </div>
                      <button className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-md font-medium text-gray-700 hover:bg-gray-50">Review</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Orders View */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Search and Filter Section */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3 w-full lg:w-auto">
                  <div className="relative flex-1 w-full lg:w-96 group">
                    <Search className="absolute left-4 top-3.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="text"
                      placeholder="Search orders, patients..."
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all duration-300"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchTerm)}
                    />
                  </div>
                  <button
                    onClick={() => handleSearch(searchTerm)}
                    className="w-full sm:w-auto px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all duration-300 shadow-lg shadow-gray-200 flex items-center justify-center space-x-2 font-medium active:scale-95"
                  >
                    <Search className="w-4 h-4" />
                    <span>Search</span>
                  </button>
                </div>
                <button
                  onClick={() => setShowSearchModal(true)}
                  className="w-full sm:w-auto px-6 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 flex items-center justify-center space-x-2 font-medium"
                >
                  <Filter className="w-4 h-4" />
                  <span>Advanced Search</span>
                </button>
              </div>

              {/* Quick Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-500 mr-2">Quick Filters:</span>
                {[
                  { key: 'all', label: 'All Orders', color: 'hover:bg-gray-100', active: 'bg-gray-900 text-white shadow-md' },
                  { key: 'urgent', label: `Urgent (${labStats.urgent?.urgent_count || 0})`, color: 'hover:bg-red-50 text-red-600', active: 'bg-red-500 text-white shadow-md shadow-red-200' },
                  { key: 'pending', label: 'Pending', color: 'hover:bg-yellow-50 text-yellow-600', active: 'bg-yellow-500 text-white shadow-md shadow-yellow-200' },
                  { key: 'today', label: 'Today', color: 'hover:bg-blue-50 text-blue-600', active: 'bg-blue-500 text-white shadow-md shadow-blue-200' },
                  { key: 'completed', label: 'Completed', color: 'hover:bg-green-50 text-green-600', active: 'bg-green-500 text-white shadow-md shadow-green-200' }
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => handleQuickFilter(filter.key)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${activeFilter === filter.key
                      ? filter.active
                      : 'bg-white border border-gray-200 text-gray-600 ' + filter.color
                      }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lab Orders Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Lab Orders {activeFilter !== 'all' && <span className="text-blue-600 capitalize">({activeFilter})</span>}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {loading ? 'Loading...' : `${filteredOrders.length} orders found`}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="max-h-[500px] overflow-y-auto scrollbar-thin">
                <table className="w-full">
                  <thead className="bg-gray-50/50 sticky top-0 z-10 backdrop-blur-sm">
                    <tr>
                      <th className="text-left p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Order Info</th>
                      <th className="text-left p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Patient</th>
                      <th className="text-left p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Priority</th>
                      <th className="text-left p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="text-left p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Tests</th>
                      <th className="text-left p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="text-right p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="text-center p-12">
                          <div className="flex flex-col items-center justify-center space-y-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            <span className="text-gray-400 text-sm">Loading orders...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center p-12 text-gray-400">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <Search className="w-8 h-8 text-gray-300" />
                            <p>No lab orders found found matching your criteria</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50/80 transition-colors group cursor-default">
                          <td className="p-4">
                            <div className="font-semibold text-gray-900 mb-0.5">{order.order_number}</div>
                            <div className="text-xs text-gray-500 truncate max-w-[140px]" title={order.clinical_notes}>{order.clinical_notes || 'No notes'}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-gray-900">{order.patient_first_name} {order.patient_last_name}</div>
                            <div className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded inline-block mt-0.5">{order.patient_unique_id}</div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border ${order.priority === 'urgent' ? 'bg-red-50 text-red-600 border-red-100' :
                              order.priority === 'high' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                'bg-blue-50 text-blue-600 border-blue-100'
                              }`}>
                              {order.priority}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`flex items-center space-x-1.5 w-fit px-2.5 py-1 rounded-full text-xs font-medium ${order.status === 'completed' ? 'bg-green-50 text-green-700' :
                              order.status === 'urgent' ? 'bg-red-50 text-red-700' :
                                order.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                                  'bg-blue-50 text-blue-700'
                              }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${order.status === 'completed' ? 'bg-green-500' :
                                order.status === 'urgent' ? 'bg-red-500' :
                                  order.status === 'pending' ? 'bg-yellow-500' :
                                    'bg-blue-500'
                                }`}></span>
                              <span className="capitalize">{order.status.replace('_', ' ')}</span>
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-1">
                              <span className="text-sm text-gray-600">{order.test_count}</span>
                              <span className="text-xs text-gray-400">tests</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-gray-900">{new Date(order.order_date).toLocaleDateString()}</div>
                            <div className="text-xs text-gray-400">{new Date(order.order_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleViewReport(order.id)}
                                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
                                title="View Report"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => alert(`Edit order ${order.order_number} - to be implemented`)}
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                                title="Edit Order"
                              >
                                <Clock className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Patient Console View */}
        {activeTab === 'patients' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Patient Selection & Search
              </h3>
              <div className="flex flex-col lg:flex-row gap-0 h-auto lg:h-[750px] mt-6 bg-gray-50/30 rounded-xl overflow-hidden border border-gray-100 relative">
                {/* Left Column: Search & List */}
                <div
                  className="flex flex-col h-[500px] lg:h-full bg-white transition-all duration-75 border-b lg:border-b-0 lg:border-r border-gray-200"
                  style={{ width: window.innerWidth >= 1024 ? `${sidebarWidth}px` : '100%', minWidth: window.innerWidth >= 1024 ? '280px' : '100%' }}
                >
                  {/* Search Area */}
                  <div className="p-4 border-b border-gray-100 bg-gray-50/50 space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-3  h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search patients..."
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                        value={patientSearchTerm}
                        onChange={(e) => {
                          setPatientSearchTerm(e.target.value);
                          fetchPatients(e.target.value);
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 font-medium px-1">
                      <span>{patients.length} Results</span>
                      <span className="flex items-center text-blue-600"><Filter className="w-3 h-3 mr-1" /> Filter</span>
                    </div>
                  </div>

                  {/* Patient List */}
                  <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-2 bg-gray-50/30">
                    {patients.map((patient) => (
                      <div
                        key={patient.id}
                        onClick={() => setSelectedPatient(patient)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-sm ${selectedPatient?.id === patient.id
                          ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200 shadow-sm'
                          : 'bg-white border-gray-100 hover:border-blue-200 hover:bg-white'
                          }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${selectedPatient?.id === patient.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                            }`}>
                            <User className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-start">
                              <h4 className={`text-sm font-bold truncate ${selectedPatient?.id === patient.id ? 'text-blue-900' : 'text-gray-900'}`}>{patient.first_name} {patient.last_name}</h4>
                              {patient.status === 'urgent' && <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5"></div>}
                            </div>
                            <p className="text-xs text-gray-500 truncate">ID: {patient.unique_id}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {patients.length === 0 && (
                      <div className="text-center py-8 px-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Search className="w-5 h-5 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500">No patients found</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Resize Handle */}
                <div
                  onMouseDown={startResizing}
                  className="hidden lg:flex w-1.5 hover:w-2 bg-transparent hover:bg-blue-400 group cursor-col-resize items-center justify-center transition-all duration-200 z-10 relative"
                >
                  <div className="absolute inset-y-0 left-1/2 -ml-px w-px bg-gray-200 group-hover:bg-blue-300 transition-colors"></div>
                  <div className="w-1 h-6 bg-gray-300 group-hover:bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-0.5">
                    <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
                    <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
                    <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
                  </div>
                </div>

                {/* Right Column: Details */}
                <div className="flex-1 h-auto lg:h-full overflow-y-auto scrollbar-thin rounded-xl border border-gray-200 bg-gray-50/30 p-1 custom-scrollbar min-w-0 bg-white">

                  {selectedPatient && (
                    <>
                      {/* Enhanced Patient Overview */}
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-bl-full opacity-50 -mr-16 -mt-16 pointer-events-none"></div>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
                          <div className="flex items-center space-x-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                              <User className="w-10 h-10 text-white" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-4 mb-2">
                                <h3 className="text-2xl font-bold text-gray-900">{selectedPatient.name}</h3>
                                <span className={`text-xs px-3 py-1 rounded-full border font-semibold uppercase tracking-wide ${selectedPatient.statusColor}`}>
                                  {selectedPatient.status}
                                </span>
                              </div>
                              <p className="text-gray-500 mb-2 font-medium">Patient ID: <span className="text-gray-900">{selectedPatient.id}</span> • Age: <span className="text-gray-900">{selectedPatient.age}</span></p>
                              <div className="flex flex-wrap items-center gap-6 text-sm">
                                <span className="flex items-center space-x-2 bg-green-50 text-green-700 px-3 py-1 rounded-lg border border-green-100">
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                  <span className="font-medium">Active Patient</span>
                                </span>
                                <span className="text-gray-500 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">Last Visit: <span className="font-medium text-gray-900">{selectedPatient.lastVisit}</span></span>
                                <span className="text-gray-500 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">Department: <span className="font-medium text-gray-900">Endocrinology</span></span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            <button className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-md shadow-blue-200 font-medium active:scale-95">
                              New Test Order
                            </button>
                            <button className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 font-medium bg-white shadow-sm">
                              Print Reports
                            </button>
                            <button className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 font-medium bg-white shadow-sm">
                              Export Data
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Enhanced AI Clinical Decision Support */}



                      {/* Enhanced Lab Reports Management */}
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="border-b border-gray-100 bg-gray-50/50">
                          <nav className="flex space-x-1 px-4 pt-2">
                            {[
                              { id: 'new-reports', label: 'New Reports', count: 3, color: 'bg-red-500', bg: 'bg-red-100', text: 'text-red-600' },
                              { id: 'processing', label: 'Processing', count: 2, color: 'bg-yellow-500', bg: 'bg-yellow-100', text: 'text-yellow-600' },
                              { id: 'history', label: 'Report History', count: 15, color: 'bg-blue-500', bg: 'bg-blue-100', text: 'text-blue-600' },
                              { id: 'prescriptions', label: 'Prescriptions', count: 8, color: 'bg-green-500', bg: 'bg-green-100', text: 'text-green-600' },
                              { id: 'trends', label: 'Trends & Analysis', count: null, color: 'bg-purple-500' }
                            ].map((tab, index) => (
                              <button
                                key={tab.id}
                                className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-all duration-300 font-medium ${index === 0
                                  ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 rounded-t-lg'
                                  }`}
                              >
                                <span>{tab.label}</span>
                                {tab.count && (
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${index === 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {tab.count}
                                  </span>
                                )}
                              </button>
                            ))}
                          </nav>
                        </div>

                        <div className="p-8">
                          {/* Enhanced New Reports Section */}
                          <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <h4 className="text-xl font-bold text-gray-900 flex items-center space-x-3">
                                <span>New Reports</span>
                                <span className="text-xs bg-red-50 text-red-600 px-2.5 py-1 rounded-full border border-red-100 font-medium">Requires Attention</span>
                              </h4>
                              <div className="flex space-x-3">
                                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline">Mark All as Reviewed</button>
                                <button className="text-sm border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors">Bulk Actions</button>
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
                              <div key={report.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-300 group bg-white">
                                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                                  <div className="flex items-center space-x-4">
                                    <div className={`p-3 rounded-xl ${report.status === 'Urgent' ? 'bg-red-50 text-red-600' :
                                      report.status === 'Processing' ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'
                                      }`}>
                                      <FlaskConical className="w-6 h-6" />
                                    </div>
                                    <div>
                                      <div className="flex items-center space-x-3">
                                        <h5 className="font-bold text-lg text-gray-900">{report.testName}</h5>
                                        <span className="text-sm text-gray-400 font-mono">#{report.id}</span>
                                      </div>
                                      <div className="flex items-center space-x-2 mt-1">
                                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide ${report.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                          }`}>
                                          {report.priority} Priority
                                        </span>
                                        {report.abnormal.length > 0 && (
                                          <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide bg-red-100 text-red-700 flex items-center">
                                            <AlertTriangle className="w-3 h-3 mr-1" /> Abnormal
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <div className="text-right text-sm">
                                      <p className="font-medium text-gray-900">{report.date} <span className="text-gray-400">at</span> {report.time}</p>
                                      <p className="text-gray-500">Processing Time: {report.processingTime}</p>
                                    </div>
                                    <span className={`text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wide shadow-sm ${report.status === 'Urgent' ? 'bg-red-500 text-white' :
                                      report.status === 'Processing' ? 'bg-yellow-500 text-white' :
                                        'bg-green-500 text-white'
                                      }`}>
                                      {report.status}
                                    </span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                  <div className="lg:col-span-2 space-y-4">
                                    <div className="flex space-x-8 text-sm text-gray-600">
                                      <div><span className="font-medium text-gray-900 block mb-0.5">Ordered by:</span> {report.doctor}</div>
                                      <div><span className="font-medium text-gray-900 block mb-0.5">Laboratory:</span> {report.lab}</div>
                                    </div>

                                    {/* Quick Results Preview */}
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                      <div className="flex items-center justify-between mb-3">
                                        <h6 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Key Results</h6>
                                        <button className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline">View Full Report</button>
                                      </div>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                                          <span className="text-gray-500 block mb-1">Glucose</span>
                                          <span className={`font-bold text-sm ${report.testName.includes('Metabolic') ? 'text-red-600' : 'text-gray-900'}`}>
                                            {report.testName.includes('Metabolic') ? '185 mg/dL ↑' : '95 mg/dL'}
                                          </span>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                                          <span className="text-gray-500 block mb-1">Cholesterol</span>
                                          <span className="font-bold text-sm text-green-600">180 mg/dL ↓</span>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                                          <span className="text-gray-500 block mb-1">HDL</span>
                                          <span className="font-bold text-sm text-gray-900">45 mg/dL</span>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                                          <span className="text-gray-500 block mb-1">LDL</span>
                                          <span className="font-bold text-sm text-gray-900">120 mg/dL</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex flex-col justify-between space-y-3 border-l border-gray-100 pl-6 border-transparent lg:border-gray-100">
                                    <button className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all font-medium text-gray-700 bg-white shadow-sm">
                                      View Details
                                    </button>
                                    <button className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all font-medium text-gray-700 bg-white shadow-sm">
                                      Compare Previous
                                    </button>
                                    {report.status !== 'Done' && (
                                      <button className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-md shadow-blue-200 active:scale-95">
                                        Review & Sign
                                      </button>
                                    )}
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
                    <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-16 text-center shadow-sm">
                      <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FlaskConical className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Select a Patient to Begin</h3>
                      <p className="text-gray-500 mb-8 max-w-md mx-auto">Choose a patient from the priority list above to view their comprehensive lab reports, prescriptions, and clinical data.</p>
                      <div className="flex justify-center space-x-4">
                        <button
                          onClick={() => document.querySelector('input[placeholder*="Search by patient name"]')?.focus()}
                          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center space-x-2 font-medium active:scale-95"
                        >
                          <Search className="w-5 h-5" />
                          <span>Search Patient</span>
                        </button>
                        <button
                          onClick={fetchRecentOrders}
                          className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-medium bg-white shadow-sm"
                        >
                          <Filter className="w-5 h-5" />
                          <span>Recent Reports</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Simple New Test Order Modal */}
              {showNewOrderModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                  <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl transform transition-all">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                      <div className="bg-blue-100 p-2 rounded-lg mr-3">
                        <Plus className="w-5 h-5 text-blue-600" />
                      </div>
                      New Test Order
                    </h3>
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Patient ID</label>
                        <input
                          type="text"
                          placeholder="Enter patient ID"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Clinical Notes</label>
                        <textarea
                          placeholder="Enter clinical notes"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-medium min-h-[100px]"
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Priority</label>
                        <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-medium">
                          <option value="normal">Normal Priority</option>
                          <option value="high">High Priority</option>
                          <option value="urgent">Urgent Priority</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex space-x-3 mt-8">
                      <button
                        onClick={() => {
                          alert('Order creation functionality - to be implemented');
                          setShowNewOrderModal(false);
                        }}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200 font-bold active:scale-95"
                      >
                        Create Order
                      </button>
                      <button
                        onClick={() => setShowNewOrderModal(false)}
                        className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-medium bg-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Lab Report Viewing Modal */}
              {showReportModal && selectedReport && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                    {/* Modal Header */}
                    <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                      <div className="flex items-center space-x-4">
                        <div className="bg-blue-100 p-3 rounded-xl">
                          <FlaskConical className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Lab Report Details</h3>
                          <p className="text-sm text-gray-500 font-medium">Order #{selectedReport.order.order_number}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowReportModal(false)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                      >
                        <span className="sr-only">Close</span>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="overflow-y-auto p-8 bg-gray-50/30">
                      {/* Report Header Info */}
                      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Patient Information</h4>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Name</span>
                                <span className="font-semibold text-gray-900">{selectedReport.order.patient_first_name} {selectedReport.order.patient_last_name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">ID</span>
                                <span className="font-mono text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs">{selectedReport.order.patient_unique_id}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Gender/DOB</span>
                                <span className="font-medium text-gray-900">{selectedReport.order.patient_gender} • {selectedReport.order.patient_dob ? new Date(selectedReport.order.patient_dob).toLocaleDateString() : 'N/A'}</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Order Details</h4>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500">Date</span>
                                <span className="font-medium text-gray-900">{new Date(selectedReport.order.order_date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500">Priority</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${selectedReport.order.priority === 'urgent' ? 'bg-red-50 text-red-600 border-red-100' :
                                  selectedReport.order.priority === 'high' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                    'bg-blue-50 text-blue-600 border-blue-100'
                                  }`}>
                                  {selectedReport.order.priority}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500">Status</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${selectedReport.order.status === 'completed' ? 'bg-green-50 text-green-600 border-green-100' :
                                  'bg-blue-50 text-blue-600 border-blue-100'
                                  }`}>
                                  {selectedReport.order.status.replace('_', ' ')}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Physician</span>
                                <span className="font-medium text-gray-900">Dr. {selectedReport.order.doctor_first_name} {selectedReport.order.doctor_last_name}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {selectedReport.order.clinical_notes && (
                          <div className="mt-6 pt-6 border-t border-gray-100">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Clinical Notes</h4>
                            <p className="text-gray-700 bg-gray-50 p-4 rounded-xl text-sm leading-relaxed border border-gray-100 italic">
                              "{selectedReport.order.clinical_notes}"
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Test Results Table */}
                      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                          <h4 className="font-bold text-gray-900">Test Results</h4>
                          <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">{selectedReport.items.length} Tests</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                              <tr>
                                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Test Name</th>
                                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Result</th>
                                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit</th>
                                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reference Range</th>
                                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {selectedReport.items.map((item, index) => (
                                <tr key={index} className="hover:bg-gray-50/80 transition-colors">
                                  <td className="py-4 px-6">
                                    <div className="font-medium text-gray-900">{item.test_name}</div>
                                    <div className="text-xs text-gray-500">{item.category_name}</div>
                                  </td>
                                  <td className="py-4 px-6">
                                    <div className="flex items-center space-x-2">
                                      <span className={`font-bold ${item.abnormal_flag ? 'text-red-600' :
                                        item.critical_flag ? 'text-red-800' : 'text-gray-900'
                                        }`}>
                                        {item.result_text || item.result_value || 'Pending'}
                                      </span>
                                      {item.abnormal_flag && <AlertTriangle className="w-4 h-4 text-red-500" />}
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 text-sm text-gray-500">{item.unit || '-'}</td>
                                  <td className="py-4 px-6 text-sm text-gray-500">{item.reference_range || '-'}</td>
                                  <td className="py-4 px-6">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${item.result_status === 'normal' ? 'bg-green-50 text-green-700 border-green-100' :
                                      item.result_status === 'abnormal' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                        item.result_status === 'critical' ? 'bg-red-50 text-red-700 border-red-100' :
                                          'bg-gray-50 text-gray-600 border-gray-200'
                                      }`}>
                                      {item.result_status || 'Pending'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="px-8 py-6 border-t border-gray-100 bg-gray-50/50 flex justify-end space-x-4">
                      <button
                        onClick={() => alert('Print functionality - to be implemented')}
                        className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-white hover:border-gray-300 transition-all font-medium shadow-sm flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        <span>Print Report</span>
                      </button>
                      <button
                        onClick={() => alert('Download PDF functionality - to be implemented')}
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 font-medium flex items-center space-x-2 active:scale-95"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        <span>Download PDF</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced Search Modal */}
              {showSearchModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                  <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl transition-all">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                      <div className="bg-blue-100 p-2 rounded-lg mr-3">
                        <Filter className="w-5 h-5 text-blue-600" />
                      </div>
                      Advanced Search
                    </h3>
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Patient Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Enter patient name"
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-medium"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Order Number</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Enter order number"
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-medium"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
                          <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-medium">
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Priority</label>
                          <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-medium">
                            <option value="">All Priorities</option>
                            <option value="normal">Normal</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date From</label>
                          <input
                            type="date"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-medium text-gray-600"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date To</label>
                          <input
                            type="date"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-medium text-gray-600"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-3 mt-8">
                      <button
                        onClick={() => {
                          alert('Advanced search functionality - to be implemented');
                          setShowSearchModal(false);
                        }}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200 font-bold active:scale-95 flex items-center justify-center space-x-2"
                      >
                        <Search className="w-5 h-5" />
                        <span>Search Orders</span>
                      </button>
                      <button
                        onClick={() => setShowSearchModal(false)}
                        className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-medium bg-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* AI Chat Floating Button */}
            {selectedPatient && (
              <button
                onClick={() => setShowAIChatModal(true)}
                className="fixed bottom-8 right-8 z-40 w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl hover:scale-110 hover:shadow-blue-500/50 transition-all duration-300 flex items-center justify-center group"
                aria-label="Open Clinical AI Assistant"
              >
                <div className="absolute inset-0 bg-white rounded-full opacity-0 group-hover:opacity-20 transition-opacity"></div>
                <Bot className="w-8 h-8" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                </span>
              </button>
            )}

            {/* AI Chat Modal */}
            {showAIChatModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl w-full max-w-2xl h-[650px] shadow-2xl flex flex-col relative overflow-hidden ring-1 ring-white/10">
                  {/* Background Effects */}
                  <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-2xl -ml-12 -mb-12 pointer-events-none"></div>

                  {/* Modal Header */}
                  <div className="relative z-10 flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10 shadow-inner">
                        <Bot className="w-7 h-7 text-blue-200" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Clinical Assistant</h3>
                        <div className="flex items-center space-x-2">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                          <p className="text-blue-100/80 text-xs">Analyzing {selectedPatient?.first_name}'s reports</p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowAIChatModal(false)}
                      className="p-2 bg-white/5 hover:bg-white/20 rounded-full transition-colors text-white/70 hover:text-white"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Chat Area */}
                  <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                    {chatMessages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender === 'ai' && (
                          <div className="w-8 h-8 rounded-full bg-indigo-500/30 flex-shrink-0 mr-3 flex items-center justify-center border border-white/10">
                            <Bot className="w-4 h-4 text-indigo-200" />
                          </div>
                        )}
                        <div className={`max-w-[85%] rounded-2xl px-5 py-4 text-sm leading-relaxed shadow-sm ${msg.sender === 'user'
                          ? 'bg-white text-blue-900 rounded-br-none'
                          : 'bg-white/10 backdrop-blur-md border border-white/10 text-gray-100 rounded-bl-none'
                          }`}>
                          {msg.sender === 'ai' ? (
                            <div className="prose prose-invert prose-sm max-w-none">
                              {msg.text.split('\n').map((line, i) => (
                                <p key={i} className="mb-2 last:mb-0">{line}</p>
                              ))}
                            </div>
                          ) : msg.text}
                          <div className={`text-[10px] mt-2 opacity-60 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                            {msg.timestamp}
                          </div>
                        </div>
                      </div>
                    ))}

                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/30 flex-shrink-0 mr-3 flex items-center justify-center border border-white/10">
                          <Bot className="w-4 h-4 text-indigo-200" />
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl rounded-bl-none px-4 py-3 flex items-center space-x-1">
                          <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Modal Footer (Input) */}
                  <div className="relative z-10 p-4 bg-white/5 border-t border-white/10 backdrop-blur-md">
                    {/* Suggested Actions - Sliding */}
                    {!isTyping && chatMessages.length < 5 && (
                      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-none">
                        {['Analyze Trends', 'Check Drug Interactions', 'Review Vital Signs', 'Summarize History'].map(action => (
                          <button
                            key={action}
                            onClick={() => sendQuickMessage(action)}
                            className="whitespace-nowrap text-xs bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 px-3 py-1.5 rounded-full transition-colors flex items-center"
                          >
                            <Sparkles className="w-3 h-3 mr-1.5" /> {action}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button className="p-3 text-blue-200/70 hover:text-white hover:bg-white/10 transition-all rounded-xl">
                        <Paperclip className="w-5 h-5" />
                      </button>
                      <form onSubmit={handleSendMessage} className="flex-1 relative">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Ask the Clinical AI anything..."
                          className="w-full bg-white/10 border border-white/10 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-500/20 text-white placeholder-blue-200/30 text-sm px-4 py-3.5 rounded-xl outline-none transition-all"
                        />
                        <button
                          type="submit"
                          disabled={!chatInput.trim() || isTyping}
                          className="absolute right-2 top-1.5 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default LabratoryTab;
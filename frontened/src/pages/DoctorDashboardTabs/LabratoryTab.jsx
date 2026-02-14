import {
  User, FlaskConical, Plus, Search, Filter, Eye, Calendar, Clock,
  AlertTriangle, Bot, MessageSquare, X, Sparkles, Send, Paperclip, FileText,
  ExternalLink, Scan, Download as DownloadIcon, Check
} from "lucide-react";
import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { debounce } from "../../utils/performance";
import { API_CONFIG } from "../../config/api";
import { toast } from "react-hot-toast";

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
  const [mobileShowDetails, setMobileShowDetails] = useState(false);
  const [selectedSubTab, setSelectedSubTab] = useState('new-reports');

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
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/lab/stats`);
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
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/lab/recent?limit=10`);
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
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/lab/categories`);
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
        `/api/lab/patients?search=${encodeURIComponent(searchTerm)}&limit=5` :
        '/api/lab/patients?limit=5';
      const response = await fetch(`${API_CONFIG.BASE_URL}${url}`);
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


  const handleSearch = useCallback(async (term) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/lab/search?search=${encodeURIComponent(term)}&limit=20`);
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
          const response = await fetch(`${API_CONFIG.BASE_URL}/api/lab/recent?limit=20`);
          const result = await response.json();
          if (result.success) {
            setFilteredOrders(result.data);
          }
          return;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`);
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
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/lab/report/${orderId}`);
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

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/lab/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(`Order status updated to ${newStatus}`);

        // Update local state for orders
        const updateOrders = (orders) =>
          orders.map(order => order.id === orderId ? { ...order, status: newStatus } : order);

        setFilteredOrders(prev => updateOrders(prev));
        setRecentOrders(prev => updateOrders(prev));

        // Update selection if open
        if (selectedReport && selectedReport.order.id === orderId) {
          setSelectedReport(prev => ({
            ...prev,
            order: { ...prev.order, status: newStatus }
          }));
        }

        // Refresh stats
        fetchLabStats();
      } else {
        toast.error(result.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('An error occurred while updating status');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-rose-500 bg-rose-500/10 border border-rose-500/20';
      case 'high': return 'text-amber-600 bg-amber-500/10 border border-amber-500/20';
      case 'normal': return 'text-blue-600 bg-blue-500/10 border border-blue-500/20';
      default: return 'text-muted-foreground bg-muted border border-border';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-amber-600 bg-amber-500/10 border border-amber-500/20';
      case 'in_progress': return 'text-blue-600 bg-blue-500/10 border border-blue-500/20';
      case 'completed': return 'text-emerald-600 bg-emerald-500/10 border border-emerald-500/20';
      case 'urgent': return 'text-rose-500 bg-rose-500/10 border border-rose-500/20';
      default: return 'text-muted-foreground bg-muted border border-border';
    }
  };
  // Initialize filters on component mount
  useEffect(() => {
    if (recentOrders.length > 0 && filteredOrders.length === 0) {
      setFilteredOrders(recentOrders);
    }
  }, [recentOrders]);
  return (
    <div className="space-y-8 p-2 min-h-screen bg-background">
      {/* Header Section */}
      {/* Header Section with Navigation */}
      <div className="bg-card/80 backdrop-blur-md sticky top-0 z-30 border-b border-border shadow-sm">
        <div className="p-6 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-2">Laboratory Management</h1>
              <p className="text-muted-foreground font-medium">Comprehensive patient lab reports, prescriptions, and clinical decision support.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleNewTestOrder}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 flex items-center justify-center space-x-2 font-medium active:scale-95"
              >
                <Plus className="w-5 h-5" />
                <span>New Test Order</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 flex space-x-8 overflow-x-auto scrollbar-hide border-b border-border">
          {[
            { id: 'overview', label: 'Overview', icon: <Sparkles className="w-4 h-4" /> },
            { id: 'orders', label: 'Manage Orders', icon: <FlaskConical className="w-4 h-4" /> },
            { id: 'patients', label: 'Patient Console', icon: <User className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 flex items-center space-x-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
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
              <div className="bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <div className="flex items-center justify-between mb-4 relative">
                  <h4 className="font-semibold text-muted-foreground">Today's Reports</h4>
                  <div className="w-3 h-3 bg-blue-500 rounded-full ring-4 ring-blue-500/20"></div>
                </div>
                <div className="relative">
                  <p className="text-3xl font-bold mb-2 text-foreground">{loading ? '...' : labStats.today?.total_today || 0}</p>
                  <div className="flex items-center space-x-3 text-sm font-medium">
                    <span className="text-orange-600 dark:text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full">{labStats.today?.pending_today || 0} Pending</span>
                    <span className="text-green-600 dark:text-green-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">{labStats.today?.completed_today || 0} Done</span>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <div className="flex items-center justify-between mb-4 relative">
                  <h4 className="font-semibold text-muted-foreground">Urgent Reports</h4>
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-25"></div>
                    <div className="w-3 h-3 bg-red-500 rounded-full ring-4 ring-red-500/20 relative z-10"></div>
                  </div>
                </div>
                <div className="relative">
                  <p className="text-3xl font-bold mb-2 text-red-600">{loading ? '...' : labStats.urgent?.urgent_count || 0}</p>
                  <p className="text-sm text-red-600/80 font-medium">Require immediate attention</p>
                </div>
              </div>

              <div className="bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <div className="flex items-center justify-between mb-4 relative">
                  <h4 className="font-semibold text-muted-foreground">Unreviewed</h4>
                  <div className="w-3 h-3 bg-orange-500 rounded-full ring-4 ring-amber-500/20"></div>
                </div>
                <div className="relative">
                  <p className="text-3xl font-bold mb-2 text-orange-600">{loading ? '...' : labStats.unreviewed?.unreviewed_count || 0}</p>
                  <p className="text-sm text-orange-600/80 font-medium">Awaiting doctor review</p>
                </div>
              </div>

              <div className="bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <div className="flex items-center justify-between mb-4 relative">
                  <h4 className="font-semibold text-muted-foreground">This Week</h4>
                  <div className="w-3 h-3 bg-green-500 rounded-full ring-4 ring-emerald-500/20"></div>
                </div>
                <div className="relative">
                  <p className="text-3xl font-bold mb-2 text-foreground">156</p>
                  <div className="flex items-center text-sm">
                    <span className="text-green-600 dark:text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium flex items-center">
                      +23% <span className="text-muted-foreground ml-1 font-normal">from last week</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions & Recent Activity for Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
                <h3 className="text-lg font-bold text-foreground mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => alert('Order Templates feature coming soon')} className="p-4 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl flex flex-col items-center justify-center space-y-2 transition-colors border border-blue-500/10 group">
                    <Sparkles className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-blue-700 dark:text-blue-400 text-sm">Templates</span>
                  </button>
                  <button onClick={() => setActiveTab('patients')} className="p-4 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl flex flex-col items-center justify-center space-y-2 transition-colors border border-indigo-500/10 group">
                    <Search className="w-6 h-6 text-indigo-600 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-indigo-700 dark:text-indigo-400 text-sm">Find Patient</span>
                  </button>
                  <button className="p-4 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl flex flex-col items-center justify-center space-y-2 transition-colors border border-emerald-500/10 group">
                    <FlaskConical className="w-6 h-6 text-emerald-600 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">Lab Results</span>
                  </button>
                  <button className="p-4 bg-purple-500/10 hover:bg-purple-500/20 rounded-xl flex flex-col items-center justify-center space-y-2 transition-colors border border-purple-500/10 group">
                    <Calendar className="w-6 h-6 text-purple-600 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-purple-700 dark:text-purple-400 text-sm">Schedule</span>
                  </button>
                </div>
              </div>

              <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center justify-between">
                  <span>Pending Reviews</span>
                  <span className="text-xs bg-orange-500/10 text-orange-600 px-2 py-1 rounded-full border border-orange-500/20 uppercase tracking-wider font-bold">Urgent</span>
                </h3>
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600 font-bold text-xs">P{i}</div>
                        <div>
                          <p className="text-sm font-bold text-foreground">Lipid Profile</p>
                          <p className="text-xs text-muted-foreground">2 hrs ago</p>
                        </div>
                      </div>
                      <button className="text-xs bg-card border border-border px-3 py-1.5 rounded-md font-medium text-muted-foreground hover:bg-muted">Review</button>
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
            <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3 w-full lg:w-auto">
                  <div className="relative flex-1 w-full lg:w-96 group">
                    <Search className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="text"
                      placeholder="Search orders, patients..."
                      className="w-full pl-11 pr-4 py-3 bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 focus:bg-card transition-all duration-300 text-foreground placeholder:text-muted-foreground/50"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchTerm)}
                    />
                  </div>
                  <button
                    onClick={() => handleSearch(searchTerm)}
                    className="w-full sm:w-auto px-6 py-3 bg-foreground text-background rounded-xl hover:opacity-90 transition-all duration-300 shadow-lg shadow-foreground/10 flex items-center justify-center space-x-2 font-medium active:scale-95"
                  >
                    <Search className="w-4 h-4" />
                    <span>Search</span>
                  </button>
                </div>
                <button
                  onClick={() => setShowSearchModal(true)}
                  className="w-full sm:w-auto px-6 py-3 border border-border text-muted-foreground rounded-xl hover:bg-muted transition-all duration-300 flex items-center justify-center space-x-2 font-medium"
                >
                  <Filter className="w-4 h-4" />
                  <span>Advanced Search</span>
                </button>
              </div>

              {/* Simplified Quick Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mr-2 py-2">Quick Filters</span>
                {[
                  { key: 'all', label: 'All Orders', color: 'hover:bg-muted', active: 'bg-blue-600 text-white shadow-sm' },
                  { key: 'urgent', label: `Urgent (${labStats.urgent?.urgent_count || 0})`, color: 'text-rose-600 hover:bg-rose-500/10 border-rose-500/20', active: 'bg-rose-500 text-white shadow-sm' },
                  { key: 'pending', label: 'Pending', color: 'text-amber-600 hover:bg-amber-500/10 border-amber-500/20', active: 'bg-amber-500 text-white shadow-sm' },
                  { key: 'today', label: 'Today', color: 'text-blue-600 hover:bg-blue-500/10 border-blue-500/20', active: 'bg-blue-600 text-white shadow-sm' },
                  { key: 'completed', label: 'Completed', color: 'text-emerald-600 hover:bg-emerald-500/10 border-emerald-500/20', active: 'bg-emerald-500 text-white shadow-sm' }
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => handleQuickFilter(filter.key)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border ${activeFilter === filter.key
                      ? filter.active + ' border-transparent'
                      : 'bg-card border-border text-muted-foreground ' + filter.color
                      }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lab Orders Table */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    Lab Orders {activeFilter !== 'all' && <span className="text-blue-600 capitalize">({activeFilter})</span>}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {loading ? 'Loading...' : `${filteredOrders.length} orders found`}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
                    <tr>
                      <th className="text-left p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Order Info</th>
                      <th className="text-left p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Patient</th>
                      <th className="text-left p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Priority</th>
                      <th className="text-left p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="text-left p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Tests</th>
                      <th className="text-left p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Date</th>
                      <th className="text-right p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="text-center p-12">
                          <div className="flex flex-col items-center justify-center space-y-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            <span className="text-muted-foreground text-sm">Loading orders...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center p-12 text-muted-foreground">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <Search className="w-8 h-8 text-muted-foreground/30" />
                            <p>No lab orders found found matching your criteria</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-muted/50 transition-colors group cursor-default">
                          <td className="p-4">
                            <div className="font-semibold text-foreground mb-0.5">{order.order_number}</div>
                            <div className="text-xs text-muted-foreground break-words" title={order.clinical_notes}>{order.clinical_notes || 'No notes'}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-foreground">{order.patient_first_name} {order.patient_last_name}</div>
                            <div className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded inline-block mt-0.5">{order.patient_unique_id}</div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border ${order.priority === 'urgent' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                              order.priority === 'high' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                'bg-blue-500/10 text-blue-600 border-blue-500/20'
                              }`}>
                              {order.priority}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`flex items-center space-x-1.5 w-fit px-2.5 py-1 rounded-full text-xs font-medium ${order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-700' :
                              order.status === 'urgent' ? 'bg-rose-500/10 text-rose-700' :
                                order.status === 'pending' ? 'bg-yellow-500/10 text-yellow-700' :
                                  'bg-blue-500/10 text-blue-700'
                              }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${order.status === 'completed' ? 'bg-emerald-500' :
                                order.status === 'urgent' ? 'bg-rose-500' :
                                  order.status === 'pending' ? 'bg-yellow-500' :
                                    'bg-blue-500'
                                }`}></span>
                              <span className="capitalize">{order.status.replace('_', ' ')}</span>
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-1">
                              <span className="text-sm text-foreground">{order.test_count}</span>
                              <span className="text-xs text-muted-foreground">tests</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-foreground">{new Date(order.order_date).toLocaleDateString()}</div>
                            <div className="text-xs text-muted-foreground">{new Date(order.order_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleViewReport(order.id)}
                                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-500/10 rounded-lg transition-all"
                                title="View Report"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => alert(`Edit order ${order.order_number} - to be implemented`)}
                                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
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
            <div className="flex flex-col lg:flex-row gap-0 h-auto lg:h-[750px] bg-card rounded-xl overflow-hidden border border-border relative">
              {/* Left Column: Search & List */}
              <style dangerouslySetInnerHTML={{
                __html: `
                    @media (min-width: 1024px) {
                      .resizable-sidebar { width: ${sidebarWidth}px !important; min-width: 280px !important; }
                    }
                  `}} />
              <div
                style={{ width: '100%', maxWidth: '100%' }}
                className="flex flex-col h-auto lg:h-full bg-card resizable-sidebar transition-none border-b lg:border-b-0 lg:border-r border-border w-full lg:w-auto flex"
              >
                {/* Search Area */}
                <div className="p-4 border-b border-border bg-muted/50 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search patients..."
                      className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 text-foreground"
                      value={patientSearchTerm}
                      onChange={(e) => {
                        setPatientSearchTerm(e.target.value);
                        fetchPatients(e.target.value);
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-medium px-1">
                    <span>{patients.length} Results</span>
                    <span className="flex items-center text-blue-600 cursor-pointer hover:text-blue-700 transition-colors"><Filter className="w-3 h-3 mr-1" /> Filter</span>
                  </div>
                </div>

                {/* Simplified Patient List */}
                <div className="flex-1 overflow-y-auto scrollbar-thin divide-y divide-border/50">
                  {patients.map((patient) => {
                    const isActive = selectedPatient?.id === patient.id;
                    return (
                      <div
                        key={patient.id}
                        onClick={() => { setSelectedPatient(patient); setMobileShowDetails(true); }}
                        className={`p-4 cursor-pointer transition-all duration-200 group ${isActive
                          ? 'bg-blue-50/50 dark:bg-blue-900/10'
                          : 'hover:bg-muted/50'
                          }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isActive ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 'bg-muted text-muted-foreground'
                            }`}>
                            <User className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className={`text-sm font-semibold break-words ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-foreground'}`}>{patient.first_name} {patient.last_name}</h4>
                              {patient.status === 'urgent' && <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0"></div>}
                            </div>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider opacity-70 break-all">ID: {patient.unique_id}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {patients.length === 0 && (
                    <div className="text-center py-8 px-4">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-2">
                        <Search className="w-5 h-5 text-muted-foreground/30" />
                      </div>
                      <p className="text-sm text-muted-foreground">No patients found</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Resize Handle */}
              <div
                onMouseDown={startResizing}
                className="hidden lg:flex w-1 bg-transparent hover:bg-blue-400/50 group cursor-col-resize items-center justify-center transition-all duration-200 z-10 relative"
              >
                <div className="absolute inset-y-0 left-1/2 -ml-px w-px bg-border group-hover:bg-blue-400/50 transition-colors"></div>
              </div>

              {/* Right Column: Details */}
              <div className="flex-1 overflow-x-hidden h-auto lg:h-full overflow-y-auto scrollbar-thin rounded-xl border-t lg:border-t-0 border-border bg-card p-1 custom-scrollbar min-w-0 flex flex-col">
                {selectedPatient && (
                  <div className="flex-1 p-1">
                    {/* Simplified Patient Overview */}
                    <div className="bg-card rounded-2xl border border-border p-4 md:p-6 mb-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center space-x-4 min-w-0">
                          <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                            <User className="w-6 h-6 md:w-8 md:h-8" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="text-lg md:text-xl font-bold text-foreground break-words">{selectedPatient.first_name || selectedPatient.name} {selectedPatient.last_name || ''}</h3>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20 font-bold uppercase tracking-wider whitespace-nowrap">
                                {selectedPatient.status || 'Stable'}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <span>ID: <span className="text-foreground font-medium break-all">{selectedPatient.unique_id || selectedPatient.id}</span></span>
                              <span>Age: <span className="text-foreground font-medium">{selectedPatient.age || 'N/A'}</span></span>
                              <span className="flex items-center space-x-1 whitespace-nowrap">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                <span className="text-emerald-600 font-medium">Active</span>
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => setShowNewOrderModal(true)} className="flex-1 md:flex-none px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all text-sm font-bold active:scale-95 shadow-sm">
                            New Order
                          </button>
                          <button className="p-2.5 border border-border text-muted-foreground rounded-xl hover:bg-muted hover:text-foreground transition-all bg-card transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Lab Reports Management */}
                    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden mb-6">
                      <div className="border-b border-border bg-muted/30 overflow-x-auto scrollbar-hide">
                        <nav className="flex space-x-1 px-4 pt-2 min-w-max">
                          {[
                            { id: 'new-reports', label: 'New Reports', count: 3, color: 'bg-rose-500' },
                            { id: 'processing', label: 'Processing', count: 2, color: 'bg-amber-500' },
                            { id: 'history', label: 'Report History', count: 15, color: 'bg-blue-500' },
                            { id: 'prescriptions', label: 'Prescriptions', count: 8, color: 'bg-emerald-500' }
                          ].map((tab) => (
                            <button
                              key={tab.id}
                              onClick={() => setSelectedSubTab(tab.id)}
                              className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-all duration-300 font-medium whitespace-nowrap text-sm ${selectedSubTab === tab.id
                                ? 'border-blue-600 text-blue-600 bg-card rounded-t-lg'
                                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted rounded-t-lg'
                                }`}
                            >
                              <span>{tab.label}</span>
                              {tab.count && (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${selectedSubTab === tab.id ? 'bg-blue-500/10 text-blue-600' : 'bg-muted text-muted-foreground'}`}>
                                  {tab.count}
                                </span>
                              )}
                            </button>
                          ))}
                        </nav>
                      </div>

                      <div className="p-4 md:p-8">
                        <div className="space-y-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h4 className="text-lg font-bold text-foreground flex items-center space-x-3">
                              <span className="capitalize">{selectedSubTab.replace('-', ' ')}</span>
                              {selectedSubTab === 'new-reports' && (
                                <span className="text-[10px] bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded-full border border-rose-500/20 font-medium">Requires Attention</span>
                              )}
                            </h4>
                          </div>

                          <div className="bg-card rounded-2xl border border-border overflow-hidden">
                            {selectedSubTab === 'new-reports' && [
                              { id: 'R001', testName: 'Comprehensive Metabolic Panel', date: '2024-12-10', status: 'Urgent', priority: 'High', abnormal: true },
                              { id: 'R002', testName: 'Lipid Profile Complete', date: '2024-12-09', status: 'Processing', priority: 'Normal', abnormal: false },
                              { id: 'R003', testName: 'Complete Blood Count', date: '2024-12-08', status: 'Done', priority: 'Normal', abnormal: true }
                            ].map((report, index, array) => (
                              <div
                                key={report.id}
                                onClick={() => { setSelectedReport({ order: { order_number: report.id, patient_first_name: selectedPatient.first_name, patient_last_name: selectedPatient.last_name, patient_unique_id: selectedPatient.unique_id, patient_gender: 'M', patient_dob: '1990-01-01', order_date: report.date, priority: report.priority.toLowerCase(), status: report.status.toLowerCase(), doctor_first_name: 'Sarah', doctor_last_name: 'Johnson' }, items: [{ test_name: report.testName, category_name: 'General', result_text: '185', unit: 'mg/dL', reference_range: '70-99', result_status: report.abnormal ? 'abnormal' : 'normal', abnormal_flag: report.abnormal }], file_name: report.id === 'R001' ? '1764353980932-Lecture-Slide-16-ODE-Solving-Method.pdf' : report.id === 'R002' ? '1764354095279-factory.png' : '1770451443166-example-cfg.pdf', file_type: (report.id === 'R001' || report.id === 'R003') ? 'pdf' : 'image' }); setShowReportModal(true); }}
                                className={`p-5 md:p-6 hover:bg-muted/50 transition-all cursor-pointer group ${index !== array.length - 1 ? 'border-b border-border' : ''}`}
                              >
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center space-x-3 md:space-x-4 min-w-0">
                                    <div className={`p-2 md:p-2.5 rounded-full flex-shrink-0 ${report.status === 'Urgent' ? 'bg-rose-500/10 text-rose-500' : 'bg-blue-500/10 text-blue-600'}`}>
                                      <FlaskConical className="w-4 h-4 md:w-5 md:h-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <h5 className="font-semibold text-sm md:text-base text-foreground group-hover:text-blue-600 transition-colors break-words">{report.testName}</h5>
                                      <p className="text-[10px] md:text-xs text-muted-foreground break-all">{report.date} • ID: #{report.id}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {report.abnormal && <span className="hidden sm:inline-block text-[9px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 font-bold border border-rose-500/20">ABNORMAL</span>}
                                    <span className={`text-[9px] md:text-[10px] px-2 py-0.5 rounded-full text-white font-bold whitespace-nowrap ${report.status === 'Urgent' ? 'bg-red-500' : report.status === 'Processing' ? 'bg-amber-500' : 'bg-green-500'}`}>
                                      {report.status}
                                    </span>
                                    <Eye className="w-4 h-4 text-muted-foreground/30 group-hover:text-blue-600 transition-colors ml-1" />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {selectedSubTab === 'processing' && (
                            <div className="bg-card rounded-2xl border border-border overflow-hidden">
                              {[
                                { id: 'R004', testName: 'Thyroid Stimulating Hormone', date: '2024-12-11', status: 'Processing', priority: 'Normal', abnormal: false },
                                { id: 'R005', testName: 'Vitamin D, 25-Hydroxy', date: '2024-12-11', status: 'Processing', priority: 'Normal', abnormal: false }
                              ].map((report, index, array) => (
                                <div key={report.id} className={`p-5 md:p-6 hover:bg-muted/50 transition-all cursor-default group ${index !== array.length - 1 ? 'border-b border-border' : ''}`}>
                                  <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center space-x-3 md:space-x-4 min-w-0">
                                      <div className="p-2 md:p-2.5 rounded-full flex-shrink-0 bg-amber-500/10 text-amber-600">
                                        <Clock className="w-4 h-4 md:w-5 md:h-5" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <h5 className="font-semibold text-sm md:text-base text-foreground group-hover:text-blue-600 transition-colors break-words">{report.testName}</h5>
                                        <p className="text-[10px] md:text-xs text-muted-foreground break-all">{report.date} • ID: #{report.id}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[9px] md:text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold whitespace-nowrap">
                                        {report.status}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              <div className="p-4 bg-muted/20 border-t border-border text-center">
                                <p className="text-xs text-muted-foreground italic">Estimated completion: 2-4 hours</p>
                              </div>
                            </div>
                          )}

                          {selectedSubTab === 'history' && (
                            <div className="py-12 text-center">
                              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Calendar className="w-6 h-6 text-blue-600" />
                              </div>
                              <h5 className="font-bold text-foreground text-sm">15 Historical Reports</h5>
                              <p className="text-xs text-muted-foreground">Select "Recent Reports" to view older data.</p>
                            </div>
                          )}

                          {selectedSubTab === 'prescriptions' && (
                            <div className="py-12 text-center">
                              <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Plus className="w-6 h-6 text-emerald-600" />
                              </div>
                              <h5 className="font-bold text-foreground text-sm">8 Active Prescriptions</h5>
                              <p className="text-xs text-muted-foreground">Manage medications and renewals here.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {!selectedPatient && (
                  <div className="bg-card border-2 border-dashed border-border rounded-2xl p-8 md:p-16 text-center shadow-sm flex-1 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                      <FlaskConical className="w-8 h-8 text-muted-foreground/40" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Select a Patient to Begin</h3>
                    <p className="text-sm text-muted-foreground mb-8 max-w-xs mx-auto">Choose a patient to view their comprehensive lab reports, prescriptions, and clinical data.</p>
                    <button
                      onClick={() => document.querySelector('input[placeholder*="Search patients"]')?.focus()}
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center space-x-2 font-medium active:scale-95"
                    >
                      <Search className="w-5 h-5" />
                      <span>Search Patient</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Simple New Test Order Modal */}
      {
        showNewOrderModal && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl p-8 w-full max-w-md shadow-2xl transform transition-all border border-border">
              <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center">
                <div className="bg-blue-500/10 p-2 rounded-lg mr-3">
                  <Plus className="w-5 h-5 text-blue-600" />
                </div>
                New Test Order
              </h3>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Patient ID</label>
                  <input
                    type="text"
                    placeholder="Enter patient ID"
                    className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all font-medium text-foreground placeholder:text-muted-foreground/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Clinical Notes</label>
                  <textarea
                    placeholder="Enter clinical notes"
                    className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all font-medium min-h-[100px] text-foreground placeholder:text-muted-foreground/50"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Priority</label>
                  <select className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all font-medium text-foreground">
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
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:opacity-90 transition-all shadow-lg shadow-blue-500/20 font-bold active:scale-95"
                >
                  Create Order
                </button>
                <button
                  onClick={() => setShowNewOrderModal(false)}
                  className="px-6 py-3 border border-border text-foreground rounded-xl hover:bg-muted transition-all font-medium bg-card"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Lab Report Viewing Modal */}
      {
        showReportModal && selectedReport && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl w-full max-w-5xl h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-border">
              {/* Modal Header */}
              <div className="px-8 py-6 border-b border-border flex justify-between items-center bg-muted/30">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-500/10 p-3 rounded-xl">
                    <FlaskConical className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Lab Report Details</h3>
                    <p className="text-sm text-muted-foreground font-medium">Order #{selectedReport.order.order_number}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
                >
                  <span className="sr-only">Close</span>
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-muted/30 scrollbar-thin">
                {/* Report Header Info */}
                <div className="bg-card rounded-xl border border-border p-6 shadow-sm mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Patient Information</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Name</span>
                          <span className="font-semibold text-foreground">{selectedReport.order.patient_first_name} {selectedReport.order.patient_last_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">ID</span>
                          <span className="font-mono text-foreground bg-muted px-2 py-0.5 rounded text-xs">{selectedReport.order.patient_unique_id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Gender/DOB</span>
                          <span className="font-medium text-foreground">{selectedReport.order.patient_gender} • {selectedReport.order.patient_dob ? new Date(selectedReport.order.patient_dob).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Order Details</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Date</span>
                          <span className="font-medium text-foreground">{new Date(selectedReport.order.order_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Priority</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${selectedReport.order.priority === 'urgent' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                            selectedReport.order.priority === 'high' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                              'bg-blue-500/10 text-blue-600 border-blue-500/20'
                            }`}>
                            {selectedReport.order.priority}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Status</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${selectedReport.order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                            'bg-blue-500/10 text-blue-600 border-blue-500/20'
                            }`}>
                            {selectedReport.order.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Physician</span>
                          <span className="font-medium text-foreground">Dr. {selectedReport.order.doctor_first_name} {selectedReport.order.doctor_last_name}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedReport.order.clinical_notes && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Clinical Notes</h4>
                      <p className="text-foreground bg-muted/30 p-4 rounded-xl text-sm leading-relaxed border border-border italic">
                        "{selectedReport.order.clinical_notes}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Document Preview Section */}
                <div className="bg-muted/10 border-y border-border p-4 md:p-8">
                  <div className="max-w-4xl mx-auto">
                    <div className="bg-card rounded-2xl border border-border shadow-xl overflow-hidden min-h-[500px] flex flex-col">
                      <div className="bg-muted/50 px-6 py-4 border-b border-border flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${selectedReport.file_type === 'pdf' ? 'bg-rose-500/10 text-rose-600' : 'bg-blue-500/10 text-blue-600'}`}>
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-foreground truncate max-w-[200px] md:max-w-xs">{selectedReport.file_name}</div>
                            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{selectedReport.file_type === 'pdf' ? 'PDF Document' : 'Microscopy/Image'}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <a
                            href={`${API_CONFIG.BASE_URL}/api/files/${selectedReport.file_name}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-card rounded-lg transition-all"
                            title="Open in new tab"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>

                      <div className="flex-1 bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4 md:p-8">
                        {selectedReport.file_type === 'pdf' ? (
                          <iframe
                            src={`${API_CONFIG.BASE_URL}/api/files/${selectedReport.file_name}#view=FitH&toolbar=1`}
                            className="w-full min-h-[500px] h-full rounded-lg shadow-inner bg-white border-none"
                            title="Lab Report PDF Preview"
                            loading="lazy"
                          />
                        ) : (
                          <div className="relative group">
                            <img
                              src={`${API_CONFIG.BASE_URL}/api/files/${selectedReport.file_name}`}
                              alt="Lab Report Result"
                              className="max-sm:w-full max-h-[600px] object-contain rounded-lg shadow-2xl bg-white"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 pointer-events-none rounded-lg">
                              <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-bold text-slate-900 shadow-xl border border-white/20 flex items-center space-x-2">
                                <Eye className="w-3 h-3 text-blue-600" />
                                <span>High-Resolution Preview</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Summary/Notes below preview */}
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-2">Findings Summary</span>
                        <p className="text-sm text-foreground leading-relaxed">
                          Values within normal limits except for slightly elevated glucose and markers consistent with the primary diagnosis.
                        </p>
                      </div>
                      <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-2">Technician Notes</span>
                        <p className="text-sm text-foreground italic">
                          "Specimen was clear. All calibrations verified."
                        </p>
                      </div>
                      <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-2">Review Status</span>
                          <div className="flex items-center space-x-2 text-emerald-600">
                            <span className="text-[10px] text-muted-foreground">Digital ID: {selectedReport.order.order_number}-SEC-01</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-8 py-6 border-t border-border bg-muted/30 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Digital Signature Verified</span>
                </div>
                <div className="flex gap-4">
                  <a
                    href={`${API_CONFIG.BASE_URL}/api/files/${selectedReport.file_name}`}
                    download={selectedReport.file_name}
                    onClick={() => toast.success('Your report download has started.')}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:opacity-90 transition-all shadow-lg shadow-blue-500/20 font-bold flex items-center space-x-2 active:scale-95"
                  >
                    <DownloadIcon className="w-4 h-4" />
                    <span>Download PDF</span>
                  </a>
                  {selectedReport.order.status !== 'completed' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedReport.order.id, 'completed')}
                      className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:opacity-90 transition-all shadow-lg shadow-emerald-500/20 font-bold flex items-center space-x-2 active:scale-95"
                    >
                      <Check className="w-4 h-4" />
                      <span>Mark as Done</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Advanced Search Modal */}
      {
        showSearchModal && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl p-8 w-full max-w-lg shadow-2xl transition-all border border-border">
              <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center">
                <div className="bg-blue-500/10 p-2 rounded-lg mr-3">
                  <Filter className="w-5 h-5 text-blue-600" />
                </div>
                Advanced Search
              </h3>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Patient Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground/50" />
                    <input
                      type="text"
                      placeholder="Enter patient name"
                      className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all font-medium text-foreground placeholder:text-muted-foreground/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Order Number</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground/50" />
                    <input
                      type="text"
                      placeholder="Enter order number"
                      className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all font-medium text-foreground placeholder:text-muted-foreground/50"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Status</label>
                    <select className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all font-medium text-foreground">
                      <option value="">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Priority</label>
                    <select className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all font-medium text-foreground">
                      <option value="">All Priorities</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Date From</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all font-medium text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Date To</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all font-medium text-foreground"
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
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:opacity-90 transition-all shadow-lg shadow-blue-500/20 font-bold active:scale-95 flex items-center justify-center space-x-2"
                >
                  <Search className="w-5 h-5" />
                  <span>Search Orders</span>
                </button>
                <button
                  onClick={() => setShowSearchModal(false)}
                  className="px-6 py-3 border border-border text-foreground rounded-xl hover:bg-muted transition-all font-medium bg-card"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* AI Chat Floating Button */}
      {
        selectedPatient && (
          <button
            onClick={() => setShowAIChatModal(true)}
            className="fixed bottom-8 right-8 z-40 w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl hover:scale-110 hover:shadow-blue-500/50 transition-all duration-300 flex items-center justify-center group"
            aria-label="Open Clinical AI Assistant"
          >
            <div className="absolute inset-0 bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Bot className="w-8 h-8" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500"></span>
            </span>
          </button>
        )
      }

      {/* AI Chat Modal */}
      {
        showAIChatModal && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] rounded-2xl w-full max-w-2xl h-[90vh] md:h-[650px] shadow-2xl flex flex-col relative overflow-hidden ring-1 ring-white/10">
              {/* Background Effects */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl -ml-12 -mb-12 pointer-events-none"></div>

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
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white/5 backdrop-blur-md border border-white/10 text-slate-100 rounded-bl-none'
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
        )
      }
    </div>
  );
});

export default LabratoryTab;

import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { API_CONFIG } from "../../config/api";
import { authFetch } from "../../lib/authToken";
import { toast } from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";

// Import Refactored Components
import LabratoryHeader from './LabratoryComponents/LabratoryHeader';
import LabratoryStats from './LabratoryComponents/LabratoryStats';
import LabratoryOverview from './LabratoryComponents/LabratoryOverview';
import LabratoryOrders from './LabratoryComponents/LabratoryOrders';
import PatientConsole from './LabratoryComponents/PatientConsole';
import NewOrderModal from './LabratoryComponents/NewOrderModal';
import LabOrderModal from './LabratoryComponents/LabOrderModal';
import AIChatAssistant from './LabratoryComponents/AIChatAssistant';
import { labApi } from '../../lib/api';

const LabratoryTab = memo(() => {
  // --- STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  // Doctor info from auth context (logged-in user)
  const { user: doctor } = useAuth();
  const doctorId = doctor?.id;

  const [labStats, setLabStats] = useState({
    today: { total_today: 0, pending_today: 0, processing_today: 0, completed_today: 0 },
    urgent: { urgent_count: 0 },
    unreviewed: { unreviewed_count: 0 }
  });

  // Orders State
  const [, setRecentOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  // Patient Console State
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [sidebarWidth, setSidebarWidth] = useState(384);
  const [mobileShowDetails, setMobileShowDetails] = useState(false);
  const [selectedSubTab, setSelectedSubTab] = useState('new-reports');

  // Modals Visibility
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  // AI Chat State
  const [showAIChatModal, setShowAIChatModal] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Sidebar resizing logic
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  // --- REFS & SCROLLING ---
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (showAIChatModal) scrollToBottom();
  }, [chatMessages, showAIChatModal]);

  // --- DATA FETCHING ---
  const fetchLabStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authFetch(`${API_CONFIG.BASE_URL}/api/lab/stats`);
      const result = await response.json();
      if (result.success) setLabStats(result.data);
    } catch (error) {
      console.error('Error fetching lab stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecentOrders = useCallback(async () => {
    try {
      const response = await authFetch(`${API_CONFIG.BASE_URL}/api/lab/recent?limit=10`);
      const result = await response.json();
      if (result.success) {
        setRecentOrders(result.data);
        setFilteredOrders(result.data);
      }
    } catch (error) {
      console.error('Error fetching recent orders:', error);
    }
  }, []);

  const fetchPatients = useCallback(async (searchTerm = '') => {
    try {
      const url = searchTerm ?
        `/api/lab/patients?search=${encodeURIComponent(searchTerm)}&limit=5` :
        '/api/lab/patients?limit=5';
      const response = await authFetch(`${API_CONFIG.BASE_URL}${url}`);
      const result = await response.json();
      if (result.success) setPatients(result.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  }, []);

  useEffect(() => {
    fetchLabStats();
    fetchRecentOrders();
    fetchPatients();
  }, [fetchLabStats, fetchRecentOrders, fetchPatients]);

  // --- EVENT HANDLERS ---
  const handleSearch = useCallback(async (term) => {
    try {
      setLoading(true);
      const response = await authFetch(`${API_CONFIG.BASE_URL}/api/lab/search?search=${encodeURIComponent(term)}&limit=20`);
      const result = await response.json();
      if (result.success) setFilteredOrders(result.data);
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
      if (filterType === 'all') {
        const response = await authFetch(`${API_CONFIG.BASE_URL}/api/lab/recent?limit=20`);
        const result = await response.json();
        if (result.success) setFilteredOrders(result.data);
        return;
      }
      const response = await authFetch(`${API_CONFIG.BASE_URL}/api/lab/filter?filter_type=${filterType}`);
      const result = await response.json();
      if (result.success) setFilteredOrders(result.data);
    } catch (error) {
      console.error('Error filtering orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = async (orderId) => {
    try {
      setLoading(true);
      const response = await authFetch(`${API_CONFIG.BASE_URL}/api/lab/report/${orderId}`);
      const result = await response.json();
      if (result.success) {
        setSelectedReport(result.data);
        setShowReportModal(true);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      toast.error('Error fetching report');
    } finally {
      setLoading(false);
    }
  };
  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setLoading(true);
      const response = await authFetch(`${API_CONFIG.BASE_URL}/api/lab/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success(`Order status updated to ${newStatus}`);
        const updater = (orders) => orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
        setFilteredOrders(prev => updater(prev));
        setRecentOrders(prev => updater(prev));
        if (selectedReport?.order.id === orderId) {
          setSelectedReport(prev => ({ ...prev, order: { ...prev.order, status: newStatus } }));
        }
        fetchLabStats();
      } else {
        toast.error(result.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyReport = async (orderId) => {
    try {
      setLoading(true);
      if (!doctorId) {
        toast.error('Doctor authentication required');
        return;
      }
      const result = await labApi.verifyOrder(orderId, doctorId);
      if (result.success) {
        toast.success('Report verified and signed off');
        // Close modal or update its state
        setShowReportModal(false);
        // Refresh everything
        fetchLabStats();
        fetchRecentOrders();
      } else {
        toast.error(result.error || 'Failed to verify report');
      }
    } catch (error) {
      console.error('Error verifying report:', error);
      toast.error('An error occurred during verification');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderCreated = useCallback(() => {
    fetchLabStats();
    fetchRecentOrders();
    if (selectedPatient) {
      setSelectedPatient(prev => ({ ...prev }));
      setSelectedSubTab('processing');
    }
  }, [selectedPatient, fetchLabStats, fetchRecentOrders]);

  // Start a fresh conversation for each patient so one patient's context never reaches another's.
  // The greeting is local UI only and is not sent to the model.
  useEffect(() => {
    if (!selectedPatient?.id) return;
    setChatMessages([{
      id: `greeting-${selectedPatient.id}`,
      sender: 'ai',
      local: true,
      text: `Hello! I'm your Clinical AI Assistant. Ask me about ${selectedPatient.first_name || 'this patient'}'s lab results: a summary of recent reports, trends over time, or values that need attention.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  }, [selectedPatient?.id, selectedPatient?.first_name]);

  // AI Chat Handlers
  const processMessage = async (text) => {
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    try {
      if (!selectedPatient?.id) {
        throw new Error("No patient selected");
      }

      const response = await authFetch(`${API_CONFIG.BASE_URL}/api/lab/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          message: text,
          // Last 10 real exchanges for context; skip the local greeting and error notices
          history: chatMessages.filter(msg => !msg.local && !msg.error).slice(-10)
        }),
      });

      const result = await response.json();

      setChatMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: result.success ? result.reply : (result.error || "I encountered an error analyzing the results."),
        error: !result.success,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (error) {
      console.error("AI Chat Error:", error);
      setChatMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: "Sorry, I couldn't connect to the AI service. Please try again later.",
        error: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!chatInput.trim()) return;
    processMessage(chatInput);
  };

  // Resizing Handlers
  const handleMouseMove = useCallback((e) => {
    if (!isResizing.current) return;
    const delta = e.clientX - startX.current;
    setSidebarWidth(Math.min(Math.max(280, startWidth.current + delta), 600));
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'default';
  }, [handleMouseMove]);

  const startResizing = useCallback((e) => {
    isResizing.current = true;
    startX.current = e.clientX;
    startWidth.current = sidebarWidth;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'col-resize';
  }, [sidebarWidth, handleMouseMove, stopResizing]);

  // --- RENDERING ---
  return (
    <div className="space-y-8 p-0 min-h-screen bg-background text-foreground selection:bg-blue-500/30">
      <LabratoryHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewOrder={() => setShowNewOrderModal(true)}
      />

      <div className="px-6 space-y-8 pb-12">
        {activeTab === 'overview' && (
          <>
            <LabratoryStats labStats={labStats} loading={loading} />
            <LabratoryOverview 
              onNavigateToPatients={() => setActiveTab('patients')} 
              onNavigateToOrders={(filter) => {
                if (filter) handleQuickFilter(filter);
                setActiveTab('orders');
              }}
              onViewReport={handleViewReport}
            />
          </>
        )}

        {activeTab === 'orders' && (
          <LabratoryOrders
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            handleSearch={handleSearch}
            labStats={labStats}
            activeFilter={activeFilter}
            handleQuickFilter={handleQuickFilter}
            loading={loading}
            filteredOrders={filteredOrders}
            handleViewReport={handleViewReport}
          />
        )}

        {activeTab === 'patients' && (
          <PatientConsole
            patients={patients}
            selectedPatient={selectedPatient}
            setSelectedPatient={setSelectedPatient}
            mobileShowDetails={mobileShowDetails}
            setMobileShowDetails={setMobileShowDetails}
            patientSearchTerm={patientSearchTerm}
            setPatientSearchTerm={setPatientSearchTerm}
            fetchPatients={fetchPatients}
            sidebarWidth={sidebarWidth}
            startResizing={startResizing}
            setShowNewOrderModal={setShowNewOrderModal}
            selectedSubTab={selectedSubTab}
            setSelectedSubTab={setSelectedSubTab}
            handleViewReport={handleViewReport}
            setSelectedReport={setSelectedReport}
            setShowReportModal={setShowReportModal}
            doctor={doctor}
            doctorId={doctorId}
          />
        )}
      </div>

      {/* Modals & Overlays */}
      {showNewOrderModal && (
        <NewOrderModal 
          setShowNewOrderModal={setShowNewOrderModal} 
          selectedPatient={selectedPatient}
          doctorId={doctorId}
          onSuccess={handleOrderCreated}
        />
      )}
      {showReportModal && (
        <LabOrderModal
          selectedReport={selectedReport}
          setShowReportModal={setShowReportModal}
          handleStatusUpdate={handleStatusUpdate}
          onVerify={handleVerifyReport}
          onSuccess={() => {
            fetchLabStats();
            fetchRecentOrders();
            // Refresh current report details
            if (selectedReport?.order?.id) {
              handleViewReport(selectedReport.order.id);
            }
          }}
        />
      )}

      <AIChatAssistant
        selectedPatient={selectedPatient}
        showAIChatModal={showAIChatModal}
        setShowAIChatModal={setShowAIChatModal}
        chatMessages={chatMessages}
        isTyping={isTyping}
        chatInput={chatInput}
        setChatInput={setChatInput}
        handleSendMessage={handleSendMessage}
        sendQuickMessage={processMessage}
        chatEndRef={chatEndRef}
      />
    </div>
  );
});

export default LabratoryTab;

import React, { useState, useEffect, useRef } from "react";
import { 
  User, 
  Search, 
  Phone, 
  Video, 
  MoreVertical, 
  Send, 
  Paperclip, 
  Mic, 
  Smile, 
  Image, 
  File, 
  Check, 
  CheckCheck,
  Clock,
  ArrowLeft,
  Settings,
  Archive,
  Pin,
  X,
  Upload,
  Camera,
  Download
} from "lucide-react";
import { chatApi } from '../../lib/chatApi';
import useWebSocket from '../../hooks/useWebSocket';
import { useDoctor } from '../../hooks/useDoctor';
import { fileUploader, createDropZone } from '../../utils/fileUpload';
import FileMessage from '../../components/FileMessage';

const ChatTab = () => {
  const { doctor } = useDoctor();
  
  // WebSocket connection
  const webSocket = useWebSocket();
  
  // Refs - must be called before any conditional logic
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  
  // State management - all useState hooks together
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({});
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showChatList, setShowChatList] = useState(true);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  
  // New file upload states
  const [uploadProgress, setUploadProgress] = useState({});
  const [filePreview, setFilePreview] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);

  // User search and new chat states
  const [searchResults, setSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // All useEffect hooks must be called in the same order every render
  // Initialize WebSocket and fetch data
  useEffect(() => {
    if (initialized) return; // Prevent multiple initialization
    
    console.log('ChatTab: Doctor data:', doctor);
    console.log('ChatTab: Doctor ID:', doctor?.id);
    console.log('ChatTab: Doctor UniqueId:', doctor?.uniqueId);
    
    // Use unique_id for chat API calls (DOC-001, DOC-002, etc.)
    const effectiveDoctor = {
      id: doctor?.uniqueId || 'DOC-001', // Use uniqueId from auth, fallback to DOC-001
      name: doctor?.name || 'Dr. Test'
    };
    
    console.log('ChatTab: Using effective doctor:', effectiveDoctor);
    
    // Connect to WebSocket
    webSocket.connect({
      userId: effectiveDoctor.id,
      userType: 'doctor',
      userName: effectiveDoctor.name
    });
    
    // Fetch conversations with the effective ID
    fetchConversationsWithTempId(effectiveDoctor.id);
    setInitialized(true);
    
    return () => {
      webSocket.disconnect();
    };
  }, []); // Empty dependency array to run only once
  
  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, selectedConversation]);

  // Fetch messages when conversation is selected
  useEffect(() => {
    if (selectedConversation && !loading) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation, loading]);

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setShowChatList(true);
      }
    };

    const handleClickOutside = (event) => {
      if (!event.target.closest('.emoji-picker') && !event.target.closest('.emoji-button')) {
        setShowEmojiPicker(false);
      }
      if (!event.target.closest('.attachment-menu') && !event.target.closest('.attachment-button')) {
        setShowAttachmentMenu(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Setup drag and drop zone
  useEffect(() => {
    if (dropZoneRef.current && selectedConversation) {
      const cleanup = createDropZone(dropZoneRef.current, handleFileDrop);
      
      // Add drag state handlers
      const handleDragEnter = () => setIsDragging(true);
      const handleDragLeave = (e) => {
        if (!dropZoneRef.current?.contains(e.relatedTarget)) {
          setIsDragging(false);
        }
      };
      
      if (dropZoneRef.current) {
        dropZoneRef.current.addEventListener('dragenter', handleDragEnter);
        dropZoneRef.current.addEventListener('dragleave', handleDragLeave);
      }
      
      return () => {
        cleanup();
        if (dropZoneRef.current) {
          dropZoneRef.current.removeEventListener('dragenter', handleDragEnter);
          dropZoneRef.current.removeEventListener('dragleave', handleDragLeave);
        }
      };
    }
  }, [selectedConversation]);

  // Fetch conversations from API
  const fetchConversations = async () => {
    // Use unique_id for chat API calls (DOC-001, DOC-002, etc.)
    const doctorId = doctor?.uniqueId || doctor?.id || 'DOC-001';
    if (!doctorId) return;
    
    try {
      setLoading(true);
      const data = await chatApi.getConversations(doctorId, 'doctor');
      console.log('Conversations data (regular):', data);
      console.log('Using doctor ID for conversations:', doctorId);
      
      // Check if data and conversations exist
      if (!data || !data.conversations) {
        console.error('Invalid response structure:', data);
        setConversations([]);
        return;
      }
      
      // Transform API data to match component state
      const transformedConversations = data.conversations.map(conv => ({
        id: conv.id,
        name: conv.other_participant?.name || conv.name || 'Unknown',
        avatar: null,
        lastMessage: conv.last_message || 'No messages yet',
        lastMessageTime: formatTime(conv.last_message_time),
        unreadCount: conv.unread_count || 0,
        isOnline: conv.other_participant?.is_online || false,
        isPinned: conv.is_pinned || false,
        isTyping: false,
        lastSeen: formatTime(conv.other_participant?.last_seen),
        otherParticipant: conv.other_participant
      }));
      
      setConversations(transformedConversations);
      
      // Select first conversation if none selected
      if (transformedConversations.length > 0 && !selectedConversation) {
        setSelectedConversation(transformedConversations[0].id);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Temporary function for testing without authentication
  const fetchConversationsWithTempId = async (doctorId) => {
    try {
      setLoading(true);
      console.log('Fetching conversations with temp doctor ID:', doctorId);
      
      const data = await chatApi.getConversations(doctorId, 'doctor');
      console.log('Conversations data:', data);
      console.log('Data type:', typeof data);
      console.log('Data conversations:', data?.conversations);
      
      // Check if data and conversations exist
      if (!data || !data.conversations) {
        console.error('Invalid response structure:', data);
        setConversations([]);
        return;
      }
      
      // Transform API data to match component state
      const transformedConversations = data.conversations.map(conv => ({
        id: conv.id,
        name: conv.other_participant?.name || conv.name || 'Unknown',
        avatar: null,
        lastMessage: conv.last_message || 'No messages yet',
        lastMessageTime: formatTime(conv.last_message_time),
        unreadCount: conv.unread_count || 0,
        isOnline: conv.other_participant?.is_online || false,
        isPinned: conv.is_pinned || false,
        isTyping: false,
        lastSeen: formatTime(conv.other_participant?.last_seen),
        otherParticipant: conv.other_participant
      }));
      
      setConversations(transformedConversations);
      
      // Select first conversation if none selected
      if (transformedConversations.length > 0 && !selectedConversation) {
        setSelectedConversation(transformedConversations[0].id);
      }
    } catch (error) {
      console.error('Error fetching conversations with temp ID:', error);
      setConversations([]); // Set empty array to stop loading
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for a conversation
  const fetchMessages = async (conversationId) => {
    // Use unique_id for chat API calls (DOC-001, DOC-002, etc.)
    const doctorId = doctor?.uniqueId || 'DOC-001';
    console.log('fetchMessages - Using doctor ID:', doctorId);
    
    if (!doctorId) return;
    
    try {
      const data = await chatApi.getMessages(conversationId, doctorId, 'doctor');
      
      // Check if data and messages exist
      if (!data || !data.messages) {
        console.error('Invalid messages response structure:', data);
        return;
      }
      
      // Transform API messages
      const transformedMessages = data.messages.map(msg => ({
        id: msg.id,
        senderId: msg.sender_id,
        senderName: msg.sender_name,
        content: msg.content,
        timestamp: formatTime(msg.created_at),
        type: msg.message_type || 'text',
        status: msg.delivery_status || 'sent',
        fileUrl: msg.file_url,
        fileName: msg.file_name,
        fileSize: msg.file_size,
        replyTo: msg.reply_to,
        replyContent: msg.reply_content,
        replySenderName: msg.reply_sender_name
      }));
      
      setMessages(prev => ({
        ...prev,
        [conversationId]: transformedMessages
      }));
      
      // Join conversation room for real-time updates
      webSocket.joinConversation(conversationId);
      
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    // If the date is invalid
    if (isNaN(date.getTime())) {
      console.warn('Invalid timestamp:', timestamp);
      return '';
    }
    
    // Show exact time if within the last 24 hours
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true // Show AM/PM
      });
    } else if (diffInHours < 48) {
      return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`;
    } else if (diffInHours < 168) { // Within a week
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return `${dayNames[date.getDay()]} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`;
    } else {
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      });
    }
  };

  // Helper functions
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Get current conversation
  const currentConversation = conversations.find(conv => conv.id === selectedConversation);
  const currentMessages = selectedConversation ? (messages[selectedConversation] || []) : [];
  
  // Show loading if no doctor data yet and not using temp fallback
  const effectiveDoctorId = doctor?.uniqueId || 'DOC-001';
  const effectiveDoctorName = doctor?.name || 'Dr. Test';
  
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading conversations...</p>
          <p className="text-xs text-gray-400 mt-2">
            Doctor ID: {effectiveDoctorId}
          </p>
        </div>
      </div>
    );
  }

  // Filter conversations based on search term
  const filteredConversations = conversations.filter(conversation =>
    conversation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversation.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle file uploads with optimized system
  const handleFileUpload = async (files, options = {}) => {
    // Use unique_id for chat API calls (DOC-001, DOC-002, etc.)
    const doctorId = doctor?.uniqueId || 'DOC-001';
    const doctorName = doctor?.name || 'Dr. Test';
    
    if (!selectedConversation) {
      console.error('No conversation selected');
      return;
    }
    
    // Convert to array if single file
    const fileList = Array.isArray(files) ? files : [files];
    
    setUploadingFile(true);
    setUploadProgress({});
    
    try {
      // Create preview for files
      const previews = await Promise.all(
        fileList.map(file => fileUploader.createFilePreview(file))
      );
      setFilePreview(previews);
      
      const uploadOptions = {
        messageText: options.messageText || newMessage.trim(),
        senderName: doctorName,
        onProgress: (fileIndex, progress, uploaded, total) => {
          setUploadProgress(prev => ({
            ...prev,
            [fileIndex]: { progress, uploaded, total }
          }));
        }
      };
      
      // Use optimized file uploader
      const result = await fileUploader.uploadFiles(
        fileList,
        selectedConversation,
        doctorId,
        'doctor',
        uploadOptions
      );
      
      console.log('File upload result:', result);
      
      if (result.success && result.success.length > 0) {
        // Clear message input if files were uploaded with message
        if (newMessage.trim()) {
          setNewMessage('');
        }
        
        // Show success notification
        if (result.success.length === 1) {
          console.log('File uploaded successfully:', result.success[0].file);
        } else {
          console.log(`${result.success.length} files uploaded successfully`);
        }
        
        // Refresh messages to show new file messages
        await fetchMessages(selectedConversation);
      }
      
      if (result.errors && result.errors.length > 0) {
        console.error('Upload errors:', result.errors);
        alert(`${result.errors.length} file(s) failed to upload. Please try again.`);
      }
      
      setReplyToMessage(null);
      
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert(`Failed to upload file: ${error.message}`);
    } finally {
      setUploadingFile(false);
      setShowAttachmentMenu(false);
      setFilePreview([]);
      setUploadProgress({});
    }
  };

  // Handle drag and drop
  const handleFileDrop = async (files) => {
    if (files && files.length > 0) {
      await handleFileUpload(files);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e, fileType) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleFileUpload(files, { fileType });
    }
    // Reset file input
    e.target.value = '';
  };

  // Handle sending messages
  const sendMessage = async () => {
    // Use unique_id for chat API calls (DOC-001, DOC-002, etc.)
    const doctorId = doctor?.uniqueId || 'DOC-001';
    const doctorName = doctor?.name || 'Dr. Test';
    
    console.log('sendMessage - Using doctor ID:', doctorId);
    
    if (!newMessage.trim() || !selectedConversation) return;

    setSendingMessage(true);
    try {
      const messageData = {
        content: newMessage,
        messageType: 'text',
        senderId: doctorId,
        senderName: doctorName,
        senderType: 'doctor',
        replyTo: replyToMessage?.id
      };
      
      console.log('Sending message with data:', messageData);
      console.log('Selected conversation:', selectedConversation);
      
      const response = await chatApi.sendMessage(selectedConversation, messageData);
      console.log('Send message response:', response);
      
      // Check if response has the expected structure
      if (!response || !response.message) {
        throw new Error('Invalid response structure: missing message');
      }
      
      // Add message to local state
      const newMsg = {
        id: response.message?.id || Date.now(), // Fallback ID if response doesn't have one
        senderId: doctorId,
        senderName: doctorName,
        content: newMessage,
        timestamp: formatTime(response.message?.created_at || new Date()),
        type: 'text',
        status: 'sent',
        replyTo: replyToMessage?.id,
        replyContent: response.message?.reply_content,
        replySenderName: response.message?.reply_sender_name
      };

      console.log('Creating new message object:', newMsg);

      setMessages(prev => ({
        ...prev,
        [selectedConversation]: [...(prev[selectedConversation] || []), newMsg]
      }));

      // Send via WebSocket for real-time delivery
      webSocket.sendMessage(selectedConversation, newMsg);
      
      // Update conversation last message
      setConversations(prev => prev.map(conv =>
        conv.id === selectedConversation
          ? { ...conv, lastMessage: newMessage, lastMessageTime: newMsg.timestamp }
          : conv
      ));

      setNewMessage("");
      setReplyToMessage(null);
      
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle key press in input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Handle input change with typing indicators
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    // Use unique_id for chat API calls (DOC-001, DOC-002, etc.)
    const doctorId = doctor?.uniqueId || 'DOC-001';
    const doctorName = doctor?.name || 'Dr. Test';
    
    if (doctorId && selectedConversation) {
      // Send typing start
      webSocket.updateTypingStatus(selectedConversation, {
        userId: doctorId,
        userType: 'doctor',
        userName: doctorName
      }, true);
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        webSocket.updateTypingStatus(selectedConversation, {
          userId: doctorId,
          userType: 'doctor',
          userName: doctorName
        }, false);
      }, 1000);
    }
  };

  // User search functions
  const searchUsers = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    setSearchingUsers(true);
    try {
      const currentUserId = doctor?.uniqueId || doctor?.id || 'DOC-001';
      const currentUserType = 'doctor';
      
      const response = await chatApi.searchUsers(searchQuery, currentUserId, currentUserType);
      setSearchResults(response.users || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setSearchingUsers(false);
    }
  };

  // Start conversation with selected user
  const startConversationWith = async (selectedUser) => {
    try {
      const currentUserId = doctor?.uniqueId || doctor?.id || 'DOC-001';
      const currentUserType = 'doctor';
      const currentUserName = doctor?.name || 'Dr. Test';
      
      const response = await chatApi.startConversation(
        selectedUser.id,
        selectedUser.type,
        currentUserId,
        currentUserType,
        currentUserName,
        selectedUser.name
      );

      if (response.conversation) {
        // Clear search
        setSearchTerm('');
        setSearchResults([]);
        
        // Refresh conversations to include the new one
        await fetchConversationsWithTempId(currentUserId);
        
        // Select the new conversation
        setSelectedConversation(response.conversation.id);
        
        // Hide chat list on mobile
        if (isMobileView) setShowChatList(false);
        
        if (response.isNew) {
          console.log('Started new conversation:', response.conversation);
        } else {
          console.log('Opened existing conversation:', response.conversation);
        }
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  // Get status icon for messages
  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <Check size={12} className="text-gray-400" />;
      case 'delivered':
        return <CheckCheck size={12} className="text-gray-400" />;
      case 'read':
        return <CheckCheck size={12} className="text-blue-500" />;
      default:
        return <Clock size={12} className="text-gray-400" />;
    }
  };

  // Conversation Item Component
  const ConversationItem = ({ conversation, onClick, isSelected }) => (
    <div
      onClick={onClick}
      className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
      }`}
    >
      <div className="relative">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <User className="w-6 h-6 text-white" />
        </div>
        {conversation.isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
        )}
        {conversation.isPinned && (
          <Pin className="absolute -top-1 -right-1 w-4 h-4 text-gray-600" />
        )}
      </div>
      
      <div className="ml-3 flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {conversation.otherParticipant?.name || conversation.name}
          </p>
          <span className="text-xs text-gray-500">
            {conversation.lastMessageTime}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 truncate">
            {typingUsers.some(user => user.conversationId === conversation.id) ? (
              <span className="text-blue-600 italic">typing...</span>
            ) : (
              conversation.lastMessage
            )}
          </p>
          {conversation.unreadCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-500 rounded-full">
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <p className="text-sm text-gray-500">Chat with patients and colleagues</p>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Chat List Sidebar */}
        <div className={`${
          isMobileView ? (showChatList ? 'w-full' : 'hidden') : 'w-80'
        } bg-white border-r border-gray-200 flex flex-col`}>
          
          {/* Search Bar */}
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search conversations and people..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  // Also search users when typing
                  if (e.target.value.trim()) {
                    searchUsers(e.target.value);
                  } else {
                    setSearchResults([]);
                  }
                }}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-gray-100">
            <button className="flex-1 py-3 px-4 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
              All
            </button>
            <button className="flex-1 py-3 px-4 text-sm font-medium text-gray-500 hover:text-gray-700">
              Unread
            </button>
            <button className="flex-1 py-3 px-4 text-sm font-medium text-gray-500 hover:text-gray-700">
              Groups
            </button>
          </div>

          {/* Conversations and People List */}
          <div className="flex-1 overflow-y-auto">
            {searchTerm ? (
              /* Show search results: both conversations and people */
              <div>
                {/* Existing Conversations */}
                {filteredConversations.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                      Conversations
                    </div>
                    {filteredConversations.map((conversation) => (
                      <ConversationItem 
                        key={conversation.id}
                        conversation={conversation}
                        onClick={() => {
                          setSelectedConversation(conversation.id);
                          if (isMobileView) setShowChatList(false);
                        }}
                        isSelected={selectedConversation === conversation.id}
                      />
                    ))}
                  </div>
                )}
                
                {/* Available People */}
                {searchResults.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                      People
                    </div>
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => startConversationWith(user)}
                        className="flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-900">{user.name}</h3>
                          </div>
                          <div className="mt-1 flex items-center space-x-1">
                            <p className="text-xs text-gray-500">
                              {user.type === 'doctor' ? `Dr. • ${user.specialization || 'General Practice'}` : 'Patient'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* No Results */}
                {filteredConversations.length === 0 && searchResults.length === 0 && !searchingUsers && (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <Search className="w-12 h-12 text-gray-300 mb-4" />
                    <p className="text-gray-500 text-center">No conversations or people found</p>
                  </div>
                )}
                
                {/* Loading */}
                {searchingUsers && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  </div>
                )}
              </div>
            ) : (
              /* Show all conversations when not searching */
              filteredConversations.map((conversation) => (
                <ConversationItem 
                  key={conversation.id}
                  conversation={conversation}
                  onClick={() => {
                    setSelectedConversation(conversation.id);
                    if (isMobileView) setShowChatList(false);
                  }}
                  isSelected={selectedConversation === conversation.id}
                />
              ))
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className={`${
          isMobileView ? (showChatList ? 'hidden' : 'w-full') : 'flex-1'
        } flex flex-col bg-gray-50`}>
          
          {currentConversation ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {isMobileView && (
                      <button
                        onClick={() => setShowChatList(true)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <ArrowLeft size={20} />
                      </button>
                    )}
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      {currentConversation?.otherParticipant ? (
                        webSocket.isUserOnline(
                          currentConversation.otherParticipant.id, 
                          currentConversation.otherParticipant.type
                        ) && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )
                      ) : (
                        currentConversation?.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {currentConversation?.otherParticipant?.name || currentConversation.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {currentConversation?.otherParticipant ? (
                          webSocket.isUserOnline(
                            currentConversation.otherParticipant.id, 
                            currentConversation.otherParticipant.type
                          ) ? 'Online' : `Last seen ${currentConversation.lastSeen}`
                        ) : (
                          currentConversation?.isOnline ? 'Online' : `Last seen ${currentConversation?.lastSeen}`
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Phone size={20} className="text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Video size={20} className="text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreVertical size={20} className="text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages Container with Drag & Drop */}
              <div 
                ref={dropZoneRef}
                className={`flex-1 overflow-y-auto p-4 space-y-4 relative ${
                  isDragging ? 'bg-blue-50 border-2 border-dashed border-blue-300' : ''
                }`}
              >
                {/* Drag and Drop Overlay */}
                {isDragging && (
                  <div className="absolute inset-0 flex items-center justify-center bg-blue-50 bg-opacity-90 z-10">
                    <div className="text-center p-8 rounded-lg bg-white shadow-lg border-2 border-dashed border-blue-300">
                      <Upload size={48} className="mx-auto text-blue-500 mb-4" />
                      <p className="text-lg font-semibold text-blue-700 mb-2">Drop files here to upload</p>
                      <p className="text-sm text-blue-600">
                        Images, documents, and other files supported<br/>
                        Maximum 50MB per file • Up to 5 files at once
                      </p>
                    </div>
                  </div>
                )}

                {/* File Preview Area */}
                {filePreview.length > 0 && (
                  <div className="bg-gray-100 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Files to upload ({filePreview.length})
                      </span>
                      <button
                        onClick={() => setFilePreview([])}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {filePreview.map((preview, index) => (
                        <div key={index} className="flex items-center space-x-2 bg-white p-2 rounded">
                          {preview.type === 'image' ? (
                            <img src={preview.src} alt={preview.name} className="w-8 h-8 object-cover rounded" />
                          ) : (
                            <File size={16} className="text-blue-500" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{preview.name}</p>
                            <p className="text-xs text-gray-500">{fileUploader.formatFileSize(preview.size)}</p>
                            {uploadProgress[index] && (
                              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                                <div 
                                  className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                                  style={{ width: `${uploadProgress[index].progress * 100}%` }}
                                ></div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Debug info - remove in production */}
              <div className="text-xs text-gray-500 p-2 bg-yellow-50 mb-2 rounded">
                Debug: Doctor ID={doctor?.id}, UniqueID={doctor?.uniqueId}, Name={doctor?.name}
              </div>
              
              {/* Messages */}
                {currentMessages.map((message) => {
                  // Get current doctor ID for comparison
                  const currentDoctorId = doctor?.uniqueId || doctor?.id || 'DOC-001';
                  const isOwnMessage = message.senderId === currentDoctorId;
                  
                  // Debug logging
                  console.log('Message debug:', {
                    messageId: message.id,
                    messageSenderId: message.senderId,
                    doctorId: doctor?.id,
                    doctorUniqueId: doctor?.uniqueId,
                    currentDoctorId: currentDoctorId,
                    isOwn: isOwnMessage,
                    content: message.content
                  });
                  
                  return (
                  <div key={message.id} className="mb-4">
                    {/* Reply indicator */}
                    {message.replyTo && (
                      <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                        <div className="text-xs text-gray-500 max-w-xs lg:max-w-md px-2">
                          ↳ Replying to: {message.replyContent?.substring(0, 30) || 'Message'}...
                        </div>
                      </div>
                    )}
                    
                    <div
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="group relative max-w-xs lg:max-w-md">
                        {/* Sender name for received messages */}
                        {!isOwnMessage && (
                          <p className="text-xs text-gray-500 mb-1 px-2">{message.senderName}</p>
                        )}
                        
                        {/* Use FileMessage component for file types */}
                        {(message.type === 'image' || message.type === 'file' || message.type === 'video' || message.type === 'audio') ? (
                          <FileMessage 
                            message={message} 
                            isOwn={isOwnMessage}
                          />
                        ) : (
                          /* Text messages */
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                              isOwnMessage
                                ? 'bg-blue-500 text-white rounded-br-md'
                                : 'bg-gray-100 border text-gray-900 rounded-bl-md'
                            } shadow-sm`}
                          >
                            <p className="text-sm leading-relaxed">{message.content}</p>
                            
                            <div className={`flex items-center justify-end space-x-1 mt-2 ${
                              isOwnMessage ? 'text-blue-200' : 'text-gray-500'
                            }`}>
                              <span className="text-xs">{message.timestamp}</span>
                              {isOwnMessage && getStatusIcon(message.status)}
                            </div>
                          </div>
                        )}
                        
                        {/* Message Actions */}
                        <div className="absolute -right-2 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setReplyToMessage(message)}
                            className="p-1 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
                          >
                            <ArrowLeft size={12} className="rotate-180" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })}
                
                {/* Uploading indicator */}
                {uploadingFile && (
                  <div className="flex justify-end">
                    <div className="bg-blue-500 text-white px-4 py-2 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span className="text-sm">Uploading...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 p-4">
                {/* Reply indicator */}
                {replyToMessage && (
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg mb-3">
                    <div className="flex items-center space-x-2">
                      <ArrowLeft size={16} className="text-gray-600 rotate-180" />
                      <span className="text-sm text-gray-600">Replying to:</span>
                      <span className="text-sm font-medium">{replyToMessage.content.substring(0, 30)}...</span>
                    </div>
                    <button 
                      onClick={() => setReplyToMessage(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </div>
                )}
                
                <div className="flex items-center space-x-3">
                  {/* Attachment Menu */}
                  <div className="relative attachment-menu">
                    <button 
                      onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                      className="attachment-button p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Paperclip size={20} className="text-gray-600" />
                    </button>
                    
                    {showAttachmentMenu && (
                      <div className="absolute bottom-12 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 space-y-1 min-w-[140px]">
                        {/* Image Upload */}
                        <input 
                          ref={fileInputRef}
                          type="file" 
                          id="image-upload" 
                          accept="image/*" 
                          multiple
                          className="hidden"
                          onChange={(e) => handleFileInputChange(e, 'image')}
                        />
                        <button 
                          onClick={() => document.getElementById('image-upload').click()}
                          className="w-full flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-md text-left"
                          disabled={uploadingFile}
                        >
                          <Image size={16} className="text-green-600" />
                          <span className="text-sm">Photos</span>
                        </button>
                        
                        {/* Document Upload */}
                        <input 
                          type="file" 
                          id="file-upload" 
                          multiple
                          className="hidden"
                          onChange={(e) => handleFileInputChange(e, 'document')}
                        />
                        <button 
                          onClick={() => document.getElementById('file-upload').click()}
                          className="w-full flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-md text-left"
                          disabled={uploadingFile}
                        >
                          <File size={16} className="text-blue-600" />
                          <span className="text-sm">Documents</span>
                        </button>
                        
                        {/* Camera (for future implementation) */}
                        <button 
                          className="w-full flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-md text-left opacity-50"
                          disabled
                        >
                          <Camera size={16} className="text-purple-600" />
                          <span className="text-sm">Camera</span>
                        </button>
                        
                        {/* Voice (for future implementation) */}
                        <button 
                          className="w-full flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-md text-left opacity-50"
                          disabled
                        >
                          <Mic size={16} className="text-red-600" />
                          <span className="text-sm">Voice</span>
                        </button>
                        
                        {uploadingFile && (
                          <div className="border-t pt-2 mt-2">
                            <div className="flex items-center space-x-2 p-2">
                              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-xs text-gray-600">Uploading...</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="emoji-button absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <Smile size={18} className="text-gray-600" />
                    </button>
                    
                    {/* Simple Emoji Picker */}
                    {showEmojiPicker && (
                      <div className="emoji-picker absolute right-0 bottom-12 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                        <div className="grid grid-cols-6 gap-2">
                          {['😊', '😂', '🥰', '😍', '🤔', '😅', '👍', '❤️', '🙏', '👏', '🎉', '😊'].map((emoji, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                setNewMessage(prev => prev + emoji);
                                setShowEmojiPicker(false);
                              }}
                              className="text-lg p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                    className={`p-2 rounded-lg transition-colors ${
                      newMessage.trim() && !sendingMessage
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {sendingMessage ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <Send size={20} />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* No Chat Selected */
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-xl font-medium text-gray-900 mb-2">Welcome to CareConnect Chat</p>
                <p className="text-gray-500">Select a conversation to start messaging or search for people to chat with</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatTab;

import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Plus, Send, Paperclip, Smile, MoreVertical,
  Phone, Video, ArrowLeft, Check, CheckCheck, X, Reply, Trash2, PinIcon, BellOff, Archive,
  Mic, Image, File, StopCircle, Download, Share2, Save, FileText, FileImage, FileVideo, FileAudio,
  ExternalLink, Eye, MessageCircle, Forward, Settings, Info, Lock, Bell, Volume2, Monitor, Moon, Sun,
  Type, Zap, Shield, Users
} from 'lucide-react';
import { chatApi } from '../../lib/chatApi';
import { useChatSocket } from '../../hooks/useChatSocket';
import { useAuth } from '../../contexts/AuthContext';
import VideoCall from '../../components/VideoCall';

/**
 * Modern Chat Component - WhatsApp/Telegram Style
 * Full-featured messaging interface with real-time updates
 */

const ChatTab = () => {
  const { user } = useAuth();
  
  // User info
  const currentUser = {
    userId: user?.uniqueId,
    userType: 'doctor',
    userName: user?.name || '',
    userEmail: user?.email || '',
    userAvatar: user?.profileImage || ''
  };

  // State
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [userActivity, setUserActivity] = useState('active'); // active, away, offline
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [callType, setCallType] = useState(null); // 'audio' or 'video'
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Global Chat Settings State (Centralized)
  const [chatSettings, setChatSettings] = useState({
    notifications: {
      sound: true,
      desktop: true,
      messagePreview: true
    },
    privacy: {
      readReceipts: true,
      onlineStatus: true,
      typingIndicator: true,
      lastSeen: true
    },
    media: {
      autoDownload: true,
      autoPlay: false
    },
    chat: {
      enterToSend: true,
      fontSize: 'medium',
      theme: 'light'
    }
  });

  // Per-Chat Settings State (For current selected chat)
  const [perChatSettings, setPerChatSettings] = useState({
    isMuted: false,
    isPinned: false,
    isBlocked: false,
    isArchived: false,
    customNickname: null
  });

  // Refs
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const audioChunksRef = useRef([]);
  const activityTimeoutRef = useRef(null);

  // WebSocket
  const socket = useChatSocket(currentUser);

  // Load global chat settings from backend on mount
  useEffect(() => {
    const loadChatSettings = async () => {
      if (currentUser.userId && currentUser.userType) {
        try {
          const settings = await chatApi.getChatSettings(currentUser.userId, currentUser.userType);
          setChatSettings(settings);
        } catch (error) {
          console.error('Failed to load chat settings:', error);
          // Keep default settings if load fails
        }
      }
    };
    loadChatSettings();
  }, [currentUser.userId, currentUser.userType]);

  // Load per-chat settings when chat is selected
  useEffect(() => {
    const loadPerChatSettings = async () => {
      if (selectedChat?.id && currentUser.userId && currentUser.userType) {
        try {
          const settings = await chatApi.getPerChatSettings(selectedChat.id, currentUser.userId, currentUser.userType);
          setPerChatSettings(settings);
        } catch (error) {
          console.error('Failed to load per-chat settings:', error);
          // Reset to defaults if load fails
          setPerChatSettings({
            isMuted: false,
            isPinned: false,
            isBlocked: false,
            isArchived: false,
            customNickname: null
          });
        }
      }
    };
    loadPerChatSettings();
  }, [selectedChat?.id, currentUser.userId, currentUser.userType]);

  // Track user activity for away status
  useEffect(() => {
    const handleActivity = () => {
      setLastActivity(Date.now());
      if (userActivity !== 'active') {
        setUserActivity('active');
        // Notify server of active status
        if (socket.socket) {
          socket.socket.emit('user_active', {
            userId: currentUser.userId,
            userType: currentUser.userType
          });
        }
      }
    };

    // Activity events
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    events.forEach(event => window.addEventListener(event, handleActivity));

    // Check for inactivity every 30 seconds
    const inactivityInterval = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivity;
      
      // 5 minutes of inactivity = away
      if (timeSinceLastActivity > 5 * 60 * 1000 && userActivity === 'active') {
        setUserActivity('away');
        if (socket.socket) {
          socket.socket.emit('user_away', {
            userId: currentUser.userId,
            userType: currentUser.userType
          });
        }
      }
    }, 30000);

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      clearInterval(inactivityInterval);
    };
  }, [lastActivity, userActivity, socket.socket, currentUser.userId, currentUser.userType]);

  // Listen for incoming calls
  useEffect(() => {
    if (!socket.socket) return;

    const handleIncomingCall = (data) => {
      console.log('📞 Incoming call from:', data.fromName);
      setIncomingCallData(data);
      setCallType(data.callType);
      setIsIncomingCall(true);
      setShowVideoCall(true);
    };

    socket.socket.on('incoming_call', handleIncomingCall);

    return () => {
      socket.socket.off('incoming_call', handleIncomingCall);
    };
  }, [socket.socket]);

  // Load chats on mount
  useEffect(() => {
    if (currentUser.userId) {
      loadChats();
    }
  }, [currentUser.userId]);

  // WebSocket event handlers
  useEffect(() => {
    if (!socket.socket) return;

    // New message received
    socket.on('new_message', (data) => {
      if (selectedChat && data.chatId === selectedChat.id) {
        setMessages(prev => [...prev, data.message]);
        scrollToBottom();
        
        // Mark as read
        socket.markAsRead(data.chatId, [data.message.id], currentUser.userId, currentUser.userType);
      }
      
      // Update chat list
      loadChats();
    });

    // Message delivered
    socket.on('message_delivered', (data) => {
      if (selectedChat && data.chatId === selectedChat.id) {
        setMessages(prev => prev.map(msg =>
          msg.id === data.messageId
            ? { ...msg, my_status: { status: 'delivered', delivered_at: new Date() } }
            : msg
        ));
      }
    });

    // Messages read
    socket.on('messages_read', (data) => {
      if (selectedChat && data.chatId === selectedChat.id) {
        setMessages(prev => prev.map(msg =>
          data.messageIds.includes(msg.id)
            ? { ...msg, my_status: { status: 'read', read_at: new Date() } }
            : msg
        ));
      }
    });

    // Typing indicator
    socket.on('user_typing', (data) => {
      if (selectedChat && data.chatId === selectedChat.id) {
        setTypingUsers(prev => new Set(prev).add(`${data.userId}_${data.userType}`));
      }
    });

    socket.on('user_stopped_typing', (data) => {
      if (selectedChat && data.chatId === selectedChat.id) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(`${data.userId}_${data.userType}`);
          return newSet;
        });
      }
    });

    // Reaction added
    socket.on('reaction_added', (data) => {
      setMessages(prev => prev.map(msg =>
        msg.id === data.messageId
          ? {
              ...msg,
              reactions: [
                ...(msg.reactions || []).filter(r => !(r.user_id === data.userId && r.user_type === data.userType)),
                { user_id: data.userId, user_type: data.userType, reaction: data.reaction }
              ]
            }
          : msg
      ));
    });

    // Message deleted
    socket.on('message_deleted', (data) => {
      if (selectedChat && data.chatId === selectedChat.id) {
        setMessages(prev => prev.map(msg =>
          msg.id === data.messageId
            ? { ...msg, is_deleted: true, delete_for_everyone: data.deleteForEveryone }
            : msg
        ));
      }
      loadChats();
    });

    return () => {
      socket.off('new_message');
      socket.off('message_delivered');
      socket.off('messages_read');
      socket.off('user_typing');
      socket.off('message_deleted');
      socket.off('user_stopped_typing');
      socket.off('reaction_added');
    };
  }, [socket.socket, selectedChat, currentUser]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load all chats
  const loadChats = async () => {
    try {
      const data = await chatApi.getMyChats(currentUser.userId, currentUser.userType);
      setChats(data.chats || []);
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  // Load messages for a chat
  const loadMessages = async (chatId) => {
    try {
      setLoading(true);
      const data = await chatApi.getMessages(chatId, currentUser.userId, currentUser.userType);
      setMessages(data.messages || []);
      
      // Mark as read
      if (data.messages && data.messages.length > 0) {
        const unreadIds = data.messages
          .filter(m => m.sender_id !== currentUser.userId && m.my_status?.status !== 'read')
          .map(m => m.id);
        
        if (unreadIds.length > 0) {
          await chatApi.markAsRead(chatId, currentUser.userId, currentUser.userType, unreadIds);
          socket.markAsRead(chatId, unreadIds, currentUser.userId, currentUser.userType);
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Select a chat
  const handleSelectChat = (chat) => {
    if (selectedChat?.id) {
      socket.leaveChat(selectedChat.id);
    }
    
    setSelectedChat(chat);
    setMessages([]);
    setReplyTo(null);
    loadMessages(chat.id);
    socket.joinChat(chat.id);
  };

  // Send message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChat) return;

    try {
      const messageData = {
        content: messageInput,
        replyToId: replyTo?.id || null
      };

      const response = await chatApi.sendMessage(
        selectedChat.id,
        currentUser,
        messageInput,
        { replyToId: replyTo?.id }
      );

      const newMessage = response.message;
      setMessages(prev => [...prev, newMessage]);
      setMessageInput('');
      setReplyTo(null);
      
      // Broadcast via WebSocket
      socket.sendMessage(selectedChat.id, newMessage);
      
      // Update chat list
      loadChats();
      
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Send call status message
  const handleCallStatusChange = async (callInfo) => {
    if (!selectedChat) return;

    try {
      const callIcon = callInfo.type === 'video' ? 'video' : 'audio';
      let content = '';
      
      // Format content based on call status
      if (callInfo.status === 'completed') {
        const duration = formatCallDuration(callInfo.duration);
        content = `${callIcon}|${callInfo.isIncoming ? 'incoming' : 'outgoing'}|completed|${duration}`;
      } else if (callInfo.status === 'declined') {
        content = `${callIcon}|${callInfo.isIncoming ? 'incoming' : 'outgoing'}|declined|0`;
      } else if (callInfo.status === 'not_answered') {
        content = `${callIcon}|outgoing|not_answered|0`;
      } else if (callInfo.status === 'missed') {
        content = `${callIcon}|incoming|missed|0`;
      }

      const response = await chatApi.sendMessage(
        selectedChat.id,
        currentUser,
        content,
        { 
          messageType: 'call',
          callType: callInfo.type,
          callStatus: callInfo.status,
          callDuration: callInfo.duration || 0
        }
      );

      const newMessage = response.message;
      setMessages(prev => [...prev, newMessage]);
      
      // Broadcast via WebSocket
      socket.sendMessage(selectedChat.id, newMessage);
      
      // Update chat list
      loadChats();
      
      scrollToBottom();
    } catch (error) {
      console.error('Error sending call message:', error);
    }
  };

  const formatCallDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle file upload
  const handleFileUpload = async (file, messageType = 'file') => {
    if (!selectedChat || !file) return;

    try {
      setUploadingFile(true);

      // Upload file
      const uploadResponse = await chatApi.uploadFile(file);
      const fileData = uploadResponse.file;

      // Send message with file (use file.name or fileData.name)
      const response = await chatApi.sendMessage(
        selectedChat.id,
        currentUser,
        file.name || fileData.name || 'File',
        {
          messageType,
          mediaUrl: fileData.url,
          mediaName: fileData.name,
          mediaSize: fileData.size,
          mediaType: fileData.type || file.type
        }
      );

      const newMessage = response.message;
      setMessages(prev => [...prev, newMessage]);
      
      // Broadcast via WebSocket
      socket.sendMessage(selectedChat.id, newMessage);
      
      // Update chat list
      loadChats();
      scrollToBottom();

    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setUploadingFile(false);
      setShowAttachMenu(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e, type = 'file') => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, type);
    }
  };

  // Handle location sharing
  const handleShareLocation = async () => {
    setShowAttachMenu(false);
    
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    try {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
          
          const response = await chatApi.sendMessage(
            selectedChat.id,
            currentUser,
            `📍 Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            {
              messageType: 'location',
              mediaUrl: locationUrl
            }
          );

          const newMessage = response.message;
          setMessages(prev => [...prev, newMessage]);
          socket.sendMessage(selectedChat.id, newMessage);
          loadChats();
          scrollToBottom();
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please enable location services.');
        }
      );
    } catch (error) {
      console.error('Error sharing location:', error);
      alert('Failed to share location');
    }
  };

  // Detect URLs in message content
  const detectUrls = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  };

  // Extract URL metadata for preview
  const getUrlPreview = (url) => {
    try {
      const urlObj = new URL(url);
      return {
        url,
        domain: urlObj.hostname.replace('www.', ''),
        favicon: `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`
      };
    } catch {
      return null;
    }
  };

  // Start voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Create a file-like object from the blob
        const fileName = `voice-${Date.now()}.webm`;
        const audioFile = audioBlob;
        audioFile.name = fileName;
        audioFile.lastModified = Date.now();
        
        await handleFileUpload(audioFile, 'voice');
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Update recording time
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to access microphone');
    }
  };

  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
    }
  };

  // Cancel voice recording
  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
      audioChunksRef.current = [];
    }
  };

  // Handle typing
  const handleTyping = () => {
    if (!selectedChat) return;

    socket.startTyping(selectedChat.id, currentUser.userId, currentUser.userType, currentUser.userName);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socket.stopTyping(selectedChat.id, currentUser.userId, currentUser.userType);
    }, 3000);
  };

  // Delete message state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [canDeleteForEveryone, setCanDeleteForEveryone] = useState(false);

  // Delete message
  const handleDeleteMessage = (message) => {
    if (!message) return;

    const isOwn = message.sender_id === currentUser.userId && message.sender_type === currentUser.userType;
    if (!isOwn) return;

    // Check if within 1 hour for "Delete for Everyone"
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const messageTime = new Date(message.created_at).getTime();
    const canDelete = messageTime > oneHourAgo;

    setMessageToDelete(message);
    setCanDeleteForEveryone(canDelete);
    setShowDeleteModal(true);
  };

  const confirmDelete = async (deleteForEveryone) => {
    if (!messageToDelete) return;

    try {
      await chatApi.deleteMessage(messageToDelete.id, currentUser.userId, currentUser.userType);
      
      // Remove message from local state
      setMessages(prev => prev.filter(msg => msg.id !== messageToDelete.id));
      
      // Show success message
      showToast('Message deleted successfully', 'success');
      
      setShowDeleteModal(false);
      setMessageToDelete(null);
      loadChats();
    } catch (error) {
      console.error('Error deleting message:', error);
      showToast('Failed to delete message', 'error');
    }
  };

  // Archive chat handler
  const handleArchiveChat = async () => {
    if (!selectedChat) return;

    const isArchived = !perChatSettings.isArchived;
    
    try {
      setShowChatInfo(false);
      await chatApi.archiveChat(selectedChat.id, currentUser.userId, currentUser.userType, isArchived);
      
      // Update local state
      setPerChatSettings({ ...perChatSettings, isArchived });
      
      // Reload chats to update list
      await loadChats();
      
      showToast(isArchived ? 'Chat archived' : 'Chat unarchived', 'success');
      
      // If archived, go back to chat list
      if (isArchived) {
        setSelectedChat(null);
      }
    } catch (error) {
      console.error('Error archiving chat:', error);
      showToast('Failed to archive chat', 'error');
    }
  };

  // Clear chat handler
  const handleClearChat = () => {
    setShowChatInfo(false);
    setShowClearConfirm(true);
  };

  const confirmClearChat = async () => {
    if (!selectedChat) return;

    try {
      await chatApi.clearChat(selectedChat.id, currentUser.userId, currentUser.userType);
      
      // Clear messages from local state
      setMessages([]);
      
      showToast('Chat cleared successfully', 'success');
      
      setShowClearConfirm(false);
      loadChats();
    } catch (error) {
      console.error('Error clearing chat:', error);
      showToast('Failed to clear chat', 'error');
    }
  };

  // Toast notification helper
  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    const bgColor = type === 'success' 
      ? 'from-green-500 to-emerald-600' 
      : 'from-red-500 to-rose-600';
    toast.className = `fixed top-20 left-1/2 transform -translate-x-1/2 bg-gradient-to-r ${bgColor} text-white px-6 py-3 rounded-lg shadow-2xl z-50 animate-pulse`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  // Add reaction to message
  const handleAddReaction = async (message, emoji) => {
    if (!message) return;

    try {
      await chatApi.addReaction(message.id, currentUser.userId, currentUser.userType, emoji);
      
      // Update local messages with the new reaction
      setMessages(prev => prev.map(msg => {
        if (msg.id === message.id) {
          const existingReactions = msg.reactions || [];
          // Remove existing reaction from this user if any
          const filteredReactions = existingReactions.filter(
            r => !(r.user_id === currentUser.userId && r.user_type === currentUser.userType)
          );
          // Add new reaction
          return {
            ...msg,
            reactions: [...filteredReactions, {
              user_id: currentUser.userId,
              user_type: currentUser.userType,
              reaction: emoji
            }]
          };
        }
        return msg;
      }));

      // Emit via socket
      socket.addReaction(selectedChat.id, message.id, currentUser.userId, currentUser.userType, emoji);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  // Forward message
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [messageToForward, setMessageToForward] = useState(null);
  const [selectedChatsForForward, setSelectedChatsForForward] = useState([]);

  const handleForwardMessage = (message) => {
    setMessageToForward(message);
    setSelectedChatsForForward([]);
    setShowForwardModal(true);
  };

  const handleForwardConfirm = async () => {
    if (!messageToForward || selectedChatsForForward.length === 0) return;

    try {
      await chatApi.forwardMessage(
        messageToForward.id,
        selectedChatsForForward,
        currentUser.userId,
        currentUser.userType
      );
      
      setShowForwardModal(false);
      setMessageToForward(null);
      setSelectedChatsForForward([]);
      
      alert(`Message forwarded to ${selectedChatsForForward.length} chat(s)`);
      loadChats();
    } catch (error) {
      console.error('Error forwarding message:', error);
      alert('Failed to forward message: ' + (error.message || 'Unknown error'));
    }
  };

  const toggleChatForForward = (chatId) => {
    setSelectedChatsForForward(prev => 
      prev.includes(chatId) 
        ? prev.filter(id => id !== chatId)
        : [...prev, chatId]
    );
  };

  // Search users and chats
  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      const data = await chatApi.searchUsers(query, currentUser.userId, currentUser.userType);
      setSearchResults(data.users || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Start new chat
  const handleStartChat = async (user) => {
    try {
      const otherUser = {
        userId: user.user_id,
        userType: user.user_type,
        userName: user.user_name,
        userEmail: user.user_email,
        userAvatar: user.user_avatar
      };

      const data = await chatApi.startChat(currentUser, otherUser);
      
      setSearchQuery('');
      setSearchResults([]);
      
      // Reload chats and select the new/existing chat
      await loadChats();
      handleSelectChat(data.chat);
      
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  // Filter chats by search
  const filteredChats = chats.filter(chat => {
    if (!searchQuery.trim()) return true;
    const otherUser = chat.other_user;
    return otherUser?.user_name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Show search results when searching, otherwise show chats
  const showSearchResults = searchQuery.trim().length >= 2 && searchResults.length > 0;
  const showNoResults = searchQuery.trim().length >= 2 && searchResults.length === 0 && !isSearching;

  return (
    <div className="h-[calc(100vh-200px)] flex bg-gray-50 rounded-lg overflow-hidden shadow-lg">
      {/* Left Sidebar - Chat List */}
      <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} w-full md:w-96 flex-col bg-white border-r`}>
        {/* Header */}
        <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold">Messages</h2>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-blue-500 rounded-lg transition-all"
              title="App Settings"
            >
              <Settings size={20} />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-200" size={18} />
            <input
              type="text"
              placeholder="Search conversations or find users..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2 rounded-lg bg-blue-500 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-200 hover:text-white"
              >
                <X size={18} />
              </button>
            )}
          </div>
          {searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
            <p className="text-xs text-blue-100 mt-1">Type at least 2 characters to search</p>
          )}
        </div>

        {/* Chat List / Search Results */}
        <div className="flex-1 overflow-y-auto">
          {isSearching ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : showSearchResults ? (
            <>
              <div className="px-4 py-2 bg-gray-50 border-b">
                <p className="text-xs font-semibold text-gray-600">SEARCH RESULTS</p>
              </div>
              {searchResults.map((user) => (
                <div
                  key={`${user.user_id}_${user.user_type}`}
                  onClick={() => handleStartChat(user)}
                  className="p-4 border-b cursor-pointer hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 bg-gradient-to-br ${
                      user.user_type === 'doctor' 
                        ? 'from-emerald-400 to-teal-600' 
                        : 'from-pink-400 to-rose-600'
                    } rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg`}>
                      {user.user_name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">{user.user_name}</h4>
                      <p className="text-sm flex items-center space-x-1">
                        <span className={`inline-block w-2 h-2 rounded-full ${
                          user.user_type === 'doctor' ? 'bg-emerald-500' : 'bg-pink-500'
                        }`}></span>
                        <span className="text-gray-600">
                          {user.user_type === 'doctor' ? 'Doctor' : 'Patient'}
                          {user.specialization && ` • ${user.specialization}`}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : showNoResults ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
              <Search size={48} className="mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No users found</p>
              <p className="text-sm">Try a different search term</p>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
              <Search size={48} className="mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No conversations yet</p>
              <p className="text-sm">Search above to find and chat with doctors or patients</p>
            </div>
          ) : (
            <>
              {searchQuery.trim().length > 0 && (
                <div className="px-4 py-2 bg-gray-50 border-b">
                  <p className="text-xs font-semibold text-gray-600">YOUR CONVERSATIONS</p>
                </div>
              )}
              {filteredChats.map((chat) => (
                <ChatListItem
                  key={chat.id}
                  chat={chat}
                  isSelected={selectedChat?.id === chat.id}
                  onClick={() => handleSelectChat(chat)}
                  isOnline={socket.isUserOnline(chat.other_user?.user_id, chat.other_user?.user_type)}
                />
               ))}
            </>
          )}
        </div>
      </div>

      {/* Right Side - Chat Window */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col bg-gray-50">
          {/* Chat Header */}
          <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSelectedChat(null)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeft size={20} />
              </button>
              
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                  {selectedChat.other_user?.user_name?.charAt(0) || '?'}
                </div>
                {socket.isUserOnline(selectedChat.other_user?.user_id, selectedChat.other_user?.user_type) && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full border-2 border-white animate-pulse shadow-lg"></div>
                )}
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900">
                  {selectedChat.other_user?.user_name}
                </h3>
                <p className="text-xs flex items-center space-x-1">
                  {(() => {
                    const activityStatus = socket.getUserActivityStatus(
                      selectedChat.other_user?.user_id, 
                      selectedChat.other_user?.user_type
                    );
                    
                    if (activityStatus === 'active') {
                      return (
                        <>
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                          <span className="text-green-600 font-medium">Active now</span>
                        </>
                      );
                    } else if (activityStatus === 'away') {
                      return (
                        <>
                          <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                          <span className="text-amber-600 font-medium">Away</span>
                        </>
                      );
                    } else {
                      return (
                        <>
                          <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                          <span className="text-gray-500">Offline</span>
                        </>
                      );
                    }
                  })()}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button 
                onClick={() => {
                  setCallType('audio');
                  setIsIncomingCall(false);
                  setShowVideoCall(true);
                }}
                className="p-2.5 hover:bg-green-50 rounded-full transition-all duration-200 group" 
                title="Voice Call"
              >
                <Phone size={20} className="text-gray-600 group-hover:text-green-600 transition-colors" />
              </button>
              <button 
                onClick={() => {
                  setCallType('video');
                  setIsIncomingCall(false);
                  setShowVideoCall(true);
                }}
                className="p-2.5 hover:bg-blue-50 rounded-full transition-all duration-200 group" 
                title="Video Call"
              >
                <Video size={20} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
              </button>
              <div className="relative">
                <button 
                  onClick={() => setShowChatInfo(!showChatInfo)}
                  className="p-2.5 hover:bg-purple-50 rounded-full transition-all duration-200 group" 
                  title="Chat Info"
                >
                  <Info size={20} className="text-gray-600 group-hover:text-purple-600 transition-colors" />
                </button>
                
                {showChatInfo && (
                  <>
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setShowChatInfo(false)}
                    />
                    <div className="absolute right-0 top-12 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      {/* Per-Chat Settings */}
                      <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase">Chat Settings</div>
                      <button 
                        onClick={async () => {
                          const newMutedState = !perChatSettings.isMuted;
                          setPerChatSettings({ ...perChatSettings, isMuted: newMutedState });
                          try {
                            await chatApi.updatePerChatSettings(selectedChat.id, currentUser.userId, currentUser.userType, { isMuted: newMutedState });
                          } catch (error) {
                            console.error('Failed to toggle mute:', error);
                            setPerChatSettings({ ...perChatSettings, isMuted: !newMutedState });
                          }
                        }}
                        className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center justify-between text-sm text-gray-700"
                      >
                        <div className="flex items-center space-x-3">
                          <BellOff size={18} className={perChatSettings.isMuted ? 'text-blue-600' : ''} />
                          <span>Mute Notifications</span>
                        </div>
                        {perChatSettings.isMuted && (
                          <Check size={16} className="text-blue-600" />
                        )}
                      </button>
                      <button 
                        onClick={async () => {
                          const newPinnedState = !perChatSettings.isPinned;
                          setPerChatSettings({ ...perChatSettings, isPinned: newPinnedState });
                          try {
                            await chatApi.updatePerChatSettings(selectedChat.id, currentUser.userId, currentUser.userType, { isPinned: newPinnedState });
                          } catch (error) {
                            console.error('Failed to toggle pin:', error);
                            setPerChatSettings({ ...perChatSettings, isPinned: !newPinnedState });
                          }
                        }}
                        className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center justify-between text-sm text-gray-700"
                      >
                        <div className="flex items-center space-x-3">
                          <PinIcon size={18} className={perChatSettings.isPinned ? 'text-blue-600' : ''} />
                          <span>Pin Chat</span>
                        </div>
                        {perChatSettings.isPinned && (
                          <Check size={16} className="text-blue-600" />
                        )}
                      </button>
                      <button 
                        onClick={async () => {
                          const newBlockedState = !perChatSettings.isBlocked;
                          setPerChatSettings({ ...perChatSettings, isBlocked: newBlockedState });
                          try {
                            await chatApi.updatePerChatSettings(selectedChat.id, currentUser.userId, currentUser.userType, { isBlocked: newBlockedState });
                          } catch (error) {
                            console.error('Failed to toggle block:', error);
                            setPerChatSettings({ ...perChatSettings, isBlocked: !newBlockedState });
                          }
                        }}
                        className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center justify-between text-sm text-gray-700"
                      >
                        <div className="flex items-center space-x-3">
                          <Lock size={18} className={perChatSettings.isBlocked ? 'text-red-600' : ''} />
                          <span>Block User</span>
                        </div>
                        {perChatSettings.isBlocked && (
                          <Check size={16} className="text-red-600" />
                        )}
                      </button>
                      
                      <div className="border-t border-gray-100 my-1"></div>
                      
                      <button 
                        onClick={handleArchiveChat}
                        className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center justify-between text-sm text-gray-700"
                      >
                        <div className="flex items-center space-x-3">
                          <Archive size={18} className={perChatSettings.isArchived ? 'text-blue-600' : ''} />
                          <span>{perChatSettings.isArchived ? 'Unarchive Chat' : 'Archive Chat'}</span>
                        </div>
                        {perChatSettings.isArchived && (
                          <Check size={16} className="text-blue-600" />
                        )}
                      </button>
                      <button 
                        onClick={handleClearChat}
                        className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center space-x-3 text-sm text-red-600"
                      >
                        <Trash2 size={18} />
                        <span>Clear Chat</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-border" style={{ WebkitMaskComposite: 'xor', maskComposite: 'exclude' }}>
                    <div className="absolute inset-1 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-center space-y-3">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-full mx-auto flex items-center justify-center shadow-lg animate-pulse">
                    <MessageCircle size={36} className="text-white" />
                  </div>
                  <p className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    No messages yet
                  </p>
                  <p className="text-sm text-gray-500">Start the conversation!</p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={message.sender_id === currentUser.userId && message.sender_type === currentUser.userType}
                  showAvatar={
                    index === 0 ||
                    messages[index - 1].sender_id !== message.sender_id
                  }
                  onReply={() => setReplyTo(message)}
                  onDelete={() => handleDeleteMessage(message)}
                  onForward={() => handleForwardMessage(message)}
                  onReact={(emoji) => handleAddReaction(message, emoji)}
                  onCallBack={(type) => {
                    setCallType(type);
                    setIsIncomingCall(false);
                    setShowVideoCall(true);
                  }}
                />
              ))
            )}
            
            {/* Typing indicator */}
            {typingUsers.size > 0 && (
              <div className="flex items-center space-x-3 text-gray-500 text-sm px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2.5 h-2.5 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2.5 h-2.5 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2.5 h-2.5 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="font-medium text-gray-600">typing...</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Reply Preview */}
          {replyTo && (
            <div className="px-4 py-3 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-t-2 border-blue-200 flex items-center justify-between shadow-sm">
              <div className="flex-1 pl-3 border-l-4 border-gradient-to-b from-blue-500 to-purple-500">
                <p className="text-xs bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-semibold">
                  Replying to {replyTo.sender_name}
                </p>
                <p className="text-sm text-gray-700 truncate mt-0.5">{replyTo.content}</p>
              </div>
              <button
                onClick={() => setReplyTo(null)}
                className="p-1.5 hover:bg-gradient-to-br hover:from-red-100 hover:to-rose-100 rounded-full transition-all duration-200"
                title="Cancel Reply"
              >
                <X size={16} className="text-red-500" />
              </button>
            </div>
          )}

          {/* Message Input */}
          <div className="bg-white border-t px-4 py-3">
            {isRecording ? (
              // Recording UI
              <div className="flex items-center space-x-3 py-2 bg-gradient-to-r from-red-50 to-rose-50 rounded-lg px-3">
                <div className="flex-1 flex items-center space-x-3">
                  <div className="w-3 h-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-full animate-pulse shadow-lg"></div>
                  <span className="text-sm font-semibold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                    Recording... {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                  </span>
                  <div className="flex-1 flex space-x-1">
                    {[...Array(20)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-blue-500 rounded-full animate-pulse"
                        style={{
                          height: `${Math.random() * 20 + 10}px`,
                          animationDelay: `${i * 0.1}s`
                        }}
                      ></div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={cancelRecording}
                  className="p-2 hover:bg-gray-100 rounded-full text-red-600"
                  title="Cancel"
                >
                  <X size={20} />
                </button>
                <button
                  onClick={stopRecording}
                  className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                  title="Send"
                >
                  <Send size={20} />
                </button>
              </div>
            ) : (
              // Normal input UI
              <div className="flex items-center space-x-2">
                {/* Attachment Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowAttachMenu(!showAttachMenu)}
                    className="p-2.5 hover:bg-gradient-to-br hover:from-purple-50 hover:to-blue-50 rounded-full transition-all duration-200"
                    disabled={uploadingFile}
                  >
                    <Paperclip size={20} className="text-gray-600 hover:text-blue-600" />
                  </button>
                  
                  {showAttachMenu && (
                    <div className="absolute bottom-full mb-2 left-0 bg-white rounded-xl shadow-2xl border border-gray-100 p-3 space-y-2 min-w-[180px] animate-in fade-in slide-in-from-bottom-2 duration-200">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 rounded-xl text-left transition-all duration-200 group"
                      >
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg group-hover:scale-110 transition-transform duration-200">
                          <Image size={18} className="text-white" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-900">Image</span>
                          <p className="text-xs text-gray-500">Photos & GIFs</p>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = '.pdf,.doc,.docx,.txt,.zip,.rar';
                          input.onchange = (e) => handleFileSelect(e, 'document');
                          input.click();
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 rounded-xl text-left transition-all duration-200 group"
                      >
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg group-hover:scale-110 transition-transform duration-200">
                          <FileText size={18} className="text-white" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-900">Document</span>
                          <p className="text-xs text-gray-500">PDF, DOC, ZIP</p>
                        </div>
                      </button>
                      <button
                        onClick={handleShareLocation}
                        className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 rounded-xl text-left transition-all duration-200 group"
                      >
                        <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg group-hover:scale-110 transition-transform duration-200">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                          </svg>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-900">Location</span>
                          <p className="text-xs text-gray-500">Share your location</p>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Hidden file inputs */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => handleFileSelect(e, 'image')}
                  className="hidden"
                />
                
                {/* Emoji Picker */}
                <div className="relative">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2.5 hover:bg-gradient-to-br hover:from-yellow-50 hover:to-amber-50 rounded-full transition-all duration-200"
                    disabled={uploadingFile}
                  >
                    <Smile size={20} className="text-gray-600 hover:text-amber-500" />
                  </button>
                  
                  {showEmojiPicker && (
                    <div className="absolute bottom-full mb-2 left-0 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 w-80 max-h-96 overflow-y-auto z-50">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b">
                        <h4 className="text-sm font-semibold text-gray-700">Emoji & GIF</h4>
                        <button
                          onClick={() => setShowEmojiPicker(false)}
                          className="p-1 hover:bg-gray-100 rounded-full"
                        >
                          <X size={16} className="text-gray-500" />
                        </button>
                      </div>
                      
                      {/* Emoji Grid */}
                      <div className="grid grid-cols-8 gap-1">
                        {['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', 
                          '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒',
                          '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡',
                          '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶',
                          '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴',
                          '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀',
                          '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾',
                          '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆',
                          '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️',
                          '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀',
                          '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
                          '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈',
                          '🔥', '💯', '💢', '💬', '👁️‍🗨️', '💭', '💤', '👋', '🎉', '🎊', '🎁', '🎈', '🎂', '🎀', '🏆', '🥇'].map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => {
                              setMessageInput(prev => prev + emoji);
                              messageInputRef.current?.focus();
                            }}
                            className="text-2xl hover:bg-gray-100 rounded p-1 transition-all hover:scale-125"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                      
                      {/* GIF Note */}
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-gray-500 text-center">
                          💡 Tip: You can also paste GIF links directly in your message
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <input
                  type="text"
                  ref={messageInputRef}
                  placeholder={uploadingFile ? "Uploading..." : "Type a message..."}
                  value={messageInput}
                  onChange={(e) => {
                    setMessageInput(e.target.value);
                    handleTyping();
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && !uploadingFile && handleSendMessage()}
                  disabled={uploadingFile}
                  className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
                
                {messageInput.trim() ? (
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || uploadingFile}
                    className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    <Send size={20} />
                  </button>
                ) : (
                  <button
                    onClick={startRecording}
                    className="p-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-full hover:from-red-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                    title="Record voice message"
                  >
                    <Mic size={20} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
          <div className="text-center">
            <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
              <MessageCircle size={56} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Select a chat to start messaging
            </h3>
            <p className="text-sm text-gray-600">Choose a conversation from the list or start a new one</p>
          </div>
        </div>
      )}

      {/* Delete Message Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-red-500 to-rose-600">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Trash2 size={24} />
                  <span>Delete Message</span>
                </h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="p-1 hover:bg-white/20 rounded-full transition"
                >
                  <X size={24} className="text-white" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <p className="text-gray-700 text-center mb-4">
                Choose how you want to delete this message
              </p>

              {/* Delete for Me Option */}
              <button
                onClick={() => confirmDelete(false)}
                className="w-full p-4 border-2 border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
              >
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-100 rounded-full group-hover:bg-blue-200 transition">
                    <Trash2 size={20} className="text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold text-gray-900 mb-1">Delete for Me</h4>
                    <p className="text-sm text-gray-600">
                      Only you won't see this message. Others will still be able to see it.
                    </p>
                  </div>
                </div>
              </button>

              {/* Delete for Everyone Option */}
              {canDeleteForEveryone ? (
                <button
                  onClick={() => confirmDelete(true)}
                  className="w-full p-4 border-2 border-red-300 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all duration-200 group"
                >
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-red-100 rounded-full group-hover:bg-red-200 transition">
                      <Trash2 size={20} className="text-red-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-semibold text-gray-900 mb-1">Delete for Everyone</h4>
                      <p className="text-sm text-gray-600">
                        This message will be deleted for all participants in this chat.
                      </p>
                    </div>
                  </div>
                </button>
              ) : (
                <div className="w-full p-4 border-2 border-gray-200 rounded-xl bg-gray-50 opacity-60">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-gray-200 rounded-full">
                      <Trash2 size={20} className="text-gray-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-semibold text-gray-500 mb-1">Delete for Everyone</h4>
                      <p className="text-sm text-gray-500">
                        You can only delete for everyone within 1 hour of sending.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="w-full px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Chat Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-red-500 to-rose-600">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Trash2 size={24} />
                  <span>Clear Chat</span>
                </h3>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="p-1 hover:bg-white/20 rounded-full transition"
                >
                  <X size={24} className="text-white" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 size={32} className="text-red-600" />
                </div>
              </div>
              <p className="text-center text-gray-700 mb-2 font-semibold">
                Clear all messages?
              </p>
              <p className="text-center text-sm text-gray-500">
                This will permanently delete all messages in this conversation. This action cannot be undone.
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t flex space-x-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmClearChat}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg hover:from-red-600 hover:to-rose-700 transition font-medium shadow-lg"
              >
                Clear Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forward Message Modal */}
      {showForwardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b bg-gradient-to-r from-purple-600 to-pink-600">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Forward Message</h3>
                <button
                  onClick={() => setShowForwardModal(false)}
                  className="p-1 hover:bg-white/20 rounded-full transition"
                >
                  <X size={24} className="text-white" />
                </button>
              </div>
              <p className="text-sm text-white/90 mt-1">Select chats to forward this message to</p>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {chats.filter(chat => chat.id !== selectedChat?.id).map(chat => (
                <button
                  key={chat.id}
                  onClick={() => toggleChatForForward(chat.id)}
                  className={`w-full p-3 rounded-lg border-2 transition-all duration-200 flex items-center space-x-3 ${
                    selectedChatsForForward.includes(chat.id)
                      ? 'border-purple-600 bg-purple-50 shadow-md'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                    selectedChatsForForward.includes(chat.id)
                      ? 'border-purple-600 bg-purple-600'
                      : 'border-gray-300'
                  }`}>
                    {selectedChatsForForward.includes(chat.id) && (
                      <Check size={14} className="text-white" />
                    )}
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    {chat.other_user?.user_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-gray-900">{chat.other_user?.user_name}</p>
                    <p className="text-xs text-gray-500">{chat.other_user?.user_type}</p>
                  </div>
                </button>
              ))}
              
              {chats.filter(chat => chat.id !== selectedChat?.id).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No other chats available</p>
                  <p className="text-sm mt-1">Start a new conversation first</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t bg-gray-50">
              <div className="flex items-center justify-between space-x-3">
                <button
                  onClick={() => setShowForwardModal(false)}
                  className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleForwardConfirm}
                  disabled={selectedChatsForForward.length === 0}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                    selectedChatsForForward.length > 0
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Forward {selectedChatsForForward.length > 0 && `(${selectedChatsForForward.length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video/Audio Call Component */}
      {showVideoCall && selectedChat && (
        <VideoCall
          socket={socket}
          currentUser={currentUser}
          otherUser={isIncomingCall && incomingCallData ? {
            user_id: incomingCallData.from,
            user_type: incomingCallData.fromType,
            user_name: incomingCallData.fromName
          } : selectedChat.other_user}
          isIncoming={isIncomingCall}
          callType={callType}
          incomingOffer={incomingCallData?.offer}
          chatId={selectedChat.id}
          onCallStatusChange={handleCallStatusChange}
          onClose={() => {
            setShowVideoCall(false);
            setIsIncomingCall(false);
            setIncomingCallData(null);
          }}
        />
      )}

      {/* Global Chat Settings Modal (Centralized) */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[85vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Settings size={20} />
                <h2 className="text-lg font-semibold">App Settings</h2>
              </div>
              <button 
                onClick={() => setShowSettings(false)}
                className="p-1.5 hover:bg-blue-500 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(85vh-100px)]">
              {/* Notifications Section */}
              <div className="mb-5">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <Bell size={16} className="text-blue-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                </div>
                <div className="space-y-2 ml-8">
                  <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Sound</p>
                      <p className="text-xs text-gray-500">Play sound for new messages</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={chatSettings.notifications.sound}
                      onChange={(e) => setChatSettings({
                        ...chatSettings,
                        notifications: { ...chatSettings.notifications, sound: e.target.checked }
                      })}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Desktop Notifications</p>
                      <p className="text-xs text-gray-500">Show notifications on desktop</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={chatSettings.notifications.desktop}
                      onChange={(e) => setChatSettings({
                        ...chatSettings,
                        notifications: { ...chatSettings.notifications, desktop: e.target.checked }
                      })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Message Preview</p>
                      <p className="text-xs text-gray-500">Show message content in notifications</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={chatSettings.notifications.messagePreview}
                      onChange={(e) => setChatSettings({
                        ...chatSettings,
                        notifications: { ...chatSettings.notifications, messagePreview: e.target.checked }
                      })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>

              {/* Privacy Section */}
              <div className="mb-5">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="p-1.5 bg-purple-100 rounded-lg">
                    <Shield size={16} className="text-purple-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">Privacy & Security</h3>
                </div>
                <div className="space-y-2 ml-8">
                  <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Read Receipts</p>
                      <p className="text-xs text-gray-500">Let others know when you've read messages</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={chatSettings.privacy.readReceipts}
                      onChange={(e) => setChatSettings({
                        ...chatSettings,
                        privacy: { ...chatSettings.privacy, readReceipts: e.target.checked }
                      })}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Online Status</p>
                      <p className="text-xs text-gray-500">Show when you're online</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={chatSettings.privacy.onlineStatus}
                      onChange={(e) => setChatSettings({
                        ...chatSettings,
                        privacy: { ...chatSettings.privacy, onlineStatus: e.target.checked }
                      })}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Typing Indicator</p>
                      <p className="text-xs text-gray-500">Show when you're typing</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={chatSettings.privacy.typingIndicator}
                      onChange={(e) => setChatSettings({
                        ...chatSettings,
                        privacy: { ...chatSettings.privacy, typingIndicator: e.target.checked }
                      })}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Last Seen</p>
                      <p className="text-xs text-gray-500">Show your last activity time</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={chatSettings.privacy.lastSeen}
                      onChange={(e) => setChatSettings({
                        ...chatSettings,
                        privacy: { ...chatSettings.privacy, lastSeen: e.target.checked }
                      })}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                    />
                  </label>
                </div>
              </div>

              {/* Media Section */}
              <div className="mb-5">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="p-1.5 bg-green-100 rounded-lg">
                    <Image size={16} className="text-green-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">Media & Storage</h3>
                </div>
                <div className="space-y-2 ml-8">
                  <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Auto-Download Media</p>
                      <p className="text-xs text-gray-500">Automatically download images and videos</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={chatSettings.media.autoDownload}
                      onChange={(e) => setChatSettings({
                        ...chatSettings,
                        media: { ...chatSettings.media, autoDownload: e.target.checked }
                      })}
                      className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Auto-Play Videos</p>
                      <p className="text-xs text-gray-500">Play videos automatically when visible</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={chatSettings.media.autoPlay}
                      onChange={(e) => setChatSettings({
                        ...chatSettings,
                        media: { ...chatSettings.media, autoPlay: e.target.checked }
                      })}
                      className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                    />
                  </label>
                </div>
              </div>

              {/* Chat Preferences */}
              <div className="mb-5">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="p-1.5 bg-orange-100 rounded-lg">
                    <MessageCircle size={16} className="text-orange-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">Chat Preferences</h3>
                </div>
                <div className="space-y-2 ml-8">
                  <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Enter to Send</p>
                      <p className="text-xs text-gray-500">Press Enter to send, Shift+Enter for new line</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={chatSettings.chat.enterToSend}
                      onChange={(e) => setChatSettings({
                        ...chatSettings,
                        chat: { ...chatSettings.chat, enterToSend: e.target.checked }
                      })}
                      className="w-4 h-4 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
                    />
                  </label>
                  <div className="p-2 hover:bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900 mb-1.5">Font Size</p>
                    <select 
                      value={chatSettings.chat.fontSize}
                      onChange={(e) => setChatSettings({
                        ...chatSettings,
                        chat: { ...chatSettings.chat, fontSize: e.target.value }
                      })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                  <div className="p-2 hover:bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900 mb-1.5">Theme</p>
                    <select 
                      value={chatSettings.chat.theme}
                      onChange={(e) => setChatSettings({
                        ...chatSettings,
                        chat: { ...chatSettings.chat, theme: e.target.value }
                      })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t px-4 py-2.5 bg-gray-50 flex justify-end space-x-2">
              <button 
                onClick={() => setShowSettings(false)}
                className="px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded-lg transition-all font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  try {
                    // Save settings to backend
                    await chatApi.updateChatSettings(currentUser.userId, currentUser.userType, chatSettings);
                    setShowSettings(false);
                  } catch (error) {
                    console.error('Failed to save settings:', error);
                    alert('Failed to save settings. Please try again.');
                  }
                }}
                className="px-4 py-1.5 text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all font-medium shadow-lg"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Chat List Item Component
const ChatListItem = ({ chat, isSelected, onClick, isOnline }) => {
  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    
    if (diff < 86400000) { // Less than 24 hours
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diff < 604800000) { // Less than 7 days
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const isArchived = chat.is_archived || false;
  const isMuted = chat.is_muted || false;
  const isPinned = chat.is_pinned || false;

  return (
    <div
      onClick={onClick}
      className={`p-4 border-b cursor-pointer transition ${
        isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
      } ${isArchived ? 'opacity-60' : ''} ${isPinned ? 'bg-blue-50/30' : ''}`}
    >
      <div className="flex items-center space-x-3">
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {chat.other_user?.user_name?.charAt(0) || '?'}
          </div>
          {isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          )}
          {isArchived && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-500 rounded-full flex items-center justify-center">
              <Archive size={12} className="text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              {isPinned && (
                <PinIcon size={14} className="text-blue-600 flex-shrink-0" />
              )}
              <h4 className="font-semibold text-gray-900 truncate">
                {chat.other_user?.user_name}
              </h4>
              {isArchived && (
                <span className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded">Archived</span>
              )}
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
              {isMuted && (
                <BellOff size={14} className="text-gray-400" />
              )}
              <span className="text-xs text-gray-500">
                {formatTime(chat.last_message_at || chat.created_at)}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 truncate">
              {chat.last_message?.is_deleted
                ? 'Message deleted'
                : chat.last_message?.content || 'No messages yet'}
            </p>
            {!isMuted && chat.unread_count > 0 && (
              <span className="ml-2 px-2 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
                {chat.unread_count}
              </span>
            )}
            {isMuted && chat.unread_count > 0 && (
              <span className="ml-2 px-2 py-1 bg-gray-400 text-white text-xs font-bold rounded-full">
                {chat.unread_count}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Message Bubble Component
const MessageBubble = ({ message, isOwn, showAvatar, onReply, onDelete, onForward, onReact, onCallBack }) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const quickEmojis = ['❤️', '😂', '😮', '😢', '🙏', '👍'];

  const handleEmojiClick = (emoji) => {
    if (onReact) {
      onReact(emoji);
    }
    setShowEmojiPicker(false);
  };

  const getStatusIcon = () => {
    if (!isOwn) return null;
    
    const status = message.my_status?.status;
    if (status === 'read') {
      return <CheckCheck size={16} className="text-blue-500" />;
    } else if (status === 'delivered') {
      return <CheckCheck size={16} className="text-gray-400" />;
    } else {
      return <Check size={16} className="text-gray-400" />;
    }
  };

  if (message.is_deleted) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className="max-w-xs px-4 py-2 rounded-lg bg-gray-100 text-gray-500 italic text-sm">
          This message was deleted
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
      <div className={`max-w-md ${isOwn ? 'order-2' : 'order-1'} relative`}>
        {message.reply_to && (
          <div className="mb-1 px-3 py-2 bg-gray-100 rounded-t-lg text-xs border-l-4 border-blue-500">
            <p className="font-medium text-gray-700">{message.reply_to.sender_name}</p>
            <p className="text-gray-600 truncate">{message.reply_to.content}</p>
          </div>
        )}
        
        <div
          className={`rounded-lg ${
            isOwn
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-900 shadow'
          }`}
        >
          {/* Forwarded Message Indicator */}
          {message.is_forwarded && (
            <div className={`px-4 pt-2 pb-1 border-b ${isOwn ? 'border-blue-500' : 'border-gray-200'}`}>
              <div className="flex items-center space-x-1.5">
                <Forward size={12} className={isOwn ? 'text-blue-200' : 'text-gray-500'} />
                <span className={`text-xs font-medium italic ${isOwn ? 'text-blue-200' : 'text-gray-500'}`}>
                  Forwarded
                </span>
              </div>
            </div>
          )}

          {/* Image Message */}
          {message.message_type === 'image' && message.media_url && (
            <div className="relative group/image">
              <img
                src={`http://localhost:3001${message.media_url}`}
                alt={message.media_name}
                className="max-w-sm rounded-t-lg cursor-pointer hover:opacity-95 transition"
                onClick={() => window.open(`http://localhost:3001${message.media_url}`, '_blank')}
              />
              
              {/* Image Actions Overlay */}
              <div className="absolute top-2 right-2 opacity-0 group-hover/image:opacity-100 transition-opacity flex space-x-2">
                <button
                  onClick={() => window.open(`http://localhost:3001${message.media_url}`, '_blank')}
                  className="p-2 bg-gradient-to-br from-blue-500/80 to-cyan-500/80 hover:from-blue-600/90 hover:to-cyan-600/90 text-white rounded-full backdrop-blur-sm shadow-lg transition-all duration-200 transform hover:scale-110"
                  title="View Full Size"
                >
                  <Eye size={16} />
                </button>
                <a
                  href={`http://localhost:3001${message.media_url}`}
                  download={message.media_name}
                  className="p-2 bg-gradient-to-br from-emerald-500/80 to-teal-500/80 hover:from-emerald-600/90 hover:to-teal-600/90 text-white rounded-full backdrop-blur-sm shadow-lg transition-all duration-200 transform hover:scale-110"
                  title="Download"
                >
                  <Download size={16} />
                </a>
              </div>

              {/* Image Info */}
              <div className={`px-3 py-2 text-xs ${isOwn ? 'bg-blue-600' : 'bg-white'} rounded-b-lg border-t ${isOwn ? 'border-blue-500' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <FileImage size={14} className={isOwn ? 'text-blue-100' : 'text-gray-500'} />
                    <span className={`truncate ${isOwn ? 'text-blue-100' : 'text-gray-600'}`}>
                      {message.media_name || 'Image'}
                    </span>
                  </div>
                  <span className={`ml-2 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                    {message.media_size ? `${(message.media_size / 1024).toFixed(0)} KB` : ''}
                  </span>
                </div>
              </div>

              {message.content && message.content !== message.media_name && (
                <p className="px-4 py-2 whitespace-pre-wrap break-words">{message.content}</p>
              )}
            </div>
          )}

          {/* Voice Message */}
          {message.message_type === 'voice' && message.media_url && (
            <div className="px-4 py-3">
              <div className="flex items-center space-x-3 mb-2">
                <div className={`p-2.5 rounded-full shadow-md ${
                  isOwn 
                    ? 'bg-gradient-to-br from-blue-400 to-blue-600' 
                    : 'bg-gradient-to-br from-purple-400 to-purple-600'
                }`}>
                  <Mic size={18} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className={`text-xs font-semibold ${isOwn ? 'text-blue-100' : 'text-gray-700'}`}>
                    Voice Message
                  </p>
                </div>
                <a
                  href={`http://localhost:3001${message.media_url}`}
                  download={message.media_name || 'voice.webm'}
                  className={`p-1.5 rounded-full transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-110 ${
                    isOwn 
                      ? 'hover:bg-blue-500' 
                      : 'hover:bg-gradient-to-br hover:from-gray-200 hover:to-gray-300'
                  }`}
                  title="Download"
                >
                  <Download size={14} className={isOwn ? 'text-blue-100' : 'text-gray-600'} />
                </a>
              </div>
              <audio 
                controls 
                className="w-full"
                style={{ 
                  height: '36px',
                  filter: isOwn ? 'invert(1) hue-rotate(180deg)' : 'none'
                }}
              >
                <source src={`http://localhost:3001${message.media_url}`} type="audio/webm" />
                <source src={`http://localhost:3001${message.media_url}`} type="audio/mp3" />
                Your browser does not support audio playback.
              </audio>
            </div>
          )}

          {/* Video Message */}
          {message.media_type?.startsWith('video/') && message.media_url && (
            <div className="relative group/video">
              <video
                controls
                className="max-w-sm rounded-t-lg shadow-lg"
                style={{ maxHeight: '400px' }}
              >
                <source src={`http://localhost:3001${message.media_url}`} type={message.media_type} />
                Your browser does not support video playback.
              </video>

              {/* Video Actions Overlay */}
              <div className="absolute top-2 right-2 opacity-0 group-hover/video:opacity-100 transition-opacity flex space-x-1">
                <a
                  href={`http://localhost:3001${message.media_url}`}
                  download={message.media_name}
                  className="p-2 bg-gradient-to-br from-purple-500/80 to-pink-500/80 hover:from-purple-600/90 hover:to-pink-600/90 text-white rounded-full backdrop-blur-sm shadow-lg transition-all duration-200 transform hover:scale-110"
                  title="Download"
                >
                  <Download size={16} />
                </a>
              </div>

              {/* Video Info */}
              <div className={`px-3 py-2 text-xs ${isOwn ? 'bg-blue-600' : 'bg-white'} rounded-b-lg border-t ${isOwn ? 'border-blue-500' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <FileVideo size={14} className={isOwn ? 'text-blue-100' : 'text-gray-500'} />
                    <span className={`truncate ${isOwn ? 'text-blue-100' : 'text-gray-600'}`}>
                      {message.media_name || 'Video'}
                    </span>
                  </div>
                  <span className={`ml-2 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                    {message.media_size ? `${(message.media_size / (1024 * 1024)).toFixed(1)} MB` : ''}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Document Message */}
          {message.message_type === 'document' && message.media_url && (
            <div className={`px-4 py-3 ${isOwn ? 'bg-blue-600' : 'bg-white'}`}>
              <div className={`border rounded-lg p-3 ${isOwn ? 'border-blue-500 bg-blue-500' : 'border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100'}`}>
                <div className="flex items-start space-x-3">
                  {/* File Icon based on type */}
                  <div className={`p-3 rounded-lg flex-shrink-0 shadow-md ${
                    isOwn 
                      ? 'bg-gradient-to-br from-blue-400 to-blue-500' 
                      : message.media_name?.match(/\.(pdf)$/i)
                        ? 'bg-gradient-to-br from-red-400 to-rose-600'
                        : message.media_name?.match(/\.(doc|docx)$/i)
                          ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                          : message.media_name?.match(/\.(zip|rar)$/i)
                            ? 'bg-gradient-to-br from-amber-400 to-orange-600'
                            : 'bg-gradient-to-br from-gray-400 to-gray-600'
                  }`}>
                    {message.media_name?.match(/\.(pdf)$/i) ? (
                      <FileText size={24} className="text-white" />
                    ) : message.media_name?.match(/\.(doc|docx)$/i) ? (
                      <FileText size={24} className="text-white" />
                    ) : message.media_name?.match(/\.(zip|rar)$/i) ? (
                      <File size={24} className="text-white" />
                    ) : (
                      <File size={24} className="text-white" />
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm truncate ${isOwn ? 'text-white' : 'text-gray-900'}`}>
                      {message.media_name || 'Document'}
                    </p>
                    <p className={`text-xs mt-0.5 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                      {message.media_type?.split('/')[1]?.toUpperCase() || 'FILE'} • {message.media_size ? `${(message.media_size / 1024).toFixed(1)} KB` : 'Unknown size'}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 mt-3">
                      <a
                        href={`http://localhost:3001${message.media_url}`}
                        download={message.media_name}
                        className={`flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 ${
                          isOwn 
                            ? 'bg-white text-blue-600 hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100' 
                            : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
                        }`}
                      >
                        <Download size={12} />
                        <span>Download</span>
                      </a>
                      <a
                        href={`http://localhost:3001${message.media_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 ${
                          isOwn 
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700' 
                            : 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 hover:from-gray-300 hover:to-gray-400'
                        }`}
                      >
                        <ExternalLink size={12} />
                        <span>Open</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Location Message */}
          {message.message_type === 'location' && message.media_url && (
            <div className="px-4 py-3">
              <a
                href={message.media_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`block rounded-lg overflow-hidden border-2 transition-all duration-200 hover:shadow-lg ${
                  isOwn ? 'border-blue-400' : 'border-gray-200'
                }`}
              >
                <div className="bg-gradient-to-br from-green-400 to-emerald-600 p-4 flex items-center space-x-3">
                  <div className="p-3 bg-white rounded-full shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">📍 Location Shared</p>
                    <p className="text-white/90 text-sm">Tap to view on map</p>
                  </div>
                  <ExternalLink size={20} className="text-white" />
                </div>
              </a>
              {message.content && (
                <p className="mt-2 text-sm px-2">{message.content}</p>
              )}
            </div>
          )}

          {/* Call Message - Modern WhatsApp Style */}
          {message.message_type === 'call' && (() => {
            // Parse call data: format is "callType|direction|status|duration"
            const [callIcon, direction, status, duration] = (message.content || '').split('|');
            const isVideo = callIcon === 'video';
            const isIncoming = direction === 'incoming';
            const isMissed = status === 'missed';
            const isDeclined = status === 'declined';
            const isNotAnswered = status === 'not_answered';
            const isCompleted = status === 'completed';
            
            // WhatsApp-like color scheme
            const iconColor = isMissed ? 'text-red-500' : isDeclined || isNotAnswered ? 'text-gray-400' : 'text-green-500';
            const textColor = isMissed ? 'text-red-600' : isDeclined || isNotAnswered ? 'text-gray-600' : isOwn ? 'text-blue-100' : 'text-gray-700';
            const bgColor = isOwn ? 'bg-blue-50' : 'bg-white';
            
            // Format call text with call type
            const callType = isVideo ? 'Video call' : 'Audio call';
            let callText = '';
            let subText = '';
            
            if (isMissed) {
              callText = `Missed ${callType.toLowerCase()}`;
              subText = 'Tap to call back';
            } else if (isDeclined) {
              callText = `${callType} declined`;
              subText = 'Tap to call again';
            } else if (isNotAnswered) {
              callText = `${callType}`;
              subText = 'No answer';
            } else if (isCompleted) {
              callText = `${callType}`;
              subText = `Call time: ${duration}`;
            }
            
            return (
              <div 
                className={`px-3 py-2.5 ${bgColor} ${isOwn ? '' : 'border border-gray-100'} ${
                  (isMissed || isDeclined) && onCallBack ? 'cursor-pointer hover:bg-opacity-80 transition-all' : ''
                }`}
                onClick={(isMissed || isDeclined) && onCallBack ? () => onCallBack(isVideo ? 'video' : 'audio') : undefined}
              >
                <div className="flex items-center space-x-3">
                  {/* Call Icon */}
                  <div className="flex-shrink-0">
                    {isVideo ? (
                      <Video size={20} className={iconColor} strokeWidth={2.5} />
                    ) : (
                      <Phone size={20} className={iconColor} strokeWidth={2.5} />
                    )}
                  </div>
                  
                  {/* Call info text */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${textColor}`}>
                      {callText}
                    </p>
                    {subText && (
                      <p className={`text-xs mt-0.5 ${
                        isMissed || isDeclined 
                          ? isOwn ? 'text-blue-200' : 'text-gray-500' 
                          : isOwn ? 'text-blue-200' : 'text-gray-500'
                      }`}>
                        {subText}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Text Message with URL Preview */}
          {(message.message_type === 'text' || !message.message_type) && (
            <div className="px-4 py-2">
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
              
              {/* URL Preview */}
              {(() => {
                const urls = message.content.match(/(https?:\/\/[^\s]+)/g);
                if (urls && urls.length > 0) {
                  const urlPreview = (() => {
                    try {
                      const urlObj = new URL(urls[0]);
                      return {
                        url: urls[0],
                        domain: urlObj.hostname.replace('www.', ''),
                        favicon: `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`
                      };
                    } catch {
                      return null;
                    }
                  })();
                  
                  if (urlPreview) {
                    return (
                      <a
                        href={urlPreview.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`block mt-3 rounded-lg border-2 overflow-hidden transition-all duration-200 hover:shadow-lg ${
                          isOwn ? 'border-blue-400 bg-blue-500' : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className={`p-3 flex items-center space-x-3 ${isOwn ? '' : 'hover:bg-gray-100'}`}>
                          <img 
                            src={urlPreview.favicon} 
                            alt="" 
                            className="w-10 h-10 rounded-lg bg-white p-1 shadow-sm"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold truncate ${isOwn ? 'text-white' : 'text-gray-900'}`}>
                              {urlPreview.domain}
                            </p>
                            <p className={`text-xs truncate ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                              {urlPreview.url}
                            </p>
                          </div>
                          <ExternalLink size={16} className={isOwn ? 'text-blue-200' : 'text-gray-400'} />
                        </div>
                      </a>
                    );
                  }
                }
                return null;
              })()}
            </div>
          )}

          {/* File Message (generic) */}
          {message.message_type === 'file' && message.media_url && (
            <div className={`px-4 py-3 ${isOwn ? 'bg-blue-600' : 'bg-white'}`}>
              <div className={`border rounded-lg p-3 ${isOwn ? 'border-blue-500 bg-blue-500' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${isOwn ? 'bg-blue-400' : 'bg-gray-200'}`}>
                    <Paperclip size={20} className={isOwn ? 'text-white' : 'text-gray-600'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isOwn ? 'text-white' : 'text-gray-900'}`}>
                      {message.media_name || 'File'}
                    </p>
                    <p className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                      {message.media_size ? `${(message.media_size / 1024).toFixed(1)} KB` : 'Unknown size'}
                    </p>
                  </div>
                  <a
                    href={`http://localhost:3001${message.media_url}`}
                    download={message.media_name}
                    className={`p-2 rounded-lg transition ${
                      isOwn 
                        ? 'bg-white text-blue-600 hover:bg-blue-50' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                    title="Download"
                  >
                    <Download size={16} />
                  </a>
                </div>
              </div>
            </div>
          )}
          {/* Reactions - Attached to message corner */}
          {message.reactions && message.reactions.length > 0 && (
            <div className={`absolute -bottom-[-15px] flex flex-wrap gap-0.5 ${isOwn ? 'right-1' : 'right-1'}`}>
            {(() => {
              // Group reactions by emoji
              const reactionGroups = {};
              message.reactions.forEach(r => {
                if (!reactionGroups[r.reaction]) {
                  reactionGroups[r.reaction] = [];
                }
                reactionGroups[r.reaction].push(r);
              });
              
              return Object.entries(reactionGroups).map(([emoji, reactions]) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiClick(emoji)}
                  className="group relative bg-white hover:bg-gray-50 border border-gray-300 hover:border-blue-400 px-1.5 py-0.5 rounded-full transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-110"
                  title={`${reactions.length} reaction${reactions.length > 1 ? 's' : ''}`}
                >
                  <span className="flex items-center space-x-0.5">
                    <span className="text-sm leading-none">{emoji}</span>
                    {reactions.length > 1 && (
                      <span className="text-[10px] font-semibold text-gray-500 group-hover:text-blue-600">
                        {reactions.length}
                      </span>
                    )}
                  </span>
                </button>
              ));
            })()}
            </div>
          )}
        </div>
        
        {/* Timestamp and Status - Below message bubble */}
        <div className={`flex items-center space-x-1 px-1 ${isOwn ? 'justify-end' : 'justify-start'} ${message.reactions && message.reactions.length > 0 ? 'mt-3' : 'mt-1'}`}>
          <span className="text-xs text-gray-500">
            {formatTime(message.created_at)}
          </span>
          {getStatusIcon()}
        </div>
      </div>

      {/* Action Buttons */}
      <div className={`flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition ${
        isOwn ? 'order-1 mr-2' : 'order-2 ml-2'
      }`}>
        {/* Emoji Reaction Button */}
        <div className="relative">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 hover:bg-gradient-to-br hover:from-yellow-50 hover:to-amber-100 rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
            title="React"
          >
            <Smile size={16} className="text-amber-500 hover:scale-110 transition-transform" />
          </button>
          
          {/* Quick Emoji Picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-2xl border-2 border-gray-200 p-2 flex space-x-1 z-50">
              {quickEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiClick(emoji)}
                  className="text-2xl hover:scale-125 transition-transform p-1 hover:bg-gray-100 rounded"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reply Button - Bold and Modern */}
        <button
          onClick={onReply}
          className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-110"
          title="Reply"
        >
          <Reply size={16} className="font-bold" />
        </button>

        {/* 3-Dot Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gradient-to-br hover:from-gray-100 hover:to-gray-200 rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
            title="More"
          >
            <MoreVertical size={16} className="text-gray-600" />
          </button>
          
          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute bottom-full mb-2 right-0 bg-white rounded-xl shadow-2xl border-2 border-gray-200 py-2 min-w-[180px] z-50">
              <button
                onClick={() => {
                  onForward();
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2.5 text-left hover:bg-purple-50 transition flex items-center space-x-3 group"
              >
                <Forward size={16} className="text-purple-600 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-purple-600">Forward</span>
              </button>
              {isOwn && (
                <button
                  onClick={() => {
                    onDelete();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left hover:bg-red-50 transition flex items-center space-x-3 group border-t border-gray-100"
                >
                  <Trash2 size={16} className="text-red-500 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-red-600">Delete</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};



export default ChatTab;

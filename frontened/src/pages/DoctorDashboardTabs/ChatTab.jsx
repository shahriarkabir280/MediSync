import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Search, Plus, Send, Paperclip, Smile, MoreVertical,
  Phone, Video, ArrowLeft, ArrowRight, Check, CheckCheck, X, Reply, Trash2, Pin, BellOff, Archive,
  Mic, Image, File, StopCircle, Download, Share2, Save, FileText, FileImage, FileVideo, FileAudio,
  ExternalLink, Eye, MessageCircle, Forward, Settings, Info, Lock, Bell, Volume2, Monitor, Moon, Sun,
  Type, Zap, Shield, Users, Copy
} from 'lucide-react';
import { chatApi } from '../../lib/chatApi';
import { useChatSocket } from '../../hooks/useChatSocket';
import { useAuth } from '../../contexts/AuthContext';
import VideoCall from '../../components/VideoCall';
import { debounce } from '../../utils/performance';

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
  const [isSearchFocused, setIsSearchFocused] = useState(false);
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
  const searchInputRef = useRef(null);
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

  // Copy message to clipboard
  const handleCopyMessage = (message) => {
    if (!message || !message.content) return;

    navigator.clipboard.writeText(message.content)
      .then(() => {
        showToast('Message copied to clipboard', 'success');
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        showToast('Failed to copy message', 'error');
      });
  };

  const toggleChatForForward = (chatId) => {
    setSelectedChatsForForward(prev =>
      prev.includes(chatId)
        ? prev.filter(id => id !== chatId)
        : [...prev, chatId]
    );
  };

  // Debounced user search
  const debouncedSearchUsers = useMemo(
    () => debounce(async (query) => {
      if (!query.trim() && !isSearchFocused) {
        setSearchResults([]);
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
    }, 300),
    [currentUser.userId, currentUser.userType, isSearchFocused]
  );

  // Search users and chats
  const handleSearch = (query) => {
    setSearchQuery(query);

    // Filter local chats immediately
    // (This is handled by filteredChats useMemo)

    // Search for new users via API
    debouncedSearchUsers(query);
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
  const showSearchResults = isSearchFocused; // Always show search results when focused
  const showNoResults = searchQuery.trim().length >= 1 && searchResults.length === 0 && !isSearching;

  return (
    <div className="h-[calc(100vh-140px)] w-full min-w-0 flex bg-white rounded-3xl overflow-hidden overflow-x-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-500">
      {/* Left Sidebar - Chat List */}
      <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} w-full md:w-[320px] lg:w-[380px] flex-shrink-0 flex-col bg-slate-50/50 backdrop-blur-md border-r border-slate-100`}>
        {/* Modern Glassmorphism Header */}
        <div className="p-6 pb-4 bg-white/80 backdrop-blur-xl sticky top-0 z-20 border-b border-slate-100">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-700 to-indigo-500 bg-clip-text text-transparent font-outfit">
                Messages
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                {chats.length} active conversations
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setIsSearchFocused(true);
                  searchInputRef.current?.focus();
                  handleSearch('');
                }}
                className="p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition-all border border-indigo-200 shadow-sm group"
                title="New Message"
              >
                <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all border border-slate-200 shadow-sm group"
                title="Settings"
              >
                <Settings size={18} className="group-hover:rotate-45 transition-transform duration-500" />
              </button>
            </div>
          </div>

          {/* Floating Search Bar */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search chats or find doctors..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => {
                setIsSearchFocused(true);
                handleSearch(searchQuery);
              }}
              onBlur={() => {
                // Delay blur to allow clicking on results
                setTimeout(() => setIsSearchFocused(false), 200);
              }}
              className="block w-full pl-11 pr-10 py-3 bg-slate-100/50 border border-slate-200/60 rounded-2xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  handleSearch('');
                  searchInputRef.current?.focus();
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Chat List / Search Results */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 pt-4 space-y-1">
          {isSearching ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-4">
              <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin"></div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Searching records...</p>
            </div>
          ) : showSearchResults ? (
            <>
              <div className="px-3 py-2 flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {!searchQuery.trim() ? 'Suggested People' : 'Search Results'}
                </p>
                {isSearching && <div className="w-3 h-3 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>}
              </div>
              <div className="space-y-2">
                {searchResults.length === 0 && !isSearching && searchQuery.trim() && (
                  <div className="p-8 text-center">
                    <p className="text-sm font-medium text-slate-500">No people found matching "{searchQuery}"</p>
                  </div>
                )}
                {searchResults.length === 0 && !isSearching && !searchQuery.trim() && (
                  <div className="p-8 text-center">
                    <p className="text-sm font-medium text-slate-500">Find doctors and patients to start a conversation</p>
                  </div>
                )}
                {searchResults.map((user) => (
                  <div
                    key={`${user.user_id}_${user.user_type}`}
                    onClick={() => handleStartChat(user)}
                    className="group p-3 rounded-2xl border border-transparent hover:border-indigo-100 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 bg-gradient-to-br ${user.user_type === 'doctor'
                        ? 'from-indigo-100 to-indigo-200 text-indigo-700'
                        : 'from-emerald-100 to-emerald-200 text-emerald-700'
                        } rounded-2xl flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-300`}>
                        {user.user_name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 truncate text-sm">{user.user_name}</h4>
                        <div className="flex items-center mt-0.5">
                          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${user.user_type === 'doctor' ? 'bg-indigo-400' : 'bg-emerald-400'
                            }`}></span>
                          <span className="text-[11px] font-medium text-slate-500 tracking-wide">
                            {user.user_type === 'doctor' ? 'Healthcare Provider' : 'Patient'}
                            {user.specialization && ` • ${user.specialization}`}
                          </span>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all">
                        <Plus className="w-5 h-5 text-indigo-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : showNoResults ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <Search size={32} className="text-slate-200" />
              </div>
              <p className="text-lg font-bold text-slate-700 mb-2">No users found</p>
              <p className="text-sm font-medium leading-relaxed max-w-[200px]">We couldn't find anyone matching "{searchQuery}"</p>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                <MessageCircle size={32} className="text-indigo-200" />
              </div>
              <p className="text-lg font-bold text-slate-700 mb-2">Inbox is empty</p>
              <p className="text-sm font-medium leading-relaxed max-w-[200px]">Find and connect with doctors or patients to start chatting</p>
            </div>
          ) : (
            <div className="space-y-1">
              {searchQuery.trim().length > 0 && (
                <div className="px-3 py-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Conversations</p>
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
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Chat Window */}
      {selectedChat ? (
        <div className="flex-1 min-w-0 flex flex-col bg-gray-50">
          {/* Chat Header */}
          {/* Modern Chat Header */}
          <div className="bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSelectedChat(null)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeft size={20} />
              </button>

              <div className="relative group">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-100 transform group-hover:scale-105 transition-all duration-300">
                  {selectedChat.other_user?.user_name?.charAt(0) || '?'}
                </div>
                {socket.isUserOnline(selectedChat.other_user?.user_id, selectedChat.other_user?.user_type) && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-white shadow-sm"></div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-800 text-lg font-outfit leading-tight truncate">
                  {selectedChat.other_user?.user_name}
                </h3>
                <p className="text-xs flex items-center space-x-1 truncate">
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

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setCallType('audio');
                  setIsIncomingCall(false);
                  setShowVideoCall(true);
                }}
                className="p-2.5 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 rounded-xl transition-all duration-300 border border-transparent hover:border-emerald-100"
                title="Voice Call"
              >
                <Phone size={20} />
              </button>
              <button
                onClick={() => {
                  setCallType('video');
                  setIsIncomingCall(false);
                  setShowVideoCall(true);
                }}
                className="p-2.5 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-xl transition-all duration-300 border border-transparent hover:border-indigo-100"
                title="Video Call"
              >
                <Video size={20} />
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowChatInfo(!showChatInfo)}
                  className="p-2.5 hover:bg-slate-100 text-slate-600 rounded-xl transition-all duration-300 border border-transparent hover:border-slate-200"
                  title="Chat Info"
                >
                  <Info size={20} />
                </button>

                {showChatInfo && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowChatInfo(false)}
                    />
                    <div className="absolute right-0 top-14 w-72 bg-white rounded-3xl shadow-2xl border border-slate-100 py-3 z-50 animate-in fade-in slide-in-from-top-4 duration-300 overflow-hidden">
                      <div className="px-5 py-2 mb-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose">Conversation Controls</p>
                      </div>
                      <div className="px-2 space-y-1">
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
                          className="w-full px-4 py-3 text-left hover:bg-slate-50 rounded-2xl flex items-center justify-between text-sm font-bold transition-colors group"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-xl transition-colors ${perChatSettings.isMuted ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                              <BellOff size={18} />
                            </div>
                            <span className={perChatSettings.isMuted ? 'text-indigo-600' : 'text-slate-700'}>Mute Notifications</span>
                          </div>
                          {perChatSettings.isMuted && <Check size={16} className="text-indigo-600" />}
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
                          className="w-full px-4 py-3 text-left hover:bg-slate-50 rounded-2xl flex items-center justify-between text-sm font-bold transition-colors group"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-xl transition-colors ${perChatSettings.isPinned ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                              <Pin size={18} />
                            </div>
                            <span className={perChatSettings.isPinned ? 'text-indigo-600' : 'text-slate-700'}>Pin to Top</span>
                          </div>
                          {perChatSettings.isPinned && <Check size={16} className="text-indigo-600" />}
                        </button>

                        <button
                          onClick={handleArchiveChat}
                          className="w-full px-4 py-3 text-left hover:bg-slate-50 rounded-2xl flex items-center justify-between text-sm font-bold transition-colors group"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-xl transition-colors ${perChatSettings.isArchived ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                              <Archive size={18} />
                            </div>
                            <span className={perChatSettings.isArchived ? 'text-indigo-600' : 'text-slate-700'}>
                              {perChatSettings.isArchived ? 'Restore Chat' : 'Archive Chat'}
                            </span>
                          </div>
                        </button>

                        <div className="h-px bg-slate-100 my-2 mx-4"></div>

                        <button
                          onClick={handleClearChat}
                          className="w-full px-4 py-3 text-left hover:bg-rose-50 rounded-2xl flex items-center space-x-3 text-sm font-bold text-rose-600 transition-colors group"
                        >
                          <div className="p-2 bg-rose-100 rounded-xl group-hover:bg-rose-200 transition-colors">
                            <Trash2 size={18} />
                          </div>
                          <span>Clear Chat History</span>
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
                          className="w-full px-4 py-3 text-left hover:bg-rose-50 rounded-2xl flex items-center space-x-3 text-sm font-bold text-rose-600 transition-colors group"
                        >
                          <div className="p-2 bg-rose-100 rounded-xl group-hover:bg-rose-200 transition-colors">
                            <Lock size={18} />
                          </div>
                          <span>{perChatSettings.isBlocked ? 'Unblock User' : 'Block User'}</span>
                        </button>
                      </div>
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
          <div className="flex-1 overflow-y-auto p-6 space-y-2 bg-slate-50/30">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-2xl border-4 border-slate-100"></div>
                    <div className="absolute inset-0 rounded-2xl border-4 border-indigo-600 border-t-transparent animate-spin"></div>
                  </div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">Loading Messages</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full max-w-sm mx-auto text-center px-6">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-indigo-200 mb-6 transform hover:rotate-6 transition-transform duration-500">
                  <MessageCircle size={40} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">No messages yet</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  Send your first message to start the consultation with <span className="text-indigo-600 font-bold">{selectedChat.other_user?.user_name}</span>.
                </p>
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
                  onCopy={() => handleCopyMessage(message)}
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
              <div className="flex items-center space-x-3 px-6 py-4 animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="flex space-x-1 bg-white px-3 py-2 rounded-2xl shadow-sm border border-slate-100">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"></div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Someone is typing</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Reply Preview */}
          {replyTo && (
            <div className="px-6 py-4 bg-white/80 backdrop-blur-xl border-t border-slate-100 flex items-center justify-between animate-in slide-in-from-bottom-full duration-300">
              <div className="flex-1 pl-4 border-l-4 border-indigo-500 rounded-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-0.5">
                  Replying to <span className="font-outfit">{replyTo.sender_name}</span>
                </p>
                <p className="text-sm text-slate-600 font-medium truncate italic px-1">"{replyTo.content}"</p>
              </div>
              <button
                onClick={() => setReplyTo(null)}
                className="ml-4 p-2.5 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all duration-300 group"
                title="Cancel Reply"
              >
                <X size={18} className="group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>
          )}

          {/* Message Input */}
          <div className="bg-white border-t border-slate-100 px-6 py-5">
            {isRecording ? (
              // Recording UI
              <div className="flex items-center space-x-4 p-2 bg-rose-50 rounded-2xl border border-rose-100/50 animate-in zoom-in-95 duration-300">
                <div className="flex-1 flex items-center space-x-4 px-4">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-rose-400 rounded-full animate-ping opacity-25"></div>
                    <div className="w-3 h-3 bg-rose-600 rounded-full shadow-lg z-10"></div>
                  </div>
                  <span className="text-sm font-bold text-rose-600 font-outfit">
                    {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                  </span>
                  <div className="flex-1 flex items-center space-x-1 h-6">
                    {[...Array(24)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-rose-400/40 rounded-full animate-pulse"
                        style={{
                          height: `${Math.random() * 80 + 20}%`,
                          animationDelay: `${i * 0.05}s`
                        }}
                      ></div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={cancelRecording}
                  className="p-3 hover:bg-white rounded-xl text-slate-400 hover:text-rose-600 transition-all shadow-sm"
                  title="Cancel Recording"
                >
                  <X size={20} />
                </button>
                <button
                  onClick={stopRecording}
                  className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all transform hover:scale-105 active:scale-95"
                  title="Send Recording"
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
                    className={`p-3 rounded-2xl transition-all duration-300 border ${showAttachMenu ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-inner' : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
                    disabled={uploadingFile}
                  >
                    <Paperclip size={20} className={showAttachMenu ? 'rotate-45 transition-transform' : ''} />
                  </button>

                  {showAttachMenu && (
                    <div className="absolute bottom-full mb-4 left-0 w-64 bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-slate-100 p-3 space-y-1.5 animate-in slide-in-from-bottom-4 zoom-in-95 duration-300 z-50">
                      <div className="px-5 py-3 mb-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Share content</p>
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center space-x-4 px-5 py-3.5 hover:bg-slate-50 rounded-3xl text-left transition-all duration-300 group"
                      >
                        <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl shadow-lg shadow-indigo-100 group-hover:scale-110 group-hover:rotate-6 transition-all">
                          <Image size={18} className="text-white" />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-slate-800">Media</span>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">Photos & GIFs</p>
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
                        className="w-full flex items-center space-x-4 px-5 py-3.5 hover:bg-slate-50 rounded-3xl text-left transition-all duration-300 group"
                      >
                        <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl shadow-lg shadow-emerald-100 group-hover:scale-110 group-hover:-rotate-6 transition-all">
                          <FileText size={18} className="text-white" />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-slate-800">Files</span>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">PDF, DOC, ZIP</p>
                        </div>
                      </button>
                      <button
                        onClick={handleShareLocation}
                        className="w-full flex items-center space-x-4 px-5 py-3.5 hover:bg-slate-50 rounded-3xl text-left transition-all duration-300 group border-t border-slate-50 mt-1"
                      >
                        <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg shadow-amber-100 group-hover:scale-110 transition-all">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                          </svg>
                        </div>
                        <div>
                          <span className="text-sm font-bold text-slate-800">Location</span>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">Google Maps</p>
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

                <div className="flex-1 relative group">
                  <input
                    type="text"
                    ref={messageInputRef}
                    placeholder={uploadingFile ? "Uploading..." : "Type a message..."}
                    value={messageInput}
                    onChange={(e) => {
                      setMessageInput(e.target.value);
                      handleTyping();
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !uploadingFile) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={uploadingFile}
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white px-6 py-3.5 rounded-2xl text-sm font-medium outline-none transition-all placeholder:text-slate-400"
                  />
                </div>

                {messageInput.trim() || uploadingFile ? (
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || uploadingFile}
                    className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
                  >
                    <Send size={20} />
                  </button>
                ) : (
                  <button
                    onClick={startRecording}
                    className="p-4 bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl transition-all transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-indigo-100"
                    title="Voice Message"
                  >
                    <Mic size={20} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-slate-50/50 backdrop-blur-sm">
          <div className="text-center max-w-sm px-6">
            <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 rounded-[3rem] mx-auto flex items-center justify-center shadow-2xl shadow-indigo-100 mb-8 transform hover:scale-105 hover:rotate-3 transition-all duration-500 group">
              <MessageCircle size={56} className="text-white group-hover:scale-110 transition-transform" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-3 font-outfit">Select a conversation</h2>
            <p className="text-slate-500 font-medium leading-relaxed">
              Choose one of your patient chats from the list to start messaging and manage their care plan.
            </p>
          </div>
        </div>
      )}

      {/* Delete Message Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="px-8 py-6 bg-gradient-to-r from-rose-500 to-rose-600 text-white relative">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
                  <Trash2 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black font-outfit">Delete message?</h3>
                  <p className="text-rose-100 text-[10px] font-bold uppercase tracking-widest mt-0.5">This action is permanent</p>
                </div>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-4 bg-white">
              <p className="text-slate-500 font-medium text-center px-4">
                Choose how you would like to proceed with deleting this message.
              </p>

              <div className="space-y-3">
                {/* Delete for Me Option */}
                <button
                  onClick={() => confirmDelete(false)}
                  className="w-full p-5 bg-slate-50 hover:bg-slate-100 border-2 border-transparent hover:border-slate-200 rounded-3xl transition-all duration-300 group flex items-start space-x-4"
                >
                  <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                    <Trash2 size={20} className="text-slate-400 group-hover:text-slate-600" />
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="font-bold text-slate-800 text-sm">Delete for Me</h4>
                    <p className="text-[11px] text-slate-500 font-medium mt-1">This message will be hidden from your view only.</p>
                  </div>
                </button>

                {/* Delete for Everyone Option */}
                {canDeleteForEveryone ? (
                  <button
                    onClick={() => confirmDelete(true)}
                    className="w-full p-5 bg-rose-50 hover:bg-rose-100 border-2 border-transparent hover:border-rose-200 rounded-3xl transition-all duration-300 group flex items-start space-x-4"
                  >
                    <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                      <Trash2 size={20} className="text-rose-500" />
                    </div>
                    <div className="text-left flex-1">
                      <h4 className="font-bold text-rose-600 text-sm">Delete for Everyone</h4>
                      <p className="text-[11px] text-rose-400 font-medium mt-1">Permanently remove this message from all participants.</p>
                    </div>
                  </button>
                ) : (
                  <div className="w-full p-5 bg-slate-50 opacity-60 rounded-3xl flex items-start space-x-4 border border-dashed border-slate-200">
                    <div className="p-3 bg-white rounded-2xl">
                      <Trash2 size={20} className="text-slate-300" />
                    </div>
                    <div className="text-left flex-1">
                      <h4 className="font-bold text-slate-400 text-sm italic">Delete for Everyone</h4>
                      <p className="text-[11px] text-slate-400 font-medium mt-1">Only available within 1 hour of sending.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-6 bg-slate-50 flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-6 py-3.5 bg-white text-slate-600 font-bold text-sm rounded-2xl hover:bg-slate-100 border border-slate-200 transition-all active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Chat Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8">
              <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 transform -rotate-3">
                <Trash2 size={36} className="text-rose-500" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 text-center font-outfit mb-2">Clear all messages?</h3>
              <p className="text-slate-500 font-medium text-center text-sm leading-relaxed px-2">
                This will permanently delete the entire conversation history. This action <span className="text-rose-500 font-bold underline underline-offset-4 decoration-2">cannot be undone</span>.
              </p>
            </div>

            <div className="px-8 pb-8 flex flex-col space-y-3">
              <button
                onClick={confirmClearChat}
                className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl shadow-xl shadow-rose-100 transition-all transform active:scale-95 text-sm"
              >
                Yes, Clear Chat
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="w-full py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-2xl transition-all active:scale-95 text-sm"
              >
                No, Keep My Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forward Message Modal */}
      {showForwardModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="px-8 py-6 bg-gradient-to-r from-indigo-500 to-indigo-700 text-white relative">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
                  <ArrowRight size={24} className="rotate-[-45deg]" />
                </div>
                <div>
                  <h3 className="text-xl font-black font-outfit">Forward to...</h3>
                  <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mt-0.5">Select recipients</p>
                </div>
              </div>
              <button
                onClick={() => setShowForwardModal(false)}
                className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-2 bg-slate-50/50">
              {chats.filter(chat => chat.id !== selectedChat?.id).map(chat => (
                <button
                  key={chat.id}
                  onClick={() => toggleChatForForward(chat.id)}
                  className={`w-full p-4 rounded-3xl border-2 transition-all duration-300 flex items-center space-x-4 group ${selectedChatsForForward.includes(chat.id)
                    ? 'border-indigo-500 bg-indigo-50/50 shadow-md'
                    : 'border-transparent bg-white hover:bg-white hover:shadow-lg hover:shadow-slate-100'
                    }`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${selectedChatsForForward.includes(chat.id)
                    ? 'border-indigo-600 bg-indigo-600 scale-110'
                    : 'border-slate-200 bg-white group-hover:border-indigo-300'
                    }`}>
                    {selectedChatsForForward.includes(chat.id) && (
                      <Check size={14} className="text-white" strokeWidth={3} />
                    )}
                  </div>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-105 transition-transform ${selectedChatsForForward.includes(chat.id)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-50 text-indigo-600'
                    }`}>
                    {chat.other_user?.user_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-slate-800">{chat.other_user?.user_name}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
                      {chat.other_user?.user_type}
                    </p>
                  </div>
                </button>
              ))}

              {chats.filter(chat => chat.id !== selectedChat?.id).length === 0 && (
                <div className="text-center py-12 px-6">
                  <div className="w-16 h-16 bg-slate-100 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4">
                    <MessageCircle size={32} className="text-slate-300" />
                  </div>
                  <p className="text-slate-400 font-bold text-sm">No other active chats found</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-6 bg-white border-t border-slate-100 flex items-center justify-between space-x-4">
              <button
                onClick={() => setShowForwardModal(false)}
                className="flex-1 px-6 py-3.5 text-slate-500 font-bold text-sm rounded-2xl hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleForwardConfirm}
                disabled={selectedChatsForForward.length === 0}
                className={`flex-[1.5] px-6 py-3.5 rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all transform active:scale-95 shadow-xl ${selectedChatsForForward.length > 0
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                  }`}
              >
                <span>Forward</span>
                {selectedChatsForForward.length > 0 && (
                  <span className="bg-white/20 px-2 py-0.5 rounded-lg text-[10px]">
                    {selectedChatsForForward.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video/Audio Call Component */}
      {
        showVideoCall && selectedChat && (
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
        )
      }

      {/* Global Chat Settings Modal (Centralized) */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-xl w-full max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 text-white px-8 py-6 flex items-center justify-between relative">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
                  <Settings size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black font-outfit uppercase tracking-wider">Preferences</h2>
                  <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mt-0.5">Customize your experience</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-white/20 rounded-xl transition-all"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/30">
              {/* Notifications Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3 mb-2 px-2">
                  <div className="p-2 bg-indigo-100 rounded-xl">
                    <Bell size={18} className="text-indigo-600" />
                  </div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Notifications</h3>
                </div>
                <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 space-y-1">
                  {[
                    { key: 'sound', label: 'Sound', desc: 'Play sound for new messages', icon: '🔔' },
                    { key: 'desktop', label: 'Desktop Notifications', desc: 'Show notifications on desktop', icon: '💻' },
                    { key: 'messagePreview', label: 'Message Preview', desc: 'Show message content in notifications', icon: '👁️' }
                  ].map((item) => (
                    <label key={item.key} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl cursor-pointer transition-colors group">
                      <div className="flex items-center space-x-4">
                        <span className="text-xl grayscale group-hover:grayscale-0 transition-all">{item.icon}</span>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{item.label}</p>
                          <p className="text-[11px] text-slate-400 font-medium">{item.desc}</p>
                        </div>
                      </div>
                      <div className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={chatSettings.notifications[item.key]}
                          onChange={(e) => setChatSettings({
                            ...chatSettings,
                            notifications: { ...chatSettings.notifications, [item.key]: e.target.checked }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Privacy Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3 mb-2 px-2">
                  <div className="p-2 bg-emerald-100 rounded-xl">
                    <Shield size={18} className="text-emerald-600" />
                  </div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Privacy & Security</h3>
                </div>
                <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 space-y-1">
                  {[
                    { key: 'readReceipts', label: 'Read Receipts', desc: 'Let others know when you\'ve read messages', icon: '📖' },
                    { key: 'onlineStatus', label: 'Online Status', desc: 'Show when you\'re online', icon: '🟢' },
                    { key: 'typingIndicator', label: 'Typing Indicator', desc: 'Show when you\'re typing', icon: '✍️' },
                    { key: 'lastSeen', label: 'Last Seen', desc: 'Show your last activity time', icon: '🕒' }
                  ].map((item) => (
                    <label key={item.key} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl cursor-pointer transition-colors group">
                      <div className="flex items-center space-x-4">
                        <span className="text-xl grayscale group-hover:grayscale-0 transition-all">{item.icon}</span>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{item.label}</p>
                          <p className="text-[11px] text-slate-400 font-medium">{item.desc}</p>
                        </div>
                      </div>
                      <div className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={chatSettings.privacy[item.key]}
                          onChange={(e) => setChatSettings({
                            ...chatSettings,
                            privacy: { ...chatSettings.privacy, [item.key]: e.target.checked }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Chat Preferences */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3 mb-2 px-2">
                  <div className="p-2 bg-amber-100 rounded-xl">
                    <MessageCircle size={18} className="text-amber-600" />
                  </div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Chat Preferences</h3>
                </div>
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center space-x-4">
                      <span className="text-xl grayscale group-hover:grayscale-0 transition-all">⌨️</span>
                      <div>
                        <p className="text-sm font-bold text-slate-800">Enter to Send</p>
                        <p className="text-[11px] text-slate-400 font-medium">Shift + Enter for new line</p>
                      </div>
                    </div>
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={chatSettings.chat.enterToSend}
                        onChange={(e) => setChatSettings({
                          ...chatSettings,
                          chat: { ...chatSettings.chat, enterToSend: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </div>
                  </label>

                  <div className="flex flex-col space-y-4 border-t border-slate-50 pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="text-xl grayscale hover:grayscale-0 transition-all">🖋️</span>
                        <p className="text-sm font-bold text-slate-800">Font Size</p>
                      </div>
                      <div className="flex bg-slate-100 p-1 rounded-xl">
                        {['small', 'medium', 'large'].map((size) => (
                          <button
                            key={size}
                            onClick={() => setChatSettings({ ...chatSettings, chat: { ...chatSettings.chat, fontSize: size } })}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${chatSettings.chat.fontSize === size
                              ? 'bg-white text-indigo-600 shadow-sm'
                              : 'text-slate-400 hover:text-slate-600'
                              }`}
                          >
                            {size.charAt(0).toUpperCase() + size.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                      <div className="flex items-center space-x-4">
                        <span className="text-xl grayscale hover:grayscale-0 transition-all">🎨</span>
                        <p className="text-sm font-bold text-slate-800">Theme</p>
                      </div>
                      <div className="flex bg-slate-100 p-1 rounded-xl">
                        {['light', 'dark', 'auto'].map((t) => (
                          <button
                            key={t}
                            onClick={() => setChatSettings({ ...chatSettings, chat: { ...chatSettings.chat, theme: t } })}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${chatSettings.chat.theme === t
                              ? 'bg-white text-indigo-600 shadow-sm'
                              : 'text-slate-400 hover:text-slate-600'
                              }`}
                          >
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-6 bg-white border-t border-slate-100 flex justify-end space-x-3">
              <button
                onClick={() => setShowSettings(false)}
                className="px-6 py-3 text-sm text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await chatApi.updateChatSettings(currentUser.userId, currentUser.userType, chatSettings);
                    setShowSettings(false);
                  } catch (error) {
                    console.error('Failed to save settings:', error);
                    alert('Failed to save settings. Please try again.');
                  }
                }}
                className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all transform active:scale-95 text-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Chat List Item Component
// Modern Chat List Item
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
      className={`relative group p-4 rounded-3xl border transition-all duration-500 cursor-pointer mb-3
        ${isSelected
          ? 'bg-white border-indigo-100 shadow-2xl shadow-indigo-500/10 scale-[1.02] z-10 translate-x-1'
          : 'bg-transparent border-transparent hover:bg-white hover:border-slate-100 hover:shadow-xl hover:shadow-slate-500/5 hover:translate-x-1'
        } ${isArchived ? 'opacity-60' : ''}`}
    >
      {isSelected && (
        <div className="absolute left-0 top-4 bottom-4 w-1 bg-indigo-500 rounded-r-full shadow-[0_0_12px_rgba(79,70,229,0.5)]"></div>
      )}
      <div className="flex items-center space-x-4">
        <div className="relative flex-shrink-0">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shadow-sm transform transition-transform group-hover:scale-105 duration-300
            ${isSelected
              ? 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white'
              : 'bg-indigo-50 text-indigo-600'
            }`}>
            {chat.other_user?.user_name?.charAt(0) || '?'}
          </div>
          {isOnline && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-white shadow-sm"></div>
          )}
          {isPinned && (
            <div className="absolute -top-1 -left-1 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg transform -rotate-12">
              <Pin size={10} className="text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <h4 className={`font-bold truncate text-[15px] tracking-tight ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
              {chat.other_user?.user_name}
            </h4>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`}>
              {formatTime(chat.last_message_at || chat.created_at)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <p className={`text-sm truncate font-medium flex-1 ${isSelected ? 'text-indigo-600/80' : 'text-slate-500'}`}>
              {chat.last_message?.is_deleted
                ? 'Message was deleted'
                : chat.last_message?.content || 'Click to start chatting'}
            </p>
            <div className="flex items-center space-x-2 ml-3">
              {isMuted && (
                <BellOff size={14} className="text-slate-300" />
              )}
              {chat.unread_count > 0 && (
                <span className={`min-w-[20px] h-5 px-1.5 flex items-center justify-center text-[10px] font-black rounded-full shadow-lg shadow-indigo-200
                  ${isMuted ? 'bg-slate-300 text-white' : 'bg-indigo-600 text-white pulse'}`}>
                  {chat.unread_count}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Message Bubble Component
const MessageBubble = ({ message, isOwn, showAvatar, onReply, onDelete, onForward, onCopy, onReact, onCallBack }) => {
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
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 px-4`}>
        <div className="max-w-[85%] md:max-w-[66.6%] px-4 py-2 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 italic text-sm">
          Message was deleted
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group mb-4 px-4 animate-in fade-in slide-in-from-${isOwn ? 'right-4' : 'left-4'} duration-500 ease-out fill-mode-both`}>
      <div className={`max-w-[85%] md:max-w-[66.6%] ${isOwn ? 'order-2' : 'order-1'} relative`}>
        {message.reply_to && (
          <div className="mb-px px-4 py-2 bg-slate-50/80 backdrop-blur-sm rounded-t-2xl text-xs border-l-2 border-indigo-500 shadow-sm mx-1">
            <p className="font-bold text-indigo-600 mb-0.5">{message.reply_to.sender_name}</p>
            <p className="text-slate-500 truncate">{message.reply_to.content}</p>
          </div>
        )}

        <div
          className={`relative rounded-2xl shadow-sm transition-all duration-300 ${isOwn
            ? 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 text-white rounded-tr-none shadow-indigo-200'
            : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none hover:border-slate-200'
            } ${message.reply_to ? 'rounded-t-none' : ''}`}
        >
          {/* Forwarded Message Indicator */}
          {message.is_forwarded && (
            <div className={`px-4 pt-2.5 pb-1 ${isOwn ? 'bg-white/10' : 'bg-slate-50'} rounded-t-2xl`}>
              <div className="flex items-center space-x-2">
                <Forward size={14} className={isOwn ? 'text-indigo-200' : 'text-slate-400'} />
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isOwn ? 'text-indigo-200' : 'text-slate-400'}`}>
                  Forwarded Message
                </span>
              </div>
            </div>
          )}

          {/* Image Message */}
          {message.message_type === 'image' && message.media_url && (
            <div className="relative group/image overflow-hidden rounded-2xl">
              <div className="relative">
                <img
                  src={`http://localhost:3001${message.media_url}`}
                  alt={message.media_name}
                  className="max-w-sm rounded-t-2xl cursor-pointer hover:scale-[1.02] transition-transform duration-500 ease-out"
                  onClick={() => window.open(`http://localhost:3001${message.media_url}`, '_blank')}
                />
                <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-colors duration-300 pointer-events-none"></div>
              </div>

              {/* Image Actions Overlay */}
              <div className="absolute top-3 right-3 opacity-0 group-hover/image:opacity-100 transition-all duration-300 translate-y-[-10px] group-hover/image:translate-y-0 flex space-x-2">
                <button
                  onClick={() => window.open(`http://localhost:3001${message.media_url}`, '_blank')}
                  className="p-2.5 bg-white/20 hover:bg-white/40 text-white rounded-xl backdrop-blur-md shadow-xl transition-all duration-200 border border-white/30"
                  title="View Full Size"
                >
                  <Eye size={18} />
                </button>
                <a
                  href={`http://localhost:3001${message.media_url}`}
                  download={message.media_name}
                  className="p-2.5 bg-indigo-500/80 hover:bg-indigo-600/90 text-white rounded-xl backdrop-blur-md shadow-xl transition-all duration-200 border border-indigo-400/30"
                  title="Download"
                >
                  <Download size={18} />
                </a>
              </div>

              {/* Image Info */}
              <div className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider ${isOwn ? 'bg-indigo-700/50' : 'bg-slate-50'} border-t ${isOwn ? 'border-indigo-400/20' : 'border-slate-100'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <FileImage size={14} className={isOwn ? 'text-indigo-200' : 'text-slate-400'} />
                    <span className={`truncate ${isOwn ? 'text-indigo-100' : 'text-slate-600'}`}>
                      {message.media_name || 'Image Attachment'}
                    </span>
                  </div>
                  <span className={`ml-3 ${isOwn ? 'text-indigo-300' : 'text-slate-400'}`}>
                    {message.media_size ? `${(message.media_size / 1024).toFixed(0)} KB` : ''}
                  </span>
                </div>
              </div>

              {message.content && message.content !== message.media_name && (
                <p className="px-5 py-3 text-sm font-medium leading-relaxed whitespace-pre-wrap break-words border-t border-white/10">{message.content}</p>
              )}
            </div>
          )}

          {/* Voice Message */}
          {message.message_type === 'voice' && message.media_url && (
            <div className="px-5 py-4">
              <div className="flex items-center space-x-4 mb-3">
                <div className={`p-3 rounded-2xl shadow-lg transform group-hover:rotate-12 transition-transform duration-300 ${isOwn
                  ? 'bg-white text-indigo-600'
                  : 'bg-indigo-600 text-white'
                  }`}>
                  <Mic size={20} />
                </div>
                <div className="flex-1">
                  <p className={`text-[10px] font-black uppercase tracking-widest ${isOwn ? 'text-indigo-200' : 'text-slate-400'}`}>
                    Voice Message
                  </p>
                  <p className={`text-xs font-bold mt-0.5 ${isOwn ? 'text-white' : 'text-slate-700'}`}>
                    0:12
                  </p>
                </div>
                <a
                  href={`http://localhost:3001${message.media_url}`}
                  download={message.media_name || 'voice.webm'}
                  className={`p-2 rounded-xl transition-all duration-300 ${isOwn
                    ? 'hover:bg-white/20 text-indigo-100'
                    : 'hover:bg-slate-100 text-slate-400 hover:text-indigo-600'
                    }`}
                  title="Download Voice Note"
                >
                  <Download size={16} />
                </a>
              </div>
              <audio
                controls
                className="w-full"
                style={{
                  height: '32px',
                  borderRadius: '12px',
                  filter: isOwn ? 'invert(1) hue-rotate(180deg) brightness(1.5)' : 'none'
                }}
              >
                <source src={`http://localhost:3001${message.media_url}`} type="audio/webm" />
                <source src={`http://localhost:3001${message.media_url}`} type="audio/mp3" />
              </audio>
            </div>
          )}

          {/* Video Message */}
          {message.media_type?.startsWith('video/') && message.media_url && (
            <div className="relative group/video overflow-hidden rounded-2xl">
              <video
                controls
                className="max-w-sm rounded-t-2xl shadow-xl hover:scale-[1.01] transition-transform duration-500 ease-out"
                style={{ maxHeight: '400px' }}
              >
                <source src={`http://localhost:3001${message.media_url}`} type={message.media_type} />
              </video>

              {/* Video Actions Overlay */}
              <div className="absolute top-3 right-3 opacity-0 group-hover/video:opacity-100 transition-all duration-300 translate-y-[-10px] group-hover/video:translate-y-0 flex space-x-2">
                <a
                  href={`http://localhost:3001${message.media_url}`}
                  download={message.media_name}
                  className="p-2.5 bg-white/20 hover:bg-white/40 text-white rounded-xl backdrop-blur-md shadow-xl transition-all duration-200 border border-white/30"
                  title="Download Video"
                >
                  <Download size={18} />
                </a>
              </div>

              {/* Video Info */}
              <div className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider ${isOwn ? 'bg-indigo-700/50' : 'bg-slate-50'} border-t ${isOwn ? 'border-indigo-400/20' : 'border-slate-100'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <FileVideo size={14} className={isOwn ? 'text-indigo-200' : 'text-slate-400'} />
                    <span className={`truncate ${isOwn ? 'text-indigo-100' : 'text-slate-600'}`}>
                      {message.media_name || 'Video Attachment'}
                    </span>
                  </div>
                  <span className={`ml-3 ${isOwn ? 'text-indigo-300' : 'text-slate-400'}`}>
                    {message.media_size ? `${(message.media_size / (1024 * 1024)).toFixed(1)} MB` : ''}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Document Message */}
          {message.message_type === 'document' && message.media_url && (
            <div className="px-5 py-4">
              <div className={`rounded-2xl p-4 transition-all duration-300 border ${isOwn ? 'bg-white/10 border-indigo-400/30' : 'bg-slate-50 border-slate-100 group-hover:bg-indigo-50/50 group-hover:border-indigo-100'}`}>
                <div className="flex items-start space-x-4">
                  {/* Modern File Icon Container */}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg transform group-hover:scale-105 transition-transform duration-300 ${isOwn
                    ? 'bg-white text-indigo-600'
                    : message.media_name?.match(/\.(pdf)$/i)
                      ? 'bg-gradient-to-br from-rose-500 to-rose-600 text-white'
                      : message.media_name?.match(/\.(doc|docx)$/i)
                        ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white'
                        : message.media_name?.match(/\.(zip|rar)$/i)
                          ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white'
                          : 'bg-gradient-to-br from-slate-500 to-slate-600 text-white'
                    }`}>
                    {message.media_name?.match(/\.(pdf)$/i) ? (
                      <FileText size={28} />
                    ) : message.media_name?.match(/\.(doc|docx)$/i) ? (
                      <FileText size={28} />
                    ) : (
                      <File size={28} />
                    )}
                  </div>

                  {/* File Meta */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm truncate leading-snug ${isOwn ? 'text-white' : 'text-slate-800'}`}>
                      {message.media_name || 'Attached File'}
                    </p>
                    <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${isOwn ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {message.media_type?.split('/')[1]?.toUpperCase() || 'FILE'} • {message.media_size ? `${(message.media_size / 1024).toFixed(1)} KB` : '---'}
                    </p>

                    <div className="flex items-center space-x-3 mt-4">
                      <a
                        href={`http://localhost:3001${message.media_url}`}
                        download={message.media_name}
                        className={`flex items-center space-x-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 shadow-sm hover:shadow-lg transform hover:scale-[1.05] ${isOwn
                          ? 'bg-white text-indigo-600 hover:bg-slate-50'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                      >
                        <Download size={14} />
                        <span>Download</span>
                      </a>
                      <a
                        href={`http://localhost:3001${message.media_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center space-x-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 shadow-sm hover:shadow-lg transform hover:scale-[1.05] ${isOwn
                          ? 'bg-indigo-400/20 text-white hover:bg-indigo-400/30'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                      >
                        <ExternalLink size={14} />
                        <span>Open Preview</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Location Message */}
          {message.message_type === 'location' && message.media_url && (
            <div className="px-5 py-4">
              <a
                href={message.media_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group/loc block rounded-2xl overflow-hidden border-2 transition-all duration-300 hover:shadow-xl ${isOwn ? 'border-indigo-400/30' : 'border-slate-100'}`}
              >
                <div className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 p-5 flex items-center space-x-4">
                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shadow-lg border border-white/30 transform group-hover/loc:scale-110 transition-transform duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-bold text-base">Location Shared</p>
                    <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mt-0.5">Tap to view on Google Maps</p>
                  </div>
                  <div className="p-2 bg-white/10 rounded-xl">
                    <ExternalLink size={18} className="text-white" />
                  </div>
                </div>
              </a>
              {message.content && (
                <p className={`mt-3 text-sm font-medium px-1 leading-relaxed ${isOwn ? 'text-white/90' : 'text-slate-600'}`}>{message.content}</p>
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
            const isError = isMissed || isDeclined || isNotAnswered;
            const isCompleted = status === 'completed';

            // WhatsApp-like color scheme
            const iconColor = isMissed ? 'text-rose-500' : isDeclined || isNotAnswered ? 'text-slate-400' : 'text-emerald-500';
            const textColor = isMissed ? 'text-rose-600' : isDeclined || isNotAnswered ? 'text-slate-500' : isOwn ? 'text-white' : 'text-slate-800';
            const cardBg = isOwn ? 'bg-white/10 border-indigo-400/20' : 'bg-slate-50 border-slate-100';

            // Format call text with call type
            const callType = isVideo ? 'Video Call' : 'Audio Call';
            let callText = '';
            let subText = '';

            if (isMissed) {
              callText = `Missed ${callType}`;
              subText = 'Tap to call back';
            } else if (isDeclined) {
              callText = `${callType} declined`;
              subText = 'Tap to try again';
            } else if (isNotAnswered) {
              callText = `${callType}`;
              subText = 'No answer';
            } else if (isCompleted) {
              callText = `${callType}`;
              subText = `Duration: ${duration}`;
            }

            return (
              <div
                className={`px-5 py-4 rounded-2xl border transition-all duration-300 ${cardBg} ${(isMissed || isDeclined) && onCallBack ? 'cursor-pointer hover:shadow-lg transform hover:scale-[1.02]' : ''}`}
                onClick={(isMissed || isDeclined) && onCallBack ? () => onCallBack(isVideo ? 'video' : 'audio') : undefined}
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-xl shadow-sm ${isOwn ? 'bg-white/20' : 'bg-white border border-slate-100'}`}>
                    {isVideo ? (
                      <Video size={20} className={isOwn ? 'text-white' : iconColor} strokeWidth={2.5} />
                    ) : (
                      <Phone size={20} className={isOwn ? 'text-white' : iconColor} strokeWidth={2.5} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${textColor}`}>
                      {callText}
                    </p>
                    {subText && (
                      <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${isOwn ? 'text-indigo-200' : 'text-slate-400'}`}>
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
                        className={`block mt-4 rounded-2xl border transition-all duration-300 hover:shadow-xl ${isOwn ? 'bg-white/10 border-indigo-400/30 font-bold' : 'bg-slate-50 border-slate-100 hover:bg-white hover:border-slate-200'}`}
                      >
                        <div className="px-4 py-3 flex items-center space-x-3">
                          <div className={`p-2 rounded-xl flex-shrink-0 ${isOwn ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                            <img
                              src={urlPreview.favicon}
                              alt=""
                              className="w-6 h-6 rounded"
                              onError={(e) => { e.target.src = 'https://www.google.com/s2/favicons?domain=google.com'; }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[10px] font-black uppercase tracking-widest truncate ${isOwn ? 'text-indigo-200' : 'text-slate-400'}`}>
                              {urlPreview.domain}
                            </p>
                          </div>
                          <ExternalLink size={14} className={isOwn ? 'text-indigo-200' : 'text-slate-400'} />
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
            <div className="px-5 py-4">
              <div className={`rounded-2xl p-4 transition-all duration-300 border ${isOwn ? 'bg-white/10 border-indigo-400/30' : 'bg-slate-50 border-slate-100 group-hover:bg-indigo-50/50 group-hover:border-indigo-100'}`}>
                <div className="flex items-center space-x-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg transform group-hover:scale-105 transition-transform duration-300 ${isOwn
                    ? 'bg-white text-indigo-600'
                    : 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white'
                    }`}>
                    <File size={28} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm truncate leading-snug ${isOwn ? 'text-white' : 'text-slate-800'}`}>
                      {message.media_name || 'Attached File'}
                    </p>
                    <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${isOwn ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {message.media_type?.split('/')[1]?.toUpperCase() || 'FILE'} • {message.media_size ? `${(message.media_size / 1024).toFixed(1)} KB` : '---'}
                    </p>
                    <div className="flex items-center space-x-3 mt-4">
                      <a
                        href={`http://localhost:3001${message.media_url}`}
                        download={message.media_name}
                        className={`flex items-center space-x-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 shadow-sm hover:shadow-lg transform hover:scale-[1.05] ${isOwn
                          ? 'bg-white text-indigo-600 hover:bg-slate-50'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                      >
                        <Download size={14} />
                        <span>Download</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Reactions - Attached to message corner */}
          {message.reactions && message.reactions.length > 0 && (
            <div className={`absolute -bottom-2 flex flex-wrap gap-1 ${isOwn ? 'right-4' : 'left-4'} z-10`}>
              {(() => {
                const reactionGroups = {};
                message.reactions.forEach(r => {
                  if (!reactionGroups[r.reaction]) reactionGroups[r.reaction] = [];
                  reactionGroups[r.reaction].push(r);
                });

                return Object.entries(reactionGroups).map(([emoji, reactions]) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiClick(emoji)}
                    className="bg-white/90 backdrop-blur-md border border-slate-100 hover:border-indigo-300 px-2 py-0.5 rounded-full transition-all duration-300 shadow-sm hover:shadow-md flex items-center space-x-1 group/reac"
                  >
                    <span className="text-xs leading-none">{emoji}</span>
                    {reactions.length > 1 && (
                      <span className="text-[10px] font-black text-slate-500 group-hover/reac:text-indigo-600">
                        {reactions.length}
                      </span>
                    )}
                  </button>
                ));
              })()}
            </div>
          )}
        </div >

        {/* Message Actions - Modern, floating buttons on hover */}
        <div className={`absolute top-0 flex items-center h-full transition-all duration-300 z-50 ${isOwn
          ? 'right-full mr-2 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0'
          : 'left-full ml-2 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0'
          }`}>
          <div className="flex flex-col space-y-1.5">
            {/* Quick Reaction Button */}
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 bg-white border border-slate-100 hover:border-indigo-300 text-slate-400 hover:text-indigo-600 rounded-xl shadow-sm transition-all transform hover:scale-110"
                title="React"
              >
                <Smile size={16} />
              </button>

              {showEmojiPicker && (
                <div className={`absolute bottom-full mb-3 flex items-center space-x-1 bg-white/90 backdrop-blur-xl p-1.5 rounded-2xl shadow-2xl border border-white/50 z-[60] animate-in fade-in zoom-in slide-in-from-bottom-2 duration-300 ${isOwn ? 'right-0' : 'left-0'}`}>
                  {quickEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiClick(emoji)}
                      className="w-10 h-10 flex items-center justify-center text-xl hover:bg-slate-50 hover:scale-125 transition-all rounded-xl"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Reply Button */}
            <button
              onClick={() => onReply(message)}
              className="p-2 bg-white border border-slate-100 hover:border-indigo-300 text-slate-400 hover:text-indigo-600 rounded-xl shadow-sm transition-all transform hover:scale-110"
              title="Reply"
            >
              <Reply size={16} />
            </button>

            {/* More Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className={`p-2 bg-white border border-slate-100 hover:border-indigo-300 text-slate-400 hover:text-indigo-600 rounded-xl shadow-sm transition-all transform hover:scale-110 ${showMenu ? 'bg-slate-50 border-indigo-300' : ''}`}
                title="More Options"
              >
                <MoreVertical size={16} />
              </button>

              {showMenu && (
                <div className={`absolute top-0 py-2 w-48 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100 z-[60] animate-in fade-in zoom-in-95 duration-200 ${isOwn ? 'right-full mr-3' : 'left-full ml-3'}`}>
                  <button
                    onClick={() => { onForward(); setShowMenu(false); }}
                    className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center space-x-3 group/item transition-colors"
                  >
                    <div className="p-1.5 bg-slate-100 group-hover/item:bg-indigo-100 group-hover/item:text-indigo-600 rounded-lg text-slate-500 transition-colors">
                      <Forward size={14} />
                    </div>
                    <span className="text-sm font-bold text-slate-700 group-hover/item:text-indigo-600 transition-colors">Forward</span>
                  </button>
                  <button
                    onClick={() => { onCopy(); setShowMenu(false); }}
                    className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center space-x-3 group/item transition-colors"
                  >
                    <div className="p-1.5 bg-slate-100 group-hover/item:bg-indigo-100 group-hover/item:text-indigo-600 rounded-lg text-slate-500 transition-colors">
                      <Copy size={14} />
                    </div>
                    <span className="text-sm font-bold text-slate-700 group-hover/item:text-indigo-600 transition-colors">Copy Message</span>
                  </button>
                  {isOwn && (
                    <button
                      onClick={() => { onDelete(); setShowMenu(false); }}
                      className="w-full px-4 py-2.5 text-left hover:bg-rose-50 flex items-center space-x-3 group/item transition-colors border-t border-slate-50 mt-1"
                    >
                      <div className="p-1.5 bg-rose-100 group-hover/item:bg-rose-200 text-rose-600 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </div>
                      <span className="text-sm font-bold text-slate-700 group-hover/item:text-rose-600 transition-colors">Delete</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Timestamp and Status - Below message bubble */}
        <div className={`flex items-center space-x-1 px-1 ${isOwn ? 'justify-end' : 'justify-start'} ${message.reactions && message.reactions.length > 0 ? 'mt-3' : 'mt-1'}`}>
          <span className="text-[10px] text-gray-500 font-bold opacity-70">
            {formatTime(message.created_at)}
          </span>
          {getStatusIcon()}
        </div>
      </div>
    </div>
  );
};



export default ChatTab;
